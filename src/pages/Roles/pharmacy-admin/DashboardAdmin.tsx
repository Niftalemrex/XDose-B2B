// src/pages/Roles/pharmacy-admin/DashboardAdmin.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import AdminSidebar from "./Adminsidebar";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../context/UserContext";
import "./DashboardAdmin.css";

const DashboardAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }
      const { data: dbUser, error } = await supabase
        .from("users")
        .select("id, name, company_id, role")
        .eq("id", user.id)
        .single();
      if (error || !dbUser || dbUser.role !== "owner") {
        navigate("/auth/login");
        return;
      }
      setUser(dbUser);
      setLoading(false);
    };
    verifyUser();
  }, [user, navigate, setUser]);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardAdmin;