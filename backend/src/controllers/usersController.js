// usersController.js
// Contrôleur : opérations CRUD pour les utilisateurs
// - Fournit des endpoints pour lister, lire, éditer, créer, activer/désactiver,
//   uploader un avatar et supprimer un utilisateur.
// - Utilise `models.users` pour la persistance et `argon2` pour le hachage.
// Conventions :
// - `req.user` est supposé être injecté par le middleware d'auth (`protect`)
//   et contient au minimum `id`, `role` et `globalRole`.
// Exports: browse, read, edit, add, destroy, toggleActive, uploadAvatar
const models = require("../models");
const argon2 = require("argon2");

// browse(req, res) : retourne la liste des utilisateurs (champs non sensibles).
// - Méthode protégée en général (selon route) ; retourne un tableau d'utilisateurs.
const browse = (req, res) => {
  models.users
    .findAllSafe()
    .then(([rows]) => {
      res.send(rows);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

// read(req, res) : récupère un utilisateur non sensible par son id.
// - Si non trouvé, retourne 404.
const read = (req, res) => {
  models.users
    .findSafeById(req.params.id)
    .then(([rows]) => {
      if (rows[0] == null) {
        res.sendStatus(404);
      } else {
        res.send(rows[0]);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

// edit(req, res) : met à jour un utilisateur.
// - Comportement :
//   * Si l'appelant est admin (`isAdmin`), il peut mettre à jour tous les champs
//     (utilise `update` ou `updateAdmin` selon si un nouveau password_hash est fourni).
//   * Sinon, l'utilisateur ne peut mettre à jour que son profil (username/email/full_name)
// - Body attendu : objet partiel des champs à modifier.
const edit = (req, res) => {
  const users = req.body;

  if (!users) {
    return res.status(400).json({ status: "error", message: "Body is required" });
  }

  const userId = parseInt(req.params.id, 10);
  const isAdmin = req.user?.role === "admin" || req.user?.globalRole === "admin";

  const payload = isAdmin
    ? { ...users, id: userId }
    : {
        id: userId,
        username: users.username,
        email: users.email,
        full_name: users.full_name,
      };

  const query = isAdmin
    ? users.password_hash
      ? models.users.update(payload)
      : models.users.updateAdmin(payload)
    : models.users.updateProfile(payload);

  query
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

// add(req, res) : création d'un nouvel utilisateur (admin route en général)
// - Body requis : `{ username, email, password, ... }`
// - Hache le mot de passe et appelle `models.users.insert`.
const add = async (req, res) => {
  const users = req.body;

  if (!users || Object.keys(users).length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "Le body est requis pour créer un utilisateur. Utilisez JSON avec Content-Type: application/json."
    });
  }

  if (!users.username || !users.email || !users.password) {
    return res.status(400).json({
      status: "fail",
      message: "username, email et password sont requis."
    });
  }

  try {
    const password_hash = await argon2.hash(users.password);
    const [result] = await models.users.insert({
      ...users,
      password_hash,
      role: users.platform_role === "admin" ? "admin" : "user",
      platform_role: users.platform_role || "user",
    });
    return res.location(`/users/${result.insertId}`).sendStatus(201);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};

// toggleActive(req, res) : active ou désactive un compte (admin uniquement)
// - Body attendu : { is_active: true|false }
const toggleActive = (req, res) => {
  const isActive = req.body?.is_active === true || req.body?.is_active === 1;

  models.users
    .updateActive(req.params.id, isActive)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

// uploadAvatar(req, res) : gestion de l'upload d'avatar via Multer
// - `req.file` doit être présent (upload middleware) et exposes `filename`.
const uploadAvatar = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: "fail",
      message: "Image avatar requise.",
    });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  return models.users
    .updateAvatar(req.params.id, avatarUrl)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        return res.sendStatus(404);
      }

      return res.status(200).json({
        success: true,
        avatar_url: avatarUrl,
      });
    })
    .catch((err) => {
      console.error(err);
      return res.sendStatus(500);
    });
};

const destroy = (req, res) => {
  models.users
    .delete(req.params.id)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

module.exports = {
  browse,
  read,
  edit,
  add,
  destroy,
  toggleActive,
  uploadAvatar
};
