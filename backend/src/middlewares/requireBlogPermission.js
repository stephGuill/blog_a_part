// Importation de l'index des modèles pour interroger la base de données
const models = require("../models");
// Importation des utilitaires de permissions :
// - getPermissionsForBlogRole : retourne la liste des permissions accordées à un rôle dans un blog
// - hasGlobalAdminAccess     : vérifie si l'utilisateur est admin global (bypass toutes les restrictions)
const { getPermissionsForBlogRole, hasGlobalAdminAccess } = require("../utils/permissions");

// Fonction utilitaire : génère une réponse HTTP 403 Forbidden spécifique aux accès blog refusés
const forbidden = (res) =>
  res.status(403).json({ status: "error", message: "Accès interdit à ce blog." });

// Fonction asynchrone : résout dynamiquement l'identifiant du blog depuis différentes sources de la requête
// Permet au middleware de fonctionner uniformément sur de nombreux types de routes imbriquées
const resolveBlogId = async (req) => {
  // Cas 1 : le paramètre :blogId est directement présent dans l'URL (ex: /blogs/:blogId/posts)
  if (req.params.blogId) return Number(req.params.blogId);
  // Cas 2 : le blog_id est transmis dans le corps de la requête (création d'article, etc.)
  if (req.body.blog_id) return Number(req.body.blog_id);

  // Cas 3 : la route utilise :id et concerne directement un blog (ex: /blogs/:id)
  // On détecte le contexte grâce à req.baseUrl qui contient le chemin de base du routeur
  if (req.params.id && req.baseUrl.includes("blogs")) {
    return Number(req.params.id);
  }

  // Cas 4 : la route concerne un article – on remonte jusqu'au blog parent de cet article
  if (req.params.id && req.baseUrl.includes("posts")) {
    const [rows] = await models.posts.findWithBlog(req.params.id);
    return rows[0]?.blog_id; // Opérateur optional chaining pour éviter une erreur si rows[0] est undefined
  }

  // Cas 5 : la route concerne un commentaire – on remonte jusqu'au blog via l'article associé
  if (req.params.id && req.baseUrl.includes("comments")) {
    const [rows] = await models.comments.findWithPostAndBlog(req.params.id);
    return rows[0]?.blog_id;
  }

  // Cas 6 : la route concerne un signalement (report) – on récupère le blog associé au signalement
  if (req.params.id && req.baseUrl.includes("reports")) {
    const [rows] = await models.reports.find(req.params.id);
    return rows[0]?.blog_id;
  }

  // Aucune source ne permet de résoudre le blogId : retour null (provoquera un 403)
  return null;
};

// Middleware générique basé sur les permissions de blog (RBAC par blog)
// Prend le nom d'une permission en paramètre et retourne un middleware asynchrone de vérification
// Exemple d'utilisation : router.post('/', protect, requireBlogPermission('create_post'), handler)
const requireBlogPermission = (permission) => async (req, res, next) => {
  // Court-circuit : les admins globaux contournent toutes les vérifications de membership blog
  if (hasGlobalAdminAccess(req.user)) {
    return next();
  }

  try {
    // Résolution dynamique de l'identifiant du blog depuis les différentes sources de la requête
    const blogId = await resolveBlogId(req);

    // Si aucun blogId n'a pu être résolu (route non reconnue ou ressource sans blog), accès refusé
    if (!blogId) {
      return forbidden(res);
    }

    // Vérification en base que l'utilisateur est bien un membre actif de ce blog spécifique
    const [rows] = await models.blogMembers.findActiveByUserAndBlog(req.user.id, blogId);
    const membership = rows[0]; // Premier (et unique) résultat : le membership de l'utilisateur

    // Si l'utilisateur n'est pas membre (ou n'est plus membre actif) du blog, accès refusé
    if (!membership) {
      return forbidden(res);
    }

    // Récupération de la liste complète des permissions associées au rôle du membre dans ce blog
    // Ex: un "editor" aura ["create_post", "edit_own_post"], un "owner" aura plus de permissions
    const permissions = getPermissionsForBlogRole(membership.role);

    // Vérification que la permission requise (passée en argument) est bien incluse dans la liste
    if (!permissions.includes(permission)) {
      return forbidden(res);
    }

    // Attachement des données d'accès au blog sur req.blogAccess
    // Permet aux contrôleurs suivants de réutiliser ces données sans nouvelle requête SQL
    req.blogAccess = { blogId, membership, permissions };
    return next(); // Permission accordée : on passe au middleware ou contrôleur suivant
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// Export du middleware générique pour utilisation dans les fichiers de routes
module.exports = requireBlogPermission;
