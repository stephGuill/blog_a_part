# 07 — Sécurité

> [← 06 Frontend](06-frontend.md) | [08 — Tests →](08-tests.md)

---

## Vue d'ensemble

Blog à Part applique plusieurs couches de sécurité indépendantes :

```
Requête HTTP
    │
    ├─ 1. CORS          → Bloque les origines non autorisées
    ├─ 2. Rate Limiting → Limite le bruteforce / flooding
    ├─ 3. Authentification JWT → Vérifie l'identité
    ├─ 4. RBAC          → Vérifie les droits sur la ressource
    ├─ 5. Validation    → Vérifie les données entrantes
    └─ 6. Requêtes SQL paramétrées → Prévient l'injection SQL
```

---

## 1. CORS (Cross-Origin Resource Sharing)

Le backend n'accepte que les requêtes provenant de l'origine configurée.

**Configuration** (`src/app.js`) :
```js
const allowedOrigins = new Set([process.env.FRONTEND_URL]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
```

**En production** : `FRONTEND_URL` doit être l'URL exacte Netlify (ex: `https://blog-a-part.netlify.app`).

---

## 2. Rate Limiting

**Middleware** : `middlewares/rateLimit.js` — basé sur `express-rate-limit`.

```js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Fenêtre de 15 minutes
  max: 10,                    // 10 requêtes maximum par IP
  message: { status: "error", message: "Trop de tentatives. Réessayez dans 15 minutes." },
});
```

**Routes protégées** : `/api/auth/signin` et `/api/auth/signup`.

**Comportement** : HTTP 429 renvoyé à partir de la 11e tentative dans la fenêtre.

---

## 3. Authentification JWT

### Génération du token (signin)

```js
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);
```

### Vérification du token

**Middleware** `protect()` dans `middlewares/auth.js` :

```js
const protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json(...);

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // id, email, role disponibles dans req.user
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};
```

### Bonnes pratiques appliquées

| Pratique | Statut |
|---|---|
| Secret JWT long et aléatoire (`JWT_SECRET`) | ✅ Requis (min 32 chars recommandés) |
| Token en mémoire / Authorization header (pas de cookie) | ✅ Pas de CSRF |
| Durée de vie courte (2h) | ✅ Limitée |
| `JWT_SECRET` jamais commité | ✅ Dans `.env` (ignoré par Git) |

---

## 4. RBAC — Contrôle d'accès basé sur les rôles

### Architecture à deux niveaux

#### Niveau 1 : Rôle global de plateforme

| Rôle `platform_role` | Accès |
|---|---|
| `admin` | Accès total à toute la plateforme |
| `user` | Accès uniquement à ses ressources |

Middleware : `requireGlobalRole.js`, `requireSuperAdmin.js`

#### Niveau 2 : Rôle dans un blog (`blog_members.role`)

| Rôle | Permissions |
|---|---|
| `owner` | Tout : gérer le blog, les membres, publier, modérer |
| `editor` | Créer, modifier, supprimer des articles |
| `moderator` | Approuver/rejeter commentaires, gérer les signalements |
| `member` | Commenter, lire les articles privés |
| `viewer` | Lire uniquement |

### Résolution des permissions (`requireBlogPermission`)

