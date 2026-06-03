/* Imports d'icônes depuis la bibliothèque Lucide React.
   Chaque icône est un composant React SVG optimisé.
   - Globe2        : icône globe pour le sélecteur de langue.
   - LayoutDashboard: icône tableau de bord pour le lien vers le dashboard.
   - LogIn / LogOut : icônes de connexion / déconnexion.
   - Menu / X      : icône hamburger (ouvrir) et croix (fermer) pour le menu mobile.
   - Moon / Sun    : icônes pour le basculement de thème sombre/clair.
   - UserCircle    : icône utilisateur dans le menu mobile.
   - UserPlus      : icône d'inscription (créer un compte). */
import {
  Globe2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserCircle,
  UserPlus,
  X,
} from "lucide-react";

/* useEffect : hook React qui exécute un effet de bord après chaque rendu.
   Ici il synchronise le localStorage, i18n, lang et dir du document avec l'état language.
   useState  : hook React pour déclarer des variables d'état locales dans un composant fonctionnel. */
import { useEffect, useState } from "react";

/* useTranslation : hook de la bibliothèque react-i18next.
   Retourne :
   - t       : fonction de traduction. Ex: t("nav.home") → "Accueil" (selon la langue active).
   - i18n    : instance i18next pour changer la langue (i18n.changeLanguage("fr")). */
import { useTranslation } from "react-i18next";

/* NavLink    : composant React Router qui génère un lien <a> avec une prop "isActive" automatique.
               Quand le lien correspond à la route courante, isActive vaut true → permet d'appliquer
               une classe CSS "active" pour surligner le lien actif dans la navigation.
   useNavigate : hook React Router qui retourne une fonction navigate() pour rediriger l'utilisateur
               par code (ex: après une déconnexion, rediriger vers "/"). */
import { NavLink, useNavigate } from "react-router-dom";

/* Composant Avatar : affiche l'image de profil de l'utilisateur ou ses initiales si pas d'image. */
import Avatar from "@components/ui/Avatar/Avatar";

/* useAuth : hook personnalisé qui expose l'état d'authentification.
   Retourne : isAuthenticated (boolean), logout (fonction), user (objet avec les données de l'utilisateur). */
import { useAuth } from "@hooks/useAuth";

/* useTheme : hook personnalisé qui expose le thème actif et la fonction pour le changer.
   Retourne : theme ("light" | "dark"), toggleTheme (fonction pour basculer entre les deux). */
import { useTheme } from "@hooks/useTheme";

/* getRedirectPathByRole : utilitaire qui retourne le chemin dashboard approprié selon le rôle.
   Ex: rôle "editor" → "/editor", rôle "owner" → "/owner", etc. */
import { getRedirectPathByRole } from "@utils/roleRedirect";

/* Import du fichier CSS spécifique au Header. */
import "./Header.css";

/* Tableau statique des liens de navigation principale.
   Chaque objet contient :
   - labelKey : clé de traduction i18n (ex: "nav.home" → traduit en "Accueil" / "Home" / etc.)
   - to       : chemin de la route React Router vers laquelle le lien pointe. */
const navItems = [
  { labelKey: "nav.home", to: "/" },
  { labelKey: "nav.blogs", to: "/blogs" },
  { labelKey: "nav.about", to: "/about" },
  { labelKey: "nav.contact", to: "/contact" },
];

/* Tableau statique des options de langue disponibles.
   Chaque objet contient :
   - code     : code ISO de la langue utilisé par i18next (ex: "fr", "en").
   - flag     : emoji drapeau affiché dans le <select>.
   - short    : abréviation affichée à côté du drapeau (ex: "FR", "EN").
   - labelKey : clé i18n pour le nom complet de la langue (pour l'accessibilité). */
const languageOptions = [
  { code: "fr", flag: "🇫🇷", short: "FR", labelKey: "languages.fr" },
  { code: "en", flag: "🇬🇧", short: "EN", labelKey: "languages.en" },
  { code: "ar", flag: "🇸🇦", short: "AR", labelKey: "languages.ar" },
  { code: "es", flag: "🇪🇸", short: "ES", labelKey: "languages.es" },
];

/* Composant Header : en-tête principal du site, présent sur toutes les pages publiques.
   Gère : navigation desktop, navigation mobile (drawer), sélecteur de langue,
          basculement de thème, et les boutons connexion/déconnexion. */
