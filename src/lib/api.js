import { apiPrefixFor } from "./tenants";

// VITE_API_BASE_URL pointe déjà vers ".../api" (voir .env) — on le réduit à
// l'origine pure ici pour pouvoir recomposer librement avec apiPrefixFor
// (qui inclut déjà "/api" ou "/api/<tenant>").
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const ORIGIN = RAW_BASE.replace(/\/api\/?$/, "");

const TOKEN_KEY = "panel_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(url, options = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    // FormData (upload de fichier) : ne jamais fixer Content-Type nous-mêmes,
    // le navigateur doit poser le boundary multipart lui-même.
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message = (body && (body.message || body.error)) || `Erreur ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return body;
}

// Requête vers le namespace global /api/panel/* (non lié à un événement).
export function panelApi(path, options = {}) {
  return request(`${ORIGIN}/api/panel${path}`, options);
}

// Requête vers une route "ancien système" propre à un événement (candidats,
// tickets, retraits, solde, réglages...).
export function tenantApi(tenantKey, path, options = {}) {
  const prefix = apiPrefixFor(tenantKey);
  return request(`${ORIGIN}${prefix}${path}`, options);
}

export { ApiError };
