// useEffect : récupère les statistiques de la plateforme au montage du composant
// useState  : stocke les statistiques (blogs, posts, publiés) et les transmet à l'interface
import { useEffect, useState } from "react";
// useTranslation : hook i18next pour traduire tous les textes de la page
import { useTranslation } from "react-i18next";
// Link : navigation interne React Router (sans rechargement de page)
import { Link } from "react-router-dom";

// SignupForm : formulaire d'inscription rapide intégré dans le panneau latéral
import SignupForm from "@components/auth/SignupForm/SignupForm";
// ConsentModal : modale RGPD affichée lors de la première visite si aucun consentement n'a été enregistré
import ConsentModal from "@components/legal/ConsentModal";
// Services API pour récupérer les compteurs en temps réel depuis le backend
import { fetchBlogs } from "@services/blogsService";
import { fetchPosts } from "@services/postsService";

// Clés de traduction pour les trois cartes de valeur (explorer, consommer, évoluer)
const cards = ["explorer", "consumer", "evolve"];

// Composant page : page d'accueil publique (landing page) de la plateforme BlogYoo.
// Structure : ConsentModal RGPD + héro (titre + CTA + formulaire inscription + stats live) + grille de valeurs.
function Home() {
  // t() : fonction de traduction i18next
  const { t } = useTranslation();
  // stats : compteurs réels récupérés depuis l'API (blogs créés, articles au total, articles publiés)
  const [stats, setStats] = useState({ blogs: 0, posts: 0, published: 0 });

  // useEffect : déclenche en parallèle la récupération des blogs et articles au premier rendu
  useEffect(() => {
    Promise.all([fetchBlogs(), fetchPosts()])
      .then(([blogs, posts]) => {
        // Filtre les articles publiés (status === "published") pour la statistique dédiée
        const published = posts.filter((post) => post.status === "published");
        setStats({
          blogs: blogs.length,
          posts: posts.length,
          published: published.length,
        });
      })
      .catch(() => {
        // En cas d'échec API, les compteurs restent à 0 (pas de crash visible)
        setStats({ blogs: 0, posts: 0, published: 0 });
      });
  }, []); // Tableau de dépendances vide : exécuté une seule fois au montage

  return (
    <section className="section">
      {/* Modale RGPD : s'affiche automatiquement si aucun consentement légal n'est enregistré */}
      <ConsentModal />
      {/* Grille héro : 3 panneaux côte à côte (titre+CTA / formulaire inscription / stats) */}
      <div className="hero-grid">
        <div>
          {/* Bandeau eyebrow contextualisé traduit */}
          <div className="eyebrow">{t("nav.home")}</div>
          {/* Titre principal de la landing page */}
          <h1 className="hero-title">{t("pages.publicHome.title")}</h1>
          {/* Accroche sous le titre */}
          <p className="lead">{t("pages.publicHome.description")}</p>
          {/* Boutons d'action : explorer les blogs ou contacter l'équipe */}
          <div className="actions">
            <Link className="button button--primary" to="/blogs">
              {t("actions.viewBlogs")}
            </Link>
            <Link className="button" to="/contact">
              {t("actions.contactUs")}
            </Link>
          </div>
        </div>

        {/* Panneau d'inscription rapide : encapsule SignupForm dans une carte latérale */}
        <aside className="panel home-signup-panel">
          <div className="card-kicker">Inscription rapide</div>
          <SignupForm />
        </aside>

        {/* Panneau de statistiques live : compteurs récupérés depuis l'API */}
        <aside className="panel">
          <div className="card-kicker">{t("pages.publicHome.quickPreview")}</div>
          {/* Simulation d'un aperçu de blog avec titre et ligne de séparation */}
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
          {/* Grille de compteurs : blogs créés, articles totaux, articles publiés */}
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

      {/* Grille de cartes de valeur : 3 raisons d'utiliser BlogYoo (explorer, consommer, évoluer) */}
      <div className="card-grid">
        {cards.map((cardKey) => (
          // cardKey sert de clé React ET de segment de chemin de traduction i18n
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

// Export par défaut : composant utilisé par le routeur pour la route "/"
export default Home;
