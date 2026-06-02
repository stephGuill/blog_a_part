// FR: Middleware dedie aux actions super admin de plateforme.
// EN: Middleware dedicated to platform super admin actions.

function requireSuperAdmin(req, res, next) {
  const globalRole = req.user?.globalRole || req.user?.platform_role || req.user?.role;

  if (globalRole !== "admin") {
    return res.status(403).json({
      success: false,
      status: "error",
      message: "Acces interdit : super admin requis.",
    });
  }

  return next();
}

module.exports = requireSuperAdmin;
