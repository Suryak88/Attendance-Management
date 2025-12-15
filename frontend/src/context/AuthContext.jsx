import { createContext, useState, useEffect } from "react";
import api from "../utils/axiosInstance";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const response = await api.post("/users/refresh");
        const { accessToken: newAccessToken, user: refreshedUser } =
          response.data;

        if (refreshedUser && newAccessToken) {
          login(refreshedUser, newAccessToken);
        }
      } catch (error) {
        logout();
      }
    };
    refreshUser();
  }, []);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenData);
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      api.defaults.headers.common["Authorization"] = null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
