// Styles CSS de l'état vide (centrage, opacité, espacement)
import "./EmptyState.css";

// Composant EmptyState : affiché quand une liste ou section ne contient aucun élément.
// Fournit un retour visuel clair à l'utilisateur au lieu d'un espace blanc vide.
// Props :
//   icon    — composant d'icône lucide-react affiché au-dessus du titre (optionnel)
//   title   — titre de l'état vide (ex : "Aucun article") — défaut : "Aucun contenu"
//   message — description complémentaire (ex : "Créez votre premier article.") — défaut générique
//   action  — élément JSX optionnel (ex : un bouton "Créer") affiché sous le message
function EmptyState({ action, icon: Icon, title = "Aucun contenu", message = "Les donnees apparaitront ici." }) {
  return (
    <div className="content-card empty-state">
      {/* Icône illustrative optionnelle — rendu conditionnel si la prop icon est fournie */}
      {Icon ? <Icon className="empty-state__icon" size={28} /> : null}
      {/* Titre de l'état vide, affiché en kicker (style typographique réduit) */}
      <div className="card-kicker">{title}</div>
      {/* Message explicatif pour guider l'utilisateur */}
      <p>{message}</p>
      {/* Action optionnelle : bouton "Créer" ou lien de redirection (peut être null) */}
      {action}
    </div>
  );
}

// Export par défaut utilisé dans les listes d'articles, médias, membres et catégories vides
export default EmptyState;
