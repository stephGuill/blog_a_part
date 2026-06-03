// Import du service de récupération des blogs (utilisé pour compter le total de blogs)
import { fetchBlogs } from "./blogsService";
// Import du service de récupération des articles (utilisé pour les statistiques de publication)
import { fetchPosts } from "./postsService";

// Calcule les statistiques globales du dashboard en récupérant blogs et articles en parallèle
export const fetchDashboardStats = async () => {
  // Promise.all : exécute les deux requêtes simultanément pour réduire le temps d'attente total
  const [blogs, posts] = await Promise.all([fetchBlogs(), fetchPosts()]);

  // Retourne un objet de statistiques agrégées depuis les données récupérées
  return {
    blogs: blogs.length,  // Nombre total de blogs enregistrés sur la plateforme
    posts: posts.length,  // Nombre total d'articles créés
    // Nombre d'articles dont le statut est "published" (article visible publiquement)
    published: posts.filter((post) => post.status === "published").length,
  };
};

// Aliases de fetchDashboardStats pour chaque rôle
// Tous les rôles partagent actuellement la même source de statistiques
export const getAdminStats = fetchDashboardStats;      // Statistiques pour le tableau de bord admin
export const getOwnerStats = fetchDashboardStats;      // Statistiques pour le tableau de bord owner
export const getEditorStats = fetchDashboardStats;     // Statistiques pour le tableau de bord editor
export const getModeratorStats = fetchDashboardStats;  // Statistiques pour le tableau de bord moderator
