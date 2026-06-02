import request from "./apiClient";

export const fetchThemes = () => request("/themes");
export const fetchThemeById = (id) => request(`/themes/${id}`);
export const createTheme = (data) =>
  request("/themes", { method: "POST", body: JSON.stringify(data) });
export const getThemes = fetchThemes;
export const updateTheme = (id, data) =>
  request(`/themes/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTheme = (id) => request(`/themes/${id}`, { method: "DELETE" });
