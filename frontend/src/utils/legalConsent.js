// utils/legalConsent.js
// ============================================================
// Gestion du consentement légal dans le localStorage.
// Stocke et vérifie l'acceptation des CGU, de la politique de
// confidentialité, des préférences marketing et cookies.
//
// Utilisé dans :
//   - La page d'inscription (Signup) pour pré-remplir les cases
//   - authService.signup pour envoyer les consentements à l'API
//   - Les gardiens de route légaux pour bloquer l'accès si non-consenti
// ============================================================

// Version actuellement en vigueur des Conditions Générales d'Utilisation.
// Si l'utilisateur a accepté une version antérieure, hasRequiredLegalConsent() retournera false.
export const LEGAL_TERMS_VERSION = "2026-05-25";

// Version actuellement en vigueur de la Politique de Confidentialité.
export const PRIVACY_POLICY_VERSION = "2026-05-25";

// Clé sous laquelle l'objet de consentement est sérialisé en JSON dans localStorage.
export const LEGAL_CONSENT_STORAGE_KEY = "blogyoo_legal_consent";

// getLegalConsent() : lit et désérialise l'objet de consentement depuis localStorage.
// Retourne null si aucun consentement n'a été enregistré ou si la donnée est corrompue.
export function getLegalConsent() {
  try {
    const rawConsent = window.localStorage.getItem(LEGAL_CONSENT_STORAGE_KEY);
    return rawConsent ? JSON.parse(rawConsent) : null;
  } catch {
    // JSON.parse peut lever une SyntaxError si la donnée est corrompue → retourne null
    return null;
  }
}

// saveLegalConsent(options) : construit et persiste l'objet de consentement complet.
//   acceptedTerms     : booléen — l'utilisateur a-t-il accepté les CGU ?
//   acceptedPrivacy   : booléen — l'utilisateur a-t-il accepté la politique de confidentialité ?
//   marketingConsent  : booléen (optionnel, false par défaut) — acceptation des communications marketing
//   cookiesConsent    : objet (optionnel) avec analytics et marketing (false par défaut)
// Retourne l'objet de consentement construit (utile pour buildSignupConsentPayload).
export function saveLegalConsent({ acceptedTerms, acceptedPrivacy, marketingConsent = false, cookiesConsent = {} }) {
  // Horodatage ISO 8601 du moment de l'acceptation (envoyé à l'API et stocké localement)
  const now = new Date().toISOString();
  const consent = {
    accepted_terms: Boolean(acceptedTerms),
    accepted_terms_at: acceptedTerms ? now : null,            // Date d'acceptation CGU (null si refusé)
    accepted_terms_version: LEGAL_TERMS_VERSION,              // Version des CGU acceptée
    accepted_privacy: Boolean(acceptedPrivacy),
    accepted_privacy_at: acceptedPrivacy ? now : null,        // Date d'acceptation politique confidentialité
    accepted_privacy_version: PRIVACY_POLICY_VERSION,         // Version de la politique acceptée
    marketing_consent: Boolean(marketingConsent),
    cookies_consent: {
      essential: true,                                        // Cookies essentiels toujours obligatoires
      analytics: Boolean(cookiesConsent.analytics),           // Cookies d'analyse (optionnel)
      marketing: Boolean(cookiesConsent.marketing),           // Cookies marketing (optionnel)
    },
    // Statut global : "accepted" seulement si les deux consentements obligatoires sont cochés
    status: acceptedTerms && acceptedPrivacy ? "accepted" : "rejected",
    saved_at: now, // Date de sauvegarde locale (peut différer de accepted_terms_at si re-sauvegarde)
  };

  // Sérialisation et persistance dans localStorage
  window.localStorage.setItem(LEGAL_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  return consent;
}

// hasRequiredLegalConsent() : vérifie si l'utilisateur a accepté les versions actuelles
// des deux documents légaux obligatoires (CGU + politique de confidentialité).
// Retourne false si : aucun consentement, consentement partiel, ou version obsolète.
// Utilisé pour conditionner l'affichage du formulaire d'inscription ou bloquer certains accès.
export function hasRequiredLegalConsent() {
  const consent = getLegalConsent();

  return Boolean(
    consent?.accepted_terms &&
      consent?.accepted_privacy &&
      // Vérifie que les versions acceptées correspondent aux versions actuellement en vigueur
      consent?.accepted_terms_version === LEGAL_TERMS_VERSION &&
      consent?.accepted_privacy_version === PRIVACY_POLICY_VERSION
  );
}

// buildSignupConsentPayload() : construit la partie "consentement légal" du payload
// envoyé à l'API lors de l'inscription (POST /auth/register).
// Extrait les données de consentement stockées localement et les formate pour le backend.
// Appelé par authService.signup() juste avant l'envoi de la requête d'inscription.
export function buildSignupConsentPayload() {
  const consent = getLegalConsent();

  return {
    accepted_terms: Boolean(consent?.accepted_terms),
    accepted_terms_version: consent?.accepted_terms_version || LEGAL_TERMS_VERSION,
    accepted_privacy: Boolean(consent?.accepted_privacy),
    accepted_privacy_version: consent?.accepted_privacy_version || PRIVACY_POLICY_VERSION,
    marketing_consent: Boolean(consent?.marketing_consent),
    // Fallback sur les valeurs par défaut si l'objet cookies_consent est absent
    cookies_consent: consent?.cookies_consent || { essential: true, analytics: false, marketing: false },
  };
}
