const models = require("../models");

const browse = async (req, res) => {
  try {
    const query =
      req.user.globalRole === "admin"
        ? models.reports.findAll()
        : models.reports.findByBlog(req.blogAccess.blogId);
    const [rows] = await query;
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

const add = async (req, res) => {
  const { blog_id, target_type, target_id, reason, details } = req.body;

  if (!target_type || !target_id || !reason) {
    return res.status(400).json({ status: "fail", message: "target_type, target_id et reason sont requis." });
  }

  try {
    const [result] = await models.reports.insert({
      blog_id,
      reporter_user_id: req.user?.id || null,
      target_type,
      target_id,
      reason,
      details,
    });
    return res.location(`/reports/${result.insertId}`).sendStatus(201);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

const moderate = async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "reviewed", "rejected", "resolved"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ status: "fail", message: "Statut de signalement invalide." });
  }

  try {
    await models.reports.updateStatus(req.params.id, status, req.user.id);
    await models.auditLogs.insert({
      actor_user_id: req.user.id,
      target_type: "report",
      target_id: Number(req.params.id),
      action: "report:moderate",
      metadata_json: { status },
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

module.exports = {
  add,
  browse,
  moderate,
};
