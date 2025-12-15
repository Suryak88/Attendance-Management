import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// const token = localStorage.getItem("token");
// if (token) {
//   api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
// }

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const res = await api.post("/users/refresh");

        localStorage.setItem("token", res.data.accessToken);
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${res.data.accessToken}`;

        original.headers["Authorization"] = `Bearer ${res.data.accessToken}`;

        return api(original);
      } catch (error) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }

    if (err.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(err);
  }
);

export default api;
