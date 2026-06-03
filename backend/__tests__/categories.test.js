// categories.test.js — Tests d'intégration pour les routes de catégories.
// Les routes catégories sont publiques (pas de middleware protect).
// Routes testées :
//   GET    /api/categories        → liste (200)
//   POST   /api/categories        → création (201)
//   GET    /api/categories/:id    → détail (200 / 404)
//   PUT    /api/categories/:id    → mise à jour (200)
//   DELETE /api/categories/:id    → suppression (200/204)
//
// Stratégie :
//   La table `categories` requiert blog_id (FK) — on crée un user+blog de test
//   dans beforeAll pour disposer d'un blog_id valide.

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { app, db, request } = require("./helpers");

const SUFFIX = Date.now();
const TEST_EMAIL = `cat_owner_${SUFFIX}@test.local`;
const TEST_USERNAME = `cat_owner_${SUFFIX}`;
const TEST_PASSWORD = "TestPass1!";
const TEST_CATEGORY_NAME = `Catégorie Test ${SUFFIX}`;
const TEST_CATEGORY_SLUG = `categorie-test-${SUFFIX}`;

let authToken = null;
let ownerUserId = null;
let testBlogId = null;
let createdCategoryId = null;

// ─── Setup : user + blog de test ─────────────────────────────────────────────
beforeAll(async () => {
  // Inscription
  const signupRes = await request(app)
    .post("/api/auth/signup")
    .send({ username: TEST_USERNAME, email: TEST_EMAIL, password: TEST_PASSWORD, accepted_terms: true, accepted_privacy: true })
    .expect(201);
  ownerUserId = signupRes.body.data?.user?.id ?? signupRes.body.id;

  // Connexion
  const signinRes = await request(app)
    .post("/api/auth/signin")
    .send({ login: TEST_EMAIL, password: TEST_PASSWORD })
    .expect(200);
  authToken = signinRes.body.token;

  // Création du blog (categories ont une FK sur blogs)
  const blogRes = await request(app)
    .post("/api/blogs")
    .set("Authorization", `Bearer ${authToken}`)
    .send({ name: `Blog Cat Test ${SUFFIX}`, description: "Blog pour les tests catégories", is_public: true })
    .expect(201);
  testBlogId = blogRes.body.blog?.id ?? blogRes.body.id;
});

// ─── GET /api/categories ──────────────────────────────────────────────────────
describe("GET /api/categories", () => {
  test("200 — retourne la liste des catégories", async () => {
    const res = await request(app).get("/api/categories").expect(200);
    const list = Array.isArray(res.body) ? res.body : res.body.categories ?? res.body.data;
    expect(Array.isArray(list)).toBe(true);
  });
});

// ─── POST /api/categories ─────────────────────────────────────────────────────
describe("POST /api/categories", () => {
  test("201 — crée une nouvelle catégorie dans le blog de test", async () => {
    if (!testBlogId) return;
    const res = await request(app)
      .post("/api/categories")
      .send({
        blog_id: testBlogId,
        name: TEST_CATEGORY_NAME,
        slug: TEST_CATEGORY_SLUG,
        description: "Catégorie créée par les tests",
      })
      .expect(201);

    // La route retourne 201 avec header Location — le body peut être vide
    // On récupère l'id depuis le header Location ou le body
    const location = res.headers.location;
    createdCategoryId = res.body.category?.id ?? res.body.insertId ?? res.body.id
      ?? (location ? Number(location.split("/").pop()) : null);
    // Si pas d'id dans la réponse, on le cherche en base
    if (!createdCategoryId) {
      const [rows] = await db.query("SELECT id FROM categories WHERE slug = ? AND blog_id = ?", [TEST_CATEGORY_SLUG, testBlogId]);
      createdCategoryId = rows[0]?.id;
    }
    expect(createdCategoryId).toBeTruthy();
  });
});

// ─── GET /api/categories/:id ──────────────────────────────────────────────────
describe("GET /api/categories/:id", () => {
  test("200 — retourne la catégorie créée", async () => {
    if (!createdCategoryId) return;
    const res = await request(app)
      .get(`/api/categories/${createdCategoryId}`)
      .expect(200);

    const cat = res.body.category ?? res.body;
    expect(cat).toMatchObject({ id: createdCategoryId });
  });

  test("404 — retourne 404 pour un id inexistant", async () => {
    await request(app).get("/api/categories/999999999").expect(404);
  });
});

// ─── PUT /api/categories/:id ──────────────────────────────────────────────────
describe("PUT /api/categories/:id", () => {
  test("200/204 — met à jour le nom de la catégorie", async () => {
    if (!createdCategoryId) return;
    await request(app)
      .put(`/api/categories/${createdCategoryId}`)
      .send({ name: `${TEST_CATEGORY_NAME} Modifiée`, slug: `${TEST_CATEGORY_SLUG}-modif` })
      .expect((res) => {
        if (![200, 204].includes(res.status)) {
          throw new Error(`Expected 200 or 204, got ${res.status}`);
        }
      });
  });
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
describe("DELETE /api/categories/:id", () => {
  test("200/204 — supprime la catégorie créée", async () => {
    if (!createdCategoryId) return;
    await request(app)
      .delete(`/api/categories/${createdCategoryId}`)
      .expect((res) => {
        if (![200, 204].includes(res.status)) {
          throw new Error(`Expected 200 or 204, got ${res.status}`);
        }
      });
    createdCategoryId = null;
  });

  test("404 — retourne 404 pour un id inexistant", async () => {
    await request(app).delete("/api/categories/999999999").expect(404);
  });
});

// ─── Nettoyage ─────────────────────────────────────────────────────────────────
afterAll(async () => {
  if (createdCategoryId) {
    await db.query("DELETE FROM categories WHERE id = ?", [createdCategoryId]).catch(() => {});
  }
  if (testBlogId) {
    await db.query("DELETE FROM blogs WHERE id = ?", [testBlogId]).catch(() => {});
  }
  if (ownerUserId) {
    await db.query("DELETE FROM users WHERE id = ?", [ownerUserId]).catch(() => {});
  }
  await db.end().catch(() => {});
});

