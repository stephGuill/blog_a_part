const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/jwtConfig");
const models = require("../models");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Authentification requise.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const [rows] = await models.users.findSafeById(decoded.id);
    const user = rows[0];

    if (!user || !user.is_active || user.status !== "active") {
      return res.status(401).json({
        status: "error",
        message: "Authentification requise.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.role,
      status: user.status,
      globalRole: user.platform_role || (user.role === "admin" ? "admin" : "user"),
    };

    return next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      status: "error",
      message: "Token invalide ou expiré.",
    });
  }
};

const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, jwtSecret);
    const [rows] = await models.users.findSafeById(decoded.id);
    const user = rows[0];

    if (user && user.is_active && user.status === "active") {
      // FR: Auth facultative pour exposer les contenus publics tout en reconnaissant un membre connecté.
      // EN: Optional auth exposes public content while still recognizing a signed-in member.
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        status: user.status,
        globalRole: user.platform_role || (user.role === "admin" ? "admin" : "user"),
      };
    }

    return next();
  } catch (err) {
    return next();
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    const globalRole = req.user?.globalRole;
    const assignedRole = req.user?.role;

    if (!req.user || (!roles.includes(globalRole) && !roles.includes(assignedRole))) {
      return res.status(403).json({
        status: "error",
        message: "Accès interdit : rôle insuffisant.",
      });
    }

    return next();
  };
};

module.exports = {
  optionalProtect,
  protect,
  restrictTo,
};
