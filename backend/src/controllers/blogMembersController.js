// ============================================================
// blogMembersController.js
// Contrôleur Express : gestion des membres d'un blog.
//
// Rôle :
//   Permet d'inviter/upserter des membres sur un blog, de les lister
//   et de les retirer. Chaque action sensible est journalisée via l'audit log.
//
// Architecture Express :
//   req (Request)  : objet entrant — params URL, body JSON, req.user (utilisateur connecté)
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// req.user : injecté par le middleware d'authentification (auth.js → protect())
//   → Contient l'utilisateur connecté { id, username, role, globalRole, ... }
//   → Utilisé ici pour l'audit log (actor_user_id = l'admin/owner qui agit)
//
// req.params : segments dynamiques de l'URL
//   → req.params.blogId : id du blog dans /blogs/:blogId/members
//   → req.params.userId : id du membre dans /blogs/:blogId/members/:userId
//
// req.body : corps JSON de la requête (données envoyées par le client)
//
// Codes HTTP :
//   200 OK         : liste retournée avec succès (implicite via res.status(200))
//   204 No Content : opération réussie sans corps de réponse (upsert / remove)
//   400 Bad Request : données manquantes ou invalides (user_id absent)
//   403 Forbidden   : action non autorisée (transfert de propriété refusé ici)
//   500 Server Err  : erreur SQL ou système inattendue
//
// Exports : browseByBlog, inviteOrUpsert, remove
// ============================================================

// Importation de l'objet models — centralise tous les managers BDD
// Utilisé ici : models.blogMembers, models.auditLogs
const models = require("../models");

/* ----------------------------------------------------------------
 * browseByBlog(req, res)
 * Route : GET /api/blogs/:blogId/members
 * Retourne la liste de tous les membres actifs du blog spécifié.
 *
 * req.params.blogId : id du blog dans le segment :blogId de l'URL
 * findByBlog(blogId) → SELECT * FROM blog_members WHERE blog_id = ?
 * ([rows]) : destructuration du résultat MySQL [[rows], fields]
 * res.status(200).json(rows) : retourne la liste avec HTTP 200 explicite
 * ---------------------------------------------------------------- */
const browseByBlog = async (req, res) => {
  try {
    // req.params.blogId = id du blog extrait du segment :blogId de l'URL
    // findByBlog() retourne les membres avec leurs infos utilisateur jointes
    const [rows] = await models.blogMembers.findByBlog(req.params.blogId);
    return res.status(200).json(rows); // HTTP 200 OK avec la liste des membres
  } catch (error) {
    console.error(error); // Log de l'erreur SQL dans les logs serveur
    return res.status(500).json({ status: "error", message: "Erreur serveur." }); // HTTP 500
  }
};

/* ----------------------------------------------------------------
 * inviteOrUpsert(req, res)
 * Route : POST /api/blogs/:blogId/members
 * Invite un utilisateur sur un blog ou met à jour son rôle/statut si déjà membre.
 * "Upsert" = INSERT si n'existe pas, UPDATE si déjà présent (INSERT ON DUPLICATE KEY UPDATE).
 *
 * req.body.user_id : id de l'utilisateur à inviter (obligatoire)
 * req.body.role    : rôle attribué au membre (défaut : "editor")
 *   → Valeurs autorisées : "editor", "moderator" (pas "owner" ici)
 * req.body.status  : statut du membre (défaut : "active")
 * req.params.blogId : id du blog cible dans l'URL
 *
 * Garde-fou : le rôle "owner" est interdit ici (transfert via route dédiée uniquement)
 *
 * models.auditLogs.insert() : enregistre l'action dans la table audit_logs
 *   → Permet de savoir qui a fait quoi, quand, sur quelle ressource
 *
 * HTTP 204 No Content : opération réussie sans données à retourner (sendStatus)
 * ---------------------------------------------------------------- */
