// blogsController.js
// Contrôleur : gestion des blogs (publique, privées, CRUD)
// - Gère la lecture publique, la lecture protégée par membership,
//   la création et la mise à jour de blogs. Utilise `slugify` pour les slugs.
const slugify = require("slugify");

const models = require("../models");
const { hasGlobalAdminAccess } = require("../utils/permissions");

// Liste ou filtre les blogs selon le scope (mine / public)
const browse = (req, res) => {
  const query = (() => {
    if (req.query.scope === "mine") {
      if (!req.user) {
        return Promise.resolve([[]]);
      }
      return hasGlobalAdminAccess(req.user) ? models.blog.findAll() : models.blog.findAccessibleByUser(req.user.id);
    }

    return models.blog.findPublic();
  })();

  query
    .then(([rows]) => res.send(rows))
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const read = async (req, res) => {
  try {
    const [rows] = await models.blog.find(req.params.id);
    const blog = rows[0];

    if (!blog) {
      return res.sendStatus(404);
    }

    if (blog.is_public || hasGlobalAdminAccess(req.user)) {
      return res.send(blog);
    }

    if (!req.user) {
      return res.status(403).json({ status: "error", message: "Ce blog est prive." });
    }

    const [memberRows] = await models.blogMembers.findActiveByUserAndBlog(req.user.id, blog.id);
    if (!memberRows[0]) {
      return res.status(403).json({ status: "error", message: "Acces reserve aux personnes invitees." });
    }

    return res.send(blog);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};

const edit = async (req, res) => {
  const blogId = parseInt(req.params.id, 10);

  try {
    const [rows] = await models.blog.find(blogId);
    const existingBlog = rows[0];

    if (!existingBlog) {
      return res.sendStatus(404);
    }

    // FR: On fusionne l'existant avec le body pour autoriser les updates partielles.
    // EN: Merge existing data with the body so partial updates do not erase fields.
    const blog = {
      ...existingBlog,
      ...req.body,
      id: blogId,
      is_public: Object.prototype.hasOwnProperty.call(req.body, "is_public")
        ? Boolean(req.body.is_public)
        : Boolean(existingBlog.is_public)
    };

    const [result] = await models.blog.update(blog);
    if (result.affectedRows === 0) {
      return res.sendStatus(404);
    }

    const [updatedRows] = await models.blog.find(blogId);
    return res.status(200).json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: "Ce slug est deja utilise par un autre blog."
      });
    }
    return res.sendStatus(500);
  }
};

const add = async (req, res) => {
  const cleanName = req.body.name?.trim();
  const cleanSlug = req.body.slug?.trim();
  const generatedSlug = slugify(cleanSlug || cleanName || "", { lower: true, strict: true });

  const blog = {
    ...req.body,
    owner_id: req.user.id,
    name: cleanName,
    slug: generatedSlug,
    description: req.body.description?.trim() || "",
    is_public: Boolean(req.body.is_public),
    status: req.body.status || "active"
  };

  try {
    if (!blog.name || !blog.slug) {
      return res.status(400).json({ status: "error", message: "Le nom du blog est obligatoire." });
    }

    const [ownerRows] = await models.users.find(blog.owner_id);
    if (!ownerRows[0]) {
      return res.status(400).json({ status: "error", message: "Owner not found" });
    }

    if (!blog.theme_id) {
      const [themeRows] = await models.themes.findAll();
      blog.theme_id = themeRows.find((theme) => theme.type === "blog")?.id || themeRows[0]?.id;
    }

    const [themeRows] = await models.themes.find(blog.theme_id);
    if (!themeRows[0]) {
      return res.status(400).json({ status: "error", message: "Theme not found" });
    }

    const [result] = await models.blog.insert(blog);
    await models.blogMembers.upsert({
      blog_id: result.insertId,
      user_id: req.user.id,
      role: "owner",
      status: "active"
    });
    await models.auditLogs.insert({
      actor_user_id: req.user.id,
      target_type: "blog",
      target_id: result.insertId,
      action: "blog:create",
      metadata_json: { slug: blog.slug, name: blog.name }
    });

    const [createdRows] = await models.blog.find(result.insertId);
    return res.location(`/blogs/${result.insertId}`).status(201).json(createdRows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: "Ce slug est deja utilise par un autre blog."
      });
    }
    return res.sendStatus(500);
  }
};

const destroy = (req, res) => {
  models.blog
    .delete(req.params.id)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

module.exports = {
  add,
  browse,
  destroy,
  edit,
  read
};
