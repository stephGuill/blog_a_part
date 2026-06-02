// postsController.js
// Contrôleur : gestion des articles (posts)
// - Normalise le payload, gère les statuts, et fournit les actions CRUD.
// - Les permissions/scope sont appliqués en fonction de `req.user`.
// Exports: add, browse, destroy, edit, read
const models = require("../models");

const POST_STATUSES = ["draft", "pending", "published", "archived"];

// normalizePostPayload(payload, user) : normalise et enrichit le payload envoyé
// - Définit l'auteur par défaut sur `user.id` si absent
// - Définit `published_at` si le statut est 'published'
const normalizePostPayload = (payload, user) => {
  const status = POST_STATUSES.includes(payload.status) ? payload.status : "draft";

  return {
    ...payload,
    author_id: user?.role === "editor" || !payload.author_id ? user.id : payload.author_id,
    published_at: status === "published" ? payload.published_at || new Date() : null,
    status
  };
};

// browse(req, res) : liste des posts
// - Si pas d'utilisateur : retourne seulement les posts publics publiés
// - Si admin global : retourne tous les posts
// - Sinon : retourne les posts accessibles par l'utilisateur (membres de blog)
const browse = (req, res) => {
  const query =
    !req.user
      ? models.posts.findPublishedPublic()
      : req.user?.globalRole === "admin"
      ? models.posts.findAll()
      : models.posts.findAccessibleByUser(req.user.id);

  query
    .then(([rows]) => res.send(rows))
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

// read(req, res) : récupère un post par id
// - Si non trouvé : 404
const read = (req, res) => {
  models.posts
    .find(req.params.id)
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

// edit(req, res) : met à jour un post existant
// - Body : champs modifiables (title, content, status, published_at)
const edit = (req, res) => {
  const posts = normalizePostPayload(req.body, req.user);
  posts.id = parseInt(req.params.id, 10);

  models.posts
    .update(posts)
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

// add(req, res) : création d'un post
// - Body : payload normalisé via normalizePostPayload
const add = (req, res) => {
  const posts = normalizePostPayload(req.body, req.user);

  models.posts
    .insert(posts)
    .then(([result]) => {
      res.location(`/posts/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

// destroy(req, res) : suppression d'un post
const destroy = (req, res) => {
  models.posts
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
  add,
  browse,
  destroy,
  edit,
  read
};
