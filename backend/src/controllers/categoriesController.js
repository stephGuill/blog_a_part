// ============================================================
// categoriesController.js
// Contrôleur Express : CRUD complet pour les catégories.
//
// Rôle :
//   Gère les opérations de création, lecture, modification et suppression
//   des catégories (entités utilisées pour classer les articles/posts).
//
// Architecture Express :
//   req (Request)  : objet entrant contenant les données de la requête HTTP
//   res (Response) : objet sortant permettant d'envoyer la réponse au client
//
// Ce contrôleur utilise models.categories (CategoriesManager) pour l'accès BDD.
// Toutes les méthodes retournent des Promises (appels SQL asynchrones via Promises).
//
// Codes HTTP utilisés :
//   200 OK          : res.send() ou res.json() sans code → 200 implicite
//   201 Created     : ressource créée avec succès
//   204 No Content  : opération réussie sans contenu à retourner (update/delete)
//   404 Not Found   : ressource introuvable (affectedRows === 0 ou rows[0] === null)
//   500 Server Error: erreur inattendue côté serveur
// Exports : browse, read, edit, add, destroy
// ============================================================

// Importation de l'index des modèles (backend/src/models/index.js)
// models.categories expose findAll(), find(id), update(), insert(), delete()
const models = require("../models");

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/categories
 * Retourne la liste complète de toutes les catégories.
 *
 * models.categories.findAll() → exécute SELECT * FROM categories
 * .then(([rows]) => ...)      → destructure le tableau résultat MySQL [[rows], fields]
 *   [rows] : les lignes retournées par la requête SQL
 * res.send(rows)              → envoie les données en JSON avec HTTP 200
 * .catch(err => ...)          → capture toute erreur SQL et envoie HTTP 500
 * ---------------------------------------------------------------- */
const browse = (req, res) => {
  // findAll() retourne une Promise qui résout avec [[rows], fields]
  models.categories
    .findAll()
    .then(([rows]) => {
      // rows : tableau d'objets catégorie [{id, name, slug, ...}, ...]
      res.send(rows); // HTTP 200 OK avec la liste des catégories
    })
    .catch((err) => {
      console.error(err); // Log serveur pour le débogage
      res.sendStatus(500); // HTTP 500 Internal Server Error
    });
};

/* ----------------------------------------------------------------
 * read(req, res)
 * Route : GET /api/categories/:id
 * Retourne une catégorie par son identifiant.
 *
 * req.params.id : segment dynamique de l'URL — ex: /categories/3 → id = "3"
 *   → req.params contient les variables :nomVariable définies dans la route
 * rows[0] == null : si aucune ligne retournée, la catégorie n'existe pas → 404
 * ---------------------------------------------------------------- */
const read = (req, res) => {
  // find(id) → SELECT * FROM categories WHERE id = ? avec req.params.id comme paramètre
  models.categories
    .find(req.params.id) // req.params.id = segment :id dans l'URL
    .then(([rows]) => {
      if (rows[0] == null) {
        // Aucune catégorie trouvée pour cet id → HTTP 404 Not Found
        res.sendStatus(404);
      } else {
        // Catégorie trouvée → on retourne l'objet rows[0] (premier et unique résultat)
        res.send(rows[0]); // HTTP 200 OK
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL côté serveur
      res.sendStatus(500); // HTTP 500 Internal Server Error
    });
};

/* ----------------------------------------------------------------
 * edit(req, res)
 * Route : PUT /api/categories/:id
 * Met à jour les champs d'une catégorie existante.
 *
 * req.body : objet JSON envoyé dans le corps de la requête (Content-Type: application/json)
 *   → Contient les champs à modifier (ex: { name: "Tech", slug: "tech" })
 * req.params.id : id de la catégorie à modifier dans l'URL
 * result.affectedRows === 0 : si aucune ligne modifiée → id inexistant → 404
 * ---------------------------------------------------------------- */
const edit = (req, res) => {
  // On récupère l'objet du body (champs à mettre à jour)
  const categories = req.body;

  // TODO : ajouter des validations (longueur maximale, format du slug, unicité…)

  // On injecte l'id depuis l'URL dans l'objet avant de l'envoyer au modèle
  // parseInt() convertit la string "3" de l'URL en entier 3
  categories.id = parseInt(req.params.id, 10);

  // update() → UPDATE categories SET name=?, slug=? WHERE id=?
  models.categories
    .update(categories)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne modifiée → cet id n'existe pas en base → HTTP 404
        res.sendStatus(404);
      } else {
        // Mise à jour réussie → HTTP 204 No Content (succès sans corps de réponse)
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err); // Log serveur
      res.sendStatus(500); // Erreur SQL imprévue
    });
};

/* ----------------------------------------------------------------
 * add(req, res)
 * Route : POST /api/categories
 * Crée une nouvelle catégorie en base de données.
 *
 * req.body : objet JSON du corps de la requête contenant les données de la catégorie
 *   → Ex: { name: "Science", slug: "science", description: "..." }
 * result.insertId : l'id auto-incrémenté attribué à la nouvelle ligne par MySQL
 * res.location()  : définit le header HTTP Location (URL de la ressource créée)
 * HTTP 201 Created : indique qu'une nouvelle ressource a été créée avec succès
 * ---------------------------------------------------------------- */
const add = (req, res) => {
  // On récupère l'objet catégorie depuis le body de la requête POST
  const categories = req.body;

  // TODO : ajouter des validations (champs obligatoires, longueur, format…)

  // insert() → INSERT INTO categories (name, slug, ...) VALUES (?, ?, ...)
  models.categories
    .insert(categories)
    .then(([result]) => {
      // result.insertId : id généré par MySQL pour la nouvelle catégorie
      // res.location() : positionne le header "Location: /categories/42"
      // sendStatus(201) : HTTP 201 Created = ressource créée avec succès
      res.location(`/categories/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err); // Log serveur (ex: contrainte SQL violée)
      res.sendStatus(500);
    });
};

/* ----------------------------------------------------------------
 * destroy(req, res)
 * Route : DELETE /api/categories/:id
 * Supprime une catégorie par son identifiant.
 *
 * req.params.id : id de la catégorie à supprimer dans l'URL
 * result.affectedRows === 0 : aucune ligne supprimée → l'id n'existe pas → 404
 * HTTP 204 No Content : suppression réussie (pas de corps dans la réponse)
 * ---------------------------------------------------------------- */
const destroy = (req, res) => {
  // delete() → DELETE FROM categories WHERE id = ?
  models.categories
    .delete(req.params.id) // req.params.id = segment :id de l'URL
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne supprimée → cet id n'existe pas → HTTP 404 Not Found
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

// Exportation des fonctions pour le router (backend/src/routes/categories.js)
module.exports = {
  browse,  // GET    /categories       → liste toutes les catégories
  read,    // GET    /categories/:id   → retourne une catégorie par id
  edit,    // PUT    /categories/:id   → modifie une catégorie
  add,     // POST   /categories       → crée une nouvelle catégorie
  destroy  // DELETE /categories/:id   → supprime une catégorie
};
