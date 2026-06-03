// blogs.test.js — Tests d'intégration pour les routes de blogs.
// Routes testées :
//   GET    /api/blogs        → liste publique (200)
//   GET    /api/blogs/:id    → détail d'un blog (200 / 404)
//   POST   /api/blogs        → création (201, protégé)
//   PUT    /api/blogs/:id    → mise à jour (200, protégé + propriétaire)
//   DELETE /api/blogs/:id    → suppression (200/204, protégé + propriétaire)

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { app, db, request } = require("./helpers");

const SUFFIX = Date.now();
const TEST_EMAIL = `blog_owner_${SUFFIX}@test.local`;
const TEST_USERNAME = `blog_owner_${SUFFIX}`;
const TEST_PASSWORD = "TestPass1!";

let authToken = null;
let ownerUserId = null;
let createdBlogId = null;

// ─── Setup : créer un compte propriétaire et s'authentifier ──────────────────
beforeAll(async () => {
  // Inscription
  const signupRes = await request(app)
    .post("/api/auth/signup")
    .send({ username: TEST_USERNAME, email: TEST_EMAIL, password: TEST_PASSWORD, accepted_terms: true, accepted_privacy: true })
    .expect(201);
  ownerUserId = signupRes.body.user?.id ?? signupRes.body.id;

  // Connexion pour récupérer le JWT
  const signinRes = await request(app)
    .post("/api/auth/signin")
    .send({ login: TEST_EMAIL, password: TEST_PASSWORD })
    .expect(200);
  authToken = signinRes.body.token;
});

// ─── GET /api/blogs ───────────────────────────────────────────────────────────
describe("GET /api/blogs", () => {
  test("200 — retourne la liste des blogs (route publique)", async () => {
    const res = await request(app).get("/api/blogs").expect(200);
    // La réponse peut être un tableau ou un objet { blogs: [...] }
    const list = Array.isArray(res.body) ? res.body : res.body.blogs ?? res.body.data;
    expect(Array.isArray(list)).toBe(true);
  });

  test("200 — accessible sans authentification", async () => {
    await request(app).get("/api/blogs").expect(200);
  });
});

// ─── POST /api/blogs ──────────────────────────────────────────────────────────
describe("POST /api/blogs", () => {
  test("201 — crée un blog pour l'utilisateur connecté", async () => {
    const res = await request(app)
      .post("/api/blogs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: `Blog Test ${SUFFIX}`,
        description: "Blog créé par les tests automatisés",
        is_public: true,
      })
      .expect(201);

    // Mémorise l'id pour les tests PUT/DELETE et le nettoyage
    createdBlogId = res.body.blog?.id ?? res.body.insertId ?? res.body.id;
    expect(createdBlogId).toBeTruthy();
  });

  test("401 — bloque la création sans authentification", async () => {
    await request(app)
      .post("/api/blogs")
      .send({ name: "Blog sans auth", description: "..." })
      .expect(401);
  });

  test("400 — rejette un blog sans nom", async () => {
    await request(app)
      .post("/api/blogs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Pas de nom" })
      .expect(400);
  });
});

// ─── GET /api/blogs/:id ───────────────────────────────────────────────────────
describe("GET /api/blogs/:id", () => {
  test("200 — retourne le blog créé précédemment", async () => {
    if (!createdBlogId) return;
    const res = await request(app).get(`/api/blogs/${createdBlogId}`).expect(200);
    const blog = res.body.blog ?? res.body;
    expect(blog).toMatchObject({ id: createdBlogId });
  });

  test("404 — retourne 404 pour un id inexistant", async () => {
    await request(app).get("/api/blogs/999999999").expect(404);
  });
});

// ─── PUT /api/blogs/:id ───────────────────────────────────────────────────────
describe("PUT /api/blogs/:id", () => {
  test("200 — met à jour le nom du blog", async () => {
    if (!createdBlogId) return;
    const res = await request(app)
      .put(`/api/blogs/${createdBlogId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: `Blog Test Modifié ${SUFFIX}` })
      .expect(200);

    const blog = res.body.blog ?? res.body;
    expect(blog.name ?? res.body.affectedRows).toBeTruthy();
  });

  test("401 — bloque la modification sans token", async () => {
    if (!createdBlogId) return;
    await request(app)
      .put(`/api/blogs/${createdBlogId}`)
      .send({ name: "Modification non autorisée" })
      .expect(401);
  });
});

// ─── DELETE /api/blogs/:id ────────────────────────────────────────────────────
describe("DELETE /api/blogs/:id", () => {
  test("200/204 — supprime le blog créé", async () => {
    if (!createdBlogId) return;
    await request(app)
      .delete(`/api/blogs/${createdBlogId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect((res) => {
        if (res.status !== 200 && res.status !== 204) {
          throw new Error(`Expected 200 or 204, got ${res.status}`);
        }
      });
    createdBlogId = null; // Marque comme supprimé pour le nettoyage
  });

  test("401 — bloque la suppression sans token", async () => {
    await request(app).delete("/api/blogs/1").expect(401);
  });
});

// ─── Nettoyage ─────────────────────────────────────────────────────────────────
afterAll(async () => {
  // Supprime le blog si le test DELETE a échoué
  if (createdBlogId) {
    await db.query("DELETE FROM blogs WHERE id = ?", [createdBlogId]).catch(() => {});
  }
  // Supprime l'utilisateur de test
  if (ownerUserId) {
    await db.query("DELETE FROM users WHERE id = ?", [ownerUserId]).catch(() => {});
  }
  await db.end().catch(() => {});
});
