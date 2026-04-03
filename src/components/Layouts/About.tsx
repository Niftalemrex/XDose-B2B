import React from "react";
import "./About.css";

const About: React.FC = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-image-container">
        <img
  src="https://plus.unsplash.com/premium_photo-1670981099509-57ddbe26d9cc?auto=format&fit=crop&w=1600&q=80"
  alt="Pharmacist reviewing medicine stock"
  className="hero-image"
/>
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1>Transforming the Future of Pharma</h1>
          <p>
            XDose is the premier B2B marketplace for expiring medicines and
            cosmetics. We connect pharmacies, suppliers, and retailers to
            reduce waste, increase accessibility, and unlock hidden value.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <div className="container">
          <h2>Our Mission</h2>
          <p>
            To build a trusted, transparent, and efficient ecosystem where
            near‑expiry and hard‑to‑sell pharmaceutical products find new homes
            instead of landfills. We empower businesses to turn potential loss
            into opportunity while improving access to essential medicines.
          </p>
        </div>
      </div>

      {/* Key Features */}
      <div className="features-section">
        <div className="container">
          <h2>Why Choose XDose?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">♻️</div>
              <h3>Reduce Waste</h3>
              <p>
                Give expiring products a second life. Our platform connects
                sellers with buyers who can use them before they expire.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Data‑Driven Insights</h3>
              <p>
                Real‑time analytics on pricing, demand, and inventory help you
                make smarter decisions and maximise returns.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Trust & Transparency</h3>
              <p>
                Verified companies, secure payments, and full traceability
                ensure every transaction is safe and reliable.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>B2B Marketplace</h3>
              <p>
                Access a nationwide network of pharmacies, distributors, and
                retailers. Buy and sell with confidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Businesses Trust XDose</div>
            </div>
            <div className="stat">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Products Listed</div>
            </div>
            <div className="stat">
              <div className="stat-number">30%</div>
              <div className="stat-label">Average Cost Savings</div>
            </div>
            <div className="stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Marketplace Access</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="container">
          <h2>Ready to Join the Revolution?</h2>
          <p>
            Whether you're a supplier with surplus stock or a retailer looking
            for quality products, XDose is your partner.
          </p>
          <button className="cta-button" onClick={() => (window.location.href = "/auth/signup")}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;