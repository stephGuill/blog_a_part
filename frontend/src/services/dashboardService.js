import { fetchBlogs } from "./blogsService";
import { fetchPosts } from "./postsService";

export const fetchDashboardStats = async () => {
  const [blogs, posts] = await Promise.all([fetchBlogs(), fetchPosts()]);

  return {
    blogs: blogs.length,
    posts: posts.length,
    published: posts.filter((post) => post.status === "published").length,
  };
};

export const getAdminStats = fetchDashboardStats;
export const getOwnerStats = fetchDashboardStats;
export const getEditorStats = fetchDashboardStats;
export const getModeratorStats = fetchDashboardStats;
