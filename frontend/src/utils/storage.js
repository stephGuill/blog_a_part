// utils/storage.js
// Abstraction légère autour de window.localStorage.
// Centralise les accès au stockage local pour :
//   - Faciliter les tests unitaires (mock en un seul endroit)
//   - Éviter les appels directs à window.localStorage dispersés dans le code
//   - Permettre de basculer vers sessionStorage ou un autre stockage sans tout réécrire

export const storage = {
  // get(key) : lit et retourne la valeur associée à la clé dans localStorage.
  // Retourne null si la clé n'existe pas (comportement natif de getItem).
  get: (key) => window.localStorage.getItem(key),

  // set(key, value) : enregistre une valeur sous la clé donnée dans localStorage.
  // Attention : localStorage ne stocke que des chaînes — sérialiser les objets avec JSON.stringify.
  set: (key, value) => window.localStorage.setItem(key, value),

  // remove(key) : supprime l'entrée correspondant à la clé du localStorage.
  // Sans effet si la clé n'existe pas.
  remove: (key) => window.localStorage.removeItem(key),
};
