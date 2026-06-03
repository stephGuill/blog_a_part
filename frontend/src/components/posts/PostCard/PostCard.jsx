// Link : navigation interne React Router (génère un <a> sans rechargement)
import { Link } from "react-router-dom";

// Styles CSS de la carte d'article (ombre, espacement, chip de statut)
import "./PostCard.css";

// Composant PostCard : carte réutilisable affichant le résumé d'un article.
// Utilisé dans les listes de la page BlogDetail et dans le blog public.
// Props :
//   post — objet article contenant : id, title, excerpt, status
function PostCard({ post }) {
  return (
    <article className="content-card">
      {/* Rangée de chips : affiche le statut de l'article (ex : "published", "draft") */}
      <div className="chip-row">
        <span className="chip chip--dark">{post.status}</span>
      </div>
      {/* Titre de l'article */}
      <h3 className="card-title">{post.title}</h3>
      {/* Extrait de l'article (résumé court) */}
      <p>{post.excerpt}</p>
      {/* Lien vers la page de détail de l'article */}
      <Link className="button button--primary" to={`/posts/${post.id}`}>
        Lire l'article
      </Link>
    </article>
  );
}

// Export par défaut utilisé dans BlogDetail et autres listes d'articles
export default PostCard;
