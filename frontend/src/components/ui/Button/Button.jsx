// Styles CSS du bouton (variantes, tailles, états hover/focus/disabled)
import "./Button.css";

// Composant Button : bouton générique réutilisable dans toute l'application.
// Props :
//   children  — contenu textuel ou JSX affiché à l'intérieur du bouton
//   className — classes CSS supplémentaires à fusionner (ex : marges personnalisées)
//   icon      — composant d'icône lucide-react à afficher avant le texte (optionnel)
//   variant   — variante visuelle du bouton : "primary" (défaut), "secondary", "ghost", "danger"…
//   ...props  — tous les attributs HTML natifs du <button> (type, onClick, disabled, aria-*, etc.)
function Button({ children, className = "", icon: Icon = null, variant = "primary", ...props }) {
  return (
    // La classe CSS dynamique applique la variante et les classes personnalisées
    // .trim() supprime les espaces superflus si className est vide
    <button className={`button button--${variant} ${className}`.trim()} {...props}>
      {/* Icône optionnelle : rendu conditionnel — null si aucune icône n'est passée */}
      {/* size=16 et strokeWidth=2.4 garantissent une cohérence visuelle avec le texte */}
      {Icon ? <Icon size={16} strokeWidth={2.4} /> : null}
      {/* Contenu du bouton (texte, autre composant, etc.) */}
      {children}
    </button>
  );
}

// Export par défaut pour l'utilisation dans les formulaires, modals et barres d'actions
export default Button;
