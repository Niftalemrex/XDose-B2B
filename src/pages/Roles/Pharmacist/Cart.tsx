// src/pages/marketplace/Cart.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import './Cart.css';

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const goToProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const goToContact = (productId: string) => {
    navigate(`/product/${productId}/contact`);
  };

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <p>Add some products to get started!</p>
        <button onClick={() => window.history.back()}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      <div className="cart-items">
        {items.map(item => (
          <div key={item.productId} className="cart-item">
            <div
              className="cart-item-image"
              onClick={() => goToProduct(item.productId)}
              style={{ cursor: 'pointer' }}
            >
              <img src={item.photoUrl || '/placeholder.jpg'} alt={item.name} />
            </div>
            <div className="cart-item-details">
              <h3
                onClick={() => goToProduct(item.productId)}
                style={{ cursor: 'pointer', color: '#007bff' }}
              >
                {item.name} {item.strength && `(${item.strength})`}
              </h3>
              <p>Price: ETB {item.price}</p>
              <div className="cart-item-quantity">
                <label>Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={item.maxQuantity}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value, 10))}
                />
              </div>
            </div>
            <div className="cart-item-actions">
              <p>Subtotal: ETB {(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeFromCart(item.productId)}>Remove</button>
              <button onClick={() => goToProduct(item.productId)}>Details</button>
              <button onClick={() => goToContact(item.productId)}>Contact Supplier</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h3>Total: ETB {totalPrice.toFixed(2)}</h3>
        <button className="checkout-button" onClick={() => alert('Proceed to checkout')}>Checkout</button>
        <button className="clear-button" onClick={clearCart}>Clear Cart</button>
      </div>
    </div>
  );
};

export default Cart;