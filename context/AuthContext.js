"use client";
import { createContext, useState, useEffect } from "react";
import { api, setAuthToken } from "../services/apiService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Saat aplikasi pertama kali load, cek token di localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        setAuthToken(token);
        // fetchMe();
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get("/auth/me"); // endpoint backend untuk info parent
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user", err);
      logout(); // jika token invalid
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const res = await api.post("/auth/login", { username, password });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      console.log("Login response:", res.data);
      setAuthToken(token);
      setUser(user);
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
