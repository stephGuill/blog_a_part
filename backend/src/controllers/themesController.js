// ============================================================
// themesController.js
// Contrôleur Express : CRUD complet pour les thèmes graphiques.
//
// Rôle :
//   Gère les opérations Create/Read/Update/Delete sur les thèmes.
//   Les thèmes définissent l'apparence visuelle des blogs (couleurs, layout…).
//
// Architecture Express :
//   req (Request)  : objet entrant — params URL, body JSON, utilisateur connecté
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// Ce contrôleur délègue l'accès BDD à models.themes (ThemesManager).
// Pattern Promise utilisé : .then().catch() (style non-async/await).
//
// Codes HTTP :
//   200 OK          : lecture réussie (implicite via res.send())
//   201 Created     : thème créé avec succès
//   204 No Content  : modification/suppression réussie
//   404 Not Found   : thème introuvable
//   500 Server Err  : erreur inattendue côté serveur
//
// Exports : browse, read, edit, add, destroy
// ============================================================

// Importation de l'objet models (centralise tous les managers de BDD)
// models.themes expose : findAll(), find(id), update(), insert(), delete()
const models = require("../models");

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/themes
 * Retourne la liste de tous les thèmes disponibles dans la plateforme.
 * Utilisé pour permettre au propriétaire de choisir un thème pour son blog.
 *
 * findAll() → SELECT * FROM themes
 * ([rows])  : destructuration du tableau MySQL [[rows], fields]
 * res.send(rows) : envoie la liste JSON avec HTTP 200 implicite
 * ---------------------------------------------------------------- */
const browse = (req, res) => {
  // Requête SELECT sans filtre : retourne tous les thèmes enregistrés
  models.themes
    .findAll()
    .then(([rows]) => {
      // rows = [{id, name, type, description, config_json, ...}, ...]
      res.send(rows); // HTTP 200 OK avec la liste des thèmes
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL dans la console serveur
      res.sendStatus(500); // HTTP 500 Internal Server Error
    });
};

/* ----------------------------------------------------------------
 * read(req, res)
 * Route : GET /api/themes/:id
 * Retourne un thème unique par son identifiant.
 *
 * req.params.id : valeur du segment :id dans l'URL
 *   → Ex: GET /themes/2 → req.params.id = "2"
 * rows[0] == null : aucun thème trouvé → HTTP 404 Not Found
 * ---------------------------------------------------------------- */
const read = (req, res) => {
  // find(id) → SELECT * FROM themes WHERE id = ? LIMIT 1
  models.themes
    .find(req.params.id) // req.params.id = id extrait du segment :id de l'URL
    .then(([rows]) => {
      if (rows[0] == null) {
        // Aucun résultat → le thème n'existe pas → HTTP 404
        res.sendStatus(404);
      } else {
        // Thème trouvé → on retourne l'objet (premier et seul résultat)
        res.send(rows[0]); // HTTP 200 OK avec l'objet thème
      }
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500); // Erreur serveur imprévue
    });
};

/* ----------------------------------------------------------------
 * edit(req, res)
 * Route : PUT /api/themes/:id
 * Met à jour un thème existant avec les données du body.
 *
 * req.body : corps JSON contenant les champs à modifier
 *   → Ex: { name: "Dark Mode", config_json: "{...}" }
 * req.params.id : id du thème à modifier dans l'URL
 * result.affectedRows : nombre de lignes MySQL mises à jour
 *   → 0 : l'id n'existe pas → HTTP 404
 *   → 1 : succès → HTTP 204 No Content
 * ---------------------------------------------------------------- */
const edit = (req, res) => {
  // On copie le body (champs à modifier) dans une variable locale
  const themes = req.body;

  // TODO : ajouter des validations (nom obligatoire, types autorisés, format JSON…)

  // On injecte l'id depuis l'URL dans l'objet avant la requête UPDATE
  // parseInt(str, 10) : convertit la string "2" de l'URL en entier 2 (base décimale)
  themes.id = parseInt(req.params.id, 10);

  // update() → UPDATE themes SET name=?, config_json=? WHERE id=?
  models.themes
    .update(themes)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne modifiée → l'id est inexistant → HTTP 404 Not Found
        res.sendStatus(404);
      } else {
        // Mise à jour réussie → HTTP 204 No Content (pas de corps de réponse)
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
 * Route : POST /api/themes
 * Crée un nouveau thème en base de données.
 *
 * req.body : corps JSON contenant les données du nouveau thème
 *   → Ex: { name: "Ocean Blue", type: "blog", description: "...", preview_url: "..." }
 * result.insertId : id auto-incrémenté généré par MySQL pour la nouvelle ligne
 * res.location()  : header HTTP "Location" → URL de la ressource créée
 * HTTP 201 Created : la ressource thème a été créée avec succès
 * ---------------------------------------------------------------- */
const add = (req, res) => {
  // On récupère l'objet thème depuis le corps de la requête POST
  const themes = req.body;

  // TODO : ajouter des validations (nom obligatoire, type parmi une liste autorisée…)

  // insert() → INSERT INTO themes (name, type, description, ...) VALUES (?, ?, ...)
  models.themes
    .insert(themes)
    .then(([result]) => {
      // result.insertId : id de la nouvelle ligne créée par MySQL
      // header Location : indique l'URL où se trouve la ressource créée
      // HTTP 201 Created : convention REST pour une création réussie
      res.location(`/themes/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err); // Log de l'erreur SQL
      res.sendStatus(500);
    });
};

/* ----------------------------------------------------------------
 * destroy(req, res)
 * Route : DELETE /api/themes/:id
 * Supprime définitivement un thème par son identifiant.
 *
 * req.params.id : id du thème à supprimer (extrait du segment :id de l'URL)
 * result.affectedRows === 0 : aucune ligne supprimée → l'id n'existe pas → HTTP 404
 * HTTP 204 No Content : suppression réussie sans corps dans la réponse
 * ---------------------------------------------------------------- */
const destroy = (req, res) => {
  // delete() → DELETE FROM themes WHERE id = ?
  models.themes
    .delete(req.params.id) // Paramètre SQL sécurisé contre l'injection SQL
    .then(([result]) => {
      if (result.affectedRows === 0) {
        // Aucune ligne supprimée → l'id n'existe pas en base → HTTP 404
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

// Exportation des fonctions pour le router (backend/src/routes/themes.js)
module.exports = {
  browse,  // GET    /themes      → liste tous les thèmes
  read,    // GET    /themes/:id  → retourne un thème par id
  edit,    // PUT    /themes/:id  → modifie un thème
  add,     // POST   /themes      → crée un nouveau thème
  destroy  // DELETE /themes/:id  → supprime un thème
};
