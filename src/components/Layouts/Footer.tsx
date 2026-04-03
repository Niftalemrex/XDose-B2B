import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo / Brand */}
        <div className="footer-section">
          <h2 className="footer-logo">PharmaMarket</h2>
          <p className="footer-text">
            Smart marketplace for pharmacies to manage and sell near-expiry medicines efficiently.
          </p>
        </div>

        {/* Navigation */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/marketplace/marketdashboard">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: support@pharmamarket.com</p>
          <p>Phone: +251 900 000 000</p>
          <p>Addis Ababa, Ethiopia</p>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} PharmaMarket. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;