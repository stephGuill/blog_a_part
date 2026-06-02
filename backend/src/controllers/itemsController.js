// itemsController.js
// Contrôleur : gestion des entités "item" (CRUD basique)
// - Délègue la persistence à `models.item` et se charge des réponses HTTP.
// Fonctions exposées:
// - browse(req,res): liste tous les items
// - read(req,res): récupère un item par id
// - edit(req,res): met à jour un item
// - add(req,res): crée un nouvel item
// - destroy(req,res): supprime un item
const models = require("../models");

// browse(req, res) : retourne la liste des items
// - Utilisé généralement pour l'admin/global listing
const browse = (req, res) => {
  models.item
    .findAll()
    .then(([rows]) => {
      res.send(rows);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

// read(req, res) : lit un item par id (404 si absent)
const read = (req, res) => {
  models.item
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

// edit(req, res) : met à jour un item
const edit = (req, res) => {
  const item = req.body;

  // TODO validations (length, format...)

  item.id = parseInt(req.params.id, 10);

  models.item
    .update(item)
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

// add(req, res) : crée un nouvel item
// - Sérialise les champs JSON côté modèle si nécessaire
const add = (req, res) => {
  const item = req.body;

  // TODO validations (length, format...)

  models.item
    .insert(item)
    .then(([result]) => {
      res.location(`/items/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

// destroy(req, res) : supprime un item par id
const destroy = (req, res) => {
  models.item
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
