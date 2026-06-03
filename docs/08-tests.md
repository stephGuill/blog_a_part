# 08 — Tests

> [← 07 Sécurité](07-securite.md) | [09 — Docker →](09-docker.md)

---

## Stack de test

| Outil | Version | Rôle |
|---|---|---|
| Jest | 30.4.2 | Runner de tests, assertions |
| Supertest | — | Requêtes HTTP sur l'application Express |
| mysql2/promise | — | Connexion DB réelle pendant les tests |

---

## Philosophie

Les tests sont des **tests d'intégration** : ils testent le flux HTTP complet, de la requête HTTP jusqu'à la base de données MySQL.

Il n'y a **pas de mocks** : une base de données réelle est requise.

---

## Configuration Jest

**`backend/jest.config.cjs`** :

```js
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
};
```

---

## Lancer les tests

```bash
cd backend

# Lancer tous les tests (ordre séquentiel obligatoire)
npm test -- --runInBand

# Lancer un seul fichier
npm test -- --runInBand __tests__/auth.test.js
npm test -- --runInBand __tests__/posts.test.js

# Mode watch (développement)
npm test -- --runInBand --watch
```

> **`--runInBand`** est obligatoire : les tests modifient la même base de données et doivent s'exécuter **en série** pour éviter les conflits.

---

## Résultats attendus

```
Test Suites: 4 passed, 4 total
Tests:       42 passed, 42 total
```

---

## Structure des fichiers de test

```
backend/__tests__/
├── helpers.js          ← Utilitaires partagés par tous les tests
├── auth.test.js        ← 12 tests — Routes /api/auth
├── blogs.test.js       ← Tests — Routes /api/blogs
├── categories.test.js  ← Tests — Routes /api/categories
└── posts.test.js       ← Tests — Routes /api/posts
```

---

## Fichier `helpers.js`

Contient les éléments partagés entre tous les fichiers de test.

```js
// Suffixe unique par run pour éviter les conflits de données
export const TEST_SUFFIX = Date.now();

// Données de l'utilisateur de test
export const testUserData = {
  username: `testuser_${TEST_SUFFIX}`,
  email: `test_${TEST_SUFFIX}@example.com`,
  password: "TestPass1!",
  accepted_terms: true,    // Obligatoire (RGPD)
  accepted_privacy: true,  // Obligatoire (RGPD)
};

// Accès à l'application Express
export { default as app } from "../src/app.js";

// Accès au pool DB pour fermeture propre
export { default as db } from "../database/client.js";
```

---

## Pattern `beforeAll` / `afterAll`

Chaque fichier de test suit le même cycle de vie :

```js
describe("Blogs API", () => {
  let authToken;
  let testBlogId;

  beforeAll(async () => {
    // 1. Créer un compte de test (signup)
    await request(app).post("/api/auth/signup").send(testUserData);

    // 2. Se connecter et récupérer le token
    const res = await request(app).post("/api/auth/signin").send({
      email: testUserData.email,
      password: testUserData.password,
    });
    authToken = res.body.token;

    // 3. Créer les ressources nécessaires pour les tests
    const blogRes = await request(app)
      .post("/api/blogs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: `Blog_${TEST_SUFFIX}`, slug: `blog-${TEST_SUFFIX}` });
    testBlogId = blogRes.body.id;
  });

  afterAll(async () => {
    // Nettoyage : supprimer les ressources créées
    await request(app)
      .delete(`/api/blogs/${testBlogId}`)
      .set("Authorization", `Bearer ${authToken}`);

    // Fermer le pool de connexions DB
    await db.end();
  });

  // Tests...
});
```

---

## Tests par fichier

### `auth.test.js` — 12 tests

| Test | Description |
|---|---|
| Signup valide | Crée un compte → 201 |
| Signup — email dupliqué | → 409 Conflict |
| Signup — CGU manquantes | `accepted_terms: false` → 400 |
| Signup — mot de passe faible | Sans majuscule, chiffre… → 400 |
| Signin valide | Token JWT renvoyé → 200 |
| Signin — mauvais mot de passe | → 401 |
| Signin — email inconnu | → 401 |
| GET /auth/me — connecté | Renvoie le profil → 200 |
| GET /auth/me — sans token | → 401 |
| GET /auth/me — token invalide | → 401 |
| Rate limit | 11e tentative → 429 |
| Refresh token | (si implémenté) |

### `blogs.test.js`

| Test | Description |
|---|---|
| POST /blogs — valide | Crée un blog + membre owner → 201 |
| POST /blogs — sans auth | → 401 |
| POST /blogs — slug dupliqué | → 409 |
| GET /blogs | Liste des blogs → 200 |
| GET /blogs/:id | Détail d'un blog → 200 |
| GET /blogs/:id — inconnu | → 404 |
| PUT /blogs/:id — owner | Modifie le blog → 200 |
| PUT /blogs/:id — non owner | → 403 |
| DELETE /blogs/:id — owner | → 204 |

### `categories.test.js`

| Test | Description |
|---|---|
| POST /categories — valide | Crée une catégorie → 201 |
| POST /categories — sans auth | → 401 |
| GET /categories | Liste → 200 |
| PUT /categories/:id | Modifie → 200 |
| DELETE /categories/:id | Supprime → 204 |

### `posts.test.js`

| Test | Description |
|---|---|
| POST /posts — valide | Crée un article → 201 + header Location |
| POST /posts — sans auth | → 401 |
| POST /posts — sans permission | → 403 |
| GET /posts/:id | Lit un article → 200 |
| PUT /posts/:id — payload complet | Modifie (blog_id, title, slug, status) → 200 |
| DELETE /posts/:id | Supprime → 204 |

---

## Problèmes connus et solutions

### `--runInBand` obligatoire

Sans `--runInBand`, les tests parallèles créent des conflits de données (même utilisateur de test, même slug) → tests aléatoirement en erreur.

### Récupération de l'ID après création

Certaines routes POST retournent `sendStatus(201)` sans corps JSON. L'ID est récupéré depuis le header `Location` :

```js
const location = res.headers.location; // "/posts/42"
const postId = Number(location.split("/").pop());
```

### Fermeture de la connexion DB

Sans `db.end()` dans `afterAll`, Jest attend indéfiniment la fermeture du pool → timeout. Chaque fichier de test doit fermer le pool.

### Données RGPD obligatoires

Le test `signup` doit inclure `accepted_terms: true` et `accepted_privacy: true`, sinon l'inscription échoue avec HTTP 400.

### `PUT /posts/:id` — payload complet requis

Le `PostsManager.update()` écrase tous les champs. Envoyer seulement le titre résulte en `blog_id = NULL` et une violation de clé étrangère. Tous les champs doivent être envoyés :

```js
await request(app)
  .put(`/api/posts/${postId}`)
  .set("Authorization", `Bearer ${authToken}`)
  .send({
    blog_id: testBlogId,
    title: "Titre modifié",
    slug: `post-${TEST_SUFFIX}`,
    status: "draft",
  });
```

---

## Ajouter de nouveaux tests

1. Créer `__tests__/nom.test.js`
2. Importer les helpers partagés
3. Suivre le pattern `beforeAll` / `afterAll`
4. Utiliser `TEST_SUFFIX = Date.now()` pour les données uniques
5. Nettoyer toutes les ressources créées dans `afterAll`

---

> [← 07 Sécurité](07-securite.md) | [09 — Docker →](09-docker.md)
