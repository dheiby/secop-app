// Cliente para la API de autenticación SECOP
// En dev o localhost → API local. En producción → tunnel público.
const API_URL = (typeof window !== "undefined" && window.location.hostname !== "localhost")
  ? "https://api.giscaleingenieria.com"
  : "http://localhost:3001";

function getToken() {
  return sessionStorage.getItem("secop_jwt");
}
function setToken(t) {
  if (t) sessionStorage.setItem("secop_jwt", t);
  else sessionStorage.removeItem("secop_jwt");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  async login(username, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data.user;
  },

  async register(username, password, email) {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, email }),
    });
    setToken(data.token);
    return data.user;
  },

  logout() {
    setToken(null);
  },

  async me() {
    return apiFetch("/auth/me");
  },

  // Seguimientos
  async getSeguimientos() {
    return apiFetch("/seguimientos");
  },

  async addSeguimiento(proceso) {
    const proceso_id =
      proceso.id_del_proceso ||
      proceso.referencia_del_proceso ||
      proceso.nombre_del_procedimiento ||
      String(Date.now());
    return apiFetch("/seguimientos", {
      method: "POST",
      body: JSON.stringify({ proceso_id, proceso_data: proceso }),
    });
  },

  async removeSeguimiento(proceso) {
    const proceso_id =
      proceso.id_del_proceso ||
      proceso.referencia_del_proceso ||
      proceso.nombre_del_procedimiento;
    return apiFetch(`/seguimientos/${encodeURIComponent(proceso_id)}`, {
      method: "DELETE",
    });
  },

  // Admin
  async getUsers() {
    return apiFetch("/admin/users");
  },

  isOnline() {
    return !!getToken();
  },
};
