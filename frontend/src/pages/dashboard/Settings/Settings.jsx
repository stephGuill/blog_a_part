// Icônes lucide-react utilisées dans les panneaux et sections des paramètres
import {
  Bell,         // Notifications
  BookOpen,     // Identité éditoriale (owner)
  CheckCircle2, // Indicateur audit/sécurité
  Eye,          // Preview / lisibilité
  FileText,     // Workflow articles (editor)
  Globe2,       // Standards publics (admin)
  Lock,         // Sécurité / actions sûres (moderator)
  Palette,      // Design / interface
  Save,         // Bouton de sauvegarde
  ShieldCheck,  // Sécurité plateforme
  SlidersHorizontal, // Workspace et publication
  Users,        // Gouvernance équipe
} from "lucide-react";
// useMemo : évite de recalculer les toggles visibles à chaque rendu
// useState : gère les états locaux du formulaire et des interrupteurs
import { useMemo, useState } from "react";

// Composants UI réutilisables
import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import Input from "@components/ui/Input/Input";
import Select from "@components/ui/Select/Select";
import Textarea from "@components/ui/Textarea/Textarea";
// ThemeToggle : interrupteur visuel clair/sombre
import ThemeToggle from "@components/ui/ThemeToggle/ThemeToggle";
// useAuth : hook exposant l'utilisateur connecté depuis le contexte d'auth
import { useAuth } from "@hooks/useAuth";
// useTheme : hook exposant le thème actif et la fonction de bascule
import { useTheme } from "@hooks/useTheme";

// Styles CSS propres à la page Paramètres
import "./Settings.css";

// Définition des toggles de notification disponibles, filtrés ensuite selon le rôle
// Chaque entrée : clé unique, label affiché, description courte, rôles autorisés
const baseToggles = [
  { key: "emailDigest", label: "Digest e-mail hebdomadaire", description: "Résumé des vues, articles et commentaires importants.", roles: ["admin", "owner", "editor", "moderator"] },
  { key: "securityAlerts", label: "Alertes de sécurité", description: "Connexion inhabituelle, changement de rôle ou tentative bloquée.", roles: ["admin", "owner", "editor", "moderator"] },
  { key: "editorMentions", label: "Mentions rédactionnelles", description: "Notification quand un brouillon demande une relecture.", roles: ["owner", "editor"] },
  { key: "moderationQueue", label: "File de modération", description: "Notification dès qu’un commentaire ou signalement devient urgent.", roles: ["admin", "owner", "moderator"] },
];

// Configuration complète des panneaux par rôle : titre, badge, sections d'information
// Permet de personnaliser entièrement l'interface Paramètres selon le rôle actif
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

// Fonction helper : résout le rôle à utiliser pour l'affichage des paramètres
// Priorité : admin global > rôle de membership (owner > editor > moderator) > rôle direct
function resolveSettingsRole(user) {
  // Admin global ou rôle direct "admin" : retourne "admin"
  if (user?.globalRole === "admin" || user?.role === "admin") return "admin";

  // Chercher le rôle le plus élevé dans les memberships de blogs
  const memberships = user?.blogMemberships || [];
  const priority = ["owner", "editor", "moderator"];
  const membershipRole = priority.find((role) => memberships.some((membership) => membership.role === role));

  // Retourner le rôle de membership, ou le rôle direct, ou "user" par défaut
  return membershipRole || user?.role || "user";
}

