/* Imports d'icônes depuis Lucide React pour le pied de page.
   - BookOpenText  : icône livre pour la section partenaires (école, créateurs).
   - Building2     : icône immeuble pour le label "SaaS multi-tenant".
   - ChevronRight  : icône flèche pour les liens de navigation.
   - HelpCircle    : icône point d'interrogation pour la FAQ.
   - Mail          : icône enveloppe pour le champ email de la newsletter.
   - Newspaper     : icône journal pour le label "contenu éditorial".
   - ShieldCheck   : icône bouclier pour le label "RBAC sécurisé".
   - Sparkles      : icône étincelles pour le logo de la marque dans le footer.  */
import { BookOpenText, Building2, ChevronRight, HelpCircle, Mail, Newspaper, ShieldCheck, Sparkles } from "lucide-react";

/* useTranslation : hook react-i18next pour accéder à la fonction t() de traduction.
   Seule `t` est utilisée ici (pas besoin de `i18n` pour le footer). */
import { useTranslation } from "react-i18next";

/* NavLink : lien React Router avec détection de route active (non utilisée ici mais
   disponible pour d'éventuels styles conditionnels). */
import { NavLink } from "react-router-dom";

/* Import du fichier CSS propre au Footer. */
import "./Footer.css";

/* Composant Footer : pied de page du site, affiché sur toutes les pages publiques (via PublicLayout).
   Il contient : hero de présentation, liens de navigation, FAQ, newsletter, partenaires, réseaux sociaux et bas de page. */
