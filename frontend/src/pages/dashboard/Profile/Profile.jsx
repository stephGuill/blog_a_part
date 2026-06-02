import Avatar from "@components/ui/Avatar/Avatar";
import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import { useAuth } from "@hooks/useAuth";
import { getRedirectPathByRole } from "@utils/roleRedirect";
import { LayoutDashboard, Mail, ShieldCheck, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./Profile.css";

function Profile({ presentation = "page" }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const memberships = user?.blogMemberships || [];
  const isModal = presentation === "modal";
  const displayName = user?.full_name || user?.username || "Utilisateur BlogYoo";
  // FR: L'admin global garde son badge admin, les autres affichent leur dernier role attribue.
  // EN: The global admin keeps the admin badge, others display their latest assigned role.
  const role = user?.globalRole === "admin" ? "admin" : user?.role || "user";
  const dashboardPath = user?.globalRole === "admin" ? "/admin" : getRedirectPathByRole(user?.role);
  // FR: Un simple user reste cote public et n'a pas de lien vers le dashboard.
  // EN: A plain user stays on the public side and has no dashboard link.
  const hasDashboardAccess = dashboardPath !== "/profile";

  const content = (
    <article className={`profile-card card-shell ${isModal ? "is-modal" : ""}`}>
      {isModal ? (
        <button className="profile-modal__close" type="button" onClick={() => navigate("/")} title="Fermer">
          <X size={18} />
        </button>
      ) : null}

      <div className="profile-card__hero">
        <Avatar name={displayName} src={user?.avatar_url} />
        <div>
          <h2>{displayName}</h2>
          <p className="text-muted">@{user?.username || "blogyoo"}</p>
        </div>
        <Badge tone={role}>{role}</Badge>
      </div>

      <div className="profile-details">
        <div>
          <User size={17} />
          <span>Nom utilisateur</span>
          <strong>{user?.username || "Non renseigne"}</strong>
        </div>
        <div>
          <Mail size={17} />
          <span>E-mail</span>
          <strong>{user?.email || "Non renseigne"}</strong>
        </div>
        <div>
          <ShieldCheck size={17} />
          <span>Statut</span>
          <strong>{user?.status || (user?.is_active ? "active" : "inactive")}</strong>
        </div>
      </div>

      {memberships.length > 0 ? (
        <div className="profile-memberships">
          <h3>Rattachements blogs</h3>
          {memberships.map((membership) => (
            <div className="profile-membership" key={`${membership.blogId}-${membership.role}`}>
              <span>{membership.blogName || `Blog #${membership.blogId}`}</span>
              <Badge tone={membership.role}>{membership.role}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="profile-note">
          Votre compte est connecte cote front. Aucun role de dashboard ne vous est encore attribue.
        </p>
      )}

      {hasDashboardAccess ? (
        <Button icon={LayoutDashboard} onClick={() => navigate(dashboardPath)} type="button">
          Acceder au dashboard
        </Button>
      ) : null}
    </article>
  );

  if (isModal) {
    return (
      <section className="profile-modal-page" aria-label="Profil utilisateur">
        <div className="profile-modal__backdrop" />
        <div className="profile-modal__center">{content}</div>
      </section>
    );
  }

  return (
    <section className="by-page profile-page">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">
          Profil
          </div>
        <h1>
          Identité utilisateur.
          </h1>
        </div>
      </header>
      {content}
    </section>
  );
}

export default Profile;
