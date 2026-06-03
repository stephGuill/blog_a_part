// ============================================================
// blogsController.js
// Contrôleur Express : gestion des blogs (CRUD + accès membres).
//
// Rôle :
//   Gère la lecture publique des blogs, la lecture protégée par membership,
//   la création et la mise à jour de blogs. Journalise les créations.
//
// Architecture Express :
//   req (Request)  : objet entrant — params URL, body JSON, req.user
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// req.user : injecté par le middleware d'authentification (protect())
//   → req.user.id   : id de l'utilisateur connecté (propriétaire du blog)
//   → Peut être null pour les routes publiques
//
// slugify : bibliothèque qui transforme un texte en slug URL-safe
//   → Ex: "Mon Super Blog !" → "mon-super-blog"
//
// Codes HTTP :
//   200 OK          : lecture réussie
//   201 Created     : blog créé avec succès
//   204 No Content  : modification/suppression réussie
//   400 Bad Request : données manquantes ou invalides
//   403 Forbidden   : accès refusé (blog privé sans membership)
//   404 Not Found   : blog introuvable
//   409 Conflict    : slug déjà utilisé (contrainte SQL UNIQUE)
//   500 Server Err  : erreur SQL ou système inattendue
//
// Exports : add, browse, destroy, edit, read
// ============================================================

// slugify : transforme un nom en slug URL-friendly (minuscules, sans espaces, sans accents)
const slugify = require("slugify");

// Importation de tous les managers BDD (blog, blogMembers, users, themes, auditLogs)
const models = require("../models");

// hasGlobalAdminAccess : fonction utilitaire qui vérifie si un utilisateur est admin global
// → Retourne true si req.user.globalRole === "admin" ou req.user.role === "admin"
const { hasGlobalAdminAccess } = require("../utils/permissions");

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/blogs ou GET /api/blogs?scope=mine
 * Retourne la liste des blogs selon le scope demandé.
 *
 * req.query.scope : paramètre GET optionnel
 *   → "mine"  : blogs accessibles par l'utilisateur connecté
 *   → absent  : blogs publics (accessibles sans connexion)
 *
 * Logique :
 *   - scope=mine + non connecté → tableau vide (Promise.resolve([[]])))
 *   - scope=mine + admin        → tous les blogs
 *   - scope=mine + user         → blogs dont l'utilisateur est membre
 *   - pas de scope              → blogs publics uniquement
 * ---------------------------------------------------------------- */
const browse = (req, res) => {
  // IIFE (Immediately Invoked Function Expression) : sélectionne la bonne requête
  const query = (() => {
    if (req.query.scope === "mine") {
      // Scope "mine" : blogs de l'utilisateur connecté
      if (!req.user) {
        // Utilisateur non connecté → on retourne une liste vide immédiatement
        return Promise.resolve([[]]); // Promise.resolve() = Promise déjà résolue
      }
      // Admin global → peut voir TOUS les blogs (y compris privés)
      // Utilisateur normal → seulement les blogs où il est membre
      return hasGlobalAdminAccess(req.user) ? models.blog.findAll() : models.blog.findAccessibleByUser(req.user.id);
    }

    // Pas de scope → retourne seulement les blogs marqués is_public = true
    return models.blog.findPublic();
  })(); // () à la fin : on exécute immédiatement la fonction fléchée

  // Exécution de la requête choisie et envoi de la réponse
  query
    .then(([rows]) => res.send(rows)) // HTTP 200 OK avec la liste des blogs
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL côté serveur
      res.sendStatus(500); // HTTP 500 Internal Server Error
    });
};

/* ----------------------------------------------------------------
 * read(req, res)
 * Route : GET /api/blogs/:id
 * Retourne un blog par son identifiant avec contrôle d'accès.
 *
 * req.params.id : id du blog dans le segment :id de l'URL
 *
 * Logique d'accès :
 *   1. Blog introuvable → 404
 *   2. Blog public OU admin global → accès direct
 *   3. Blog privé + non connecté → 403
 *   4. Blog privé + connecté → vérifie le membership actif
 *      → Pas membre actif → 403
 *      → Membre actif → accès accordé
 * ---------------------------------------------------------------- */
