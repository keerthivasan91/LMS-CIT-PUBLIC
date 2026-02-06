// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState, useCallback } from "react";
import api from "@/api/axiosConfig";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Login
   * - API call should be done outside (login page)
   * - This only updates state after success
   */
  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  /**
   * Logout
   * - Call backend to destroy session
   * - Then clear state and redirect
   */
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /**
   * Rehydrate session on app load
   * - Called once
   * - NO redirects here
   */
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser, // exposed for internal updates if needed
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
