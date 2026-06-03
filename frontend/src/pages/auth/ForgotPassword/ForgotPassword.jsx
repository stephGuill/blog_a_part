// Importation du composant formulaire dédié à la réinitialisation de mot de passe
// Ce composant contient les champs et la logique d'envoi du lien de récupération
import ForgotPasswordForm from "@components/auth/ForgotPasswordForm/ForgotPasswordForm";

// Importation du fichier CSS propre à cette page
import "./ForgotPassword.css";

// Composant page : affiche la section "Mot de passe oublié"
// Il délègue entièrement la logique au composant ForgotPasswordForm
function ForgotPassword() {
  return (
    // Conteneur section principal de la page d'authentification
    <section className="section">
      {/* Bandeau de catégorie affiché au-dessus du titre principal */}
      <div className="eyebrow">Mot de passe oublie</div>
      {/* Titre principal invitant l'utilisateur à recevoir un lien par e-mail */}
      <h1 className="page-title">Recevoir un lien de recuperation.</h1>
      {/* Formulaire : champ e-mail + bouton de soumission + gestion des retours API */}
      <ForgotPasswordForm />
    </section>
  );
}

// Export par défaut pour l'utilisation dans le routeur React
export default ForgotPassword;
