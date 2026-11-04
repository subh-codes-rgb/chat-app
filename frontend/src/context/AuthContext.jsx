import { useEffect, useState } from "react";

import api from "../api/axios";
import AuthContext from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("access"),
  );
  const [isLoading, setIsLoading] = useState(
    () => Boolean(localStorage.getItem("access")),
  );
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const handleTokenRefresh = (event) => setAccessToken(event.detail);
    const handleExpiredSession = () => {
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener("auth:token-refreshed", handleTokenRefresh);
    window.addEventListener("auth:expired", handleExpiredSession);
    return () => {
      window.removeEventListener("auth:token-refreshed", handleTokenRefresh);
      window.removeEventListener("auth:expired", handleExpiredSession);
    };
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    let active = true;
    api
      .get("accounts/me/")
      .then(({ data }) => {
        if (active) {
          setUser(data);
          setAuthError("");
        }
      })
      .catch((error) => {
        if (active) {
          if (error.response?.status === 401) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            setAccessToken(null);
            setUser(null);
          } else {
            setAuthError(
              "We couldn’t reconnect to your account. Check your connection and try again.",
            );
          }
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const login = async (username, password) => {
    const { data } = await api.post("accounts/token/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setAccessToken(data.access);

    try {
      const profile = await api.get("accounts/me/");
      setUser(profile.data);
      setAuthError("");
      return profile.data;
    } catch (error) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setAccessToken(null);
      setUser(null);
      setAuthError("");
      throw error;
    }
  };

  const register = async (userData) => {
    const { data } = await api.post("accounts/register/", userData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAccessToken(null);
    setUser(null);
  };

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken),
    isLoading,
    authError,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
