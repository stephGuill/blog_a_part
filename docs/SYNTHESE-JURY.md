# Synthèse de soutenance — Blog à Part
### Titre Professionnel Développeur Web Full Stack

> Durée estimée : **60 minutes**
> Structure : 7 parties + questions jury
> Niveau : jury TP DWWM

---

## Plan de la présentation

| # | Partie | Durée |
|---|---|---|
| 1 | Présentation du projet et contexte | 5 min |
| 2 | Architecture technique globale | 8 min |
| 3 | Base de données — modèle relationnel | 8 min |
| 4 | Backend — API REST, sécurité, MVC | 15 min |
| 5 | Frontend — React SPA, contextes, routing | 12 min |
| 6 | Tests d'intégration | 5 min |
| 7 | Déploiement en production | 4 min |
| — | Questions / échanges avec le jury | 3 min |

---

---

## PARTIE 1 — Présentation du projet (5 min)

### Qu'est-ce que Blog à Part ?

**Blog à Part** est une plateforme SaaS de blogging multi-utilisateurs.

> « SaaS » signifie *Software as a Service* : l'utilisateur n'installe rien, il s'inscrit en ligne et accède immédiatement à son blog.

L'idée centrale : n'importe qui peut créer **son propre blog**, y inviter des collaborateurs, publier des articles — tout depuis une interface unifiée, sans configuration serveur.

### Qui sont les utilisateurs cibles ?

| Profil | Ce qu'il fait |
|---|---|
| Blogueur indépendant | Crée et gère son espace de publication |
| Équipe éditoriale | Rédige à plusieurs avec des rôles distincts |
| Modérateur | Surveille commentaires et signalements |
| Administrateur plateforme | Supervise tous les comptes et blogs |

### Les fonctionnalités en bref

- **Inscription / Connexion** sécurisée (JWT + Argon2)
- **Création de blogs** avec thèmes et slug unique
- **Rédaction d'articles** avec cycle de vie (`draft → pending → published`)
- **Commentaires** avec système de modération
- **RBAC** — système de rôles à deux niveaux (global + par blog)
- **Dashboard** adapté à chaque rôle
- **Médiathèque** pour les uploads d'images
- **Constructeur de pages** (builder)
- **Journal d'audit** des actions sensibles
- **Consentements RGPD** (CGU, politique de confidentialité, cookies)

### Stack technologique (résumé)

```
FRONTEND                    BACKEND                   BASE DE DONNÉES
────────                    ───────                   ───────────────
React 18 + Vite 5           Node.js + Express 4       MySQL 8 / InnoDB
React Router 6              JWT (jsonwebtoken)         mysql2/promise
Axios / fetch               Argon2 (hachage)           utf8mb4
i18next (i18n)              Multer (upload)
CSS Modules + Tailwind      express-rate-limit
                            Jest + Supertest (tests)
```

---

---

## PARTIE 2 — Architecture technique globale (8 min)

### Architecture client-serveur

```
┌──────────────────────────────────────────┐
│           NAVIGATEUR (React SPA)         │
│  React Router  ←→  Contextes  ←→  Pages  │
│                ←→  apiClient.js          │
└──────────────────┬───────────────────────┘
                   │  HTTP/JSON (CORS)
                   ▼
┌──────────────────────────────────────────┐
│         SERVEUR BACKEND (Express)        │
│  Middlewares → Routeurs → Contrôleurs    │
│              → Services → Managers      │
└──────────────────┬───────────────────────┘
                   │  mysql2/promise
                   ▼
┌──────────────────────────────────────────┐
│           BASE DE DONNÉES (MySQL 8)      │
│  users / blogs / posts / comments / ...  │
└──────────────────────────────────────────┘
```

La séparation est **totale** : le frontend et le backend sont deux applications distinctes.

- Le frontend (React) tourne sur le port `5173` en développement
- Le backend (Express) tourne sur le port `5000`
- Ils communiquent uniquement via HTTP avec du JSON

### Pattern MVC appliqué au backend

Le backend suit le pattern **Modèle–Vue–Contrôleur** adapté aux API REST :

```
Route (routeurs/*.js)
  → Middleware (auth, RBAC, upload)
    → Contrôleur (controllers/*.js)     ← orchestre la requête
      → Service (services/*.js)         ← contient la logique métier
        → Manager (models/*.js)         ← interagit avec la BDD
          → MySQL
```

| Couche | Rôle | Exemple |
|---|---|---|
| **Routeur** | Déclare les URL et attache les middlewares | `routes/auth.js` |
| **Middleware** | Vérifie auth, rôle, données | `middlewares/auth.js` |
| **Contrôleur** | Lit `req`, appelle le service, envoie `res` | `controllers/authController.js` |
| **Service** | Logique métier pure (hachage, validation) | `services/AuthService.js` |
| **Manager** | Requêtes SQL sur une table | `models/UsersManager.js` |

### Point d'entrée — `app.js`

C'est le fichier qui crée le serveur Express et branche tous les composants ensemble :

