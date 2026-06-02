const models = require("../models");
const { getPermissionsForBlogRole, hasGlobalAdminAccess } = require("../utils/permissions");

const forbidden = (res) =>
  res.status(403).json({ status: "error", message: "Accès interdit à ce blog." });

const resolveBlogId = async (req) => {
  if (req.params.blogId) return Number(req.params.blogId);
  if (req.body.blog_id) return Number(req.body.blog_id);

  if (req.params.id && req.baseUrl.includes("blogs")) {
    return Number(req.params.id);
  }

  if (req.params.id && req.baseUrl.includes("posts")) {
    const [rows] = await models.posts.findWithBlog(req.params.id);
    return rows[0]?.blog_id;
  }

  if (req.params.id && req.baseUrl.includes("comments")) {
    const [rows] = await models.comments.findWithPostAndBlog(req.params.id);
    return rows[0]?.blog_id;
  }

  if (req.params.id && req.baseUrl.includes("reports")) {
    const [rows] = await models.reports.find(req.params.id);
    return rows[0]?.blog_id;
  }

  return null;
};

const requireBlogPermission = (permission) => async (req, res, next) => {
  if (hasGlobalAdminAccess(req.user)) {
    return next();
  }

  try {
    const blogId = await resolveBlogId(req);

    if (!blogId) {
      return forbidden(res);
    }

    const [rows] = await models.blogMembers.findActiveByUserAndBlog(req.user.id, blogId);
    const membership = rows[0];

    if (!membership) {
      return forbidden(res);
    }

    const permissions = getPermissionsForBlogRole(membership.role);

    if (!permissions.includes(permission)) {
      return forbidden(res);
    }

    req.blogAccess = { blogId, membership, permissions };
    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

module.exports = requireBlogPermission;
