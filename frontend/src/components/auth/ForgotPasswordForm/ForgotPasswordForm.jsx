// Composant Input générique pour le champ email
import Input from "@components/ui/Input/Input";

// Styles CSS spécifiques au formulaire de récupération de mot de passe
import "./ForgotPasswordForm.css";

// Composant formulaire de récupération de mot de passe oublié
// L'utilisateur saisit son email pour recevoir un lien de réinitialisation
function ForgotPasswordForm() {
  return (
    // Formulaire simple sans état contrôlé (fonctionnalité à développer)
    // className="form-card" : style de carte partagé entre les formulaires d'authentification
    <form className="form-card">
      {/* Champ email — type="email" active la validation native HTML5 du navigateur */}
      <Input id="email" label="E-mail" name="email" type="email" />

      {/* Bouton de soumission pour recevoir le lien de réinitialisation par email */}
      <button className="button button--primary" type="submit">Recevoir le lien</button>
    </form>
  );
}

export default ForgotPasswordForm;
