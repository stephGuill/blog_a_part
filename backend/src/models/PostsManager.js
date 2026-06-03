// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// PostsManager.js
// Manager pour la table `posts` : articles de blog.
// Responsabilité : fournir les opérations CRUD et les requêtes métier sur les articles.
// Les méthodes `find(id)`, `findAll()` et `delete(id)` sont héritées d'AbstractManager.

class PostsManager extends AbstractManager {
  // Constructeur : déclare la table `posts` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table SQL.
    super({ table: "posts" });
  }

  // insert(posts) : insère un nouvel article dans la table.
  //
  // Paramètre `posts` : objet JS avec les propriétés suivantes :
  //   - blog_id      : id du blog auquel l'article appartient
  //   - author_id    : id de l'utilisateur auteur de l'article
  //   - title        : titre de l'article
  //   - slug         : identifiant URL-friendly unique dans le blog (ex: "mon-article")
  //   - excerpt      : résumé court de l'article (affiché dans les listes)
  //   - content      : corps complet de l'article (HTML ou Markdown)
  //   - status       : statut de publication ('draft', 'published', 'pending', 'archived')
  //   - published_at : date de publication (null si non encore publié)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(posts) {
    // Requête INSERT paramétrée pour éviter l'injection SQL.
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, author_id, title, slug, excerpt, content, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      // Ordre des paramètres correspondant exactement aux placeholders (?) de la requête SQL.
      [posts.blog_id, posts.author_id, posts.title, posts.slug, posts.excerpt, posts.content, posts.status, posts.published_at]
    );
  }

  // update(posts) : met à jour un article existant identifié par son id.
  //
  // Paramètre `posts` : même structure que pour insert, plus le champ :
  //   - id : identifiant de l'article à modifier (clause WHERE)
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  update(posts) {
    // SET : mise à jour de tous les champs modifiables.
    // WHERE id = ? : cible précisément l'article sans affecter les autres.
    return this.database.query(
      `UPDATE ${this.table} SET blog_id = ?, author_id = ?, title = ?, slug = ?, excerpt = ?, content = ?, status = ?, published_at = ? WHERE id = ?`,
      // L'id est en dernier car il correspond au dernier placeholder de la clause WHERE.
      [posts.blog_id, posts.author_id, posts.title, posts.slug, posts.excerpt, posts.content, posts.status, posts.published_at, posts.id]
    );
  }

  // findWithBlog(id) : récupère un article enrichi de l'id du propriétaire du blog.
  //
  // Paramètre :
  //   - id : identifiant de l'article recherché
  //
  // Retour : promesse résolue avec l'article et la colonne `blog_owner_id` ajoutée.
  //          Utile pour vérifier si l'utilisateur courant est propriétaire du blog.
  findWithBlog(id) {
    // JOIN blogs b     : jointure sur la table blogs pour récupérer le propriétaire.
    // ON b.id = p.blog_id : condition de jointure article → blog.
    // b.owner_id AS blog_owner_id : expose l'id du propriétaire du blog dans les résultats.
    return this.database.query(`SELECT p.*, b.owner_id AS blog_owner_id FROM ${this.table} p JOIN blogs b ON b.id = p.blog_id WHERE p.id = ?`, [id]);
  }

  // findByAuthor(authorId) : liste les articles rédigés par un auteur donné.
  //
  // Paramètre :
  //   - authorId : id de l'auteur dont on veut les articles
  //
  // Retour : promesse résolue avec les articles triés du plus récemment modifié au plus ancien.
  findByAuthor(authorId) {
    // ORDER BY updated_at DESC : les articles récents apparaissent en premier.
    return this.database.query(`SELECT * FROM ${this.table} WHERE author_id = ? ORDER BY updated_at DESC`, [authorId]);
  }

  // findByBlogOwner(ownerId) : récupère les articles des blogs appartenant à un propriétaire.
  //
  // Paramètre :
  //   - ownerId : id du propriétaire des blogs
  //
  // Retour : promesse résolue avec tous les articles des blogs de ce propriétaire.
  findByBlogOwner(ownerId) {
    // JOIN blogs b   : jointure pour filtrer par le propriétaire du blog parent.
    // ON b.id = p.blog_id : condition de jointure article → blog.
    // WHERE b.owner_id = ? : filtre sur le propriétaire du blog.
    // ORDER BY p.updated_at DESC : articles récents en premier.
    return this.database.query(`SELECT p.* FROM ${this.table} p JOIN blogs b ON b.id = p.blog_id WHERE b.owner_id = ? ORDER BY p.updated_at DESC`, [ownerId]);
  }

  // findAccessibleByUser(userId) : récupère les articles accessibles via les adhésions aux blogs.
  //
  // Paramètre :
  //   - userId : id de l'utilisateur dont on veut les articles accessibles
  //
  // Retour : promesse résolue avec les articles des blogs dont l'utilisateur est membre actif.
  findAccessibleByUser(userId) {
    // JOIN blog_members bm : jointure sur la table des membres.
    // ON bm.blog_id = p.blog_id : condition de jointure article → membre via le blog.
    // bm.status = 'active' : seuls les membres actifs ont accès.
    // DISTINCT : évite les doublons si l'utilisateur est plusieurs fois membre du même blog.
    // ORDER BY p.updated_at DESC : articles récents en premier.
    return this.database.query(`SELECT DISTINCT p.* FROM ${this.table} p JOIN blog_members bm ON bm.blog_id = p.blog_id WHERE bm.user_id = ? AND bm.status = 'active' ORDER BY p.updated_at DESC`, [userId]);
  }

  // findPublishedPublic() : récupère tous les articles publiés des blogs publics et actifs.
  //
  // Aucun paramètre requis.
  // Retour : promesse résolue avec les articles visibles publiquement, triés par date de publication.
  findPublishedPublic() {
    // JOIN blogs b       : jointure pour vérifier l'état du blog parent.
    // ON b.id = p.blog_id : condition de jointure article → blog.
    // p.status = 'published' : seuls les articles publiés sont retournés.
    // b.is_public = TRUE     : seuls les articles des blogs publics sont inclus.
    // b.status = 'active'    : seuls les blogs actifs (non suspendus/archivés) sont inclus.
    // ORDER BY p.published_at DESC, p.updated_at DESC : tri par date de publication puis par date de modification.
    return this.database.query(
      `SELECT p.* FROM ${this.table} p JOIN blogs b ON b.id = p.blog_id WHERE p.status = 'published' AND b.is_public = TRUE AND b.status = 'active' ORDER BY p.published_at DESC, p.updated_at DESC`
    );
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = PostsManager;
