import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import { mockReports } from "@utils/mockData";

import "./AdminReports.css";

function AdminReports() {
  const { t } = useTranslation();

  return (
    <section className="by-page admin-reports">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("nav.reports")}</div>
          <h1>{t("pages.adminReports.title")}</h1>
          <p className="text-muted">{t("pages.adminReports.description")}</p>
        </div>
      </header>

      <div className="report-list">
        {mockReports.map((report) => (
          <article className="card-shell report-card" key={report.id}>
            <div>
              <Badge tone={report.priority === "haute" ? "danger" : "warning"}>{t(`priority.${report.priority}`, report.priority)}</Badge>
              <h2>{report.target}</h2>
              <p>{report.reason}</p>
            </div>
            <div className="report-card__actions">
              <Badge tone="info">{t(`status.${report.status}`, report.status)}</Badge>
              <Button icon={Check}>{t("actions.process")}</Button>
              <Button icon={X} variant="secondary">{t("actions.reject")}</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminReports;
