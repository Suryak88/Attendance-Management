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
  if (
    token &&
    !config.url.includes("/users/refresh") &&
    !config.url.includes("/users/login")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url.includes("/users/refresh")
    ) {
      original._retry = true;

      try {
        const res = await api.post("/users/refresh");

        const newToken = res.data.accessToken;
        localStorage.setItem("token", newToken);

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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

// interceptor respon explanation:
// kalau ada hasil kirim hasil,
// kalau error, tampung reqnya di var original
// lalu jika respon kode 401, belum pernah diretry (firsttime), bukan req untuk refresh token lakukan
// tandai ini sebagai udah pernah dicoba
// coba minta token baru
// dapat lalu taro di localstorage
// api atau axiosInstance sekarang pakai token terbaru,
// req original yang tdi gagal dikasih token baru.
// lalu jalankan lagi request yang gagal sebelumnya namun skrng dengan token baru