// Composant page Paramètres : interface adaptative selon le rôle de l'utilisateur connecté
function Settings() {
  // theme : "light" ou "dark" / toggleTheme : bascule entre les deux modes
  const { theme, toggleTheme } = useTheme();
  // user : objet utilisateur depuis le contexte d'authentification global
  const { user } = useAuth();
  // Rôle résolu pour personnaliser l'interface (admin, owner, editor, moderator)
  const role = resolveSettingsRole(user);
  // Configuration du panneau selon le rôle : eyebrow, titre, badge, sections
  const roleConfig = rolePanels[role] || rolePanels.editor;
  // savedMessage : message affiché après la sauvegarde du formulaire
  const [savedMessage, setSavedMessage] = useState("");
  // form : état du formulaire (langue, workflow, visibilité, modération, nom workspace)
  const [form, setForm] = useState({
    blogLanguage: "fr",
    // Les editors commencent en "pending" (soumission à validation), les autres en "manual"
    contentWorkflow: role === "editor" ? "pending" : "manual",
    defaultVisibility: "public",
    moderationLevel: "balanced",
    workspaceName: "BlogYoo Workspace",
  });
  // toggles : état booléen de chaque interrupteur de notification
  const [toggles, setToggles] = useState({
    emailDigest: true,
    editorMentions: true,
    // Les modérateurs ont la file de modération activée par défaut
    moderationQueue: role === "moderator",
    securityAlerts: true,
  });

  // visibleToggles : liste filtrée des toggles autorisés pour le rôle courant
  // useMemo évite de recalculer ce filtre si "role" n'a pas changé entre les rendus
  const visibleToggles = useMemo(
    () => baseToggles.filter((item) => item.roles.includes(role) || role === "admin"),
    [role]
  );

  // Gestionnaire générique des champs du formulaire
  // Lit name et value depuis l'événement pour mettre à jour le champ correspondant dans "form"
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  // Gestionnaire des toggles : inverse la valeur booléenne de la clé donnée
  const handleToggle = (key) => {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  };

  // Gestionnaire de soumission : empêche le rechargement et affiche le message de confirmation
  const handleSave = (event) => {
    event.preventDefault();
    // FR: Les reglages sont prets pour branchement API, mais restent locaux tant que l'endpoint settings n'existe pas.
    // EN: Settings are ready for API wiring, but remain local until the settings endpoint exists.
    setSavedMessage("Paramètres préparés et sauvegardés côté interface.");
  };

  return (
    // Section principale avec classes utilitaires de mise en page
    <section className="by-page settings-page">
      {/* En-tête : eyebrow + titre + description + badge de rôle */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel selon le rôle (ex : "Owner", "Editor"…) */}
          <div className="by-eyebrow">{roleConfig.eyebrow}</div>
          {/* Titre de la page paramètres selon le rôle */}
          <h1>{roleConfig.title}</h1>
          {/* Description contextuelle du périmètre de paramètres disponibles */}
          <p className="text-muted">{roleConfig.description}</p>
        </div>
        {/* Badge affichant le niveau d'accès (ex : "Gestion blog", "Accès global") */}
        <Badge tone={role}>{roleConfig.badge}</Badge>
      </header>

      {/* Message de confirmation après sauvegarde — rendu conditionnel */}
      {savedMessage ? <p className="settings-feedback">{savedMessage}</p> : null}

      {/* Grille hero : 3 cartes d'information sur le périmètre du rôle */}
      <div className="settings-hero-grid">
        {/* Itération sur les sections de la config du rôle */}
        {roleConfig.sections.map((section) => {
          // Récupération dynamique du composant icône à partir de la config
          const Icon = section.icon;

          return (
            // Carte d'information visuelle sur une fonctionnalité du rôle
            <article className="settings-insight card-shell" key={section.title}>
              {/* Icône encadrée dans un conteneur rond coloré */}
              <span className="settings-insight__icon"><Icon size={19} /></span>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          );
        })}
      </div>

      {/* Formulaire principal des paramètres */}
      <form className="settings-grid" onSubmit={handleSave}>

        {/* Panneau 1 : Workspace et publication */}
        <article className="settings-panel card-shell">
          <div className="settings-panel__header">
            <SlidersHorizontal size={20} />
            <div>
              <h2>Workspace et publication</h2>
              <p className="text-muted">Réglages utiles à la conception et à la gestion des blogs.</p>
            </div>
          </div>

          {/* Champ nom du workspace (libellé adapté selon le rôle admin vs autres) */}
          <Input id="workspaceName" label={role === "admin" ? "Nom du workspace plateforme" : "Nom du blog courant"} name="workspaceName" onChange={handleChange} value={form.workspaceName} />

          {/* Sélecteur de langue principale du blog */}
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

          {/* Sélecteur de visibilité par défaut des nouveaux articles/blogs */}
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

          {/* Sélecteur du workflow de publication : validation manuelle, directe ou par owner */}
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

        {/* Panneau 2 : Sécurité et gouvernance */}
        <article className="settings-panel card-shell">
          <div className="settings-panel__header">
            <Lock size={20} />
            <div>
              <h2>Sécurité et gouvernance</h2>
              <p className="text-muted">Contrôle des accès, modération et traçabilité.</p>
            </div>
          </div>

          {/* Sélecteur du niveau de modération des commentaires */}
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

          {/* Zone de texte pour une note interne de gouvernance (non envoyée à l'API ici) */}
          <Textarea
            id="governanceNote"
            label="Note interne"
            name="governanceNote"
            onChange={handleChange}
            placeholder="Ex: Les articles IA doivent passer en pending avant publication."
          />

          {/* Rappel visuel : les actions sensibles doivent être loguées */}
          <div className="settings-audit">
            <CheckCircle2 size={18} />
            <span>Les actions sensibles doivent être enregistrées dans les audit logs.</span>
          </div>
        </article>

        {/* Panneau 3 : Notifications — liste des toggles filtrés par rôle */}
        <article className="settings-panel card-shell">
          <div className="settings-panel__header">
            <Bell size={20} />
            <div>
              <h2>Notifications</h2>
              <p className="text-muted">Choisis les alertes utiles à ton rôle.</p>
            </div>
          </div>

          {/* Liste des interrupteurs de notifications autorisés pour ce rôle */}
          <div className="settings-toggle-list">
            {/* visibleToggles est calculé par useMemo selon le rôle courant */}
            {visibleToggles.map((item) => (
              // Bouton toggle cliquable : appelle handleToggle avec la clé de l'item
              <button className="settings-toggle" key={item.key} onClick={() => handleToggle(item.key)} type="button">
                {/* Indicateur visuel on/off : classe "is-on" si la valeur est vraie */}
                <span className={`settings-toggle__switch ${toggles[item.key] ? "is-on" : ""}`} />
                <span>
                  <strong>{item.label}</strong>
                  {/* Description courte du toggle */}
                  <small>{item.description}</small>
                </span>
              </button>
            ))}
          </div>
        </article>

        {/* Panneau 4 : Interface — bascule du thème clair/sombre */}
        <article className="settings-panel card-shell">
          <div className="settings-panel__header">
            <Palette size={20} />
            <div>
              <h2>Interface</h2>
              {/* Affiche le thème actif : "light" ou "dark" */}
              <p className="text-muted">Mode actuel : {theme}</p>
            </div>
          </div>

          {/* Composant bascule de thème : isDark true si thème sombre actif */}
          <ThemeToggle isDark={theme === "dark"} onToggle={toggleTheme} />
          {/* Rappel sur l'importance du contraste et de la lisibilité */}
          <div className="settings-audit">
            <Eye size={18} />
            <span>Contraste, lisibilité et confort de lecture restent prioritaires.</span>
          </div>
        </article>

        {/* Actions du formulaire : bouton de sauvegarde aligné à droite */}
        <div className="settings-actions">
          {/* Bouton de type "submit" déclenche handleSave via l'événement onSubmit du form */}
          <Button icon={Save} type="submit">Sauvegarder les paramètres</Button>
        </div>

      </form>
    </section>
  );
}

// Export par défaut pour le routeur React
export default Settings;
