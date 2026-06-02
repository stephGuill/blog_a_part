import { CalendarDays, PenLine } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import { mockStats } from "@utils/mockData";
import { formatCompactMetric } from "@utils/formatMetric";

import "./EditorDashboard.css";

function EditorDashboard() {
  const { t } = useTranslation();

  return (
    <section className="by-page editor-dashboard">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("nav.editor")}</div>
          <h1>{t("pages.editorDashboard.title")}</h1>
          <p className="text-muted">{t("pages.editorDashboard.description")}</p>
        </div>
        <Button icon={PenLine}>{t("actions.newPost")}</Button>
      </header>

      <div className="bento-grid">
        {mockStats.editor.map((stat) => (
          <article className="analytics-card" key={stat.label}>
            <Badge tone="info">{stat.trend}</Badge>
            <strong>{formatCompactMetric(stat.value, t)}</strong>
            <span>{t(stat.labelKey)}</span>
          </article>
        ))}
      </div>

      <article className="card-shell editor-calendar">
        <CalendarDays size={24} />
        <h2>{t("pages.editorDashboard.publicationSchedule")}</h2>
        <div className="calendar-strip">{["mon", "tue", "wed", "thu", "fri"].map((day) => <span key={day}>{t(`weekdays.${day}`)}<strong>2</strong></span>)}</div>
      </article>
    </section>
  );
}

export default EditorDashboard;
