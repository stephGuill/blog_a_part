// router.js
// Regroupe et monte toutes les routes de l'application Express.
// Chaque route est importée depuis `backend/src/routes/*` et montée sur
// un chemin racine clair. Ce fichier est volontairement simple : sa
// responsabilité est d'assembler les routes et de les exporter.

const express = require("express");

// Importer les routeurs modulaires (une par ressource/feature)
const adminUsersRoutes = require("./routes/adminUsers");
const authRoutes = require("./routes/auth");
const blogsRoutes = require("./routes/blogs");
const categoriesRoutes = require("./routes/categories");
const commentsRoutes = require("./routes/comments");
const dashboardRoutes = require("./routes/dashboard");
const blogMembersRoutes = require("./routes/blogMembers");
const itemsRoutes = require("./routes/items");
const mediaRoutes = require("./routes/media");
const ownerBuilderRoutes = require("./routes/ownerBuilder");
const postsRoutes = require("./routes/posts");
const reportsRoutes = require("./routes/reports");
const themesRoutes = require("./routes/themes");
const usersRoutes = require("./routes/users");

// Créer une instance de router Express qui sera exportée
const router = express.Router();

// Monter les routes API sous /api/* pour séparer l'API des pages publiques
router.use("/api/auth", authRoutes); // routes d'authentification
router.use("/api/admin/users", adminUsersRoutes); // administration utilisateurs
router.use("/api/users", usersRoutes); // opérations utilisateurs
router.use("/api/themes", themesRoutes); // thèmes/template
router.use("/api/posts", postsRoutes); // articles
router.use("/api/blogs", blogsRoutes); // blogs
router.use("/api/blogs/:blogId/members", blogMembersRoutes); // membres d'un blog
router.use("/api/categories", categoriesRoutes); // catégories
router.use("/api/comments", commentsRoutes); // commentaires
router.use("/api/media", mediaRoutes); // médiathèque
router.use("/api/owner/builder", ownerBuilderRoutes); // builder (owner)
router.use("/api/items", itemsRoutes); // items génériques
router.use("/api/dashboard", dashboardRoutes); // endpoints dashboard
router.use("/api/reports", reportsRoutes); // signalements

// Routers mountés sans /api : prise en charge des routes publiques (facultatif)
router.use("/users", usersRoutes);
router.use("/themes", themesRoutes);
router.use("/posts", postsRoutes);
router.use("/blogs", blogsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/comments", commentsRoutes);
router.use("/media", mediaRoutes);
router.use("/items", itemsRoutes);

// Exporter le routeur assemblé
module.exports = router;
