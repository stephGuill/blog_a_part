# Blog à Part — Plateforme de blogging multi-utilisateurs

Blog à Part est une plateforme SaaS de blogging multi-utilisateurs construite avec **Node.js / Express** côté serveur et **React / Vite** côté client. Elle permet de créer et gérer des blogs indépendants, avec un système de rôles complet, une modération des contenus et un constructeur de pages visuel.

---

## Liens rapides

| Document | Description |
|---|---|
| [01 — Présentation](docs/01-presentation.md) | Fonctionnalités, public cible, cas d'usage |
| [02 — Installation](docs/02-installation.md) | Mise en place locale pas à pas |
| [03 — Architecture](docs/03-architecture.md) | Structure des fichiers, flux de données |
| [04 — Base de données](docs/04-base-de-donnees.md) | Schéma SQL, relations entre tables |
| [05 — API](docs/05-api.md) | Référence de tous les endpoints REST |
| [06 — Frontend](docs/06-frontend.md) | Pages, composants, routing, contextes |
| [07 — Sécurité](docs/07-securite.md) | JWT, RBAC, rate limiting, CORS, RGPD |
| [08 — Tests](docs/08-tests.md) | Stratégie de test, Jest, Supertest |
| [09 — Docker](docs/09-docker.md) | Conteneurisation, Filess.io, modes de lancement |
| [10 — Déploiement](docs/10-deploiement.md) | Netlify + Render + Filess.io, étape par étape |

---

## Stack technique

```
Frontend          Backend             Base de données   Infra
─────────────     ──────────────────  ───────────────   ──────────────
React 18.2        Node.js 24 LTS      MySQL 8           Docker
Vite 5.4          Express 4.18        mysql2/promise    Netlify (front)
React Router 7    JWT jsonwebtoken                      Render (back)
Tailwind CSS 4    argon2 + bcryptjs                     Filess.io (DB)
i18next           Multer
                  express-rate-limit
```

---

## Démarrage rapide (local)

```bash
# 1. Cloner le projet
git clone https://github.com/stephGuill/blog_a_part.git
cd blog_a_part

# 2. Backend
cd backend
cp .env.sample .env        # remplir les variables
npm install
node migrate.js            # créer les tables
npm run dev                # http://localhost:5000

# 3. Frontend (nouveau terminal)
cd frontend
cp .env.sample .env        # VITE_BACKEND_URL=http://localhost:5000
npm install
npm run dev                # http://localhost:5173
```

> Voir [02 — Installation](docs/02-installation.md) pour le guide complet.

---

## Lancer les tests

```bash
cd backend
npm test -- --runInBand
```

> Voir [08 — Tests](docs/08-tests.md) pour le détail.

---

## Déploiement Docker + Filess.io

```bash
cp .env.sample .env   # remplir avec les credentials Filess.io
docker compose up --build
docker compose exec backend node migrate.js
```

> Voir [09 — Docker](docs/09-docker.md) et [10 — Déploiement](docs/10-deploiement.md).

## 🚀 Démarrage rapide

### 1) Installer les dépendances

```bash
npm install
```

### 2) Configurer les fichiers d'environnement

- Backend : copie `backend/.env.sample` vers `backend/.env`
- Frontend : copie `frontend/.env.sample` vers `frontend/.env`

> `.env.sample` est un template versionné.
> `.env` contient tes valeurs locales et n'est pas versionné.
> `.env.local` est une surcharge locale optionnelle, si tu veux définir des variables spécifiques à ta machine.

### 3) Exécuter la migration

```bash
npm run migrate
```

### 4) Lancer l'application

```bash
npm run dev
```

Cela démarre :
- frontend React sur `http://localhost:5173`
- backend Express sur `http://localhost:5000`

## 📁 Structure réelle

- `backend/` : serveur Node/Express
- `frontend/` : client React/Vite
- `database-setup.sh` : script de préparation DB
- `PROJECT_STRUCTURE.md` : documentation détaillée
- `LISEZ-MOI.md` : documentation française

## 🔧 Scripts utiles

```bash
npm run dev          # frontend + backend en parallèle
npm run dev-front    # frontend uniquement
npm run dev-back     # backend uniquement
npm run migrate      # exécute backend/migrate.js
npm run lint         # vérifie frontend + backend
npm run fix          # corrige frontend + backend
```

## 📦 Environnement

### Backend
- `backend/.env.sample` → template
- `backend/.env` → à créer localement

### Frontend
- `frontend/.env.sample` → template
- `frontend/.env` → à créer localement
- `frontend/.env.local` → optionnel, surcharge locale

## 📝 Notes importantes

- `.env.sample` est le modèle que nous envoyons sur GitHub.
- `.env` contient tes valeurs locales et ne doit jamais être versionné.
- `.env.local` n'est pas utilisé dans ce projet par défaut et n'a pas besoin d'être créé.
- ne versionne jamais tes vrais secrets dans `.env`

## 🔗 Docs complémentaires

- `backend/README.md`
- `frontend/README.md`
- `PROJECT_STRUCTURE.md`
  
  ## Descriptions de Ticket GitHub
  
Branche : feature/backend-migrations-jest

Fichiers :
- frontend/src/pages/dashboard/Profile/Profile.jsx
- frontend/src/pages/dashboard/Profile/Profile.css

Commit :

git add frontend/src/pages/dashboard/Profile/
git commit -m "feat(dashboard): add profile page refs #ID_TICKET"