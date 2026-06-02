// dashboardController.js
// Contrôleur: endpoints de tableau de bord minimalistes pour différents rôles
// - Fournit des réponses factices/formatées pour les vues admin/owner/editor/moderator/user
// - Utilisé principalement côté front pour afficher des dashboards spécifiques
// adminStats(req,res): informations de tableau de bord pour les admins
const adminStats = (req, res) =>
  res.json({ status: "success", dashboard: "admin", user: req.user });

// ownerStats(req,res): aperçu limité pour propriétaires de blog
const ownerStats = (req, res) =>
  res.json({ status: "success", dashboard: "owner", user: req.user });

// editorStats(req,res): données pertinentes pour les éditeurs
const editorStats = (req, res) =>
  res.json({ status: "success", dashboard: "editor", user: req.user });

// moderatorStats(req,res): métriques et remarques pour modérateurs
const moderatorStats = (req, res) =>
  res.json({ status: "success", dashboard: "moderator", user: req.user });

// userStats(req,res): vue simplifiée pour utilisateur authentifié
const userStats = (req, res) =>
  res.json({ status: "success", dashboard: "user", user: req.user });

module.exports = {
  adminStats,
  editorStats,
  moderatorStats,
  ownerStats,
  userStats
};
