import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("aw_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch((err) => {
        // Ne supprimer le token que si le serveur confirme qu'il est invalide (401).
        // Sur erreur réseau / 5xx / timeout (ex: déploiement en cours), on garde
        // le token pour ne pas déconnecter l'utilisateur inutilement.
        if (err?.response?.status === 401) {
          localStorage.removeItem("aw_token");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("aw_token", r.data.access_token);
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (email, password, full_name, converted_from_demande_id = null) => {
    const r = await api.post("/auth/register", { email, password, full_name, converted_from_demande_id });
    localStorage.setItem("aw_token", r.data.access_token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (e) { /* token déjà invalide, on nettoie quand même */ }
    localStorage.removeItem("aw_token");
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const r = await api.post("/auth/forgot-password", { email });
    return r.data;
  };

  const resetPassword = async (token, new_password) => {
    const r = await api.post("/auth/reset-password", { token, new_password });
    return r.data;
  };

  const changePassword = async (current_password, new_password) => {
    const r = await api.put("/auth/change-password", { current_password, new_password });
    return r.data;
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, forgotPassword, resetPassword, changePassword }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
