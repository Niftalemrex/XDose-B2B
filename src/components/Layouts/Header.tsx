import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Header.css';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/marketplace/marketdashboard" className="logo" onClick={closeMenu}>
          <svg width="92" height="36" viewBox="0 0 92 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Paste your logo SVG here */}
          </svg>
        </Link>

        {/* Desktop Navigation (centered) */}
        <nav className="nav-links-desktop">
          <NavLink
            to="/marketplace/marketdashboard"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            Browse
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            Contact
          </NavLink>
        </nav>

        {/* Right side: Cart + Login */}
        <div className="right-actions">
          <NavLink
            to="/Pharmacist/Cart"
            className={({ isActive }) => `cart-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="cart-icon">🛒</span>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </NavLink>
          <NavLink
            to="/auth/login"
            className={({ isActive }) => `login-button ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Sign in
          </NavLink>
        </div>

        {/* Hamburger for mobile */}
        <button className="hamburger" onClick={toggleMenu} aria-label="Toggle navigation">
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <NavLink
            to="/marketplace/marketdashboard"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            Browse
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            Contact
          </NavLink>
          <NavLink
            to="/Pharmacist/Cart"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            Cart {totalItems > 0 && <span className="cart-badge-mobile">{totalItems}</span>}
          </NavLink>
          <NavLink
            to="/auth/login"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            Sign in
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default Header;