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

const ItemManager = require("./ItemManager");
models.items = new ItemManager();
models.items.setDatabase(pool);

const UsersManager = require("./UsersManager");
models.users = new UsersManager();
models.users.setDatabase(pool);

const BlogManager = require("./blogManager");
models.blog = new BlogManager();
models.blog.setDatabase(pool);

const ThemesManager = require("./ThemesManager");
models.themes = new ThemesManager();
models.themes.setDatabase(pool);

const PostsManager = require("./PostsManager");
models.posts = new PostsManager();
models.posts.setDatabase(pool);

const MediaManager = require("./MediaManager");
models.media = new MediaManager();
models.media.setDatabase(pool);

const CommentsManager = require("./CommentsManager");
models.comments = new CommentsManager();
models.comments.setDatabase(pool);

const CategoriesManager = require("./CategoriesManager");
models.categories = new CategoriesManager();
models.categories.setDatabase(pool);

const BlogMembersManager = require("./BlogMembersManager");
models.blogMembers = new BlogMembersManager();
models.blogMembers.setDatabase(pool);

const AuditLogsManager = require("./AuditLogsManager");
models.auditLogs = new AuditLogsManager();
models.auditLogs.setDatabase(pool);

const UserOAuthAccountsManager = require("./UserOAuthAccountsManager");
models.userOAuthAccounts = new UserOAuthAccountsManager();
models.userOAuthAccounts.setDatabase(pool);

const ReportsManager = require("./ReportsManager");
models.reports = new ReportsManager();
models.reports.setDatabase(pool);

const BuilderManager = require("./BuilderManager");
models.builder = new BuilderManager();
models.builder.setDatabase(pool);

// Proxy utile : intercepter l'accès à un manager non défini pour fournir
// un message d'erreur explicite au développeur (évite un undefined silencieux)
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