const read = async (req, res) => {
  try {
    // Requête pour trouver le blog par son id
    const [rows] = await models.blog.find(req.params.id);
    const blog = rows[0]; // Premier (et seul) résultat SQL

    // Étape 1 : blog introuvable → HTTP 404 Not Found
    if (!blog) {
      return res.sendStatus(404);
    }

    // Étape 2 : blog public ou admin global → accès sans restriction
    // hasGlobalAdminAccess() vérifie si req.user a un rôle admin
    if (blog.is_public || hasGlobalAdminAccess(req.user)) {
      return res.send(blog); // HTTP 200 OK avec les données du blog
    }

    // Étape 3 : blog privé et utilisateur non connecté → accès refusé
    if (!req.user) {
      // HTTP 403 Forbidden : le blog est privé, connexion requise
      return res.status(403).json({ status: "error", message: "Ce blog est prive." });
    }

    // Étape 4 : blog privé + utilisateur connecté → vérifier le membership
    // findActiveByUserAndBlog() → SELECT * FROM blog_members WHERE user_id=? AND blog_id=? AND status='active'
    const [memberRows] = await models.blogMembers.findActiveByUserAndBlog(req.user.id, blog.id);
    if (!memberRows[0]) {
      // Utilisateur connecté mais pas membre actif de ce blog → HTTP 403
      return res.status(403).json({ status: "error", message: "Acces reserve aux personnes invitees." });
    }

    // Membership actif confirmé → accès accordé
    return res.send(blog); // HTTP 200 OK
  } catch (err) {
    console.error(err); // Log de l'erreur SQL ou système
    return res.sendStatus(500); // HTTP 500 Internal Server Error
  }
};

/* ----------------------------------------------------------------
 * edit(req, res)
 * Route : PUT /api/blogs/:id
 * Met à jour un blog existant (mise à jour partielle supportée).
 *
 * req.params.id : id du blog à modifier dans l'URL
 * req.body      : corps JSON avec les champs à modifier
 *   → Mise à jour partielle : on fusionne l'existant avec le body
 *   → Ex: envoyer { name: "Nouveau nom" } ne modifie QUE le nom
 *
 * is_public : conversion forcée en Boolean
 *   → Boolean() : convertit "1", "true" → true / "0", "false" → false
 *   → Object.prototype.hasOwnProperty() : vérifie si le champ est présent dans le body
 *
 * err.code === "ER_DUP_ENTRY" : erreur MySQL pour contrainte UNIQUE (slug déjà pris)
 * ---------------------------------------------------------------- */
const edit = async (req, res) => {
  // parseInt() : convertit le segment :id de l'URL (string) en entier
  const blogId = parseInt(req.params.id, 10);

  try {
    // On lit l'état actuel du blog avant la mise à jour
    const [rows] = await models.blog.find(blogId);
    const existingBlog = rows[0]; // Données actuelles du blog en base

    // Si le blog n'existe pas → HTTP 404 Not Found
    if (!existingBlog) {
      return res.sendStatus(404);
    }

    // FR: On fusionne l'existant avec le body pour autoriser les updates partielles.
    // EN: Merge existing data with the body so partial updates do not erase fields.
    // L'opérateur spread (...) fusionne : existingBlog + req.body (req.body écrase existingBlog)
    const blog = {
      ...existingBlog,      // Données actuelles (base de départ)
      ...req.body,          // Nouvelles données du body (écrasent les champs correspondants)
      id: blogId,           // On force l'id correct (évite qu'il soit modifié par le body)
      // is_public : si fourni dans le body → on le convertit en Boolean
      // Sinon → on conserve la valeur existante (convertie en Boolean pour cohérence)
      is_public: Object.prototype.hasOwnProperty.call(req.body, "is_public")
        ? Boolean(req.body.is_public)       // Fourni dans le body → convertir
        : Boolean(existingBlog.is_public)   // Non fourni → conserver l'existant
    };

    // UPDATE blogs SET name=?, slug=?, is_public=? WHERE id=?
    const [result] = await models.blog.update(blog);
    if (result.affectedRows === 0) {
      // Aucune ligne modifiée → HTTP 404
      return res.sendStatus(404);
    }

    // On relit le blog mis à jour pour retourner les données fraîches
    const [updatedRows] = await models.blog.find(blogId);
    return res.status(200).json(updatedRows[0]); // HTTP 200 OK avec le blog mis à jour
  } catch (err) {
    console.error(err); // Log de l'erreur SQL
    if (err.code === "ER_DUP_ENTRY") {
      // Erreur MySQL : contrainte UNIQUE violée (le slug existe déjà)
      return res.status(409).json({
        status: "error",
        message: "Ce slug est deja utilise par un autre blog."
      });
    }
    return res.sendStatus(500); // Autre erreur SQL → 500 Internal Server Error
  }
};

