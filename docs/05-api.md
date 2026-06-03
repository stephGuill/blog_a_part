# 05 — Référence API

> [← 04 Base de données](04-base-de-donnees.md) | [06 — Frontend →](06-frontend.md)

---

## Conventions générales

| Convention | Valeur |
|---|---|
| Base URL locale | `http://localhost:5000/api` |
| Format | JSON (`Content-Type: application/json`) |
| Authentification | `Authorization: Bearer <token>` |
| Succès | HTTP 200 / 201 / 204 |
| Erreur client | HTTP 400 / 401 / 403 / 404 |
| Erreur serveur | HTTP 500 |

### Format de réponse standard

```json
// Succès
{ "status": "success", "data": { ... } }

// Erreur
{ "status": "error", "message": "Description de l'erreur" }
```

### Codes HTTP utilisés

| Code | Signification |
|---|---|
| 200 | Succès avec corps JSON |
| 201 | Ressource créée (header `Location` inclus) |
| 204 | Succès sans corps (DELETE, PUT) |
| 400 | Données invalides |
| 401 | Token manquant ou expiré |
| 403 | Accès interdit (rôle insuffisant) |
| 404 | Ressource introuvable |
| 409 | Conflit (email déjà utilisé, slug déjà pris) |
| 429 | Trop de requêtes (rate limiting) |
| 500 | Erreur serveur |

---

## Auth — `/api/auth`

### `POST /api/auth/signup`

Créer un nouveau compte utilisateur.

**Accès** : public (rate-limité à 10 req/15min par IP)

