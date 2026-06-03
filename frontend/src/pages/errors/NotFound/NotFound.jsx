// Link : composant de navigation interne de React Router (génère un <a> sans rechargement de page)
import { Link } from "react-router-dom";

// Styles CSS propres à la page d'erreur 404
import "./NotFound.css";

// Composant page : erreur 404 — page introuvable
// Affiché quand l'URL demandée ne correspond à aucune route définie dans le routeur React
function NotFound() {
  return (
    // Section principale de la page d'erreur
    <section className="section">
      {/* Code d'erreur HTTP 404 affiché en bandeau eyebrow */}
      <div className="eyebrow">404</div>
      {/* Titre principal de la page d'erreur */}
      <h1 className="page-title">Page introuvable.</h1>
      {/* Lien de retour vers la page d'accueil — Link évite le rechargement complet de la page */}
      <Link className="button button--primary" to="/">Retour maison</Link>
    </section>
  );
}

// Export par défaut pour le routeur React
export default NotFound;