/* ----------------------------------------------------------------
 * add(req, res)
 * Route : POST /api/blogs
 * Crée un nouveau blog, attribue l'ownership et journalise la création.
 *
 * req.body : corps JSON contenant les données du blog à créer
 *   → name       : nom du blog (obligatoire)
 *   → slug       : slug URL (généré depuis name si absent)
 *   → description: description (optionnel)
 *   → is_public  : visibilité publique (Boolean)
 *   → status     : statut ("active" par défaut)
 *   → theme_id   : id du thème (facultatif, un thème par défaut est sélectionné)
 *
 * req.user.id : id de l'utilisateur connecté qui crée le blog (owner)
 *
 * slugify() : génère un slug à partir du nom
 *   → Options { lower: true, strict: true } : minuscules + suppression des caractères spéciaux
 *
 * Étapes de création :
 *   1. Validation des champs obligatoires (name, slug)
 *   2. Vérification que l'owner existe en base
 *   3. Sélection d'un thème par défaut si non fourni
 *   4. Vérification que le thème existe
 *   5. INSERT du blog
 *   6. Ajout de l'owner comme membre du blog
 *   7. Création d'un audit log
 *   8. Retour du blog créé
 *
 * err.code === "ER_DUP_ENTRY" : slug déjà pris → HTTP 409 Conflict
 * ---------------------------------------------------------------- */
