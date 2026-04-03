import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SidbarSuperAdmin'; // adjust path as needed
import './DashboardSuperAdmin.css';

const DashboardSuperAdmin: React.FC = () => {
  return (
    <div className="superadmin-container">
      <SuperAdminSidebar />
      <div className="superadmin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardSuperAdmin;