// Link : composant de navigation interne de React Router (génère un <a> sans rechargement de page)
import { Link } from "react-router-dom";

// Styles CSS propres à la page d'erreur 403
import "./Forbidden.css";

// Composant page : erreur 403 — accès interdit
// Affiché quand l'utilisateur tente d'accéder à une ressource sans les permissions nécessaires
function Forbidden() {
  return (
    // Section principale de la page d'erreur
    <section className="section">
      {/* Code d'erreur HTTP 403 affiché en bandeau eyebrow */}
      <div className="eyebrow">403</div>
      {/* Titre principal de la page d'erreur */}
      <h1 className="page-title">Acces interdit.</h1>
      {/* Lien de retour vers la page d'accueil — Link évite le rechargement complet de la page */}
      <Link className="button button--primary" to="/">Retour maison</Link>
    </section>
  );
}

// Export par défaut pour le routeur React
export default Forbidden;
