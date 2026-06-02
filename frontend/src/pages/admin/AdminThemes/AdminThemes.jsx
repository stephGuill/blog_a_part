import { Palette, Power, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import { mockThemes } from "@utils/mockData";

import "./AdminThemes.css";

function AdminThemes() {
  const { t } = useTranslation();

  return (
    <section className="by-page admin-themes">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("pages.adminThemes.eyebrow")}</div>
          <h1>{t("pages.adminThemes.title")}</h1>
          <p className="text-muted">{t("pages.adminThemes.description")}</p>
        </div>
        <Button icon={Palette}>{t("actions.newTheme")}</Button>
      </header>

      <div className="theme-grid">
        {mockThemes.map((theme) => (
          <article className="card-shell surface-hover theme-card" key={theme.id}>
            <div className="theme-card__palette">
              {theme.colors.map((color) => (
                <span key={color} style={{ background: color }} />
              ))}
            </div>
            <div className="flex-between">
              <Badge tone="info">{t(`themeTypes.${theme.type}`, theme.type)}</Badge>
              <Badge tone={theme.status === "actif" ? "success" : "warning"}>{t(`status.${theme.status}`, theme.status)}</Badge>
            </div>
            <h2>{theme.name}</h2>
            <div className="actions">
              <Button icon={SlidersHorizontal} variant="secondary">{t("common.edit")}</Button>
              <Button icon={Power}>{t("actions.activate")}</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminThemes;
