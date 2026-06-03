// utils/allowedStyles.js
// ============================================================
// Liste blanche des propriétés CSS et sanitizer pour le builder.
//
// Problème résolu : le builder stocke les styles des blocs sous forme
// d'objets JSON (ex: { backgroundColor: "#fff", padding: "16px" }).
// Sans validation, un utilisateur malveillant pourrait injecter des
// propriétés CSS dangereuses (ex: content, expression()) ou du HTML.
//
// Solution : sanitizeStyleJson() filtre l'objet style entrant en ne
// conservant que les propriétés autorisées avec des valeurs sûres.
//
// Exports :
//   - ALLOWED_STYLE_PROPERTIES : liste blanche des propriétés CSS
//   - sanitizeStyleJson(style)  : retourne un objet style nettoyé
// ============================================================

// Liste blanche exhaustive des propriétés CSS autorisées dans le builder.
// Object.freeze() rend le tableau immuable pour éviter toute modification accidentelle.
// Toute propriété absente de cette liste sera ignorée par sanitizeStyleJson().
const ALLOWED_STYLE_PROPERTIES = Object.freeze([
  "alignItems",          // Alignement des enfants sur l'axe transversal (flex/grid)
  "backgroundColor",     // Couleur de fond de l'élément
  "backgroundOpacity",   // Opacité du fond (propriété custom du builder, 0-1)
  "borderColor",         // Couleur de la bordure
  "borderRadius",        // Arrondi des coins de la bordure
  "borderWidth",         // Épaisseur de la bordure
  "color",               // Couleur du texte
  "display",             // Type d'affichage CSS (block, flex, grid, etc.)
  "flexDirection",       // Direction des enfants dans un conteneur flex (row/column)
  "flexWrap",            // Comportement de retour à la ligne dans un flex
  "fontSize",            // Taille de la police
  "fontWeight",          // Graisse de la police (bold, 400, 700, etc.)
  "gap",                 // Espacement entre les enfants d'un flex ou grid
  "gridTemplateColumns", // Définition des colonnes d'une grille CSS
  "gridTemplateRows",    // Définition des lignes d'une grille CSS
  "height",              // Hauteur de l'élément
  "justifyContent",      // Alignement des enfants sur l'axe principal (flex/grid)
  "margin",              // Marges extérieures (espace autour de l'élément)
  "maxWidth",            // Largeur maximale de l'élément
  "minHeight",           // Hauteur minimale de l'élément
  "opacity",             // Opacité de l'élément entier (0-1)
  "padding",             // Marges intérieures (espace entre contenu et bordure)
  "textAlign",           // Alignement horizontal du texte
  "width",               // Largeur de l'élément
]);

// Valeurs autorisées pour la propriété CSS "display".
// Restreint à un sous-ensemble sécurisé pour éviter des valeurs exotiques.
const ALLOWED_DISPLAY_VALUES = Object.freeze(["block", "inline-block", "grid", "flex", "none"]);

// Valeurs autorisées pour la propriété CSS "textAlign".
const ALLOWED_TEXT_ALIGN_VALUES = Object.freeze(["left", "center", "right", "justify"]);

// Regex pour valider les couleurs CSS dans les formats courants :
//   - #RGB, #RRGGBB, #RRGGBBAA (hexadécimaux avec 3 à 8 chiffres)
//   - rgb(r, g, b) ou rgba(r, g, b, a)
//   - "transparent" (couleur CSS spéciale)
//   - "currentColor" (hérite de la couleur du texte parent)
// Les caractères dangereux comme les parenthèses non terminées sont rejetés.
const COLOR_PATTERN = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|transparent|currentColor)$/;

// Regex pour valider les valeurs de taille CSS :
//   - Accepte les nombres entiers ou décimaux (ex: 16, 1.5)
//   - Suivi d'une unité optionnelle : px, rem, em, %, vh, vw
//   - Accepte les valeurs négatives (ex: -8px pour les marges négatives)
//   - Accepte les valeurs sans unité (utile pour flexGrow, etc.)
const CSS_SIZE_PATTERN = /^-?\d+(\.\d+)?(px|rem|em|%|vh|vw)?$/;

