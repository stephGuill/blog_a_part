import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import QuickActions from "@components/dashboard/QuickActions/QuickActions";
import { mockActivities, mockStats } from "@utils/mockData";
import { formatCompactMetric } from "@utils/formatMetric";

import "./Dashboard.css";

function Dashboard() {
  const { t } = useTranslation();

  return (
    <section className="by-page dashboard-home">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("nav.dashboard")}</div>
          <h1>{t("pages.dashboard.title")}</h1>
          <p className="text-muted">{t("pages.dashboard.description")}</p>
        </div>
        <Button icon={ArrowRight}>{t("actions.continue")}</Button>
      </header>
      <div className="bento-grid">
        {mockStats.owner.slice(0, 3).map((stat) => (
          <article className="analytics-card" key={stat.label}>
            <Badge tone="info">{stat.trend}</Badge>
            <strong>{formatCompactMetric(stat.value, t)}</strong>
            <span>{t(stat.labelKey)}</span>
          </article>
        ))}
      </div>
      <div className="dashboard-grid dashboard-home__lower">
        <article className="card-shell dashboard-welcome">
          <Sparkles size={24} />
          <h2>{t("dashboard.quickActions")}</h2>
          <QuickActions />
        </article>
        <article className="card-shell dashboard-activity">
          <div className="by-eyebrow">{t("dashboard.activity")}</div>
          {mockActivities.map((activity) => (
            <div className="activity-row" key={activity.id}>
              <span>{t(activity.labelKey)}</span>
              <small>{t(activity.timeKey)}</small>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

export default Dashboard;
