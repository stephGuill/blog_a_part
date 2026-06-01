const models = require("../models");

const forbidden = (res, message = "Accès interdit : rôle insuffisant.") =>
  res.status(403).json({ status: "error", message });

const notFound = (res, message) =>
  res.status(404).json({ status: "error", message });

const isSelfOrAdmin = (req, res, next) => {
  if (
    req.user.role === "admin" ||
    req.user.globalRole === "admin" ||
    Number(req.params.id) === Number(req.user.id)
  ) {
    return next();
  }

  return forbidden(res, "Accès interdit à cet utilisateur.");
};

const isBlogOwnerOrAdmin = async (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  try {
    const [rows] = await models.blog.find(req.params.id);
    const blog = rows[0];

    if (!blog) {
      return notFound(res, "Blog introuvable.");
    }

    if (Number(blog.owner_id) !== Number(req.user.id)) {
      return forbidden(res, "Accès interdit à ce blog.");
    }

    req.resource = { ...(req.resource || {}), blog };
    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

const isPostOwnerOrAdmin = async (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  try {
    const [rows] = await models.posts.findWithBlog(req.params.id);
    const post = rows[0];

    if (!post) {
      return notFound(res, "Article introuvable.");
    }

    const isBlogOwner = Number(post.blog_owner_id) === Number(req.user.id);
    const isAuthor = Number(post.author_id) === Number(req.user.id);

    if (req.user.role === "owner" && isBlogOwner) {
      return next();
    }

    if (req.user.role === "editor" && isAuthor) {
      return next();
    }

    return forbidden(res, "Accès interdit à cet article.");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

const canCreatePostInBlog = async (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  try {
    const [rows] = await models.blog.find(req.body.blog_id);
    const blog = rows[0];

    if (!blog) {
      return notFound(res, "Blog introuvable.");
    }

    if (req.user.role === "owner" && Number(blog.owner_id) !== Number(req.user.id)) {
      return forbidden(res, "AccÃ¨s interdit Ã  ce blog.");
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

const canDeletePost = async (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  try {
    const [rows] = await models.posts.findWithBlog(req.params.id);
    const post = rows[0];

    if (!post) {
      return notFound(res, "Article introuvable.");
    }

    if (req.user.role === "owner" && Number(post.blog_owner_id) === Number(req.user.id)) {
      return next();
    }

    return forbidden(res, "Accès interdit à cet article.");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

const canModerateComment = async (req, res, next) => {
  if (["admin", "moderator"].includes(req.user.role)) {
    return next();
  }

  if (req.user.role !== "owner") {
    return forbidden(res, "Accès interdit à ce commentaire.");
  }

  try {
    const [rows] = await models.comments.findWithPostAndBlog(req.params.id);
    const comment = rows[0];

    if (!comment) {
      return notFound(res, "Commentaire introuvable.");
    }

    if (Number(comment.blog_owner_id) !== Number(req.user.id)) {
      return forbidden(res, "Accès interdit à ce commentaire.");
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

module.exports = {
  canCreatePostInBlog,
  canDeletePost,
  canModerateComment,
  isBlogOwnerOrAdmin,
  isPostOwnerOrAdmin,
  isSelfOrAdmin,
};
