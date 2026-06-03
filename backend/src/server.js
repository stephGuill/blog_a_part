// server.js
// ============================================================
// Point d'entrée principal du serveur Node.js.
// Ce fichier est le premier exécuté par Node : il charge la
// configuration d'environnement, importe l'application Express
// et démarre l'écoute réseau sur le port défini.
// ============================================================

// Charge les variables d'environnement depuis le fichier .env situé
// un niveau au-dessus du dossier src/ (chemin absolu résolu avec path.resolve).
// Cela permet d'utiliser process.env.PORT, process.env.DB_HOST, etc.
// partout dans l'application après cet appel.
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// Importe l'instance de l'application Express configurée dans app.js
// (middlewares globaux, routeur, gestion d'erreurs).
const app = require("./app");

// Détermine le port d'écoute : utilise la variable d'environnement PORT
// si elle est définie (utile en production / Docker), sinon 5000 par défaut
// pour le développement local.
const PORT = process.env.PORT || 5000;

// Démarre le serveur HTTP : Express commence à écouter les requêtes entrantes
// sur l'adresse 0.0.0.0 (toutes les interfaces réseau) et le port choisi.
// La callback est exécutée une seule fois, juste après que le serveur est prêt,
// pour confirmer le démarrage dans la console.
app.listen(PORT, () => {
  // Affiche l'URL d'accès local pour faciliter le développement.
  // console.info est préféré à console.log pour les messages informatifs.
  console.info(`Backend server running on http://localhost:${PORT}`);
});
