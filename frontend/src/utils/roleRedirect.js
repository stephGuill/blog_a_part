// utils/roleRedirect.js
// Détermine la route de redirection post-connexion selon le rôle de l'utilisateur.
// Utilisé par authService après un signin réussi pour envoyer l'utilisateur
// vers le bon tableau de bord selon ses droits.

// getRedirectPathByRole(role) : retourne le chemin React Router correspondant au rôle.
//   "admin"     → /admin     : console d'administration globale de la plateforme
//   "owner"     → /owner     : tableau de bord du propriétaire de blog
//   "editor"    → /editor    : interface de rédaction des articles
//   "moderator" → /moderator : file de modération des commentaires
//   default     → /profile   : page de profil pour les utilisateurs sans rôle spécifique
export function getRedirectPathByRole(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "owner":
      return "/owner";
    case "editor":
      return "/editor";
    case "moderator":
      return "/moderator";
    default:
      // Tous les rôles non reconnus (ex: "user") redirigent vers la page de profil
      return "/profile";
  }
}
