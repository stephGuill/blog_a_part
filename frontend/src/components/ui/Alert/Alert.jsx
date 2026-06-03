// Styles CSS des alertes (couleurs, icônes par type)
import "./Alert.css";

// Composant Alert : bandeau de message contextualisé.
// Props :
//   children — contenu du message (texte ou JSX)
//   type     — "info" (défaut, bleu), "success" (vert), "warning" (orange), "error" (rouge)
//
// La classe CSS dynamique "alert--{type}" applique la couleur correspondante définie dans Alert.css
function Alert({ children, type = "info" }) {
  return <div className={`alert alert--${type}`}>{children}</div>;
}

// Export par défaut pour les formulaires, pages d'erreur et notifications statiques
export default Alert;