**Body** (multipart/form-data ou JSON) :
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass1!",
  "accepted_terms": true,
  "accepted_privacy": true,
  "avatar": "(fichier image optionnel)"
}
```

**Règles mot de passe** : min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.

**Réponse 201** :
```json
{
  "status": "success",
  "message": "Compte créé avec succès",
  "data": { "user": { "id": 1, "email": "john@example.com", "username": "johndoe" } }
}
```

---

### `POST /api/auth/signin`

Connexion et obtention d'un JWT.

**Accès** : public (rate-limité)

**Body** :
```json
{
  "email": "john@example.com",
  "password": "SecurePass1!"
}
```

**Réponse 200** :
```json
{
  "status": "success",
  "token": "eyJhbGci...",
  "user": { "id": 1, "email": "...", "role": "user" }
}
```

---

### `GET /api/auth/me`

Retourne le profil de l'utilisateur connecté.

**Accès** : authentifié

**Réponse 200** : objet `user` complet.

---

## Blogs — `/api/blogs`

### `GET /api/blogs`

Liste les blogs publics (ou tous les blogs pour un admin).

**Accès** : public / authentifié

---

### `POST /api/blogs`

Créer un nouveau blog.

**Accès** : authentifié

**Body** :
```json
{
  "name": "Mon Blog",
  "slug": "mon-blog",
  "description": "Description",
  "theme_id": 1,
  "is_public": true
}
```

**Comportement** : Le créateur est automatiquement ajouté comme `owner` dans `blog_members`.

**Réponse** : 201 + header `Location: /api/blogs/:id`

---

### `GET /api/blogs/:id`

Détail d'un blog.

**Accès** : public (blog public) / membres (blog privé)

---

### `PUT /api/blogs/:id`

Modifier un blog.

**Accès** : `owner` du blog ou `admin` global

---

### `DELETE /api/blogs/:id`

Supprimer un blog.

**Accès** : `owner` du blog ou `admin` global

---

## Posts — `/api/posts`

### `GET /api/posts`

Liste les articles accessibles selon le contexte :
- Non connecté → articles publiés sur blogs publics uniquement
- Admin global → tous les articles
- Connecté → articles des blogs dont il est membre

---

### `POST /api/posts`

Créer un article.

**Accès** : permission `create_post` dans le blog

**Body** :
```json
{
  "blog_id": 1,
  "title": "Mon article",
  "slug": "mon-article",
  "excerpt": "Résumé court",
  "content": "<p>Contenu HTML</p>",
  "status": "draft"
}
```

**Réponse** : 201 + header `Location: /posts/:insertId`

---

### `GET /api/posts/:id`

Lire un article.

**Accès** : public (si publié + blog public) / membres autorisés

---

### `PUT /api/posts/:id`

Modifier un article (tous les champs sont requis).

**Accès** : permission `edit_post` dans le blog

**Body** :
```json
{
  "blog_id": 1,
  "title": "Titre modifié",
  "slug": "titre-modifie",
  "status": "draft"
}
```

---

### `DELETE /api/posts/:id`

Supprimer un article.

**Accès** : permission `delete_post` dans le blog

---

## Categories — `/api/categories`

### `POST /api/categories`

Créer une catégorie dans un blog.

**Accès** : membre autorisé du blog

**Body** :
```json
{
  "blog_id": 1,
  "name": "Technologie",
  "slug": "technologie",
  "description": "Articles tech"
}
```

---

### `GET /api/categories`

Liste toutes les catégories (filtrées par blog en query `?blog_id=1`).

---

### `PUT /api/categories/:id`

Modifier une catégorie.

**Body** :
```json
{
  "name": "Tech & Numérique",
  "slug": "tech-numerique"
}
```

---

### `DELETE /api/categories/:id`

Supprimer une catégorie.

---

## Comments — `/api/comments`

### `POST /api/comments`

Poster un commentaire sur un article.

**Accès** : authentifié + permission dans le blog

**Body** :
```json
{
  "post_id": 5,
  "blog_id": 1,
  "content": "Super article !"
}
```

---

### `GET /api/comments`

Liste les commentaires (filtrables par `?post_id=` ou `?blog_id=`).

---

### `PUT /api/comments/:id`

Modifier un commentaire (auteur uniquement).

---

### `DELETE /api/comments/:id`

Supprimer un commentaire.

**Accès** : auteur, modérateur du blog, ou admin

---

## Members — `/api/blogs/:blogId/members`

### `GET /api/blogs/:blogId/members`

Liste les membres d'un blog.

**Accès** : membre du blog ou admin

---

### `POST /api/blogs/:blogId/members`

Inviter un utilisateur dans le blog.

**Accès** : `owner` du blog ou admin

**Body** :
```json
{
  "user_id": 5,
  "role": "editor"
}
```

---

### `PUT /api/blogs/:blogId/members/:id`

Modifier le rôle ou statut d'un membre.

---

### `DELETE /api/blogs/:blogId/members/:id`

Retirer un membre du blog.

---

## Users — `/api/users`

### `GET /api/users`

Liste les utilisateurs.

**Accès** : admin

---

### `GET /api/users/:id`

Profil d'un utilisateur.

**Accès** : soi-même ou admin

---

### `PUT /api/users/:id`

Modifier son profil.

**Accès** : soi-même ou admin

---

### `DELETE /api/users/:id`

Supprimer un compte.

**Accès** : soi-même ou admin

---

## Admin Users — `/api/admin/users`

Routes d'administration avancée des utilisateurs.

**Accès** : admin global uniquement

- `GET /api/admin/users` — liste paginée avec filtres
- `PUT /api/admin/users/:id/role` — changer le rôle
- `PUT /api/admin/users/:id/status` — suspendre/bannir
- `DELETE /api/admin/users/:id` — supprimer définitivement

---

## Themes — `/api/themes`

- `GET /api/themes` — liste des thèmes disponibles (public)
- `POST /api/themes` — créer un thème (admin)
- `PUT /api/themes/:id` — modifier un thème (admin)
- `DELETE /api/themes/:id` — supprimer un thème (admin)

---

## Media — `/api/media`

- `POST /api/media` — uploader un fichier (multipart/form-data)
- `GET /api/media` — liste des médias du blog
- `DELETE /api/media/:id` — supprimer un média

---

## Dashboard — `/api/dashboard`

- `GET /api/dashboard` — statistiques adaptées au rôle de l'utilisateur connecté

---

## Reports — `/api/reports`

- `POST /api/reports` — signaler un contenu
- `GET /api/reports` — liste des signalements (modérateur/admin)
- `PUT /api/reports/:id` — traiter un signalement

---

## Builder — `/api/owner/builder`

- `GET /api/owner/builder/:blogId` — récupérer la config du constructeur
- `PUT /api/owner/builder/:blogId` — sauvegarder la config

---

> [← 04 Base de données](04-base-de-donnees.md) | [06 — Frontend →](06-frontend.md)
