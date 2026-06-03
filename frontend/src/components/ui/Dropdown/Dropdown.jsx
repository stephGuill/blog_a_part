// Styles CSS du dropdown (positionnement, animation, focus)
import "./Dropdown.css";

// Composant Dropdown : menu déroulant natif HTML5 sans JavaScript supplémentaire.
// Repose sur l'élément HTML <details>/<summary> qui gère l'état ouvert/fermé nativement.
// Props :
//   label    — texte du bouton déclencheur (ex : "Actions", "Options")
//   children — éléments de menu (boutons, liens) injectés dans le panneau déroulant
//
// Avantage vs solution JS : accessible nativement, fonctionne sans état React.
// L'élément <details> se ferme automatiquement quand l'utilisateur clique ailleurs (CSS).
function Dropdown({ label = "Actions", children }) {
  return (
    // <details> : élément HTML natif pour les sections repliables / menus
    <details className="dropdown">
      {/* <summary> : bouton d'ouverture/fermeture visible, cliquable nativement */}
      <summary>{label}</summary>
      {/* Panneau du menu : contient les options (boutons, liens d'actions) */}
      <div className="dropdown__menu">{children}</div>
    </details>
  );
}

// Export par défaut utilisé dans les tableaux d'administration pour les actions par ligne
export default Dropdown;
