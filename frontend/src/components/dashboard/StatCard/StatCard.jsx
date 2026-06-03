/* Import du CSS propre au composant StatCard. */
import "./StatCard.css";

/* Composant StatCard : carte d'affichage d'une statistique clé du tableau de bord.
   Utilisé pour afficher des métriques importantes : nombre d'articles, de commentaires, de vues, etc.
   Il reçoit ses données via des props (propriétés passées par le composant parent).

   Props (destructurées depuis l'objet props) :
   - label : string → libellé descriptif de la statistique (ex: "Articles publiés").
   - value : string | number → valeur numérique ou texte à afficher (ex: 42, "1.2k").

   Destructuration des props : `{ label, value }` est l'équivalent de `props.label` et `props.value`.
   C'est une syntaxe JavaScript ES6 qui extrait directement les propriétés de l'objet reçu. */
function StatCard({ label, value }) {
  return (
    /* Balise HTML sémantique <article> : représente un contenu indépendant et autonome.
       C'est la balise appropriée pour une carte de statistique (unité de contenu réutilisable).
       La classe "stat-card" applique les styles définis dans StatCard.css. */
    <article className="stat-card">

      {/* Libellé de la statistique : "meta-label" est une classe utilitaire pour les petits labels.
          Affiche le nom de la métrique (ex: "Articles publiés"). */}
      <div className="meta-label">{label}</div>

      {/* Valeur principale de la statistique : affichée en grand.
          "stat-value" est la classe qui applique la grande taille de police définie en CSS. */}
      <div className="stat-value">{value}</div>
    </article>
  );
}

/* Export par défaut pour permettre l'import dans les pages dashboard. */
export default StatCard;
