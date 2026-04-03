// src/components/auth/Signup.tsx
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "../../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"create" | "join">("create");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [createdCompanyCode, setCreatedCompanyCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateCode = (name: string) => {
    const prefix = name.substring(0, 2).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Company code copied!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    console.log("=== SIGNUP START ===");
    console.log("Mode:", mode);
    console.log("Name:", name);
    console.log("Email:", email);

    if (!email.trim()) {
      alert("Email is required");
      setIsSubmitting(false);
      return;
    }
    if (!password.trim()) {
      alert("Password is required");
      setIsSubmitting(false);
      return;
    }

    const customUserId = uuidv4();
    let company_id = "";

    try {
      // -----------------------
      // CREATE COMPANY (OWNER) – use admin client
      // -----------------------
      if (mode === "create") {
        if (!companyName.trim()) {
          alert("Enter a company name");
          setIsSubmitting(false);
          return;
        }

        const code = generateCode(companyName);
        console.log("Generated company code:", code);

        const { data: company, error: companyError } = await supabaseAdmin
          .from("companies")
          .insert({
            name: companyName,
            company_code: code,
            approval_status: "pending",
          })
          .select()
          .single();

        if (companyError || !company) {
          console.error("Company creation error:", companyError);
          alert(companyError?.message || "Failed to create company");
          setIsSubmitting(false);
          return;
        }

        company_id = company.id;
        setCreatedCompanyCode(code);
        alert(`Company created! Share this code with your pharmacists: ${code}`);
        console.log("Company created:", { id: company_id, code });
      }

      // -----------------------
      // JOIN COMPANY (PHARMACIST) – use admin client
      // -----------------------
      if (mode === "join") {
        if (!companyCode.trim()) {
          alert("Enter a company code");
          setIsSubmitting(false);
          return;
        }

        console.log("Looking for company with code:", companyCode);
        const { data: company, error } = await supabaseAdmin
          .from("companies")
          .select("*")
          .eq("company_code", companyCode)
          .single();

        if (error || !company) {
          console.error("Company fetch error:", error);
          alert("Invalid company code");
          setIsSubmitting(false);
          return;
        }

        company_id = company.id;
        console.log("Company found:", { id: company_id, name: company.name });
      }

      // -----------------------
      // CREATE AUTH USER – use a fresh client with no persistent storage
      // -----------------------
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

      console.log("Attempting to create auth user with email:", email);
      const { data: authData, error: authError } = await freshClient.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error("Auth signup error:", authError);
        alert(`Auth error: ${authError.message}`);
        setIsSubmitting(false);
        return;
      }

      if (!authData.user) {
        console.error("No user returned from auth signup");
        alert("Failed to create auth user");
        setIsSubmitting(false);
        return;
      }

      const authUserId = authData.user.id;
      console.log("Auth user created:", { id: authUserId, email: authData.user.email });

      // -----------------------
      // INSERT INTO CUSTOM USERS TABLE – use admin client
      // -----------------------
      console.log("Inserting into custom users table...");
      const { error: userError } = await supabaseAdmin.from("users").insert({
        id: customUserId,
        name,
        email,
        company_id,
        role: mode === "create" ? "owner" : "pharmacist",
        auth_user_id: authUserId,
      });

      if (userError) {
        console.error("User insert error:", userError);
        alert(`Failed to create user record: ${userError.message}`);
        setIsSubmitting(false);
        return;
      }

      console.log("User record created successfully");
      console.log("=== SIGNUP COMPLETE ===");

      navigate("/auth/login");
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Sign Up</h2>

        <div className="mode-toggle">
          <button
            onClick={() => setMode("create")}
            className={mode === "create" ? "active" : ""}
            disabled={isSubmitting}
          >
            Create Company
          </button>
          <button
            onClick={() => setMode("join")}
            className={mode === "join" ? "active" : ""}
            disabled={isSubmitting}
          >
            Join Company
          </button>
        </div>

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />

          {mode === "create" && (
            <>
              <input
                type="text"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <p style={{ color: "green", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                After creation, share the code below with your pharmacists
              </p>
              {createdCompanyCode && (
                <div className="company-code-box">
                  <span>Company Code: {createdCompanyCode}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(createdCompanyCode)}
                    disabled={isSubmitting}
                  >
                    Copy
                  </button>
                </div>
              )}
            </>
          )}

          {mode === "join" && (
            <input
              type="text"
              placeholder="Company Code"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              required
              disabled={isSubmitting}
            />
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/auth/login")}
            style={{ color: "#4f46e5", cursor: "pointer", fontWeight: "bold" }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;