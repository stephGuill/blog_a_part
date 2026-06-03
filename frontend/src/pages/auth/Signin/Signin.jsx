// Importation du composant formulaire de connexion
// SigninForm gère les champs email/mot de passe, la soumission et les erreurs d'authentification
import SigninForm from "@components/auth/SigninForm/SigninForm";

// Importation du fichier CSS propre à cette page de connexion
import "./Signin.css";

// Composant page : affiche la section de connexion utilisateur
// Toute la logique métier est encapsulée dans SigninForm
function Signin() {
  return (
    // Conteneur section principal de la page
    <section className="section">
      {/* Bandeau de catégorie affiché au-dessus du titre */}
      <div className="eyebrow">Connexion</div>
      {/* Titre principal invitant l'utilisateur à accéder à son espace */}
      <h1 className="page-title">Acceder a votre espace.</h1>
      {/* Formulaire de connexion : email, mot de passe, bouton submit et lien mot de passe oublié */}
      <SigninForm />
    </section>
  );
}

// Export par défaut pour le routeur React
export default Signin;
