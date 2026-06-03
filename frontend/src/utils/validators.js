// utils/validators.js
// Fonctions de validation légères réutilisables dans les formulaires.
// Chaque fonction prend une valeur et retourne un booléen.

// isEmail : vérifie qu'une chaîne ressemble à une adresse e-mail valide.
// Utilise une regex minimaliste : présence d'un @ flanqué de caractères non-blancs
// et d'un point dans la partie domaine. Suffisant pour une validation UX côté client.
// Note : la validation définitive est toujours faite côté serveur.
export const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

// isRequired : vérifie qu'un champ n'est pas vide après suppression des espaces.
// Convertit la valeur en chaîne (pour gérer les nombres, null et undefined)
// puis vérifie que la longueur est supérieure à zéro.
export const isRequired = (value) => String(value || "").trim().length > 0;
