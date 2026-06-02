import request from "./apiClient";

export const fetchComments = () => request("/comments");
export const fetchCommentById = (id) => request(`/comments/${id}`);
export const createComment = (data) =>
  request("/comments", { method: "POST", body: JSON.stringify(data) });
export const getComments = fetchComments;
export const moderateComment = (id, status) =>
  request(`/comments/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
export const deleteComment = (id) => request(`/comments/${id}`, { method: "DELETE" });
