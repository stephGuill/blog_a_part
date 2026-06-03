// auth.test.js — Tests d'intégration pour les routes d'authentification.
// Routes testées :
//   POST /api/auth/signup  → inscription (201)
//   POST /api/auth/signin  → connexion (200 + JWT)
//   GET  /api/auth/me      → profil courant (200, protégé par JWT)
// Chaque test vérifie : le code HTTP, la structure du body JSON et les champs clés.

const { app, db, request } = require("./helpers");

// Suffixe unique pour isoler cet utilisateur de test des autres runs
const SUFFIX = Date.now();
const TEST_EMAIL = `auth_test_${SUFFIX}@test.local`;
const TEST_USERNAME = `auth_user_${SUFFIX}`;
const TEST_PASSWORD = "TestPass1!";

// Stocke l'id créé pour nettoyage final
let createdUserId = null;
// Stocke le JWT après signin pour les tests protégés
let authToken = null;

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
describe("POST /api/auth/signup", () => {
  test("201 — crée un compte avec des données valides", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        accepted_terms: true,
        accepted_privacy: true,
      })
      .expect(201);

    // La réponse indique le succès et contient les données utilisateur
    // (Le token n'est PAS inclus dans la réponse signup — il faut faire signin ensuite)
    expect(res.body.status).toBe("success");
    expect(res.body.data?.user).toMatchObject({ email: TEST_EMAIL });

    // Mémorise l'id pour nettoyage
    createdUserId = res.body.data?.user?.id ?? res.body.id;
  });

  test("409 — rejette un email déjà utilisé", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({
        username: `${TEST_USERNAME}_2`,
        email: TEST_EMAIL, // même email
        password: TEST_PASSWORD,
        accepted_terms: true,
        accepted_privacy: true,
      })
      .expect(409);
  });

  test("400 — rejette un payload incomplet (sans email)", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ username: "nomail", password: TEST_PASSWORD })
      .expect(400);
  });

  test("400 — rejette un mot de passe trop faible", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({
        username: `weak_${SUFFIX}`,
        email: `weak_${SUFFIX}@test.local`,
        password: "123",
      })
      .expect(400);
  });
});

// ─── POST /api/auth/signin ────────────────────────────────────────────────────
describe("POST /api/auth/signin", () => {
  test("200 — connexion avec email + mot de passe valides", async () => {
    const res = await request(app)
      .post("/api/auth/signin")
      .send({ login: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    // Le token JWT doit être présent dans la réponse
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");

    // Stocke le token pour les tests suivants
    authToken = res.body.token;
  });

  test("401 — rejette un mauvais mot de passe", async () => {
    await request(app)
      .post("/api/auth/signin")
      .send({ login: TEST_EMAIL, password: "WrongPassword!" })
      .expect(401);
  });

  test("401 — rejette un email inexistant", async () => {
    await request(app)
      .post("/api/auth/signin")
      .send({ login: "nobody@nowhere.test", password: TEST_PASSWORD })
      .expect(401);
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
describe("GET /api/auth/me", () => {
  test("200 — retourne le profil de l'utilisateur connecté", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    // Le profil doit contenir l'email de l'utilisateur de test
    const user = res.body.user ?? res.body;
    expect(user).toMatchObject({ email: TEST_EMAIL });
  });

  test("401 — bloque l'accès sans token", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });

  test("401 — bloque un token invalide/expiré", async () => {
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token.faux.invalide")
      .expect(401);
  });
});

// ─── Nettoyage ─────────────────────────────────────────────────────────────────
afterAll(async () => {
  // Supprime l'utilisateur de test de la base de données
  if (createdUserId) {
    await db.query("DELETE FROM users WHERE id = ?", [createdUserId]);
  }
  // Ferme le pool MySQL pour que Jest puisse se terminer proprement
  await db.end().catch(() => {});
});