function Footer() {
  /* Destructuration : on extrait uniquement `t` depuis useTranslation (la fonction de traduction). */
  const { t } = useTranslation();

  /* Année courante calculée dynamiquement avec l'API JavaScript Date.
     getFullYear() → retourne l'année en cours (ex: 2025).
     Utilisé dans le copyright pour éviter de mettre l'année en dur. */
  const currentYear = new Date().getFullYear();

  /* Tableau des liens "Produit" : défini à l'intérieur du composant pour bénéficier de t() traduit.
     Chaque objet a `to` (chemin React Router) et `label` (texte traduit par t()). */
  const productLinks = [
    { to: "/blogs", label: t("nav.blogs") },
    { to: "/features", label: t("nav.features") },
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/signup", label: t("nav.signup") },
  ];

  /* Tableau des liens "Ressources" : à propos, contact, exemples, support. */
  const resourceLinks = [
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
    { to: "/blogs", label: t("footer.resources.examples") },
    { to: "/contact", label: t("footer.resources.support") },
  ];

  /* Tableau des liens légaux : mentions légales, CGU, politique de confidentialité, sécurité. */
  const legalLinks = [
    { to: "/mentions-legales", label: t("footer.legal.legalNotice") },
    { to: "/conditions-utilisation", label: t("footer.legal.terms") },
    { to: "/politique-confidentialite", label: t("footer.legal.privacy") },
    { to: "/contact", label: t("footer.legal.security") },
  ];

  /* Tableau des liens réseaux sociaux.
     `href` : URL externe (ouverte dans un nouvel onglet via target="_blank").
     `mark` : abréviation textuelle affichée dans le bouton circulaire (ex: "f", "X", "YT"). */
  const socialLinks = [
    { href: "https://facebook.com", label: t("footer.social.facebook"), mark: "f" },
    { href: "https://x.com", label: t("footer.social.x"), mark: "X" },
    { href: "https://youtube.com", label: t("footer.social.youtube"), mark: "YT" },
    { href: "https://instagram.com", label: t("footer.social.instagram"), mark: "IG" },
  ];

  return (
    /* Balise HTML sémantique <footer> : zone de pied de page du document.
       La classe "site-footer" applique le fond sombre et les dégradés définis en CSS. */
    <footer className="site-footer">

      {/* Conteneur interne avec grille CSS qui empile toutes les sections verticalement. */}
      <div className="site-footer__inner">

        {/* ===== SECTION HERO ===== */}
        {/* Section de présentation de la plateforme : logo, titre, description, badges de confiance.
            aria-label : décrit la section pour les lecteurs d'écran. */}
        <section className="site-footer__hero" aria-label={t("footer.platformEyebrow")}>

          {/* Icône décorative de la marque (Sparkles) dans un carré arrondi.
              aria-hidden="true" → masquée aux lecteurs d'écran (décorative seulement). */}
          <div className="site-footer__brand-mark" aria-hidden="true">
            <Sparkles size={22} />
          </div>

          <div>
            {/* card-kicker : petit label de catégorie au-dessus du titre (ex: "PLATEFORME BLOG"). */}
            <div className="card-kicker">{t("footer.platformEyebrow")}</div>
            {/* Titre principal du footer. */}
            <h2>{t("footer.platformTitle")}</h2>
            {/* Description courte de la plateforme. */}
            <p>{t("footer.platformText")}</p>
          </div>

          {/* Badges de confiance : RBAC, éditorial, SaaS.
              Affichés avec des icônes pour renforcer la crédibilité visuelle. */}
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

        {/* ===== SECTION NAVIGATION LIENS ===== */}
        {/* Grille de 3 colonnes de liens : Produit, Ressources, FAQ.
            Balise <nav> sémantique pour la navigation dans le footer. */}
        <nav className="site-footer__links" aria-label={t("footer.navigation")}>

          {/* Colonne "Produit" : liste des fonctionnalités et pages clés. */}
          <div className="site-footer__column">
            <div className="card-kicker">{t("footer.product")}</div>
            {/* Boucle sur productLinks : génère un NavLink par élément.
                key={item.to} → identifiant unique React. */}
            {productLinks.map((item) => (
              <NavLink key={item.to} to={item.to}>
                <ChevronRight size={14} />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Colonne "Ressources" : à propos, contact, exemples, support.
              key composite `${item.to}-${item.label}` → évite les doublons de clé
              car /contact apparaît deux fois dans ce tableau (avec labels différents). */}
          <div className="site-footer__column">
            <div className="card-kicker">{t("footer.resources.title")}</div>
            {resourceLinks.map((item) => (
              <NavLink key={`${item.to}-${item.label}`} to={item.to}>
                <ChevronRight size={14} />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Colonne "FAQ" : questions fréquentes avec liens mailto.
              Les liens utilisent <a href="mailto:..."> (pas NavLink) pour ouvrir le client mail. */}
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

        {/* ===== SECTION NEWSLETTER ===== */}
        {/* Formulaire d'inscription à la newsletter. */}
        <section className="site-footer__newsletter" aria-label={t("footer.newsletter.title")}>
          <div>
            <div className="card-kicker">{t("footer.newsletter.eyebrow")}</div>
            <h3>{t("footer.newsletter.title")}</h3>
            <p>{t("footer.newsletter.text")}</p>
          </div>

          {/* Formulaire de newsletter.
              onSubmit avec event.preventDefault() → empêche le rechargement de page
              lors de la soumission (comportement HTML natif des formulaires).
              La logique d'envoi serait ajoutée ici (fetch API, etc.). */}
          <form
            className="site-footer__form"
            onSubmit={(event) => {
              event.preventDefault(); /* Empêche la soumission HTML native (rechargement de page). */
            }}
          >
            {/* Label visuellement caché (sr-only = screen reader only) mais lu par les lecteurs d'écran.
                htmlFor="footer-newsletter-email" lie le label à l'input via son id (accessibilité). */}
            <label className="sr-only" htmlFor="footer-newsletter-email">
              {t("footer.newsletter.emailLabel")}
            </label>

            {/* Champ email avec icône Mail à gauche. */}
            <div className="site-footer__input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input
                id="footer-newsletter-email"     /* id lié au htmlFor du label (accessibilité). */
                name="email"
                placeholder={t("footer.newsletter.placeholder")}
                title={t("footer.newsletter.emailLabel")}
                type="email"                     /* Validation HTML native du format email. */
              />
            </div>

            {/* Bouton de soumission avec style "button--primary" (classe globale). */}
            <button className="button button--primary site-footer__submit" title={t("footer.newsletter.submit")} type="submit">
              {t("footer.newsletter.submit")}
            </button>
          </form>
        </section>

        {/* ===== SECTION PARTENAIRES ===== */}
        {/* Badges "Fait pour : écoles, créateurs, agences". */}
        <section className="site-footer__partners" aria-label={t("footer.partners.title")}>
          <span>
            <BookOpenText size={15} />
            {t("footer.partners.title")}
          </span>
          <strong>{t("footer.partners.school")}</strong>
          <strong>{t("footer.partners.creators")}</strong>
          <strong>{t("footer.partners.agencies")}</strong>
        </section>

        {/* ===== SECTION RÉSEAUX SOCIAUX ===== */}
        <section className="site-footer__social" aria-label={t("footer.social.title")}>
          <div>
            <div className="card-kicker">{t("footer.social.eyebrow")}</div>
            <p>{t("footer.social.text")}</p>
          </div>

          {/* Liste des icônes réseaux sociaux.
              rel="noreferrer" : sécurité — empêche la page cible d'accéder à window.opener.
              target="_blank"  : ouvre le lien dans un nouvel onglet.
              aria-hidden="true" sur le <span> → le texte de l'icône (ex: "f") est décoratif,
              l'aria-label sur le <a> suffit pour l'accessibilité. */}
          <div className="site-footer__social-links">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} rel="noreferrer" target="_blank" title={item.label} aria-label={item.label}>
                <span aria-hidden="true">{item.mark}</span>
              </a>
            ))}
          </div>
        </section>

        {/* ===== BAS DE PAGE : COPYRIGHT + LIENS LÉGAUX ===== */}
        <div className="site-footer__bottom">
          {/* Copyright avec l'année courante injectée via i18n interpolation.
              t("footer.copyright", { year: currentYear }) → "© 2025 BlogYoo. Tous droits réservés." */}
          <span>{t("footer.copyright", { year: currentYear })}</span>

          {/* Liens légaux en ligne (mentions légales, CGU, politique de confidentialité, sécurité). */}
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

/* Export par défaut pour utilisation dans PublicLayout. */
export default Footer;
