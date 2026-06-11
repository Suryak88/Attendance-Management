import { createContext, useState, useEffect } from "react";
import api from "../utils/axiosInstance";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [subordinates, setSubordinates] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });

  useEffect(() => {
    if (!user) return;

    const fetchSubordinates = async () => {
      try {
        const res = await api.get("/users/subordinates");
        setSubordinates(res.data);
      } catch (err) {
        console.error("Failed to fetch subordinates", err);
      }
    };

    fetchSubordinates();
  }, [user]);

  const login = (userData, tokenData) => {
    // setUser({
    //   regnum: userData.regnum,
    //   nama: userData.nama,
    // });
    setUser(userData);
    setToken(tokenData);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenData);

    api.defaults.headers.common["Authorization"] = `Bearer ${tokenData}`;
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
    <AuthContext.Provider value={{ user, token, subordinates, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
