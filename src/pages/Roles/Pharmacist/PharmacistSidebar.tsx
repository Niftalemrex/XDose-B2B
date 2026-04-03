import React from "react";
import { NavLink, } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import "./PharmacistSidebar.css";

const PharmacistSidebar: React.FC = () => {
 
  const { setUser } = useUser();

  const handleLogout = () => {
    // Clear sessionStorage and user context
    sessionStorage.removeItem("user");
    setUser(null);
    // Force full page reload to clear any lingering state
    window.location.href = "/auth/login";
  };

  return (
    <nav className="pharmacist-sidebar">
      <h2>Pharmacist</h2>
      <ul>
        <li>
          <NavLink
            to="/Pharmacist/OverviewPharmacist"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Overview
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/Pharmacist/SupplierChat"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Chat
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/Pharmacist/MyUploads"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            My Uploads
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/Pharmacist/UploadCenter"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Upload Product
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/Pharmacist/Cart"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Cart
          </NavLink>
        </li>

        {/* Separator line */}
        <li className="separator"></li>

        <li>
          <NavLink
            to="/marketplace/marketdashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Marketplace
          </NavLink>
        </li>
        <li>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default PharmacistSidebar;