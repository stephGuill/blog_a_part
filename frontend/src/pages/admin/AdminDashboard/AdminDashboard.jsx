import { Activity, ArrowUpRight, CheckCircle2, CircleDollarSign, Flag, Newspaper, ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import { mockActivities, mockBlogs, mockStats } from "@utils/mockData";
import { formatCompactMetric } from "@utils/formatMetric";

import "./AdminDashboard.css";

const icons = [Users, Newspaper, Activity, CircleDollarSign, Flag];

function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <section className="by-page admin-dashboard">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("pages.adminDashboard.eyebrow")}</div>
          <h1>{t("pages.adminDashboard.title")}</h1>
          <p className="text-muted">{t("pages.adminDashboard.description")}</p>
        </div>
        <Button icon={ArrowUpRight}>
          {t("actions.exportReport")}
        </Button>
      </header>

      <div className="admin-dashboard__stats">
        {mockStats.admin.map((stat, index) => {
          const Icon = icons[index];
          return (
            <article className="analytics-card surface-hover" key={stat.label}>
              <div className="admin-stat__top">
                <span className="admin-stat__icon"><Icon size={20} /></span>
                <Badge tone={stat.tone}>{stat.trend}</Badge>
              </div>
              <strong>
                {formatCompactMetric(stat.value, t)}
              </strong>
              <span>
                {t(stat.labelKey)}
              </span>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid admin-dashboard__bento">
        <article className="card-shell platform-chart">
          <div className="flex-between">
            <div>
              <div className="by-eyebrow">{t("pages.adminDashboard.editorialTraffic")}</div>
              <h2>{t("pages.adminDashboard.weeklyGrowth")}</h2>
            </div>
            <Badge tone="success">{t("status.stable")}</Badge>
          </div>
          <div className="mini-chart" aria-hidden="true">
            {[34, 48, 42, 68, 62, 78, 92].map((height, index) => (
              <span
                className="mini-chart__bar"
                key={height + index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </article>

        <article className="card-shell platform-health">
          <div className="by-eyebrow">{t("dashboard.platformHealth")}</div>
          <h2>{t("pages.adminDashboard.operationalServices")}</h2>
          {["API Express", "Base MySQL", t("pages.adminDashboard.mediaUploads")].map((item) => (
            <div className="health-row" key={item}>
              <span><CheckCircle2 size={18} /> {item}</span>
              <Badge tone="success">OK</Badge>
            </div>
          ))}
        </article>

        <article className="card-shell activity-panel">
          <div className="by-eyebrow">{t("dashboard.activity")}</div>
          {mockActivities.map((activity) => (
            <div className="activity-row" key={activity.id}>
              <span><ShieldCheck size={17} /> {t(activity.labelKey)}</span>
              <small>{t(activity.timeKey)}</small>
            </div>
          ))}
        </article>

        <article className="card-shell top-blogs">
          <div className="by-eyebrow">{t("dashboard.topBlogs")}</div>
          {mockBlogs.slice(0, 3).map((blog) => (
            <div className="top-blog-row" key={blog.id}>
              <strong>{blog.name}</strong>
              <span>{formatCompactMetric(blog.views, t)} {t("metrics.views")}</span>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

export default AdminDashboard;
