import React from "react";
import { Navigate } from "react-router-dom";

interface VerifySuperAdminProps {
  children: React.ReactNode;
}

const VerifySuperAdmin: React.FC<VerifySuperAdminProps> = ({ children }) => {
  const isSuperAdmin = sessionStorage.getItem("super_admin_logged_in") === "true";
  return isSuperAdmin ? <>{children}</> : <Navigate to="/SuperAdminAuth/SuperAdminAuth" replace />;
};

export default VerifySuperAdmin;