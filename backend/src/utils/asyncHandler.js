// utils/asyncHandler.js
// ============================================================
// Wrapper utilitaire pour les handlers Express asynchrones.
//
// Problème résolu : dans Express, si un handler async lève une erreur
// (rejet de Promise), Express ne la capture PAS automatiquement et
// le serveur se retrouve en état d'attente indéfini.
//
// Solution : envelopper le handler dans asyncHandler() qui :
//   1. Exécute le handler (qui retourne une Promise via async/await)
//   2. Capture les rejets avec .catch(next) → transmet l'erreur
//      au middleware de gestion d'erreurs Express suivant.
//
// Utilisation :
//   router.get('/route', asyncHandler(async (req, res) => { ... }));
// ============================================================

// asyncHandler est une fonction d'ordre supérieur (Higher-Order Function) :
// elle prend un handler en paramètre et retourne un nouveau handler Express.
//
// Signature du handler Express attendu : (req, res, next) => Promise
//
// Le handler retourné :
//  - appelle le handler original avec (req, res, next)
//  - enveloppe le résultat dans Promise.resolve() pour s'assurer
//    que même un retour synchrone est traité comme une Promise
//  - chaîne .catch(next) pour transmettre toute erreur levée
//    à Express via le paramètre `next` (middleware d'erreur global)
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

// Export de la fonction wrapper pour utilisation dans tous les fichiers de routes.
module.exports = asyncHandler;
