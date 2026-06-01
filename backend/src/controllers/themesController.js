// themesController.js
// Contrôleur : gestion des thèmes (liste, lecture, création, modification, suppression)
// - Ce fichier délègue presque toute la logique à `models.themes` et se
//   contente de formater les réponses HTTP et gérer les erreurs.
const models = require("../models");

// Récupère tous les thèmes disponibles
const browse = (req, res) => {
  models.themes
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
  models.themes
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
  const themes = req.body;

  // TODO validations (length, format...)

  themes.id = parseInt(req.params.id, 10);

  models.themes
    .update(themes)
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
  const themes = req.body;

  // TODO validations (length, format...)

  models.themes
    .insert(themes)
    .then(([result]) => {
      res.location(`/themes/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const destroy = (req, res) => {
  models.themes
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
