import request from "./apiClient";

export const fetchBlogs = () => request("/blogs");

export const fetchOwnerBlogs = () => request("/blogs?scope=mine");

export const fetchBlogById = (id) => request(`/blogs/${id}`);

export const getBlogs = fetchBlogs;
export const getBlogById = fetchBlogById;
export const createBlog = (data) =>
  request("/blogs", { method: "POST", body: JSON.stringify(data) });
export const updateBlog = (id, data) =>
  request(`/blogs/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteBlog = (id) => request(`/blogs/${id}`, { method: "DELETE" });
