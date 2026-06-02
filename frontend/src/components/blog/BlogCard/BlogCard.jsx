import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import "./BlogCard.css";

const formatDate = (value, language) => {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

function BlogCard({ blog }) {
  const { i18n, t } = useTranslation();
  const title = blog.name || blog.title || t("pages.blogs.untitled");
  const isPublic = blog.is_public === 1 || blog.is_public === true;

  return (
    <article className="blog-card">
      <div>
        <div className="chip-row">
          <span className="chip chip--dark">
            {isPublic ? t("status.public") : t("status.private")}
          </span>
          <span className="chip">{t(`status.${blog.status || "actif"}`, blog.status || "actif")}</span>
        </div>
        <h2 className="card-title">{title}</h2>
        <p>{blog.description || t("pages.blogs.defaultDescription")}</p>
      </div>

      <div>
        <div className="blog-card__meta">
          <div>
            <div className="meta-label">{t("pages.blogs.slug")}</div>
            <div>{blog.slug || "blog"}</div>
          </div>
          <div>
            <div className="meta-label">{t("pages.blogs.createdAt")}</div>
            <div>{formatDate(blog.created_at, i18n.language) || t("pages.blogs.upcomingDate")}</div>
          </div>
        </div>
        <Link className="button button--primary" to={`/blogs/${blog.id}`}>
          {t("actions.exploreBlog")}
        </Link>
      </div>
    </article>
  );
}

export default BlogCard;
