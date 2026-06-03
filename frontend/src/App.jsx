// Route : représente une route individuelle (chemin URL → composant à afficher)
// Routes : conteneur de toutes les routes, rend uniquement la première route qui correspond à l'URL
import { Route, Routes } from "react-router-dom";

// ProtectedRoute : garde de route qui redirige vers /signin si l'utilisateur n'est pas connecté
import ProtectedRoute from "@components/auth/ProtectedRoute";
// RoleRoute : garde de route qui redirige vers /403 si le rôle de l'utilisateur n'est pas autorisé
import RoleRoute from "@components/auth/RoleRoute";
// DashboardLayout : mise en page pour les pages protégées (sidebar de navigation, header du dashboard)
import DashboardLayout from "@components/layout/DashboardLayout/DashboardLayout";
// PublicLayout : mise en page pour les pages publiques (navbar publique et footer)
import PublicLayout from "@components/layout/PublicLayout/PublicLayout";

// Pages d'administration (réservées exclusivement au rôle "admin")
import AdminBlogs from "@pages/admin/AdminBlogs/AdminBlogs";            // Gestion de tous les blogs de la plateforme
import AdminDashboard from "@pages/admin/AdminDashboard/AdminDashboard"; // Tableau de bord d'administration globale
import AdminReports from "@pages/admin/AdminReports/AdminReports";       // Gestion des signalements de contenus
import AdminThemes from "@pages/admin/AdminThemes/AdminThemes";          // Gestion des thèmes visuels globaux
import AdminUsers from "@pages/admin/AdminUsers/AdminUsers";             // Gestion des comptes utilisateurs (CRUD, rôles)

// Pages d'authentification (accessibles aux visiteurs non connectés)
import ForgotPassword from "@pages/auth/ForgotPassword/ForgotPassword"; // Formulaire de réinitialisation du mot de passe
import Signin from "@pages/auth/Signin/Signin";                         // Formulaire de connexion
import Signup from "@pages/auth/Signup/Signup";                         // Formulaire d'inscription

// Pages du tableau de bord général (rôles : admin, owner, editor, moderator)
import Dashboard from "@pages/dashboard/Dashboard/Dashboard";  // Tableau de bord principal commun
import Profile from "@pages/dashboard/Profile/Profile";        // Page de profil utilisateur
import Settings from "@pages/dashboard/Settings/Settings";     // Page de paramètres du compte

// Pages éditeur (rôles : admin, editor)
import EditorDashboard from "@pages/editor/EditorDashboard/EditorDashboard"; // Tableau de bord de l'éditeur
import PostCreate from "@pages/editor/PostCreate/PostCreate";               // Formulaire de création d'un nouvel article
import PostEdit from "@pages/editor/PostEdit/PostEdit";                     // Formulaire de modification d'un article existant
import PostsList from "@pages/editor/PostsList/PostsList";                  // Liste des articles gérés par l'éditeur

// Pages d'erreur HTTP
import Forbidden from "@pages/errors/Forbidden/Forbidden"; // Page 403 — accès refusé (rôle insuffisant)
import NotFound from "@pages/errors/NotFound/NotFound";     // Page 404 — ressource ou URL introuvable

// Pages légales obligatoires (accessibles à tous les visiteurs)
import LegalNotice from "@pages/legal/LegalNotice";       // Mentions légales
import PrivacyPolicy from "@pages/legal/PrivacyPolicy";   // Politique de confidentialité (RGPD)
import TermsOfUse from "@pages/legal/TermsOfUse";         // Conditions générales d'utilisation

// Pages modérateur (rôles : admin, moderator)
import CommentsModeration from "@pages/moderator/CommentsModeration/CommentsModeration"; // File de modération des commentaires
import ModeratorDashboard from "@pages/moderator/ModeratorDashboard/ModeratorDashboard"; // Tableau de bord du modérateur

// Pages propriétaire de blog (rôles : admin, owner)
import BlogBuilder from "@pages/owner/BlogBuilder/BlogBuilder";          // Constructeur visuel de blog (drag & drop)
import OwnerBlogs from "@pages/owner/OwnerBlogs/OwnerBlogs";            // Liste des blogs du propriétaire connecté
import OwnerDashboard from "@pages/owner/OwnerDashboard/OwnerDashboard"; // Tableau de bord du propriétaire
import ThemeCustomizer from "@pages/owner/ThemeCustomizer/ThemeCustomizer"; // Personnalisation du thème visuel du blog

