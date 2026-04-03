// src/pages/Roles/Pharmacist/DashboardPharmacist.tsx
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import PharmacistSidebar from "../Pharmacist/PharmacistSidebar";
import { useUser } from "../../../context/UserContext";
import "./DashboardPharmacist.css";

const DashboardPharmacist: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (user.role !== "pharmacist") {
      navigate("/auth/login");
      return;
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading your session...</div>;
  if (!user) return null;

  return (
    <div className="pharmacist-dashboard-container">
      <PharmacistSidebar />
      <main className="pharmacist-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardPharmacist;