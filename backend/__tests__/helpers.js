// helpers.js — Utilitaires partagés entre toutes les suites de tests.
// Fournit : chargement de l'app, création d'un utilisateur de test, token JWT partagé,
// et fermeture propre de la connexion DB pour éviter que Jest reste suspendu.

// Charge les variables d'environnement depuis backend/.env avant tout import
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// Supertest : crée un client HTTP qui communique directement avec l'app Express
// sans ouvrir de port réseau réel (plus rapide et sans conflits de port)
const request = require("supertest");

// L'instance Express de l'application (sans app.listen)
const app = require("../src/app");

// Pool de connexions MySQL — à fermer après les tests pour que Jest se termine proprement
const db = require("../database/client");

// Suffixe unique basé sur le timestamp pour éviter les conflits d'email/username
// entre plusieurs exécutions de tests sur la même base de données
const TEST_SUFFIX = Date.now();

// Données du compte de test créé dans beforeAll et supprimé dans afterAll
const testUser = {
  username: `testuser_${TEST_SUFFIX}`,
  email: `testuser_${TEST_SUFFIX}@test.local`,
  password: "TestPass1!",
  accepted_terms: true,
  accepted_privacy: true,
};

// token : JWT renvoyé après signin, utilisé pour les requêtes protégées
let token = null;
// userId : identifiant de l'utilisateur de test en base, pour le nettoyage
let userId = null;

/**
 * Crée un utilisateur de test via POST /api/auth/signup et se connecte.
 * À appeler dans beforeAll() des suites qui ont besoin d'un token.
 * Retourne { token, userId } pour une utilisation dans les tests.
 */
async function setupTestUser() {
  // 1. Inscription
  const signupRes = await request(app)
    .post("/api/auth/signup")
    .send(testUser)
    .expect(201);

  userId = signupRes.body.user?.id || signupRes.body.id;

  // 2. Connexion pour récupérer le JWT
  const signinRes = await request(app)
    .post("/api/auth/signin")
    .send({ login: testUser.email, password: testUser.password })
    .expect(200);

  token = signinRes.body.token;
  return { token, userId };
}

/**
 * Supprime l'utilisateur de test directement en base de données.
 * À appeler dans afterAll() pour ne pas polluer la DB entre les runs.
 */
async function cleanupTestUser() {
  if (userId) {
    await db.query("DELETE FROM users WHERE id = ?", [userId]);
  }
}

/**
 * Ferme le pool de connexions MySQL pour que Jest puisse se terminer.
 * À appeler dans afterAll() de la dernière suite ou via globalTeardown.
 */
async function closeDb() {
  await db.end();
}

module.exports = {
  app,
  db,
  request,
  testUser,
  getToken: () => token,
  getUserId: () => userId,
  setupTestUser,
  cleanupTestUser,
  closeDb,
};
