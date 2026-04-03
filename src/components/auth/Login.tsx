// src/components/auth/Login.tsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../lib/supabase";
import { useUser } from "../../context/UserContext";
import "./Login.css";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [showKeyIcon, setShowKeyIcon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!email.trim() || !companyCode.trim() || !password.trim()) {
      alert("Email, password, and company code are required");
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Fresh client for auth – no persistent storage, no lock contention
      const freshClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            storage: {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
            persistSession: false,
          },
        }
      );

      const { data: authData, error: authError } = await freshClient.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        if (authError.message === "Email not confirmed") {
          setErrorMsg("Please confirm your email address before logging in. Check your inbox or spam folder.");
        } else {
          alert(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        alert("Authentication failed");
        setLoading(false);
        return;
      }

      const authUserId = authData.user.id;

      // 2️⃣ Find company by code using admin client
      const { data: company, error: companyError } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("company_code", companyCode.trim())
        .single();

      if (companyError || !company) {
        alert("Invalid company code");
        setLoading(false);
        return;
      }

      // 3️⃣ Find user by auth_user_id and company_id using admin client
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, name, role, company_id")
        .eq("auth_user_id", authUserId)
        .eq("company_id", company.id)
        .single();

      if (userError || !user) {
        alert("User not found for this company. Please contact support.");
        setLoading(false);
        return;
      }

      // 4️⃣ Set user in context (sessionStorage will be handled by UserProvider)
      setUser({
        id: user.id,
        name: user.name,
        role: user.role,
        company_id: user.company_id,
        auth_user_id: authUserId,
      });

      // 5️⃣ Redirect based on role
      if (user.role === "owner") navigate("/pharmacy-admin");
      else navigate("/Pharmacist");
    } catch (err) {
      console.error("Login error:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      alert("Please enter your email address first.");
      return;
    }
    setResending(true);
    const freshClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
          persistSession: false,
        },
      }
    );
    const { error } = await freshClient.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Confirmation email resent. Please check your inbox.");
      setErrorMsg(null);
    }
    setResending(false);
  };

  // Long Press for Super Admin (unchanged)
  const handleLongPressStart = () => {
    longPressTimeout.current = setTimeout(() => setShowKeyIcon(true), 2000);
  };
  const handleLongPressEnd = () => {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
  };
  const handleKeyClick = () => navigate("/SuperAdminAuth/SuperAdminAuth");

  return (
    <div className="login-container">
      <div className="login-card">
        <h2
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
        >
          Login
        </h2>

        {showKeyIcon && <div className="key-icon-slide" onClick={handleKeyClick}>🔑</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || resending}
          />
          <input
            type="text"
            placeholder="Company Code"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value)}
            required
            disabled={loading || resending}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || resending}
          />
          {errorMsg && (
            <div style={{ color: "red", fontSize: "0.9rem", margin: "0.5rem 0" }}>
              {errorMsg}
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                style={{
                  marginLeft: "10px",
                  padding: "2px 8px",
                  fontSize: "0.8rem",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {resending ? "Sending..." : "Resend confirmation"}
              </button>
            </div>
          )}
          <button type="submit" disabled={loading || resending}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="signup-link">
          Don't have an account?{" "}
          <span
            style={{ color: "#4f46e5", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/auth/signup")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;