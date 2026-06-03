# 09 — Docker

> [← 08 Tests](08-tests.md) | [10 — Déploiement →](10-deploiement.md)

---

## Présentation

Docker permet de lancer l'application complète dans des conteneurs isolés, garantissant un environnement identique sur tous les postes et en production.

Le projet propose **deux modes** :

| Mode | Base de données | Commande |
|---|---|---|
| **Filess.io** (défaut) | Cloud MySQL gratuit | `docker compose up --build` |
| **Local MySQL** | Conteneur MySQL local | `docker compose --profile local up --build` |

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré

---

## Fichiers Docker du projet

```
blog_a_part/
├── docker-compose.yml         ← Orchestration (racine)
├── .env.sample                ← Template variables docker-compose
├── backend/
│   ├── Dockerfile             ← Image du backend Node.js
│   └── .dockerignore
└── frontend/
    ├── Dockerfile             ← Image du frontend Nginx
    ├── .dockerignore
    └── default.conf           ← Config Nginx (SPA routing)
```

---

## docker-compose.yml — Description

```yaml
services:
  db:
    image: mysql:8
    profiles: [local]           # N'est démarré QUE si --profile local
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: blog_a_part
    volumes:
      - db_data:/var/lib/mysql
      - ./backend/database.sql:/docker-entrypoint-initdb.d/database.sql

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      DB_HOST: ${DB_HOST:-db}      # Filess.io ou "db" en local
      DB_PORT: ${DB_PORT:-3306}    # 3307 pour Filess.io
      DB_USER: ${DB_USER:-root}
      DB_PASSWORD: ${DB_PASSWORD:-root}
      DB_NAME: ${DB_NAME:-blog_a_part}
      DB_SSL: ${DB_SSL:-false}     # true pour Filess.io
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:5173}
    depends_on:
      db:
        condition: service_healthy
        required: false            # Optionnel → fonctionne sans le service db

  frontend:
    build:
      context: ./frontend
      args:
        VITE_BACKEND_URL: ${VITE_BACKEND_URL:-http://localhost:5000}
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## Mode A — Filess.io (défaut)

Utiliser ce mode si vous avez une base de données Filess.io.

### 1. Configurer les variables

Copier et éditer le fichier `.env` à la racine :

```bash
cp .env.sample .env
```

Remplir avec vos credentials Filess.io :

```dotenv
DB_HOST=xxxxxxxxx.h.filess.io
DB_PORT=3307
DB_USER=votre_user_filess
DB_PASSWORD=votre_mdp_filess
DB_NAME=votre_db_filess
DB_SSL=true

JWT_SECRET=une-chaine-aleatoire-tres-longue

FRONTEND_URL=http://localhost
VITE_BACKEND_URL=http://localhost:5000
```

### 2. Lancer les conteneurs

```bash
docker compose up --build
```

### 3. Lancer les migrations

```bash
docker compose exec backend node migrate.js
```

### 4. Accéder à l'application

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:5000/api |

---

## Mode B — MySQL local

Utiliser ce mode pour travailler entièrement en local, sans dépendance externe.

### 1. Configurer les variables

```dotenv
# .env à la racine
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=blog_a_part
DB_SSL=false

JWT_SECRET=une-chaine-aleatoire-tres-longue

FRONTEND_URL=http://localhost
VITE_BACKEND_URL=http://localhost:5000
```

### 2. Lancer avec le profil `local`

```bash
docker compose --profile local up --build
```

Le service `db` (MySQL) démarrera automatiquement et sera initialisé avec `database.sql`.

### 3. Lancer les migrations

```bash
docker compose exec backend node migrate.js
```

---

## Commandes utiles

```bash
# Voir l'état des conteneurs
docker compose ps

# Voir les logs d'un service
docker compose logs backend
docker compose logs frontend

# Logs en temps réel
docker compose logs -f backend

# Arrêter les conteneurs (sans supprimer les volumes)
docker compose down

# Arrêter ET supprimer les volumes (efface les données locales)
docker compose --profile local down -v

# Reconstruire uniquement le backend
docker compose build backend

# Ouvrir un shell dans le backend
docker compose exec backend sh

# Lancer les tests dans le conteneur
docker compose exec backend npm test -- --runInBand
```

---

## Dockerfile Backend

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000
CMD ["node", "src/server.js"]
```

- **`node:20-alpine`** : image légère (~50 MB vs ~900 MB pour node:20)
- **`npm ci --omit=dev`** : installe uniquement les dépendances de production
- **`.dockerignore`** : exclut `node_modules`, `.env`, `__tests__`, `uploads/`

---

## Dockerfile Frontend (multi-étapes)

```dockerfile
# Étape 1 : Build Vite
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
ARG VITE_BACKEND_URL=http://localhost:5000
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
COPY . .
RUN npm run build

# Étape 2 : Serveur Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- **Multi-stage build** : l'image finale ne contient que les fichiers statiques + Nginx (~25 MB)
- **`ARG VITE_BACKEND_URL`** : l'URL du backend est injectée au moment du build (pas au runtime)

---

## Configuration Nginx (`default.conf`)

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # SPA routing : toutes les routes → index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache des assets Vite (hashed filenames)
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

---

> [← 08 Tests](08-tests.md) | [10 — Déploiement →](10-deploiement.md)
