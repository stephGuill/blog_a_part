/* Outlet : composant React Router v6 qui représente l'emplacement où la page enfant sera rendue.
   Dans ce layout public, Outlet affiche le contenu spécifique de chaque page (accueil, blogs, etc.)
   entre le Header et le Footer. */
import { Outlet } from "react-router-dom";

/* Import du composant Footer (pied de page commun à toutes les pages publiques). */
import Footer from "../Footer/Footer";

/* Import du composant Header (en-tête commun avec logo, navigation, connexion). */
import Header from "../Header/Header";

/* Composant PublicLayout : structure partagée par toutes les pages accessibles sans connexion.
   Il assemble dans l'ordre : Header → contenu de la page → Footer.
   Toutes les routes publiques (accueil, blogs, à propos, contact, signin, signup) utilisent ce layout. */
function PublicLayout() {
  return (
    /* Conteneur global de la page publique.
       La classe "page-shell" applique le fond et le comportement CSS de base défini dans PublicLayout.css. */
    <div className="page-shell">

      {/* En-tête du site : logo, navigation principale, sélecteur de langue, thème, connexion. */}
      <Header />

      {/* Balise HTML sémantique <main> : contient le contenu principal de la page.
          Outlet est remplacé par le composant de la route active.
          Exemple : route "/" → Outlet affiche le composant HomePage.
                    route "/blogs" → Outlet affiche le composant BlogsPage. */}
      <main>
        <Outlet />
      </main>

      {/* Pied de page du site : liens, newsletter, réseaux sociaux, mentions légales. */}
      <Footer />
    </div>
  );
}

/* Export par défaut pour utilisation dans le fichier de routage principal (App.jsx ou router.jsx). */
export default PublicLayout;
