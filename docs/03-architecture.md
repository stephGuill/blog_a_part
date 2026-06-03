# 03 — Architecture du projet

> [← 02 Installation](02-installation.md) | [04 — Base de données →](04-base-de-donnees.md)

---

## Vue d'ensemble

Blog à Part suit une architecture **client-serveur** classique avec séparation totale du frontend et du backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVIGATEUR                              │
│  React SPA (Vite)  ←→  React Router  ←→  Axios (apiClient.js)  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/JSON (CORS)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVEUR BACKEND                            │
│  Express.js                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Middlewares│  │   Routeurs   │  │    Contrôleurs         │   │
│  │ CORS      │  │ /api/auth    │  │    authController      │   │
│  │ JWT auth  │  │ /api/blogs   │  │    blogsController     │   │
│  │ RBAC      │  │ /api/posts   │  │    postsController     │   │
│  │ RateLimit │  │ /api/...     │  │    ...                 │   │
│  └──────────┘  └──────────────┘  └────────────┬───────────┘   │
│                                                │               │
│  ┌─────────────────────────────────────────────▼───────────┐   │
│  │                    Modèles (Managers)                    │   │
│  │  AbstractManager ← UsersManager, PostsManager, ...      │   │
│  └────────────────────────────┬────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────┘
                                │ mysql2/promise
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MySQL 8                                   │
│  users │ blogs │ posts │ categories │ comments │ themes │ ...   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Structure des fichiers

### Racine du projet

```
blog_a_part/
├── README.md
├── .env.sample               ← template pour docker-compose
├── docker-compose.yml        ← orchestration Docker
├── render.yaml               ← déploiement Render.com
├── docs/                     ← documentation (ce dossier)
├── backend/
└── frontend/
```

### Backend (`backend/`)

```
backend/
├── .env.sample               ← template des variables d'environnement
├── .env                      ← config locale (non committé)
├── Dockerfile                ← image Docker Node.js
├── jest.config.cjs           ← configuration Jest
├── migrate.js                ← runner de migrations SQL
├── database.sql              ← schéma principal (tables)
│
├── database/                 ← migrations SQL incrémentales
│   ├── client.js             ← pool de connexions MySQL (mysql2)
│   ├── patch_auth_security.sql
│   ├── patch_builder.sql
│   ├── patch_legal_consents.sql
│   ├── patch_post_pending_status.sql
│   ├── patch_saas_permissions.sql
│   ├── seed.sql
│   └── seed_data.sql
│
├── public/                   ← fichiers statiques servis par Express
│   └── uploads/avatars/      ← avatars uploadés
│
├── scripts/                  ← scripts d'administration ponctuels
│   ├── apply-auth-security-patch.js
│   ├── apply-builder-patch.js
│   └── apply-saas-permissions-patch.js
│
├── __tests__/                ← tests d'intégration Jest + Supertest
│   ├── helpers.js            ← utilitaires partagés (user de test, token)
│   ├── auth.test.js          ← tests /api/auth
│   ├── blogs.test.js         ← tests /api/blogs
│   ├── categories.test.js    ← tests /api/categories
│   └── posts.test.js         ← tests /api/posts
│
└── src/
    ├── app.js                ← instance Express (middlewares globaux, CORS)
    ├── server.js             ← point d'entrée (dotenv + listen)
    ├── router.js             ← montage de toutes les routes
    │
    ├── config/
    │   └── jwtConfig.js      ← secret JWT + durée d'expiration
    │
    ├── controllers/          ← logique HTTP (req → res)
    │   ├── authController.js
    │   ├── blogsController.js
    │   ├── postsController.js
    │   ├── categoriesController.js
    │   ├── commentsController.js
    │   ├── dashboardController.js
    │   ├── mediaController.js
    │   ├── reportsController.js
    │   ├── themesController.js
    │   ├── usersController.js
    │   ├── adminUsersController.js
    │   ├── blogMembersController.js
    │   ├── builderController.js
    │   └── itemsController.js
    │
    ├── middlewares/          ← chaîne de traitement des requêtes
    │   ├── auth.js           ← protect() : vérifie le JWT
    │   ├── permissions.js    ← isSelfOrAdmin, isBlogOwnerOrAdmin
    │   ├── rateLimit.js      ← authLimiter (express-rate-limit)
    │   ├── requireBlogPermission.js ← RBAC par permission de blog
    │   ├── requireGlobalRole.js     ← vérifie le rôle global
    │   ├── requireSuperAdmin.js     ← admin plateforme uniquement
    │   └── upload.js         ← Multer (upload d'images)
    │
    ├── models/               ← accès base de données
    │   ├── AbstractManager.js ← find, findAll, delete, query
    │   ├── index.js          ← exports de tous les managers
    │   ├── UsersManager.js
    │   ├── blogManager.js
    │   ├── PostsManager.js
    │   ├── CategoriesManager.js
    │   ├── CommentsManager.js
    │   ├── ThemesManager.js
    │   ├── MediaManager.js
    │   ├── ReportsManager.js
    │   ├── BlogMembersManager.js
    │   ├── BuilderManager.js
    │   ├── ItemManager.js
    │   ├── AuditLogsManager.js
    │   └── UserOAuthAccountsManager.js
    │
    ├── routes/               ← définition des routes par ressource
    │   ├── auth.js
    │   ├── blogs.js
    │   ├── posts.js
    │   ├── categories.js
    │   ├── comments.js
    │   ├── users.js
    │   ├── adminUsers.js
    │   ├── blogMembers.js
    │   ├── media.js
    │   ├── themes.js
    │   ├── dashboard.js
    │   ├── reports.js
    │   ├── items.js
    │   └── ownerBuilder.js
    │
    ├── services/             ← logique métier complexe (découplée du HTTP)
    │   ├── AuthService.js    ← signup, signin, 2FA, OAuth
    │   ├── AdminUsersService.js
    │   └── BuilderService.js
    │
    └── utils/                ← fonctions utilitaires transverses
        ├── allowedStyles.js  ← liste blanche CSS pour le builder
        ├── authValidators.js ← validation mot de passe, email
        ├── permissions.js    ← getPermissionsForBlogRole, hasGlobalAdminAccess
        ├── roles.js          ← hiérarchie des rôles
        ├── AppError.js       ← classe d'erreur personnalisée
        └── ...
```

### Frontend (`frontend/`)

```
frontend/
├── .env.sample               ← VITE_BACKEND_URL
├── Dockerfile                ← build Vite + Nginx Alpine
├── netlify.toml              ← déploiement Netlify
├── default.conf              ← configuration Nginx (SPA routing)
├── vite.config.js            ← configuration Vite (alias, plugins)
├── index.html                ← point d'entrée HTML
│
└── src/
    ├── App.jsx               ← routeur principal (React Router)
    ├── main.jsx              ← point d'entrée React
    │
    ├── assets/               ← images, polices statiques
    ├── styles/               ← CSS global (style.css)
    │
    ├── context/              ← contextes React globaux
    │   ├── AuthContext.jsx   ← utilisateur connecté, token
    │   ├── ThemeContext.jsx  ← thème clair/sombre
    │   └── ToastContext.jsx  ← notifications toast
    │
    ├── hooks/                ← hooks React personnalisés
    │   ├── useAuth.js        ← accès à AuthContext
    │   ├── useDebounce.js
    │   ├── useFetch.js
    │   └── useTheme.js
    │
    ├── services/             ← appels API (Axios)
    │   ├── apiClient.js      ← instance Axios + intercepteurs JWT
    │   ├── authService.js
    │   ├── blogsService.js
    │   ├── postsService.js
    │   ├── categoriesService.js
    │   ├── commentsService.js
    │   ├── usersService.js
    │   ├── mediaService.js
    │   ├── themesService.js
    │   └── dashboardService.js
    │
    ├── components/           ← composants réutilisables
    │   ├── auth/             ← SignupForm, SigninForm, ProtectedRoute, RoleRoute
    │   ├── blog/             ← BlogCard, BlogPreview
    │   ├── dashboard/        ← StatCard, ActivityList, QuickActions
    │   ├── layout/           ← DashboardLayout, PublicLayout, Sidebar, Header
    │   ├── legal/            ← ConsentModal
    │   ├── posts/            ← PostCard, PostEditor
    │   └── ui/               ← Button, Input, Modal, Card, Badge, Table…
    │
    ├── pages/                ← pages de l'application
    │   ├── admin/            ← AdminDashboard, AdminUsers, AdminBlogs…
    │   ├── auth/             ← Signin, Signup, ForgotPassword
    │   ├── dashboard/        ← Dashboard, Profile, Settings
    │   ├── editor/           ← PostsList, PostCreate, PostEdit
    │   ├── errors/           ← NotFound, Forbidden
    │   ├── legal/            ← LegalNotice, PrivacyPolicy, TermsOfUse
    │   ├── moderator/        ← ModeratorDashboard, CommentsModeration
    │   ├── owner/            ← OwnerDashboard, BlogBuilder, ThemeCustomizer
    │   └── public/           ← Blogs, BlogDetail, PostDetail, Features, Pricing
    │
    ├── i18n/                 ← internationalisation (i18next)
    └── utils/                ← helpers JS (dates, roles, validators)
```

---

## Flux d'une requête HTTP

Exemple : `POST /api/posts` (créer un article)

```
1. Navigateur (React)
   → apiClient.js ajoute le header Authorization: Bearer <token>
   → POST /api/posts { blog_id, title, slug, content, status }

2. Express — app.js
   → express.json() parse le body
   → CORS vérifie l'origine

3. router.js
   → route vers routes/posts.js

4. routes/posts.js
   → protect()                  → vérifie le JWT → attache req.user
   → requireBlogPermission('create_post')
                                → résout blog_id depuis req.body.blog_id
                                → vérifie que req.user est membre actif
                                → vérifie que le membre a la permission 'create_post'
   → postsController.add()

5. postsController.add()
   → normalizePostPayload()     → valide status, author_id, published_at
   → models.posts.insert()     → INSERT INTO posts ...

6. models/PostsManager.js
   → database.query(INSERT ...)
   → MySQL exécute la requête

7. Réponse
   → 201 + header Location: /posts/:insertId
   → ou 500 si erreur SQL
```

---

## Pattern MVC adapté

Le projet suit un pattern **MVC allégé** :

| Couche | Responsabilité | Dossier |
|---|---|---|
| **Routes** | Déclare les endpoints, applique les middlewares | `src/routes/` |
| **Controllers** | Reçoit req/res, orchestre la réponse HTTP | `src/controllers/` |
| **Services** | Logique métier complexe (indépendant de HTTP) | `src/services/` |
| **Models/Managers** | Requêtes SQL, accès DB | `src/models/` |
| **Middlewares** | Traitements transversaux (auth, RBAC, upload) | `src/middlewares/` |

---

> [← 02 Installation](02-installation.md) | [04 — Base de données →](04-base-de-donnees.md)
