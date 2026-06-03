// ============================================================
// postsController.js
// Contrôleur Express : gestion des articles (posts) du blog.
//
// Rôle :
//   Gère les opérations CRUD sur les posts. Applique une normalisation
//   du payload avant toute insertion/modification. Filtre les résultats
//   selon le rôle de l'utilisateur connecté (public, admin, membre).
//
// Architecture Express :
//   req (Request)  : objet entrant — params URL, body JSON, req.user
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// req.user : injecté par le middleware d'authentification (protect())
//   → req.user.id         : id de l'utilisateur connecté
//   → req.user.role       : rôle de l'utilisateur ("editor", "admin"…)
//   → req.user.globalRole : rôle global ("admin" ou autre)
//   → null si l'utilisateur n'est PAS connecté (route publique)
//
// Statuts de post valides (POST_STATUSES) :
//   "draft"     : brouillon, non visible publiquement
//   "pending"   : en attente de validation par un modérateur
//   "published" : publié et visible par tous
//   "archived"  : archivé, non visible mais conservé
//
// Codes HTTP :
//   200 OK          : lecture réussie (implicite via res.send())
//   201 Created     : post créé avec succès
//   204 No Content  : modification/suppression réussie
//   404 Not Found   : post introuvable
//   500 Server Err  : erreur SQL ou système inattendue
//
// Exports : add, browse, destroy, edit, read
// ============================================================

// Importation de l'objet models (centralise tous les managers BDD)
// models.posts expose : findAll(), findPublishedPublic(), findAccessibleByUser(),
//                       find(id), update(), insert(), delete()
const models = require("../models");

// Liste blanche des statuts valides pour un post
// Utilisée dans normalizePostPayload() pour valider/corriger le statut envoyé
const POST_STATUSES = ["draft", "pending", "published", "archived"];

/* ----------------------------------------------------------------
 * normalizePostPayload(payload, user)
 * Fonction utilitaire locale : normalise et enrichit le payload avant INSERT/UPDATE.
 *
 * payload : données brutes du body envoyé par le client
 * user    : utilisateur connecté (req.user) — peut être null pour un post anonyme
 *
 * Règles appliquées :
 *   1. Si le statut n'est pas dans POST_STATUSES, on force "draft" par sécurité
 *   2. Un éditeur (role "editor") ne peut pas choisir l'auteur : on force son propre id
 *   3. published_at est défini à maintenant si le statut devient "published"
 *      → null sinon (post non publié = pas de date de publication)
 * ---------------------------------------------------------------- */
const normalizePostPayload = (payload, user) => {
  // On valide le statut : s'il n'est pas dans la liste, on utilise "draft" par défaut
  const status = POST_STATUSES.includes(payload.status) ? payload.status : "draft";

  return {
    ...payload, // On conserve tous les champs originaux du payload

    // author_id : un éditeur ne peut poster qu'en son nom ; les admins/owners peuvent choisir
    // Si l'utilisateur est éditeur OU si aucun author_id n'est fourni → on utilise l'id connecté
    author_id: user?.role === "editor" || !payload.author_id ? user.id : payload.author_id,

    // published_at : seulement défini si le statut est "published"
    // Si post publié → on utilise la date fournie ou la date actuelle
    // Si non publié → null (pas de date de publication)
    published_at: status === "published" ? payload.published_at || new Date() : null,

    status // Statut validé et normalisé
  };
};

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/posts
 * Retourne la liste des posts filtrée selon le rôle de l'utilisateur.
 *
 * Logique de scope :
 *   - Pas d'utilisateur connecté (req.user null) → posts publiés publics uniquement
 *   - Admin global (req.user.globalRole === "admin") → tous les posts
 *   - Utilisateur connecté non-admin → posts accessibles via ses blogs membres
 *
 * query ternaire : sélectionne la bonne méthode de requête selon le contexte
 * .then([rows])  : destructure le résultat MySQL [[rows], fields]
 * res.send(rows) : envoie la liste JSON avec HTTP 200 implicite
 * ---------------------------------------------------------------- */
const browse = (req, res) => {
  // Sélection de la requête SQL selon le contexte utilisateur
  const query =
    !req.user
      // Cas 1 : pas d'utilisateur connecté → seulement les posts publiés sur des blogs publics
      ? models.posts.findPublishedPublic()
      : req.user?.globalRole === "admin"
      // Cas 2 : admin global → tous les posts sans restriction
      ? models.posts.findAll()
      // Cas 3 : utilisateur connecté non-admin → posts de ses blogs membres
      : models.posts.findAccessibleByUser(req.user.id); // req.user.id = id de l'utilisateur

  // Exécution de la requête choisie et envoi de la réponse
  query
    .then(([rows]) => res.send(rows)) // HTTP 200 OK avec la liste des posts
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL côté serveur
      res.sendStatus(500); // HTTP 500 Internal Server Error
    });
};

