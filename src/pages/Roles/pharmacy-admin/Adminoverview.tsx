import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUser } from '../../../context/UserContext';
import { supabaseAdmin } from '../../../lib/supabase';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './AdminOverview.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminOverview: React.FC = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingApprovals: 0,
    activeStaff: 0,
    totalStaff: 0,
    lowStockCount: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
  });
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<{ labels: string[]; counts: number[] }>({
    labels: [],
    counts: [],
  });
  const [weeklySales, setWeeklySales] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.company_id || hasFetched.current) return;

      setLoading(true);
      try {
        // Fetch staff count (active + total)
        const { data: staffData, error: staffError } = await supabaseAdmin
          .from('users')
          .select('id, status')
          .eq('company_id', user.company_id)
          .eq('role', 'pharmacist');
        if (staffError) throw staffError;
        const totalStaff = staffData?.length || 0;
        const activeStaff = staffData?.filter(s => s.status === 'active').length || 0;

        // Fetch products summary
        const { data: productsData, error: productsError } = await supabaseAdmin
          .from('products')
          .select('id, status, expiry_date, category, quantity, price')
          .eq('company_id', user.company_id);
        if (productsError) throw productsError;

        const totalProducts = productsData?.length || 0;
        const pendingApprovals = productsData?.filter(p => p.status === 'pending').length || 0;
        const lowStockCount = productsData?.filter(p => (p.quantity || 0) < 10).length || 0;
        
        // Calculate approximate revenue (simulated - you can replace with actual sales data)
        const totalValue = productsData?.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0) || 0;
        const monthlyRevenue = totalValue * 0.15; // Simulated monthly revenue
        const revenueGrowth = 12.5;

        setStats({
          totalProducts,
          pendingApprovals,
          activeStaff,
          totalStaff,
          lowStockCount,
          monthlyRevenue,
          revenueGrowth,
        });

        // Recent products (last 5)
        const { data: recent, error: recentError } = await supabaseAdmin
          .from('products')
          .select('id, name, strength, created_at, status, quantity')
          .eq('company_id', user.company_id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (!recentError && recent) setRecentProducts(recent);

        // Recent activities (simulated - replace with actual activity logs if available)
        const mockActivities = [
          { id: '1', name: 'Stock Update - Paracetamol', timestamp: '2 minutes ago', duration: '4hrs', status: 'success' },
          { id: '2', name: 'New Order #10234', timestamp: '5 minutes ago', duration: '30s', status: 'success' },
          { id: '3', name: 'Inventory Sync', timestamp: '12 minutes ago', duration: '2hrs', status: 'pending' },
          { id: '4', name: 'Price Update Batch', timestamp: '24 minutes ago', duration: '1min', status: 'failed' },
          { id: '5', name: 'Expiry Check', timestamp: '1 hour ago', duration: '12min', status: 'success' },
        ];
        setRecentActivities(mockActivities);

        // Category distribution for chart
        const categoryMap = new Map<string, number>();
        productsData?.forEach(p => {
          const cat = p.category || 'Uncategorized';
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
        const labels = Array.from(categoryMap.keys());
        const counts = labels.map(l => categoryMap.get(l) || 0);
        setCategoryData({ labels, counts });

        // Weekly sales data (simulated - replace with actual sales data)
        setWeeklySales([42, 58, 67, 89, 104, 98, 112]);

        hasFetched.current = true;
      } catch (err: any) {
        console.error('Error fetching overview data:', err);
        setError(err.message || 'Failed to load overview');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.company_id]);

  const trendChartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      labels: days,
      datasets: [
        {
          label: 'Sales Volume',
          data: weeklySales,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderRadius: 8,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        },
      ],
    };
  }, [weeklySales]);

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 8,
      },
    },
    scales: {
      y: {
        grid: { color: '#e2e8f0', drawBorder: false },
        title: { display: true, text: 'Units Sold', font: { family: 'Inter', size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 } },
      },
    },
  };

  const categoryChartData = useMemo(() => {
    return {
      labels: categoryData.labels,
      datasets: [
        {
          data: categoryData.counts,
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec489a'],
          borderWidth: 0,
          cutout: '65%',
          borderRadius: 6,
        },
      ],
    };
  }, [categoryData]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: 'Inter', size: 10 },
          boxWidth: 10,
          padding: 8,
        },
      },
      tooltip: { enabled: true },
    },
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="badge success">✓ Success</span>;
      case 'failed':
        return <span className="badge failed">✗ Failed</span>;
      case 'pending':
        return <span className="badge pending">⟳ Pending</span>;
      default:
        return <span className={`badge status-${status}`}>{status.toUpperCase()}</span>;
    }
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner"></div>
      <p>Loading dashboard insights...</p>
    </div>
  );
  
  if (error) return <div className="overview-error">{error}</div>;

  return (
    <div className="admin-overview-pro">
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome back, {user?.name || 'Admin'}!</h1>
          <p className="dashboard-subtitle">Monitor your pharmacy operations and system performance</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="action-grid">
        <div className="action-card">
          <div className="action-icon new-product">📦</div>
          <div className="action-content">
            <h3>New Product</h3>
            <p>Add to inventory</p>
          </div>
        </div>
        <div className="action-card">
          <div className="action-icon approvals">⏳</div>
          <div className="action-content">
            <h3>Pending Approvals</h3>
            <p>{stats.pendingApprovals} items waiting</p>
          </div>
        </div>
        <div className="action-card">
          <div className="action-icon stock">⚠️</div>
          <div className="action-content">
            <h3>Low Stock Alert</h3>
            <p>{stats.lowStockCount} items below threshold</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">💊</div>
          <div className="kpi-value">{stats.totalProducts}</div>
          <div className="kpi-label">Total Products</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-value">{stats.activeStaff}/{stats.totalStaff}</div>
          <div className="kpi-label">Active Staff</div>
          <div className="trend-indicator up">▲ Active</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-value">${stats.monthlyRevenue.toLocaleString()}</div>
          <div className="kpi-label">Monthly Revenue</div>
          <div className="trend-indicator up">▲ +{stats.revenueGrowth}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-value">+18%</div>
          <div className="kpi-label">Growth Rate</div>
          <div className="trend-indicator up">▲ +2.3%</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Weekly Sales Trend</h3>
            <span className="chart-period">Last 7 days</span>
          </div>
          <div className="chart-container">
            {weeklySales.some(v => v > 0) ? (
              <Bar data={trendChartData} options={trendOptions} />
            ) : (
              <p>No sales data available yet.</p>
            )}
          </div>
        </div>
        <div className="chart-card small">
          <div className="chart-header">
            <h3>Products by Category</h3>
            <span className="chart-period">Distribution</span>
          </div>
          <div className="doughnut-wrapper">
            {categoryData.labels.length > 0 ? (
              <Doughnut data={categoryChartData} options={doughnutOptions} />
            ) : (
              <p>No categories yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="two-column-layout">
        {/* Left: Recent Products */}
        <div className="recent-products-card">
          <div className="card-header">
            <h3>Recently Added Products</h3>
            <button className="view-all-btn">View all →</button>
          </div>
          {recentProducts.length === 0 ? (
            <p>No products added yet.</p>
          ) : (
            <div className="product-list">
              {recentProducts.map(p => (
                <div key={p.id} className="product-item">
                  <div className="product-info">
                    <div className="product-name">{p.name} {p.strength && `(${p.strength})`}</div>
                    <div className="product-meta">
                      <span className="product-date">{new Date(p.created_at).toLocaleDateString()}</span>
                      <span className="product-quantity">Stock: {p.quantity || 0}</span>
                    </div>
                  </div>
                  <span className={`product-status status-${p.status}`}>
                    {p.status === 'pending' ? '⏳ Pending' : p.status === 'approved' ? '✓ Approved' : p.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Activity */}
        <div className="recent-activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <span className="activity-badge">Live</span>
          </div>
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-info">
                  <div className="activity-name">{activity.name}</div>
                  <div className="activity-meta">
                    <span className="timestamp">{activity.timestamp}</span>
                    <span className="duration">→ {activity.duration}</span>
                  </div>
                </div>
                {getStatusBadge(activity.status)}
              </div>
            ))}
          </div>
          <div className="activity-footer">
            <span className="footer-note">Last updated: just now</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="system-health">
          <span className="health-dot"></span>
          System operational
        </div>
        <div className="footer-links">
          <a href="#">Reports</a>
          <a href="#">Settings</a>
          <a href="#">Support</a>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;