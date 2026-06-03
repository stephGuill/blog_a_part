/* Outlet : composant de React Router qui affiche la page enfant correspondant à la route active.
   Par exemple, si la route est /admin/posts, Outlet affiche le composant Posts à l'intérieur de ce layout. */
import { Outlet } from "react-router-dom";

/* useState : hook React permettant de déclarer une variable d'état locale dans un composant fonctionnel.
   Ici il gère l'ouverture/fermeture de la sidebar. */
import { useState } from "react";

/* Import du composant Sidebar (barre latérale de navigation du dashboard). */
import Sidebar from "../Sidebar/Sidebar";

/* Import du composant Topbar (barre supérieure du dashboard). */
import Topbar from "../Topbar/Topbar";

/* Import du fichier CSS propre à ce layout pour appliquer ses styles. */
import "./DashboardLayout.css";

/* Composant DashboardLayout : structure globale de toutes les pages du tableau de bord.
   Il compose la Sidebar, la Topbar et le contenu de la page courante via Outlet. */
function DashboardLayout() {
  /* État booléen isSidebarOpen : true = sidebar déployée, false = sidebar réduite.
     La valeur initiale est false (sidebar compacte au démarrage). */
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    /* Conteneur principal du layout dashboard.
       La classe CSS change dynamiquement selon l'état de la sidebar :
       - "is-sidebar-open"    → sidebar large (ex: 286px)
       - "is-sidebar-compact" → sidebar réduite (ex: 92px)
       Cette interpolation de template string permet d'appliquer un style CSS différent. */
    <div className={`dashboard-layout ${isSidebarOpen ? "is-sidebar-open" : "is-sidebar-compact"}`}>

      {/* Composant Sidebar :
          - isOpen  : prop booléenne qui indique à la Sidebar si elle est ouverte ou non.
          - onToggle : callback qui inverse l'état courant de isSidebarOpen.
            La fonction fléchée `(current) => !current` est la forme "fonctionnelle" de setState
            qui garantit de lire la valeur la plus récente de l'état (évite les bugs de closure). */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((current) => !current)}
      />

      {/* Zone principale à droite de la sidebar : contient la Topbar et le contenu de la page. */}
      <main className="dashboard-main">
        {/* Barre supérieure du dashboard (titre de page, profil utilisateur, notifications, etc.). */}
        <Topbar />

        {/* Outlet : point d'injection de la page enfant active.
            React Router remplace Outlet par le composant correspondant à la route imbriquée.
            Exemple : /admin/posts → Outlet affiche le composant PostsPage. */}
        <Outlet />
      </main>
    </div>
  );
}

/* Export par défaut du composant pour pouvoir l'importer dans le fichier de routes. */
export default DashboardLayout;
