/* Import du CSS propre au composant BlogPreview. */
import "./BlogPreview.css";

/* Composant BlogPreview : aperçu minimaliste d'un blog (prévisualisation en temps réel).
   Typiquement utilisé dans un formulaire de création/édition de blog pour montrer
   à l'utilisateur un rendu visuel de son blog pendant qu'il saisit les informations.

   Props (destructurées) :
   - blog : objet contenant les données partielles du blog (peut être incomplet ou null).
     Propriétés utilisées : name (nom du blog), description (description du blog).

   L'opérateur ?. (optional chaining) est utilisé pour accéder en sécurité aux propriétés :
   blog?.name → retourne undefined si `blog` est null/undefined (au lieu de lever une erreur).
   L'opérateur || retourne la valeur de droite si la valeur de gauche est falsy.
   Ainsi `blog?.name || "Blog sans titre"` affiche le nom ou un placeholder si absent. */
function BlogPreview({ blog }) {
  return (
    /* Balise HTML sémantique <article> : contenu autonome représentant le blog prévisualisé.
       La classe "content-card" est une classe CSS globale qui applique le style de carte. */
    <article className="content-card">

      {/* card-kicker : petit label de catégorie/contexte au-dessus du titre.
          "Preview" est en dur (anglais) : ce texte indique le mode d'affichage (prévisualisation).
          Il pourrait être traduit avec t("common.preview") dans une version i18n complète. */}
      <div className="card-kicker">Preview</div>

      {/* Titre du blog prévisualisé.
          blog?.name → lit blog.name en sécurité (retourne undefined si blog est null).
          || "Blog sans titre" → valeur de repli affichée si le nom n'est pas encore saisi. */}
      <h2 className="card-title">{blog?.name || "Blog sans titre"}</h2>

      {/* Description du blog prévisualisée.
          blog?.description → lit la description en sécurité.
          || "Description a venir." → placeholder affiché tant qu'aucune description n'est saisie. */}
      <p>{blog?.description || "Description a venir."}</p>
    </article>
  );
}

/* Export par défaut pour l'import dans les pages de création/édition de blog. */
export default BlogPreview;
