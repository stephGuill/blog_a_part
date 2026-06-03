// Styles CSS des badges (couleurs, border-radius)
import "./Badge.css";

// Composant Badge : étiquette inline colorée pour afficher un statut ou une catégorie.
// Props :
//   children — texte affiché dans le badge (ex : "Publié", "+12%", "Admin")
//   tone     — variante de couleur : "neutral" (défaut, gris), "success" (vert),
//               "warning" (orange), "danger" (rouge), "info" (bleu), "purple"…
//
// La classe CSS "badge--{tone}" mappe vers une couleur définie dans Badge.css
function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

// Export par défaut utilisé dans les tableaux, cartes d'articles et listes de rôles
export default Badge;
