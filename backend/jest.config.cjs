// Configuration Jest (CommonJS) pour le backend
// Ce fichier indique à Jest d'exécuter les tests en environnement `node`
// et où chercher les fichiers de test.
module.exports = {
  // Exécute les tests dans un environnement Node (pas de DOM)
  testEnvironment: 'node',

  // Racine(s) à partir desquelles Jest recherche les tests
  roots: ['<rootDir>'],

  // Motifs des fichiers de test pris en charge
  // - recherche dans `__tests__/**` et tous les fichiers nommés *.test.js / *.spec.js
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};
