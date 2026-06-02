// themesController.js
// Contrôleur : gestion des thèmes (liste, lecture, création, modification, suppression)
// - Ce fichier délègue presque toute la logique à `models.themes` et se
//   contente de formater les réponses HTTP et gérer les erreurs.
const models = require("../models");

// browse(req, res) : retourne tous les thèmes disponibles
// - Requête publique : renvoie un tableau d'objets thème
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

// read(req, res) : récupère un thème par id (404 si introuvable)
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

// edit(req, res) : met à jour un thème existant
// - Body attendu : champs modifiables du thème (name, type, config_json...)
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

// add(req, res) : crée un nouveau thème
// - Body attendu : { name, type, description, config_json?, preview_url? }
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

// destroy(req, res) : supprime un thème par id
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
  destroy
};
