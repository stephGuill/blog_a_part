// Routeur Express pour la gestion des catégories de contenu
// Opérations CRUD complètes : liste, lecture, création, modification, suppression
// Note : ces routes ne sont pas protégées par authentification dans la version actuelle
const express = require("express");

// Contrôleur contenant la logique CRUD pour les catégories
const categoriesController = require("../controllers/categoriesController");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// GET /categories/
// Retourne la liste de toutes les catégories disponibles
// Route publique : accessible sans authentification
router.get("/", categoriesController.browse);

// GET /categories/:id
// Retourne les détails d'une catégorie spécifique identifiée par :id
// Paramètre URL :id -> identifiant unique de la catégorie
router.get("/:id", categoriesController.read);

// POST /categories/
// Crée une nouvelle catégorie
// Corps attendu : { name: '...', description: '...', ... }
router.post("/", categoriesController.add);

// PUT /categories/:id
// Met à jour les informations d'une catégorie existante
// Paramètre URL :id -> identifiant de la catégorie à modifier
// Corps attendu : { name: '...', description: '...', ... }
router.put("/:id", categoriesController.edit);

// DELETE /categories/:id
// Supprime une catégorie identifiée par :id
// Paramètre URL :id -> identifiant de la catégorie à supprimer
router.delete("/:id", categoriesController.destroy);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