const inviteOrUpsert = async (req, res) => {
  // On destructure les champs du body avec des valeurs par défaut
  const { role = "editor", status = "active", user_id } = req.body;

  // Validation : user_id est obligatoire pour identifier le membre à inviter
  if (!user_id) {
    // HTTP 400 Bad Request : le client a oublié de fournir user_id dans le body
    return res.status(400).json({ status: "fail", message: "user_id est requis." });
  }

  // Garde-fou : on interdit l'attribution du rôle "owner" via cette route
  // Le transfert de propriété doit passer par une route dédiée sécurisée
  if (role === "owner") {
    // HTTP 403 Forbidden : action non autorisée via cette route
    return res.status(403).json({
      status: "error",
      message: "Le transfert de propriété doit passer par une route dédiée."
    });
  }

  try {
    // upsert() → INSERT INTO blog_members (...) ON DUPLICATE KEY UPDATE role=?, status=?
    // Number() : conversion de la string de l'URL en entier (req.params est toujours string)
    await models.blogMembers.upsert({
      blog_id: Number(req.params.blogId), // Id du blog depuis le segment :blogId de l'URL
      user_id: Number(user_id),           // Id de l'utilisateur à inviter (depuis le body)
      role,                               // Rôle attribué au membre (défaut: "editor")
      status                              // Statut du membre (défaut: "active")
    });

    // On journalise l'action dans l'audit log pour la traçabilité
    await models.auditLogs.insert({
      actor_user_id: req.user.id,          // Qui a effectué l'action (admin/owner connecté)
      target_type: "blog_member",          // Type de ressource affectée
      target_id: Number(user_id),          // Id du membre ciblé
      action: "blog_member:upsert",        // Nom de l'action pour l'audit
      metadata_json: { blog_id: Number(req.params.blogId), role, status } // Contexte de l'action
    });

    return res.sendStatus(204); // HTTP 204 No Content : opération réussie
  } catch (error) {
    console.error(error); // Log de l'erreur SQL
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

/* ----------------------------------------------------------------
 * remove(req, res)
 * Route : DELETE /api/blogs/:blogId/members/:userId
 * Retire un membre d'un blog.
 *
 * req.params.blogId : id du blog dans le segment :blogId de l'URL
 * req.params.userId : id du membre à supprimer dans le segment :userId de l'URL
 * req.user.id       : id de l'administrateur qui effectue l'action (pour l'audit)
 *
 * models.blogMembers.removeMember() → DELETE FROM blog_members WHERE blog_id=? AND user_id=?
 * models.auditLogs.insert()         → Journalisation de la suppression
 * HTTP 204 No Content               → Suppression réussie sans corps de réponse
 * ---------------------------------------------------------------- */
const remove = async (req, res) => {
  try {
    // Supprime le membre du blog en base de données
    // req.params.blogId = id du blog, req.params.userId = id du membre à retirer
    await models.blogMembers.removeMember(req.params.blogId, req.params.userId);

    // Journalisation de la suppression dans l'audit log
    await models.auditLogs.insert({
      actor_user_id: req.user.id,               // Qui a effectué la suppression
      target_type: "blog_member",               // Type de ressource affectée
      target_id: Number(req.params.userId),     // Id du membre supprimé
      action: "blog_member:remove",             // Nom de l'action pour la traçabilité
      metadata_json: { blog_id: Number(req.params.blogId) } // Contexte : quel blog
    });
    return res.sendStatus(204); // HTTP 204 No Content : suppression réussie
  } catch (error) {
    console.error(error); // Log de l'erreur côté serveur
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// Exportation des fonctions pour le router (backend/src/routes/blogMembers.js)
module.exports = {
  browseByBlog,   // GET    /blogs/:blogId/members           → liste les membres du blog
  inviteOrUpsert, // POST   /blogs/:blogId/members           → invite ou met à jour un membre
  remove          // DELETE /blogs/:blogId/members/:userId   → retire un membre du blog
};
