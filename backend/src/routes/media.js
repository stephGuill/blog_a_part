// Routeur Express pour la gestion des médias (images, fichiers uploadés)
// Gère l'upload, la liste, la lecture, la mise à jour et la suppression de fichiers
// Les routes sont protégées : admin/owner/editor peuvent lire, admin/owner peuvent modifier
const express = require('express');

// Contrôleur contenant la logique CRUD pour les fichiers médias
const mediaController = require("../controllers/mediaController");

// protect    : middleware qui vérifie le JWT et attache req.user
// restrictTo : factory de middleware qui vérifie que req.user.role est dans la liste autorisée
const { protect, restrictTo } = require("../middlewares/auth");

// uploadImage : wrapper Multer configuré pour l'upload d'images
// Valide le type MIME (image/*), la taille maximale et expose req.file
const { uploadImage } = require("../middlewares/upload");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// GET /media/
// Retourne la liste de tous les fichiers médias disponibles
// Accessible aux rôles : admin, owner, editor
// - protect                               : vérifie l'authentification
// - restrictTo("admin","owner","editor")  : filtre par rôle autorisé
router.get("/", protect, restrictTo("admin", "owner", "editor"), mediaController.browse);

// GET /media/:id
// Retourne les métadonnées d'un fichier média spécifique identifié par :id
// Paramètre URL :id -> identifiant unique du média
// Accessible aux rôles : admin, owner, editor
router.get("/:id", protect, restrictTo("admin", "owner", "editor"), mediaController.read);

// PUT /media/:id
// Met à jour les métadonnées d'un média (nom, alt, description, etc.)
// Paramètre URL :id -> identifiant du média à modifier
// Accessible aux rôles : admin, owner uniquement (restriction plus forte que la lecture)
router.put("/:id", protect, restrictTo("admin", "owner"), mediaController.edit);

// POST /media/
// Upload d'un nouveau fichier média (requête multipart/form-data, champ : "file")
// - protect                               : vérifie l'authentification
// - restrictTo("admin","owner","editor")  : autorise admin, owner et editor à uploader
// - uploadImage.single("file")            : traite le fichier uploadé, expose req.file
// - mediaController.add                   : enregistre le fichier et ses métadonnées en BDD
router.post("/", protect, restrictTo("admin", "owner", "editor"), uploadImage.single("file"), mediaController.add);

// DELETE /media/:id
// Supprime définitivement un fichier média (fichier physique + entrée BDD)
// Paramètre URL :id -> identifiant du média à supprimer
// Accessible aux rôles : admin, owner uniquement
router.delete("/:id", protect, restrictTo("admin", "owner"), mediaController.destroy);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