/* ----------------------------------------------------------------
 * read(req, res)
 * Route : GET /api/posts/:id
 * Retourne un post unique par son identifiant.
 *
 * req.params.id : valeur du segment :id dans l'URL
 *   → Ex: GET /posts/12 → req.params.id = "12"
 * rows[0] == null : aucun post trouvé → HTTP 404 Not Found
 * ---------------------------------------------------------------- */
const read = (req, res) => {
  // find(id) → SELECT * FROM posts WHERE id = ? LIMIT 1
  models.posts
    .find(req.params.id) // req.params.id = segment :id de l'URL (string)
    .then(([rows]) => {
      if (rows[0] == null) {
        // Aucun résultat → le post n'existe pas → HTTP 404 Not Found
        res.sendStatus(404);
      } else {
        // Post trouvé → retourne l'objet complet
        res.send(rows[0]); // HTTP 200 OK avec l'objet post
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

/* ----------------------------------------------------------------
 * edit(req, res)
 * Route : PUT /api/posts/:id
 * Met à jour un post existant.
 *
 * req.body      : corps JSON avec les champs à modifier
 *   → Ex: { title: "Nouveau titre", status: "published", content: "..." }
 * req.user      : utilisateur connecté (pour normalizePostPayload)
 * req.params.id : id du post à modifier (extrait de l'URL)
 *
 * normalizePostPayload() : assure que author_id, status et published_at
 *   sont cohérents avec les règles métier avant la mise à jour SQL
 * ---------------------------------------------------------------- */
const edit = (req, res) => {
  // On normalise le payload avant l'UPDATE (validation statut, dates, auteur)
  const posts = normalizePostPayload(req.body, req.user);
  // On injecte l'id numérique depuis l'URL dans l'objet
  posts.id = parseInt(req.params.id, 10); // parseInt() : string "12" → entier 12

  // update() → UPDATE posts SET title=?, status=?, ... WHERE id=?
  models.posts
    .update(posts)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne mise à jour → l'id n'existe pas → HTTP 404
        res.sendStatus(404);
      } else {
        // Mise à jour réussie → HTTP 204 No Content
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500); // Erreur SQL imprévue
    });
};

/* ----------------------------------------------------------------
 * add(req, res)
 * Route : POST /api/posts
 * Crée un nouveau post en base de données.
 *
 * req.body : corps JSON contenant les données du post à créer
 *   → Ex: { title: "Mon article", content: "...", blog_id: 3, status: "draft" }
 * req.user : utilisateur connecté (nécessaire pour normalizePostPayload)
 *
 * normalizePostPayload() : normalise author_id, status, published_at avant l'INSERT
 * result.insertId : id auto-incrémenté attribué par MySQL au nouveau post
 * ---------------------------------------------------------------- */
const add = (req, res) => {
  // On normalise le payload avant l'INSERT SQL
  const posts = normalizePostPayload(req.body, req.user);

  // insert() → INSERT INTO posts (title, content, status, author_id, ...) VALUES (...)
  models.posts
    .insert(posts)
    .then(([result]) => {
      // result.insertId : id de la nouvelle ligne créée
      // Header Location : URL de la ressource créée
      // HTTP 201 Created : convention REST pour une création réussie
      res.location(`/posts/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL (ex: contrainte NOT NULL)
      res.sendStatus(500);
    });
};

/* ----------------------------------------------------------------
 * destroy(req, res)
 * Route : DELETE /api/posts/:id
 * Supprime définitivement un post de la base de données.
 *
 * req.params.id : id du post à supprimer (extrait du segment :id de l'URL)
 * result.affectedRows === 0 : aucune ligne supprimée → l'id n'existe pas → HTTP 404
 * HTTP 204 No Content : suppression réussie sans corps de réponse
 * ---------------------------------------------------------------- */
const destroy = (req, res) => {
  // delete() → DELETE FROM posts WHERE id = ?
  models.posts
    .delete(req.params.id) // Paramètre SQL sécurisé (prévient l'injection SQL)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne supprimée → le post n'existe pas → HTTP 404
        res.sendStatus(404);
      } else {
        // Suppression réussie → HTTP 204 No Content
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL côté serveur
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

// Exportation des fonctions pour le router (backend/src/routes/posts.js)
module.exports = {
  add,     // POST   /posts      → crée un nouveau post
  browse,  // GET    /posts      → liste les posts (scope selon rôle)
  destroy, // DELETE /posts/:id  → supprime un post
  edit,    // PUT    /posts/:id  → modifie un post
  read     // GET    /posts/:id  → retourne un post par id
};
