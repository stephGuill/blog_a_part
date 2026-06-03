// Icônes lucide-react : palette (nouveau thème), power (activer), sliders (modifier)
import { Palette, Power, SlidersHorizontal } from "lucide-react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : étiquette de type/statut colorée
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec icône
import Button from "@components/ui/Button/Button";
// Données fictives des thèmes (id, name, type, status, colors)
import { mockThemes } from "@utils/mockData";

// Styles CSS propres à la page de gestion des thèmes
import "./AdminThemes.css";

// Composant page : gestion des thèmes visuels par l'administrateur
function AdminThemes() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  return (
    // Section principale de la page des thèmes
    <section className="by-page admin-themes">

      {/* En-tête : titre + bouton de création d'un nouveau thème */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel traduit */}
          <div className="by-eyebrow">{t("pages.adminThemes.eyebrow")}</div>
          {/* Titre principal traduit */}
          <h1>{t("pages.adminThemes.title")}</h1>
          {/* Description contextuelle traduite */}
          <p className="text-muted">{t("pages.adminThemes.description")}</p>
        </div>
        {/* Bouton de création d'un nouveau thème */}
        <Button icon={Palette}>{t("actions.newTheme")}</Button>
      </header>

      {/* Grille des thèmes : mockThemes.map() itère sur chaque thème fictif */}
      <div className="theme-grid">
        {mockThemes.map((theme) => (
          // Carte thème avec hover animé
          <article className="card-shell surface-hover theme-card" key={theme.id}>

            {/* Palette de couleurs : affiche 3 blocs colorés côte à côte */}
            {/* theme.colors est un tableau de codes hex — .map() génère un <span> coloré pour chacun */}
            <div className="theme-card__palette">
              {theme.colors.map((color) => (
                // Bloc de couleur : background défini inline par la valeur hex
                <span key={color} style={{ background: color }} />
              ))}
            </div>

            {/* Ligne type + statut : deux badges côte à côte */}
            <div className="flex-between">
              {/* Type du thème (ex : "light", "dark", "custom") traduit */}
              <Badge tone="info">{t(`themeTypes.${theme.type}`, theme.type)}</Badge>
              {/* Statut : "success" (vert) si actif, "warning" (orange) sinon */}
              <Badge tone={theme.status === "actif" ? "success" : "warning"}>
                {t(`status.${theme.status}`, theme.status)}
              </Badge>
            </div>

            {/* Nom du thème */}
            <h2>{theme.name}</h2>

            {/* Boutons d'action : modifier et activer */}
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

// Export par défaut pour le routeur React
export default AdminThemes;
