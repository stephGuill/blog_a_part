// ============================================================
// reportsController.js
// Contrôleur Express : gestion des signalements (reports).
//
// Rôle :
//   Permet aux utilisateurs de signaler du contenu inapproprié,
//   et aux modérateurs/admins de consulter et modérer ces signalements.
//
// Architecture Express :
//   req (Request)  : objet entrant — params URL, body JSON, req.user
//   res (Response) : objet sortant — statut HTTP + données JSON
//
// req.user : injecté par le middleware d'authentification (protect())
//   → req.user.id         : id de l'utilisateur connecté (reporter ou modérateur)
//   → req.user.globalRole : rôle global ("admin" ou autre)
//
// req.blogAccess : injecté par un middleware de permission de blog
//   → req.blogAccess.blogId : id du blog auquel l'utilisateur a accès
//
// Codes HTTP :
//   200 OK          : liste retournée avec succès
//   201 Created     : signalement créé avec succès
//   204 No Content  : modération réussie (pas de corps)
//   400 Bad Request : données manquantes ou statut invalide
//   500 Server Err  : erreur SQL ou système inattendue
//
// Exports : add, browse, moderate
// ============================================================

// Importation de l'objet models (centralise tous les managers BDD)
// Utilisé ici : models.reports, models.auditLogs
const models = require("../models");

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/reports (ou GET /api/blogs/:blogId/reports)
 * Retourne la liste des signalements selon le rôle de l'utilisateur.
 *
 * Logique de scope :
 *   - Si req.user.globalRole === "admin" : retourne TOUS les signalements
 *   - Sinon : retourne uniquement les signalements du blog accessible (req.blogAccess)
 *
 * req.user.globalRole  : rôle global de l'utilisateur (ex: "admin" ou "user")
 * req.blogAccess.blogId : id du blog accessible (injecté par middleware de permission)
 * ---------------------------------------------------------------- */
const browse = async (req, res) => {
  try {
    // Ternaire pour choisir la requête selon le rôle de l'utilisateur connecté
    const query =
      req.user.globalRole === "admin"
        ? models.reports.findAll()               // Admin → tous les signalements
        : models.reports.findByBlog(req.blogAccess.blogId); // Modérateur → signalements de son blog

    // await : on attend que la requête SQL asynchrone soit terminée
    const [rows] = await query;
    return res.status(200).json(rows); // HTTP 200 OK : liste des signalements
  } catch (error) {
    console.error(error); // Log de l'erreur SQL côté serveur
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

/* ----------------------------------------------------------------
 * add(req, res)
 * Route : POST /api/reports
 * Crée un nouveau signalement pour du contenu jugé inapproprié.
 *
 * req.body : corps JSON de la requête — champs du signalement
 *   → blog_id      : id du blog concerné (optionnel, peut être null)
 *   → target_type  : type de contenu signalé ("post", "comment", "user"…) — OBLIGATOIRE
 *   → target_id    : id de la ressource signalée — OBLIGATOIRE
 *   → reason       : raison du signalement (ex: "spam", "harcèlement"…) — OBLIGATOIRE
 *   → details      : description détaillée (optionnel)
 *
 * req.user?.id : id du signalant (null si utilisateur non connecté = signalement anonyme)
 * result.insertId : id auto-incrémenté du nouveau signalement en base
 * ---------------------------------------------------------------- */
const add = async (req, res) => {
  // Destructuration du body : extraction des champs attendus
  const { blog_id, target_type, target_id, reason, details } = req.body;

  // Validation des champs obligatoires : on vérifie avant d'accéder à la BDD
  if (!target_type || !target_id || !reason) {
    // HTTP 400 Bad Request : le client n'a pas fourni tous les champs requis
    return res.status(400).json({ status: "fail", message: "target_type, target_id et reason sont requis." });
  }

  try {
    // insert() → INSERT INTO reports (blog_id, reporter_user_id, target_type, ...) VALUES (...)
    const [result] = await models.reports.insert({
      blog_id,                            // Id du blog (peut être null)
      reporter_user_id: req.user?.id || null, // Id du signalant (null si anonyme)
      // req.user?.id : opérateur optionnel — évite une erreur si req.user est undefined
      target_type,                        // Type de la ressource signalée
      target_id,                          // Id de la ressource signalée
      reason,                             // Motif principal du signalement
      details,                            // Description supplémentaire (optionnel)
    });

    // result.insertId : id MySQL généré pour le nouveau signalement
    // Header Location : URL de la ressource créée (/reports/42)
    // HTTP 201 Created : convention REST pour une création réussie
    return res.location(`/reports/${result.insertId}`).sendStatus(201);
  } catch (error) {
    console.error(error); // Log de l'erreur SQL
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

/* ----------------------------------------------------------------
 * moderate(req, res)
 * Route : PATCH /api/reports/:id/moderate
 * Modère un signalement en changeant son statut (traitement par modérateur/admin).
 *
 * req.params.id   : id du signalement à modérer (extrait du segment :id de l'URL)
 * req.body.status : nouveau statut du signalement — DOIT être dans la liste autorisée
 *   → Valeurs autorisées : "pending" | "reviewed" | "rejected" | "resolved"
 * req.user.id     : id du modérateur qui effectue l'action (pour l'audit)
 *
 * models.reports.updateStatus() → UPDATE reports SET status=? WHERE id=?
 * models.auditLogs.insert()     → Journalisation de la modération (traçabilité)
 * HTTP 204 No Content           → Modération réussie sans corps de réponse
 * ---------------------------------------------------------------- */
const moderate = async (req, res) => {
  // On extrait le nouveau statut depuis le body de la requête
  const { status } = req.body;

  // Liste des statuts de signalement autorisés (whitelist)
  const allowed = ["pending", "reviewed", "rejected", "resolved"];

  // Validation du statut : on refuse toute valeur non autorisée
  if (!allowed.includes(status)) {
    // HTTP 400 Bad Request : statut invalide fourni par le client
    return res.status(400).json({ status: "fail", message: "Statut de signalement invalide." });
  }

  try {
    // Met à jour le statut du signalement en base de données
    // req.params.id = id du signalement, status = nouveau statut, req.user.id = modérateur
    await models.reports.updateStatus(req.params.id, status, req.user.id);

    // Journalisation de la modération dans l'audit log
    await models.auditLogs.insert({
      actor_user_id: req.user.id,       // Qui a effectué la modération
      target_type: "report",            // Type de ressource affectée
      target_id: Number(req.params.id), // Id du signalement modéré (Number() car params = string)
      action: "report:moderate",        // Nom de l'action pour la traçabilité
      metadata_json: { status },        // Nouveau statut appliqué (contexte de l'action)
    });
    return res.sendStatus(204); // HTTP 204 No Content : modération réussie
  } catch (error) {
    console.error(error); // Log de l'erreur SQL
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// Exportation des fonctions pour le router (backend/src/routes/reports.js)
module.exports = {
  add,      // POST  /reports           → crée un nouveau signalement
  browse,   // GET   /reports           → liste les signalements (scope selon rôle)
  moderate  // PATCH /reports/:id/moderate → modère un signalement (changement de statut)
};
