// Apple : icône du logo Apple (bibliothèque lucide-react)
import { Apple } from "lucide-react";

// Utilitaire pour vérifier si l'utilisateur a accepté les consentements légaux requis
import { hasRequiredLegalConsent } from "@utils/legalConsent";

// Styles CSS spécifiques aux boutons de connexion sociale
import "./SocialLoginButtons.css";

// Lecture des variables d'environnement Vite pour construire les URLs backend
// VITE_BACKEND_URL : URL de base du backend (ex: "http://localhost:5000")
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Construction de l'URL de base de l'API en supprimant le slash final éventuel
const apiBaseUrl = import.meta.env.VITE_API_URL || `${backendUrl.replace(/\/$/, "")}/api`;

// Version des CGU acceptées par l'utilisateur (date ISO)
const legalTermsVersion = "2026-05-25";

// Version de la politique de confidentialité acceptée (date ISO)
const privacyPolicyVersion = "2026-05-25";

// Construit l'URL OAuth pour un fournisseur donné (google, facebook ou apple)
// Ajoute les paramètres de consentement légal si l'utilisateur les a déjà acceptés
function buildOAuthUrl(provider) {
  // Construit l'URL de redirection vers le backend pour l'authentification OAuth
  const url = new URL(`${apiBaseUrl}/auth/${provider}`);

  // Si l'utilisateur a déjà accepté les conditions légales, on les inclut dans l'URL
  // Le backend les enregistrera lors du callback OAuth sans demander une nouvelle acceptation
  if (hasRequiredLegalConsent()) {
    url.searchParams.set("legalAccepted", "true");        // Indicateur d'acceptation
    url.searchParams.set("termsVersion", legalTermsVersion);      // Version des CGU acceptées
    url.searchParams.set("privacyVersion", privacyPolicyVersion); // Version de la politique acceptée
  }

  // Retourne l'URL complète sous forme de chaîne de caractères
  return url.toString();
}

// Composant affichant les boutons de connexion sociale (Google, Facebook, Apple)
// Chaque lien redirige directement vers le backend qui lance le flux OAuth
function SocialLoginButtons() {
  return (
    // Conteneur des boutons de connexion sociale
    // aria-label : améliore l'accessibilité pour les lecteurs d'écran
    <div className="social-login" aria-label="Connexion sociale">
      {/* Lien vers l'authentification Google — redirection directe vers le backend */}
      <a href={buildOAuthUrl("google")} title="Continuer avec Google">
        {/* Badge "G" stylisé avec les couleurs de Google */}
        <span className="social-login__google">G</span>
        Google
      </a>

      {/* Lien vers l'authentification Facebook */}
      <a href={buildOAuthUrl("facebook")} title="Continuer avec Facebook">
        {/* Badge "f" stylisé avec les couleurs de Facebook */}
        <span className="social-login__facebook">f</span>
        Facebook
      </a>

      {/* Lien vers l'authentification Apple */}
      <a href={buildOAuthUrl("apple")} title="Continuer avec Apple">
        {/* Icône Apple de la bibliothèque lucide-react */}
        <Apple size={17} />
        Apple
      </a>
    </div>
  );
}

export default SocialLoginButtons;
