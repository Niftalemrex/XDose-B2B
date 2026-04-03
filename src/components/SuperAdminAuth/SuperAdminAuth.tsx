// src/components/SuperAdminAuth/SuperAdminAuth.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./SuperAdminAuth.css";

const SuperAdminAuth: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Fetch the stored super admin password from Supabase
      const { data, error: fetchError } = await supabase
        .from("super_admin")
        .select("password")
        .single();

      if (fetchError) throw fetchError;

      if (data?.password === password) {
        // Store a flag in localStorage or sessionStorage to indicate super admin login
        sessionStorage.setItem("super_admin_logged_in", "true");
        navigate("/super-admin", { replace: true });
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="superadmin-login-container">
      <div className="superadmin-login-card">
        <h2>Super Admin Login</h2>
        <p className="subtitle">Enter the super admin password to continue</p>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="superadmin-login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminAuth;