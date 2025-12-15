import { createContext, useState, useEffect } from "react";
import api from "../utils/axiosInstance";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load saat refresh (mount pertama)
  // useEffect(() => {
  //   const storedUser = localStorage.getItem("user");
  //   const storedToken = localStorage.getItem("token");

  //   if (storedUser) setUser(JSON.parse(storedUser));
  //   if (storedToken) setToken(storedToken);
  // }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));

        const res = await api.post("/users/refresh");

        setToken(res.data.accessToken);
        localStorage.setItem("token", res.data.accessToken);
      } catch (err) {
        console.error("Refresh Token failed:", err);
        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    };

    initAuth();
  }, []);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenData);
  };

  // const logout = () => {
  //   setUser(null);
  //   setToken(null);

  //   localStorage.removeItem("user");
  //   localStorage.removeItem("token");
  // };

  const logout = async () => {
    await api.post("/users/logout");
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
