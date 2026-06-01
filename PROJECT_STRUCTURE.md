# 📁 Structure Complète du Projet blog_a_part

## 🏗️ Architecture Générale

```
blog_a_part/
├── 📄 package.json                 # Scripts racine (dev, start, migrate, lint, fix)
├── 📄 README.md                    # Documentation principale
├── 📄 .gitignore                   # Fichiers ignorés par Git
├── 📄 LISEZ-MOI.md                 # Documentation en français
├── 📄 database-setup.sh            # Script de création/setup DB
│
├── 📁 backend/                     # Serveur Node.js Express + MySQL
│   ├── 📄 package.json             # Dépendances backend (express, mysql2, argon2, jsonwebtoken, etc)
│   ├── 📄 server.js                # Point d'entrée du serveur (écoute port 5000)
│   ├── 📄 migrate.js               # Script de migration DB (crée schéma)
│   ├── 📄 seed.js                  # Script de peuplement données (Faker)
│   ├── 📄 jest.config.js           # Config tests
│   ├── 📄 .env                     # Variables environnement (DB, JWT, PORT)
│   ├── 📄 .env.sample              # Variables environnement (DB, JWT, PORT)
│   ├── 📄 .gitignore               # gitignore du back
│   ├── 📄 database.sql             # Schéma SQL (tables: users, themes, blogs, posts, comments, media, categories)
│   ├── 📄 README.md                # Documentation backend
│   │
│   ├── 📁 src/
│   │   ├── 📄 app.js               # Instance Express principale (middlewares CORS, JSON, routing)
│   │   ├── 📄 router.js            # Routeur principal (monte les routes modulaires)
│   │   │
│   │   ├── 📁 config/
│   │   │   └── 📄 jwtConfig.js     # Config JWT (JWT_SECRET, JWT_EXPIRES_IN)
│   │   │
│   │   ├── 📁 controllers/         # Logique métier par ressource (MVC pattern)
│   │   │   ├── 📄 authController.js       # signup, signin
│   │   │   ├── 📄 usersController.js      # browse, read, add, edit, destroy
│   │   │   ├── 📄 itemsController.js      # CRUD items
│   │   │   ├── 📄 themesController.js     # CRUD themes
│   │   │   └── 📄 postsController.js      # CRUD posts
│   │   │
│   │   ├── 📁 services/            # Services métier (Couche applicative)
│   │   │   └── 📄 AuthService.js   # signup avec Argon2, signin avec JWT + role RBAC
│   │   │
│   │   ├── 📁 middlewares/         # Middlewares Express pour auth et validation
│   │   │   └── 📄 auth.js          # protect (vérif JWT), restrictTo (vérif rôle)
│   │   │
│   │   ├── 📁 routes/              # Routeurs modulaires (Separation of concerns)
│   │   │   ├── 📄 auth.js          # POST /api/auth/signup, /api/auth/signin
│   │   │   ├── 📄 users.js         # GET /users, /users/:id, POST, PUT, DELETE
│   │   │   ├── 📄 items.js         # CRUD /items
│   │   │   ├── 📄 themes.js        # CRUD /themes (type ENUM: blog, page, post)
│   │   │   └── 📄 posts.js         # CRUD /posts (status ENUM: draft, published, archived)
│   │   │
│   │   └── 📁 models/              # Couche données (Managers pour requêtes SQL)
│   │       ├── 📄 AbstractManager.js      # Classe abstraite (find, findAll, delete, setDatabase)
│   │       ├── 📄 index.js                # Initialise pool MySQL et enregistre managers
│   │       ├── 📄 ItemManager.js          # CRUD pour items
│   │       ├── 📄 CategoriesManager.js    # CRUD pour categories
│   │       ├── 📄 commentsManager.js      # CRUD pour comments
│   │       ├── 📄 BlogsManager.js         # CRUD pour blogs
│   │       ├── 📄 MediaManager.js         # CRUD pour media
│   │       ├── 📄 PostsManager.js         # CRUD pour posts
│   │       ├── 📄 ThemesManager.js        # CRUD pour themes
│   │       └── 📄 UsersManager.js         # findByEmail, findByUsername, findByLogin, insert, update, delete
│   │    
│   ├── 📁 database/
│   │   └── 📄 client.js                   # Configuration pool MySQL2 (connexion réutilisable)
│   │   └── 📄 seed_data.sql               # MySQL2 (données test)
│   │
│   ├── 📁 public/                  # Fichiers statiques publics
│   │   └── 📁 assets/
│   │       └── 📁 images/          # Images du site
│   │           └── 📄 favicon.png  # image favicon
│   └── 📁 node_modules/            # Dépendances npm (générées par npm install)
│
├── 📁 frontend/                    # Client React + Vite
│   ├── 📄 package.json             # Dépendances frontend (react, vite, etc)
│   ├── 📄 index.html               # HTML Root (Single Page App)
│   ├── 📄 vite.config.js           # Config bundler Vite
│   ├── 📄 jsconfig.json            # Config JS (aliases, etc)
│   ├── 📄 eslint.config.js         # Config linter
│   ├── 📄 default.conf             # Config nginx (si déploiement)
│   ├── 📄 README.md                # Documentation frontend
│   ├── 📄 .env                     # Variables environnement frontend (à créer depuis .env.sample)
│   ├── 📄 .env.sample              # Template variables frontend (versionné)
│   │
│   ├── 📁 src/
│   │   ├── 📄 main.jsx             # Point d'entrée React (ReactDOM.render)
│   │   ├── 📄 App.jsx              # Composant racine (routeur principal)
│   │   ├── 📄 App.css              # Styles globaux
│   │   │
│   │   ├── 📁 styles/                    # Styles globaux de tout le frontend
│   │   │   ├── 📄 style.css              # Importe tous les fichiers CSS globaux
│   │   │   ├── 📄 variables.css          # Variables globales : couleurs, spacing, radius, shadows
│   │   │   ├── 📄 themes.css             # Thèmes light/dark avec variables CSS
│   │   │   ├── 📄 globals.css            # Reset CSS, body, typography, links, images
│   │   │   ├── 📄 layout.css             # Containers, sections, grilles globales
│   │   │   ├── 📄 utilities.css          # Classes utilitaires : text-center, hidden, flex, etc.
│   │   │   ├── 📄 animations.css         # Animations globales : fade, slide, hover
│   │   │   └── 📄 responsive.css         # Breakpoints mobile-first, tablette, desktop
│   │   │
│   │   ├── 📁 components/          # Composants réutilisables  
│   │   │   ├── 📁 ui/                    # Petits composants UI génériques
│   │   │   │   ├── 📁 Button/
│   │   │   │   │   ├── 📄 Button.jsx         # Bouton réutilisable : primary, secondary, danger
│   │   │   │   │   └── 📄 Button.css         # Styles du bouton
│   │   │   │   │
│   │   │   │   ├── 📁 Input/
│   │   │   │   │   ├── 📄 Input.jsx          # Champ de formulaire réutilisable
│   │   │   │   │   └── 📄 Input.css          # Styles du champ de formulaire
│   │   │   │   │
│   │   │   │   ├── 📁 Textarea/
│   │   │   │   │   ├── 📄 Textarea.jsx       # Zone de texte pour articles/commentaires
│   │   │   │   │   └── 📄 Textarea.css       # Styles du textarea
│   │   │   │   │
│   │   │   │   ├── 📁 Select/
│   │   │   │   │   ├── 📄 Select.jsx         # Select personnalisé pour rôles, catégories, statuts
│   │   │   │   │   └── 📄 Select.css         # Styles du select
│   │   │   │   │
│   │   │   │   ├── 📁 Card/    
│   │   │   │   │  ├── 📄 Card.jsx           # Carte UI pour dashboards, articles, blocs
│   │   │   │   │  └── 📄 Card.css           # Styles des cartes
│   │   │   │   │   
│   │   │   │   ├── 📁 Badge/    
│   │   │   │   │   ├── 📄 Badge.jsx          # Badge pour rôle, statut, catégorie
│   │   │   │   │   └── 📄 Badge.css          # Styles des badges
│   │   │   │   │
│   │   │   │   ├── 📁 Alert/
│   │   │   │   │   ├── 📄 Alert.jsx          # Message succès/erreur/info
│   │   │   │   │   └── 📄 Alert.css          # Styles des alertes
│   │   │   │   │
│   │   │   │   ├── 📁 Modal/
│   │   │   │   │   ├── 📄 Modal.jsx          # Fenêtre modale de confirmation/action
│   │   │   │   │   └── 📄 Modal.css          # Styles de la modale
│   │   │   │   │
│   │   │   │   ├── 📁 Spinner/
│   │   │   │   │   ├── 📄 Spinner.jsx        # Loader pendant les requêtes API
│   │   │   │   │   └── 📄 Spinner.css        # Styles du loader
│   │   │   │   │
│   │   │   │   ├── 📁 Avatar/
│   │   │   │   │   ├── 📄 Avatar.jsx         # Avatar utilisateur
│   │   │   │   │   └── 📄 Avatar.css         # Styles avatar
│   │   │   │   │
│   │   │   │   ├── 📁 Dropdown/
│   │   │   │   │   ├── 📄 Dropdown.jsx       # Menu déroulant utilisateur/actions
│   │   │   │   │   └── 📄 Dropdown.css       # Styles dropdown
│   │   │   │   │
│   │   │   │   ├── 📁 Table/
│   │   │   │   │   ├── 📄 Table.jsx          # Tableau réutilisable pour admin/dashboard
│   │   │   │   │   └── 📄 Table.css          # Styles tableau
│   │   │   │   │
│   │   │   │   ├── 📁 EmptyState/
│   │   │   │   │   ├── 📄 EmptyState.jsx     # Affichage quand aucune donnée n’est disponible
│   │   │   │   │   └── 📄 EmptyState.css     # Styles empty state
│   │   │   │   │
│   │   │   │   └── 📁 ThemeToggle/
│   │   │   │       ├── 📄 ThemeToggle.jsx    # Bouton de bascule light/dark mode
│   │   │   │       └── 📄 ThemeToggle.css    # Styles du switch thème
│   │   │   │
│   │   │   ├── 📁 blog/                  # Composants liés aux blogs publics/owners
│   │   │   │   ├── 📁 BlogCard/
│   │   │   │   │   ├── 📄 BlogCard.jsx       # Carte d’aperçu d’un blog
│   │   │   │   │   └── 📄 BlogCard.css       # Styles carte blog
│   │   │   │   │
│   │   │   │   └── 📁 BlogPreview/
│   │   │   │       ├── 📄 BlogPreview.jsx    # Prévisualisation d’un blog
│   │   │   │       └── 📄 BlogPreview.css    # Styles prévisualisation blog
│   │   │   │
│   │   │   ├── 📁 layout/          # Composants de structure des pages
│   │   │   │   ├── 📁 PublicLayout/
│   │   │   │   │   ├── 📄 PublicLayout.jsx   # Layout des pages publiques : home, pricing, signin
│   │   │   │   │   └── 📄 PublicLayout.css   # Styles du layout public
│   │   │   │   │
│   │   │   │   ├── 📁 DashboardLayout/
│   │   │   │   │   ├── 📄 DashboardLayout.jsx # Layout connecté : sidebar + topbar + contenu
│   │   │   │   │   └── 📄 DashboardLayout.css # Styles du dashboard global
│   │   │   │   |
│   │   │   │   ├── 📁 Header/
│   │   │   │   │   ├── 📄 Header.jsx         # Header public du site marketing
│   │   │   │   │   └── 📄 Header.css         # Styles header public
│   │   │   │   │
│   │   │   │   ├── 📁 Sidebar/
│   │   │   │   │   ├── 📄 Sidebar.jsx        # Navigation latérale du dashboard
│   │   │   │   │   └── 📄 Sidebar.css        # Styles sidebar responsive
|   |   |   |   |
│   │   │   │   ├── 📁 Topbar/
│   │   │   │   │   ├── 📄 Topbar.jsx         # Barre supérieure du dashboard
│   │   │   │   │   └── 📄 Topbar.css         # Styles topbar
│   │   │   │   │
│   │   │   │   ├── 📁 Footer/
│   │   │   │   │   ├── 📄 Footer.jsx         # Footer public du site
│   │   │   │   │   └── 📄 Footer.css         # Styles footer
│   │   │   │   | 
│   │   │   │   └── 📁 MobileNav/
│   │   │   │       ├── 📄 MobileNav.jsx      # Navigation mobile pour dashboard/public
│   │   │   │       └── 📄 MobileNav.css      # Styles navigation mobile
│   │   │   │   
│   │   │   │
    │   │   ├── 📁 posts/                 # Composants liés aux articles
│   │   │   │   ├── 📁 PostCard/
│   │   │   │   │   ├── 📄 PostCard.jsx       # Carte article
│   │   │   │   │   └── 📄 PostCard.css       # Styles carte article
│   │   │   │   │
│   │   │   │   └── 📁 PostEditor/
│   │   │   │       ├── 📄 PostEditor.jsx     # Éditeur simple d’article
│   │   │   │       └── 📄 PostEditor.css     # Styles éditeur article  
│   │   │   │
│   │   │   ├── 📁 dashboard/             # Widgets spécifiques aux dashboards
│   │   │   │   ├── 📁 StatCard/
│   │   │   │   │   ├── 📄 StatCard.jsx       # Carte statistique : vues, articles, commentaires
│   │   │   │   │   └── 📄 StatCard.css       # Styles statistiques
│   │   │   │   │
│   │   │   │   ├── 📁 ActivityList/
│   │   │   │   │   ├── 📄 ActivityList.jsx   # Liste des dernières activités
│   │   │   │   │   └── 📄 ActivityList.css   # Styles activité
│   │   │   │   │
│   │   │   │   └── 📁 QuickActions/
│   │   │   │       ├── 📄 QuickActions.jsx   # Actions rapides dashboard
│   │   │   │       └── 📄 QuickActions.css   # Styles actions rapides  
│   │   │   │
│   │   │   └── 📁 auth/            # Composants liés à l’authentification
│   │   │       ├── 📁 SignupForm/
│   │   │       │   ├── 📄 SignupForm.jsx     # Formulaire d’inscription
│   │   │       │   └── 📄 SignupForm.css     # Styles du formulaire signup
│   │   │       │
│   │   │       ├── 📁 SigninForm/
│   │   │       │   ├── 📄 SigninForm.jsx     # Formulaire de connexion
│   │   │       │   └── 📄 SigninForm.css     # Styles du formulaire signin
|   |   |       |
│   │   │       ├── 📁 ForgotPasswordForm/
│   │   │       │   ├── 📄 ForgotPasswordForm.jsx # Formulaire mot de passe oublié
│   │   │       │   └── 📄 ForgotPasswordForm.css # Styles mot de passe oublié
|   |   |       |
│   │   │       ├── 📄 ProtectedRoute.jsx # Protège une route si l’utilisateur n’est pas connecté
│   │   │       └── 📄 RoleRoute.jsx      # Protège une route selon le rôle : admin, owner, editor
│   │   │
│   │   │
│   │   ├── 📁 pages/                     # Pages React correspondant aux routes frontend
│   │   │   │
│   │   │   ├── 📁 public/                # Pages visibles sans connexion
│   │   │   │   ├── 📁 Home/
│   │   │   │   │    ├── 📄 Home.jsx           # Page d’accueil marketing blog_a_part
│   │   │   │   │    └── 📄 Home.css           # Styles page accueil
│   │   │   │   │
│   │   │   │   │
│   │   │   │   ├── 📁 Pricing/
│   │   │   │   │    ├── 📄 Pricing.jsx        # Page tarifs SaaS
│   │   │   │   │    └── 📄 Pricing.css        # Styles page tarifs
│   │   │   │   │
│   │   │   │   ├── 📁 Features/
│   │   │   │   │    ├── 📄 Features.jsx       # Page fonctionnalités
│   │   │   │   │    └── 📄 Features.css       # Styles page fonctionnalités
│   │   │   │   │
│   │   │   │   ├── 📁 About/
│   │   │   │   │    ├── 📄 About.jsx          # Page à propos
│   │   │   │   │    └── 📄 About.css          # Styles page à propos
│   │   │   │   │
│   │   │   │   ├── 📁 Contact/
│   │   │   │   │    ├── 📄 Contact.jsx        # Page contact
│   │   │   │   │    └── 📄 Contact.css        # Styles page contact
│   │   │   │   │
│   │   │   │   └── 📁 BlogExplore/
│   │   │   │       ├── 📄 BlogExplore.jsx    # Page pour découvrir des blogs publics
│   │   │   │       └── 📄 BlogExplore.css    # Styles découverte blogs
│   │   │   │
│   │   │   │
│   │   │   ├── 📁 auth/                  # Pages d’authentification
│   │   │   │   ├── 📁 Signup/
│   │   │   │   │    ├── 📄 Signup.jsx         # Page inscription, utilise SignupForm
│   │   │   │   │    └── 📄 Signup.css         # Styles page inscription
│   │   │   │   │
│   │   │   │   ├── 📁 Signin/
│   │   │   │   │    ├── 📄 Signin.jsx         # Page connexion, utilise SigninForm
│   │   │   │   │    └── 📄 Signin.css         # Styles page connexion
│   │   │   │   │
│   │   │   │   └── 📁 ForgotPassword/
│   │   │   │       ├── 📄 ForgotPassword.jsx # Page mot de passe oublié
│   │   │   │       └── 📄 ForgotPassword.css # Styles mot de passe oublié
│   │   │   │
│   │   │   ├── 📁 dashboard/             # Pages connectées communes
│   │   │   │   ├── 📁 Dashboard/
│   │   │   │   │    ├── 📄 Dashboard.jsx      # Dashboard général après connexion
│   │   │   │   │    └── 📄 Dashboard.css      # Styles dashboard général
│   │   │   │   │
│   │   │   │   ├── 📁 Profile/
│   │   │   │   │    ├── 📄 Profile.jsx        # Page profil utilisateur
│   │   │   │   │    └── 📄 Profile.css        # Styles profil 
│   │   │   │   │
│   │   │   │   └──  📁 Settings/
│   │   │   │       ├── 📄 Settings.jsx       # Paramètres du compte
│   │   │   │       └── 📄 Settings.css       # Styles paramètres
│   │   │   │
│   │   │   │
│   │   │   ├── 📁 admin/                 # Back-office administrateur plateforme
│   │   │   │   ├── 📁 AdminDashboard/
│   │   │   │   │   ├── 📄 AdminDashboard.jsx # Dashboard global admin blog_a_part
│   │   │   │   │   └── 📄 AdminDashboard.css # Styles dashboard admin
|   │   │   │   │
│   │   │   │   ├── 📁 AdminUsers/
│   │   │   │   │   ├── 📄 AdminUsers.jsx     # Gestion utilisateurs
│   │   │   │   │   └── 📄 AdminUsers.css     # Styles gestion utilisateurs
│   │   │   │   │
│   │   │   │   ├── 📁 AdminBlogs/
│   │   │   │   │   ├── 📄 AdminBlogs.jsx     # Gestion globale des blogs
│   │   │   │   │   └── 📄 AdminBlogs.css     # Styles gestion blogs admin
│   │   │   │   │
│   │   │   │   ├── 📁 AdminThemes/
│   │   │   │   │   ├── 📄 AdminThemes.jsx    # Gestion des thèmes disponibles
│   │   │   │   │   └── 📄 AdminThemes.css    # Styles gestion thèmes
│   │   │   │   │
│   │   │   │   └── 📁 AdminReports/
│   │   │   │       ├── 📄 AdminReports.jsx   # Signalements, abus, modération globale
│   │   │   │       └── 📄 AdminReports.css   # Styles signalements
│   │   │   │ 
│   │   │   │
│   │   │   ├── 📁 owner/                 # Espace propriétaire d’un blog
│   │   │   │   ├── 📁 OwnerDashboard/
│   │   │   │   │   ├── 📄 OwnerDashboard.jsx # Dashboard owner avec stats de ses blogs
│   │   │   │   │   └── 📄 OwnerDashboard.css # Styles dashboard owner
│   │   │   │   │
│   │   │   │   ├── 📁 OwnerBlogs/
│   │   │   │   │   ├── 📄 OwnerBlogs.jsx     # Gestion des blogs créés par l’owner
│   │   │   │   │   └── 📄 OwnerBlogs.css     # Styles gestion blogs owner
│   │   │   │   │
│   │   │   │   ├── 📁 BlogBuilder/
│   │   │   │   │   ├── 📄 BlogBuilder.jsx    # Mini-builder de blog par blocs JSON
│   │   │   │   │   └── 📄 BlogBuilder.css    # Styles builder
│   │   │   │   │
│   │   │   │   └── 📁 ThemeCustomizer/
│   │   │   │       ├── 📄 ThemeCustomizer.jsx # Personnalisation couleur, typo, layout
│   │   │   │       └── 📄 ThemeCustomizer.css # Styles customizer
│   │   │   │
│   │   │   ├── 📁 editor/                # Espace rédacteur
│   │   │   │   ├── 📁 EditorDashboard/
│   │   │   │   │   ├── 📄 EditorDashboard.jsx # Dashboard editor
│   │   │   │   │   └── 📄 EditorDashboard.css # Styles dashboard editor
│   │   │   │   │
│   │   │   │   ├── 📁 PostsList/
│   │   │   │   │   ├── 📄 PostsList.jsx      # Liste des articles
│   │   │   │   │   └── 📄 PostsList.css      # Styles liste articles
│   │   │   │   │
│   │   │   │   ├── 📁 PostCreate/
│   │   │   │   │   ├── 📄 PostCreate.jsx     # Création d’un article
│   │   │   │   │   └── 📄 PostCreate.css     # Styles création article
│   │   │   │   │
│   │   │   │   └── 📁 PostEdit/
│   │   │   │       ├── 📄 PostEdit.jsx       # Modification d’un article
│   │   │   │       └── 📄 PostEdit.css       # Styles modification article
│   │   │   │
│   │   │   ├── 📁 moderator/             # Espace modérateur
│   │   │   │    ├── 📁 ModeratorDashboard/
│   │   │   │    │   ├── 📄 ModeratorDashboard.jsx # Dashboard modération
│   │   │   │    │   └── 📄 ModeratorDashboard.css # Styles dashboard modération
│   │   │   │    │
│   │   │   │    └── 📁 CommentsModeration/
│   │   │   │        ├── 📄 CommentsModeration.jsx # Gestion commentaires
│   │   │   │        └── 📄 CommentsModeration.css # Styles modération commentaires
│   │   │   │
│   │   │   └── 📁 errors/                # Pages d’erreurs frontend
│   │   │       ├── 📁 NotFound/
│   │   │       │   ├── 📄 NotFound.jsx       # Page 404
│   │   │       │   └── 📄 NotFound.css       # Styles page 404
│   │   │       │
│   │   │       └── 📁 Forbidden/
│   │   │           ├── 📄 Forbidden.jsx      # Page 403 accès interdit
│   │   │           └── 📄 Forbidden.css      # Styles page 403
│   │   │
│   │   ├── 📁 services/                  # Fonctions qui appellent l’API backend
│   │   │   ├── 📄 apiClient.js           # Client fetch centralisé avec Bearer token automatique
│   │   │   ├── 📄 authService.js         # signup, signin, logout, getCurrentUser
│   │   │   ├── 📄 usersService.js        # Requêtes API liées aux utilisateurs
│   │   │   ├── 📄 blogsService.js        # Requêtes API liées aux blogs
│   │   │   ├── 📄 postsService.js        # Requêtes API liées aux articles
│   │   │   ├── 📄 categoriesService.js   # Requêtes API liées aux catégories
│   │   │   ├── 📄 commentsService.js     # Requêtes API liées aux commentaires
│   │   │   ├── 📄 mediaService.js        # Upload, lecture, suppression médias
│   │   │   ├── 📄 themesService.js       # Requêtes API liées aux thèmes
│   │   │   └── 📄 dashboardService.js    # Requêtes API pour statistiques dashboard
│   │   │
│   │   ├── 📁 context/                   # Contextes React globaux
│   │   │   ├── 📄 AuthContext.jsx        # Stocke user connecté, token, login, logout
│   │   │   ├── 📄 ThemeContext.jsx       # Gère light/dark mode
│   │   │   └── 📄 ToastContext.jsx       # Gère notifications globales
│   │   │
│   │   ├── 📁 hooks/                     # Hooks React personnalisés
│   │   │   ├── 📄 useAuth.js             # Accès simple au AuthContext
│   │   │   ├── 📄 useTheme.js            # Accès simple au ThemeContext
│   │   │   ├── 📄 useFetch.js            # Hook générique pour appels API
│   │   │   └── 📄 useDebounce.js         # Utile pour recherche dynamique
│   │   │
│   │   ├── 📁 utils/                     # Fonctions utilitaires frontend
│   │   │   ├── 📄 storage.js             # Fonctions localStorage/sessionStorage
│   │   │   ├── 📄 formatDate.js          # Formatage des dates
│   │   │   ├── 📄 roleLabels.js          # Labels lisibles pour les rôles
│   │   │   └── 📄 validators.js          # Validations simples côté frontend
│   │   │
│   │   └── 📁 assets/              # Images, icônes, polices
│   │       ├── 📄 favicon.svg
│   │       └── 📄 logo.svg
│   │       ├── 📁 images/                # Images décoratives ou marketing
│   │       └── 📁 icons/                 # Icônes SVG personnalisées
│   │
│   ├── 📁 public/                  # Fichiers statiques (non compilés)
│   │   ├── 📄 favicon.svg
│   │   └── 📄 logo.svg
│   │
│   └── 📁 node_modules/            # Dépendances npm
│
└── 📁 .git/                        # Repository Git

```

