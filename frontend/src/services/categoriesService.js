import request from "./apiClient";

export const fetchCategories = () => request("/categories");
export const fetchCategoryById = (id) => request(`/categories/${id}`);
export const createCategory = (data) =>
  request("/categories", { method: "POST", body: JSON.stringify(data) });
export const getCategories = fetchCategories;
export const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: "DELETE" });
