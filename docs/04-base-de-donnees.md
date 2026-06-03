# 04 — Base de données

> [← 03 Architecture](03-architecture.md) | [05 — API →](05-api.md)

---

## Système de gestion utilisé

- **MySQL 8.0** avec le moteur **InnoDB**
- Encodage : `utf8mb4` / `utf8mb4_unicode_ci` (support emoji et caractères multilingues)
- Driver Node.js : `mysql2/promise` (pool de connexions asynchrones)

---

## Schéma des tables

### Diagramme des relations (ERD simplifié)

```
users ──────────────────────────────────────────────────────────┐
  │ 1                                                           │
  │                                                             │
  ├─ (owner_id) ─── blogs ─── (theme_id) ─── themes            │
  │                  │                                          │
  │                  ├─ blog_members ──────────────── users     │
  │                  │   (user_id, role, status)               │
  │                  │                                          │
  │                  ├─ posts ──────────── categories           │
  │                  │   (author_id)                           │
  │                  │     │                                    │
  │                  │     └─ comments ──────────── users       │
  │                  │          │                              │
  │                  │          └─ reports ─────────── users   │
  │                  │                                         │
  │                  └─ (builder_config) → builder_pages       │
  │                                                            │
  └─ user_oauth_accounts                                       │
  └─ audit_logs                                                │
  └─ item                                                      │
```

---

## Description des tables

### `users` — Utilisateurs

Stocke tous les comptes de la plateforme.

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK AUTO | Identifiant unique |
| `username` | VARCHAR(100) UNIQUE | Nom d'affichage, login alternatif |
| `email` | VARCHAR(191) UNIQUE | Email de connexion |
| `password_hash` | VARCHAR(255) | Mot de passe hashé (Argon2) |
| `full_name` | VARCHAR(255) | Nom réel (optionnel) |
| `avatar_url` | VARCHAR(255) | URL de l'avatar |
| `role` | ENUM | `admin`, `owner`, `editor`, `moderator`, `user` |
| `platform_role` | ENUM | `admin`, `user` — rôle global plateforme |
| `status` | ENUM | `active`, `inactive`, `suspended`, `banned`, `pending` |
| `is_active` | BOOLEAN | Compte activé |
| `accepted_terms` | BOOLEAN | Acceptation des CGU |
| `accepted_terms_at` | DATETIME | Date d'acceptation des CGU |
| `accepted_privacy` | BOOLEAN | Acceptation de la politique de confidentialité |
| `marketing_consent` | BOOLEAN | Consentement marketing |
| `cookies_consent` | JSON | Préférences cookies détaillées |
| `auth_provider` | ENUM | `local`, `google`, `facebook`, `apple` |
| `email_verified` | BOOLEAN | Email vérifié |
| `two_factor_enabled` | BOOLEAN | 2FA actif |
| `two_factor_secret` | VARCHAR(255) | Secret TOTP chiffré |
| `last_login_at` | DATETIME | Dernière connexion |
| `created_at` | DATETIME | Date de création |
| `updated_at` | DATETIME | Dernière modification |

### `user_oauth_accounts` — Comptes OAuth liés

Lie un compte utilisateur à un ou plusieurs fournisseurs OAuth.

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `user_id` | INT FK→users | Utilisateur propriétaire |
| `provider` | ENUM | `google`, `facebook`, `apple` |
| `provider_user_id` | VARCHAR(255) | ID chez le fournisseur |
| `provider_email` | VARCHAR(255) | Email chez le fournisseur |
| `provider_avatar_url` | VARCHAR(500) | Avatar fournisseur |

### `themes` — Thèmes visuels

Galerie de thèmes disponibles pour les blogs.

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `name` | VARCHAR(255) | Nom du thème |
| `type` | ENUM | `blog`, `page`, `post` |
| `description` | TEXT | Description |
| `config_json` | JSON | Configuration du thème |
| `preview_url` | VARCHAR(255) | Capture d'écran d'aperçu |

### `blogs` — Blogs

