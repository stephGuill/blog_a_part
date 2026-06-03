// Styles CSS du spinner (animation de rotation)
import "./Spinner.css";

// Composant Spinner : indicateur de chargement animé accessible.
// Affiché pendant les requêtes API ou les transitions de page.
//
// Accessibilité :
//   role="status"        — annonce aux lecteurs d'écran qu'il s'agit d'une zone de statut live
//   aria-label="Chargement" — texte alternatif lu par les technologies d'assistance
function Spinner() {
  return <span aria-label="Chargement" className="spinner" role="status" />;
}

// Export par défaut utilisé dans les pages de chargement, boutons en attente et useFetch
export default Spinner;
