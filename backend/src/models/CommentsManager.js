// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// CommentsManager.js
// Manager pour la table `comments`.
// Responsabilité : gérer les commentaires associés aux articles (posts).
// Supporte un workflow de modération via le champ `status`
// ('pending' = en attente, 'approved' = approuvé, 'spam' = spam, 'rejected' = rejeté).
// Les méthodes `find(id)`, `findAll()` et `delete(id)` sont héritées d'AbstractManager.

class CommentsManager extends AbstractManager {
  // Constructeur : déclare la table `comments` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table SQL.
    super({ table: "comments" });
  }

  // insert(comment) : ajoute un nouveau commentaire dans la table.
  //
  // Paramètre `comment` : objet JS avec les propriétés suivantes :
  //   - post_id      : id de l'article auquel ce commentaire est rattaché
  //   - parent_id    : id du commentaire parent pour les réponses (null si commentaire racine)
  //   - author_name  : nom affiché de l'auteur du commentaire
  //   - author_email : adresse e-mail de l'auteur (non affichée publiquement)
  //   - content      : texte du commentaire
  //   - status       : statut de modération ('pending' par défaut si non fourni)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(comment) {
    // parent_id || null : utilise null si parent_id n'est pas fourni (commentaire de niveau racine).
    // status || "pending" : par défaut en attente de modération pour éviter les spams automatiques.
    return this.database.query(
      `INSERT INTO ${this.table} (post_id, parent_id, author_name, author_email, content, status) VALUES (?, ?, ?, ?, ?, ?)`,
      // Tableau des valeurs dans l'ordre des placeholders de la requête SQL.
      [comment.post_id, comment.parent_id || null, comment.author_name, comment.author_email, comment.content, comment.status || "pending"]
    );
  }

  // update(comment) : met à jour le contenu et/ou le statut d'un commentaire existant.
  //
  // Paramètre `comment` : objet JS avec les propriétés suivantes :
  //   - content : nouveau texte du commentaire
  //   - status  : nouveau statut de modération
  //   - id      : identifiant du commentaire à modifier (clause WHERE)
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  update(comment) {
    // SET content = ?, status = ? : met à jour le contenu et le statut.
    // WHERE id = ? : cible précisément le commentaire à modifier.
    return this.database.query(`UPDATE ${this.table} SET content = ?, status = ? WHERE id = ?`, [comment.content, comment.status, comment.id]);
  }

  // findByPost(postId) : récupère uniquement les commentaires approuvés d'un article.
  //
  // Paramètre :
  //   - postId : id de l'article dont on veut les commentaires
  //
  // Retour : promesse résolue avec les commentaires approuvés triés par date de création.
  findByPost(postId) {
    // status = 'approved' : seuls les commentaires validés par la modération sont affichés.
    // ORDER BY created_at ASC : tri chronologique pour une lecture naturelle (du plus ancien au plus récent).
    return this.database.query(`SELECT * FROM ${this.table} WHERE post_id = ? AND status = 'approved' ORDER BY created_at ASC`, [postId]);
  }

  // findPending() : récupère la liste des commentaires en attente de modération.
  //
  // Aucun paramètre requis.
  // Retour : promesse résolue avec les commentaires en attente triés du plus récent au plus ancien.
  findPending() {
    // status = 'pending' : filtre uniquement les commentaires à modérer.
    // ORDER BY created_at DESC : les plus récents apparaissent en premier dans la file de modération.
    return this.database.query(`SELECT * FROM ${this.table} WHERE status = 'pending' ORDER BY created_at DESC`);
  }

  // findWithPostAndBlog(id) : récupère un commentaire enrichi des informations du post et du blog.
  //
  // Paramètre :
  //   - id : identifiant du commentaire recherché
  //
  // Retour : promesse résolue avec le commentaire enrichi de blog_id et blog_owner_id.
  //          Utile pour les vérifications de permission (ex: seul le propriétaire du blog peut modérer).
  findWithPostAndBlog(id) {
    // JOIN posts p      : jointure pour récupérer blog_id depuis l'article parent.
    // ON p.id = c.post_id : condition de jointure commentaire → article.
    // JOIN blogs b      : jointure pour récupérer le propriétaire du blog.
    // ON b.id = p.blog_id : condition de jointure article → blog.
    // p.blog_id         : id du blog auquel appartient l'article commenté.
    // b.owner_id AS blog_owner_id : id du propriétaire du blog (pour les permissions de modération).
    return this.database.query(
      `SELECT c.*, p.blog_id, b.owner_id AS blog_owner_id FROM ${this.table} c JOIN posts p ON p.id = c.post_id JOIN blogs b ON b.id = p.blog_id WHERE c.id = ?`,
      // Paramètre sécurisé : l'id du commentaire remplace le placeholder ?
      [id]
    );
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = CommentsManager;