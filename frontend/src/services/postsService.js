import request from "./apiClient";

export const fetchPosts = () => request("/posts");

export const fetchPostById = (id) => request(`/posts/${id}`);

export const getPosts = fetchPosts;
export const getPostById = fetchPostById;
export const createPost = (data) =>
  request("/posts", { method: "POST", body: JSON.stringify(data) });
export const updatePost = (id, data) =>
  request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePost = (id) => request(`/posts/${id}`, { method: "DELETE" });
