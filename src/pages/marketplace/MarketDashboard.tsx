import React, { useState, useEffect, useMemo } from 'react';
import { supabaseAdmin } from '../../lib/supabase';
import CategoryTabs from '../../pages/Roles/Pharmacist/CategoryTabs';
import ProductCard from './ProductCard';
import { calculateDaysLeft, getStatusColor, calculateAutoDiscount } from '../../utils/expiryUtils';
import type { Product, ProductCategory } from '../../data/categories';
import { categories } from '../../data/categories';
import './MarketDashboard.css';

type ProductFilter = {
  expiryStatus?: 'good' | 'near-expiry' | 'expired';
  locationId?: string;
  specificLocation?: string;
  supplier?: string;
  searchTerm?: string;
};

interface ExtendedProduct extends Product {
  locationName?: string;
  locationId?: string;
  specificLocation?: string;
}

const MarketDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProductCategory>('x_medicine');
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilter>({});

  // ---------- DATA FETCHING ----------
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabaseAdmin
          .from('products')
          .select('*, locations(id, name)')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const processedProducts: ExtendedProduct[] = (data || [])
          .map((item: any) => {
            const category = item.category as ProductCategory;
            if (!categories[category]) {
              console.warn(`Unknown category "${item.category}" for product "${item.name}", skipping.`);
              return null;
            }

            const categoryData = categories[category];
            const daysLeft = item.expiry_date ? calculateDaysLeft(item.expiry_date) : undefined;
            const statusColor = daysLeft !== undefined ? getStatusColor(daysLeft) : undefined;

            let discount: number | undefined = undefined;
            if (categoryData.discountAuto && daysLeft !== undefined && daysLeft >= 0 && daysLeft < 90) {
              discount = calculateAutoDiscount(daysLeft);
            } else if (item.discount) {
              discount = item.discount;
            }

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
              category,
              quantity: item.quantity,
              supplier: item.supplier,
              location: displayLocation,
              locationId,
              locationName,
              specificLocation,
              photoUrl: item.photo_url,
              discount,
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
            } as ExtendedProduct;
          })
          .filter((p): p is ExtendedProduct => p !== null);

        setProducts(processedProducts);
        console.log('Fetched products with location data:', processedProducts.map(p => ({
          id: p.id,
          name: p.name,
          locationId: p.locationId,
          locationName: p.locationName,
          specificLocation: p.specificLocation,
        })));
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ---------- LOCATION OPTIONS ----------
  const locationOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; specificLocations: Set<string> }>();
    for (const p of products) {
      if (!p.locationId || !p.locationName) continue;
      if (!map.has(p.locationId)) {
        map.set(p.locationId, {
          id: p.locationId,
          name: p.locationName,
          specificLocations: new Set(),
        });
      }
      if (p.specificLocation) {
        map.get(p.locationId)!.specificLocations.add(p.specificLocation);
      }
    }
    const locations = Array.from(map.values()).map(loc => ({
      id: loc.id,
      name: loc.name,
      specificLocations: Array.from(loc.specificLocations).sort(),
    }));
    console.log('Location options:', locations);
    return locations.sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // ---------- FILTER HANDLERS ----------
  const handleFilterChange = (newFilters: Partial<ProductFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const filteredProducts = products.filter(product => {
    if (product.category !== activeTab) return false;
    if (filters.expiryStatus && product.statusColor !== filters.expiryStatus) return false;
    if (filters.locationId && product.locationId !== filters.locationId) return false;
    if (filters.specificLocation && product.specificLocation !== filters.specificLocation) return false;
    if (filters.supplier && product.supplier !== filters.supplier) return false;
    if (filters.searchTerm && !product.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    return true;
  });

  const uniqueSuppliers = Array.from(new Set(products.map(p => p.supplier).filter(Boolean)));

  const selectedLocation = locationOptions.find(loc => loc.id === filters.locationId);
  const specificOptions = selectedLocation?.specificLocations || [];

  // ---------- UI ----------
  return (
    <div className="dashboard">
      {/* Background layers (glassmorphic effect) */}
      <div className="dashboard-bg">
        <div className="bg-grid"></div>
        <div className="bg-gradient"></div>
      </div>

      {/* Hero Section with integrated filters */}
      <div className="hero-section">
        <div className="hero-image-container">
        <img
  src="https://plus.unsplash.com/premium_photo-1671411374209-401340591bae?q=80&w=1551&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  alt="Pharmacist arranging medicine"
  className="hero-image"
/>
          <div className="hero-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-badge">Trusted Marketplace</span>
            <h1>Find the medicines & cosmetics you need</h1>
            <p>Curated products from verified suppliers. Compare prices, check expiry, and order with confidence.</p>
          </div>

          {/* Integrated Search Panel */}
          <div className="search-panel">
            <div className="search-row">
              <div className="filter-group search-group">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="search-input"
                  value={filters.searchTerm || ''}
                  onChange={e => handleFilterChange({ searchTerm: e.target.value })}
                />
                <button className="search-button">Search</button>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Expiry Status</label>
                <select
                  onChange={e => handleFilterChange({ expiryStatus: e.target.value as any })}
                  value={filters.expiryStatus || ''}
                >
                  <option value="">All</option>
                  <option value="good">Good (90+ days)</option>
                  <option value="near-expiry">Near Expiry (30-90 days)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Main Location</label>
                <select
                  onChange={e => {
                    const locId = e.target.value || undefined;
                    handleFilterChange({ locationId: locId, specificLocation: undefined });
                  }}
                  value={filters.locationId || ''}
                >
                  <option value="">All Locations</option>
                  {locationOptions.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Specific Location</label>
                <select
                  onChange={e => handleFilterChange({ specificLocation: e.target.value || undefined })}
                  value={filters.specificLocation || ''}
                  disabled={!filters.locationId}
                >
                  <option value="">All</option>
                  {specificOptions.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                {filters.locationId && specificOptions.length === 0 && (
                  <small className="filter-hint">No specific locations</small>
                )}
              </div>

              <div className="filter-group">
                <label>Supplier</label>
                <select
                  onChange={e => handleFilterChange({ supplier: e.target.value || undefined })}
                  value={filters.supplier || ''}
                >
                  <option value="">All Suppliers</option>
                  {uniqueSuppliers.map(sup => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>

              <button onClick={() => setFilters({})} className="clear-filters">
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs (styled as chips) */}
      <div className="category-section">
        <CategoryTabs active={activeTab} setActive={setActiveTab} />
      </div>

      {/* Products Grid */}
      <div className="products-section">
        <div className="section-header">
          <h2>Available Products</h2>
          <span className="product-count">{filteredProducts.length} items</span>
        </div>

        {isLoading ? (
          <div className="loading-spinner">Loading products...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">No products found. Try adjusting your filters.</div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDashboard;