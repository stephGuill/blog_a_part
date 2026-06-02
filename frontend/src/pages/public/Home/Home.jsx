import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import SignupForm from "@components/auth/SignupForm/SignupForm";
import ConsentModal from "@components/legal/ConsentModal";
import { fetchBlogs } from "@services/blogsService";
import { fetchPosts } from "@services/postsService";

const cards = ["explorer", "consumer", "evolve"];

function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ blogs: 0, posts: 0, published: 0 });

  useEffect(() => {
    Promise.all([fetchBlogs(), fetchPosts()])
      .then(([blogs, posts]) => {
        const published = posts.filter((post) => post.status === "published");
        setStats({
          blogs: blogs.length,
          posts: posts.length,
          published: published.length,
        });
      })
      .catch(() => {
        setStats({ blogs: 0, posts: 0, published: 0 });
      });
  }, []);

  return (
    <section className="section">
      <ConsentModal />
      <div className="hero-grid">
        <div>
          <div className="eyebrow">{t("nav.home")}</div>
          <h1 className="hero-title">{t("pages.publicHome.title")}</h1>
          <p className="lead">{t("pages.publicHome.description")}</p>
          <div className="actions">
            <Link className="button button--primary" to="/blogs">
              {t("actions.viewBlogs")}
            </Link>
            <Link className="button" to="/contact">
              {t("actions.contactUs")}
            </Link>
          </div>
        </div>

        <aside className="panel home-signup-panel">
          <div className="card-kicker">Inscription rapide</div>
          <SignupForm />
        </aside>

        <aside className="panel">
          <div className="card-kicker">{t("pages.publicHome.quickPreview")}</div>
          <div className="hero-showcase">
            <div className="hero-showcase__masthead">
              <span>{t("pages.publicHome.activeEdition")}</span>
              <strong>BlogYoo Live</strong>
            </div>
            <div className="hero-showcase__headline">
              {t("pages.publicHome.showcaseHeadline")}
            </div>
            <div className="hero-showcase__line" />
          </div>
          <div className="stats-grid home-stats">
            <div className="stat-card">
              <div className="meta-label">{t("metrics.blogs")}</div>
              <div className="stat-value">{stats.blogs}</div>
            </div>
            <div className="stat-card">
              <div className="meta-label">{t("metrics.posts")}</div>
              <div className="stat-value">{stats.posts}</div>
            </div>
            <div className="stat-card">
              <div className="meta-label">{t("metrics.published")}</div>
              <div className="stat-value">{stats.published}</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="card-grid">
        {cards.map((cardKey) => (
          <article className="content-card" key={cardKey}>
            <div className="card-kicker">{t(`pages.publicHome.cards.${cardKey}.kicker`)}</div>
            <h2 className="card-title">{t(`pages.publicHome.cards.${cardKey}.title`)}</h2>
            <p>{t(`pages.publicHome.cards.${cardKey}.text`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Home;
