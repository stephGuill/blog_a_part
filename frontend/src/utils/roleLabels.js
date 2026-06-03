// utils/roleLabels.js
// Correspondances entre les identifiants de rôles (valeurs techniques en BDD)
// et leurs libellés affichés à l'interface utilisateur en français.
//
// Utilisé dans les tableaux d'administration, les badges de rôle et les sélecteurs
// pour éviter d'afficher les identifiants bruts ("admin", "owner"…) aux utilisateurs.
//
// Pour ajouter un rôle : ajouter une entrée ici ET dans roleRedirect.js si besoin.
export const roleLabels = {
  admin: "Administrateur",     // Super-administrateur de la plateforme
  owner: "Proprietaire",      // Propriétaire d'un blog
  editor: "Redacteur",        // Rédacteur de contenu
  moderator: "Moderateur",    // Modérateur de commentaires
  user: "Utilisateur",        // Utilisateur standard sans privilèges
};
