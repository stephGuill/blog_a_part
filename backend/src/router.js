const express = require("express");

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

const router = express.Router();

router.use("/api/auth", authRoutes);
router.use("/api/admin/users", adminUsersRoutes);
router.use("/api/users", usersRoutes);
router.use("/api/themes", themesRoutes);
router.use("/api/posts", postsRoutes);
router.use("/api/blogs", blogsRoutes);
router.use("/api/blogs/:blogId/members", blogMembersRoutes);
router.use("/api/categories", categoriesRoutes);
router.use("/api/comments", commentsRoutes);
router.use("/api/media", mediaRoutes);
router.use("/api/owner/builder", ownerBuilderRoutes);
router.use("/api/items", itemsRoutes);
router.use("/api/dashboard", dashboardRoutes);
router.use("/api/reports", reportsRoutes);
router.use("/users", usersRoutes);
router.use("/themes", themesRoutes);
router.use("/posts", postsRoutes);
router.use("/blogs", blogsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/comments", commentsRoutes);
router.use("/media", mediaRoutes);
router.use("/items", itemsRoutes);

module.exports = router;
