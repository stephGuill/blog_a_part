const requireGlobalRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.globalRole)) {
    return res.status(403).json({
      status: "error",
      message: "Accès interdit : rôle plateforme insuffisant.",
    });
  }

  return next();
};

module.exports = requireGlobalRole;
