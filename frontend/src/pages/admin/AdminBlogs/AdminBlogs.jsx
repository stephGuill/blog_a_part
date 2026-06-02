import { Eye, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import Table from "@components/ui/Table/Table";
import { mockBlogs } from "@utils/mockData";
import { formatCompactMetric } from "@utils/formatMetric";

import "./AdminBlogs.css";

function AdminBlogs() {
  const { t } = useTranslation();
  const columns = [
    { key: "name", label: "Blog" },
    { key: "owner", label: t("nav.owner") },
    { key: "posts", label: t("metrics.posts") },
    { key: "views", label: t("metrics.views"), render: (row) => formatCompactMetric(row.views, t) },
    { key: "status", label: t("table.status"), render: (row) => <Badge tone={row.status === "archive" ? "danger" : "success"}>{t(`status.${row.status}`, row.status)}</Badge> },
    { key: "actions", label: t("table.actions"), render: () => <Button icon={Eye} variant="secondary">{t("common.inspect")}</Button> },
  ];

  return (
    <section className="by-page admin-blogs">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("pages.adminBlogs.eyebrow")}</div>
          <h1>{t("pages.adminBlogs.title")}</h1>
          <p className="text-muted">{t("pages.adminBlogs.description")}</p>
        </div>
        <Button icon={ShieldCheck}>{t("actions.moderationMode")}</Button>
      </header>

      <div className="bento-grid admin-blog-cards">
        {mockBlogs.map((blog) => (
          <article className="card-shell surface-hover" key={blog.id}>
            <div className="flex-between">
              <Badge tone="info">{t(`status.${blog.status}`, blog.status)}</Badge>
              <span className="text-muted">{formatCompactMetric(blog.views, t)}</span>
            </div>
            <h2>{blog.name}</h2>
            <p>{t("pages.adminBlogs.cardMeta", { count: blog.posts, owner: blog.owner })}</p>
          </article>
        ))}
      </div>

      <Table columns={columns} rows={mockBlogs} />
    </section>
  );
}

export default AdminBlogs;
