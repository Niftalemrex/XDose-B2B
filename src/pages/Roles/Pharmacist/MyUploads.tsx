// src/pages/MyUploads.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { supabaseAdmin } from '../../../lib/supabase';
import type { Product, ProductCategory } from '../../../data/categories';

import CategoryTabs from '../../Roles/Pharmacist/CategoryTabs';
import { calculateDaysLeft, getStatusColor } from '../../../utils/expiryUtils';
import './MyUploads.css';

// Extend Product to include extra fields we need locally
interface ExtendedProduct extends Product {
  locationId?: string;
  locationName?: string;
  specificLocation?: string;
}

const MyUploads: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [myUploads, setMyUploads] = useState<ExtendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('x_medicine');

  useEffect(() => {
    const fetchUploads = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabaseAdmin
          .from('products')
          .select('*, locations(id, name)')
          .eq('uploaded_by', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const formattedProducts: ExtendedProduct[] = (data || []).map((item: any) => {
          const daysLeft = item.expiry_date ? calculateDaysLeft(item.expiry_date) : undefined;
          const statusColor = daysLeft !== undefined ? getStatusColor(daysLeft) : undefined;

          const locationName = item.locations?.name || null;
          const locationId = item.location_id;
          const specificLocation = item.specific_location || null;

          const displayLocation =
            locationName && specificLocation
              ? `${locationName} - ${specificLocation}`
              : locationName || specificLocation || 'Unknown';

          return {
            id: item.id,
            name: item.name,
            strength: item.strength || '',
            expiryDate: item.expiry_date,
            category: item.category,
            quantity: item.quantity,
            supplier: item.supplier,
            location: displayLocation,
            locationId,
            locationName,
            specificLocation,
            photoUrl: item.photo_url,
            discount: item.discount,
            statusColor,
            daysLeft,
            uploadDate: item.created_at,
            price: item.price?.toString(),
            batchNumber: item.batch_number,
            description: item.description,
            indications: item.indications,
            contraindications: item.contraindications,
            dosage: item.dosage,
            storage: item.storage,
            manufacturer: item.manufacturer,
            barcode: item.barcode,
            requiresPrescription: item.requires_prescription,
            reviews: [],
            averageRating: undefined,
          };
        });

        setMyUploads(formattedProducts);
      } catch (err: any) {
        console.error('Error fetching uploads:', err);
        setError(err.message || 'Failed to load your uploads. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploads();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
      if (error) throw error;
      setMyUploads(prev => prev.filter(product => product.id !== id));
    } catch (err: any) {
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  const handleEdit = (id: string) => navigate(`/pharmacist/edit-product/${id}`);

  // Filter products by category and status
  const filteredProducts = myUploads.filter(product => {
    // Category filter
    if (product.category !== activeCategory) return false;
    // Status filter
    if (statusFilter === 'active') return product.statusColor !== 'expired';
    if (statusFilter === 'expired') return product.statusColor === 'expired';
    return true;
  });

  if (isLoading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading your uploads...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="my-uploads-container">
      <div className="my-uploads-header">
        <h2>Your Uploaded Products</h2>
        <div className="upload-filters">
          {['all', 'active', 'expired'].map(f => (
            <button key={f} className={statusFilter === f ? 'active' : ''} onClick={() => setStatusFilter(f as any)}>
              {f === 'all' ? 'All Products' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <nav className="category-selection">
        <CategoryTabs active={activeCategory} setActive={setActiveCategory} />
      </nav>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>No products found in this category.</p>
          {myUploads.length === 0 && (
            <button className="primary-button" onClick={() => navigate('/upload')}>
              Upload Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="uploads-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="upload-item">
              {product.photoUrl && (
                <div className="upload-image">
                  <img src={product.photoUrl} alt={product.name} />
                </div>
              )}

              <div className="upload-details">
                <h3>{product.name} {product.strength && `(${product.strength})`}</h3>
                <div className="upload-meta">
                  <span className={`status-badge ${product.statusColor ?? ''}`}>
                    {product.statusColor?.toUpperCase() || 'Unknown'}
                  </span>
                  {product.daysLeft !== undefined && (
                    <span>{product.daysLeft >= 0 ? `${product.daysLeft} days left` : 'Expired'}</span>
                  )}
                  <span>Quantity: {product.quantity}</span>
                  {product.price && <span>Price: ETB {parseFloat(product.price).toFixed(2)}</span>}
                  {product.expiryDate && <span>Expiry: {new Date(product.expiryDate).toLocaleDateString()}</span>}
                  {product.location && <span>Location: {product.location}</span>}
                </div>

                <div className="upload-actions">
                  <button className="edit-button" onClick={() => handleEdit(product.id)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDelete(product.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyUploads;