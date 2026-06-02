import { BookOpenText, Building2, ChevronRight, HelpCircle, Mail, Newspaper, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import "./Footer.css";

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { to: "/blogs", label: t("nav.blogs") },
    { to: "/features", label: t("nav.features") },
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/signup", label: t("nav.signup") },
  ];

  const resourceLinks = [
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
    { to: "/blogs", label: t("footer.resources.examples") },
    { to: "/contact", label: t("footer.resources.support") },
  ];

  const legalLinks = [
    { to: "/mentions-legales", label: t("footer.legal.legalNotice") },
    { to: "/conditions-utilisation", label: t("footer.legal.terms") },
    { to: "/politique-confidentialite", label: t("footer.legal.privacy") },
    { to: "/contact", label: t("footer.legal.security") },
  ];

  const socialLinks = [
    { href: "https://facebook.com", label: t("footer.social.facebook"), mark: "f" },
    { href: "https://x.com", label: t("footer.social.x"), mark: "X" },
    { href: "https://youtube.com", label: t("footer.social.youtube"), mark: "YT" },
    { href: "https://instagram.com", label: t("footer.social.instagram"), mark: "IG" },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <section className="site-footer__hero" aria-label={t("footer.platformEyebrow")}>
          <div className="site-footer__brand-mark" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="card-kicker">{t("footer.platformEyebrow")}</div>
            <h2>{t("footer.platformTitle")}</h2>
            <p>{t("footer.platformText")}</p>
          </div>
          <div className="site-footer__signals" aria-label={t("footer.trust.title")}>
            <span>
              <ShieldCheck size={15} />
              {t("footer.trust.rbac")}
            </span>
            <span>
              <Newspaper size={15} />
              {t("footer.trust.editorial")}
            </span>
            <span>
              <Building2 size={15} />
              {t("footer.trust.saas")}
            </span>
          </div>
        </section>

        <nav className="site-footer__links" aria-label={t("footer.navigation")}>
          <div className="site-footer__column">
            <div className="card-kicker">{t("footer.product")}</div>
            {productLinks.map((item) => (
              <NavLink key={item.to} to={item.to}>
                <ChevronRight size={14} />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="site-footer__column">
            <div className="card-kicker">{t("footer.resources.title")}</div>
            {resourceLinks.map((item) => (
              <NavLink key={`${item.to}-${item.label}`} to={item.to}>
                <ChevronRight size={14} />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="site-footer__column">
            <div className="card-kicker">{t("footer.faq.title")}</div>
            <a href="mailto:bonjour@blogyoo.local">
              <HelpCircle size={14} />
              {t("footer.faq.roles")}
            </a>
            <a href="mailto:bonjour@blogyoo.local">
              <HelpCircle size={14} />
              {t("footer.faq.migration")}
            </a>
            <a href="mailto:bonjour@blogyoo.local">
              <HelpCircle size={14} />
              {t("footer.faq.media")}
            </a>
            <a href="mailto:bonjour@blogyoo.local">
              <HelpCircle size={14} />
              {t("footer.faq.security")}
            </a>
          </div>
        </nav>

        <section className="site-footer__newsletter" aria-label={t("footer.newsletter.title")}>
          <div>
            <div className="card-kicker">{t("footer.newsletter.eyebrow")}</div>
            <h3>{t("footer.newsletter.title")}</h3>
            <p>{t("footer.newsletter.text")}</p>
          </div>

          <form
            className="site-footer__form"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <label className="sr-only" htmlFor="footer-newsletter-email">
              {t("footer.newsletter.emailLabel")}
            </label>
            <div className="site-footer__input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input
                id="footer-newsletter-email"
                name="email"
                placeholder={t("footer.newsletter.placeholder")}
                title={t("footer.newsletter.emailLabel")}
                type="email"
              />
            </div>
            <button className="button button--primary site-footer__submit" title={t("footer.newsletter.submit")} type="submit">
              {t("footer.newsletter.submit")}
            </button>
          </form>
        </section>

        <section className="site-footer__partners" aria-label={t("footer.partners.title")}>
          <span>
            <BookOpenText size={15} />
            {t("footer.partners.title")}
          </span>
          <strong>{t("footer.partners.school")}</strong>
          <strong>{t("footer.partners.creators")}</strong>
          <strong>{t("footer.partners.agencies")}</strong>
        </section>

        <section className="site-footer__social" aria-label={t("footer.social.title")}>
          <div>
            <div className="card-kicker">{t("footer.social.eyebrow")}</div>
            <p>{t("footer.social.text")}</p>
          </div>
          <div className="site-footer__social-links">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} rel="noreferrer" target="_blank" title={item.label} aria-label={item.label}>
                <span aria-hidden="true">{item.mark}</span>
              </a>
            ))}
          </div>
        </section>

        <div className="site-footer__bottom">
          <span>{t("footer.copyright", { year: currentYear })}</span>
          <div>
            {legalLinks.map((item) => (
              <NavLink key={item.label} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
