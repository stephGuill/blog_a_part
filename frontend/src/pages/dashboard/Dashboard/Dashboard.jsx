// Icônes lucide-react : flèche droite pour le bouton d'action, étoile pour la section d'actions rapides
import { ArrowRight, Sparkles } from "lucide-react";
// Hook i18n : fournit la fonction t() pour traduire les chaînes de texte
import { useTranslation } from "react-i18next";

// Badge : composant d'affichage de statut ou tendance
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec support d'icône
import Button from "@components/ui/Button/Button";
// QuickActions : liste de raccourcis d'actions disponibles selon le rôle
import QuickActions from "@components/dashboard/QuickActions/QuickActions";
// Données fictives (mock) pour simuler stats et activités en attendant l'API
import { mockActivities, mockStats } from "@utils/mockData";
// Utilitaire pour formater un nombre en notation compacte (ex : 1200 → "1,2k")
import { formatCompactMetric } from "@utils/formatMetric";

// Styles CSS spécifiques à ce tableau de bord
import "./Dashboard.css";

// Composant page : tableau de bord principal visible après connexion (vue owner/utilisateur)
function Dashboard() {
  // t() est la fonction de traduction : t("clé") retourne le texte dans la langue active
  const { t } = useTranslation();

  return (
    // Section principale de la page avec les classes utilitaires de mise en page
    <section className="by-page dashboard-home">

      {/* En-tête de la page : contient le titre, la description et le bouton d'action */}
      <header className="by-page-header">
        <div>
          {/* Bandeau de navigation contextuel (eyebrow) traduit */}
          <div className="by-eyebrow">{t("nav.dashboard")}</div>
          {/* Titre principal de la page traduit */}
          <h1>{t("pages.dashboard.title")}</h1>
          {/* Description courte sous le titre, affichée en couleur atténuée */}
          <p className="text-muted">{t("pages.dashboard.description")}</p>
        </div>
        {/* Bouton principal pour continuer vers la prochaine action recommandée */}
        <Button icon={ArrowRight}>{t("actions.continue")}</Button>
      </header>

      {/* Grille bento des statistiques : affiche les 3 premières stats de l'owner */}
      {/* mockStats.owner est un tableau — .slice(0, 3) limite l'affichage aux 3 premiers éléments */}
      <div className="bento-grid">
        {mockStats.owner.slice(0, 3).map((stat) => (
          // Carte analytique pour chaque métrique, avec key unique pour la liste React
          <article className="analytics-card" key={stat.label}>
            {/* Badge affichant la tendance (ex : "+12%"), ton bleu "info" */}
            <Badge tone="info">{stat.trend}</Badge>
            {/* Valeur principale de la statistique formatée en compact */}
            <strong>{formatCompactMetric(stat.value, t)}</strong>
            {/* Label de la métrique traduit via sa clé i18n */}
            <span>{t(stat.labelKey)}</span>
          </article>
        ))}
      </div>

      {/* Zone inférieure : deux colonnes — actions rapides et flux d'activité récente */}
      <div className="dashboard-grid dashboard-home__lower">

        {/* Carte des actions rapides avec icône Sparkles */}
        <article className="card-shell dashboard-welcome">
          <Sparkles size={24} />
          <h2>{t("dashboard.quickActions")}</h2>
          {/* Composant QuickActions : affiche une liste de liens vers les actions courantes */}
          <QuickActions />
        </article>

        {/* Carte du flux d'activité récente de la plateforme */}
        <article className="card-shell dashboard-activity">
          {/* Label "Activité" en eyebrow */}
          <div className="by-eyebrow">{t("dashboard.activity")}</div>
          {/* Itération sur les activités mock pour en afficher chaque ligne */}
          {mockActivities.map((activity) => (
            // Ligne d'activité avec clé unique
            <div className="activity-row" key={activity.id}>
              {/* Description de l'action traduite */}
              <span>{t(activity.labelKey)}</span>
              {/* Horodatage relatif traduit (ex : "il y a 5 min") */}
              <small>{t(activity.timeKey)}</small>
            </div>
          ))}
        </article>

      </div>
    </section>
  );
}

// Export par défaut pour le routeur React
export default Dashboard;
