// useEffect : charge l'article et son blog parent au montage ou à chaque changement d'id
// useState  : stocke l'article, le blog parent et l'état de chargement
import { useEffect, useState } from "react";
// Link : navigation interne React Router
// useParams : récupère le paramètre ":id" depuis l'URL (/posts/:id)
import { Link, useParams } from "react-router-dom";

// Services API : récupère l'article par id, puis son blog parent par blog_id
import { fetchBlogById } from "@services/blogsService";
import { fetchPostById } from "@services/postsService";

// formatDateTime : formate une date en texte long français avec heure.
// Retourne "Non publie" si la valeur est vide (article en brouillon sans date de publication).
const formatDateTime = (value) => {
  if (!value) {
    return "Non publie";
  }

  // Intl.DateTimeFormat : "3 juin 2026 à 14:30" en locale fr-FR
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

// Composant page : détail d'un article public (accessible via /posts/:id).
// Charge d'abord l'article par son id, puis son blog parent via blog_id.
// Affiche : métadonnées de l'article + contenu HTML + lien vers le blog parent.
function PostDetail() {
  // id : identifiant de l'article extrait du paramètre de route URL
  const { id } = useParams();
  // post : objet article récupéré depuis l'API (null si non chargé ou introuvable)
  const [post, setPost] = useState(null);
  // blog : objet blog parent de l'article (chargé après l'article via post.blog_id)
  const [blog, setBlog] = useState(null);
  // isLoading : true tant que les requêtes API sont en cours
  const [isLoading, setIsLoading] = useState(true);

  // useEffect : charge l'article puis son blog parent de manière séquentielle
  useEffect(() => {
    fetchPostById(id)
      .then(async (postData) => {
        setPost(postData);
        // Chargement séquentiel : le blog_id n'est connu qu'après avoir reçu l'article
        const blogData = await fetchBlogById(postData.blog_id);
        setBlog(blogData);
      })
      .catch(() => {
        // En cas d'échec : post null → affichera le message 404
        setPost(null);
        setBlog(null);
      })
      .finally(() => setIsLoading(false));
  }, [id]); // Dépendance sur id : recharge si navigation vers un autre article

  // État de chargement
  if (isLoading) {
    return (
      <section className="section">
        <div className="content-card">Chargement de l'article...</div>
      </section>
    );
  }

  // État 404 : article introuvable ou erreur API
  if (!post) {
    return (
      <section className="section">
        <div className="content-card">
          <div className="eyebrow">Introuvable</div>
          <h1 className="page-title">Cet article n'existe pas encore.</h1>
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
          <div className="actions" style={{ marginTop: 0 }}>
            <Link className="button" to="/blogs">
              Retour aux blogs
            </Link>
            {blog ? (
              <Link className="button" to={`/blogs/${blog.id}`}>
                Retour au blog
              </Link>
            ) : null}
          </div>
          <div className="eyebrow" style={{ marginTop: 26 }}>
            Details de l'article
          </div>
          <h1 className="page-title">{post.title}</h1>
          <p className="lead">{post.excerpt}</p>
        </div>

        <aside className="panel">
          <div className="card-kicker">Article meta</div>
          <div className="meta-list">
            <div>
              <div className="meta-label">Statut</div>
              <div>{post.status}</div>
            </div>
            <div>
              <div className="meta-label">Publication</div>
              <div>{formatDateTime(post.published_at)}</div>
            </div>
            <div>
              <div className="meta-label">Limace</div>
              <div>{post.slug}</div>
            </div>
            <div>
              <div className="meta-label">Blog parent</div>
              <div>{blog?.name || `#${post.blog_id}`}</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="meta-grid" style={{ marginTop: 36 }}>
        <article className="content-card article-content">
          <div className="card-kicker">Conference</div>
          <p>{post.content || "Le contenu detaille de l'article arrive bientot."}</p>
        </article>
        <aside className="form-card">
          <div className="card-kicker">Navigation</div>
          <div className="form-grid" style={{ marginTop: 18 }}>
            {blog ? (
              <Link className="button button--primary button--wide" to={`/blogs/${blog.id}`}>
                Voir le blog
              </Link>
            ) : null}
            <Link className="button button--wide" to="/blogs">
              Explorez tous les blogs
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default PostDetail;
