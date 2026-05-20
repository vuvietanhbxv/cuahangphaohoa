const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";
const TOKEN_KEY = "tincay360_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, { body, params, auth = false } = {}) {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.pathname + url.search, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let error;
    try {
      error = await res.json();
    } catch {
      error = { error: res.statusText };
    }
    const err = new Error(error.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = error;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  del: (path, opts) => request("DELETE", path, opts),
};

export const REGION_LABEL = { BAC: "Bắc", TRUNG: "Trung", NAM: "Nam" };
export const REGION_VALUES = ["BAC", "TRUNG", "NAM"];
