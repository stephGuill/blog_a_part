// database/client.js
// ============================================================
// Module de connexion à la base de données MySQL.
// Crée un pool de connexions réutilisables et vérifie que la
// configuration .env est valide au démarrage de l'application.
// Exporte l'objet `client` (pool mysql2) prêt à l'emploi.
// ============================================================

// Lecture des variables de connexion depuis process.env
// (chargées au préalable par dotenv dans server.js ou app.js).
// DB_HOST  : adresse du serveur MySQL (ex: "localhost" ou IP)
// DB_PORT  : port MySQL (par défaut 3306)
// DB_USER  : nom d'utilisateur de la base de données
// DB_PASSWORD : mot de passe associé à DB_USER
// DB_NAME  : nom de la base de données cible
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Importation du driver MySQL2 en mode Promise.
// mysql2/promise fournit une API async/await native sans callbacks.
const mysql = require("mysql2/promise");

// Création d'un pool de connexions plutôt qu'une connexion unique.
// Un pool gère plusieurs connexions simultanées et les réutilise
// automatiquement, ce qui est plus performant pour un serveur HTTP
// qui traite plusieurs requêtes en parallèle.
const client = mysql.createPool({
  host: DB_HOST,       // Hôte MySQL (ex: "localhost")
  port: DB_PORT,       // Port d'écoute MySQL (ex: 3306)
  user: DB_USER,       // Identifiant de connexion
  password: DB_PASSWORD, // Mot de passe (ne jamais committer en clair)
  database: DB_NAME,   // Base de données à utiliser par défaut
});

// Vérification de la connexion au démarrage du serveur :
// On tente d'obtenir une connexion du pool pour valider les identifiants.
// getConnection() renvoie une Promise, on chaîne .then() et .catch().
client
  .getConnection()
  .then((connection) => {
    // Connexion réussie : on affiche le nom de la base pour confirmer
    // que le serveur utilise bien la bonne base de données.
    console.info(`Using database ${DB_NAME}`);

    // Libération immédiate de la connexion de test dans le pool
    // pour qu'elle reste disponible pour les vraies requêtes applicatives.
    connection.release();
  })
  .catch((error) => {
    // En cas d'échec (mauvais identifiants, serveur MySQL hors-ligne, etc.),
    // on avertit le développeur sans faire planter l'application.
    // L'application peut démarrer mais les routes utilisant la BDD échoueront.
    console.warn(
      "Warning:",
      "Failed to establish a database connection.",
      "Please check your database credentials in the .env file if you need a database access."
    );
    // Affichage du message d'erreur technique pour aider au diagnostic.
    console.error("Error message:", error.message);
  });

// Ajout d'une propriété personnalisée sur le pool pour mémoriser
// le nom de la base de données courante.
// Utile dans certains managers ou utilitaires qui veulent connaître
// le nom de la BDD sans accéder à process.env directement.
client.databaseName = DB_NAME;

// Export du pool de connexions pour utilisation dans les models/managers.
// Tous les managers importent ce client et l'utilisent via setDatabase().
module.exports = client;