Le middleware `requireBlogPermission` résout le `blog_id` selon 6 stratégies (dans l'ordre) :

1. `req.body.blog_id`
2. `req.params.blog_id`
3. `req.params.blogId`
4. `req.query.blog_id`
5. Via `post_id` → lookup de `posts.blog_id`
6. Via `comment_id` → lookup de `comments.blog_id`

Une fois le blog résolu, il vérifie que :
1. L'utilisateur est membre actif du blog
2. Son rôle dispose de la permission demandée

**Exemple d'utilisation** :
```js
router.post("/posts", protect, requireBlogPermission("create_post"), postsController.add);
router.put("/posts/:id", protect, requireBlogPermission("edit_post"), postsController.edit);
```

---

## 5. Hachage des mots de passe

Le projet utilise **Argon2** (state-of-the-art, résistant aux GPU et ASIC attacks).

```js
// Hachage à l'inscription
const hash = await argon2.hash(plainPassword);

// Vérification à la connexion
const valid = await argon2.verify(storedHash, inputPassword);
```

### Règles de validation du mot de passe

| Règle | Valeur |
|---|---|
| Longueur minimum | 8 caractères |
| Majuscule | Au moins 1 |
| Minuscule | Au moins 1 |
| Chiffre | Au moins 1 |
| Caractère spécial | Au moins 1 (`!@#$%^&*...`) |

---

## 6. Prévention des injections SQL

Toutes les requêtes SQL utilisent les **requêtes paramétrées** de mysql2 :

```js
// ✅ Sécurisé — les valeurs sont des paramètres, jamais interpolées
const [rows] = await client.query(
  "SELECT * FROM users WHERE email = ? AND is_active = 1",
  [email]
);

// ❌ JAMAIS — interpolation directe (vulnérable)
// `SELECT * FROM users WHERE email = '${email}'`
```

---

## 7. Consentements légaux (RGPD)

Lors de l'inscription, les champs suivants sont obligatoires :

```json
{
  "accepted_terms": true,
  "accepted_privacy": true
}
```

Si l'un des deux est `false` ou absent → HTTP 400, inscription refusée.

Ces valeurs sont stockées avec leur date d'acceptation :
- `accepted_terms` + `accepted_terms_at`
- `accepted_privacy` + `accepted_privacy_at`

Un champ `marketing_consent` optionnel est aussi disponible.

---

## 8. Upload de fichiers

**Middleware** : `middlewares/upload.js` (basé sur Multer)

Protections en place :
- **Types MIME autorisés** : `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Taille maximale** : 5 Mo par fichier
- **Destination** : `public/uploads/` (hors portée du code source)
- **Renommage** : nom aléatoire + horodatage (pas d'exécution de nom utilisateur)

---

## 9. SSL / TLS

- **En développement** : HTTP local (pas de SSL requis)
- **En production** :
  - Le frontend Netlify est servi en HTTPS automatiquement
  - Le backend Render est servi en HTTPS automatiquement
  - La base de données Filess.io requiert SSL (`DB_SSL=true`, `rejectUnauthorized: false` pour certificat auto-signé)

---

## 10. Variables d'environnement sensibles

| Variable | Pourquoi sensible |
|---|---|
| `JWT_SECRET` | Compromis → falsification de tokens |
| `DB_PASSWORD` | Accès direct à la base de données |
| `DB_HOST` + `DB_NAME` | Exposition de la cible |

**Règles** :
- Aucune valeur sensible dans le dépôt Git (`.gitignore` inclut `*.env`)
- Sur Render : variables définies manuellement dans le dashboard
- `JWT_SECRET` généré automatiquement par Render Blueprint (`generateValue: true`)

---

## Récapitulatif OWASP Top 10

| Vulnérabilité | Statut | Mesure |
|---|---|---|
| A01 - Broken Access Control | ✅ Protégé | RBAC (requireBlogPermission) + requireGlobalRole |
| A02 - Cryptographic Failures | ✅ Protégé | Argon2 + HTTPS + JWT signé |
| A03 - Injection | ✅ Protégé | Requêtes SQL paramétrées |
| A04 - Insecure Design | ✅ Couvert | Séparation backend/frontend, validation à chaque couche |
| A05 - Security Misconfiguration | ✅ Couvert | CORS strict, variables d'env séparées, pas de debug en prod |
| A06 - Vulnerable Components | ⚠️ À surveiller | Mettre à jour régulièrement les dépendances npm |
| A07 - Auth Failures | ✅ Protégé | Rate limiting + JWT + validation mot de passe |
| A08 - Software & Data Integrity | ✅ Couvert | `npm ci` (lockfile strict), pas de désérialisation unsafe |
| A09 - Logging Failures | ✅ Couvert | Table `audit_logs` pour actions sensibles |
| A10 - SSRF | N/A | Pas de requêtes HTTP sortantes vers URL utilisateur |

---

> [← 06 Frontend](06-frontend.md) | [08 — Tests →](08-tests.md)
