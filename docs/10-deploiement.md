# 10 — Déploiement en production

> [← 09 Docker](09-docker.md) | [← Retour README](../README.md)

---

## Architecture de déploiement

```
Utilisateur
    │
    ├─ Frontend (Netlify)
    │   URL: https://blog-a-part.netlify.app
    │   → Fichiers statiques React/Vite
    │
    └─ Backend (Render.com)
        URL: https://blog-a-part-api.onrender.com
        → Node.js / Express
        │
        └─ Base de données (Filess.io)
            Host: xxxxxx.h.filess.io:3307
            → MySQL 8 cloud gratuit (SSL)
```

---

## Étape 1 — Créer la base de données sur Filess.io

1. Aller sur [filess.io](https://filess.io) → Créer un compte gratuit
2. Créer une nouvelle base de données MySQL
3. Noter les informations de connexion :

```
Host:     xxxxxxxxx.h.filess.io
Port:     3307
User:     votre_user
Password: votre_mdp
Database: votre_db
SSL:      Requis (rejectUnauthorized: false)
```

> **Attention** : Le plan gratuit Filess.io a des limites de connexions simultanées. Configurer `connectionLimit: 2` dans le pool mysql2 si vous rencontrez des erreurs.

---

## Étape 2 — Déployer le backend sur Render.com

### Option A — Via GitHub Blueprint (recommandé)

Le fichier `render.yaml` à la racine du projet configure automatiquement le service.

1. Aller sur [render.com](https://render.com) → Créer un compte
2. **New** → **Blueprint**
3. Connecter votre dépôt GitHub (`stephGuill/blog_a_part`)
4. Render détecte automatiquement `render.yaml`
5. Cliquer **Apply**

Render créera le service backend avec :
- Build : `npm ci && node migrate.js`
- Start : `node src/server.js`
- Port : 5000

### Option B — Service manuel

1. **New** → **Web Service**
2. Connecter le dépôt GitHub
3. **Root Directory** : `backend`
4. **Build Command** : `npm ci && node migrate.js`
5. **Start Command** : `node src/server.js`
6. **Environment** : `Node`

### Configurer les variables d'environnement sur Render

> **Important** : Les variables marquées `sync: false` dans `render.yaml` doivent être configurées manuellement dans le dashboard Render.

Aller dans **Environment** → ajouter :

| Variable | Valeur |
|---|---|
| `DB_HOST` | `xxxxxxxxx.h.filess.io` |
| `DB_PORT` | `3307` |
| `DB_USER` | Votre user Filess.io |
| `DB_PASSWORD` | Votre mot de passe Filess.io |
| `DB_NAME` | Votre nom de DB Filess.io |
| `DB_SSL` | `true` |
| `JWT_SECRET` | (généré automatiquement par Render Blueprint) |
| `FRONTEND_URL` | `https://votre-app.netlify.app` (à mettre à jour après Netlify) |
| `PORT` | `5000` |

### Vérifier le déploiement

```bash
curl https://votre-api.onrender.com/api
# Réponse attendue : { "status": "ok" } ou liste des routes
```

---

## Étape 3 — Déployer le frontend sur Netlify

### Option A — Interface web (recommandé)

1. Aller sur [netlify.com](https://netlify.com) → Créer un compte
2. **Add new site** → **Import an existing project**
3. Connecter GitHub → Sélectionner `blog_a_part`
4. Netlify détecte automatiquement `frontend/netlify.toml` :
   - **Base directory** : `frontend`
   - **Build command** : `npm ci && npm run build`
   - **Publish directory** : `dist`
5. Cliquer **Deploy site**

### Configurer les variables d'environnement sur Netlify

Dans **Site settings** → **Environment variables** :

| Variable | Valeur |
|---|---|
| `VITE_BACKEND_URL` | `https://votre-api.onrender.com` |

> **Redéployer** après avoir ajouté la variable (le build Vite bake l'URL dans les fichiers JS).

### Vérifier le déploiement

L'URL Netlify (ex: `https://blog-a-part.netlify.app`) doit afficher la page d'accueil.

---

## Étape 4 — Mettre à jour CORS sur Render

Une fois votre URL Netlify connue, retourner sur Render et mettre à jour :

| Variable | Valeur |
|---|---|
| `FRONTEND_URL` | `https://votre-app.netlify.app` |

Render redéploie automatiquement après la mise à jour des variables.

---

## Étape 5 — Créer le compte administrateur

```bash
# Via l'API REST
curl -X POST https://votre-api.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "AdminPass1!",
    "accepted_terms": true,
    "accepted_privacy": true
  }'

# Puis promouvoir en admin via la DB (Filess.io dashboard ou via psql)
UPDATE users SET platform_role = 'admin' WHERE email = 'admin@example.com';
```

---

## Checklist de déploiement

### Base de données (Filess.io)
- [ ] Compte créé sur filess.io
- [ ] Base de données MySQL créée
- [ ] Credentials copiés (host, port, user, password, db)
- [ ] Connexion SSL testée

### Backend (Render)
- [ ] Service créé (Blueprint ou manuel)
- [ ] Variables `DB_*` configurées manuellement
- [ ] `JWT_SECRET` défini (ou généré par Render)
- [ ] Build réussi (`npm ci && node migrate.js`)
- [ ] URL backend notée (ex: `https://votre-api.onrender.com`)
- [ ] `GET /api` retourne une réponse valide

### Frontend (Netlify)
- [ ] Site connecté au dépôt GitHub
- [ ] `VITE_BACKEND_URL` configurée
- [ ] Build réussi
- [ ] URL Netlify notée (ex: `https://blog-a-part.netlify.app`)
- [ ] Page d'accueil s'affiche correctement

### Configuration finale
- [ ] `FRONTEND_URL` mis à jour sur Render avec l'URL Netlify
- [ ] Test de connexion/inscription depuis le frontend en production
- [ ] Compte administrateur créé

---

## Render.yaml — Contenu

Pour référence, voici la configuration Render Blueprint :

```yaml
services:
  - type: web
    name: blog-a-part-api
    runtime: node
    rootDir: backend
    buildCommand: npm ci && node migrate.js
    startCommand: node src/server.js
    envVars:
      - key: PORT
        value: "5000"
      - key: DB_HOST
        sync: false
      - key: DB_PORT
        value: "3307"
      - key: DB_USER
        sync: false
      - key: DB_PASSWORD
        sync: false
      - key: DB_NAME
        sync: false
      - key: DB_SSL
        value: "true"
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        sync: false
```

---

## Netlify.toml — Contenu

Pour référence, la configuration Netlify :

```toml
[build]
  base    = "frontend"
  command = "npm ci && npm run build"
  publish = "dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

La règle `redirects` est **indispensable** pour le routing React Router en SPA : sans elle, les URLs comme `/dashboard` retournent une 404 Nginx.

---

## Dépannage

### Le backend est en "Sleep" sur Render

Render met en veille les services gratuits après 15 minutes d'inactivité. La première requête peut prendre **30-60 secondes** pour réveiller le service.

**Solution** : Utiliser [cron-job.org](https://cron-job.org) pour pinguer `GET /api` toutes les 10 minutes.

### "CORS error" depuis le frontend

Vérifier que `FRONTEND_URL` sur Render correspond **exactement** à l'URL Netlify (sans slash final).

```
✅ FRONTEND_URL=https://blog-a-part.netlify.app
❌ FRONTEND_URL=https://blog-a-part.netlify.app/
```

### "SSL connection error" avec Filess.io

Vérifier que `DB_SSL=true` est bien configuré sur Render. Si l'erreur persiste, vérifier que le host Filess.io est correct et que le port est bien `3307`.

### Les migrations échouent au démarrage

Render exécute `node migrate.js` à chaque déploiement. Les migrations utilisent `IF NOT EXISTS` et sont idempotentes — elles peuvent être relancées sans danger.

---

> [← 09 Docker](09-docker.md) | [← Retour README](../README.md)
