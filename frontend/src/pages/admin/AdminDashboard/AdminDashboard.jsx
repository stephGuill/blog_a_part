// Icônes lucide-react utilisées dans les cartes de stats et les sections du tableau de bord
import { Activity, ArrowUpRight, CheckCircle2, CircleDollarSign, Flag, Newspaper, ShieldCheck, Users } from "lucide-react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : étiquette de statut/tendance colorée
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec icône
import Button from "@components/ui/Button/Button";
// Données fictives : activités récentes, blogs, statistiques admin
import { mockActivities, mockBlogs, mockStats } from "@utils/mockData";
// Formatage compact des métriques (ex : 12000 → "12k")
import { formatCompactMetric } from "@utils/formatMetric";

// Styles CSS propres au tableau de bord administrateur
import "./AdminDashboard.css";

// Tableau d'icônes correspondant aux 5 stats admin : users, articles, activité, revenus, signalements
const icons = [Users, Newspaper, Activity, CircleDollarSign, Flag];

// Composant page : tableau de bord de l'administrateur plateforme
function AdminDashboard() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  return (
    <section className="by-page admin-dashboard">

      {/* En-tête : titre + bouton d'export */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel traduit */}
          <div className="by-eyebrow">{t("pages.adminDashboard.eyebrow")}</div>
          {/* Titre principal traduit */}
          <h1>{t("pages.adminDashboard.title")}</h1>
          {/* Description contextuelle traduite */}
          <p className="text-muted">{t("pages.adminDashboard.description")}</p>
        </div>
        {/* Bouton d'export du rapport admin */}
        <Button icon={ArrowUpRight}>
          {t("actions.exportReport")}
        </Button>
      </header>

      {/* Grille des statistiques admin : 5 cartes avec icône, valeur compacte, tendance */}
      {/* mockStats.admin est un tableau de 5 objets stat — index utilisé pour récupérer l'icône */}
      <div className="admin-dashboard__stats">
        {mockStats.admin.map((stat, index) => {
          // Récupération dynamique de l'icône correspondant à ce stat (via l'index)
          const Icon = icons[index];

          return (
            // Carte analytique avec hover animé
            <article className="analytics-card surface-hover" key={stat.label}>
              <div className="admin-stat__top">
                {/* Icône encadrée dans un rond coloré */}
                <span className="admin-stat__icon"><Icon size={20} /></span>
                {/* Badge de tendance (ex : "+12%") avec ton sémantique */}
                <Badge tone={stat.tone}>{stat.trend}</Badge>
              </div>
              {/* Valeur principale formatée en compact (ex : 1200 → "1,2k") */}
              <strong>
                {formatCompactMetric(stat.value, t)}
              </strong>
              {/* Libellé de la métrique traduit via sa clé i18n */}
              <span>
                {t(stat.labelKey)}
              </span>
            </article>
          );
        })}
      </div>

      {/* Grille bento : mini-graphique, santé plateforme, activité récente, top blogs */}
      <div className="dashboard-grid admin-dashboard__bento">

        {/* Carte graphique éditorial : mini-chart en barres verticales */}
        <article className="card-shell platform-chart">
          <div className="flex-between">
            <div>
              <div className="by-eyebrow">{t("pages.adminDashboard.editorialTraffic")}</div>
              <h2>{t("pages.adminDashboard.weeklyGrowth")}</h2>
            </div>
            <Badge tone="success">{t("status.stable")}</Badge>
          </div>
          {/* Mini-chart : 7 barres de hauteur variable (en %, simulant une semaine) */}
          {/* aria-hidden : masqué aux lecteurs d'écran car purement décoratif */}
          <div className="mini-chart" aria-hidden="true">
            {[34, 48, 42, 68, 62, 78, 92].map((height, index) => (
              // Chaque barre a une hauteur dynamique via style inline
              <span
                className="mini-chart__bar"
                key={height + index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </article>

        {/* Carte santé de la plateforme : services opérationnels */}
        <article className="card-shell platform-health">
          <div className="by-eyebrow">{t("dashboard.platformHealth")}</div>
          <h2>{t("pages.adminDashboard.operationalServices")}</h2>
          {/* Ligne pour chaque service : nom + badge "OK" */}
          {["API Express", "Base MySQL", t("pages.adminDashboard.mediaUploads")].map((item) => (
            <div className="health-row" key={item}>
              <span><CheckCircle2 size={18} /> {item}</span>
              <Badge tone="success">OK</Badge>
            </div>
          ))}
        </article>

        {/* Carte des activités récentes : liste des dernières actions de modération */}
        {/* mockActivities : tableau d'objets {id, labelKey, timeKey} */}
        <article className="card-shell activity-panel">
          <div className="by-eyebrow">{t("dashboard.activity")}</div>
          {mockActivities.map((activity) => (
            <div className="activity-row" key={activity.id}>
              {/* Libellé de l'activité traduit + horodatage traduit */}
              <span><ShieldCheck size={17} /> {t(activity.labelKey)}</span>
              <small>{t(activity.timeKey)}</small>
            </div>
          ))}
        </article>

        {/* Carte top 3 blogs : classement par nombre de vues */}
        {/* .slice(0, 3) : on ne prend que les 3 premiers blogs */}
        <article className="card-shell top-blogs">
          <div className="by-eyebrow">{t("dashboard.topBlogs")}</div>
          {mockBlogs.slice(0, 3).map((blog) => (
            <div className="top-blog-row" key={blog.id}>
              <strong>{blog.name}</strong>
              {/* Vues formatées en compact + libellé traduit */}
              <span>{formatCompactMetric(blog.views, t)} {t("metrics.views")}</span>
            </div>
          ))}
        </article>

      </div>
    </section>
  );
}

// Export par défaut pour le routeur React
export default AdminDashboard;
