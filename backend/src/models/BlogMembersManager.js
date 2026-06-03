// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// BlogMembersManager.js
// Manager pour la table `blog_members`.
// Responsabilité : gérer les appartenances des utilisateurs aux blogs
// (insertion, mise à jour de rôle, suppression logique, et diverses requêtes de recherche).
//
// La table `blog_members` est une table de liaison entre `blogs` et `users`
// avec les colonnes : blog_id, user_id, role, status.

class BlogMembersManager extends AbstractManager {
  // Constructeur : déclare la table `blog_members` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table SQL.
    super({ table: "blog_members" });
  }

  // insert(member) : ajoute un nouvel utilisateur comme membre d'un blog.
  //
  // Paramètre `member` : objet JS avec les propriétés suivantes :
  //   - blog_id : id du blog auquel l'utilisateur est ajouté
  //   - user_id : id de l'utilisateur à ajouter
  //   - role    : rôle attribué (ex: 'owner', 'editor', 'viewer')
  //   - status  : statut de l'adhésion ('active' par défaut si non fourni)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(member) {
    // Requête INSERT paramétrée pour créer l'entrée de membre.
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, user_id, role, status) VALUES (?, ?, ?, ?)`,
      // status utilise 'active' comme valeur par défaut si non fourni
      [member.blog_id, member.user_id, member.role, member.status || "active"]
    );
  }

  // upsert(member) : insère un membre ou met à jour son rôle/statut s'il existe déjà.
  //
  // Utilise la clause `ON DUPLICATE KEY UPDATE` de MySQL : si la clé unique
  // (blog_id, user_id) existe déjà, seuls le rôle et le statut sont mis à jour.
  //
  // Paramètre `member` : même structure que pour `insert`.
  // Retour : promesse résolue avec le résultat INSERT ou UPDATE.
  upsert(member) {
    // ON DUPLICATE KEY UPDATE : mise à jour automatique en cas de doublon sur la clé unique.
    // VALUES(role) : référence la valeur proposée dans le INSERT (syntaxe MySQL).
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, user_id, role, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role), status = VALUES(status)`,
      // Paramètres dans l'ordre des placeholders de la requête.
      [member.blog_id, member.user_id, member.role, member.status || "active"]
    );
  }

  // findActiveByUserAndBlog(userId, blogId) : vérifie si un utilisateur est membre actif d'un blog.
  //
  // Paramètres :
  //   - userId : id de l'utilisateur à rechercher
  //   - blogId : id du blog concerné
  //
  // Retour : promesse résolue avec un tableau de 0 ou 1 ligne.
  //          Si vide, l'utilisateur n'est pas membre actif.
  findActiveByUserAndBlog(userId, blogId) {
    // status = 'active' : filtre pour n'obtenir que les membres dont l'adhésion est active.
    return this.database.query(`SELECT * FROM ${this.table} WHERE user_id = ? AND blog_id = ? AND status = 'active'`, [userId, blogId]);
  }

  // findByBlog(blogId) : liste tous les membres d'un blog avec leurs informations utilisateur.
  //
  // Paramètre :
  //   - blogId : id du blog dont on veut la liste des membres
  //
  // Retour : promesse résolue avec les lignes enrichies (colonnes de blog_members
  //          + username, email, full_name de la table users).
  findByBlog(blogId) {
    // JOIN users u : jointure sur la table users pour récupérer les infos de l'utilisateur.
    // ON u.id = bm.user_id : condition de jointure entre les deux tables.
    // ORDER BY bm.role, u.username : tri par rôle puis par nom d'utilisateur.
    return this.database.query(
      `SELECT bm.*, u.username, u.email, u.full_name FROM ${this.table} bm JOIN users u ON u.id = bm.user_id WHERE bm.blog_id = ? ORDER BY bm.role, u.username`,
      // Paramètre sécurisé : l'id du blog remplace le placeholder ?
      [blogId]
    );
  }

  // findByUser(userId) : liste tous les blogs auxquels un utilisateur appartient activement.
  //
  // Paramètre :
  //   - userId : id de l'utilisateur dont on veut la liste des blogs
  //
  // Retour : promesse résolue avec les entrées de blog_members enrichies
  //          du nom et du slug de chaque blog.
  findByUser(userId) {
    // JOIN blogs b : jointure sur la table blogs pour récupérer les métadonnées du blog.
    // ON b.id = bm.blog_id : condition de jointure entre blog_members et blogs.
    // bm.status = 'active' : seuls les membres actifs sont retournés.
    // b.name AS blog_name : alias pour clarifier le nom du blog dans les résultats.
    // b.slug AS blog_slug : alias pour l'identifiant URL du blog.
    // ORDER BY b.updated_at DESC : les blogs récemment modifiés apparaissent en premier.
    return this.database.query(
      `SELECT bm.*, b.name AS blog_name, b.slug AS blog_slug FROM ${this.table} bm JOIN blogs b ON b.id = bm.blog_id WHERE bm.user_id = ? AND bm.status = 'active' ORDER BY b.updated_at DESC`,
      // Paramètre sécurisé : l'id utilisateur remplace le placeholder ?
      [userId]
    );
  }

  // updateRole(blogId, userId, role) : modifie le rôle d'un membre dans un blog.
  //
  // Paramètres :
  //   - blogId : id du blog concerné
  //   - userId : id de l'utilisateur dont le rôle change
  //   - role   : nouveau rôle à attribuer (ex: 'editor', 'viewer')
  //
  // Note : remet également le statut à 'active' pour réactiver un membre suspendu.
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateRole(blogId, userId, role) {
    // SET role = ?, status = 'active' : met à jour le rôle et force le statut actif.
    // WHERE blog_id = ? AND user_id = ? : cible précisément l'entrée de membre.
    return this.database.query(`UPDATE ${this.table} SET role = ?, status = 'active' WHERE blog_id = ? AND user_id = ?`, [role, blogId, userId]);
  }

  // removeMember(blogId, userId) : retire un membre d'un blog (suppression logique).
  //
  // Paramètres :
  //   - blogId : id du blog concerné
  //   - userId : id de l'utilisateur à retirer
  //
  // Note : pas de DELETE physique — on utilise un soft-delete en passant le statut
  // à 'removed'. L'enregistrement reste en base pour l'historique.
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  removeMember(blogId, userId) {
    // SET status = 'removed' : marquage logique ; la ligne n'est pas supprimée physiquement.
    return this.database.query(`UPDATE ${this.table} SET status = 'removed' WHERE blog_id = ? AND user_id = ?`, [blogId, userId]);
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = BlogMembersManager;
