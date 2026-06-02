import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { fetchBlogById } from "@services/blogsService";
import { fetchPostById } from "@services/postsService";

const formatDateTime = (value) => {
  if (!value) {
    return "Non publie";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPostById(id)
      .then(async (postData) => {
        setPost(postData);
        const blogData = await fetchBlogById(postData.blog_id);
        setBlog(blogData);
      })
      .catch(() => {
        setPost(null);
        setBlog(null);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <section className="section">
        <div className="content-card">Chargement de l'article...</div>
      </section>
    );
  }

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
