import api from "./client";

export async function getMe() {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch (err) {
    if (err.response?.status === 401) {
      return null;
    }
    throw err;
  }
}

export async function signup({ name, email, password }) {
  const { data } = await api.post("/auth/signup", { name, email, password });
  return data.user;
}

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data.user;
}

export async function logout() {
  const { data } = await api.post("/auth/logout");
  return data;
}