Chaque blog est un espace indépendant de publication.

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `owner_id` | INT FK→users | Propriétaire du blog |
| `theme_id` | INT FK→themes | Thème visuel appliqué |
| `name` | VARCHAR(255) | Nom affiché du blog |
| `slug` | VARCHAR(191) UNIQUE | Identifiant URL unique |
| `description` | TEXT | Description |
| `is_public` | BOOLEAN | Visible publiquement |
| `status` | ENUM | `active`, `suspended`, `deleted` |

### `blog_members` — Membres d'un blog

Table de liaison `users ↔ blogs` avec rôle et statut.

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `blog_id` | INT FK→blogs | Blog concerné |
| `user_id` | INT FK→users | Membre |
| `role` | ENUM | `owner`, `editor`, `moderator`, `member`, `viewer` |
| `status` | ENUM | `pending`, `active`, `suspended`, `removed` |

**Contrainte** : `UNIQUE(blog_id, user_id)` — un utilisateur ne peut avoir qu'un seul rôle par blog.

### `posts` — Articles

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `blog_id` | INT FK→blogs | Blog parent |
| `author_id` | INT FK→users | Auteur |
| `title` | VARCHAR(255) NOT NULL | Titre |
| `slug` | VARCHAR(191) NOT NULL | URL-friendly unique dans le blog |
| `excerpt` | TEXT | Résumé court |
| `content` | TEXT | Corps de l'article (HTML/Markdown) |
| `status` | ENUM | `draft`, `pending`, `published`, `archived` |
| `published_at` | DATETIME | Date de publication |

### `categories` — Catégories

Catégories propres à chaque blog.

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `blog_id` | INT FK→blogs | Blog propriétaire |
| `name` | VARCHAR(255) NOT NULL | Nom de la catégorie |
| `slug` | VARCHAR(191) NOT NULL | Identifiant URL |
| `description` | TEXT | Description |

### `comments` — Commentaires

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `post_id` | INT FK→posts | Article commenté |
| `author_id` | INT FK→users | Auteur du commentaire |
| `blog_id` | INT FK→blogs | Blog (dénormalisé pour les permissions) |
| `content` | TEXT | Contenu |
| `status` | ENUM | `pending`, `approved`, `rejected` |

### `reports` — Signalements

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `reporter_id` | INT FK→users | Auteur du signalement |
| `blog_id` | INT FK→blogs | Blog concerné |
| `target_type` | ENUM | `post`, `comment` |
| `target_id` | INT | ID de la ressource signalée |
| `reason` | TEXT | Motif du signalement |
| `status` | ENUM | `pending`, `reviewed`, `dismissed` |

### `audit_logs` — Journal d'audit

Trace toutes les actions sensibles de la plateforme.

| Colonne | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `actor_user_id` | INT FK→users | Utilisateur ayant réalisé l'action |
| `target_type` | VARCHAR(80) | Type de ressource ciblée (`user`, `blog`…) |
| `target_id` | INT | ID de la ressource ciblée |
| `action` | VARCHAR(120) | Action réalisée (`create_blog`, `ban_user`…) |
| `old_values` | JSON | État avant modification |
| `new_values` | JSON | État après modification |
| `ip_address` | VARCHAR(45) | IP de l'acteur |
| `user_agent` | TEXT | User-agent du client |

---

## Migrations

Les migrations sont gérées par le script `migrate.js` à la racine du backend.

### Ordre d'exécution

1. `database.sql` — Schéma complet (tables de base)
2. `database/patch_legal_consents.sql` — Colonnes RGPD
3. `database/patch_auth_security.sql` — 2FA, OAuth
4. `database/patch_post_pending_status.sql` — Statut `pending` pour les posts
5. `database/patch_builder.sql` — Tables builder
6. `database/patch_saas_permissions.sql` — Système RBAC étendu

### Lancer les migrations

```bash
cd backend
node migrate.js
```

Les migrations utilisent `ADD COLUMN IF NOT EXISTS` et `CREATE TABLE IF NOT EXISTS` — elles sont **idempotentes** (sans danger si relancées).

---

## Connexion à la base de données

Le fichier `database/client.js` crée un **pool** de connexions MySQL :

```js
const client = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});
```

Le mode SSL (`DB_SSL=true`) est obligatoire pour Filess.io et les hébergeurs MySQL cloud.

---

> [← 03 Architecture](03-architecture.md) | [05 — API →](05-api.md)
