// src/components/auth/VerifyUser.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

type VerifyUserProps = {
  role: "owner" | "pharmacist";
  children: React.ReactNode;
};

const VerifyUser: React.FC<VerifyUserProps> = ({ role, children }) => {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`🔐 VerifyUser [role=${role}] - loading: ${loading}, user:`, user);
    if (loading) return;

    if (!user) {
      console.log("❌ VerifyUser - no user, redirecting to /auth/login");
      navigate("/auth/login");
      return;
    }

    if (user.role !== role) {
      console.log(`❌ VerifyUser - role mismatch: expected ${role}, got ${user.role}, redirecting`);
      navigate("/auth/login");
      return;
    }
    console.log("✅ VerifyUser - user OK");
  }, [user, loading, role, navigate]);

  if (loading) return <div>Checking session...</div>;
  if (!user) return null; // will redirect

  return <>{children}</>;
};

export default VerifyUser;