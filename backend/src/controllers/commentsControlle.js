// commentsControlle.js (note: nom de fichier contient une faute de frappe)
// Contrôleur : gestion des commentaires (CRUD)
// - Attention : le nom du fichier semble manquer un 'r' (commentsController.js attendu).
// - Fournit : browse, read, edit, add, destroy. Délègue la logique à `models.comments`.
// Exports: browse, read, edit, add, destroy
const models = require("../models");

// browse(req, res) : récupère tous les commentaires (usage interne/admin)
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

// read(req, res) : lit un commentaire par id (404 si absent)
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

// edit(req, res) : met à jour un commentaire (id dans l'URL)
// - Body : { content, status, parent_id? }
// - Validation non implémentée ici; TODO noter dans le code
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

// add(req, res) : crée un commentaire
// - Body : { post_id, parent_id?, author_name, author_email, content }
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

// destroy(req, res) : supprime un commentaire par id
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
  destroy
};
