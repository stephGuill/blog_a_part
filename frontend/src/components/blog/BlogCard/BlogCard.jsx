/* useTranslation : hook react-i18next pour accéder à t() (traduction) et i18n (instance i18next).
   - t    : traduit une clé en texte dans la langue active.
   - i18n : instance complète de i18next, utilisée ici pour accéder à i18n.language
            afin de formater la date selon la locale active. */
import { useTranslation } from "react-i18next";

/* Link : composant React Router pour les liens de navigation sans rechargement de page. */
import { Link } from "react-router-dom";

/* Import du CSS propre au composant BlogCard. */
import "./BlogCard.css";

/* Fonction utilitaire de formatage de date.
   Déclarée en dehors du composant car elle ne dépend pas du state/contexte React.
   La déclarer à l'extérieur évite de la recréer à chaque rendu.

   Paramètres :
   - value    : valeur de date brute (string ISO ou timestamp).
   - language : code de langue actif (ex: "fr", "en") pour localiser le format de date.

   Retour :
   - null si value est falsy (undefined, null, "") → le composant parent affichera une valeur de repli.
   - Chaîne de date formatée selon la locale : ex pour "fr" → "15 janvier 2025".

   Intl.DateTimeFormat : API JavaScript native de formatage internationalisé des dates.
   new Date(value) → convertit la chaîne ISO en objet Date JavaScript. */
const formatDate = (value, language) => {
  if (!value) {
    return null; /* Retourne null si pas de date (évite new Date(undefined) → "Invalid Date"). */
  }

  return new Intl.DateTimeFormat(language, {
    day: "numeric",    /* Affiche le jour en chiffre (ex: 15). */
    month: "long",     /* Affiche le mois en toutes lettres (ex: "janvier", "January"). */
    year: "numeric",   /* Affiche l'année en chiffres (ex: 2025). */
  }).format(new Date(value)); /* Convertit et formate la date. */
};

/* Composant BlogCard : carte d'affichage d'un blog dans une liste.
   Affiche les informations essentielles d'un blog : statut, titre, description, slug, date et lien.

   Props (destructurées) :
   - blog : objet contenant les données du blog depuis l'API.
     Propriétés attendues : name, title, is_public, status, description, slug, created_at, id. */
function BlogCard({ blog }) {
  /* Destructuration : extrait i18n (pour la langue) et t (pour la traduction). */
  const { i18n, t } = useTranslation();

  /* Titre du blog : priorité name → title → traduction de "sans titre".
     L'opérateur || retourne le premier élément "truthy" (non vide, non null, non undefined).
     Si blog.name existe et est non vide → utilisé.
     Sinon blog.title → utilisé.
     Sinon texte traduit "Untitled" / "Sans titre". */
  const title = blog.name || blog.title || t("pages.blogs.untitled");

  /* Détermine si le blog est public.
     L'API peut retourner is_public comme entier (1/0) ou booléen (true/false) selon le contexte.
     `=== 1 || === true` couvre les deux cas pour plus de robustesse. */
  const isPublic = blog.is_public === 1 || blog.is_public === true;

  return (
    /* Balise HTML sémantique <article> : contenu autonome et réutilisable (une carte de blog).
       La classe "blog-card" applique les styles définis en CSS. */
    <article className="blog-card">

      {/* Bloc supérieur : badges de statut + titre + description. */}
      <div>
        {/* Ligne de chips (badges) : visibilité et statut de publication.
            "chip-row" est une classe utilitaire pour aligner les chips horizontalement. */}
        <div className="chip-row">
          {/* Chip de visibilité : "Public" ou "Privé" selon is_public. */}
          <span className="chip chip--dark">
            {/* Ternaire : si isPublic → t("status.public") → "Public", sinon "Privé". */}
            {isPublic ? t("status.public") : t("status.private")}
          </span>

          {/* Chip de statut de publication : actif, brouillon, archivé, etc.
              Template literal → construit la clé i18n dynamiquement.
              Ex: blog.status = "actif" → clé = "status.actif" → traduit en "Actif".
              Le 2ème argument de t() est la valeur de repli si la clé n'existe pas. */}
          <span className="chip">{t(`status.${blog.status || "actif"}`, blog.status || "actif")}</span>
        </div>

        {/* Titre du blog. */}
        <h2 className="card-title">{title}</h2>

        {/* Description ou texte par défaut si pas de description. */}
        <p>{blog.description || t("pages.blogs.defaultDescription")}</p>
      </div>

      {/* Bloc inférieur : métadonnées (slug, date) + bouton d'action. */}
      <div>
        {/* Grille de métadonnées : deux colonnes (slug + date de création). */}
        <div className="blog-card__meta">
          {/* Colonne "Slug" : identifiant URL du blog (ex: "mon-blog-photos"). */}
          <div>
            <div className="meta-label">{t("pages.blogs.slug")}</div>
            {/* blog.slug ?? "blog" : opérateur nullish coalescing — retourne "blog" si slug est null/undefined. */}
            <div>{blog.slug || "blog"}</div>
          </div>

          {/* Colonne "Date de création" : formatée selon la locale active.
              formatDate retourne null si pas de date → || affiche le texte de repli traduit. */}
          <div>
            <div className="meta-label">{t("pages.blogs.createdAt")}</div>
            {/* i18n.language : langue active (ex: "fr") passée à formatDate pour localiser la date. */}
            <div>{formatDate(blog.created_at, i18n.language) || t("pages.blogs.upcomingDate")}</div>
          </div>
        </div>

        {/* Lien vers la page de détail du blog.
            Template literal `/blogs/${blog.id}` → construit l'URL dynamiquement (ex: "/blogs/42").
            Link de React Router évite un rechargement de page. */}
        <Link className="button button--primary" to={`/blogs/${blog.id}`}>
          {t("actions.exploreBlog")}
        </Link>
      </div>
    </article>
  );
}

/* Export par défaut pour l'import dans les pages de liste de blogs. */
export default BlogCard;
