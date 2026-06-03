// Middleware générique de contrôle du rôle global (rôle sur l'ensemble de la plateforme)
// Contrairement à restrictTo (qui vérifie aussi le rôle applicatif blog), requireGlobalRole
// vérifie exclusivement req.user.globalRole, c'est-à-dire le rôle de la plateforme
// Prend une liste de rôles autorisés en arguments variadiques (syntaxe rest "...")
// et retourne immédiatement un middleware Express (arrow function)
const requireGlobalRole = (...roles) => (req, res, next) => {
  // Si l'utilisateur n'est pas authentifié (req.user absent, le middleware protect n'a pas été appelé)
  // ou si son rôle global (platform_role) ne figure pas dans la liste des rôles autorisés, on refuse
  if (!req.user || !roles.includes(req.user.globalRole)) {
    return res.status(403).json({
      status: "error",
      message: "Accès interdit : rôle plateforme insuffisant.",
    });
  }

  // Le rôle global de l'utilisateur est présent dans la liste autorisée : on passe au middleware suivant
  return next();
};

// Export du middleware pour utilisation dans les fichiers de routes (ex: requireGlobalRole('admin', 'moderator'))
module.exports = requireGlobalRole;
