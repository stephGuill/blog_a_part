import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { fetchBlogById } from "@services/blogsService";
import { fetchPosts } from "@services/postsService";

const formatDateTime = (value) => {
  if (!value) {
    return "Date a venir";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchBlogById(id), fetchPosts()])
      .then(([blogData, postData]) => {
        setBlog(blogData);
        setPosts(postData);
      })
      .catch(() => {
        setBlog(null);
        setPosts([]);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const blogPosts = useMemo(
    () => posts.filter((post) => Number(post.blog_id) === Number(id)),
    [id, posts]
  );

  const publishedPosts = blogPosts.filter((post) => post.status === "published");

  if (isLoading) {
    return (
      <section className="section">
        <div className="content-card">Chargement du blog...</div>
      </section>
    );
  }

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
