export const LEGAL_TERMS_VERSION = "2026-05-25";
export const PRIVACY_POLICY_VERSION = "2026-05-25";
export const LEGAL_CONSENT_STORAGE_KEY = "blogyoo_legal_consent";

export function getLegalConsent() {
  try {
    const rawConsent = window.localStorage.getItem(LEGAL_CONSENT_STORAGE_KEY);
    return rawConsent ? JSON.parse(rawConsent) : null;
  } catch {
    return null;
  }
}

export function saveLegalConsent({ acceptedTerms, acceptedPrivacy, marketingConsent = false, cookiesConsent = {} }) {
  const now = new Date().toISOString();
  const consent = {
    accepted_terms: Boolean(acceptedTerms),
    accepted_terms_at: acceptedTerms ? now : null,
    accepted_terms_version: LEGAL_TERMS_VERSION,
    accepted_privacy: Boolean(acceptedPrivacy),
    accepted_privacy_at: acceptedPrivacy ? now : null,
    accepted_privacy_version: PRIVACY_POLICY_VERSION,
    marketing_consent: Boolean(marketingConsent),
    cookies_consent: {
      essential: true,
      analytics: Boolean(cookiesConsent.analytics),
      marketing: Boolean(cookiesConsent.marketing),
    },
    status: acceptedTerms && acceptedPrivacy ? "accepted" : "rejected",
    saved_at: now,
  };

  window.localStorage.setItem(LEGAL_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  return consent;
}

export function hasRequiredLegalConsent() {
  const consent = getLegalConsent();

  return Boolean(
    consent?.accepted_terms &&
      consent?.accepted_privacy &&
      consent?.accepted_terms_version === LEGAL_TERMS_VERSION &&
      consent?.accepted_privacy_version === PRIVACY_POLICY_VERSION
  );
}

export function buildSignupConsentPayload() {
  const consent = getLegalConsent();

  return {
    accepted_terms: Boolean(consent?.accepted_terms),
    accepted_terms_version: consent?.accepted_terms_version || LEGAL_TERMS_VERSION,
    accepted_privacy: Boolean(consent?.accepted_privacy),
    accepted_privacy_version: consent?.accepted_privacy_version || PRIVACY_POLICY_VERSION,
    marketing_consent: Boolean(consent?.marketing_consent),
    cookies_consent: consent?.cookies_consent || { essential: true, analytics: false, marketing: false },
  };
}
