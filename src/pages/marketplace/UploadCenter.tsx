// src/pages/UploadCenter.tsx
import React, { useState } from 'react';
import type { ProductCategory } from "../../data/categories";
import CategoryTabs from '../../pages/Roles/Pharmacist/CategoryTabs';
import UploadForm from '../../pages/Roles/Pharmacist/UploadForm';
import './UploadCenter.css';

const UploadCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProductCategory>('x_medicine');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmitSuccess = (productName: string) => {
    setSuccessMessage(`${productName} uploaded successfully!`);

    // Auto-dismiss message after 5s
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="upload-center-container">
      {/* Header */}
      <header className="upload-center-header">
        <h1>Upload Center</h1>
        <p className="upload-instructions">
          Select a category below and fill in the required details to list your pharmaceutical products.
        </p>
      </header>

      {/* Category Tabs */}
      <nav className="category-selection">
        <CategoryTabs active={activeTab} setActive={setActiveTab} />
      </nav>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message" role="alert">
          {successMessage}
          <button
            onClick={() => setSuccessMessage(null)}
            className="close-button"
            aria-label="Close success message"
          >
            &times;
          </button>
        </div>
      )}

      {/* Upload Form */}
      <section className="upload-form-container">
        <UploadForm
          category={activeTab}
          onSuccess={handleSubmitSuccess}
        />
      </section>

      {/* Upload Guidelines */}
      <aside className="upload-guidelines">
        <h2>Upload Guidelines</h2>
        <ul>
          <li>Ensure all required fields are filled</li>
          <li>Upload clear photos of the product packaging</li>
          <li>Verify expiry dates before submission</li>
          <li>Provide accurate quantity information</li>
          <li>Double-check supplier details</li>
        </ul>
      </aside>
    </div>
  );
};

export default UploadCenter;