function Header() {
  /* Destructuration du hook useTranslation :
     - i18n : instance i18next (pour changer la langue active).
     - t    : fonction de traduction qui prend une clé et retourne le texte traduit. */
  const { i18n, t } = useTranslation();

  /* navigate : fonction de React Router pour rediriger l'utilisateur vers une route. */
  const navigate = useNavigate();

  /* Destructuration du hook useAuth :
     - isAuthenticated : true si l'utilisateur est connecté.
     - logout          : fonction qui efface le token et met à jour l'état d'auth.
     - user            : objet contenant les données de l'utilisateur connecté. */
  const { isAuthenticated, logout, user } = useAuth();

  /* Destructuration du hook useTheme :
     - theme       : chaîne "light" ou "dark".
     - toggleTheme : fonction qui bascule entre les deux thèmes. */
  const { theme, toggleTheme } = useTheme();

  /* État de la langue courante.
     Initialisation "lazy" via une fonction fléchée () => ... pour n'exécuter le calcul qu'une fois.
     Ordre de priorité : 1) localStorage, 2) langue i18n active, 3) français par défaut. */
  const [language, setLanguage] = useState(
    () => window.localStorage.getItem("blogyoo_language") || i18n.language || "fr"
  );

  /* État booléen isMenuOpen : contrôle l'ouverture du drawer de navigation mobile.
     false = menu fermé (par défaut), true = menu ouvert. */
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /* isDark : raccourci booléen pour savoir si le thème sombre est actif.
     Utilisé pour afficher Moon ou Sun et pour les textes d'accessibilité aria-label. */
  const isDark = theme === "dark";

  /* useEffect n°1 : synchronise la langue sélectionnée avec le reste de l'application.
     Se déclenche à chaque changement de `language` (et de `i18n` si sa référence change).
     Actions :
     1. Sauvegarde la langue dans localStorage pour la persister entre les sessions.
     2. Appelle i18n.changeLanguage() pour traduire l'interface immédiatement.
     3. Met à jour l'attribut lang du <html> pour l'accessibilité et le SEO.
     4. Met à jour l'attribut dir : "rtl" pour l'arabe (écriture droite→gauche), "ltr" pour les autres. */
  useEffect(() => {
    window.localStorage.setItem("blogyoo_language", language);
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [i18n, language]);

  /* useEffect n°2 : gère la classe CSS "has-open-menu" sur le body.
     Quand le menu mobile est ouvert, "has-open-menu" est ajouté sur <body> pour bloquer le scroll.
     La fonction de nettoyage (return () => ...) est appelée quand le composant se démonte
     ou avant le prochain effet → elle retire la classe pour éviter qu'elle reste bloquée. */
  useEffect(() => {
    document.body.classList.toggle("has-open-menu", isMenuOpen);

    return () => document.body.classList.remove("has-open-menu");
  }, [isMenuOpen]);

  /* closeMenu : fonction utilitaire pour fermer le menu mobile (appelée sur clic d'un lien ou du backdrop). */
  const closeMenu = () => setIsMenuOpen(false);

  /* dashboardPath : calcule le chemin de redirection vers le dashboard selon le rôle de l'utilisateur.
     - Si l'utilisateur est "admin" global → "/admin".
     - Sinon, getRedirectPathByRole() détermine le chemin selon le rôle du blog (owner, editor, etc.). */
  const dashboardPath = user?.globalRole === "admin" ? "/admin" : getRedirectPathByRole(user?.role);

  /* handleLogout : déconnecte l'utilisateur, ferme le menu mobile et redirige vers la page d'accueil. */
  const handleLogout = () => {
    logout();      // Efface le token JWT et réinitialise l'état d'authentification.
    closeMenu();   // Ferme le drawer mobile si ouvert.
    navigate("/"); // Redirige vers l'accueil via React Router (pas de rechargement de page).
  };

  return (
    /* Balise HTML sémantique <header> : zone d'en-tête de la page.
       La classe "site-header" applique la position sticky, le fond, l'ombre définis en CSS. */
    <header className="site-header">

      {/* Conteneur interne avec grille CSS : aligne logo, nav, outils, auth en une seule ligne. */}
      <div className="site-header__inner">

        {/* Lien de la marque (logo + nom du site).
            NavLink vers "/" avec aria-label pour l'accessibilité (lecteurs d'écran).
            title affiche une infobulle au survol. */}
        <NavLink className="site-header__brand" to="/" aria-label={t("errors.backHome")} title={t("errors.backHome")}>
          <span className="brand__copy">
            {/* Nom du site traduit via i18n → clé "app.name". */}
            <span className="brand__name">{t("app.name")}</span>
          </span>
        </NavLink>

        {/* Navigation principale DESKTOP (masquée sur mobile via CSS display:none).
            aria-label décrit la navigation pour les lecteurs d'écran. */}
        <nav className="main-nav site-header__desktop-nav" aria-label={t("nav.mainNavigation")}>
          {/* Boucle sur le tableau navItems pour générer dynamiquement les liens.
              key={item.to} → clé unique React pour optimiser le re-rendu de la liste.
              className via fonction : NavLink passe un objet { isActive } → on retourne "active" ou undefined.
              end={item.to === "/"} → pour la route "/", end=true évite que "/" soit toujours "active"
              car tous les chemins commencent par "/". */}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              end={item.to === "/"}
              title={t(item.labelKey)}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Zone des outils rapides : sélecteur de langue + bouton de thème. */}
        <div className="site-header__quick-tools">

          {/* Sélecteur de langue : encapsulé dans un <label> pour l'accessibilité.
              Le clic sur l'icône Globe2 ouvre le <select> nativement. */}
          <label className="site-header__language" title={t("common.language")}>
            <Globe2 size={15} />
            {/* <select> HTML natif pour le changement de langue.
                onChange : à chaque changement de sélection, met à jour l'état `language`.
                event.target.value contient le code de la langue sélectionnée (ex: "fr"). */}
            <select
              aria-label={t("common.language")}
              title={t("common.language")}
              onChange={(event) => setLanguage(event.target.value)}
              value={language}
            >
              {/* Génère une <option> par langue disponible.
                  key={option.code} → clé unique React.
                  value={option.code} → valeur soumise lors du changement (code ISO). */}
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.flag} {option.short}
                </option>
              ))}
            </select>
          </label>

          {/* Bouton de basculement du thème clair/sombre.
              aria-label change dynamiquement selon le thème actif pour l'accessibilité.
              isDark ? <Sun> : <Moon> → affiche l'icône inverse du thème actif
              (en mode sombre on montre le soleil pour "passer au clair", et vice-versa). */}
          <button
            className="site-header__theme"
            onClick={toggleTheme}
            type="button"
            aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
            title={isDark ? t("theme.light") : t("theme.dark")}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Zone d'authentification DESKTOP (masquée sur mobile via CSS).
            Affiche soit les boutons connecté (dashboard + avatar + déconnexion)
            soit les boutons déconnecté (connexion + inscription). */}
        <div className="site-header__auth site-header__desktop-auth">
          {/* Rendu conditionnel : isAuthenticated ? bloc connecté : bloc déconnecté. */}
          {isAuthenticated ? (
            /* Fragment React <> ... </> : regroupe plusieurs éléments sans ajouter de nœud DOM. */
            <>
              {/* Lien vers le dashboard (chemin calculé selon le rôle de l'utilisateur). */}
              <NavLink className="site-header__icon-link" to={dashboardPath} title={t("nav.dashboard")} aria-label={t("nav.dashboard")}>
                <LayoutDashboard size={16} />
              </NavLink>

              {/* Avatar de l'utilisateur : priorité full_name → username → email pour générer les initiales. */}
              <span className="site-header__avatar" title={user?.username || user?.email}>
                <Avatar name={user?.full_name || user?.username || user?.email} src={user?.avatar_url} />
              </span>

              {/* Bouton de déconnexion : appelle handleLogout qui efface le token et redirige. */}
              <button className="site-header__icon-link site-header__logout" onClick={handleLogout} type="button" title={t("actions.logout")} aria-label={t("actions.logout")}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            /* Utilisateur non connecté : liens vers la page de connexion et d'inscription. */
            <>
              {/* Lien de connexion avec icône LogIn. */}
              <NavLink className="site-header__auth-link" to="/signin" title={t("nav.signin")}>
                <LogIn size={15} />
                <span>{t("nav.signin")}</span>
              </NavLink>

              {/* Lien d'inscription avec style primaire (fond coloré via classe "is-primary"). */}
              <NavLink className="site-header__auth-link is-primary" to="/signup" title={t("nav.signup")}>
                <UserPlus size={15} />
                <span>{t("nav.signup")}</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Bouton hamburger MOBILE : visible uniquement sur petit écran.
            aria-expanded : indique aux lecteurs d'écran si le menu est ouvert ou fermé.
            aria-controls : référence l'id du drawer contrôlé ("public-navigation").
            onClick : inverse l'état isMenuOpen via la forme fonctionnelle de setState. */}
        <button
          className="site-header__burger"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="public-navigation"
          aria-label={isMenuOpen ? t("actions.closeMenu") : t("actions.openMenu")}
          title={isMenuOpen ? t("actions.closeMenu") : t("actions.openMenu")}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {/* Affiche X (fermer) si le menu est ouvert, sinon hamburger Menu. */}
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Backdrop (superposition sombre) affiché derrière le drawer mobile quand il est ouvert.
            Un clic dessus ferme le menu (closeMenu).
            Rendu conditionnel : n'existe dans le DOM que si isMenuOpen est true. */}
        {isMenuOpen ? <button className="site-header__drawer-backdrop" onClick={closeMenu} type="button" aria-label={t("actions.closeMenu")} /> : null}

        {/* Drawer de navigation MOBILE : panneau latéral qui glisse depuis la gauche.
            La classe "is-open" est ajoutée dynamiquement quand isMenuOpen est true → déclenche l'animation CSS.
            id="public-navigation" référencé par aria-controls du bouton hamburger. */}
        <div className={`site-header__drawer ${isMenuOpen ? "is-open" : ""}`} id="public-navigation">

          {/* Navigation dans le drawer mobile : mêmes liens que la nav desktop.
              onClick={closeMenu} sur chaque NavLink ferme le drawer après navigation. */}
          <nav className="main-nav" aria-label={t("nav.mainNavigation")}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              end={item.to === "/"}
              onClick={closeMenu}
              title={t(item.labelKey)}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
          </nav>

          {/* Zone des outils du drawer : authentification + langue + thème. */}
          <div className="site-header__tools">
            {/* Bloc auth dans le drawer mobile : connecté ou déconnecté. */}
            {isAuthenticated ? (
              <div className="site-header__auth">
                {/* Lien dashboard dans le drawer mobile. */}
                <NavLink className="site-header__auth-link" onClick={closeMenu} to={dashboardPath} title={t("nav.dashboard")}>
                  <LayoutDashboard size={15} />
                  <span>{t("nav.dashboard")}</span>
                </NavLink>

                {/* Affiche le nom d'utilisateur ou l'email dans le drawer (non cliquable). */}
                <span className="site-header__user" title={user?.username || user?.email}>
                  <UserCircle size={15} />
                  <span>{user?.username || user?.email}</span>
                </span>

                {/* Bouton de déconnexion dans le drawer mobile. */}
                <button className="site-header__auth-link" onClick={handleLogout} type="button" title={t("actions.logout")}>
                  <LogOut size={15} />
                  <span>{t("actions.logout")}</span>
                </button>
              </div>
            ) : (
              /* Utilisateur non connecté dans le drawer mobile. */
              <div className="site-header__auth">
                {/* Lien connexion dans le drawer. */}
                <NavLink className="site-header__auth-link" onClick={closeMenu} to="/signin" title={t("nav.signin")}>
                  <LogIn size={15} />
                  <span>{t("nav.signin")}</span>
                </NavLink>

                {/* Lien inscription dans le drawer avec style primaire. */}
                <NavLink className="site-header__auth-link is-primary" onClick={closeMenu} to="/signup" title={t("nav.signup")}>
                  <UserPlus size={15} />
                  <span>{t("nav.signup")}</span>
                </NavLink>
              </div>
            )}

            {/* Préférences dans le drawer : langue + thème (dupliqués du header desktop
                pour être accessibles aussi sur mobile sans fermer le drawer). */}
            <div className="site-header__drawer-preferences">
              {/* Sélecteur de langue dans le drawer mobile (même logique que desktop). */}
              <label className="site-header__language" title={t("common.language")}>
                <Globe2 size={15} />
                <select
                  aria-label={t("common.language")}
                  title={t("common.language")}
                  onChange={(event) => setLanguage(event.target.value)}
                  value={language}
                >
                  {languageOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.flag} {option.short}
                    </option>
                  ))}
                </select>
              </label>

              {/* Bouton de thème dans le drawer mobile. */}
              <button
                className="site-header__theme"
                onClick={toggleTheme}
                type="button"
                aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
                title={isDark ? t("theme.light") : t("theme.dark")}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* Export par défaut du composant Header pour l'utiliser dans PublicLayout. */
export default Header;
