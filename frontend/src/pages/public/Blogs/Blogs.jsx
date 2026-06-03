// useEffect : déclenche le chargement des blogs au montage
// useMemo   : mémoïse la liste filtrée pour éviter de recalculer à chaque rendu
// useState  : gère la liste des blogs, la requête de recherche et l'état de chargement
import { useEffect, useMemo, useState } from "react";
// useTranslation : hook i18next pour traduire les labels et textes de la page
import { useTranslation } from "react-i18next";

// BlogCard : composant carte affichant les informations résumées d'un blog
import BlogCard from "@components/blog/BlogCard/BlogCard";
// fetchBlogs : GET /blogs — récupère la liste complète des blogs depuis le backend
import { fetchBlogs } from "@services/blogsService";

// Composant page : liste publique de tous les blogs de la plateforme.
// Fonctionnalités : chargement asynchrone, recherche en temps réel (filtre sur nom/slug/description),
// compteurs (total, publics, résultats filtrés), état de chargement et affichage conditionnel vide.
function Blogs() {
  // t() : fonction de traduction
  const { t } = useTranslation();
  // blogs : liste complète des blogs récupérés depuis l'API
  const [blogs, setBlogs] = useState([]);
  // query : texte saisi dans le champ de recherche
  const [query, setQuery] = useState("");
  // isLoading : true tant que la requête API est en cours
  const [isLoading, setIsLoading] = useState(true);

  // useEffect : charge les blogs une seule fois au montage du composant
  useEffect(() => {
    fetchBlogs()
      .then(setBlogs)          // Succès : stocke la liste
      .catch(() => setBlogs([]))  // Erreur : liste vide (pas de crash)
      .finally(() => setIsLoading(false)); // Termine le chargement dans tous les cas
  }, []); // Tableau vide : exécuté une seule fois

  // filteredBlogs : liste mémoïsée filtrée par la requête de recherche.
  // Se recalcule uniquement si `blogs` ou `query` change.
  const filteredBlogs = useMemo(() => {
    // Normalisation : suppression des espaces et mise en minuscules pour la comparaison
    const normalizedQuery = query.trim().toLowerCase();

    // Si la requête est vide, retourner tous les blogs sans filtrage
    if (!normalizedQuery) {
      return blogs;
    }

    // Filtre : recherche dans le nom, le slug ET la description du blog
    return blogs.filter((blog) => {
      const searchable = `${blog.name} ${blog.slug} ${blog.description}`;
      return searchable.toLowerCase().includes(normalizedQuery);
    });
  }, [blogs, query]);

  // publicBlogs : sous-ensemble des blogs dont la visibilité est publique
  // is_public peut être 1 (MySQL TINYINT) ou true (booléen JSON)
  const publicBlogs = blogs.filter(
    (blog) => blog.is_public === 1 || blog.is_public === true
  );

  return (
    <section className="section">
      {/* Grille héro : titre + description à gauche, panneau de recherche à droite */}
      <div className="hero-grid">
        <div>
          <div className="eyebrow">{t("nav.blogs")}</div>
          <h1 className="page-title">{t("pages.blogs.title")}</h1>
          <p className="lead">{t("pages.blogs.description")}</p>
        </div>

        {/* Panneau de recherche avec compteurs dynamiques */}
        <aside className="panel search-panel">
          {/* Champ de recherche : filtre en temps réel via onChange */}
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
          {/* Chips de statistiques : total, publics, résultats du filtre */}
          <div className="chip-row" style={{ marginTop: 16 }}>
            <span className="chip">{t("pages.blogs.blogCount", { count: blogs.length })}</span>
            <span className="chip">{t("pages.blogs.publicCount", { count: publicBlogs.length })}</span>
            <span className="chip">{t("pages.blogs.resultCount", { count: filteredBlogs.length })}</span>
          </div>
        </aside>
      </div>

      {/* Affichage conditionnel : spinner de chargement OU grille de BlogCards */}
      {isLoading ? (
        <div className="content-card empty-card">{t("pages.blogs.loading")}</div>
      ) : (
        <div className="blog-grid">
          {/* Un BlogCard par blog filtré — key sur l'id pour la réconciliation React */}
          {filteredBlogs.map((blog) => (
            <BlogCard blog={blog} key={blog.id} />
          ))}
        </div>
      )}

      {/* Message vide : affiché seulement si le chargement est terminé et la liste filtrée est vide */}
      {!isLoading && filteredBlogs.length === 0 ? (
        <div className="content-card empty-card">
          {t("pages.blogs.empty")}
        </div>
      ) : null}
    </section>
  );
}

export default Blogs;
