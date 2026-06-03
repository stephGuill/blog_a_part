/* useTranslation : hook react-i18next pour accéder à la fonction t() de traduction.
   Permet d'afficher les labels des boutons dans la langue active de l'interface. */
import { useTranslation } from "react-i18next";

/* Link : composant React Router qui génère un lien <a> sans rechargement de page.
   Différence avec NavLink : Link n'a pas de détection de route active (pas de classe "active").
   Préféré pour les liens d'action simples qui ne sont pas des éléments de navigation. */
import { Link } from "react-router-dom";

/* Import du CSS propre au composant QuickActions. */
import "./QuickActions.css";

/* Composant QuickActions : boutons d'action rapide du tableau de bord.
   Permet à l'utilisateur d'accéder directement aux actions principales :
   - Créer un nouvel article.
   - Accéder à la liste de ses blogs.
   Ce composant est sans props : il n'a pas de données dynamiques à recevoir. */
function QuickActions() {
  /* Destructuration : extrait uniquement `t` depuis useTranslation. */
  const { t } = useTranslation();

  return (
    /* Conteneur des boutons d'action.
       La classe "actions" applique le layout flexbox défini en CSS. */
    <div className="actions">

      {/* Lien vers la page de création d'un nouvel article.
          to="/editor/posts/create" → chemin React Router vers le formulaire de création.
          className="button button--primary" → style de bouton principal (fond coloré) défini globalement.
          t("actions.newPost") → traduit selon la langue active (ex: "Nouvel article", "New Post"). */}
      <Link className="button button--primary" to="/editor/posts/create">{t("actions.newPost")}</Link>

      {/* Lien vers la liste des blogs de l'utilisateur connecté.
          className="button" → style de bouton secondaire (fond discret) défini globalement.
          t("nav.myBlogs") → traduit (ex: "Mes blogs", "My Blogs"). */}
      <Link className="button" to="/owner/blogs">{t("nav.myBlogs")}</Link>
    </div>
  );
}

/* Export par défaut pour l'import dans les pages du tableau de bord. */
export default QuickActions;
