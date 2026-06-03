// ============================================================
// usersController.js
// Contrôleur Express : opérations CRUD pour les utilisateurs.
//
// Rôle :
//   Gère la lecture, la création, la modification et la suppression des
//   utilisateurs. Inclut l'upload d'avatar et l'activation/désactivation
//   de comptes.
//
// Architecture Express :
//   req (Request)  : objet entrant — params URL, body JSON, req.user, req.file
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// req.user : injecté par le middleware d'authentification (protect())
//   → req.user.id         : id de l'utilisateur connecté
//   → req.user.role       : rôle global de l'utilisateur (ex: "admin")
//   → req.user.globalRole : rôle global alternatif (ex: "admin")
//
// req.file : objet Multer injecté lors d'un upload multipart
//   → req.file.filename : nom du fichier avatar sur le disque
//
// argon2 : bibliothèque de hachage sécurisé des mots de passe
//   → argon2.hash(password) : retourne une Promise avec le hash sécurisé
//   → Algorithme recommandé par OWASP pour le stockage des mots de passe
//
// isAdmin : true si le rôle de l'utilisateur connecté est "admin"
//   → Permet d'adapter les permissions (admin peut tout modifier, user non)
//
// Codes HTTP :
//   200 OK          : lecture/upload réussi
//   201 Created     : utilisateur créé
//   204 No Content  : modification/suppression réussie (pas de corps)
//   400 Bad Request : body vide, champs requis manquants
//   404 Not Found   : utilisateur introuvable
//   500 Server Err  : erreur SQL ou hachage inattendue
//
// Exports : browse, read, edit, add, destroy, toggleActive, uploadAvatar
// ============================================================

// Importation de l'objet models (centralise tous les managers BDD)
// models.users expose : findAllSafe(), findSafeById(), update(), updateAdmin(),
//                       updateProfile(), insert(), updateActive(), updateAvatar(), delete()
const models = require("../models");

// argon2 : bibliothèque de hachage des mots de passe (plus sécurisé que bcrypt)
// Utilisée pour hasher le mot de passe avant insertion en base
const argon2 = require("argon2");

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/users
 * Retourne la liste de tous les utilisateurs (sans données sensibles).
 *
 * findAllSafe() : version "safe" qui exclut les champs sensibles
 *   → Ne retourne pas : password_hash, totp_secret, oauth_tokens…
 *   → Retourne : id, username, email, full_name, role, avatar_url, status…
 * ---------------------------------------------------------------- */
const browse = (req, res) => {
  // findAllSafe() → SELECT id, username, email, full_name, role, ... FROM users (sans password_hash)
  models.users
    .findAllSafe()
    .then(([rows]) => {
      // rows = tableau des utilisateurs (champs non sensibles uniquement)
      res.send(rows); // HTTP 200 OK avec la liste des utilisateurs
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL côté serveur
      res.sendStatus(500); // HTTP 500 Internal Server Error
    });
};

/* ----------------------------------------------------------------
 * read(req, res)
 * Route : GET /api/users/:id
 * Retourne un utilisateur par son id (sans données sensibles).
 *
 * req.params.id : id de l'utilisateur dans le segment :id de l'URL
 * findSafeById() : version "safe" qui exclut password_hash et autres secrets
 * rows[0] == null : aucun utilisateur trouvé → HTTP 404 Not Found
 * ---------------------------------------------------------------- */
