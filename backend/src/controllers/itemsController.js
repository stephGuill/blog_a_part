// ============================================================
// itemsController.js
// Contrôleur Express : CRUD complet pour les entités "item".
//
// Rôle :
//   Gère les opérations Create/Read/Update/Delete sur les items.
//   Les items sont des entités génériques (type de contenu configurable).
//
// Architecture Express :
//   req (Request)  : objet entrant — paramètres URL, corps JSON, utilisateur…
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// Ce contrôleur utilise models.item (ItemManager) pour l'accès BDD.
// Pattern Promise utilisé : .then().catch() (style non-async/await).
//
// Codes HTTP :
//   200 OK          : implicite via res.send()
//   201 Created     : item créé avec succès
//   204 No Content  : modification/suppression réussie (pas de corps)
//   404 Not Found   : item introuvable
//   500 Server Err  : erreur inattendue côté serveur
//
// Exports : browse, read, edit, add, destroy
// ============================================================

// Importation de l'objet models (index.js centralise tous les managers)
// models.item expose : findAll(), find(id), update(), insert(), delete()
const models = require("../models");

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/items
 * Retourne la liste complète de tous les items.
 * Utilisé typiquement pour l'administration globale.
 *
 * models.item.findAll() → SELECT * FROM items
 * ([rows]) : destructuration de [[rows], fields] (format MySQL2)
 * res.send(rows) : envoie le tableau JSON avec HTTP 200 implicite
 * ---------------------------------------------------------------- */
const browse = (req, res) => {
  // findAll() retourne une Promise qui se résout avec [[rows], fields]
  models.item
    .findAll()
    .then(([rows]) => {
      // rows = tableau d'objets item [{id, title, content, ...}, ...]
      res.send(rows); // HTTP 200 OK avec la liste complète des items
    })
    .catch((err) => {
      console.error(err); // Affiche l'erreur SQL dans les logs du serveur
      res.sendStatus(500); // HTTP 500 Internal Server Error
    });
};

/* ----------------------------------------------------------------
 * read(req, res)
 * Route : GET /api/items/:id
 * Retourne un item unique identifié par son id.
 *
 * req.params.id : valeur dynamique du segment :id dans l'URL
 *   → Ex: GET /items/7 → req.params.id = "7"
 * rows[0] == null : aucun item trouvé pour cet id → HTTP 404
 * ---------------------------------------------------------------- */
const read = (req, res) => {
  // find(id) → SELECT * FROM items WHERE id = ? LIMIT 1
  models.item
    .find(req.params.id) // Passe l'id de l'URL comme paramètre SQL sécurisé
    .then(([rows]) => {
      if (rows[0] == null) {
        // Aucune ligne retournée → l'item n'existe pas → HTTP 404 Not Found
        res.sendStatus(404);
      } else {
        // Item trouvé → retourne le premier (et seul) résultat
        res.send(rows[0]); // HTTP 200 OK avec l'objet item
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

/* ----------------------------------------------------------------
 * edit(req, res)
 * Route : PUT /api/items/:id
 * Met à jour un item existant avec les données du body.
 *
 * req.body      : corps JSON de la requête (champs à modifier)
 *   → Ex: { title: "Nouveau titre", content: "Contenu mis à jour" }
 * req.params.id : id de l'item à modifier (depuis l'URL)
 * result.affectedRows : nombre de lignes MySQL modifiées
 *   → 0 = l'id n'existe pas → HTTP 404
 *   → 1 = succès → HTTP 204 No Content
 * ---------------------------------------------------------------- */
const edit = (req, res) => {
  // Copie des champs à modifier depuis le corps de la requête
  const item = req.body;

  // TODO : ajouter des validations (longueur, format, champs obligatoires…)

  // On injecte l'id depuis l'URL dans l'objet avant la mise à jour
  // parseInt() : convertit la string "7" de l'URL en entier 7
  item.id = parseInt(req.params.id, 10);

  // update() → UPDATE items SET title=?, content=? WHERE id=?
  models.item
    .update(item)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne mise à jour → l'id n'existe pas → HTTP 404
        res.sendStatus(404);
      } else {
        // Mise à jour réussie → HTTP 204 No Content (pas de corps)
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
 * Route : POST /api/items
 * Crée un nouvel item en base de données.
 *
 * req.body : corps JSON contenant les données du nouvel item
 *   → Ex: { title: "Mon item", content: "...", blog_id: 3 }
 * result.insertId : id auto-incrémenté attribué par MySQL à la nouvelle ligne
 * res.location()  : header HTTP "Location" pointant vers la ressource créée
 * HTTP 201 Created : indique qu'une ressource a été créée avec succès
 * ---------------------------------------------------------------- */
const add = (req, res) => {
  // On récupère l'objet item depuis le corps de la requête POST (JSON)
  const item = req.body;

  // TODO : ajouter des validations (champs requis, format, longueur maximale…)

  // insert() → INSERT INTO items (title, content, ...) VALUES (?, ?, ...)
  models.item
    .insert(item)
    .then(([result]) => {
      // result.insertId : id de la nouvelle ligne créée par MySQL
      // Location header : URL complète de la ressource nouvellement créée
      // sendStatus(201) : HTTP 201 Created
      res.location(`/items/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur (ex: contrainte SQL)
      res.sendStatus(500);
    });
};

/* ----------------------------------------------------------------
 * destroy(req, res)
 * Route : DELETE /api/items/:id
 * Supprime définitivement un item par son identifiant.
 *
 * req.params.id : id de l'item à supprimer (extrait du segment :id de l'URL)
 * result.affectedRows === 0 : aucune ligne supprimée → id inexistant → HTTP 404
 * HTTP 204 No Content : suppression réussie sans corps dans la réponse
 * ---------------------------------------------------------------- */
const destroy = (req, res) => {
  // delete() → DELETE FROM items WHERE id = ?
  models.item
    .delete(req.params.id) // Paramètre SQL sécurisé (prévient l'injection SQL)
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
      console.error(err); // Log de l'erreur SQL côté serveur
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

// Exportation des fonctions pour le router (backend/src/routes/items.js)
module.exports = {
  browse,  // GET    /items      → liste tous les items
  read,    // GET    /items/:id  → retourne un item par id
  edit,    // PUT    /items/:id  → modifie un item
  add,     // POST   /items      → crée un nouvel item
  destroy  // DELETE /items/:id  → supprime un item
};
