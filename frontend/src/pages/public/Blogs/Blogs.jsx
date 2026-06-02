import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import BlogCard from "@components/blog/BlogCard/BlogCard";
import { fetchBlogs } from "@services/blogsService";

function Blogs() {
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlogs()
      .then(setBlogs)
      .catch(() => setBlogs([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredBlogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return blogs;
    }

    return blogs.filter((blog) => {
      const searchable = `${blog.name} ${blog.slug} ${blog.description}`;
      return searchable.toLowerCase().includes(normalizedQuery);
    });
  }, [blogs, query]);

  const publicBlogs = blogs.filter(
    (blog) => blog.is_public === 1 || blog.is_public === true
  );

  return (
    <section className="section">
      <div className="hero-grid">
        <div>
          <div className="eyebrow">{t("nav.blogs")}</div>
          <h1 className="page-title">{t("pages.blogs.title")}</h1>
          <p className="lead">{t("pages.blogs.description")}</p>
        </div>

        <aside className="panel search-panel">
          <label className="card-kicker" htmlFor="blog-search">
            {t("common.search")}
          </label>
          <input
            className="search-input"
            id="blog-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("pages.blogs.searchPlaceholder")}
            type="search"
            value={query}
          />
          <div className="chip-row" style={{ marginTop: 16 }}>
            <span className="chip">{t("pages.blogs.blogCount", { count: blogs.length })}</span>
            <span className="chip">{t("pages.blogs.publicCount", { count: publicBlogs.length })}</span>
            <span className="chip">{t("pages.blogs.resultCount", { count: filteredBlogs.length })}</span>
          </div>
        </aside>
      </div>

      {isLoading ? (
        <div className="content-card empty-card">{t("pages.blogs.loading")}</div>
      ) : (
        <div className="blog-grid">
          {filteredBlogs.map((blog) => (
            <BlogCard blog={blog} key={blog.id} />
          ))}
        </div>
      )}

      {!isLoading && filteredBlogs.length === 0 ? (
        <div className="content-card empty-card">
          {t("pages.blogs.empty")}
        </div>
      ) : null}
    </section>
  );
}

export default Blogs;