const read = (req, res) => {
  // findSafeById(id) → SELECT id, username, email, ... FROM users WHERE id = ?
  models.users
    .findSafeById(req.params.id) // req.params.id = segment :id de l'URL
    .then(([rows]) => {
      if (rows[0] == null) {
        // Aucun utilisateur trouvé pour cet id → HTTP 404 Not Found
        res.sendStatus(404);
      } else {
        // Utilisateur trouvé → retourne ses données non sensibles
        res.send(rows[0]); // HTTP 200 OK avec l'objet utilisateur
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

/* ----------------------------------------------------------------
 * edit(req, res)
 * Route : PUT /api/users/:id
 * Met à jour un utilisateur avec des règles différentes selon le rôle.
 *
 * req.body : corps JSON avec les champs à modifier
 * req.params.id : id de l'utilisateur à modifier
 * req.user : utilisateur connecté (pour déterminer les permissions)
 *
 * Règles de permission :
 *   - Admin (isAdmin=true) :
 *     → Peut modifier TOUS les champs
 *     → Si password_hash fourni → utilise update() (avec hash)
 *     → Sinon → utilise updateAdmin() (sans toucher au mot de passe)
 *   - Utilisateur normal (isAdmin=false) :
 *     → Peut uniquement modifier son profil : username, email, full_name
 *     → Utilise updateProfile() (restreint les champs modifiables côté SQL)
 *
 * parseInt(id, 10) : conversion du segment :id (string) en entier base 10
 * ---------------------------------------------------------------- */
const edit = (req, res) => {
  // Récupération du body (champs à modifier)
  const users = req.body;

  // Validation : le body ne doit pas être vide
  if (!users) {
    return res.status(400).json({ status: "error", message: "Body is required" }); // HTTP 400
  }

  // Conversion de l'id de l'URL (string) en entier
  const userId = parseInt(req.params.id, 10);

  // Vérification si l'utilisateur connecté est admin (deux propriétés possibles selon le middleware)
  const isAdmin = req.user?.role === "admin" || req.user?.globalRole === "admin";

  // Préparation du payload selon les permissions
  const payload = isAdmin
    ? { ...users, id: userId }     // Admin → toutes les modifications autorisées
    : {
        id: userId,               // Non-admin → seulement les champs de profil
        username: users.username, // Pseudonyme (req.body.username)
        email: users.email,       // Adresse email (req.body.email)
        full_name: users.full_name, // Nom complet (req.body.full_name)
      };

  // Sélection de la méthode de modèle selon le rôle et les données fournies
  const query = isAdmin
    ? users.password_hash
      ? models.users.update(payload)       // Admin + nouveau hash → update complet
      : models.users.updateAdmin(payload)  // Admin + pas de hash → update admin (sans mdp)
    : models.users.updateProfile(payload); // Non-admin → update profil uniquement

  // Exécution de la requête choisie
  query
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
 * Route : POST /api/users
 * Crée un nouvel utilisateur avec mot de passe haché (route admin).
 *
 * req.body : corps JSON contenant les données du nouvel utilisateur
 *   → username    : pseudonyme (obligatoire)
 *   → email       : adresse email (obligatoire)
 *   → password    : mot de passe en clair (obligatoire, sera haché)
 *   → full_name   : nom complet (optionnel)
 *   → platform_role : rôle global (optionnel, défaut: "user")
 *
 * argon2.hash(password) : hache le mot de passe en clair de façon sécurisée
 *   → Le hash est stocké en base (jamais le mot de passe en clair)
 *   → async : on attend la Promise du hash avant l'INSERT
 *
 * result.insertId : id MySQL auto-incrémenté du nouvel utilisateur
 * ---------------------------------------------------------------- */
const add = async (req, res) => {
  // Récupération du body
  const users = req.body;

  // Validation : le body ne doit pas être vide
  if (!users || Object.keys(users).length === 0) {
    return res.status(400).json({
      status: "fail",
      // Message explicite pour aider les développeurs à déboguer
      message: "Le body est requis pour créer un utilisateur. Utilisez JSON avec Content-Type: application/json."
    });
  }

  // Validation des champs obligatoires
  if (!users.username || !users.email || !users.password) {
    return res.status(400).json({
      status: "fail",
      message: "username, email et password sont requis." // HTTP 400 Bad Request
    });
  }

  try {
    // Hachage sécurisé du mot de passe AVANT de le stocker en base
    // argon2.hash() retourne une Promise → await pour obtenir le hash
    const password_hash = await argon2.hash(users.password);

    // INSERT INTO users (username, email, password_hash, role, ...) VALUES (...)
    const [result] = await models.users.insert({
      ...users,          // Tous les champs du body
      password_hash,     // Hash du mot de passe (remplace le champ password)
      // Si platform_role === "admin" → on assigne le rôle "admin" ; sinon "user"
      role: users.platform_role === "admin" ? "admin" : "user",
      platform_role: users.platform_role || "user", // Rôle global (défaut: "user")
    });
    // Header Location : URL de la ressource créée
    // HTTP 201 Created : convention REST pour une création réussie
    return res.location(`/users/${result.insertId}`).sendStatus(201);
  } catch (err) {
    console.error(err); // Log de l'erreur (SQL ou argon2)
    return res.sendStatus(500); // HTTP 500 Internal Server Error
  }
};

/* ----------------------------------------------------------------
 * toggleActive(req, res)
 * Route : PATCH /api/users/:id/toggle-active
 * Active ou désactive un compte utilisateur (admin uniquement).
 *
 * req.body.is_active : booléen envoyé par le client
 *   → true/1 → compte activé
 *   → false/0 → compte désactivé
 *
 * isActive : conversion explicite en Boolean avant la mise à jour
 *   → Gère les cas où is_active = true (boolean), 1 (number), "true" (string)
 *
 * result.affectedRows === 0 : l'id n'existe pas → HTTP 404 Not Found
 * ---------------------------------------------------------------- */
const toggleActive = (req, res) => {
  // Conversion explicite : on accepte true (boolean) ou 1 (number)
  const isActive = req.body?.is_active === true || req.body?.is_active === 1;

  // updateActive() → UPDATE users SET is_active=? WHERE id=?
  models.users
    .updateActive(req.params.id, isActive) // req.params.id = segment :id de l'URL
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne modifiée → l'id n'existe pas → HTTP 404
        res.sendStatus(404);
      } else {
        // Mise à jour du statut réussie → HTTP 204 No Content
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500); // Erreur SQL imprévue
    });
};

/* ----------------------------------------------------------------
 * uploadAvatar(req, res)
 * Route : POST /api/users/:id/avatar
 * Met à jour l'avatar d'un utilisateur après upload multipart.
 *
 * req.file : objet Multer injecté par le middleware upload.js
 *   → req.file.filename : nom du fichier généré par Multer sur le disque
 *   → Absent si aucun fichier n'a été envoyé → HTTP 400 Bad Request
 *
 * avatarUrl : chemin relatif vers le fichier avatar (accessible via /uploads/)
 * updateAvatar() → UPDATE users SET avatar_url=? WHERE id=?
 *
 * result.affectedRows === 0 : l'id n'existe pas → HTTP 404
 * HTTP 200 : retourne l'URL de l'avatar mis à jour (utile pour le frontend)
 * ---------------------------------------------------------------- */
const uploadAvatar = (req, res) => {
  // Validation : un fichier doit avoir été uploadé via le middleware Multer
  if (!req.file) {
    // HTTP 400 Bad Request : aucun fichier présent dans la requête multipart
    return res.status(400).json({
      status: "fail",
      message: "Image avatar requise.",
    });
  }

  // Construction du chemin URL de l'avatar (relatif au répertoire public)
  // req.file.filename : nom généré par Multer (ex: "avatar-1234567890.jpg")
  const avatarUrl = `/uploads/${req.file.filename}`;

  // updateAvatar() → UPDATE users SET avatar_url=? WHERE id=?
  return models.users
    .updateAvatar(req.params.id, avatarUrl) // req.params.id = segment :id de l'URL
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne mise à jour → l'id n'existe pas → HTTP 404
        return res.sendStatus(404);
      }

      // Avatar mis à jour → HTTP 200 OK avec l'URL de l'avatar
      return res.status(200).json({
        success: true,
        avatar_url: avatarUrl, // URL retournée pour mise à jour immédiate côté frontend
      });
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      return res.sendStatus(500); // Erreur serveur imprévue
    });
};

