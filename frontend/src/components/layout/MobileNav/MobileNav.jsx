/* useTranslation : hook react-i18next pour accéder à la fonction t() de traduction.
   Permet d'afficher les labels de navigation dans la langue active. */
import { useTranslation } from "react-i18next";

/* NavLink : composant React Router qui génère un lien avec détection de route active.
   Quand la route correspond, React Router passe isActive=true, permettant d'appliquer
   un style CSS différent pour le lien courant (classe "active" automatique). */
import { NavLink } from "react-router-dom";

/* Import du CSS propre à la navigation mobile. */
import "./MobileNav.css";

/* Composant MobileNav : barre de navigation simplifiée pour les petits écrans.
   Affiche uniquement les liens essentiels (accueil, blogs, contact).
   Ce composant est distinct du Header pour être utilisé indépendamment si besoin. */
function MobileNav() {
  /* Destructuration : extrait uniquement `t` (fonction de traduction) depuis le hook. */
  const { t } = useTranslation();

  return (
    /* Balise HTML sémantique <nav> : zone de navigation.
       La classe "mobile-nav" applique le layout flexbox défini en CSS. */
    <nav className="mobile-nav">
      {/* NavLink vers la page d'accueil.
          t("nav.home") → traduit selon la langue active (ex: "Accueil", "Home", "Inicio"). */}
      <NavLink to="/">{t("nav.home")}</NavLink>

      {/* NavLink vers la liste des blogs publics. */}
      <NavLink to="/blogs">{t("nav.blogs")}</NavLink>

      {/* NavLink vers la page de contact. */}
      <NavLink to="/contact">{t("nav.contact")}</NavLink>
    </nav>
  );
}

/* Export par défaut du composant pour l'importer là où une nav mobile est nécessaire. */
export default MobileNav;
