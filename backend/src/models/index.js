// backend/src/models/index.js
// ============================================================
// Point d'assemblage de la couche d'accès aux données (DAL : Data Access Layer).
// Ce fichier est le registre central de tous les Managers de l'application.
//
// Responsabilités :
//   1. Créer un pool de connexions MySQL partagé par tous les managers
//   2. Instancier chaque Manager et lui fournir le pool via setDatabase()
//   3. Exporter un objet `models` proxifié qui donne accès à tous les managers
//      et affiche un message d'erreur clair si un manager est manquant
//
// Pattern utilisé : Repository / Manager pattern
//   - Chaque entité BDD a son propre Manager (ex: UsersManager pour la table `users`)
//   - Les controllers n'accèdent jamais directement à la BDD, mais via models.xxx
//   - Cela découple la logique métier de l'implémentation BDD
//
// Utilisation dans un controller :
//   const models = require('../models');
//   const user = await models.users.findById(id);
// ============================================================

// Chargement des variables d'environnement (.env) au cas où ce module
// serait importé avant que dotenv soit initialisé ailleurs.
// En pratique server.js l'initialise avant, mais cette ligne est une sécurité.
require("dotenv").config();

// Importation du driver MySQL2 en mode Promise pour utiliser async/await
// dans tous les managers sans callbacks imbriqués.
const mysql = require("mysql2/promise");

// Extraction des paramètres de connexion depuis les variables d'environnement.
// Ces variables doivent être définies dans le fichier .env à la racine du backend.
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Création du pool de connexions MySQL partagé par TOUS les managers.
// Un pool maintient un ensemble de connexions ouvertes et les réutilise,
// ce qui est bien plus efficace que d'ouvrir/fermer une connexion par requête.
const pool = mysql.createPool({
  host: DB_HOST,       // Adresse du serveur MySQL (ex: "localhost")
  port: DB_PORT,       // Port MySQL (ex: 3306) — mysql2 accepte une chaîne
  user: DB_USER,       // Identifiant de connexion MySQL
  password: DB_PASSWORD, // Mot de passe MySQL (ne jamais committer)
  database: DB_NAME,   // Nom de la base de données à utiliser
});

// Remarque : `DB_PORT` provient de l'environnement (chaîne). mysql2 accepte
// généralement une chaîne, mais si vous souhaitez forcer un entier utilisez
// `parseInt(process.env.DB_PORT, 10)` lors de la lecture.
// Vous pouvez également ajouter des options ici (connectionLimit, waitForConnections, etc.).

// Test de connexion au démarrage : tente d'obtenir une connexion du pool.
// Si la connexion échoue (mauvais identifiants, serveur hors-ligne), on affiche
// un avertissement sans faire planter l'application.
pool.getConnection().catch(() => {
  console.warn(
    "Warning:",
    "Failed to get a DB connection.",
    "Did you create a .env file with valid credentials?",
    "Routes using models won't work as intended"
  );
});

// Objet conteneur de tous les managers instanciés.
// Les controllers importent `models` et accèdent aux managers via models.users, models.posts, etc.
const models = {};

// ============================================================
// ENREGISTREMENT DES MANAGERS
// ============================================================
// Pour chaque entité BDD :
//   1. On importe la classe Manager correspondante
//   2. On crée une instance avec new Manager()
//   3. On attache le pool de connexions avec setDatabase(pool)
//      (méthode héritée de AbstractManager, classe de base de tous les managers)
// Le nom de propriété (models.xxx) est utilisé dans les controllers.
// ============================================================

// --- ItemManager : gestion des items génériques (builder ou contenu) ---
const ItemManager = require("./ItemManager"); // Import de la classe ItemManager
models.items = new ItemManager();              // Création de l'instance
models.items.setDatabase(pool);               // Injection du pool de connexions

// --- UsersManager : gestion des comptes utilisateurs (table `users`) ---
const UsersManager = require("./UsersManager");
models.users = new UsersManager();
models.users.setDatabase(pool);

// --- BlogManager : gestion des blogs (table `blogs`) ---
const BlogManager = require("./blogManager"); // Note: nom de fichier en camelCase
models.blog = new BlogManager();
models.blog.setDatabase(pool);

