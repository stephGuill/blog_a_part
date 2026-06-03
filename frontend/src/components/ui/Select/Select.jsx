// Styles CSS du select (flèche personnalisée, focus, états)
import "./Select.css";

// Composant Select : liste déroulante avec étiquette intégrée.
// Props :
//   label   — texte de l'étiquette affichée au-dessus du select (optionnel)
//   id      — identifiant HTML unique liant l'étiquette au select via htmlFor (accessibilité)
//   options — tableau d'objets { value, label, disabled? } représentant les choix disponibles
//             Exemple : [{ value: "admin", label: "Administrateur" }, { value: "user", label: "Utilisateur" }]
//   ...props — attributs HTML natifs du <select> : value, onChange, required, disabled, name, etc.
function Select({ label, id, options = [], ...props }) {
  return (
    // Conteneur "field" : regroupe label + select pour une mise en forme CSS cohérente
    <div className="field">
      {/* Étiquette conditionnelle : rendue seulement si label est fourni */}
      {label ? <label htmlFor={id}>{label}</label> : null}
      {/* Liste déroulante native avec tous les attributs supplémentaires transmis */}
      <select id={id} {...props}>
        {/* Rendu de chaque option : key unique sur value, disabled pour les options non sélectionnables */}
        {options.map((option) => (
          <option disabled={option.disabled} key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Export par défaut utilisé dans les filtres, formulaires de rôles et sélecteurs de statut
export default Select;
