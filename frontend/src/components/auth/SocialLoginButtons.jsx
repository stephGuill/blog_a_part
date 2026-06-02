import { Apple } from "lucide-react";

import { hasRequiredLegalConsent } from "@utils/legalConsent";

import "./SocialLoginButtons.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const apiBaseUrl = import.meta.env.VITE_API_URL || `${backendUrl.replace(/\/$/, "")}/api`;
const legalTermsVersion = "2026-05-25";
const privacyPolicyVersion = "2026-05-25";

function buildOAuthUrl(provider) {
  const url = new URL(`${apiBaseUrl}/auth/${provider}`);

  if (hasRequiredLegalConsent()) {
    url.searchParams.set("legalAccepted", "true");
    url.searchParams.set("termsVersion", legalTermsVersion);
    url.searchParams.set("privacyVersion", privacyPolicyVersion);
  }

  return url.toString();
}

function SocialLoginButtons() {
  return (
    <div className="social-login" aria-label="Connexion sociale">
      <a href={buildOAuthUrl("google")} title="Continuer avec Google">
        <span className="social-login__google">G</span>
        Google
      </a>
      <a href={buildOAuthUrl("facebook")} title="Continuer avec Facebook">
        <span className="social-login__facebook">f</span>
        Facebook
      </a>
      <a href={buildOAuthUrl("apple")} title="Continuer avec Apple">
        <Apple size={17} />
        Apple
      </a>
    </div>
  );
}

export default SocialLoginButtons;
