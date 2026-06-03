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

  // helpers.js est un utilitaire partagé, pas une suite de tests : on l'exclut
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers\\.js$'],

  // forceExit : force Jest à se terminer après la fin des tests même si des
  // handles asynchrones (connexions DB, timers) restent ouverts.
  // Évite que le processus reste suspendu après la fin de la suite.
  forceExit: true,

  // Délai maximum par test en millisecondes (10 s pour les tests DB/réseau)
  testTimeout: 10000,
};