```js
// app.js — point d'entrée du serveur Express

const fs = require("node:fs");   // fs : vérifier l'existence du build React
const path = require("node:path"); // path : gérer les chemins de fichiers
const express = require("express");
const app = express();

// Parsers de requêtes
app.use(express.json());           // parse les corps JSON → req.body
app.use(express.urlencoded({ extended: true })); // parse les formulaires HTML

// CORS : autorise uniquement les origines connues
const cors = require("cors");
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,      // URL de production (ex: https://blog-a-part.netlify.app)
  "http://localhost:5173",       // URL de développement Vite
].filter(Boolean)); // filter(Boolean) = enlève les valeurs null/undefined

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);      // ✅ origine autorisée → on laisse passer
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`)); // ❌ origine rejetée
  },
  optionsSuccessStatus: 200,
}));

// Montage du routeur central
const router = require("./router");
app.use(router);                   // toutes les routes /api/... sont définies ici

// Fallback SPA React (si le build existe)
const reactIndexFile = path.join(__dirname, '../../frontend/dist/index.html');
if (fs.existsSync(reactIndexFile)) {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('/{*splat}', (req, res) => res.sendFile(reactIndexFile));
  // ↑ Toute URL non reconnue renvoie index.html (React Router gère côté client)
}

module.exports = app;
```

**Lignes clés à retenir :**
- Ligne `filter(Boolean)` : protège contre un `process.env.FRONTEND_URL` non défini
- `allowedOrigins.has(origin)` : utilise un `Set` pour une vérification en O(1)
- Le fallback `/{*splat}` permet à React Router de gérer toutes les routes côté client

---

---

## PARTIE 3 — Base de données (8 min)

### Choix techniques

- **MySQL 8** avec moteur **InnoDB** (transactions ACID)
- Encodage **utf8mb4** (support emoji, langues asiatiques, caractères spéciaux)
- Driver Node.js : **mysql2/promise** (API async/await native, sans callback)
- Connexion via un **pool de connexions** (performance sur un serveur HTTP)

### Diagramme des relations (ERD)

```
users ──────────────────────────────────────────────────────────────┐
  │ 1                                                               │
  │                                                                 │
  ├─ (owner_id) ─── blogs ─── (theme_id) ─── themes                │
  │                  │                                              │
  │                  ├─ blog_members ──────────── users             │
  │                  │   (user_id, role, status)                    │
  │                  │                                              │
  │                  ├─ posts ──────────── categories               │
  │                  │   (author_id)                                │
  │                  │     │                                        │
  │                  │     └─ comments ────── users                 │
  │                  │          │                                   │
  │                  │          └─ reports ─── users                │
  │                  │                                              │
  │                  └─ builder_pages                               │
  │                                                                 │
  └─ user_oauth_accounts                                            │
  └─ audit_logs                                                     │
