import { Bell, Globe2, LogOut, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import Avatar from "@components/ui/Avatar/Avatar";
import { useAuth } from "@hooks/useAuth";
import { useTheme } from "@hooks/useTheme";

import "./Topbar.css";

const languageOptions = [
  { code: "fr", flag: "FR", labelKey: "languages.fr" },
  { code: "en", flag: "EN", labelKey: "languages.en" },
  { code: "ar", flag: "AR", labelKey: "languages.ar" },
  { code: "es", flag: "ES", labelKey: "languages.es" },
];

function Topbar() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState(
    () => window.localStorage.getItem("blogyoo_language") || i18n.language || "fr"
  );
  const isDark = theme === "dark";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    window.localStorage.setItem("blogyoo_language", language);
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [i18n, language]);

  return (
    <header className="topbar">
      <div>
        <div className="by-eyebrow">{t("app.workspace")}</div>
        <h1>{t("app.commandCenter")}</h1>
      </div>

      <div className="topbar__tools">
        <label className="topbar__search">
          <Search size={16} />
          <input placeholder={t("common.search")} type="search" />
        </label>
        <button className="topbar__icon" type="button" aria-label={t("common.notifications")}>
          <Bell size={18} />
        </button>

        <label className="topbar__language">
          <Globe2 size={16} />
          <select
            aria-label={t("common.language")}
            onChange={(event) => setLanguage(event.target.value)}
            value={language}
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.flag} - {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <button
          className="topbar__theme"
          onClick={toggleTheme}
          type="button"
          aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
          title={isDark ? t("theme.light") : t("theme.dark")}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          className="topbar__icon topbar__logout"
          type="button"
          aria-label={t("actions.logout")}
          title={t("actions.logout")}
          onClick={handleLogout}
        >
          <LogOut size={18} />
        </button>
        <Avatar name={user?.full_name || user?.username || "BlogYoo Admin"} src={user?.avatar_url} />
      </div>
    </header>
  );
}

export default Topbar;
