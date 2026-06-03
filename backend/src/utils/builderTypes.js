// utils/builderTypes.js
// ============================================================
// Constantes de types valides pour le Page Builder.
// Le Page Builder permet aux utilisateurs de créer des pages
// visuellement en assemblant des sections et des blocs.
//
// Ce fichier définit les valeurs autorisées pour chaque entité du builder
// et fournit un helper de validation générique.
//
// Structure du builder (du plus grand au plus petit) :
//   Page → Sections → Blocs
// ============================================================

// Types de pages supportés par le builder.
// Object.freeze() rend le tableau immuable : personne ne peut ajouter/modifier/supprimer
// des valeurs après la création, ce qui prévient les modifications accidentelles.
//   - "page"     : page statique générique
//   - "post"     : page de type article de blog
//   - "article"  : article long format
//   - "landing"  : page d'atterrissage (landing page marketing)
const BUILDER_PAGE_TYPES = Object.freeze(["page", "post", "article", "landing"]);

// Statuts possibles d'une page du builder.
// Suit le cycle de vie standard d'un contenu éditorial :
//   - "draft"     : brouillon, visible uniquement par les éditeurs
//   - "published" : publié, visible par tous les lecteurs autorisés
//   - "archived"  : archivé, retiré de la vue publique mais conservé
const BUILDER_PAGE_STATUSES = Object.freeze(["draft", "published", "archived"]);

// Types de sections : définissent la mise en page d'une zone de la page.
// Chaque section contient un ou plusieurs blocs de contenu.
//   - "hero"          : zone d'accroche principale (titre + image pleine largeur)
//   - "content"       : zone de contenu textuel standard
//   - "article"       : corps d'un article (texte riche, images inline)
//   - "grid"          : mise en page en grille CSS
//   - "columns"       : mise en page en colonnes
//   - "gallery"       : galerie d'images
//   - "call_to_action": zone incitant à une action (bouton, formulaire)
//   - "custom"        : section personnalisée libre
const BUILDER_SECTION_TYPES = Object.freeze([
  "hero",
  "content",
  "article",
  "grid",
  "columns",
  "gallery",
  "call_to_action",
  "custom",
]);

// Types de blocs : éléments atomiques de contenu placés dans les sections.
//   - "heading"   : titre (h1 à h6, niveau défini par BUILDER_HEADING_LEVELS)
//   - "paragraph" : paragraphe de texte
//   - "image"     : bloc image
//   - "avatar"    : image d'avatar (profil auteur, etc.)
//   - "button"    : bouton d'action cliquable
//   - "link"      : lien hypertexte
//   - "card"      : carte (image + titre + texte)
//   - "divider"   : séparateur horizontal
//   - "quote"     : citation (blockquote)
//   - "list"      : liste à puces ou numérotée
//   - "container" : conteneur wrapper pour regrouper des blocs
//   - "spacer"    : espace vide pour gérer les marges visuelles
const BUILDER_BLOCK_TYPES = Object.freeze([
  "heading",
  "paragraph",
  "image",
  "avatar",
  "button",
  "link",
  "card",
  "divider",
  "quote",
  "list",
  "container",
  "spacer",
]);

// Niveaux de titre HTML supportés pour les blocs de type "heading".
// Correspond aux balises HTML h1 à h6 (importance décroissante).
const BUILDER_HEADING_LEVELS = Object.freeze(["h1", "h2", "h3", "h4", "h5", "h6"]);

// Types d'utilisation des médias dans le builder.
// Permet de catégoriser l'usage d'une image uploadée :
//   - "hero"      : image de couverture principale
//   - "avatar"    : photo de profil ou d'auteur
//   - "content"   : image insérée dans le corps du contenu
//   - "thumbnail" : miniature d'aperçu
//   - "other"     : usage non catégorisé
const BUILDER_MEDIA_USAGE_TYPES = Object.freeze(["hero", "avatar", "content", "thumbnail", "other"]);

// Helper générique de validation : vérifie si une valeur appartient à une liste autorisée.
// Utilisation : isAllowed("draft", BUILDER_PAGE_STATUSES) → true
//               isAllowed("unknown", BUILDER_PAGE_STATUSES) → false
// Utilise Array.includes() qui fait une comparaison stricte (===).
function isAllowed(value, allowedValues) {
  return allowedValues.includes(value);
}

// Export de toutes les constantes et du helper pour utilisation dans :
//   - controllers/builderController.js (validation des entrées)
//   - models/BuilderManager.js (vérifications avant INSERT/UPDATE)
//   - tests unitaires (assertions sur les valeurs acceptées)
module.exports = {
  BUILDER_BLOCK_TYPES,       // Types de blocs atomiques
  BUILDER_HEADING_LEVELS,    // Niveaux de titres HTML
  BUILDER_MEDIA_USAGE_TYPES, // Catégories d'usage des médias
  BUILDER_PAGE_STATUSES,     // Statuts du cycle de vie d'une page
  BUILDER_PAGE_TYPES,        // Types de pages supportés
  BUILDER_SECTION_TYPES,     // Types de sections de mise en page
  isAllowed,                 // Helper de validation générique
};
