// Icônes lucide-react utilisées dans la barre de navigation latérale.
// Chaque icône correspond à un groupe ou un élément de menu.
import {
  BarChart3,
  Brush,
  FileText,
  Flag,
  Home,
  LayoutDashboard,
  MessageSquareWarning,
  Newspaper,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
// useTranslation : fournit t() pour traduire les libellés du menu
import { useTranslation } from "react-i18next";
// NavLink : variante de Link qui applique automatiquement la classe "active" sur la route courante
import { NavLink } from "react-router-dom";

// Hook pour accéder au rôle et aux données de l'utilisateur connecté
import { useAuth } from "@hooks/useAuth";

// Styles CSS de la barre latérale (largeur, animation, version compact vs étendue)
import "./Sidebar.css";

const navGroups = [
  {
    labelKey: "sidebar.groups.general",
    items: [
      { labelKey: "nav.dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["user", "owner", "editor", "moderator"] },
      { labelKey: "nav.profile", to: "/dashboard/profile", icon: Users, roles: ["user", "owner", "editor", "moderator"] },
      { labelKey: "nav.settings", to: "/dashboard/settings", icon: Settings, roles: ["user", "owner", "editor", "moderator"] },
    ],
  },
  {
    labelKey: "sidebar.groups.admin",
    items: [
      { labelKey: "nav.platform", to: "/admin", icon: BarChart3, roles: ["admin"] },
      { labelKey: "nav.users", to: "/admin/users", icon: Users, roles: ["admin"] },
      { labelKey: "nav.blogs", to: "/admin/blogs", icon: Newspaper, roles: ["admin"] },
      { labelKey: "nav.themes", to: "/admin/themes", icon: Palette, roles: ["admin"] },
      { labelKey: "nav.reports", to: "/admin/reports", icon: Flag, roles: ["admin"] },
    ],
  },
  {
    labelKey: "sidebar.groups.production",
    items: [
      { labelKey: "nav.owner", to: "/owner", icon: Home, roles: ["owner"] },
      { labelKey: "nav.myBlogs", to: "/owner/blogs", icon: Newspaper, roles: ["owner"] },
      { labelKey: "nav.builder", to: "/owner/builder", icon: Brush, roles: ["owner"] },
      { labelKey: "nav.ownerThemes", to: "/owner/themes", icon: Palette, roles: ["owner"] },
      { labelKey: "nav.editor", to: "/editor", icon: PenLine, roles: ["owner", "editor"] },
      { labelKey: "nav.posts", to: "/editor/posts", icon: FileText, roles: ["owner", "editor"] },
      { labelKey: "nav.moderator", to: "/moderator", icon: ShieldCheck, roles: ["owner", "moderator"] },
      { labelKey: "nav.comments", to: "/moderator/comments", icon: MessageSquareWarning, roles: ["owner", "moderator"] },
    ],
  },
];

function Sidebar({ isOpen, onToggle }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.globalRole === "admin" || user?.role === "admin";
  const memberships = user?.blogMemberships || [];
  const roleSet = new Set([user?.role, ...memberships.map((membership) => membership.role)].filter(Boolean));
  const canSeeItem = (item) => isAdmin || item.roles.some((role) => roleSet.has(role));

  return (
    <aside className={`dashboard-sidebar ${isOpen ? "is-open" : "is-compact"}`}>
      <NavLink className="dashboard-brand" to="/" title={t("errors.backHome")}>
        <span className="dashboard-brand__mark">BY</span>
        <span className="dashboard-brand__text">
          <strong>{t("app.name")}</strong>
          <small>{t("sidebar.brandSubtitle")}</small>
        </span>
      </NavLink>

      <button
        className="dashboard-sidebar__toggle"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? t("actions.closeSidebar") : t("actions.openSidebar")}
        title={isOpen ? t("actions.closeSidebar") : t("actions.openSidebar")}
      >
        {isOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      </button>

      <nav className="dashboard-nav" aria-label={t("nav.dashboardNavigation")}>
        {navGroups.map((group) => {
          const items = group.items.filter(canSeeItem);

          if (items.length === 0) return null;

          return (
          <div className="dashboard-nav__group" key={group.labelKey}>
            <div className="dashboard-nav__label">{t(group.labelKey)}</div>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  className={({ isActive }) =>
                    `dashboard-nav__link ${isActive ? "is-active" : ""}`
                  }
                  end={item.to === "/dashboard" || item.to === "/admin" || item.to === "/owner" || item.to === "/editor" || item.to === "/moderator"}
                  key={item.to}
                  to={item.to}
                  data-label={t(item.labelKey)}
                  title={t(item.labelKey)}
                >
                  <Icon size={18} strokeWidth={2.1} />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </div>
        );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
