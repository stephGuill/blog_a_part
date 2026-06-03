// Styles CSS des cartes (ombre, border-radius, padding, variantes)
import "./Card.css";

// Composant Card : conteneur visuel en forme de carte pour regrouper du contenu connexe.
// Props :
//   children  — contenu JSX à afficher à l'intérieur de la carte
//   className — classes CSS supplémentaires à fusionner (ex : largeur, marges)
//   variant   — variante visuelle : "default" (fond standard), "elevated" (ombre plus forte),
//               "flat" (sans ombre), "accent" (bordure colorée)…
//
// Utilise un <section> sémantique HTML pour délimiter une zone de contenu autonome.
function Card({ children, className = "", variant = "default" }) {
  return (
    // Classes fusionnées : card-shell de base + variante + classes personnalisées
    <section className={`card-shell card-shell--${variant} ${className}`.trim()}>
      {children}
    </section>
  );
}

// Export par défaut utilisé dans les tableaux de bord, listes et formulaires
export default Card;
