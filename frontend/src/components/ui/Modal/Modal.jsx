// Styles CSS de la modale (backdrop, animation, tailles)
import "./Modal.css";

// Composant Modal : boîte de dialogue superposée à la page pour les confirmations et formulaires.
// Props :
//   isOpen   — booléen contrôlant la visibilité : true = affichée, false = masquée
//   onClose  — callback appelé pour fermer la modale (clic sur ✕ ou backdrop)
//   title    — titre affiché dans l'en-tête de la modale
//   children — contenu de la modale (formulaire, message de confirmation, etc.)
//
// Pattern de rendu conditionnel : retourne null si isOpen est false,
// évitant ainsi de rendre le DOM de la modale quand elle est invisible.
function Modal({ children, isOpen, onClose, title }) {
  // Rendu conditionnel : si la modale est fermée, on ne rend rien dans le DOM
  if (!isOpen) return null;

  return (
    // Fond sombre derrière la modale (backdrop) — bloque l'interaction avec le contenu en dessous
    <div className="modal-backdrop">
      {/* Conteneur de la modale : boîte blanche centrée à l'écran */}
      <section className="modal">
        {/* En-tête : contient le titre et le bouton de fermeture */}
        <div className="modal__header">
          {/* Titre de la modale (niveau h2 pour la hiérarchie sémantique) */}
          <h2>{title}</h2>
          {/* Bouton de fermeture accessible via aria-label (important pour les lecteurs d'écran) */}
          <button aria-label="Fermer" onClick={onClose} type="button">
            x
          </button>
        </div>
        {/* Corps de la modale : formulaire, texte de confirmation, ou autre contenu */}
        {children}
      </section>
    </div>
  );
}

// Export par défaut utilisé pour les confirmations de suppression, formulaires et aperçus
export default Modal;
