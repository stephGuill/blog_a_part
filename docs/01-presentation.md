# 01 — Présentation du projet

> [← README](../README.md) | [02 — Installation →](02-installation.md)

---

## Qu'est-ce que Blog à Part ?

**Blog à Part** est une plateforme SaaS (Software as a Service) de blogging multi-utilisateurs. Elle permet à n'importe quel utilisateur inscrit de créer son propre blog, d'y inviter des collaborateurs et de publier des articles — le tout depuis une interface unifiée.

La plateforme est pensée comme un **outil complet clé en main** : pas besoin d'installer quoi que ce soit. Un utilisateur s'inscrit, crée son blog, choisit un thème, invite des rédacteurs et commence à publier.

---

## Public cible

| Profil | Usage |
|---|---|
| Blogueurs indépendants | Créer et gérer leur propre espace de publication |
| Équipes éditoriales | Collaborer sur un blog avec des rôles distincts |
| Modérateurs | Superviser les commentaires et signalements |
| Administrateurs plateforme | Gérer tous les comptes, blogs et thèmes |

---

## Fonctionnalités principales

### Gestion des utilisateurs
- Inscription avec avatar, validation du mot de passe, consentement RGPD
- Connexion par email/username + mot de passe (local)
- Support OAuth (Google, Facebook, Apple) — infrastructure prête
- Double authentification (2FA TOTP) — infrastructure prête
- Profil modifiable (username, avatar, mot de passe)

### Blogs
- Création d'un blog avec nom, slug unique, description, thème visuel
- Le créateur devient automatiquement **owner** du blog
- Chaque blog est indépendant avec ses propres membres, articles et catégories
- Visibilité publique ou privée
- Statuts : `active`, `suspended`, `deleted`

### Articles (Posts)
- Rédaction d'articles avec titre, slug, résumé, contenu, statut
- Cycle de vie : `draft` → `pending` → `published` → `archived`
- Seul l'auteur et les admins peuvent modifier leurs articles
- Publication avec date de publication automatique

### Catégories
- Chaque blog gère ses propres catégories
- CRUD complet réservé aux membres autorisés

### Commentaires
- Commentaires sur les articles publiés
- File de modération pour les modérateurs du blog
- Signalements possibles par les utilisateurs

### Système de rôles (RBAC)
- **Rôles globaux** (plateforme) : `admin`, `user`
- **Rôles par blog** : `owner`, `editor`, `moderator`, `member`, `viewer`
- Chaque action sur un blog est protégée par une permission précise

### Constructeur de pages (Builder)
- Outil de personnalisation de mise en page pour les owners
- Sauvegarde de la configuration en JSON en base de données

### Thèmes
- Galerie de thèmes visuels gérée par les admins
- Chaque blog est associé à un thème

### Médiathèque
- Upload d'images (avatars, médias d'articles)
- Stockage dans `backend/public/uploads/`

### Dashboard
- Tableau de bord adapté à chaque rôle
- Statistiques, actions rapides, dernière activité

### Signalements & audit
- Signalement de contenus inappropriés
- Journal d'audit (`audit_logs`) de toutes les actions sensibles

---

## Rôles et permissions détaillés

### Rôles globaux (plateforme)

| Rôle | Description |
|---|---|
| `admin` | Accès total : tous les blogs, tous les utilisateurs, tous les thèmes |
| `user` | Utilisateur standard, peut créer des blogs |

### Rôles dans un blog

| Rôle | Droits |
|---|---|
| `owner` | Toutes les permissions sur son blog (configurer, inviter, supprimer) |
| `editor` | Créer et modifier des articles dans le blog |
| `moderator` | Approuver/rejeter les commentaires et signalements |
| `member` | Lire les contenus membres, commenter |
| `viewer` | Lecture seule |

---

## Aperçu des pages de l'application

```
/ (accueil public)
├── /blogs               → liste des blogs publics
├── /blogs/:slug         → détail d'un blog
├── /posts/:id           → article public
├── /signin              → connexion
├── /signup              → inscription
├── /forgot-password     → réinitialisation mdp
│
├── /dashboard           → tableau de bord (connecté)
├── /profile             → profil utilisateur
├── /settings            → paramètres du compte
│
├── /editor/             → espace éditeur
│   ├── /posts           → liste des articles
│   ├── /posts/create    → créer un article
│   └── /posts/:id/edit  → modifier un article
│
├── /owner/              → espace propriétaire de blog
│   ├── /dashboard       → tableau de bord owner
│   ├── /builder         → constructeur de pages
│   └── /theme           → personnalisation du thème
│
├── /moderator/          → espace modérateur
│   ├── /dashboard       → tableau de bord modérateur
│   └── /comments        → file de modération
│
└── /admin/              → administration plateforme
    ├── /dashboard       → tableau de bord admin
    ├── /users           → gestion des utilisateurs
    ├── /blogs           → gestion de tous les blogs
    ├── /themes          → gestion des thèmes
    └── /reports         → gestion des signalements
```

---

## Contraintes techniques

- **SPA** : l'application React gère le routing côté client
- **API REST** : le backend expose uniquement une API JSON sous `/api/*`
- **Stateless** : l'authentification est entièrement basée sur JWT (pas de session serveur)
- **Multi-tenant** : chaque blog est un espace isolé avec ses propres données

---

> [← README](../README.md) | [02 — Installation →](02-installation.md)
