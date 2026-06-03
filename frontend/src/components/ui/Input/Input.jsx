// Styles CSS du champ de saisie (focus, états d'erreur, tailles)
import "./Input.css";

// Composant Input : champ de saisie avec étiquette intégrée.
// Props :
//   label   — texte de l'étiquette affiché au-dessus du champ (optionnel)
//             Si absent, aucun <label> n'est rendu (pour les champs sans titre visible)
//   id      — identifiant HTML unique, lie l'étiquette <label> au champ via htmlFor
//             (important pour l'accessibilité — clic sur le label focus le champ)
//   ...props — tous les attributs HTML natifs du <input> :
//              type, name, value, onChange, placeholder, required, disabled, min, max, etc.
function Input({ label, id, ...props }) {
  return (
    // Conteneur "field" : regroupe label + input pour une mise en forme CSS cohérente
    <div className="field">
      {/* Étiquette conditionnelle : rendue seulement si label est fourni */}
      {/* htmlFor associe l'étiquette à l'input via son id (accessibilité HTML) */}
      {label ? <label htmlFor={id}>{label}</label> : null}
      {/* Champ de saisie natif avec tous les attributs supplémentaires transmis */}
      <input id={id} {...props} />
    </div>
  );
}

// Export par défaut utilisé dans tous les formulaires (connexion, inscription, profil, etc.)
export default Input;
