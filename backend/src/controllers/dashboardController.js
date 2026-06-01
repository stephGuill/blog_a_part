const adminStats = (req, res) =>
  res.json({ status: "success", dashboard: "admin", user: req.user });

const ownerStats = (req, res) =>
  res.json({ status: "success", dashboard: "owner", user: req.user });

const editorStats = (req, res) =>
  res.json({ status: "success", dashboard: "editor", user: req.user });

const moderatorStats = (req, res) =>
  res.json({ status: "success", dashboard: "moderator", user: req.user });

const userStats = (req, res) =>
  res.json({ status: "success", dashboard: "user", user: req.user });

module.exports = {
  adminStats,
  editorStats,
  moderatorStats,
  ownerStats,
  userStats,
};