// --- ThemesManager : gestion des thèmes visuels (table `themes`) ---
const ThemesManager = require("./ThemesManager");
models.themes = new ThemesManager();
models.themes.setDatabase(pool);

// --- PostsManager : gestion des articles (table `posts`) ---
const PostsManager = require("./PostsManager");
models.posts = new PostsManager();
models.posts.setDatabase(pool);

// --- MediaManager : gestion des médias uploadés (table `media`) ---
const MediaManager = require("./MediaManager");
models.media = new MediaManager();
models.media.setDatabase(pool);

// --- CommentsManager : gestion des commentaires (table `comments`) ---
const CommentsManager = require("./CommentsManager");
models.comments = new CommentsManager();
models.comments.setDatabase(pool);

// --- CategoriesManager : gestion des catégories d'articles (table `categories`) ---
const CategoriesManager = require("./CategoriesManager");
models.categories = new CategoriesManager();
models.categories.setDatabase(pool);

// --- BlogMembersManager : gestion des membres de blog (table `blog_members`) ---
const BlogMembersManager = require("./BlogMembersManager");
models.blogMembers = new BlogMembersManager();
models.blogMembers.setDatabase(pool);

// --- AuditLogsManager : journalisation des actions sensibles (table `audit_logs`) ---
const AuditLogsManager = require("./AuditLogsManager");
models.auditLogs = new AuditLogsManager();
models.auditLogs.setDatabase(pool);

// --- UserOAuthAccountsManager : comptes OAuth liés (table `user_oauth_accounts`) ---
// Gestion des connexions via des fournisseurs tiers (Google, GitHub, etc.)
const UserOAuthAccountsManager = require("./UserOAuthAccountsManager");
models.userOAuthAccounts = new UserOAuthAccountsManager();
models.userOAuthAccounts.setDatabase(pool);

// --- ReportsManager : gestion des signalements (table `reports`) ---
// Signalements de contenus inappropriés soumis par les utilisateurs
const ReportsManager = require("./ReportsManager");
models.reports = new ReportsManager();
models.reports.setDatabase(pool);

// --- BuilderManager : gestion du Page Builder (tables pages, sections, blocs) ---
// Opérations sur les pages créées visuellement avec l'éditeur drag-and-drop
const BuilderManager = require("./BuilderManager");
models.builder = new BuilderManager();
models.builder.setDatabase(pool);

// ============================================================
// PROXY DE SÉCURITÉ DÉVELOPPEUR
// ============================================================
// Encapsule l'objet `models` dans un Proxy JavaScript pour intercepter
// les accès à des managers non enregistrés et fournir un message d'erreur
// guidé au lieu d'un `undefined` silencieux difficile à déboguer.
//
// Exemple : models.xyz (non enregistré) → ReferenceError avec instructions
// ============================================================
const handler = {
  // Méthode appelée à chaque accès à une propriété de models (models.xxx)
  // obj  : l'objet models sous-jacent
  // prop : le nom de la propriété demandée (ex: "users", "posts", "xyz")
  get(obj, prop) {
    // Si la propriété est enregistrée dans models, on la retourne normalement
    if (prop in obj) {
      return obj[prop];
    }

    // Helper local : met en majuscule la première lettre ("posts" → "Posts")
    // utilisé pour construire le nom de fichier Manager attendu
    const pascalize = (string) => string.slice(0, 1).toUpperCase() + string.slice(1);

    // Propriété introuvable : lève une ReferenceError explicite avec
    // un message guidant le développeur vers la solution (créer et enregistrer le Manager)
    throw new ReferenceError(
      `models.${prop} is not defined. Did you create ${pascalize(prop)}Manager.js, and did you register it in backend/src/models/index.js?`
    );
  },
};

// Export du Proxy transparent sur l'objet models.
// Tout import de ce module obtient ce proxy :
//   models.users  → retourne l'instance UsersManager (accès normal)
//   models.xyz    → lève ReferenceError avec message guidé (manager manquant)
module.exports = new Proxy(models, handler);
