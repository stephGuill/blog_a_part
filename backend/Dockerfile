# ─── Dockerfile — Backend Node.js ─────────────────────────────────────────────
# Image de base : Node.js 20 LTS sur Alpine Linux (image légère ~50 Mo)
FROM node:20-alpine

# Répertoire de travail à l'intérieur du conteneur
WORKDIR /app

# Copie les manifestes de dépendances en premier pour profiter du cache Docker :
# si package.json et package-lock.json n'ont pas changé, npm ci est mis en cache.
COPY package*.json ./

# Installe uniquement les dépendances de production (exclut devDependencies)
RUN npm ci --omit=dev

# Copie le reste du code source (src/, database/, public/, migrate.js…)
COPY . .

# Crée le dossier uploads s'il n'existe pas (monté en volume en prod)
RUN mkdir -p public/uploads/avatars

# Port exposé par le serveur Express (correspond à process.env.PORT || 5000)
EXPOSE 5000

# Commande de démarrage en production : lance directement Node sans nodemon
CMD ["node", "src/server.js"]
