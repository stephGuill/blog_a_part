// commentsControlle.js (note: nom de fichier contient une faute de frappe)
// Contrôleur : gestion des commentaires (CRUD)
// - Attention : le nom du fichier semble manquer un 'r' (commentsController.js attendu).
// - Fournit : browse, read, edit, add, destroy. Délègue la logique à `models.comments`.
const models = require("../models");

// Récupère tous les commentaires
const browse = (req, res) => {
  models.comments
    .findAll()
    .then(([rows]) => {
      res.send(rows);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const read = (req, res) => {
  models.comments
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

const edit = (req, res) => {
  const comments = req.body;

  // TODO validations (length, format...)

  comments.id = parseInt(req.params.id, 10);

  models.comments
    .update(comments)
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

const add = (req, res) => {
  const comments = req.body;

  // TODO validations (length, format...)

  models.comments
    .insert(comments)
    .then(([result]) => {
      res.location(`/comments/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const destroy = (req, res) => {
  models.comments
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
};
