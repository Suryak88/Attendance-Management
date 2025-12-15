import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const res = await api.post("/users/refresh");
        const { accessToken } = res.data;

        // Update the default Authorization header for all subsequent requests
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        // Update the Authorization header for the original request and retry it
        original.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(original);
      } catch (error) {
        console.error("Session expired or invalid. Redirecting to login.", error);
        // Clear the Authorization header
        delete api.defaults.headers.common["Authorization"];
        // Redirect to login page
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
