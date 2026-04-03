// src/pages/marketplace/ProductDetail.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { supabaseAdmin } from '../../lib/supabase';
import type { Product } from '../../data/categories';
import { calculateDaysLeft, getStatusColor } from '../../utils/expiryUtils';
import ReviewSection from '../../pages/marketplace/ReviewSection'; // ✅ correct path
import ChatBox from '../../pages/Roles/Pharmacist/ChatBox';
import './ProductDetail.css';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useUser();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'contact'>('details');
  const [quantity, setQuantity] = useState(1);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string>('Supplier');
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Function to refresh reviews (used after a new review is added)
  const refreshReviews = async () => {
    if (!productId) return;
    try {
      const { data: reviewsData, error: reviewsError } = await supabaseAdmin
        .from('reviews')
        .select(`
          id,
          rating,
          text,
          date,
          verified,
          users!inner(id, name)
        `)
        .eq('product_id', productId)
        .order('date', { ascending: false });

      if (reviewsError) throw reviewsError;

      const formattedReviews = (reviewsData || []).map((r: any) => ({
        id: r.id,
        user: {
          id: r.users.id,
          name: r.users.name,
          avatar: undefined,
          role: undefined,
        },
        rating: r.rating,
        text: r.text || '',
        date: r.date,
        verified: r.verified,
      }));
      setReviews(formattedReviews);
      if (formattedReviews.length > 0) {
        const total = formattedReviews.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating(total / formattedReviews.length);
      } else {
        setAverageRating(0);
      }
    } catch (err) {
      console.error('Error refreshing reviews:', err);
    }
  };

  // Fetch product, reviews, and chat data
  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError('Product ID missing');
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch product with location
        const { data: productData, error: productError } = await supabaseAdmin
          .from('products')
          .select('*, locations(id, name)')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error('Product not found');

        const locationName = productData.locations?.name || '';
        const specificLocation = productData.specific_location || '';
        const displayLocation = locationName && specificLocation
          ? `${locationName} - ${specificLocation}`
          : locationName || specificLocation || 'Unknown';

        const daysLeft = productData.expiry_date ? calculateDaysLeft(productData.expiry_date) : undefined;
        const statusColor = daysLeft !== undefined ? getStatusColor(daysLeft) : undefined;

        const productObj: Product = {
          id: productData.id,
          name: productData.name,
          strength: productData.strength || '',
          expiryDate: productData.expiry_date,
          category: productData.category,
          quantity: productData.quantity,
          supplier: productData.supplier,
          location: displayLocation,
          photoUrl: productData.photo_url,
          discount: productData.discount,
          statusColor,
          daysLeft,
          uploadDate: productData.created_at,
          price: productData.price?.toString(),
          batchNumber: productData.batch_number,
          description: productData.description,
          indications: productData.indications,
          contraindications: productData.contraindications,
          dosage: productData.dosage,
          storage: productData.storage,
          manufacturer: productData.manufacturer,
          barcode: productData.barcode,
          requiresPrescription: productData.requires_prescription,
          reviews: [],
          averageRating: undefined,
        };
        setProduct(productObj);

        // 2. Fetch reviews with user name
        const { data: reviewsData, error: reviewsError } = await supabaseAdmin
          .from('reviews')
          .select(`
            id,
            rating,
            text,
            date,
            verified,
            users!inner(id, name)
          `)
          .eq('product_id', productId)
          .order('date', { ascending: false });

        if (reviewsError) throw reviewsError;

        const formattedReviews = (reviewsData || []).map((r: any) => ({
          id: r.id,
          user: {
            id: r.users.id,
            name: r.users.name,
            avatar: undefined,
            role: undefined,
          },
          rating: r.rating,
          text: r.text || '',
          date: r.date,
          verified: r.verified,
        }));
        setReviews(formattedReviews);
        if (formattedReviews.length > 0) {
          const total = formattedReviews.reduce((sum, r) => sum + r.rating, 0);
          setAverageRating(total / formattedReviews.length);
        }

        // 3. Get supplier info for chat
        const { data: supplierData, error: supplierError } = await supabaseAdmin
          .from('users')
          .select('id, name')
          .eq('id', productData.uploaded_by)
          .single();

        if (!supplierError && supplierData) {
          setSupplierId(supplierData.id);
          setSupplierName(supplierData.name);
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // ... chat logic (unchanged) ...

  // Auto‑scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (text: string) => {
    if (!product || !user || !supplierId) return;
    if (user.id === supplierId) {
      setChatError('You cannot send messages to yourself');
      return;
    }

    const tempId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: tempId,
      text,
      senderId: user.id,
      senderName: 'You',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);

    try {
      const { error } = await supabaseAdmin.from('chats').insert({
        sender_id: user.id,
        receiver_id: supplierId,
        sender_type: 'user',
        text,
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      setChatError('Failed to send message. Please try again.');
      setTimeout(() => setChatError(null), 3000);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (!product) return;
    setQuantity(Math.max(1, Math.min(product.quantity, value)));
  };

  const handleAddToCart = () => {
    if (!product || !product.price) return alert('Price not available');
    addToCart({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      photoUrl: product.photoUrl,
      strength: product.strength,
      maxQuantity: product.quantity,
      quantity,
    });
    alert(`Added ${quantity} units of ${product.name} to cart`);
  };

  if (loading) return <div className="product-detail-loading">Loading product details...</div>;
  if (error || !product)
    return (
      <div className="product-detail-error">
        <p>{error || 'Product not found'}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );

  const isExpired = product.statusColor === 'expired';
  const isSupplier = user?.id === supplierId;

  return (
    <div className="product-detail-container">
      {/* Product Header (unchanged) */}
      <div className="product-header">
        <div className="product-image-container">
          <img src={product.photoUrl || '/placeholder.jpg'} alt={product.name} className="product-image" />
          {isExpired && <div className="expired-badge">Expired</div>}
        </div>

        <div className="product-info">
          <h1>{product.name} {product.strength}</h1>
          <div className="product-meta">
            <span className={`status ${product.statusColor}`}>{product.statusColor?.toUpperCase() || 'Unknown'}</span>
            {product.daysLeft !== undefined && <span>{product.daysLeft >= 0 ? `${product.daysLeft} days left` : 'Expired'}</span>}
            <span>Location: {product.location}</span>
            {product.supplier && <span>Supplier: {product.supplier}</span>}
          </div>

          {product.price && (
            <div className="price-section">
              <span className="price">ETB {parseFloat(product.price).toFixed(2)}</span>
              {product.discount && product.discount > 0 && <span className="discount-badge">{product.discount}% OFF</span>}
            </div>
          )}

          <div className="quantity-control">
            <button onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>-</button>
            <span>{quantity}</span>
            <button onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= product.quantity}>+</button>
            <span className="stock">Available: {product.quantity} units</span>
          </div>

          <div className="action-buttons">
            <button className="primary-button" onClick={handleAddToCart} disabled={isExpired}>
              {isExpired ? 'Not Available' : 'Add to Cart'}
            </button>
            <button className="secondary-button" onClick={() => setActiveTab('contact')}>Contact Supplier</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="product-tabs">
        <button className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>Product Details</button>
        <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Reviews ({reviews.length})</button>
        <button className={activeTab === 'contact' ? 'active' : ''} onClick={() => setActiveTab('contact')}>Contact Supplier</button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'details' && (
          <div className="product-specs">
            <h3>Product Specifications</h3>
            <div className="specs-grid">
              {product.description && <div className="spec-item"><h4>Description</h4><p>{product.description}</p></div>}
              {product.indications && <div className="spec-item"><h4>Indications</h4><p>{product.indications}</p></div>}
              {product.contraindications && <div className="spec-item"><h4>Contraindications</h4><p>{product.contraindications}</p></div>}
              {product.dosage && <div className="spec-item"><h4>Dosage</h4><p>{product.dosage}</p></div>}
              {product.storage && <div className="spec-item"><h4>Storage</h4><p>{product.storage}</p></div>}
              {product.manufacturer && <div className="spec-item"><h4>Manufacturer</h4><p>{product.manufacturer}</p></div>}
              {product.barcode && <div className="spec-item"><h4>Barcode</h4><p>{product.barcode}</p></div>}
              {product.requiresPrescription && <div className="spec-item"><h4>Prescription Required</h4><p>Yes</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <ReviewSection
            reviews={reviews}
            averageRating={averageRating}
            totalReviews={reviews.length}
            productId={productId}
            currentUser={user ? { id: user.id, name: user.name } : undefined}
            onReviewAdded={refreshReviews}
          />
        )}

        {activeTab === 'contact' && (
          <div className="chat-tab">
            {isSupplier ? (
              <div className="chat-info">You are the supplier of this product. Use the chat from your dashboard to reply to customers.</div>
            ) : (
              <>
                {chatError && <div className="chat-error">{chatError}</div>}
                <ChatBox
                  messages={chatMessages}
                  currentUser={{ id: user?.id || '', name: 'You' }}
                  contactName={supplierName}
                  onSend={handleSend}
                  isTyping={false}
                />
                <div ref={chatEndRef} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;