// Importation de l'index des modèles pour interroger la base de données
const models = require("../models");

// Fonction utilitaire : génère une réponse HTTP 403 Forbidden avec un message personnalisable
// Centralise la logique de réponse d'accès interdit pour éviter les duplications
const forbidden = (res, message = "Accès interdit : rôle insuffisant.") =>
  res.status(403).json({ status: "error", message });

// Fonction utilitaire : génère une réponse HTTP 404 Not Found avec un message personnalisable
const notFound = (res, message) =>
  res.status(404).json({ status: "error", message });

// Middleware : autorise l'accès si l'utilisateur est admin global, admin applicatif,
// ou si l'id de la ressource dans l'URL correspond à l'id de l'utilisateur connecté (accès à soi-même)
const isSelfOrAdmin = (req, res, next) => {
  if (
    req.user.role === "admin" ||             // L'utilisateur est admin dans le contexte applicatif
    req.user.globalRole === "admin" ||       // L'utilisateur est admin global de la plateforme
    Number(req.params.id) === Number(req.user.id) // Ou il accède à sa propre ressource (:id = son id)
  ) {
    return next(); // Accès accordé : on passe au middleware suivant
  }

  // Accès refusé : l'utilisateur n'est ni admin ni propriétaire de la ressource demandée
  return forbidden(res, "Accès interdit à cet utilisateur.");
};

