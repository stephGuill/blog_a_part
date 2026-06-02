import { MessageSquareWarning } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import { mockStats } from "@utils/mockData";
import { formatCompactMetric } from "@utils/formatMetric";

import "./ModeratorDashboard.css";

function ModeratorDashboard() {
  const { t } = useTranslation();

  return (
    <section className="by-page moderator-dashboard">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("nav.moderator")}</div>
          <h1>{t("pages.moderatorDashboard.title")}</h1>
          <p className="text-muted">{t("pages.moderatorDashboard.description")}</p>
        </div>
        <Button icon={MessageSquareWarning}>{t("actions.viewQueue")}</Button>
      </header>
      <div className="bento-grid">
        {mockStats.moderator.map((stat) => (
          <article className="analytics-card" key={stat.label}>
            <Badge tone={stat.labelKey === "metrics.urgent" ? "danger" : "info"}>{stat.trend}</Badge>
            <strong>{formatCompactMetric(stat.value, t)}</strong>
            <span>{t(stat.labelKey)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ModeratorDashboard;
