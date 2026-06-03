// Icônes lucide-react : inspection et bouclier de modération
import { Eye, ShieldCheck } from "lucide-react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : étiquette de statut colorée
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec icône
import Button from "@components/ui/Button/Button";
// Table : tableau générique avec rendu de colonnes personnalisable
import Table from "@components/ui/Table/Table";
// Données fictives des blogs (nom, owner, posts, vues, statut)
import { mockBlogs } from "@utils/mockData";
// Formatage compact des métriques (ex : 12000 → "12k")
import { formatCompactMetric } from "@utils/formatMetric";

// Styles CSS propres à la page des blogs admin
import "./AdminBlogs.css";

// Composant page : gestion des blogs par l'administrateur
function AdminBlogs() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  // Définition des colonnes du tableau : chaque colonne a une clé, un label et un rendu optionnel
  const columns = [
    { key: "name", label: "Blog" },
    // Propriétaire du blog — traduit via la clé nav.owner
    { key: "owner", label: t("nav.owner") },
    // Nombre d'articles — traduit via la clé metrics.posts
    { key: "posts", label: t("metrics.posts") },
    {
      key: "views",
      label: t("metrics.views"),
      // render : affiche les vues formatées en compact (ex : 9500 → "9,5k")
      render: (row) => formatCompactMetric(row.views, t),
    },
    {
      key: "status",
      label: t("table.status"),
      // render : Badge coloré selon le statut — "danger" pour archivé, "success" sinon
      render: (row) => (
        <Badge tone={row.status === "archive" ? "danger" : "success"}>
          {t(`status.${row.status}`, row.status)}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      // render : bouton d'inspection pour accéder au détail du blog
      render: () => (
        <Button icon={Eye} variant="secondary">{t("common.inspect")}</Button>
      ),
    },
  ];

  return (
    // Section principale de la page des blogs admin
    <section className="by-page admin-blogs">

      {/* En-tête : titre + bouton de passage en mode modération */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel traduit */}
          <div className="by-eyebrow">{t("pages.adminBlogs.eyebrow")}</div>
          {/* Titre principal traduit */}
          <h1>{t("pages.adminBlogs.title")}</h1>
          {/* Description contextuelle traduite */}
          <p className="text-muted">{t("pages.adminBlogs.description")}</p>
        </div>
        {/* Bouton pour activer le mode modération des blogs */}
        <Button icon={ShieldCheck}>{t("actions.moderationMode")}</Button>
      </header>

      {/* Grille bento de cartes : aperçu visuel de chaque blog */}
      {/* mockBlogs.map() : itère sur tous les blogs fictifs pour afficher une carte */}
      <div className="bento-grid admin-blog-cards">
        {mockBlogs.map((blog) => (
          // Carte blog avec hover animé
          <article className="card-shell surface-hover" key={blog.id}>
            <div className="flex-between">
              {/* Badge de statut traduit (ex : "Actif", "Archivé") */}
              <Badge tone="info">{t(`status.${blog.status}`, blog.status)}</Badge>
              {/* Nombre de vues formaté en compact, affiché en texte atténué */}
              <span className="text-muted">{formatCompactMetric(blog.views, t)}</span>
            </div>
            {/* Nom du blog */}
            <h2>{blog.name}</h2>
            {/* Métadonnées : nombre d'articles + propriétaire (interpolés via i18n) */}
            <p>{t("pages.adminBlogs.cardMeta", { count: blog.posts, owner: blog.owner })}</p>
          </article>
        ))}
      </div>

      {/* Tableau complet avec toutes les colonnes définies ci-dessus */}
      <Table columns={columns} rows={mockBlogs} />

    </section>
  );
}

// Export par défaut pour le routeur React
export default AdminBlogs;
