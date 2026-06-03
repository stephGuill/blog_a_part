// useEffect : déclenche le chargement du blog et de ses articles dès que l'id change
// useMemo   : mémoïse les articles filtrés par blog pour éviter les recalculs
// useState  : gère les données du blog, la liste des articles et l'état de chargement
import { useEffect, useMemo, useState } from "react";
// Link : navigation React Router (sans rechargement de page)
// useParams : récupère le paramètre ":id" depuis l'URL (ex: /blogs/3 → id = "3")
import { Link, useParams } from "react-router-dom";

// Services API : récupère un blog par id et tous les articles de la plateforme
import { fetchBlogById } from "@services/blogsService";
import { fetchPosts } from "@services/postsService";

// formatDateTime : formate une date en texte long en français avec heure.
// Utilisée localement pour afficher les dates de création des articles.
// Retourne "Date a venir" si la valeur est vide ou null.
const formatDateTime = (value) => {
  if (!value) {
    return "Date a venir";
  }

  // Intl.DateTimeFormat avec locale fr-FR : "3 juin 2026 à 14:30"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

// Composant page : détail d'un blog public (accessible via /blogs/:id).
// Charge le blog et tous les articles de la plateforme puis filtre ceux appartenant à ce blog.
// Affiche : infos du blog + liste des articles publiés + gestion des états chargement/404.
function BlogDetail() {
  // id : identifiant du blog extrait de l'URL (:id paramètre de route)
  const { id } = useParams();
  // blog : objet blog récupéré depuis l'API (null tant que non chargé ou si introuvable)
  const [blog, setBlog] = useState(null);
  // posts : liste de tous les articles de la plateforme (filtrés ensuite par blog_id)
  const [posts, setPosts] = useState([]);
  // isLoading : true tant que les deux requêtes API sont en cours
  const [isLoading, setIsLoading] = useState(true);

  // useEffect : se ré-exécute à chaque changement de `id` (navigation entre blogs)
  useEffect(() => {
    // Chargement en parallèle : blog + liste de tous les articles (pour filtrer côté client)
    Promise.all([fetchBlogById(id), fetchPosts()])
      .then(([blogData, postData]) => {
        setBlog(blogData);
        setPosts(postData);
      })
      .catch(() => {
        // En cas d'échec : blog null → affichera le message 404
        setBlog(null);
        setPosts([]);
      })
      .finally(() => setIsLoading(false));
  }, [id]); // Dépendance sur id : recharge si l'utilisateur navigue vers un autre blog

  // blogPosts : articles appartenant à ce blog (filtrés par blog_id == id)
  // Number() : normalise les types (id URL est string, blog_id peut être number)
  const blogPosts = useMemo(
    () => posts.filter((post) => Number(post.blog_id) === Number(id)),
    [id, posts]
  );

  // publishedPosts : sous-ensemble des articles publiés de ce blog
  const publishedPosts = blogPosts.filter((post) => post.status === "published");

  // État de chargement : affiche un message temporaire pendant la récupération API
  if (isLoading) {
    return (
      <section className="section">
        <div className="content-card">Chargement du blog...</div>
      </section>
    );
  }

  // État 404 : le blog n'existe pas ou l'API a retourné une erreur
  if (!blog) {
    return (
      <section className="section">
        <div className="content-card">
          <div className="eyebrow">Introuvable</div>
          <h1 className="page-title">Ce blog n'existe pas encore.</h1>
          <Link className="button button--primary" to="/blogs">
            Retour aux blogs
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="detail-grid">
        <div>
          <Link className="button" to="/blogs">
            Retour aux blogs
          </Link>
          <div className="eyebrow" style={{ marginTop: 26 }}>
            Details du blog
          </div>
          <h1 className="page-title">{blog.name}</h1>
          <p className="lead">{blog.description}</p>
        </div>

        <aside className="panel">
          <div className="card-kicker">Meta</div>
          <div className="meta-list">
            <div>
              <div className="meta-label">Limace</div>
              <div>{blog.slug}</div>
            </div>
            <div>
              <div className="meta-label">Visibilite</div>
              <div>{blog.is_public ? "Publique" : "Privee"}</div>
            </div>
            <div>
              <div className="meta-label">Statut</div>
              <div>{blog.status}</div>
            </div>
            <div>
              <div className="meta-label">Mise a jour</div>
              <div>{formatDateTime(blog.updated_at || blog.created_at)}</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="stats-grid" style={{ marginTop: 36 }}>
        <div className="stat-card">
          <div className="meta-label">Les publications</div>
          <div className="stat-value">{blogPosts.length}</div>
        </div>
        <div className="stat-card">
          <div className="meta-label">Publies</div>
          <div className="stat-value">{publishedPosts.length}</div>
        </div>
        <div className="stat-card">
          <div className="meta-label">Theme</div>
          <div className="stat-value"># {blog.theme_id}</div>
        </div>
      </div>

      <div style={{ marginTop: 36 }}>
        <div className="eyebrow">Articles associes</div>
        <h2 className="card-title">Contenus remontes depuis /posts</h2>
        {blogPosts.length > 0 ? (
          <div className="card-grid">
            {blogPosts.map((post) => (
              <article className="content-card" key={post.id}>
                <div className="chip-row">
                  <span className="chip chip--dark">{post.status}</span>
                  <span className="chip">{formatDateTime(post.published_at)}</span>
                </div>
                <h3 className="card-title">{post.title}</h3>
                <p>{post.excerpt}</p>
                <Link className="button button--primary" to={`/posts/${post.id}`}>
                  Lire l'article
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="content-card empty-card">
            <div className="card-kicker">Aucun contenu</div>
            <p>Aucun article n'est encore associe a ce blog.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default BlogDetail;