```

### Tables principales

**`users`** — le centre du système

| Colonne clé | Type | Rôle |
|---|---|---|
| `id` | INT PK AUTO | Identifiant unique |
| `email` | VARCHAR UNIQUE | Login + notifications |
| `password_hash` | VARCHAR(255) | Hash Argon2 du mot de passe |
| `platform_role` | ENUM | Rôle global : `admin` ou `user` |
| `status` | ENUM | `active`, `suspended`, `banned`... |
| `accepted_terms` | BOOLEAN | Consentement CGU (RGPD) |
| `two_factor_enabled` | BOOLEAN | 2FA activé |

**`blogs`** — chaque blog est un espace indépendant

| Colonne clé | Type | Rôle |
|---|---|---|
| `owner_id` | INT FK→users | Propriétaire |
| `slug` | VARCHAR UNIQUE | Identifiant URL (`mon-blog`) |
| `is_public` | BOOLEAN | Visibilité publique |
| `status` | ENUM | `active`, `suspended`, `deleted` |

**`blog_members`** — table de liaison users ↔ blogs avec rôle

```sql
-- Table pivot : un utilisateur peut être membre de plusieurs blogs
-- avec un rôle différent dans chacun
CREATE TABLE blog_members (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  blog_id     INT NOT NULL,           -- ← blog concerné
  user_id     INT NOT NULL,           -- ← utilisateur concerné
  role        ENUM('owner','editor','moderator','member','viewer') DEFAULT 'member',
  status      ENUM('active','pending','suspended') DEFAULT 'active',
  joined_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_blog_user (blog_id, user_id), -- un seul rôle par blog par user
  FOREIGN KEY (blog_id) REFERENCES blogs(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

> **Point fort** : le RBAC (rôles) est géré *directement en base de données*, dans `blog_members`. Ce n'est pas juste une liste statique dans le code.

### Connexion MySQL — `database/client.js`

```js
// database/client.js — Pool de connexions MySQL

const mysql = require("mysql2/promise"); // API Promise (async/await)

const DB_SSL = process.env.DB_SSL === "true"; // SSL requis pour Filess.io (cloud)

const client = mysql.createPool({
  host:     process.env.DB_HOST,      // adresse du serveur MySQL
  port:     process.env.DB_PORT,      // 3306 (local) ou 3307 (Filess.io)
  user:     process.env.DB_USER,      // identifiant MySQL
  password: process.env.DB_PASSWORD,  // mot de passe (JAMAIS en dur dans le code)
  database: process.env.DB_NAME,      // base de données à utiliser
  ssl: DB_SSL ? { rejectUnauthorized: false } : undefined,
  // rejectUnauthorized: false → accepte le certificat auto-signé des hébergeurs cloud
});

// Vérification au démarrage : on test une connexion
client.getConnection()
  .then(connection => {
    console.info(`Using database ${process.env.DB_NAME}`); // confirmation visuelle
    connection.release(); // 🔑 libérer la connexion dans le pool immédiatement
  })
  .catch(error => {
    console.warn("Failed to establish a database connection.");
    console.error("Error:", error.message);
    // L'app continue de démarrer — les routes BDD échoueront mais le serveur tourne
  });

module.exports = client; // exporté pour utilisation dans tous les managers
```

**À retenir :** `.createPool()` au lieu de `.createConnection()` — le pool maintient plusieurs connexions ouvertes et les distribue aux requêtes simultanées. Critique pour les performances.

### AbstractManager — le DAO de base

```js
// models/AbstractManager.js — Classe de base DAO (Data Access Object)

class AbstractManager {
  constructor({ table }) {
    this.table = table; // nom de la table SQL (ex: "users", "posts", "blogs")
  }

  // find(id) — récupère une ligne par sa clé primaire
  find(id) {
    // ✅ Requête paramétrée : le ? est remplacé par id de manière sécurisée
    // → Prévient l'injection SQL (OWASP A03)
    return this.database.query(
      `SELECT * FROM ${this.table} WHERE id = ?`, [id]
    );
  }

  findAll() {
    return this.database.query(`SELECT * FROM ${this.table}`);
  }

  delete(id) {
    return this.database.query(
      `DELETE FROM ${this.table} WHERE id = ?`, [id]
    );
  }

  // Injection de dépendance : le pool est injecté depuis models/index.js
  setDatabase(database) {
    this.database = database;
  }
}

module.exports = AbstractManager;
```

> **Pourquoi une classe abstraite ?** Les 14 managers du projet (UsersManager, PostsManager, CommentsManager...) héritent tous d'AbstractManager. Ils bénéficient des méthodes `find`, `findAll`, `delete` sans réécriture. Chaque manager ajoute uniquement les requêtes spécifiques à sa table.

---

---

## PARTIE 4 — Backend : API REST, Sécurité, MVC (15 min)

### 4.1 — Les 6 couches de sécurité

La sécurité n'est pas un composant unique — c'est une succession de vérifications indépendantes :

```
Requête HTTP entrante
    │
    ├─ 1. CORS          → Bloque les origines non autorisées
    ├─ 2. Rate Limiting → Limite le bruteforce (10 req/15min)
    ├─ 3. JWT           → Vérifie l'identité de l'utilisateur
    ├─ 4. RBAC          → Vérifie les droits sur la ressource
    ├─ 5. Validation    → Vérifie les données entrantes (format, longueur)
    └─ 6. SQL paramétré → Prévient l'injection SQL
```

### 4.2 — Rate Limiting

```js
// middlewares/rateLimit.js
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 minutes en millisecondes
  max: 10,                   // max 10 tentatives par IP dans cette fenêtre
  message: {
    status: "error",
    message: "Trop de tentatives. Réessayez dans 15 minutes."
  },
  // standardHeaders: true → envoie les headers RateLimit-* dans la réponse
  // legacyHeaders: false  → désactive les headers X-RateLimit-* obsolètes
});
```

> **Pourquoi ?** Sans rate limiting, un attaquant peut tenter des millions de mots de passe par seconde (bruteforce). 10 tentatives/15 min bloque cette attaque efficacement (OWASP A07).

### 4.3 — Middleware d'authentification JWT

```js
// middlewares/auth.js — protect()

const protect = async (req, res, next) => {
  // 1. Lecture du header Authorization envoyé par le client
  const authHeader = req.headers.authorization;

  // 2. Vérifie que le header est présent et au format "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Authentification requise."
    });
  }

  // 3. Extraction du token : on supprime "Bearer " (7 caractères)
  const token = authHeader.split(" ")[1];

  try {
    // 4. Vérification cryptographique du token avec le secret JWT
    // jwt.verify LÈVE une erreur si :
    //   - la signature est invalide (token falsifié)
    //   - le token est expiré (exp claim dépassé)
    const decoded = jwt.verify(token, jwtSecret);

    // 5. Vérification en base de données : l'utilisateur existe-t-il encore ?
    //    findSafeById exclut password_hash et autres données sensibles
    const [rows] = await models.users.findSafeById(decoded.id);
    const user = rows[0];

    // 6. Triple vérification du compte : existant + actif + statut "active"
    if (!user || !user.is_active || user.status !== "active") {
      return res.status(401).json({ status: "error", message: "Authentification requise." });
    }

    // 7. Injection de l'utilisateur dans req.user (disponible dans toute la chaîne)
    req.user = {
      id:         user.id,
      email:      user.email,
      username:   user.username,
      role:       user.role,
      globalRole: user.platform_role || (user.role === "admin" ? "admin" : "user"),
      // ↑ globalRole distingue admin plateforme vs rôle dans un blog
    };

    return next(); // ✅ token valide → passage au middleware suivant

  } catch (err) {
    // 8. Message générique : ne révèle PAS la nature de l'erreur
    //    (sécurité : ne pas aider un attaquant à comprendre pourquoi son token échoue)
    return res.status(401).json({ status: "error", message: "Token invalide ou expiré." });
  }
};
```

**Schéma du flux JWT :**

```
Connexion (signin)
    │
    ▼
AuthService.signin()
    │ jwt.sign({ id, email, role }, SECRET, { expiresIn: "2h" })
    ▼
Token renvoyé au frontend
    │ → stocké dans localStorage sous la clé "blogyoo_token"
    │
    ▼
Requête protégée
    │ Authorization: Bearer eyJhbGci...
    ▼
protect() middleware
    │ jwt.verify(token, SECRET) → décode le payload
    │ findSafeById(decoded.id)  → vérifie que le compte est actif
    │ req.user = { id, role, ... }
    ▼
Contrôleur
```

### 4.4 — RBAC (Role-Based Access Control)

Le projet a **deux niveaux de rôles** :

**Niveau 1 — Rôle global (plateforme)**
| Rôle | Droits |
|---|---|
| `admin` | Tout gérer (utilisateurs, blogs, thèmes) |
| `user` | Utiliser la plateforme |

**Niveau 2 — Rôle dans un blog**
| Rôle | Droits |
|---|---|
| `owner` | Gérer le blog, ses membres, son thème |
| `editor` | Rédiger et publier des articles |
| `moderator` | Modérer commentaires et signalements |
| `member` | Commenter |
| `viewer` | Lecture seule |

**Middleware RBAC — `permissions.js`**

```js
// middlewares/permissions.js — vérification des rôles

// isSelfOrAdmin : autorise admin OU accès à sa propre ressource
const isSelfOrAdmin = (req, res, next) => {
  if (
    req.user.role === "admin"         ||   // admin global → tout autorisé
    req.user.globalRole === "admin"   ||   // admin plateforme → tout autorisé
    Number(req.params.id) === Number(req.user.id) // accède à sa propre ressource
  ) {
    return next(); // ✅ accès accordé
  }
  return res.status(403).json({ status: "error", message: "Accès interdit." });
};

// isBlogOwnerOrAdmin : vérifie owner_id en base de données
const isBlogOwnerOrAdmin = async (req, res, next) => {
  if (req.user.role === "admin") return next(); // court-circuit pour les admins

  const [rows] = await models.blog.find(req.params.id);
  const blog = rows[0];

  if (!blog) {
    return res.status(404).json({ status: "error", message: "Blog introuvable." });
  }

  // Comparaison numérique (Number) pour éviter les bugs de typage string vs number
  if (Number(blog.owner_id) !== Number(req.user.id)) {
    return res.status(403).json({ status: "error", message: "Accès interdit à ce blog." });
  }

  req.resource = { blog }; // 🔑 attache le blog résolu pour éviter une 2e requête SQL
  return next(); // ✅ propriétaire confirmé
};
```

> **Bonne pratique** : `req.resource = { blog }` — on attache l'objet déjà chargé depuis la BDD pour éviter une deuxième requête identique dans le contrôleur. DRY + performance.

### 4.5 — Service d'authentification — hachage Argon2

```js
// services/AuthService.js — verifyPassword()

async function verifyPassword(user, password) {
  const hash = user.password_hash || "";

  // Détection du type de hash par son préfixe
  if (hash.startsWith("$argon2")) {
    // Hash Argon2 (format actuel recommandé) → vérification native
    return argon2.verify(hash, password);
  }

  if (hash.startsWith("$2y$") || hash.startsWith("$2b$")) {
    // Hash bcrypt (anciens comptes) → rétro-compatibilité
    const bcryptHash = hash.replace("$2y$", "$2b$"); // PHP→Node.js normalisation
    const isValid = await bcrypt.compare(password, bcryptHash);

    if (isValid) {
      // Migration transparente : on re-hache en Argon2 sans que l'utilisateur le sache
      const newHash = await argon2.hash(password);
      await models.users.updatePasswordHash(user.id, newHash);
      // ↑ À la prochaine connexion, l'utilisateur aura un hash Argon2
    }
    return isValid;
  }

  return false; // hash inconnu → refus
}
```

> **Pourquoi Argon2 ?** C'est l'algorithme **gagnant du Password Hashing Competition (2015)** recommandé par l'OWASP. Il est conçu pour être lent sur GPU/ASIC, ce qui le rend très résistant aux attaques par force brute.

### 4.6 — Génération du token JWT

```js
// services/AuthService.js — signin()

const token = jwt.sign(
  // Payload : données encodées dans le token (lisibles par le client)
  {
    id:    user.id,    // identifiant en BDD
    email: user.email, // email pour notifications
    role:  user.role   // rôle pour décisions d'accès côté frontend
  },
  jwtSecret,           // secret partagé (en .env, jamais committé)
  { expiresIn: "2h" }  // durée de vie : 2 heures
);
// ↑ Un token expiré → jwt.verify() lève JsonWebTokenError → 401 automatique
```

### 4.7 — Convention de réponse API

Toutes les routes retournent le même format :

```json
// Succès
{
  "status": "success",
  "data": { "user": { "id": 1, "email": "..." } }
}

// Erreur
{
  "status": "error",
  "message": "Description précise de l'erreur"
}
```

| Code HTTP | Signification |
|---|---|
| `200` | Succès (GET, PUT) |
| `201` | Ressource créée (POST) |
| `204` | Supprimé sans contenu (DELETE) |
| `400` | Données invalides |
| `401` | Token absent, invalide ou expiré |
| `403` | Rôle insuffisant |
| `404` | Ressource introuvable |
| `409` | Conflit (email déjà utilisé, slug déjà pris) |
| `429` | Trop de requêtes (rate limiting) |
| `500` | Erreur serveur inattendue |

### 4.8 — Exemple complet : `POST /api/auth/signup`

```
Client                    Serveur Express                    MySQL
──────                    ──────────────────                 ─────
POST /api/auth/signup
  ↓ {username, email,     → express.json()         parse req.body
     password, terms}
                          → authLimiter             vérifie < 10 req/15min
                          → authController.signup()
                            ↓
                            AuthService.signup()
                              ↓ validateRegisterPayload()  valide champs
                              ↓ argon2.hash(password)      hache le mot de passe
                              ↓ models.users.insert(...)   INSERT INTO users ...
                                                           ↑ requête paramétrée
  ← 201 { status: "success",
          data: { user: {...} } }
```

---

---

## PARTIE 5 — Frontend React SPA (12 min)

### 5.1 — Organisation du frontend

Le frontend est une **Single Page Application** (SPA) : une seule page HTML qui charge React, et React Router gère la navigation côté client sans rechargement de page.

```
frontend/src/
├── main.jsx          ← point d'entrée React (ReactDOM.createRoot)
├── App.jsx           ← routeur principal + layout
├── context/          ← états globaux partagés (AuthContext, ThemeContext)
├── services/         ← appels API (authService.js, postsService.js...)
├── pages/            ← composants de page (public/, auth/, dashboard/, owner/...)
├── components/       ← composants réutilisables (Header, Footer, Topbar...)
├── hooks/            ← hooks custom (useAuth, useTheme...)
├── styles/           ← CSS global + variables CSS
└── i18n/             ← traductions (fr.json, en.json)
```

### 5.2 — Démarrage de l'application — `main.jsx`

```jsx
// main.jsx — point d'entrée React

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // routeur basé sur l'API History
import App from "./App";

// Fournisseurs de contexte : encapsulent l'arbre React pour rendre les états globaux accessibles
import { AuthProvider }  from "@context/AuthContext";  // session utilisateur + JWT
import { ThemeProvider } from "@context/ThemeContext";  // thème clair/sombre
import { ToastProvider } from "@context/ToastContext";  // notifications flash

import "./styles/style.css";  // styles globaux

// Polyfill CSS custom property pour text-wrap: balance
// (défini en JS pour que VS Code ne puisse pas faire d'analyse statique de la valeur)
document.documentElement.style.setProperty("--tw-balance", "balance");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BrowserRouter : URL propres (/blogs/mon-blog) au lieu de hash (#/blogs/mon-blog) */}
    <BrowserRouter>
      <AuthProvider>   {/* contexte d'authentification → accessible via useContext(AuthContext) */}
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

> **Pattern de composition** : les providers sont empilés de l'extérieur vers l'intérieur. `AuthProvider` est en haut car presque tous les composants en ont besoin.

### 5.3 — AuthContext — gestion de la session

```jsx
// context/AuthContext.jsx

export const AuthContext = createContext({
  isAuthenticated: false,  // l'utilisateur est-il connecté ?
  isLoading: true,         // en attente de vérification du token
  user: null,              // objet utilisateur (id, email, role...)
  token: null,             // JWT stocké dans localStorage
  signin: () => {},        // fonction de connexion
  logout: () => {},        // fonction de déconnexion
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => getStoredUser()); // init lazy depuis localStorage
  const [token, setToken]     = useState(() => getToken());      // init lazy depuis localStorage
  const [isLoading, setIsLoading] = useState(Boolean(getToken()));
  // ↑ isLoading = true uniquement si un token existe (il faut le vérifier)

  // useEffect : vérifie la validité de la session au chargement de l'app
  useEffect(() => {
    let isMounted = true; // évite les setState sur composant démonté (memory leak)

    async function verifySession() {
      if (!token) { setIsLoading(false); return; }

      try {
        const currentUser = await getCurrentUser(); // GET /api/auth/me avec le JWT
        if (isMounted) setUser(currentUser);
      } catch {
        // Token invalide ou expiré → déconnexion propre
        logoutService();
        if (isMounted) { setUser(null); setToken(null); }
      } finally {
        if (isMounted) setIsLoading(false); // fin du chargement dans tous les cas
      }
    }

    verifySession();
    return () => { isMounted = false; }; // nettoyage au démontage
  }, [token]);

  // canAccess : vérifie si l'utilisateur a l'un des rôles requis
  const canAccess = useCallback((requiredRoles) => {
    if (!user) return false;
    return requiredRoles.includes(user.role) ||
           requiredRoles.includes(user.globalRole);
  }, [user]);

  const value = useMemo(() => ({
    user, token, isAuthenticated: Boolean(user),
    isLoading, signin: signinService, logout: logoutService,
    canAccess,
  }), [user, token, isLoading, canAccess]);
  // ↑ useMemo évite de recréer l'objet contexte à chaque rendu → optimisation

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**Flux de connexion complet :**

```
Utilisateur saisit email + mot de passe
    │
    ▼
signinService(email, password)
    │ POST /api/auth/signin → { token, user }
    ▼
localStorage.setItem("blogyoo_token", token)
localStorage.setItem("blogyoo_user", JSON.stringify(user))
    │
    ▼
AuthContext.setUser(user) + setToken(token)
    │ → isAuthenticated = true
    ▼
React Router redirige vers /dashboard (ou /owner, /editor...)
```

### 5.4 — Client HTTP — `apiClient.js`

```js
// services/apiClient.js

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
// ↑ import.meta.env = variables Vite (remplacées à la compilation)
// VITE_ préfixe obligatoire pour qu'une variable soit accessible dans le code frontend

const apiBaseUrl = `${backendUrl.replace(/\/$/, "")}/api`;
// .replace(/\/$/, "") → enlève un slash final éventuel pour éviter les doubles //

export const getToken = () => window.localStorage.getItem("blogyoo_token");

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData; // détecte upload de fichier

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    // ↑ Si FormData, pas de Content-Type manuel (le navigateur l'ajoute automatiquement
    //   avec le "boundary" multipart nécessaire à Multer côté serveur)
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // ↑ Injection automatique du JWT dans TOUTES les requêtes si l'utilisateur est connecté
    ...options.headers,
  };

  const response = await fetch(buildUrl(endpoint), { ...options, headers });

  const data = await response.json().catch(() => null);
  // ↑ .catch(() => null) → si la réponse est vide (204 No Content), pas d'erreur

  if (!response.ok) {
    const error = new Error(data?.message || "Erreur API.");
    error.status = response.status; // ex: 401, 403, 404
    error.data = data;
    throw error; // ← catch dans les composants/pages qui appellent l'API
  }

  return data;
}

// API unifiée : .get() .post() .put() .delete()
export const apiClient = {
  get:    (endpoint)       => apiRequest(endpoint),
  delete: (endpoint)       => apiRequest(endpoint, { method: "DELETE" }),
  post:   (endpoint, body) => apiRequest(endpoint, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
    // ↑ FormData : passé tel quel (multipart) / Object : sérialisé en JSON
  }),
  put:    (endpoint, body) => apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  }),
};
```

### 5.5 — Protection des routes — PrivateRoute

```jsx
// components/routing/PrivateRoute.jsx (concept simplifié)

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "@context/AuthContext";

function PrivateRoute({ children, requiredRole }) {
  const { isAuthenticated, isLoading, canAccess } = useContext(AuthContext);

  if (isLoading) return <div>Chargement...</div>;
  // ↑ Pendant la vérification du token, on affiche un loader
  //   Évite un flash de redirection si le token est valide mais pas encore vérifié

  if (!isAuthenticated) return <Navigate to="/auth/signin" replace />;
  // ↑ Non connecté → redirection vers la page de connexion

  if (requiredRole && !canAccess([requiredRole])) {
    return <Navigate to="/dashboard" replace />;
    // ↑ Connecté mais mauvais rôle → redirection vers son dashboard
  }

  return children; // ✅ accès accordé
}
```

### 5.6 — Architecture des pages

```
URL accessible          Rôle requis    Page
──────────────          ───────────    ────
/                       aucun          Home.jsx (landing page publique)
/blogs/:slug            aucun          BlogDetail.jsx
/auth/signin            aucun          Signin.jsx
/dashboard              user+          Dashboard.jsx
/editor/posts/new       editor+        PostCreate.jsx
/owner/dashboard        owner+         OwnerDashboard.jsx
/moderator/comments     moderator+     CommentsModeration.jsx
/admin                  admin          AdminPanel.jsx
```

### 5.7 — Internationalisation (i18n)

```js
// i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: { "welcome": "Bienvenue sur Blog à Part" } },
    en: { translation: { "welcome": "Welcome to Blog à Part" } },
  },
  lng: "fr",          // langue par défaut
  fallbackLng: "en",  // si une clé n'est pas trouvée en fr, utiliser en
});
```

---

---

## PARTIE 6 — Tests d'intégration (5 min)

### Philosophie des tests

Le projet utilise des **tests d'intégration** avec Jest + Supertest.

> **Test d'intégration** = on teste le flux HTTP complet, de la requête HTTP jusqu'à la base de données réelle. Pas de mock, pas de simulation : la vraie BDD est utilisée.

**Pourquoi pas de mocks ?** Parce que l'objectif est de valider que le système fonctionne vraiment ensemble — middleware + contrôleur + service + base de données — pas de tester les composants isolément.

### Configuration Jest

```js
// jest.config.cjs
module.exports = {
  testEnvironment: "node",                       // environnement Node.js (pas jsdom)
  testMatch: ["**/__tests__/**/*.test.js"],      // cherche les fichiers *.test.js dans __tests__/
};
```

### Lancer les tests

```bash
cd backend

# --runInBand : oblige Jest à exécuter les suites EN SÉRIE
# (les tests partagent la même BDD, les exécuter en parallèle créerait des conflits)
npm test -- --runInBand
```

**Résultats :**
```
Test Suites: 4 passed, 4 total
Tests:       42 passed, 42 total
```

### Exemple de test — `auth.test.js`

```js
// __tests__/auth.test.js

const { app, db, request } = require("./helpers");

// Suffixe unique pour chaque run → évite les conflits si les tests tournent plusieurs fois
const SUFFIX = Date.now();
const TEST_EMAIL = `auth_test_${SUFFIX}@test.local`;
const TEST_PASSWORD = "TestPass1!";

let authToken = null;   // stocké entre les tests (signup → signin → me)
let createdUserId = null;

// ─── Test 1 : inscription ─────────────────────────────────────────────────────
describe("POST /api/auth/signup", () => {
  test("201 — crée un compte avec des données valides", async () => {
    const res = await request(app)       // supertest : crée un serveur HTTP de test
      .post("/api/auth/signup")          // envoie une vraie requête POST
      .send({
        username: `user_${SUFFIX}`,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        accepted_terms: true,            // RGPD obligatoire
        accepted_privacy: true,
      })
      .expect(201);                      // vérifie le code HTTP

    // Assertions sur la structure de la réponse
    expect(res.body.status).toBe("success");
    expect(res.body.data?.user).toMatchObject({ email: TEST_EMAIL });
    createdUserId = res.body.data?.user?.id;
  });

  test("409 — rejette un email déjà utilisé", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ username: "autre", email: TEST_EMAIL, ... }) // même email
      .expect(409); // CONFLICT : l'email existe déjà en base
  });

  test("400 — rejette un payload incomplet", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ username: "nomail", password: TEST_PASSWORD }) // sans email
      .expect(400); // BAD REQUEST
  });
});

// ─── Test 2 : connexion ────────────────────────────────────────────────────────
describe("POST /api/auth/signin", () => {
  test("200 — renvoie un token JWT valide", async () => {
    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    expect(res.body.token).toBeDefined(); // le JWT est dans la réponse
    authToken = res.body.token;           // on le garde pour le test suivant
  });
});

// ─── Test 3 : route protégée ───────────────────────────────────────────────────
describe("GET /api/auth/me", () => {
  test("200 — retourne le profil de l'utilisateur connecté", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`) // inject le JWT
      .expect(200);

    expect(res.body.email).toBe(TEST_EMAIL);
  });

  test("401 — rejetté sans token", async () => {
    await request(app)
      .get("/api/auth/me")
      // pas de header Authorization
      .expect(401);
  });
});
```

**Ce que ces tests prouvent :**
- Le service d'inscription crée bien un utilisateur en BDD
- Les conflits d'email sont correctement détectés (index UNIQUE MySQL)
- Le middleware JWT protège bien les routes
- Le token renvoyé par signin est bien utilisable sur les routes protégées

---

---

## PARTIE 7 — Déploiement en production (4 min)

### Architecture de déploiement

```
Utilisateur
    │
    ├─ Frontend → Netlify (CDN mondial)
    │   https://blog-a-part.netlify.app
    │   Fichiers statiques React compilés (dist/)
    │
    └─ Backend → Render.com (PaaS)
        https://blog-a-part-api.onrender.com
        Node.js / Express
        │
        └─ Base de données → Filess.io
            MySQL 8 cloud (SSL obligatoire, port 3307)
