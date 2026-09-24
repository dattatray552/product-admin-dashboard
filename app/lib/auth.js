import api from "./api";

export async function loginUser(username, password) {
  const response = await api.post("/auth/login", {
    username: username.trim(),
    password: password.trim(),
  });

  return response.data;
}