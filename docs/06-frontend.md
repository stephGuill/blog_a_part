# 06 — Frontend

> [← 05 API](05-api.md) | [07 — Sécurité →](07-securite.md)

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| React | 18.2 | Framework UI |
| Vite | 5.4 | Build tool + serveur de dev |
| React Router | 6.x | Routage SPA côté client |
| Axios | 1.x | Client HTTP + intercepteurs JWT |
| i18next | — | Internationalisation (i18n) |

---

## Démarrage du frontend

```bash
cd frontend
cp .env.sample .env
# Éditer .env : VITE_BACKEND_URL=http://localhost:5000

npm install
npm run dev          # → http://localhost:5173

npm run build        # Build de production → dist/
npm run preview      # Preview du build en local
```

---

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `VITE_BACKEND_URL` | URL complète du backend | `http://localhost:5000` |

> **Important** : Toutes les variables Vite doivent être préfixées `VITE_` pour être accessibles dans le code.

---

## Structure des pages

### Pages publiques (sans connexion)

| Chemin | Composant | Description |
|---|---|---|
| `/` | `pages/public/Home.jsx` | Page d'accueil |
| `/blogs` | `pages/public/Blogs.jsx` | Liste des blogs publics |
| `/blogs/:slug` | `pages/public/BlogDetail.jsx` | Détail d'un blog |
| `/blogs/:slug/:postSlug` | `pages/public/PostDetail.jsx` | Lecture d'un article |
| `/features` | `pages/public/Features.jsx` | Fonctionnalités |
| `/pricing` | `pages/public/Pricing.jsx` | Tarifs |
| `/legal/terms` | `pages/legal/TermsOfUse.jsx` | CGU |
| `/legal/privacy` | `pages/legal/PrivacyPolicy.jsx` | Politique de confidentialité |
| `/legal/notice` | `pages/legal/LegalNotice.jsx` | Mentions légales |

### Pages d'authentification

| Chemin | Composant | Description |
|---|---|---|
| `/auth/signin` | `pages/auth/Signin.jsx` | Connexion |
| `/auth/signup` | `pages/auth/Signup.jsx` | Inscription |
| `/auth/forgot-password` | `pages/auth/ForgotPassword.jsx` | Mot de passe oublié |

### Pages du tableau de bord (authentifié)

| Chemin | Composant | Description |
|---|---|---|
| `/dashboard` | `pages/dashboard/Dashboard.jsx` | Vue générale |
| `/dashboard/profile` | `pages/dashboard/Profile.jsx` | Mon profil |
| `/dashboard/settings` | `pages/dashboard/Settings.jsx` | Paramètres du compte |

### Pages éditeur

| Chemin | Composant | Description |
|---|---|---|
| `/editor/posts` | `pages/editor/PostsList.jsx` | Liste des articles |
| `/editor/posts/new` | `pages/editor/PostCreate.jsx` | Créer un article |
| `/editor/posts/:id/edit` | `pages/editor/PostEdit.jsx` | Modifier un article |

### Pages propriétaire de blog

| Chemin | Composant | Description |
|---|---|---|
| `/owner/dashboard` | `pages/owner/OwnerDashboard.jsx` | Tableau de bord owner |
| `/owner/builder` | `pages/owner/BlogBuilder.jsx` | Constructeur de blog |
| `/owner/theme` | `pages/owner/ThemeCustomizer.jsx` | Personnalisation du thème |

### Pages modérateur

| Chemin | Composant | Description |
|---|---|---|
| `/moderator/dashboard` | `pages/moderator/ModeratorDashboard.jsx` | Dashboard modérateur |
| `/moderator/comments` | `pages/moderator/CommentsModeration.jsx` | Modération des commentaires |

### Pages admin

| Chemin | Composant | Description |
|---|---|---|
| `/admin` | `pages/admin/AdminDashboard.jsx` | Dashboard admin |
| `/admin/users` | `pages/admin/AdminUsers.jsx` | Gestion des utilisateurs |
| `/admin/blogs` | `pages/admin/AdminBlogs.jsx` | Gestion des blogs |
| `/admin/reports` | `pages/admin/AdminReports.jsx` | Signalements |
| `/admin/themes` | `pages/admin/AdminThemes.jsx` | Thèmes de la plateforme |

---

## Système de contextes

Le frontend utilise l'API Context de React pour partager l'état global sans `prop drilling`.

### `AuthContext`

Gère l'authentification globale de l'utilisateur.

```jsx
// Accès
const { user, token, signin, signout, isAuthenticated } = useAuth();
```

| Valeur | Type | Description |
|---|---|---|
| `user` | Object \| null | Données de l'utilisateur connecté |
| `token` | String \| null | JWT stocké en mémoire |
| `isAuthenticated` | Boolean | `true` si connecté |
| `signin(email, password)` | Function | Connexion + stockage du token |
| `signout()` | Function | Déconnexion + nettoyage |

### `ThemeContext`

Gère le mode clair / sombre (light/dark mode).

```jsx
const { theme, toggleTheme } = useTheme();
```

### `ToastContext`

Affiche des notifications toast non-bloquantes.

```jsx
const { showToast } = useToast();
showToast("Article sauvegardé !", "success");
showToast("Erreur de connexion", "error");
```

---

## Client HTTP — `apiClient.js`

Toutes les requêtes API passent par l'instance Axios centralisée dans `services/apiClient.js`.

```js
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL + "/api",
  headers: { "Content-Type": "application/json" },
});

// Intercepteur : injecte automatiquement le JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // ou depuis AuthContext
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur : gère l'expiration du token
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Redirection vers /auth/signin
    }
    return Promise.reject(err);
  }
);
```

---

## Services API

Chaque service encapsule les appels à une ressource :

```js
// services/postsService.js
import apiClient from "./apiClient";

export const createPost = (data) => apiClient.post("/posts", data);
export const getPost = (id)  => apiClient.get(`/posts/${id}`);
export const updatePost = (id, data) => apiClient.put(`/posts/${id}`, data);
export const deletePost = (id) => apiClient.delete(`/posts/${id}`);
```

---

## Garde-routes (Route Guards)

### `ProtectedRoute`

Redirige vers `/auth/signin` si l'utilisateur n'est pas connecté.

```jsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### `RoleRoute`

Redirige vers `/forbidden` si le rôle requis n'est pas atteint.

```jsx
<Route element={<RoleRoute requiredRole="admin" />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>
```

---

## Build de production

```bash
cd frontend
npm run build
# → dist/           (fichiers statiques à déployer)
```

Vite génère :
- `dist/index.html` — point d'entrée de la SPA
- `dist/assets/` — JS/CSS chunked et minifiés avec hash dans le nom

Nginx (`default.conf`) est configuré pour rediriger toutes les routes vers `index.html` (gestion du routing React Router côté serveur).

---

> [← 05 API](05-api.md) | [07 — Sécurité →](07-securite.md)
