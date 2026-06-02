import { Check, EyeOff, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Table from "@components/ui/Table/Table";
import { mockComments } from "@utils/mockData";

import "./CommentsModeration.css";

function CommentsModeration() {
  const { t } = useTranslation();
  const columns = [
    { key: "author", label: t("table.author") },
    { key: "article", label: t("table.targetArticle") },
    { key: "priority", label: t("table.priority"), render: (row) => <Badge tone={row.priority === "haute" ? "danger" : "warning"}>{t(`priority.${row.priority}`, row.priority)}</Badge> },
    { key: "status", label: t("table.status"), render: (row) => <Badge tone="info">{t(`status.${row.status}`, row.status)}</Badge> },
    { key: "content", label: t("nav.comments") },
    { key: "actions", label: t("table.actions"), render: () => <div className="table-actions"><button aria-label={t("status.approved")}><Check size={16} /></button><button aria-label={t("actions.hide")}><EyeOff size={16} /></button><button aria-label={t("common.delete")}><Trash2 size={16} /></button></div> },
  ];

  return (
    <section className="by-page comments-moderation">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("nav.comments")}</div>
          <h1>{t("pages.commentsModeration.title")}</h1>
        </div>
      </header>
      <Table columns={columns} rows={mockComments} />
    </section>
  );
}

export default CommentsModeration;
