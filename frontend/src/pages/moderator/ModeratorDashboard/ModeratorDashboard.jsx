// Icône lucide-react : bulle d'alerte pour le bouton d'accès à la file de modération
import { MessageSquareWarning } from "lucide-react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : étiquette de tendance colorée avec ton sémantique
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec icône
import Button from "@components/ui/Button/Button";
// Données fictives des statistiques du modérateur (commentaires en attente, signalements…)
import { mockStats } from "@utils/mockData";
// Utilitaire de formatage compact des métriques (ex : 1500 → "1,5k")
import { formatCompactMetric } from "@utils/formatMetric";

// Styles CSS propres au tableau de bord modérateur
import "./ModeratorDashboard.css";

// Composant page : tableau de bord du modérateur de contenu
function ModeratorDashboard() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  return (
    // Section principale de la page avec classes de mise en page
    <section className="by-page moderator-dashboard">

      {/* En-tête : titre + bouton d'accès à la file complète des commentaires */}
      <header className="by-page-header">
        <div>
          {/* Bandeau de navigation contextuel traduit (ex : "Modérateur") */}
          <div className="by-eyebrow">{t("nav.moderator")}</div>
          {/* Titre principal traduit (ex : "Tableau de bord modération") */}
          <h1>{t("pages.moderatorDashboard.title")}</h1>
          {/* Description contextuelle traduite */}
          <p className="text-muted">{t("pages.moderatorDashboard.description")}</p>
        </div>
        {/* Bouton pour accéder à la file complète des commentaires à modérer */}
        <Button icon={MessageSquareWarning}>{t("actions.viewQueue")}</Button>
      </header>

      {/* Grille bento des statistiques de modération */}
      {/* mockStats.moderator : tableau de stats (commentaires en attente, signalements urgents…) */}
      <div className="bento-grid">
        {mockStats.moderator.map((stat) => (
          // Carte analytique pour chaque statistique du modérateur
          <article className="analytics-card" key={stat.label}>
            {/* Badge "danger" (rouge) pour les métriques urgentes, "info" (bleu) pour les autres */}
            {/* La clé "metrics.urgent" identifie les statistiques nécessitant une attention immédiate */}
            <Badge tone={stat.labelKey === "metrics.urgent" ? "danger" : "info"}>{stat.trend}</Badge>
            {/* Valeur principale formatée en notation compacte */}
            <strong>{formatCompactMetric(stat.value, t)}</strong>
            {/* Label de la métrique traduit via sa clé i18n */}
            <span>{t(stat.labelKey)}</span>
          </article>
        ))}
      </div>

    </section>
  );
}

// Export par défaut pour le routeur React
export default ModeratorDashboard;
