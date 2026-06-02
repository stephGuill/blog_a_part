import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import "./MobileNav.css";

function MobileNav() {
  const { t } = useTranslation();

  return (
    <nav className="mobile-nav">
      <NavLink to="/">{t("nav.home")}</NavLink>
      <NavLink to="/blogs">{t("nav.blogs")}</NavLink>
      <NavLink to="/contact">{t("nav.contact")}</NavLink>
    </nav>
  );
}

export default MobileNav;
