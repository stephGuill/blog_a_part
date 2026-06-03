// Icônes lucide-react : Lightbulb (carte de recommandation), PlusCircle (créer un blog)
import { Lightbulb, PlusCircle } from "lucide-react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : étiquette de statut colorée
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec icône
import Button from "@components/ui/Button/Button";
// Données fictives : blogs et statistiques de l'owner (vues, articles, membres…)
import { mockBlogs, mockStats } from "@utils/mockData";
// Utilitaire de formatage compact des métriques (ex : 9500 → "9,5k")
import { formatCompactMetric } from "@utils/formatMetric";

// Styles CSS propres au tableau de bord owner
import "./OwnerDashboard.css";

// Composant page : tableau de bord de l'owner de blog
function OwnerDashboard() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  return (
    // Section principale de la page avec classes de mise en page
    <section className="by-page owner-dashboard">

      {/* En-tête : titre de la page + bouton de création d'un nouveau blog */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel traduit (ex : "Owner") */}
          <div className="by-eyebrow">{t("nav.owner")}</div>
          {/* Titre principal traduit (ex : "Votre espace owner") */}
          <h1>{t("pages.ownerDashboard.title")}</h1>
          {/* Description contextuelle traduite */}
          <p className="text-muted">{t("pages.ownerDashboard.description")}</p>
        </div>
        {/* Bouton d'action principal : crée un nouveau blog */}
        <Button icon={PlusCircle}>{t("actions.createBlog")}</Button>
      </header>

      {/* Grille bento des statistiques de l'owner (vues totales, articles publiés, membres…) */}
      {/* mockStats.owner : tableau d'objets stat — chaque stat est une carte analytique */}
      <div className="bento-grid">
        {mockStats.owner.map((stat) => (
          // Carte analytique pour chaque statistique
          <article className="analytics-card" key={stat.label}>
            {/* Badge de tendance positif (vert) : ex "+12%" */}
            <Badge tone="success">{stat.trend}</Badge>
            {/* Valeur principale formatée en notation compacte */}
            <strong>{formatCompactMetric(stat.value, t)}</strong>
            {/* Label de la métrique traduit via sa clé i18n */}
            <span>{t(stat.labelKey)}</span>
          </article>
        ))}
      </div>

      {/* Zone inférieure : deux panneaux côte à côte — recommandation et blogs récents */}
      <div className="dashboard-grid owner-panels">

        {/* Panneau gauche : carte de recommandation éditoriale (fond dégradé sky) */}
        <article className="card-shell owner-recommendation">
          {/* Icône ampoule symbolisant un conseil ou une astuce */}
          <Lightbulb size={26} />
          {/* Titre de la recommandation traduit */}
          <h2>{t("pages.ownerDashboard.recommendationTitle")}</h2>
          {/* Texte de recommandation traduit */}
          <p>{t("pages.ownerDashboard.recommendationText")}</p>
        </article>

        {/* Panneau droit : liste des 3 blogs les plus récents de l'owner */}
        <article className="card-shell owner-recent">
          {/* Label "Blogs récents" traduit */}
          <div className="by-eyebrow">{t("pages.ownerDashboard.recentBlogs")}</div>
          {/* .slice(0, 3) : limite l'affichage aux 3 premiers blogs du tableau */}
          {mockBlogs.slice(0, 3).map((blog) => (
            // Ligne d'un blog : nom + badge de statut
            <div className="top-blog-row" key={blog.id}>
              {/* Nom du blog en gras */}
              <strong>{blog.name}</strong>
              {/* Badge de statut traduit (ex : "Actif", "Archivé") */}
              <Badge tone="info">{t(`status.${blog.status}`, blog.status)}</Badge>
            </div>
          ))}
        </article>

      </div>
    </section>
  );
}

// Export par défaut pour le routeur React
export default OwnerDashboard;
