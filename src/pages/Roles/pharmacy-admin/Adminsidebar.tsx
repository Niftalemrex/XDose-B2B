import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import "./AdminSidebar.css";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    window.location.href = "/auth/login";
  };

  return (
    <aside className="admin-sidebar">
      <h2 className="sidebar-logo">Pharmacy Admin</h2>
      <nav className="sidebar-nav">
        <NavLink to="/pharmacy-admin" className={({ isActive }) => isActive ? "active" : ""}>
          Overview
        </NavLink>
        <NavLink to="/pharmacy-admin/staff-management" className={({ isActive }) => isActive ? "active" : ""}>
          Staff Management
        </NavLink>
        <NavLink to="/pharmacy-admin/product-approvals" className={({ isActive }) => isActive ? "active" : ""}>
          Product Approvals
        </NavLink>
        <NavLink to="/pharmacy-admin/pharmacy-settings" className={({ isActive }) => isActive ? "active" : ""}>
          Settings
        </NavLink>
        <NavLink to="/pharmacy-admin/analytics" className={({ isActive }) => isActive ? "active" : ""}>
          Analytics
        </NavLink>

        <div className="separator"></div>

        <NavLink to="/marketplace/marketdashboard" className={({ isActive }) => isActive ? "active" : ""}>
          Marketplace
        </NavLink>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;