---

## 🗄️ Base de Données (MySQL)

### Schéma SQL (backend/database.sql)

```sql
blog_a_part
├── users
│   ├── id (PK, INT AUTO_INCREMENT)
│   ├── username (VARCHAR 100, UNIQUE)
│   ├── email (VARCHAR 191, UNIQUE)
│   ├── password_hash (VARCHAR 255) ← Argon2
│   ├── full_name (VARCHAR 255)
│   ├── role (ENUM: 'admin', 'owner','editor','user','moderator') DEFAULT 'user',
│   ├── is_active (BOOLEAN) DEFAULT TRUE
│   ├── created_at (DATETIME)
│   └── updated_at (DATETIME)
│
├── themes
│   ├── id (PK)
│   ├── name (VARCHAR 255)
│   ├── type (ENUM: 'blog', 'page', 'post')
│   ├── description (TEXT)
│   ├── config_json (JSON)
│   ├── preview_url (VARCHAR 255, NULLABLE)
│   ├── created_at (DATETIME)
│   └── updated_at (DATETIME)
│
├── blogs
│   ├── id (PK)
│   ├── owner_id (FK → users.id)
│   ├── theme_id (FK → themes.id)
│   ├── name (VARCHAR 255)
│   ├── slug (VARCHAR 191, UNIQUE)
│   ├── description (TEXT)
│   ├── is_public (BOOLEAN)
│   ├── status (ENUM: 'active', 'suspended', 'deleted')
│   ├── created_at (DATETIME)
│   └── updated_at (DATETIME)
│
├── posts
│   ├── id (PK)
│   ├── blog_id (FK → blogs.id)
│   ├── author_id (FK → users.id)
│   ├── title (VARCHAR 255)
│   ├── slug (VARCHAR 191)
│   ├── excerpt (TEXT)
│   ├── content (TEXT)
│   ├── status (ENUM: 'draft', 'published', 'archived')
│   ├── published_at (DATETIME, NULLABLE)
│   ├── created_at (DATETIME)
│   ├── updated_at (DATETIME)
│   └── UNIQUE KEY (blog_id, slug)
│
├── categories
│   ├── id (PK)
│   ├── blog_id (FK → blogs.id)
│   ├── name (VARCHAR 255)
│   ├── slug (VARCHAR 191)
│   ├── description (TEXT)
│   ├── created_at (DATETIME)
│   ├── updated_at (DATETIME)
│   └── UNIQUE KEY (blog_id, slug)
│
├── post_categories (Many-to-Many)
│   ├── post_id (FK → posts.id, PK)
│   └── category_id (FK → categories.id, PK)
│
├── media
│   ├── id (PK)
│   ├── blog_id (FK → blogs.id)
│   ├── uploader_id (FK → users.id)
│   ├── file_path (VARCHAR 255)
│   ├── file_name (VARCHAR 255)
│   ├── mime_type (VARCHAR 100)
│   ├── size_bytes (INT)
│   ├── alt_text (VARCHAR 255)
│   ├── metadata_json (JSON)
│   └── created_at (DATETIME)
│
├── post_media (Many-to-Many with metadata)
│   ├── post_id (FK → posts.id, PK)
│   ├── media_id (FK → media.id, PK)
│   ├── position (INT DEFAULT 0)
│   └── usage_type (ENUM: 'cover', 'inline', 'gallery', 'attachment')
│
└── comments
    ├── id (PK)
    ├── post_id (FK → posts.id)
    ├── parent_id (FK → comments.id, NULLABLE) ← Pour replies
    ├── author_name (VARCHAR 255)
    ├── author_email (VARCHAR 255)
    ├── content (TEXT)
    ├── status (ENUM: 'pending', 'approved', 'spam', 'deleted')
    ├── created_at (DATETIME)
    └── updated_at (DATETIME)
```

---

## 🔐 Architecture Authentification (Auth Flow)

```
Frontend                              Backend
  │                                     │
  ├─ Signup ────────────────────────→ POST /api/auth/signup
  │   { username, email,                  │
  │     password, full_name }             ├─ authController.signup()
  │                                       ├─ authService.signup()
  │                                       │   ├─ Vérif email unique
  │                                       │   ├─ Vérif username unique
  │                                       │   ├─ Hachage Argon2
  │                                       │   └─ Insert users table
  │  ← 201 { user, message }  ←──────┤
  │  localStorage.setItem('authToken', ...) │
  │                                       │
  │                                       │
  ├─ Signin ─────────────────────────→ POST /api/auth/signin
  │   { login, password }                 │
  │                                       ├─ authController.signin()
  │                                       ├─ authService.signin()
  │                                       │   ├─ Cherche user par email/username
  │                                       │   ├─ Vérif password (argon2.verify)
  │                                       │   ├─ Vérif is_active
  │                                       │   ├─ Crée JWT { id, role }
  │                                       │   └─ Return { token, user }
  │  ← 200 { token, user } ←──────────┤
  │  localStorage.setItem('authToken', token) │
  │                                       │
  │                                       │
  ├─ Request protégée ──────────────→ GET /themes
  │   Header: Authorization:             │
  │   Bearer <token>                      ├─ middlewares/auth.js:protect()
  │                                       │   ├─ Extrait token
  │                                       │   ├─ jwt.verify()
  │                                       │   └─ Ajoute req.user = { id, role }
  │                                       │
  │                                       ├─ Contrôleur/Handler
  │                                       ├─ Utilise req.user.role pour RBAC
  │                                       │
  │  ← 200 { data } ←──────────────────┤
  │                                       │
```

---

## 📡 Endpoints API

### Authentication
```
POST   /api/auth/signup        { username, email, password, full_name } → 201 { user }
POST   /api/auth/signin        { login, password } → 200 { token, user }
```

### Users (CRUD)
```
GET    /users                  → 200 [ users ]
GET    /users/:id              → 200 { user } | 404
POST   /users                  { ...userData } → 201 { user }
PUT    /users/:id              { ...updates } → 204 | 404
DELETE /users/:id              → 204 | 404
```

### Themes (CRUD)
```
GET    /themes                 → 200 [ themes ]
GET    /themes/:id             → 200 { theme } | 404
POST   /themes                 { name, type, ... } → 201
PUT    /themes/:id             { ...updates } → 204 | 404
DELETE /themes/:id             → 204 | 404
```

### Items, Posts, Categories (même pattern CRUD)
```
GET    /items, /posts, /categories
POST   /items, /posts, /categories
GET    /:id
PUT    /:id
DELETE /:id
```

---

## 🔐 Rôles et Permissions (RBAC)

```
Admin        │ Gère toute la plateforme, users, stats globales
Owner        │ Propriétaire d'un blog → Plein accès au blog
Editor       │ Peut créer/modifier ses articles dans le blog
Moderator    │ Peut gérer les commentaires et modérer les contenus signalés dans le blog
User         │ Visiteur authentifié → Peut commenter, liker
Public       │ Pas authentifié → Lecture seule publique
```

```
Moderator
- Lire les articles du blog
- Voir les commentaires
- Masquer / supprimer des commentaires abusifs
- Valider ou refuser des commentaires si tu ajoutes une modération
- Gérer les signalements
- Bloquer temporairement un utilisateur sur un blog
- Ne peut pas modifier les articles des éditeurs
- Ne peut pas gérer les paramètres du blog
- Ne peut pas gérer les paiements ou l’abonnement

```
---

## 📝 Fichiers de Configuration

### .env Backend
```
APP_PORT=5000
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=Not_root
DB_PASSWORD=********** (Ex:helloworld)
DB_NAME=mvc_express (Ex:Name of your database)

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=le temps d'une session de navigation (ex: 1h, 2d, etc.)
```

### .env Frontend
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=bolg_a_part
```

---

## ✅ Checklist Déploiement

- [ ] `npm install` (racine + backend + frontend)
- [ ] `npm run migrate` (crée schéma DB)
- [ ] `npm run dev-back` (démarre backend)
- [ ] `npm run dev-front` (démarre frontend)
- [ ] Tester signup/signin via Postman
- [ ] Tester routes protégées avec token JWT
- [ ] Vérifier les rôles et permissions RBAC