```

### Étapes de déploiement

**1. Base de données** — Filess.io (cloud MySQL gratuit)
- Création d'une BDD MySQL en ligne
- Récupération des identifiants (host, port, user, password)
- SSL activé : `DB_SSL=true` dans l'environnement Render

**2. Backend** — Render.com
```yaml
# render.yaml — Blueprint de déploiement automatique
services:
  - type: web
    name: blog-a-part-api
    runtime: node
    buildCommand: npm ci && node migrate.js   # installe dépendances + exécute migrations SQL
    startCommand: node src/server.js           # démarre le serveur Express
    envVars:
      - key: JWT_SECRET
        generateValue: true                    # Render génère une valeur sécurisée automatiquement
      - key: FRONTEND_URL
        value: https://blog-a-part.netlify.app
```

**3. Frontend** — Netlify
```toml
# netlify.toml
[build]
  base    = "frontend"
  command = "npm run build"   # vite build → génère dist/
  publish = "dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
  # ↑ SPA fallback : toute URL renvoie index.html (React Router gère le routing côté client)
```

### Variables d'environnement

| Environnement | Variable | Valeur |
|---|---|---|
| Backend (Render) | `JWT_SECRET` | secret aléatoire sécurisé |
| Backend (Render) | `DB_HOST` | xxxx.h.filess.io |
| Backend (Render) | `DB_SSL` | `true` |
| Backend (Render) | `FRONTEND_URL` | https://blog-a-part.netlify.app |
| Frontend (Netlify) | `VITE_BACKEND_URL` | https://blog-a-part-api.onrender.com |

> **Principe fondamental** : aucune valeur sensible (secret, mot de passe, clé API) n'est jamais committée dans le code source. Tout passe par les variables d'environnement de la plateforme d'hébergement.

---

---

## SYNTHÈSE — Points clés à retenir

### Ce que ce projet démontre techniquement

| Compétence | Preuve dans le projet |
|---|---|
| **API REST complète** | 50+ endpoints sur 14 ressources (users, blogs, posts...) |
| **Authentification sécurisée** | JWT + Argon2 + rate limiting |
| **Autorisation fine** | RBAC à 2 niveaux (plateforme + blog) |
| **Base de données relationnelle** | 12+ tables, clés étrangères, contraintes UNIQUE |
| **SPA React moderne** | Contextes, hooks, React Router, i18n |
| **Tests d'intégration** | 42 tests couvrant le flux HTTP complet |
| **Architecture propre** | MVC, DAO, séparation des responsabilités |
| **Déploiement cloud** | Render + Netlify + Filess.io |
| **Sécurité OWASP** | Injection SQL, XSS, bruteforce, CORS, RGPD |

### Les choix techniques justifiés

| Choix | Justification |
|---|---|
| **Argon2** au lieu de bcrypt | Gagnant du Password Hashing Competition, résistant aux GPUs |
| **JWT** au lieu de sessions | SPA stateless, compatible avec Netlify/Render sans session partagée |
| **Pool de connexions** MySQL | Performance : réutilise les connexions ouvertes entre les requêtes |
| **mysql2/promise** | API async/await native, pas de callback hell |
| **Requêtes paramétrées** | Protection systématique contre l'injection SQL (OWASP A03) |
| **Set pour allowedOrigins** | Vérification CORS en O(1) plutôt qu'O(n) |
| **Tests d'intégration** | Valide le fonctionnement réel end-to-end, pas les mocks |
| **Migrations SQL** | Versionne les changements de schéma, reproductibles |

---

## Questions fréquentes du jury

**Q : Comment protégez-vous contre l'injection SQL ?**
> Toutes les requêtes utilisent des paramètres préparés (`?`). La valeur n'est jamais concaténée directement dans la chaîne SQL. mysql2 prend en charge l'échappement automatique.

**Q : Que se passe-t-il si le JWT est volé ?**
> Le token expire après 2h (paramètre `expiresIn: "2h"`). Il n'y a pas de blacklist de tokens (choix de simplicité). Pour une sécurité renforcée, on pourrait implémenter un token de rafraîchissement (*refresh token*) ou une liste de révocation en base de données.

**Q : Pourquoi séparer Service et Controller ?**
> Le contrôleur lit uniquement `req` et envoie `res`. Le service contient la logique métier (hachage, validation, règles). Cela permet de tester le service indépendamment du protocole HTTP.

**Q : Comment fonctionne le RBAC à deux niveaux ?**
> `platform_role` (admin/user) est stocké dans `users` — c'est le rôle global sur la plateforme. Le rôle dans un blog (`owner`, `editor`...) est dans `blog_members`. `req.user.globalRole` vs `req.user.role` dans les middlewares.

**Q : Comment gérez-vous l'état global dans React ?**
> Via trois contextes (`AuthContext`, `ThemeContext`, `ToastContext`). Chaque contexte expose un Provider qui encapsule l'arbre React. Les composants consomment les contextes via `useContext()`. `useMemo` optimise les re-rendus.

**Q : Comment avez-vous sécurisé les uploads de fichiers ?**
> Multer limite la taille des fichiers et les types MIME acceptés (images uniquement). Les fichiers sont stockés dans `public/uploads/` avec un nom généré aléatoirement pour éviter l'écrasement et l'exécution de scripts malveillants.

**Q : Que testent exactement les 42 tests ?**
> Ce sont des tests d'intégration : ils envoient de vraies requêtes HTTP via Supertest à une vraie BDD MySQL. Ils couvrent signup/signin/me (auth), CRUD blogs, CRUD posts, CRUD catégories. Chaque test vérifie le code HTTP, la structure JSON et l'état en base.

---

*Synthèse rédigée pour la soutenance — Titre Professionnel DWWM — Juin 2026*
