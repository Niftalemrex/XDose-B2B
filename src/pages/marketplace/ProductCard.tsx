import React from 'react';
import { useNavigate } from 'react-router-dom';          // ✅ add this
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

export interface Product {
  id: string;
  name: string;
  strength?: string;
  quantity: number;
  location: string;
  supplier?: string;
  expiryDate?: string;
  discount?: number;
  photoUrl?: string;
  statusColor?: 'good' | 'near-expiry' | 'expired';
  price?: string;
  uploadDate?: string;
  dosage?: string;
}

// Utility functions (working with string dates)
const calculateDaysLeft = (expiryDateStr: string) => {
  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  const diff = expiryDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatExpiryInfo = (expiryDateStr: string) => {
  const days = calculateDaysLeft(expiryDateStr);
  const expiryDate = new Date(expiryDateStr);
  return `${expiryDate.toLocaleDateString()} (${days} days left)`;
};

const formatUploadDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `Posted on ${date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();                // ✅ useNavigate hook
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (!product.price) {
      alert('Price not available');
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      photoUrl: product.photoUrl,
      strength: product.strength,
      maxQuantity: product.quantity,
      quantity: 1,
    });
    alert(`Added ${product.name} to cart`);
  };

  // ✅ Navigation handlers
  const handleDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const handleContact = () => {
    navigate(`/product/${product.id}/contact`);
  };

  const status = product.statusColor;
  const formattedExpiry = product.expiryDate
    ? formatExpiryInfo(product.expiryDate)
    : 'No expiry date';
  const postedDate = formatUploadDate(product.uploadDate);

  return (
    <div className={`product-card ${status || ''}`}>
      <div className="product-badges">
        {status && <span className="product-status">{status.replace('-', ' ')}</span>}
        {product.discount && product.discount > 0 && <span className="discount-badge">{product.discount}% OFF</span>}
      </div>

      <div className="product-image-container">
        {product.photoUrl ? (
          <img src={product.photoUrl} alt={product.name} className="product-image" />
        ) : (
          <div className="image-placeholder">{product.name.charAt(0)}</div>
        )}
      </div>

      <div className="product-content">
        <div className="product-header">
          <h3 className="product-name">{product.name}</h3>
          {product.strength && <p className="product-strength">{product.strength}</p>}
        </div>

        <div className="product-details">
          {product.price && (
            <div className="detail-row">
              <span className="detail-label">Price:</span>
              <span className="detail-value">ETB {product.price}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Expiry:</span>
            <span className="detail-value">{formattedExpiry}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Qty:</span>
            <span className="detail-value">{product.quantity} units</span>
          </div>
          {product.dosage && (
            <div className="detail-row">
              <span className="detail-label">Dosage:</span>
              <span className="detail-value">{product.dosage}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{product.location}</span>
          </div>
          {product.supplier && (
            <div className="detail-row">
              <span className="detail-label">Supplier:</span>
              <span className="detail-value">{product.supplier}</span>
            </div>
          )}
          {postedDate && (
            <div className="detail-row">
              <span className="detail-label">Posted:</span>
              <span className="detail-value">{postedDate}</span>
            </div>
          )}
        </div>

        <div className="product-footer">
          <button
            className="quick-add-button"
            onClick={handleAddToCart}
            disabled={status === 'expired'}
          >
            Add to Cart
          </button>
          <div className="action-buttons">
            <button className="action-button contact-button" onClick={handleContact}>
              Contact
            </button>
            <button className="action-button details-button" onClick={handleDetails}>
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;