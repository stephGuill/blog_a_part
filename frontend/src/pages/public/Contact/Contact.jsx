// useTranslation : hook i18next pour traduire les labels, titres et textes du formulaire
import { useTranslation } from "react-i18next";

// Coordonnées de contact affichées dans les cartes informatives à gauche du formulaire.
// labelKey : clé de traduction pour l'étiquette ; value : valeur fixe à afficher
const contactItems = [
  { labelKey: "auth.email", value: "bonjour@blogyoo.local" },
  { labelKey: "pages.contact.support", value: "+33 1 84 00 00 00" },
  { labelKey: "pages.contact.address", value: "Paris, France" },
];

// Composant page : page de contact publique.
// Structure : grille en deux colonnes (coordonnées à gauche + formulaire à droite).
// Note : le bouton d'envoi est de type "button" (pas "submit") — la logique d'envoi est à implémenter.
function Contact() {
  // t() : fonction de traduction
  const { t } = useTranslation();

  return (
    <section className="section">
      {/* Grille de contact : coordonnées à gauche, formulaire à droite */}
      <div className="contact-grid">
        <div>
          <div className="eyebrow">{t("nav.contact")}</div>
          <h1 className="page-title">{t("pages.contact.title")}</h1>
          <p className="lead">{t("pages.contact.description")}</p>

          {/* Cartes d'informations de contact : email, téléphone, adresse */}
          <div className="form-grid" style={{ marginTop: 28 }}>
            {contactItems.map((item) => (
              <div className="content-card" key={item.labelKey}>
                <div className="meta-label">{t(item.labelKey)}</div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire de contact : nom, email, sujet, message */}
        <form className="form-card">
          <div className="card-kicker">{t("pages.contact.form")}</div>
          <div className="form-grid" style={{ marginTop: 18 }}>
            {/* Champ nom complet */}
            <div className="field">
              <label htmlFor="name">{t("auth.fullName")}</label>
              <input id="name" name="name" placeholder={t("auth.fullName")} type="text" />
            </div>
            {/* Champ adresse e-mail */}
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" placeholder="vous@example.com" type="email" />
            </div>
            {/* Champ sujet du message */}
            <div className="field">
              <label htmlFor="subject">{t("pages.contact.subject")}</label>
              <input id="subject" name="subject" placeholder={t("pages.contact.subjectPlaceholder")} type="text" />
            </div>
            {/* Zone de texte pour le message */}
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder={t("pages.contact.messagePlaceholder")}
              />
            </div>
            {/* Bouton d'envoi (type="button" — logique d'envoi à connecter) */}
            <button className="button button--primary" type="button">
              {t("pages.contact.send")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

// Export par défaut : composant utilisé par le routeur pour la route "/contact"
export default Contact;
