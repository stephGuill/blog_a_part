const express = require ('express');
const blogsController = require ('../controllers/blogsController');
const { optionalProtect, protect } = require("../middlewares/auth");
const requireBlogPermission = require("../middlewares/requireBlogPermission");
const { PERMISSIONS } = require("../utils/permissions");


const router = express.Router();



router.get("/", optionalProtect, blogsController.browse); // GET /blogs
router.get("/:id", optionalProtect, blogsController.read); // GET /blogs/:id
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.BLOG_UPDATE), blogsController.edit); // PUT /blogs/:id
router.post("/", protect, blogsController.add); // POST /blogs
router.delete("/:id", protect, requireBlogPermission(PERMISSIONS.BLOG_DELETE), blogsController.destroy); 

module.exports=router;

