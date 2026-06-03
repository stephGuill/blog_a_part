// Routeur Express pour la gestion des items (eléments génériques de contenu)
// CRUD complet : liste, lecture, création, modification, suppression
// Note : ces routes ne sont pas protégées par authentification dans la version actuelle
const express = require("express");

// Contrôleur contenant la logique CRUD pour les items
const itemsController = require("../controllers/itemsController");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// GET /items/
// Retourne la liste de tous les items disponibles
// Route publique : aucune authentification requise
router.get("/", itemsController.browse);

// GET /items/:id
// Retourne le détail d'un item spécifique identifié par :id
// Paramètre URL :id -> identifiant unique de l'item
router.get("/:id", itemsController.read);

// PUT /items/:id
// Met à jour un item existant identifié par :id
// Paramètre URL :id -> identifiant de l'item à modifier
// Corps attendu : les champs à mettre à jour
router.put("/:id", itemsController.edit);

// POST /items/
// Crée un nouvel item
// Corps attendu : les champs de l'item à créer
router.post("/", itemsController.add);

// DELETE /items/:id
// Supprime un item identifié par :id
// Paramètre URL :id -> identifiant de l'item à supprimer
router.delete("/:id", itemsController.destroy);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
