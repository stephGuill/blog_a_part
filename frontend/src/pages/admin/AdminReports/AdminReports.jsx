// Icônes lucide-react : valider (Check) et rejeter (X) un signalement
import { Check, X } from "lucide-react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : étiquette de priorité/statut colorée
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec icône
import Button from "@components/ui/Button/Button";
// Données fictives des signalements (id, target, reason, priority, status)
import { mockReports } from "@utils/mockData";

// Styles CSS propres à la page de gestion des signalements
import "./AdminReports.css";

// Composant page : modération des signalements par l'administrateur
function AdminReports() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  return (
    // Section principale de la page des signalements
    <section className="by-page admin-reports">

      {/* En-tête : titre et description */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel traduit */}
          <div className="by-eyebrow">{t("nav.reports")}</div>
          {/* Titre principal traduit */}
          <h1>{t("pages.adminReports.title")}</h1>
          {/* Description contextuelle traduite */}
          <p className="text-muted">{t("pages.adminReports.description")}</p>
        </div>
      </header>

      {/* Liste des signalements : mockReports.map() itère sur chaque signalement fictif */}
      <div className="report-list">
        {mockReports.map((report) => (
          // Carte d'un signalement
          <article className="card-shell report-card" key={report.id}>
            <div>
              {/* Badge de priorité :
                  - tone "danger" (rouge) si priorité haute
                  - tone "warning" (orange) pour les autres */}
              <Badge tone={report.priority === "haute" ? "danger" : "warning"}>
                {t(`priority.${report.priority}`, report.priority)}
              </Badge>
              {/* Cible du signalement (nom d'utilisateur, titre d'article…) */}
              <h2>{report.target}</h2>
              {/* Raison du signalement */}
              <p>{report.reason}</p>
            </div>
            {/* Zone d'actions : badge statut + boutons Traiter / Rejeter */}
            <div className="report-card__actions">
              {/* Badge indiquant le statut actuel du signalement (ex : "En attente") */}
              <Badge tone="info">{t(`status.${report.status}`, report.status)}</Badge>
              {/* Bouton de traitement : passe le signalement à l'état "traité" */}
              <Button icon={Check}>{t("actions.process")}</Button>
              {/* Bouton de rejet : écarte le signalement */}
              <Button icon={X} variant="secondary">{t("actions.reject")}</Button>
            </div>
          </article>
        ))}
      </div>

    </section>
  );
}

// Export par défaut pour le routeur React
export default AdminReports;
