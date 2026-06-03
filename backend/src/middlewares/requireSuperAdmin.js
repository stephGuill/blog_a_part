// FR: Middleware dedie aux actions super admin de plateforme.
// EN: Middleware dedicated to platform super admin actions.

// Middleware Express dédié à la protection des routes réservées aux super-administrateurs de la plateforme
// Contrairement à requireGlobalRole('admin'), ce middleware utilise une déclaration de fonction nommée
// pour une meilleure lisibilité dans les traces de pile (stack traces) en cas d'erreur
function requireSuperAdmin(req, res, next) {
  // Résolution du rôle global de l'utilisateur en consultant plusieurs sources par ordre de priorité :
  // 1. globalRole    : rôle calculé et normalisé par le middleware "protect" lors de l'authentification
  // 2. platform_role : champ brut issu directement de la base de données (fallback si protect non appelé)
  // 3. role          : rôle applicatif générique (dernier recours)
  const globalRole = req.user?.globalRole || req.user?.platform_role || req.user?.role;

  // Si le rôle résolu n'est pas strictement "admin", l'accès à la route est refusé avec un 403 Forbidden
  if (globalRole !== "admin") {
    return res.status(403).json({
      success: false,   // Indique l'échec de la requête (format homogène avec d'autres réponses d'erreur)
      status: "error",
      message: "Acces interdit : super admin requis.",
    });
  }

  // Le rôle est "admin" : l'accès est autorisé, on passe au middleware ou contrôleur suivant
  return next();
}

// Export de la fonction pour utilisation dans les fichiers de routes protégées super admin
module.exports = requireSuperAdmin;
