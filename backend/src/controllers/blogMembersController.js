const models = require("../models");

const browseByBlog = async (req, res) => {
  try {
    const [rows] = await models.blogMembers.findByBlog(req.params.blogId);
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

const inviteOrUpsert = async (req, res) => {
  const { role = "editor", status = "active", user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ status: "fail", message: "user_id est requis." });
  }

  if (role === "owner") {
    return res.status(403).json({
      status: "error",
      message: "Le transfert de propriété doit passer par une route dédiée.",
    });
  }

  try {
    await models.blogMembers.upsert({
      blog_id: Number(req.params.blogId),
      user_id: Number(user_id),
      role,
      status,
    });
    await models.auditLogs.insert({
      actor_user_id: req.user.id,
      target_type: "blog_member",
      target_id: Number(user_id),
      action: "blog_member:upsert",
      metadata_json: { blog_id: Number(req.params.blogId), role, status },
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

const remove = async (req, res) => {
  try {
    await models.blogMembers.removeMember(req.params.blogId, req.params.userId);
    await models.auditLogs.insert({
      actor_user_id: req.user.id,
      target_type: "blog_member",
      target_id: Number(req.params.userId),
      action: "blog_member:remove",
      metadata_json: { blog_id: Number(req.params.blogId) },
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

module.exports = {
  browseByBlog,
  inviteOrUpsert,
  remove,
};
