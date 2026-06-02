// backend/src/models/index.js
// Point d'assemblage des managers (Data Access Layer) utilisés par l'application.
// Ce fichier :
//  - crée un pool de connexions MySQL à partir des variables d'environnement
//  - instancie chaque Manager (UsersManager, PostsManager, ...) et lui assigne
//    le pool via `setDatabase`
//  - exporte un objet `models` proxifié pour fournir un message d'erreur utile
//    lorsqu'un manager n'est pas enregistré.

// Charger les variables d'environnement (ex: DB_HOST, DB_USER...)
require("dotenv").config();

// Client mysql2 en mode promise pour utiliser async/await
const mysql = require("mysql2/promise");

// Récupération des paramètres de connexion depuis l'environnement
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Créer un pool de connexions partagé par tous les managers
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

// Remarque : `DB_PORT` provient de l'environnement (chaîne). mysql2 accepte
// généralement une chaîne, mais si vous souhaitez forcer un entier utilisez
// `parseInt(process.env.DB_PORT, 10)` lors de la lecture.
// Vous pouvez également ajouter des options ici (connectionLimit, waitForConnections, etc.).

// Test rapide d'obtention d'une connexion pour détecter les erreurs de config
pool.getConnection().catch(() => {
  console.warn(
    "Warning:",
    "Failed to get a DB connection.",
    "Did you create a .env file with valid credentials?",
    "Routes using models won't work as intended"
  );
});

// Objet qui contiendra toutes les instances de Managers (ex: models.users)
const models = {};

// === Enregistrement des managers ===
// Chaque Manager est instancié puis on lui assigne le pool via setDatabase(pool)

// Enregistrement et initialisation des managers

// Importer et instancier ItemManager, puis lui fournir le pool
const ItemManager = require("./ItemManager");
models.items = new ItemManager();
models.items.setDatabase(pool);

// Importer et instancier UsersManager, puis lui fournir le pool
const UsersManager = require("./UsersManager");
models.users = new UsersManager();
models.users.setDatabase(pool);

// Importer et instancier BlogManager, puis lui fournir le pool
const BlogManager = require("./blogManager");
models.blog = new BlogManager();
models.blog.setDatabase(pool);

// Importer et instancier ThemesManager
const ThemesManager = require("./ThemesManager");
models.themes = new ThemesManager();
models.themes.setDatabase(pool);

// Importer et instancier PostsManager
const PostsManager = require("./PostsManager");
models.posts = new PostsManager();
models.posts.setDatabase(pool);

// Importer et instancier MediaManager
const MediaManager = require("./MediaManager");
models.media = new MediaManager();
models.media.setDatabase(pool);

// Importer et instancier CommentsManager
const CommentsManager = require("./CommentsManager");
models.comments = new CommentsManager();
models.comments.setDatabase(pool);

// Importer et instancier CategoriesManager
const CategoriesManager = require("./CategoriesManager");
models.categories = new CategoriesManager();
models.categories.setDatabase(pool);

// Importer et instancier BlogMembersManager
const BlogMembersManager = require("./BlogMembersManager");
models.blogMembers = new BlogMembersManager();
models.blogMembers.setDatabase(pool);

// Importer et instancier AuditLogsManager
const AuditLogsManager = require("./AuditLogsManager");
models.auditLogs = new AuditLogsManager();
models.auditLogs.setDatabase(pool);

// Importer et instancier UserOAuthAccountsManager
const UserOAuthAccountsManager = require("./UserOAuthAccountsManager");
models.userOAuthAccounts = new UserOAuthAccountsManager();
models.userOAuthAccounts.setDatabase(pool);

// Importer et instancier ReportsManager
const ReportsManager = require("./ReportsManager");
models.reports = new ReportsManager();
models.reports.setDatabase(pool);

// Importer et instancier BuilderManager
const BuilderManager = require("./BuilderManager");
models.builder = new BuilderManager();
models.builder.setDatabase(pool);

// Proxy utile : intercepter l'accès à un manager non défini pour fournir
// un message d'erreur explicite au développeur (évite un undefined silencieux).
// Cela permet d'obtenir un message clair si un fichier Manager n'a pas été
// importé/registré plutôt qu'une erreur difficile à diagnostiquer plus tard.
const handler = {
  get(obj, prop) {
    if (prop in obj) {
      return obj[prop];
    }

    const pascalize = (string) => string.slice(0, 1).toUpperCase() + string.slice(1);

    throw new ReferenceError(
      `models.${prop} is not defined. Did you create ${pascalize(prop)}Manager.js, and did you register it in backend/src/models/index.js?`
    );
  },
};

module.exports = new Proxy(models, handler);
