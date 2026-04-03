import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../../context/UserContext';
import { supabaseAdmin } from '../../../lib/supabase';
import { calculateDaysLeft, getStatusColor } from '../../../utils/expiryUtils';
import { categories, type ProductCategory } from '../../../data/categories';
import './ProductApprovals.css';

interface Product {
  id: string;
  name: string;
  strength: string;
  category: string;
  quantity: number;
  price: number | null;
  expiry_date: string | null;
  location_id: string | null;
  specific_location: string | null;
  supplier: string | null;
  batch_number: string | null;
  description: string | null;
  indications: string | null;
  contraindications: string | null;
  dosage: string | null;
  storage: string | null;
  manufacturer: string | null;
  barcode: string | null;
  requires_prescription: boolean;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_by: string;
  created_at: string;
  uploaded_by_name?: string;
}

const ProductApprovals: React.FC = () => {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const hasFetched = useRef(false);

  // Category list: 'all' plus all categories from `categories`
  const categoryTabs = ['all', ...Object.keys(categories)];

  // Compute product counts per category
  const categoryCounts: Record<string, number> = {};
  categoryTabs.forEach(cat => {
    if (cat === 'all') {
      categoryCounts[cat] = products.length;
    } else {
      categoryCounts[cat] = products.filter(p => p.category === cat).length;
    }
  });

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.company_id || hasFetched.current) return;
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabaseAdmin
          .from('products')
          .select(`
            *,
            users!products_uploaded_by_fkey (name)
          `)
          .eq('company_id', user.company_id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const formatted = (data || []).map((item: any) => ({
          ...item,
          uploaded_by_name: item.users?.name,
        }));
        setProducts(formatted);
        hasFetched.current = true;
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user?.company_id]);

  const deleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) return;
    setDeletingId(productId);
    try {
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err: any) {
      alert(`Failed to delete product: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter products based on active category
  const filteredProducts = products.filter(product => {
    if (activeCategory === 'all') return true;
    return product.category === activeCategory;
  });

  if (loading) return <div className="approvals-loading">Loading products...</div>;
  if (error) return <div className="approvals-error">{error}</div>;

  return (
    <div className="product-approvals">
      <div className="page-header">
        <h1>Product Management</h1>
        <p className="subtitle">View and manage all products in your pharmacy</p>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categoryTabs.map(cat => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'all' ? 'All' : categories[cat as ProductCategory]?.label || cat}
            <span className="tab-badge">{categoryCounts[cat]}</span>
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products">
          {activeCategory === 'all'
            ? 'No products found.'
            : `No products found in ${categories[activeCategory as ProductCategory]?.label || activeCategory}.`}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            const daysLeft = product.expiry_date ? calculateDaysLeft(product.expiry_date) : null;
            return (
              <div key={product.id} className={`product-card ${product.status}`}>
                <div className="product-image">
                  {product.photo_url ? (
                    <img src={product.photo_url} alt={product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="product-info">
                  <h3>{product.name} {product.strength && `(${product.strength})`}</h3>
                  <p className="category">Category: {categories[product.category as ProductCategory]?.label || product.category}</p>
                  <p>Quantity: {product.quantity}</p>
                  {product.price && <p>Price: ETB {product.price}</p>}
                  {product.expiry_date && (
                    <p>Expiry: {new Date(product.expiry_date).toLocaleDateString()} {daysLeft !== null && `(${daysLeft} days left)`}</p>
                  )}
                  <p>Location: {product.specific_location || 'General'}</p>
                  {product.supplier && <p>Supplier: {product.supplier}</p>}
                  {product.batch_number && <p>Batch: {product.batch_number}</p>}
                  {product.manufacturer && <p>Manufacturer: {product.manufacturer}</p>}
                  {product.dosage && <p>Dosage: {product.dosage}</p>}
                  {product.description && <p className="description">Description: {product.description}</p>}
                  <p className="uploaded-by">
                    Uploaded by: {product.uploaded_by_name || product.uploaded_by}
                  </p>
                  <p className="upload-date">Uploaded on: {new Date(product.created_at).toLocaleDateString()}</p>
                </div>
                <div className="product-actions">
                  <button
                    className="delete"
                    onClick={() => deleteProduct(product.id)}
                    disabled={deletingId === product.id}
                  >
                    {deletingId === product.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductApprovals;