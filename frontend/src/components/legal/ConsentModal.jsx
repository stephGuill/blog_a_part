import { FileText, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { hasRequiredLegalConsent, saveLegalConsent } from "@utils/legalConsent";

import "./ConsentModal.css";

function ConsentModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setIsVisible(!hasRequiredLegalConsent());
  }, []);

  if (!isVisible) {
    return null;
  }

  const canAccept = acceptedTerms && acceptedPrivacy;

  const handleAccept = () => {
    if (!canAccept) return;

    saveLegalConsent({
      acceptedTerms,
      acceptedPrivacy,
      marketingConsent,
      cookiesConsent: { analytics: marketingConsent, marketing: marketingConsent },
    });
    setIsVisible(false);
  };

  const handleRefuse = () => {
    saveLegalConsent({
      acceptedTerms: false,
      acceptedPrivacy: false,
      marketingConsent: false,
      cookiesConsent: { analytics: false, marketing: false },
    });
    setMessage(
      "Vous pouvez continuer la navigation publique. L'inscription restera indisponible tant que les conditions obligatoires ne sont pas acceptées."
    );
  };

  const closeModal = () => {
    setIsVisible(false);
  };

  return (
    <div className="consent-modal" aria-labelledby="consent-title" aria-modal="true" role="dialog">
      <div className="consent-modal__backdrop" onClick={closeModal} />
      <section className="consent-modal__panel">
        <button className="consent-modal__close" onClick={closeModal} type="button" aria-label="Fermer le modal RGPD">
          <X size={18} />
        </button>

        <div className="consent-modal__icon" aria-hidden="true">
          <ShieldCheck size={24} />
        </div>

        <div className="card-kicker">RGPD & conditions</div>
        <h2 id="consent-title">Avant de rejoindre BlogYoo</h2>
        <p>
          Merci de lire et d'accepter les documents légaux qui encadrent l'utilisation de BlogYoo. Ces textes doivent
          être vérifiés par un professionnel juridique avant une mise en production commerciale.
        </p>

        <div className="consent-modal__links" aria-label="Documents légaux BlogYoo">
          <Link to="/mentions-legales" onClick={closeModal}>
            <FileText size={15} />
            Mentions légales
          </Link>
          <Link to="/conditions-utilisation" onClick={closeModal}>
            <FileText size={15} />
            Conditions d'utilisation
          </Link>
          <Link to="/politique-confidentialite" onClick={closeModal}>
            <FileText size={15} />
            Politique de confidentialité
          </Link>
        </div>

        <div className="consent-modal__checks">
          <label>
            <input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" />
            <span>J'ai lu et j'accepte les Conditions d'utilisation.</span>
          </label>
          <label>
            <input checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} type="checkbox" />
            <span>J'ai lu et j'accepte la Politique de confidentialité.</span>
          </label>
          <label>
            <input checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} type="checkbox" />
            <span>J'accepte les cookies non essentiels et communications produit. Facultatif.</span>
          </label>
        </div>

        {message ? <p className="consent-modal__message">{message}</p> : null}

        <div className="consent-modal__actions">
          <button className="button button--secondary" onClick={handleRefuse} type="button">
            Refuser
          </button>
          <button className="button button--primary" disabled={!canAccept} onClick={handleAccept} type="button">
            Accepter
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConsentModal;
