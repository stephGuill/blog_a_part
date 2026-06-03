// utils/formatDate.js
// Formate une date en chaîne lisible en français.
// Utilisé dans les cartes d'articles, commentaires et listes pour afficher
// les dates de publication, de création ou de modification.

// formatDate(value) : convertit une valeur date en texte localisé français.
//   - Si value est null, undefined ou vide → retourne le placeholder "Date a venir"
//   - Sinon → utilise Intl.DateTimeFormat avec la locale "fr-FR" pour produire
//     une date longue (ex : "3 juin 2026" au lieu de "06/03/2026")
//
// Intl.DateTimeFormat : API native du navigateur, ne nécessite aucune librairie externe.
//   day: "numeric"  → chiffre sans zéro (ex: 3 et non 03)
//   month: "long"   → nom complet du mois (ex: "juin" et non "06")
//   year: "numeric" → année complète (ex: 2026)
export const formatDate = (value) => {
  if (!value) return "Date a venir";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};