// Pages publiques (accessibles à tous les visiteurs, connectés ou non)
import About from "@pages/public/About/About";            // Page « À propos » de la plateforme
import BlogDetail from "@pages/public/BlogDetail/BlogDetail"; // Détail et contenu d'un blog public
import BlogExplore from "@pages/public/BlogExplore/BlogExplore"; // Exploration et découverte des blogs
import Contact from "@pages/public/Contact/Contact";      // Formulaire de contact
import Features from "@pages/public/Features/Features";   // Présentation des fonctionnalités de la plateforme
import Home from "@pages/public/Home/Home";               // Page d'accueil publique
import PostDetail from "@pages/public/PostDetail/PostDetail"; // Détail d'un article public
import Pricing from "@pages/public/Pricing/Pricing";     // Page de tarification des offres

// Composant principal de l'application : définit toute la structure de routage
function App() {
  return (
    // Routes : rend exclusivement la première Route dont le chemin correspond à l'URL courante
    <Routes>

      {/* ===== ROUTES PUBLIQUES (layout avec navbar publique + footer) ===== */}
      <Route element={<PublicLayout />}>
        {/* Page d'accueil accessible à tous les visiteurs */}
        <Route path="/" element={<Home />} />
        {/* Liste et exploration des blogs disponibles publiquement */}
        <Route path="/blogs" element={<BlogExplore />} />
        {/* Détail d'un blog identifié par son id dynamique (:id) */}
        <Route path="/blogs/:id" element={<BlogDetail />} />
        {/* Détail d'un article identifié par son id dynamique (:id) */}
        <Route path="/posts/:id" element={<PostDetail />} />
        {/* Page de tarification des offres de la plateforme */}
        <Route path="/pricing" element={<Pricing />} />
        {/* Page de présentation des fonctionnalités disponibles */}
        <Route path="/features" element={<Features />} />
        {/* Page « À propos » de la plateforme et de l'équipe */}
        <Route path="/about" element={<About />} />
        {/* Formulaire de contact pour joindre l'équipe */}
        <Route path="/contact" element={<Contact />} />
        {/* Pages légales obligatoires */}
        <Route path="/mentions-legales" element={<LegalNotice />} />
        <Route path="/conditions-utilisation" element={<TermsOfUse />} />
        <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
        {/* Formulaire d'inscription pour créer un nouveau compte */}
        <Route path="/signup" element={<Signup />} />
        {/* Formulaire de connexion avec email et mot de passe */}
        <Route path="/signin" element={<Signin />} />
        {/* Réinitialisation du mot de passe en cas d'oubli */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* FR: Le profil simple user reste dans le front public sous forme de modal.
            EN: The plain user profile stays in the public frontend as a modal. */}
        {/* Profil utilisateur accessible en public (affiché en modal) — connexion requise via ProtectedRoute */}
        <Route path="/profile" element={<ProtectedRoute><Profile presentation="modal" /></ProtectedRoute>} />
        {/* Page d'accès refusé (403) */}
        <Route path="/forbidden" element={<Forbidden />} />
        {/* Alias /403 vers la même page d'accès refusé */}
        <Route path="/403" element={<Forbidden />} />
        {/* Route catch-all : toute URL non reconnue affiche la page 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ===== ROUTES PRIVÉES (layout avec sidebar de navigation du dashboard) ===== */}
      <Route element={<DashboardLayout />}>
        {/* FR: Les routes dashboard excluent le role user simple.
            EN: Dashboard routes exclude the plain user role. */}

        {/* ----- Routes communes à tous les rôles avec accès dashboard ----- */}
        {/* Tableau de bord principal — accessible aux rôles : admin, owner, editor, moderator */}
        <Route path="/dashboard" element={<RoleRoute allowedRoles={["admin", "owner", "editor", "moderator"]}><Dashboard /></RoleRoute>} />
        {/* Page profil dans le dashboard — accessible aux rôles : admin, owner, editor, moderator */}
        <Route path="/dashboard/profile" element={<RoleRoute allowedRoles={["admin", "owner", "editor", "moderator"]}><Profile /></RoleRoute>} />
        {/* Paramètres du compte — accessible aux rôles : admin, owner, editor, moderator */}
        <Route path="/dashboard/settings" element={<RoleRoute allowedRoles={["admin", "owner", "editor", "moderator"]}><Settings /></RoleRoute>} />

        {/* ----- Routes administration (rôle admin uniquement) ----- */}
        {/* Tableau de bord d'administration globale de la plateforme */}
        <Route path="/admin" element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} />
        {/* Gestion complète des utilisateurs (CRUD, modification des rôles et statuts) */}
        <Route path="/admin/users" element={<RoleRoute allowedRoles={["admin"]}><AdminUsers /></RoleRoute>} />
        {/* Gestion de tous les blogs de la plateforme */}
        <Route path="/admin/blogs" element={<RoleRoute allowedRoles={["admin"]}><AdminBlogs /></RoleRoute>} />
        {/* Gestion des thèmes visuels globaux disponibles pour les propriétaires */}
        <Route path="/admin/themes" element={<RoleRoute allowedRoles={["admin"]}><AdminThemes /></RoleRoute>} />
        {/* Gestion des signalements de contenus inappropriés */}
        <Route path="/admin/reports" element={<RoleRoute allowedRoles={["admin"]}><AdminReports /></RoleRoute>} />

        {/* ----- Routes propriétaire de blog (admin ou owner) ----- */}
        {/* Tableau de bord du propriétaire de blog */}
        <Route path="/owner" element={<RoleRoute allowedRoles={["admin", "owner"]}><OwnerDashboard /></RoleRoute>} />
        {/* Liste des blogs appartenant au propriétaire connecté */}
        <Route path="/owner/blogs" element={<RoleRoute allowedRoles={["admin", "owner"]}><OwnerBlogs /></RoleRoute>} />
        {/* Constructeur visuel de blog (drag & drop de sections et de blocs de contenu) */}
        <Route path="/owner/builder" element={<RoleRoute allowedRoles={["admin", "owner"]}><BlogBuilder /></RoleRoute>} />
        {/* Personnalisation du thème visuel du blog */}
        <Route path="/owner/theme" element={<RoleRoute allowedRoles={["admin", "owner"]}><ThemeCustomizer /></RoleRoute>} />
        {/* Alias /owner/themes vers le même personnalisateur de thème */}
        <Route path="/owner/themes" element={<RoleRoute allowedRoles={["admin", "owner"]}><ThemeCustomizer /></RoleRoute>} />

        {/* ----- Routes éditeur (admin ou editor) ----- */}
        {/* Tableau de bord de l'éditeur */}
        <Route path="/editor" element={<RoleRoute allowedRoles={["admin", "editor"]}><EditorDashboard /></RoleRoute>} />
        {/* Liste de tous les articles de l'éditeur connecté */}
        <Route path="/editor/posts" element={<RoleRoute allowedRoles={["admin", "editor"]}><PostsList /></RoleRoute>} />
        {/* Formulaire de création d'un nouvel article */}
        <Route path="/editor/posts/create" element={<RoleRoute allowedRoles={["admin", "editor"]}><PostCreate /></RoleRoute>} />
        {/* Formulaire de modification d'un article existant (identifié par le paramètre :id) */}
        <Route path="/editor/posts/:id/edit" element={<RoleRoute allowedRoles={["admin", "editor"]}><PostEdit /></RoleRoute>} />

        {/* ----- Routes modérateur (admin ou moderator) ----- */}
        {/* Tableau de bord du modérateur */}
        <Route path="/moderator" element={<RoleRoute allowedRoles={["admin", "moderator"]}><ModeratorDashboard /></RoleRoute>} />
        {/* File de modération des commentaires (approuver / rejeter / supprimer) */}
        <Route path="/moderator/comments" element={<RoleRoute allowedRoles={["admin", "moderator"]}><CommentsModeration /></RoleRoute>} />
      </Route>
    </Routes>
  );
}

// Export du composant App pour qu'il soit importé dans main.jsx
export default App;
