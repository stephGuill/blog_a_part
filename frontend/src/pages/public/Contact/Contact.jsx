import { useTranslation } from "react-i18next";

const contactItems = [
  { labelKey: "auth.email", value: "bonjour@blogyoo.local" },
  { labelKey: "pages.contact.support", value: "+33 1 84 00 00 00" },
  { labelKey: "pages.contact.address", value: "Paris, France" },
];

function Contact() {
  const { t } = useTranslation();

  return (
    <section className="section">
      <div className="contact-grid">
        <div>
          <div className="eyebrow">{t("nav.contact")}</div>
          <h1 className="page-title">{t("pages.contact.title")}</h1>
          <p className="lead">{t("pages.contact.description")}</p>

          <div className="form-grid" style={{ marginTop: 28 }}>
            {contactItems.map((item) => (
              <div className="content-card" key={item.labelKey}>
                <div className="meta-label">{t(item.labelKey)}</div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <form className="form-card">
          <div className="card-kicker">{t("pages.contact.form")}</div>
          <div className="form-grid" style={{ marginTop: 18 }}>
            <div className="field">
              <label htmlFor="name">{t("auth.fullName")}</label>
              <input id="name" name="name" placeholder={t("auth.fullName")} type="text" />
            </div>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" placeholder="vous@example.com" type="email" />
            </div>
            <div className="field">
              <label htmlFor="subject">{t("pages.contact.subject")}</label>
              <input id="subject" name="subject" placeholder={t("pages.contact.subjectPlaceholder")} type="text" />
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder={t("pages.contact.messagePlaceholder")}
              />
            </div>
            <button className="button button--primary" type="button">
              {t("pages.contact.send")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Contact;
