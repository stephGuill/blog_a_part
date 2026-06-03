/* Import du CSS propre au composant ActivityList. */
import "./ActivityList.css";

/* Composant ActivityList : liste des activités récentes du tableau de bord.
   Affiche les dernières actions réalisées (commentaires, publications, inscriptions, etc.).

   Props (destructurées) :
   - activities : tableau d'objets représentant les activités.
                  Valeur par défaut = [] (tableau vide) si la prop n'est pas fournie.
                  Syntaxe `activities = []` : valeur par défaut ES6 — évite les erreurs si
                  le parent oublie de passer la prop (map() sur undefined planterait sinon).
     Chaque objet activité doit avoir :
     - id    : identifiant unique (utilisé comme `key` React pour optimiser le re-rendu).
     - label : texte descriptif de l'activité (ex: "Nouvel article publié par Pierre"). */
function ActivityList({ activities = [] }) {
  return (
    /* Balise HTML sémantique <ul> (unordered list) : liste non ordonnée d'activités.
       La classe "activity-list" applique la grille CSS et le padding définis en CSS. */
    <ul className="activity-list">
      {/* Boucle .map() sur le tableau activities : génère un <li> pour chaque activité.
          - key={activity.id} : prop spéciale React (pas rendue en HTML) qui sert d'identifiant
            unique pour l'algorithme de réconciliation de React (optimisation du re-rendu DOM).
            Toujours utiliser une valeur stable et unique comme id plutôt que l'index du tableau. */}
      {activities.map((activity) => (
        <li key={activity.id}>{activity.label}</li>
      ))}
    </ul>
  );
}

/* Export par défaut pour l'import dans les pages dashboard. */
export default ActivityList;
