import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './SuperAdminSidebar.css';

const SuperAdminSidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("super_admin_logged_in");
    navigate("/SuperAdminAuth/SuperAdminAuth", { replace: true });
  };

  return (
    <div className="superadmin-sidebar">
      <h2 className="logo">Super Admin</h2>
      <nav>
        <NavLink
          to="/super-admin/overview"
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          Overview
        </NavLink>
        <NavLink
          to="/super-admin/pharmacy-verification"
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          Pharmacy Verification
        </NavLink>
        <NavLink
          to="/super-admin/user-management"
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          User Management
        </NavLink>
        <NavLink
          to="/super-admin/reports"
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          Reports
        </NavLink>
        <NavLink
          to="/super-admin/platform-settings"
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          Platform Settings
        </NavLink>
        <div className="separator"></div>
        <NavLink to="/marketplace/marketdashboard">Marketplace</NavLink>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </nav>
    </div>
  );
};

export default SuperAdminSidebar;