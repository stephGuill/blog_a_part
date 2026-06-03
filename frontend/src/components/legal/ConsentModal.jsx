// Icônes lucide-react pour la modale RGPD
// FileText   : icône document pour les liens vers les pages légales
// ShieldCheck : icône bouclier pour symboliser la protection des données
// X          : icône croix pour le bouton de fermeture
import { FileText, ShieldCheck, X } from "lucide-react";
// useEffect : vérifie au montage si le consentement légal est déjà enregistré
// useState  : gère l'état local des cases à cocher et de la visibilité
import { useEffect, useState } from "react";
// Link : navigation interne vers les pages légales sans rechargement
import { Link } from "react-router-dom";

// hasRequiredLegalConsent : retourne true si l'utilisateur a déjà accepté les versions actuelles
// saveLegalConsent : persiste les choix de consentement dans le localStorage
import { hasRequiredLegalConsent, saveLegalConsent } from "@utils/legalConsent";

// Styles CSS de la modale de consentement (backdrop, panneau, cases à cocher)
import "./ConsentModal.css";

// Composant ConsentModal : modale RGPD affichée automatiquement lors de la première visite
// ou quand le consentement enregistré est absent/obsolète.
//
// Comportement :
//   - Au montage : vérifie si un consentement valide existe via hasRequiredLegalConsent()
//   - Si non : affiche la modale avec les cases à cocher obligatoires (CGU + confidentialité)
//   - handleAccept : sauvegarde le consentement et ferme la modale
//   - handleRefuse : sauvegarde un consentement refusé et affiche un message explicatif
function ConsentModal() {
  // isVisible : true si la modale doit être affichée (consentement manquant ou obsolète)
  const [isVisible, setIsVisible] = useState(false);
  // acceptedTerms : true si l'utilisateur a coché la case CGU (obligatoire)
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // acceptedPrivacy : true si l'utilisateur a coché la case politique de confidentialité (obligatoire)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  // marketingConsent : true si l'utilisateur accepte les communications marketing (optionnel)
  const [marketingConsent, setMarketingConsent] = useState(false);
  // message : texte affiché après un refus pour informer l'utilisateur
  const [message, setMessage] = useState("");

  // Vérification du consentement au montage : si absent ou obsolète, affiche la modale
  useEffect(() => {
    setIsVisible(!hasRequiredLegalConsent());
  }, []); // Tableau vide : exécuté une seule fois au montage

  // Rendu conditionnel : ne rend rien si la modale est masquée
  if (!isVisible) {
    return null;
  }

  // canAccept : vrai seulement si les deux cases obligatoires sont cochées
  const canAccept = acceptedTerms && acceptedPrivacy;

  // handleAccept : sauvegarde le consentement complet et ferme la modale
  const handleAccept = () => {
    if (!canAccept) return; // Sécurité : ne pas accepter si les cases obligatoires ne sont pas cochées

    saveLegalConsent({
      acceptedTerms,
      acceptedPrivacy,
      marketingConsent,
      // Les cookies analytics et marketing suivent le choix du consentement marketing
      cookiesConsent: { analytics: marketingConsent, marketing: marketingConsent },
    });
    setIsVisible(false);
  };

  // handleRefuse : sauvegarde un refus et affiche un message explicatif
  // L'utilisateur peut toujours naviguer en mode public mais ne peut pas s'inscrire
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

  // closeModal : ferme la modale sans sauvegarder (l'utilisateur peut revisiter la modale plus tard)
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
