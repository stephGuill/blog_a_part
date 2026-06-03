// Icônes lucide-react : calendrier pour le planning, stylo pour le bouton de création
import { CalendarDays, PenLine } from "lucide-react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : composant affichant une étiquette de tendance ou statut
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec support d'icône
import Button from "@components/ui/Button/Button";
// Données fictives pour simuler les statistiques de l'éditeur
import { mockStats } from "@utils/mockData";
// Utilitaire de formatage compact des métriques (ex : 1200 → "1,2k")
import { formatCompactMetric } from "@utils/formatMetric";

// Styles CSS propres au tableau de bord éditeur
import "./EditorDashboard.css";

// Composant page : tableau de bord de l'éditeur de contenus
function EditorDashboard() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  return (
    // Section principale de la page avec classes de mise en page
    <section className="by-page editor-dashboard">

      {/* En-tête : titre, description et bouton de création de nouvel article */}
      <header className="by-page-header">
        <div>
          {/* Bandeau de navigation contextuel traduit */}
          <div className="by-eyebrow">{t("nav.editor")}</div>
          {/* Titre principal de la page traduit */}
          <h1>{t("pages.editorDashboard.title")}</h1>
          {/* Description contextuelle traduite */}
          <p className="text-muted">{t("pages.editorDashboard.description")}</p>
        </div>
        {/* Bouton de création d'un nouvel article */}
        <Button icon={PenLine}>{t("actions.newPost")}</Button>
      </header>

      {/* Grille bento : statistiques de l'éditeur (articles, vues, commentaires…) */}
      {/* mockStats.editor est un tableau d'objets stat — on les parcourt tous */}
      <div className="bento-grid">
        {mockStats.editor.map((stat) => (
          // Carte analytique pour chaque statistique
          <article className="analytics-card" key={stat.label}>
            {/* Badge de tendance (ex : "+5%") */}
            <Badge tone="info">{stat.trend}</Badge>
            {/* Valeur principale formatée en compact */}
            <strong>{formatCompactMetric(stat.value, t)}</strong>
            {/* Label de la métrique traduit via sa clé i18n */}
            <span>{t(stat.labelKey)}</span>
          </article>
        ))}
      </div>

      {/* Carte du planning de publication (calendrier éditorial simplifié) */}
      <article className="card-shell editor-calendar">
        <CalendarDays size={24} />
        <h2>{t("pages.editorDashboard.publicationSchedule")}</h2>
        {/* Bande de jours de la semaine avec le nombre d'articles planifiés */}
        {/* .map() sur un tableau de codes de jours : "mon", "tue", "wed", "thu", "fri" */}
        <div className="calendar-strip">
          {["mon", "tue", "wed", "thu", "fri"].map((day) => (
            // Cellule d'un jour : libellé traduit + compteur d'articles
            <span key={day}>
              {t(`weekdays.${day}`)}
              {/* Nombre fictif d'articles planifiés ce jour-là */}
              <strong>2</strong>
            </span>
          ))}
        </div>
      </article>

    </section>
  );
}

// Export par défaut pour le routeur React
export default EditorDashboard;
