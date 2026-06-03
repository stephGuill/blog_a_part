// mockData.js : données fictives utilisées pour les démonstrations et les tests.
// Ces données simulent les réponses API sans appeler le backend.
//
// Structure :
//   - mockStats    : statistiques par rôle (admin, owner, editor, moderator)
//   - mockActivity : liste des dernières activités récentes

// mockStats : objet indexé par rôle, chaque entrée est un tableau de métriques.
// Chaque métrique : label (texte), labelKey (clé i18n), value (valeur), trend (évolution), tone (variante couleur)
export const mockStats = {
  admin: [
    { label: "Utilisateurs", labelKey: "metrics.users", value: "12.8k", trend: "+18%", tone: "info" },
    { label: "Blogs actifs", labelKey: "metrics.activeBlogs", value: "842", trend: "+9%", tone: "success" },
    { label: "Articles", labelKey: "metrics.posts", value: "18.4k", trend: "+24%", tone: "owner" },
    { label: "Revenus", labelKey: "metrics.revenue", value: "42k", trend: "+12%", tone: "admin" },
    { label: "Signalements", labelKey: "metrics.reports", value: "17", trend: "-6%", tone: "danger" },
  ],
  owner: [
    { label: "Blogs", labelKey: "metrics.blogs", value: "8", trend: "+2" },
    { label: "Vues", labelKey: "metrics.views", value: "128k", trend: "+21%" },
    { label: "Articles", labelKey: "metrics.posts", value: "146", trend: "+13" },
    { label: "Engagement", labelKey: "metrics.engagement", value: "8.7%", trend: "+1.4" },
  ],
  editor: [
    { label: "Brouillons", labelKey: "metrics.drafts", value: "12", trend: "+3" },
    { label: "A relire", labelKey: "metrics.reviewQueue", value: "5", trend: "stable" },
    { label: "Publies", labelKey: "metrics.published", value: "38", trend: "+8" },
  ],
  moderator: [
    { label: "A traiter", labelKey: "metrics.toProcess", value: "23", trend: "+4" },
    { label: "Urgents", labelKey: "metrics.urgent", value: "6", trend: "-2" },
    { label: "Resolus", labelKey: "metrics.resolved", value: "104", trend: "+18" },
  ],
};

export const mockUsers = [
  { id: 1, name: "Nadia Martin", email: "nadia@blogyoo.local", role: "admin", status: "actif", blogs: 4 },
  { id: 2, name: "Sophie Arnaud", email: "sophie@blogyoo.local", role: "owner", status: "actif", blogs: 12 },
  { id: 3, name: "Karim Ouali", email: "karim@blogyoo.local", role: "editor", status: "invite", blogs: 2 },
  { id: 4, name: "Lea Bernard", email: "lea@blogyoo.local", role: "moderator", status: "suspendu", blogs: 6 },
];

export const mockBlogs = [
  { id: 1, name: "Horizons technologiques", owner: "Sophie", status: "publie", posts: 38, views: "42k" },
  { id: 2, name: "Les chroniques de Sophie", owner: "Sophie", status: "actif", posts: 24, views: "18k" },
  { id: 3, name: "SALGAM MON ALTER EGO", owner: "Malik", status: "revision", posts: 8, views: "6k" },
  { id: 4, name: "Atelier editorial", owner: "Nadia", status: "archive", posts: 12, views: "9k" },
];

export const mockThemes = [
  { id: 1, name: "Editorial Cream", type: "blog", status: "actif", colors: ["#fff9f2", "#143d49", "#ff674f"] },
  { id: 2, name: "Sky Desk", type: "page", status: "beta", colors: ["#edf2f7", "#527da6", "#d8a94f"] },
  { id: 3, name: "Writer Studio", type: "post", status: "actif", colors: ["#1b2432", "#ffd6a5", "#8fb996"] },
];

export const mockReports = [
  { id: 1, target: "Commentaire #241", priority: "haute", status: "nouveau", reason: "Spam repetitif" },
  { id: 2, target: "Article IA", priority: "moyenne", status: "analyse", reason: "Contenu signale" },
  { id: 3, target: "Utilisateur demo", priority: "basse", status: "resolu", reason: "Profil incomplet" },
];

export const mockActivities = [
  { id: 1, label: "Nouveau blog publie par Sophie", labelKey: "activity.newBlogPublished", time: "il y a 12 min", timeKey: "time.twelveMinutesAgo" },
  { id: 2, label: "3 articles planifies cette semaine", labelKey: "activity.threePostsScheduled", time: "il y a 1 h", timeKey: "time.oneHourAgo" },
  { id: 3, label: "Signalement prioritaire pris en charge", labelKey: "activity.priorityReportHandled", time: "hier", timeKey: "time.yesterday" },
];

export const mockComments = [
  { id: 1, author: "Milo", article: "L'essor de l'IA", priority: "haute", status: "pending", content: "Message a verifier avant publication." },
  { id: 2, author: "Ana", article: "Dune critique", priority: "moyenne", status: "approved", content: "Commentaire utile avec lien externe." },
  { id: 3, author: "Guest", article: "Tech Horizons", priority: "basse", status: "spam", content: "Promotion douteuse." },
];
