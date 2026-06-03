// Styles CSS de la zone de texte (hauteur minimale, resize, focus)
import "./Textarea.css";

// Composant Textarea : zone de saisie multi-lignes avec étiquette intégrée.
// Props :
//   label   — texte de l'étiquette affichée au-dessus de la zone (optionnel)
//   id      — identifiant HTML unique liant l'étiquette à la zone via htmlFor (accessibilité)
//   ...props — attributs HTML natifs du <textarea> :
//              name, value, onChange, placeholder, rows, cols, required, disabled, maxLength, etc.
function Textarea({ label, id, ...props }) {
  return (
    // Conteneur "field" : regroupe label + textarea pour une mise en forme CSS cohérente
    <div className="field">
      {/* Étiquette conditionnelle : rendue seulement si label est fourni */}
      {label ? <label htmlFor={id}>{label}</label> : null}
      {/* Zone de texte native avec tous les attributs supplémentaires transmis */}
      <textarea id={id} {...props} />
    </div>
  );
}

// Export par défaut utilisé dans les formulaires de commentaires, bio et descriptions longues
export default Textarea;
