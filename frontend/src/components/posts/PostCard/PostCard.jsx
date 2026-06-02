import { Link } from "react-router-dom";

import "./PostCard.css";

function PostCard({ post }) {
  return (
    <article className="content-card">
      <div className="chip-row">
        <span className="chip chip--dark">{post.status}</span>
      </div>
      <h3 className="card-title">{post.title}</h3>
      <p>{post.excerpt}</p>
      <Link className="button button--primary" to={`/posts/${post.id}`}>
        Lire l'article
      </Link>
    </article>
  );
}

export default PostCard;