const add = async (req, res) => {
  // Nettoyage des entrées : trim() supprime les espaces en début/fin
  const cleanName = req.body.name?.trim(); // req.body.name?.trim() : opérateur ?. = safe si null
  const cleanSlug = req.body.slug?.trim();

  // Génération du slug depuis le slug fourni OU le nom du blog
  // { lower: true } : tout en minuscules ; { strict: true } : supprime caractères spéciaux
  const generatedSlug = slugify(cleanSlug || cleanName || "", { lower: true, strict: true });

  // Construction de l'objet blog à insérer
  const blog = {
    ...req.body,                                 // Tous les champs du body
    owner_id: req.user.id,                       // L'utilisateur connecté devient le propriétaire
    name: cleanName,                             // Nom nettoyé des espaces
    slug: generatedSlug,                         // Slug généré automatiquement
    description: req.body.description?.trim() || "", // Description nettoyée (vide si absente)
    is_public: Boolean(req.body.is_public),      // Conversion en Boolean (ex: "true" → true)
    status: req.body.status || "active"          // Statut par défaut : "active"
  };

  try {
    // Étape 1 : validation des champs obligatoires
    if (!blog.name || !blog.slug) {
      // HTTP 400 Bad Request : nom du blog manquant
      return res.status(400).json({ status: "error", message: "Le nom du blog est obligatoire." });
    }

    // Étape 2 : vérification que l'owner (req.user.id) existe en base
    const [ownerRows] = await models.users.find(blog.owner_id);
    if (!ownerRows[0]) {
      // HTTP 400 : l'utilisateur connecté n'existe pas en base (cas rare)
      return res.status(400).json({ status: "error", message: "Owner not found" });
    }

    // Étape 3 : si aucun thème fourni, on sélectionne le thème par défaut
    if (!blog.theme_id) {
      const [themeRows] = await models.themes.findAll();
      // On cherche un thème de type "blog" en priorité, sinon le premier thème disponible
      blog.theme_id = themeRows.find((theme) => theme.type === "blog")?.id || themeRows[0]?.id;
    }

    // Étape 4 : vérification que le thème sélectionné existe bien
    const [themeRows] = await models.themes.find(blog.theme_id);
    if (!themeRows[0]) {
      // HTTP 400 : thème introuvable en base
      return res.status(400).json({ status: "error", message: "Theme not found" });
    }

    // Étape 5 : insertion du blog en base de données
    // INSERT INTO blogs (name, slug, owner_id, ...) VALUES (...)
    const [result] = await models.blog.insert(blog);

    // Étape 6 : ajout automatique du créateur comme membre "owner" du blog
    // Cela permet que req.user.id apparaisse dans blog_members avec role="owner"
    await models.blogMembers.upsert({
      blog_id: result.insertId, // Id du blog nouvellement créé
      user_id: req.user.id,     // Le créateur devient membre propriétaire
      role: "owner",            // Rôle maximal : propriétaire du blog
      status: "active"          // Statut actif immédiatement
    });

    // Étape 7 : journalisation de la création dans l'audit log
    await models.auditLogs.insert({
      actor_user_id: req.user.id,                    // Qui a créé le blog
      target_type: "blog",                           // Type de ressource créée
      target_id: result.insertId,                    // Id du nouveau blog
      action: "blog:create",                         // Nom de l'action pour la traçabilité
      metadata_json: { slug: blog.slug, name: blog.name } // Contexte de la création
    });

    // Étape 8 : on relit le blog créé pour retourner ses données complètes
    const [createdRows] = await models.blog.find(result.insertId);
    // Header Location : URL de la ressource créée
    // HTTP 201 Created : convention REST pour une création réussie
    return res.location(`/blogs/${result.insertId}`).status(201).json(createdRows[0]);
  } catch (err) {
    console.error(err); // Log de l'erreur SQL ou système
    if (err.code === "ER_DUP_ENTRY") {
      // Erreur MySQL : contrainte UNIQUE violée → le slug existe déjà
      return res.status(409).json({
        status: "error",
        message: "Ce slug est deja utilise par un autre blog."
      });
    }
    return res.sendStatus(500); // Autre erreur SQL → 500 Internal Server Error
  }
};

/* ----------------------------------------------------------------
 * destroy(req, res)
 * Route : DELETE /api/blogs/:id
 * Supprime un blog par son identifiant.
 *
 * req.params.id : id du blog à supprimer (extrait du segment :id de l'URL)
 * result.affectedRows === 0 : aucune ligne supprimée → blog inexistant → HTTP 404
 * HTTP 204 No Content : suppression réussie sans corps de réponse
 * ---------------------------------------------------------------- */
const destroy = (req, res) => {
  // delete() → DELETE FROM blogs WHERE id = ?
  models.blog
    .delete(req.params.id) // Paramètre SQL sécurisé (prévient l'injection SQL)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne supprimée → le blog n'existe pas → HTTP 404 Not Found
        res.sendStatus(404);
      } else {
        // Suppression réussie → HTTP 204 No Content
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

// Exportation des fonctions pour le router (backend/src/routes/blogs.js)
module.exports = {
  add,     // POST   /blogs      → crée un nouveau blog
  browse,  // GET    /blogs      → liste les blogs (scope selon paramètre query)
  destroy, // DELETE /blogs/:id  → supprime un blog
  edit,    // PUT    /blogs/:id  → modifie un blog (partiel supporté)
  read     // GET    /blogs/:id  → retourne un blog avec contrôle d'accès
};
