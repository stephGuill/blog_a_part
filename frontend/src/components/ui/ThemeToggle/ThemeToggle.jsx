// Styles CSS du bouton de bascule de thème (forme, transitions)
import "./ThemeToggle.css";

// Composant ThemeToggle : bouton de bascule entre thème clair et thème sombre.
// Props :
//   isDark   — booléen indiquant si le thème sombre est actuellement actif
//              false (défaut) = thème clair affiché → le bouton propose de passer en "Sombre"
//              true           = thème sombre affiché → le bouton propose de passer en "Clair"
//   onToggle — callback appelé au clic pour inverser le thème (géré par ThemeContext)
//
// Le texte du bouton est contextuel : il indique toujours le thème vers lequel on va basculer.
function ThemeToggle({ isDark = false, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle} type="button">
      {/* Libellé dynamique : si thème sombre actif → proposer "Clair", sinon → proposer "Sombre" */}
      {isDark ? "Clair" : "Sombre"}
    </button>
  );
}

// Export par défaut utilisé dans la Topbar et potentiellement la Sidebar du dashboard
export default ThemeToggle;
