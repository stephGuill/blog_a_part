// Configuration Jest (CommonJS) pour le backend
// Ce fichier explique ligne par ligne la configuration minimale utilisée
// pour exécuter la suite de tests du dossier `backend`.

// Export CommonJS attendu par Jest
module.exports = {
  // testEnvironment : indique à Jest d'utiliser un environnement Node.js
  // (vs. 'jsdom' qui simule un navigateur). Ici les tests sont côté serveur.
  testEnvironment: 'node',

  // roots : liste des répertoires racines à partir desquels Jest va rechercher
  // les fichiers de test. '<rootDir>' correspond au dossier `backend` quand
  // Jest est lancé depuis ce dossier.
  roots: ['<rootDir>'],

  // testMatch : motifs glob pour localiser les fichiers de test. Jest va
  // exécuter les fichiers correspondant à ces patterns.
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};
