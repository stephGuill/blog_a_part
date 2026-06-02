# blog_a_part

## 🧩 Résumé

blog_a_part est une application fullstack avec :
- backend Express + MySQL
- frontend React + Vite
- authentification JWT + Argon2
- gestion de rôles RBAC

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