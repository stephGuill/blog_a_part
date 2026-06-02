import { Lightbulb, PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import { mockBlogs, mockStats } from "@utils/mockData";
import { formatCompactMetric } from "@utils/formatMetric";

import "./OwnerDashboard.css";

function OwnerDashboard() {
  const { t } = useTranslation();

  return (
    <section className="by-page owner-dashboard">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("nav.owner")}</div>
          <h1>{t("pages.ownerDashboard.title")}</h1>
          <p className="text-muted">{t("pages.ownerDashboard.description")}</p>
        </div>
        <Button icon={PlusCircle}>{t("actions.createBlog")}</Button>
      </header>

      <div className="bento-grid">
        {mockStats.owner.map((stat) => (
          <article className="analytics-card" key={stat.label}>
            <Badge tone="success">{stat.trend}</Badge>
            <strong>{formatCompactMetric(stat.value, t)}</strong>
            <span>{t(stat.labelKey)}</span>
          </article>
        ))}
      </div>

      <div className="dashboard-grid owner-panels">
        <article className="card-shell owner-recommendation">
          <Lightbulb size={26} />
          <h2>{t("pages.ownerDashboard.recommendationTitle")}</h2>
          <p>{t("pages.ownerDashboard.recommendationText")}</p>
        </article>
        <article className="card-shell owner-recent">
          <div className="by-eyebrow">{t("pages.ownerDashboard.recentBlogs")}</div>
          {mockBlogs.slice(0, 3).map((blog) => (
            <div className="top-blog-row" key={blog.id}>
              <strong>{blog.name}</strong>
              <Badge tone="info">{t(`status.${blog.status}`, blog.status)}</Badge>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

export default OwnerDashboard;