// ---------------------------------------------------------------
// sanitizeStyleJson(style)
// Nettoie un objet de styles JSON en ne conservant que les entrées sûres.
// Retourne un nouvel objet ne contenant que les propriétés validées.
// ---------------------------------------------------------------
function sanitizeStyleJson(style = {}) {
  // Vérification de type : si l'entrée n'est pas un objet non-null non-tableau,
  // on retourne un objet vide plutôt que de planter ou de laisser passer des données invalides.
  if (!style || typeof style !== "object" || Array.isArray(style)) {
    return {};
  }

  // Object.entries(style) transforme l'objet en tableau de paires [clé, valeur]
  // pour pouvoir itérer dessus avec reduce().
  // reduce() construit progressivement l'objet "safeStyle" en ajoutant
  // uniquement les propriétés qui passent toutes les vérifications.
  return Object.entries(style).reduce((safeStyle, [key, value]) => {
    // Première vérification : la propriété doit figurer dans la liste blanche.
    // Si elle est absente, on ignore l'entrée (on retourne safeStyle sans modification).
    if (!ALLOWED_STYLE_PROPERTIES.includes(key)) {
      return safeStyle;
    }

    // Validation spéciale pour les propriétés d'opacité :
    // - Conversion en nombre avec Number() pour rejeter les chaînes non numériques
    // - Number.isNaN() vérifie que la conversion a réussi
    // - La valeur doit être entre 0 (transparent) et 1 (opaque) inclus
    if (["opacity", "backgroundOpacity"].includes(key)) {
      const opacity = Number(value);
      if (!Number.isNaN(opacity) && opacity >= 0 && opacity <= 1) {
        safeStyle[key] = opacity; // Stocke la valeur numérique (pas la chaîne)
      }
      return safeStyle;
    }

    // Validation spéciale pour les propriétés de couleur :
    // - La valeur doit être une chaîne (typeof) pour éviter les injections d'objets
    // - La valeur doit correspondre exactement à COLOR_PATTERN
    // - .trim() supprime les espaces en début/fin avant le test
    if (["color", "backgroundColor", "borderColor"].includes(key)) {
      if (typeof value === "string" && COLOR_PATTERN.test(value.trim())) {
        safeStyle[key] = value.trim(); // Stocke la valeur normalisée sans espaces
      }
      return safeStyle;
    }

    // Validation pour la propriété "display" :
    // La valeur doit être dans la liste blanche ALLOWED_DISPLAY_VALUES.
    if (key === "display") {
      if (ALLOWED_DISPLAY_VALUES.includes(value)) {
        safeStyle[key] = value;
      }
      return safeStyle;
    }

    // Validation pour la propriété "textAlign" :
    // La valeur doit être dans la liste blanche ALLOWED_TEXT_ALIGN_VALUES.
    if (key === "textAlign") {
      if (ALLOWED_TEXT_ALIGN_VALUES.includes(value)) {
        safeStyle[key] = value;
      }
      return safeStyle;
    }

    // Validation générique pour les chaînes de caractères restantes :
    // Interdit les caractères potentiellement dangereux : < > { } ; (CSS injection / XSS)
    // /[<>{};]/ correspond à l'un de ces caractères.
    if (typeof value === "string" && !/[<>{};]/.test(value)) {
      safeStyle[key] = value.trim(); // Stocke la valeur nettoyée
      return safeStyle;
    }

    // Validation pour les valeurs numériques :
    // Vérifie que la représentation en chaîne correspond à CSS_SIZE_PATTERN.
    // Utile pour des cas où une valeur numérique serait passée directement.
    if (typeof value === "number" && CSS_SIZE_PATTERN.test(String(value))) {
      safeStyle[key] = value;
    }

    // Retourne l'accumulateur (avec ou sans la nouvelle propriété ajoutée)
    return safeStyle;
  }, {}); // L'accumulateur initial est un objet vide
}

// Export de la liste blanche et du sanitizer pour utilisation dans :
//   - controllers/builderController.js (validation avant sauvegarde BDD)
//   - models/BuilderManager.js (nettoyage des styles de blocs/sections)
module.exports = {
  ALLOWED_STYLE_PROPERTIES, // Liste blanche des propriétés CSS autorisées
  sanitizeStyleJson,         // Fonction de nettoyage d'un objet de styles
};
