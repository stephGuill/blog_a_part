// Eye : icône d'œil ouvert (afficher le mot de passe)
// EyeOff : icône d'œil barré (masquer le mot de passe)
import { Eye, EyeOff } from "lucide-react";

// useState : gère l'état local de visibilité du mot de passe
import { useState } from "react";

// Styles CSS spécifiques au composant PasswordInput
import "./PasswordInput.css";

// Composant champ de mot de passe avec bouton bascule afficher/masquer
// id : identifiant de l'input, utilisé par le label via htmlFor
// label : texte du label affiché au-dessus du champ
// name : nom du champ dans le formulaire (utilisé par handleChange avec event.target.name)
// onChange : callback de changement — gère le formulaire contrôlé du parent
// value : valeur actuelle du champ (formulaire contrôlé)
// autoComplete : hint navigateur pour l'autocomplétion ("current-password" ou "new-password")
function PasswordInput({ id, label, name, onChange, value, autoComplete = "current-password" }) {
  // useState gère l'affichage du mot de passe en clair (true) ou masqué (false)
  const [isVisible, setIsVisible] = useState(false);

  return (
    // <label> avec htmlFor lie le clic sur le label au focus de l'input correspondant
    <label className="password-input" htmlFor={id}>
      {/* Texte du label affiché au-dessus du champ de saisie */}
      <span>{label}</span>

      {/* Conteneur flex qui regroupe l'input et le bouton de visibilité */}
      <span className="password-input__control">
        {/* Input contrôlé : type bascule entre "text" et "password" selon isVisible */}
        {/* value et onChange viennent du parent — c'est un formulaire contrôlé */}
        <input
          autoComplete={autoComplete} // Aide le navigateur à proposer la bonne autocomplétion
          id={id}                      // Lie l'input à son label via htmlFor
          name={name}                  // Utilisé par event.target.name pour identifier le champ
          onChange={onChange}          // Callback du parent : met à jour formData
          type={isVisible ? "text" : "password"} // Bascule l'affichage en clair ou masqué
          value={value}                // Valeur contrôlée par le parent
        />

        {/* Bouton bascule afficher/masquer le mot de passe */}
        <button
          // aria-label change selon l'état pour informer les lecteurs d'écran
          aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          // Lors du clic : bascule isVisible entre true et false
          // Forme fonctionnelle de setState pour lire la valeur courante
          onClick={() => setIsVisible((current) => !current)}
          title={isVisible ? "Masquer" : "Afficher"} // Info-bulle au survol
          type="button" // IMPORTANT : type="button" empêche la soumission du formulaire
        >
          {/* Rendu conditionnel : affiche l'icône selon l'état de visibilité */}
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

export default PasswordInput;
