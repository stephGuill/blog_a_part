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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";

import Avatar from "@components/ui/Avatar/Avatar";
import { useAuth } from "@hooks/useAuth";
import { useTheme } from "@hooks/useTheme";
import { getRedirectPathByRole } from "@utils/roleRedirect";

import "./Header.css";

const navItems = [
  { labelKey: "nav.home", to: "/" },
  { labelKey: "nav.blogs", to: "/blogs" },
  { labelKey: "nav.about", to: "/about" },
  { labelKey: "nav.contact", to: "/contact" },
];

const languageOptions = [
  { code: "fr", flag: "🇫🇷", short: "FR", labelKey: "languages.fr" },
  { code: "en", flag: "🇬🇧", short: "EN", labelKey: "languages.en" },
  { code: "ar", flag: "🇸🇦", short: "AR", labelKey: "languages.ar" },
  { code: "es", flag: "🇪🇸", short: "ES", labelKey: "languages.es" },
];

function Header() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState(
    () => window.localStorage.getItem("blogyoo_language") || i18n.language || "fr"
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    window.localStorage.setItem("blogyoo_language", language);
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [i18n, language]);

  useEffect(() => {
    document.body.classList.toggle("has-open-menu", isMenuOpen);

    return () => document.body.classList.remove("has-open-menu");
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);
  const dashboardPath = user?.globalRole === "admin" ? "/admin" : getRedirectPathByRole(user?.role);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink className="site-header__brand" to="/" aria-label={t("errors.backHome")} title={t("errors.backHome")}>
          <span className="brand__copy">
            <span className="brand__name">{t("app.name")}</span>
          </span>
        </NavLink>

        <nav className="main-nav site-header__desktop-nav" aria-label={t("nav.mainNavigation")}>
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

        <div className="site-header__quick-tools">
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

        <div className="site-header__auth site-header__desktop-auth">
          {isAuthenticated ? (
            <>
              <NavLink className="site-header__icon-link" to={dashboardPath} title={t("nav.dashboard")} aria-label={t("nav.dashboard")}>
                <LayoutDashboard size={16} />
              </NavLink>
              <span className="site-header__avatar" title={user?.username || user?.email}>
                <Avatar name={user?.full_name || user?.username || user?.email} src={user?.avatar_url} />
              </span>
              <button className="site-header__icon-link site-header__logout" onClick={handleLogout} type="button" title={t("actions.logout")} aria-label={t("actions.logout")}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <NavLink className="site-header__auth-link" to="/signin" title={t("nav.signin")}>
                <LogIn size={15} />
                <span>{t("nav.signin")}</span>
              </NavLink>
              <NavLink className="site-header__auth-link is-primary" to="/signup" title={t("nav.signup")}>
                <UserPlus size={15} />
                <span>{t("nav.signup")}</span>
              </NavLink>
            </>
          )}
        </div>

        <button
          className="site-header__burger"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="public-navigation"
          aria-label={isMenuOpen ? t("actions.closeMenu") : t("actions.openMenu")}
          title={isMenuOpen ? t("actions.closeMenu") : t("actions.openMenu")}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {isMenuOpen ? <button className="site-header__drawer-backdrop" onClick={closeMenu} type="button" aria-label={t("actions.closeMenu")} /> : null}

        <div className={`site-header__drawer ${isMenuOpen ? "is-open" : ""}`} id="public-navigation">
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

          <div className="site-header__tools">
            {isAuthenticated ? (
              <div className="site-header__auth">
                <NavLink className="site-header__auth-link" onClick={closeMenu} to={dashboardPath} title={t("nav.dashboard")}>
                  <LayoutDashboard size={15} />
                  <span>{t("nav.dashboard")}</span>
                </NavLink>
                <span className="site-header__user" title={user?.username || user?.email}>
                  <UserCircle size={15} />
                  <span>{user?.username || user?.email}</span>
                </span>
                <button className="site-header__auth-link" onClick={handleLogout} type="button" title={t("actions.logout")}>
                  <LogOut size={15} />
                  <span>{t("actions.logout")}</span>
                </button>
              </div>
            ) : (
              <div className="site-header__auth">
                <NavLink className="site-header__auth-link" onClick={closeMenu} to="/signin" title={t("nav.signin")}>
                  <LogIn size={15} />
                  <span>{t("nav.signin")}</span>
                </NavLink>
                <NavLink className="site-header__auth-link is-primary" onClick={closeMenu} to="/signup" title={t("nav.signup")}>
                  <UserPlus size={15} />
                  <span>{t("nav.signup")}</span>
                </NavLink>
              </div>
            )}

            <div className="site-header__drawer-preferences">
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

export default Header;
