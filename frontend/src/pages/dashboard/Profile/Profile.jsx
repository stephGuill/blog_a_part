// Composant Avatar : affiche l'image de profil ou les initiales de l'utilisateur
import Avatar from "@components/ui/Avatar/Avatar";
// Badge : affiche le rôle ou statut avec un style coloré
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec icône optionnelle
import Button from "@components/ui/Button/Button";
// useAuth : hook personnalisé qui expose l'utilisateur connecté depuis le contexte d'auth
import { useAuth } from "@hooks/useAuth";
// Utilitaire qui calcule le chemin de redirection selon le rôle (owner → /owner, editor → /editor…)
import { getRedirectPathByRole } from "@utils/roleRedirect";
// Icônes lucide-react utilisées dans la fiche profil
import { LayoutDashboard, Mail, ShieldCheck, User, X } from "lucide-react";
// useNavigate : hook React Router pour la navigation programmatique
import { useNavigate } from "react-router-dom";

// Styles CSS propres à la page profil
import "./Profile.css";

// Composant Profile : affiche la fiche identité de l'utilisateur connecté
// Prop "presentation" : "page" (page normale) ou "modal" (superposé en overlay plein écran)
function Profile({ presentation = "page" }) {
  // useNavigate : permet de rediriger vers une autre route via navigate(path)
  const navigate = useNavigate();
  // useAuth : récupère l'objet "user" depuis le contexte d'authentification global
  const { user } = useAuth();
  // Liste des appartenances à des blogs (rôles dans des blogs spécifiques)
  const memberships = user?.blogMemberships || [];
  // Détermine si le composant s'affiche en mode modal ou en page normale
  const isModal = presentation === "modal";
  // Nom d'affichage : priorité à full_name, puis username, sinon valeur par défaut
  const displayName = user?.full_name || user?.username || "Utilisateur BlogYoo";
  // FR: L'admin global garde son badge admin, les autres affichent leur dernier role attribue.
  // EN: The global admin keeps the admin badge, others display their latest assigned role.
  const role = user?.globalRole === "admin" ? "admin" : user?.role || "user";
  // Chemin de redirection vers le tableau de bord selon le rôle de l'utilisateur
  const dashboardPath = user?.globalRole === "admin" ? "/admin" : getRedirectPathByRole(user?.role);
  // FR: Un simple user reste cote public et n'a pas de lien vers le dashboard.
  // EN: A plain user stays on the public side and has no dashboard link.
  // true si l'utilisateur a accès à un tableau de bord (pas un simple "user" public)
  const hasDashboardAccess = dashboardPath !== "/profile";

  // Contenu principal de la fiche profil (partagé entre mode page et mode modal)
  const content = (
    // Carte profil : classe conditionnelle "is-modal" si présenté en modale
    <article className={`profile-card card-shell ${isModal ? "is-modal" : ""}`}>
      {/* Bouton de fermeture visible uniquement en mode modal */}
      {isModal ? (
        <button className="profile-modal__close" type="button" onClick={() => navigate("/")} title="Fermer">
          <X size={18} />
        </button>
      ) : null}

      {/* Zone hero : avatar + nom d'affichage + badge de rôle */}
      <div className="profile-card__hero">
        {/* Avatar : image ou initiales de l'utilisateur */}
        <Avatar name={displayName} src={user?.avatar_url} />
        <div>
          {/* Nom complet ou username de l'utilisateur */}
          <h2>{displayName}</h2>
          {/* Pseudo (username) affiché avec le préfixe @ */}
          <p className="text-muted">@{user?.username || "blogyoo"}</p>
        </div>
        {/* Badge coloré affichant le rôle actif (admin, owner, editor…) */}
        <Badge tone={role}>{role}</Badge>
      </div>

      {/* Détails de profil : username, email, statut du compte */}
      <div className="profile-details">
        <div>
          <User size={17} />
          <span>Nom utilisateur</span>
          {/* Valeur du pseudo ou message "Non renseigné" */}
          <strong>{user?.username || "Non renseigne"}</strong>
        </div>
        <div>
          <Mail size={17} />
          <span>E-mail</span>
          {/* Adresse e-mail ou message par défaut */}
          <strong>{user?.email || "Non renseigne"}</strong>
        </div>
        <div>
          <ShieldCheck size={17} />
          <span>Statut</span>
          {/* Statut du compte : "active", "suspended"… ou dérivé du flag is_active */}
          <strong>{user?.status || (user?.is_active ? "active" : "inactive")}</strong>
        </div>
      </div>

      {/* Section des appartenances à des blogs : rendu conditionnel */}
      {/* Si l'utilisateur a des memberships, on les liste ; sinon on affiche un message */}
      {memberships.length > 0 ? (
        <div className="profile-memberships">
          <h3>Rattachements blogs</h3>
          {/* Itération sur les memberships pour afficher chaque blog + rôle associé */}
          {memberships.map((membership) => (
            // Clé composite blogId + role pour éviter les doublons dans React
            <div className="profile-membership" key={`${membership.blogId}-${membership.role}`}>
              {/* Nom du blog ou identifiant numérique si le nom est absent */}
              <span>{membership.blogName || `Blog #${membership.blogId}`}</span>
              {/* Badge du rôle dans ce blog (owner, editor, moderator…) */}
              <Badge tone={membership.role}>{membership.role}</Badge>
            </div>
          ))}
        </div>
      ) : (
        // Message affiché quand l'utilisateur n'a aucun rôle de dashboard attribué
        <p className="profile-note">
          Votre compte est connecte cote front. Aucun role de dashboard ne vous est encore attribue.
        </p>
      )}

      {/* Bouton de redirection vers le dashboard — affiché seulement si l'utilisateur y a accès */}
      {hasDashboardAccess ? (
        <Button icon={LayoutDashboard} onClick={() => navigate(dashboardPath)} type="button">
          Acceder au dashboard
        </Button>
      ) : null}
    </article>
  );

  // Rendu conditionnel selon le mode d'affichage :
  // En mode modal : le contenu est centré sur un backdrop semi-transparent avec flou
  if (isModal) {
    return (
      // Section modale plein écran, positionnée en fixed pour couvrir toute la fenêtre
      <section className="profile-modal-page" aria-label="Profil utilisateur">
        {/* Fond semi-transparent avec effet de flou (backdrop-filter) */}
        <div className="profile-modal__backdrop" />
        {/* Centre le contenu de la modale verticalement et horizontalement */}
        <div className="profile-modal__center">{content}</div>
      </section>
    );
  }

  // En mode page normale : affichage standard dans le layout du dashboard
  return (
    <section className="by-page profile-page">
      <header className="by-page-header">
        <div>
          {/* Bandeau de catégorie */}
          <div className="by-eyebrow">
          Profil
          </div>
        {/* Titre de la page */}
        <h1>
          Identité utilisateur.
          </h1>
        </div>
      </header>
      {/* Contenu de la fiche profil (même que la version modale) */}
      {content}
    </section>
  );
}

// Export par défaut pour le routeur React
export default Profile;
