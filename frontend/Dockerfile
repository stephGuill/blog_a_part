# ─── Dockerfile — Frontend React/Vite ────────────────────────────────────────
# Build multi-stage :
#   1. Stage "builder" : compile le projet Vite → dossier dist/
#   2. Stage "server"  : Nginx sert les fichiers statiques du dossier dist/

# ── Stage 1 : Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copie les manifestes en premier pour bénéficier du cache Docker
COPY package*.json ./

# Installe TOUTES les dépendances (y compris devDependencies nécessaires au build)
RUN npm ci

# URL de l'API backend passée en argument de build Docker.
# Elle est injectée dans le bundle par Vite via import.meta.env.VITE_BACKEND_URL.
# Valeur par défaut : localhost pour les builds locaux.
ARG VITE_BACKEND_URL=http://localhost:5000
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Copie le reste du code source
COPY . .

# Compile le projet React → génère le dossier dist/
RUN npm run build

# ── Stage 2 : Serve avec Nginx ───────────────────────────────────────────────
FROM nginx:alpine

# Copie le build Vite dans le dossier servi par Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie la configuration Nginx (gère le routage SPA : redirige vers index.html)
COPY default.conf /etc/nginx/conf.d/default.conf

# Port exposé (Nginx écoute sur 3000 selon default.conf)
EXPOSE 3000

# Démarre Nginx en avant-plan (obligatoire dans Docker)
CMD ["nginx", "-g", "daemon off;"]