/* ----------------------------------------------------------------
 * destroy(req, res)
 * Route : DELETE /api/users/:id
 * Supprime définitivement un utilisateur de la base de données.
 *
 * req.params.id : id de l'utilisateur à supprimer (extrait du segment :id)
 * result.affectedRows === 0 : aucune ligne supprimée → l'id n'existe pas → HTTP 404
 * HTTP 204 No Content : suppression réussie sans corps de réponse
 * ---------------------------------------------------------------- */
const destroy = (req, res) => {
  // delete() → DELETE FROM users WHERE id = ?
  models.users
    .delete(req.params.id) // Paramètre SQL sécurisé (prévient l'injection SQL)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne supprimée → l'id n'existe pas → HTTP 404 Not Found
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

// Exportation des fonctions pour le router (backend/src/routes/users.js)
module.exports = {
  browse,       // GET    /users          → liste tous les utilisateurs (sans données sensibles)
  read,         // GET    /users/:id      → retourne un utilisateur par id
  edit,         // PUT    /users/:id      → modifie un utilisateur (admin ou profil)
  add,          // POST   /users          → crée un utilisateur (avec hash du mot de passe)
  destroy,      // DELETE /users/:id      → supprime un utilisateur
  toggleActive, // PATCH  /users/:id/toggle-active → active/désactive un compte
  uploadAvatar  // POST   /users/:id/avatar         → upload et sauvegarde l'avatar
};
