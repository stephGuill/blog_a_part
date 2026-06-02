const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const apiBaseUrl = import.meta.env.VITE_API_URL || `${backendUrl.replace(/\/$/, "")}/api`;

export const getToken = () => window.localStorage.getItem("blogyoo_token");

const buildUrl = (endpoint) => {
  if (/^https?:\/\//.test(endpoint)) {
    return endpoint;
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${apiBaseUrl}${normalizedEndpoint}`;
};

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Erreur API.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiClient = {
  delete: (endpoint) => apiRequest(endpoint, { method: "DELETE" }),
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, body) =>
    apiRequest(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (endpoint, body) =>
    apiRequest(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
};

export default apiRequest;
