// ============================================================
// commentsController.js
// Contrôleur Express : CRUD complet pour les commentaires.
//
// Rôle :
//   Gère les opérations de création, lecture, modification et suppression
//   des commentaires associés aux articles (posts) du blog.
//
// Architecture Express :
//   req (Request)  : objet entrant — URL, headers, body, params, utilisateur connecté
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// Ce contrôleur délègue l'accès BDD à models.comments (CommentsManager).
// Les méthodes retournent des Promises (pattern .then/.catch).
//
// Codes HTTP utilisés :
//   200 OK         : lecture réussie (implicite via res.send/res.json)
//   201 Created    : commentaire créé avec succès
//   204 No Content : modification/suppression réussie (pas de corps retourné)
//   404 Not Found  : commentaire introuvable (rows[0] null ou affectedRows = 0)
//   500 Server Err : erreur inattendue côté serveur (SQL, réseau…)
//
// Exports : browse, read, edit, add, destroy
// ============================================================

// Importation de l'objet models qui centralise tous les accès BDD
// models.comments expose : findAll(), find(id), update(), insert(), delete()
const models = require("../models");

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/comments
 * Retourne la liste complète de tous les commentaires.
 * Usage typique : interface d'administration pour modérer les commentaires.
 *
 * models.comments.findAll() → SELECT * FROM comments
 * .then(([rows]) => ...)    → destructure [[rows], fields] retourné par MySQL2
 * res.send(rows)            → envoie le tableau JSON des commentaires (HTTP 200)
 * ---------------------------------------------------------------- */
const browse = (req, res) => {
  // Appel au modèle : requête SELECT sans filtre (tous les commentaires)
  models.comments
    .findAll()
    .then(([rows]) => {
      // rows = tableau de tous les commentaires [{id, post_id, content, ...}, ...]
      res.send(rows); // HTTP 200 OK avec la liste complète
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL côté serveur pour le débogage
      res.sendStatus(500); // HTTP 500 Internal Server Error
    });
};

/* ----------------------------------------------------------------
 * read(req, res)
 * Route : GET /api/comments/:id
 * Retourne un seul commentaire identifié par son id.
 *
 * req.params.id : valeur du segment :id dans l'URL (string)
 *   → Ex: GET /comments/15 → req.params.id = "15"
 * rows[0] == null : aucun commentaire trouvé pour cet id → HTTP 404
 * ---------------------------------------------------------------- */
const read = (req, res) => {
  // find(id) → SELECT * FROM comments WHERE id = ? LIMIT 1
  models.comments
    .find(req.params.id) // req.params.id = l'identifiant depuis l'URL
    .then(([rows]) => {
      if (rows[0] == null) {
        // Aucune ligne trouvée → le commentaire n'existe pas → HTTP 404 Not Found
        res.sendStatus(404);
      } else {
        // Commentaire trouvé → on retourne l'objet (premier élément du tableau)
        res.send(rows[0]); // HTTP 200 OK avec l'objet commentaire
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

/* ----------------------------------------------------------------
 * edit(req, res)
 * Route : PUT /api/comments/:id
 * Met à jour un commentaire existant.
 *
 * req.body : corps JSON de la requête — champs modifiables du commentaire
 *   → Ex: { content: "Nouveau texte", status: "approved" }
 * req.params.id : id du commentaire à modifier (extrait de l'URL)
 * result.affectedRows : nombre de lignes mises à jour par MySQL
 *   → 0 = aucune ligne modifiée (l'id n'existe pas) → HTTP 404
 *   → 1 = mise à jour réussie → HTTP 204 No Content
 * ---------------------------------------------------------------- */
const edit = (req, res) => {
  // On copie le body dans une variable locale (les champs à mettre à jour)
  const comments = req.body;

  // TODO : ajouter des validations (longueur du contenu, statuts autorisés…)

  // On injecte l'id depuis l'URL dans l'objet à envoyer au modèle
  // parseInt() : conversion de la string "15" en entier 15 (base 10)
  comments.id = parseInt(req.params.id, 10);

  // update() → UPDATE comments SET content=?, status=? WHERE id=?
  models.comments
    .update(comments)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne mise à jour → l'id n'existe pas → HTTP 404 Not Found
        res.sendStatus(404);
      } else {
        // Mise à jour réussie → HTTP 204 No Content (pas de corps dans la réponse)
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

/* ----------------------------------------------------------------
 * add(req, res)
 * Route : POST /api/comments
 * Crée un nouveau commentaire en base de données.
 *
 * req.body : corps JSON contenant les données du commentaire à créer
 *   → Ex: { post_id: 5, parent_id: null, author_name: "Jean", content: "Super article!" }
 * result.insertId : l'id auto-incrémenté attribué par MySQL à la nouvelle ligne
 * res.location()  : définit le header HTTP "Location" (URL de la ressource créée)
 * HTTP 201 Created : indique qu'une nouvelle ressource a été créée avec succès
 * ---------------------------------------------------------------- */
const add = (req, res) => {
  // On récupère l'objet commentaire depuis le corps de la requête POST
  const comments = req.body;

  // TODO : ajouter des validations (champs requis, longueur, format email…)

  // insert() → INSERT INTO comments (post_id, content, ...) VALUES (?, ?, ...)
  models.comments
    .insert(comments)
    .then(([result]) => {
      // result.insertId : id MySQL auto-généré pour ce nouveau commentaire
      // On positionne le header Location pour indiquer où trouver la ressource créée
      // sendStatus(201) : HTTP 201 Created = nouveau commentaire enregistré
      res.location(`/comments/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL (ex: contrainte FK violée)
      res.sendStatus(500);
    });
};

/* ----------------------------------------------------------------
 * destroy(req, res)
 * Route : DELETE /api/comments/:id
 * Supprime définitivement un commentaire de la base de données.
 *
 * req.params.id : id du commentaire à supprimer (extrait de l'URL)
 * result.affectedRows === 0 : aucune ligne supprimée → l'id n'existe pas → HTTP 404
 * HTTP 204 No Content : suppression réussie sans corps de réponse
 * ---------------------------------------------------------------- */
const destroy = (req, res) => {
  // delete() → DELETE FROM comments WHERE id = ?
  models.comments
    .delete(req.params.id) // req.params.id = segment :id de l'URL
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne supprimée → cet id n'existe pas en base → HTTP 404
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

// Exportation des fonctions pour le router (backend/src/routes/comments.js)
module.exports = {
  browse,  // GET    /comments      → liste tous les commentaires
  read,    // GET    /comments/:id  → retourne un commentaire par id
  edit,    // PUT    /comments/:id  → modifie un commentaire
  add,     // POST   /comments      → crée un nouveau commentaire
  destroy  // DELETE /comments/:id  → supprime un commentaire
};