// Middleware asynchrone : vérifie que l'utilisateur est admin ou propriétaire du blog ciblé
// Utilisé pour protéger les routes de modification/suppression d'un blog
const isBlogOwnerOrAdmin = async (req, res, next) => {
  // Court-circuit : les admins ont un accès total à tous les blogs
  if (req.user.role === "admin") {
    return next();
  }

  try {
    // Récupération du blog en base de données via l'id passé dans l'URL (:id)
    const [rows] = await models.blog.find(req.params.id);
    const blog = rows[0]; // Premier (et unique) résultat de la requête SQL

    // Si le blog n'existe pas en base de données, on retourne une erreur 404
    if (!blog) {
      return notFound(res, "Blog introuvable.");
    }

    // Vérification que l'utilisateur connecté est bien le propriétaire (owner) du blog
    // Conversion en Number pour éviter les comparaisons de types mixtes (string vs number)
    if (Number(blog.owner_id) !== Number(req.user.id)) {
      return forbidden(res, "Accès interdit à ce blog.");
    }

    // Attachement du blog résolu à req.resource pour éviter une seconde requête SQL dans le contrôleur
    req.resource = { ...(req.resource || {}), blog };
    return next(); // Accès accordé : l'utilisateur est bien le propriétaire du blog
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// Middleware asynchrone : vérifie les droits d'accès sur un article (post)
// Autorisations : admin global, owner du blog hébergeant l'article, ou éditeur auteur de l'article
const isPostOwnerOrAdmin = async (req, res, next) => {
  // Court-circuit : les admins peuvent modifier/supprimer tout article
  if (req.user.role === "admin") {
    return next();
  }

  try {
    // Récupération de l'article avec les informations du blog parent (notamment blog_owner_id)
    const [rows] = await models.posts.findWithBlog(req.params.id);
    const post = rows[0];

    // Article non trouvé en base de données : retour 404
    if (!post) {
      return notFound(res, "Article introuvable.");
    }

    // Vérifie si l'utilisateur connecté est le propriétaire du blog qui héberge l'article
    const isBlogOwner = Number(post.blog_owner_id) === Number(req.user.id);
    // Vérifie si l'utilisateur connecté est l'auteur direct de l'article
    const isAuthor = Number(post.author_id) === Number(req.user.id);

    // Un owner du blog peut modifier ou supprimer n'importe quel article de son blog
    if (req.user.role === "owner" && isBlogOwner) {
      return next();
    }

    // Un éditeur ne peut modifier que ses propres articles (ceux qu'il a écrits)
    if (req.user.role === "editor" && isAuthor) {
      return next();
    }

    // Ni owner du blog ni auteur de l'article : accès refusé
    return forbidden(res, "Accès interdit à cet article.");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// Middleware asynchrone : vérifie qu'un utilisateur est autorisé à créer un article dans un blog donné
// Le blog cible est transmis via req.body.blog_id (corps de la requête POST)
const canCreatePostInBlog = async (req, res, next) => {
  // Les admins peuvent créer des articles dans n'importe quel blog
  if (req.user.role === "admin") {
    return next();
  }

  try {
    // Récupération du blog cible depuis son identifiant transmis dans le corps de la requête
    const [rows] = await models.blog.find(req.body.blog_id);
    const blog = rows[0];

    // Blog non trouvé en base de données : retour 404
    if (!blog) {
      return notFound(res, "Blog introuvable.");
    }

    // Un owner ne peut créer un article que dans son propre blog (pas dans les blogs des autres)
    if (req.user.role === "owner" && Number(blog.owner_id) !== Number(req.user.id)) {
      return forbidden(res, "AccÃ¨s interdit Ã  ce blog.");
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// Middleware asynchrone : vérifie qu'un utilisateur est autorisé à supprimer un article donné
// Seul l'owner du blog hébergeant l'article peut supprimer (hors admin)
const canDeletePost = async (req, res, next) => {
  // Les admins peuvent supprimer n'importe quel article
  if (req.user.role === "admin") {
    return next();
  }

  try {
    // Récupération de l'article avec les informations du blog parent
    const [rows] = await models.posts.findWithBlog(req.params.id);
    const post = rows[0];

    // Article non trouvé en base de données : retour 404
    if (!post) {
      return notFound(res, "Article introuvable.");
    }

    // L'owner du blog peut supprimer tout article publié dans son blog
    if (req.user.role === "owner" && Number(post.blog_owner_id) === Number(req.user.id)) {
      return next();
    }

    // Accès refusé pour tous les autres rôles (éditeurs, modérateurs, etc.)
    return forbidden(res, "Accès interdit à cet article.");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// Middleware asynchrone : vérifie qu'un utilisateur peut modérer (approuver, supprimer) un commentaire
// Autorisations : admin global, modérateur global, ou owner du blog où est publié le commentaire
const canModerateComment = async (req, res, next) => {
  // Court-circuit : admins et modérateurs globaux ont accès direct à la modération
  if (["admin", "moderator"].includes(req.user.role)) {
    return next();
  }

  // Si l'utilisateur n'est pas owner, il ne dispose pas du droit de modération sur les commentaires
  if (req.user.role !== "owner") {
    return forbidden(res, "Accès interdit à ce commentaire.");
  }

  try {
    // Récupération du commentaire avec les données de l'article et du blog parent
    // Nécessaire pour remonter jusqu'à blog_owner_id et vérifier la propriété du blog
    const [rows] = await models.comments.findWithPostAndBlog(req.params.id);
    const comment = rows[0];

    // Commentaire non trouvé en base de données : retour 404
    if (!comment) {
      return notFound(res, "Commentaire introuvable.");
    }

    // L'owner ne peut modérer que les commentaires postés sur son propre blog
    // Pas de modération croisée entre les blogs
    if (Number(comment.blog_owner_id) !== Number(req.user.id)) {
      return forbidden(res, "Accès interdit à ce commentaire.");
    }

    // Accès accordé : l'owner modère un commentaire de son propre blog
    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// Export de tous les middlewares de permissions pour utilisation dans les fichiers de routes
module.exports = {
  canCreatePostInBlog,  // Vérification avant création d'un article
  canDeletePost,        // Vérification avant suppression d'un article
  canModerateComment,   // Vérification avant modération d'un commentaire
  isBlogOwnerOrAdmin,   // Vérification de propriété d'un blog
  isPostOwnerOrAdmin,   // Vérification de propriété d'un article
  isSelfOrAdmin,        // Vérification d'accès à sa propre ressource ou rôle admin
};
