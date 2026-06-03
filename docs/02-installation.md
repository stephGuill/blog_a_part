# 02 — Installation locale

> [← 01 Présentation](01-presentation.md) | [03 — Architecture →](03-architecture.md)

---

## Prérequis

Avant de commencer, vérifier que ces outils sont installés sur votre machine :

| Outil | Version minimale | Vérification |
|---|---|---|
| Node.js | 18 LTS (recommandé : 20+) | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL | 8.0 | `mysql --version` |
| Git | 2.x | `git --version` |

> **Windows** : WAMP64 inclut MySQL 8. Le port par défaut est 3306.  
> **Mac/Linux** : Homebrew (`brew install mysql`) ou package manager.

---

## Étape 1 — Cloner le dépôt

```bash
git clone https://github.com/stephGuill/blog_a_part.git
cd blog_a_part
```

Structure obtenue :
```
blog_a_part/
├── backend/      ← API Node.js / Express
├── frontend/     ← Application React / Vite
├── docs/         ← Documentation
└── docker-compose.yml
```

---

## Étape 2 — Configurer le backend

### 2.1 Copier le fichier de configuration

```bash
cd backend
cp .env.sample .env
```

### 2.2 Éditer `backend/.env`

Ouvrir le fichier `.env` et remplir les valeurs :

```dotenv
# Port d'écoute du serveur (laisser 5000 par défaut)
PORT=5000

# Base de données MySQL locale (WAMP)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # laisser vide si pas de mot de passe root en local
DB_NAME=blog_a_part
DB_SSL=false

# Clé secrète JWT — générer une valeur unique :
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=change-me-to-a-long-random-secret

# URL du frontend autorisée par CORS
FRONTEND_URL=http://localhost:5173

# Lancer le seed après les migrations ?
RUN_SEED=false
```

### 2.3 Installer les dépendances

```bash
npm install
```

### 2.4 Créer la base de données et les tables

```bash
node migrate.js
```

Ce script exécute dans l'ordre :
1. `database.sql` — crée la base `blog_a_part` et toutes les tables
2. Les fichiers `database/patch_*.sql` — applique les migrations évolutives

> En cas d'erreur de connexion, vérifier que MySQL tourne et que les variables `DB_*` sont correctes.

### 2.5 Démarrer le serveur de développement

```bash
npm run dev
```

Le backend écoute sur **http://localhost:5000**.

Pour vérifier :
```bash
curl http://localhost:5000/api/auth/me
# → {"status":"error","message":"Token manquant"} (401 attendu)
```

---

## Étape 3 — Configurer le frontend

Ouvrir un **nouveau terminal** :

```bash
cd frontend
cp .env.sample .env
```

Éditer `frontend/.env` :

```dotenv
# URL de l'API backend
VITE_BACKEND_URL=http://localhost:5000
```

### 3.1 Installer les dépendances

```bash
npm install
```

### 3.2 Démarrer Vite

```bash
npm run dev
```

L'application est disponible sur **http://localhost:5173**.

---

## Étape 4 — Créer un compte administrateur

1. Ouvrir http://localhost:5173/signup
2. Remplir le formulaire (cocher les CGU et la politique de confidentialité)
3. Se connecter sur http://localhost:5173/signin

Pour passer un compte en `admin` directement en base :

```sql
UPDATE users SET role = 'admin', platform_role = 'admin' WHERE email = 'votre@email.com';
```

---

## Étape 5 — (Optionnel) Charger des données d'exemple

```bash
cd backend
node -e "
require('dotenv').config();
const db = require('./database/client');
const fs = require('fs');
db.query(fs.readFileSync('./database/seed_data.sql', 'utf8'))
  .then(() => { console.log('Seed OK'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
"
```

---

## Récapitulatif des commandes

```bash
# Terminal 1 — Backend
cd backend && npm run dev      # http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm run dev     # http://localhost:5173

# Tests
cd backend && npm test -- --runInBand
```

---

## Résolution des problèmes courants

| Erreur | Cause probable | Solution |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL non démarré | Démarrer MySQL (WAMP, Homebrew…) |
| `ER_ACCESS_DENIED_ERROR` | Mauvais user/password | Vérifier `DB_USER` / `DB_PASSWORD` dans `.env` |
| `Port 5000 already in use` | Autre processus sur le port | `npx kill-port 5000` ou changer `PORT` |
| `Port 5173 already in use` | Vite déjà lancé | Fermer l'autre instance ou changer `port` dans `vite.config.js` |
| CORS bloqué dans le navigateur | `FRONTEND_URL` incorrect | Mettre `http://localhost:5173` dans `backend/.env` |

---

> [← 01 Présentation](01-presentation.md) | [03 — Architecture →](03-architecture.md)
