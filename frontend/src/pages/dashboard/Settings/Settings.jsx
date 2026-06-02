import {
  Bell,
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  Globe2,
  Lock,
  Palette,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import Input from "@components/ui/Input/Input";
import Select from "@components/ui/Select/Select";
import Textarea from "@components/ui/Textarea/Textarea";
import ThemeToggle from "@components/ui/ThemeToggle/ThemeToggle";
import { useAuth } from "@hooks/useAuth";
import { useTheme } from "@hooks/useTheme";

import "./Settings.css";

const baseToggles = [
  { key: "emailDigest", label: "Digest e-mail hebdomadaire", description: "Résumé des vues, articles et commentaires importants.", roles: ["admin", "owner", "editor", "moderator"] },
  { key: "securityAlerts", label: "Alertes de sécurité", description: "Connexion inhabituelle, changement de rôle ou tentative bloquée.", roles: ["admin", "owner", "editor", "moderator"] },
  { key: "editorMentions", label: "Mentions rédactionnelles", description: "Notification quand un brouillon demande une relecture.", roles: ["owner", "editor"] },
  { key: "moderationQueue", label: "File de modération", description: "Notification dès qu’un commentaire ou signalement devient urgent.", roles: ["admin", "owner", "moderator"] },
];

const rolePanels = {
  admin: {
    eyebrow: "Super admin",
    title: "Pilotage plateforme",
    description: "Garde le contrôle sur la sécurité, les rôles, les signalements et les standards de publication.",
    badge: "Accès global",
    sections: [
      { icon: ShieldCheck, title: "Sécurité plateforme", text: "Double validation pour les actions sensibles, audit logs et restrictions des comptes à risque." },
      { icon: Users, title: "Gouvernance rôles", text: "Attribution admin, owner, editor ou moderator avec traçabilité avant/après." },
      { icon: Globe2, title: "Standards publics", text: "SEO, langues, politique de contenu et état de publication global." },
    ],
  },
  owner: {
    eyebrow: "Owner",
    title: "Paramètres du blog",
    description: "Règle l’identité du blog, les collaborateurs, la publication et les options visibles publiquement.",
    badge: "Gestion blog",
    sections: [
      { icon: BookOpen, title: "Identité éditoriale", text: "Nom, slogan, langue principale, visibilité publique et thème du blog." },
      { icon: Users, title: "Équipe", text: "Invitations, rôles editor/moderator et permissions de publication." },
      { icon: Palette, title: "Design", text: "Palette, radius, typographie et expérience de lecture." },
    ],
  },
  editor: {
    eyebrow: "Editor",
    title: "Préférences rédactionnelles",
    description: "Prépare ton environnement d’écriture, les statuts par défaut et les notifications de relecture.",
    badge: "Rédaction",
    sections: [
      { icon: FileText, title: "Workflow articles", text: "Brouillon, pending, publication et aperçu avant validation." },
      { icon: Eye, title: "Preview", text: "Prévisualisation publique et vérification SEO avant soumission." },
      { icon: Bell, title: "Relecture", text: "Alertes quand un owner ou admin demande une correction." },
    ],
  },
  moderator: {
    eyebrow: "Moderator",
    title: "Paramètres de modération",
    description: "Priorise les commentaires, signalements et règles d’escalade pour garder les blogs propres.",
    badge: "Modération",
    sections: [
      { icon: ShieldCheck, title: "Seuils d’urgence", text: "Détection des commentaires sensibles et signalements multiples." },
      { icon: Bell, title: "Alertes", text: "Notifications sur les contenus à risque et réponses en attente." },
      { icon: Lock, title: "Actions sûres", text: "Masquer, approuver, supprimer ou escalader sans toucher aux paramètres critiques." },
    ],
  },
};

function resolveSettingsRole(user) {
  if (user?.globalRole === "admin" || user?.role === "admin") return "admin";

  const memberships = user?.blogMemberships || [];
  const priority = ["owner", "editor", "moderator"];
  const membershipRole = priority.find((role) => memberships.some((membership) => membership.role === role));

  return membershipRole || user?.role || "user";
}

function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const role = resolveSettingsRole(user);
  const roleConfig = rolePanels[role] || rolePanels.editor;
  const [savedMessage, setSavedMessage] = useState("");
  const [form, setForm] = useState({
    blogLanguage: "fr",
    contentWorkflow: role === "editor" ? "pending" : "manual",
    defaultVisibility: "public",
    moderationLevel: "balanced",
    workspaceName: "BlogYoo Workspace",
  });
  const [toggles, setToggles] = useState({
    emailDigest: true,
    editorMentions: true,
    moderationQueue: role === "moderator",
    securityAlerts: true,
  });

  const visibleToggles = useMemo(
    () => baseToggles.filter((item) => item.roles.includes(role) || role === "admin"),
    [role]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleToggle = (key) => {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    // FR: Les reglages sont prets pour branchement API, mais restent locaux tant que l'endpoint settings n'existe pas.
    // EN: Settings are ready for API wiring, but remain local until the settings endpoint exists.
    setSavedMessage("Paramètres préparés et sauvegardés côté interface.");
  };

  return (
    <section className="by-page settings-page">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{roleConfig.eyebrow}</div>
          <h1>{roleConfig.title}</h1>
          <p className="text-muted">{roleConfig.description}</p>
        </div>
        <Badge tone={role}>{roleConfig.badge}</Badge>
      </header>

      {savedMessage ? <p className="settings-feedback">{savedMessage}</p> : null}

      <div className="settings-hero-grid">
        {roleConfig.sections.map((section) => {
          const Icon = section.icon;

          return (
            <article className="settings-insight card-shell" key={section.title}>
              <span className="settings-insight__icon"><Icon size={19} /></span>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          );
        })}
      </div>

      <form className="settings-grid" onSubmit={handleSave}>
        <article className="settings-panel card-shell">
          <div className="settings-panel__header">
            <SlidersHorizontal size={20} />
            <div>
              <h2>Workspace et publication</h2>
              <p className="text-muted">Réglages utiles à la conception et à la gestion des blogs.</p>
            </div>
          </div>

          <Input id="workspaceName" label={role === "admin" ? "Nom du workspace plateforme" : "Nom du blog courant"} name="workspaceName" onChange={handleChange} value={form.workspaceName} />

          <Select
            id="blogLanguage"
            label="Langue principale"
            name="blogLanguage"
            onChange={handleChange}
            value={form.blogLanguage}
            options={[
              { label: "Français", value: "fr" },
              { label: "English", value: "en" },
              { label: "العربية", value: "ar" },
              { label: "Español", value: "es" },
            ]}
          />

          <Select
            id="defaultVisibility"
            label="Visibilité par défaut"
            name="defaultVisibility"
            onChange={handleChange}
            value={form.defaultVisibility}
            options={[
              { label: "Public", value: "public" },
              { label: "Privé", value: "private" },
              { label: "Non listé", value: "unlisted" },
            ]}
          />

          <Select
            id="contentWorkflow"
            label="Workflow de publication"
            name="contentWorkflow"
            onChange={handleChange}
            value={form.contentWorkflow}
            options={[
              { label: "Validation owner/admin", value: "pending" },
              { label: "Publication manuelle", value: "manual" },
              { label: "Publication directe", value: "direct" },
            ]}
          />
        </article>

        <article className="settings-panel card-shell">
          <div className="settings-panel__header">
            <Lock size={20} />
            <div>
              <h2>Sécurité et gouvernance</h2>
              <p className="text-muted">Contrôle des accès, modération et traçabilité.</p>
            </div>
          </div>

          <Select
            id="moderationLevel"
            label="Niveau de modération"
            name="moderationLevel"
            onChange={handleChange}
            value={form.moderationLevel}
            options={[
              { label: "Souple", value: "light" },
              { label: "Équilibré", value: "balanced" },
              { label: "Strict", value: "strict" },
            ]}
          />

          <Textarea
            id="governanceNote"
            label="Note interne"
            name="governanceNote"
            onChange={handleChange}
            placeholder="Ex: Les articles IA doivent passer en pending avant publication."
          />

          <div className="settings-audit">
            <CheckCircle2 size={18} />
            <span>Les actions sensibles doivent être enregistrées dans les audit logs.</span>
          </div>
        </article>

        <article className="settings-panel card-shell">
          <div className="settings-panel__header">
            <Bell size={20} />
            <div>
              <h2>Notifications</h2>
              <p className="text-muted">Choisis les alertes utiles à ton rôle.</p>
            </div>
          </div>

          <div className="settings-toggle-list">
            {visibleToggles.map((item) => (
              <button className="settings-toggle" key={item.key} onClick={() => handleToggle(item.key)} type="button">
                <span className={`settings-toggle__switch ${toggles[item.key] ? "is-on" : ""}`} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="settings-panel card-shell">
          <div className="settings-panel__header">
            <Palette size={20} />
            <div>
              <h2>Interface</h2>
              <p className="text-muted">Mode actuel : {theme}</p>
            </div>
          </div>

          <ThemeToggle isDark={theme === "dark"} onToggle={toggleTheme} />
          <div className="settings-audit">
            <Eye size={18} />
            <span>Contraste, lisibilité et confort de lecture restent prioritaires.</span>
          </div>
        </article>

        <div className="settings-actions">
          <Button icon={Save} type="submit">Sauvegarder les paramètres</Button>
        </div>
      </form>
    </section>
  );
}

export default Settings;
