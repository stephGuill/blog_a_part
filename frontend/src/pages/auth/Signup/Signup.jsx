// Importation du composant formulaire d'inscription
// SignupForm gère tous les champs de création de compte et la validation côté client
import SignupForm from "@components/auth/SignupForm/SignupForm";

// Importation du fichier CSS propre à cette page d'inscription
import "./Signup.css";

// Composant page : affiche la section d'inscription / création de compte
// La logique complète du formulaire est déléguée à SignupForm
function Signup() {
  return (
    // Conteneur section principal de la page
    <section className="section">
      {/* Bandeau de catégorie affiché au-dessus du titre */}
      <div className="eyebrow">Inscription</div>
      {/* Titre principal invitant l'utilisateur à créer son compte */}
      <h1 className="page-title">Creer un compte BlogYoo.</h1>
      {/* Formulaire d'inscription : username, email, mot de passe, conditions d'utilisation */}
      <SignupForm />
    </section>
  );
}

// Export par défaut pour le routeur React
export default Signup;
