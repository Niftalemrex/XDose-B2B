import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUser } from '../../../context/UserContext';
import { supabaseAdmin } from '../../../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

interface UploadTrend {
  month: string;
  count: number;
}

const Analytics: React.FC = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPIs
  const [totalPharmacists, setTotalPharmacists] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalRejected, setTotalRejected] = useState(0);
  const [nearExpiry, setNearExpiry] = useState(0);
  const [lowStock, setLowStock] = useState(0);

  // Growth percentages
  const [productGrowth, setProductGrowth] = useState<number | null>(null);
  const [pendingGrowth, setPendingGrowth] = useState<number | null>(null);

  // Charts data
  const [categoryData, setCategoryData] = useState<{ labels: string[]; counts: number[] }>({
    labels: [],
    counts: [],
  });
  const [statusData, setStatusData] = useState<{ pending: number; approved: number; rejected: number }>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [uploadTrend, setUploadTrend] = useState<UploadTrend[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<6 | 12>(6);
  const [exportLoading, setExportLoading] = useState(false);
  const hasFetched = useRef(false);

  // Helper to get month label
  const getMonthLabel = (date: Date) => {
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  // Helper to get month start/end
  const getMonthRange = (year: number, month: number) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  };

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.company_id || hasFetched.current) return;
      setLoading(true);
      try {
        // Fetch all products
        const { data: products, error: prodErr } = await supabaseAdmin
          .from('products')
          .select('id, status, expiry_date, category, quantity, created_at')
          .eq('company_id', user.company_id);
        if (prodErr) throw prodErr;

        // Fetch all pharmacists
        const { count: pharmCount, error: pharmErr } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.company_id)
          .eq('role', 'pharmacist');
        if (pharmErr) throw pharmErr;
        setTotalPharmacists(pharmCount || 0);

        // Products totals
        const total = products.length;
        const pending = products.filter(p => p.status === 'pending').length;
        const approved = products.filter(p => p.status === 'approved').length;
        const rejected = products.filter(p => p.status === 'rejected').length;
        setTotalProducts(total);
        setTotalPending(pending);
        setTotalApproved(approved);
        setTotalRejected(rejected);

        // Near expiry (≤30 days)
        const today = new Date();
        const near = products.filter(p => {
          if (!p.expiry_date) return false;
          const expiry = new Date(p.expiry_date);
          const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diff <= 30 && diff >= 0;
        }).length;
        setNearExpiry(near);

        // Low stock (<10)
        const low = products.filter(p => (p.quantity || 0) < 10).length;
        setLowStock(low);

        // Category breakdown
        const catMap = new Map<string, number>();
        products.forEach(p => {
          const cat = p.category;
          catMap.set(cat, (catMap.get(cat) || 0) + 1);
        });
        setCategoryData({
          labels: Array.from(catMap.keys()),
          counts: Array.from(catMap.values()),
        });

        // Status breakdown for pie chart
        setStatusData({ pending, approved, rejected });

        // Monthly upload trend (last 12 months)
        const now = new Date();
        const months = [];
        for (let i = trendPeriod - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            label: getMonthLabel(date),
            start: date,
            end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          });
        }
        const trend = months.map(m => ({
          month: m.label,
          count: products.filter(p => {
            const created = new Date(p.created_at);
            return created >= m.start && created <= m.end;
          }).length,
        }));
        setUploadTrend(trend);

        // Growth percentages
        const currentMonth = trend[trend.length - 1]?.count || 0;
        const previousMonth = trend[trend.length - 2]?.count || 0;
        setProductGrowth(previousMonth ? ((currentMonth - previousMonth) / previousMonth) * 100 : null);

        // For pending growth, compare current month pending to previous month pending
        // We need to fetch per month pending counts. For simplicity, we'll compute from products.
        const currentMonthStart = months[months.length - 1].start;
        const currentMonthEnd = months[months.length - 1].end;
        const previousMonthStart = months[months.length - 2]?.start;
        const previousMonthEnd = months[months.length - 2]?.end;
        if (previousMonthStart && previousMonthEnd) {
          const currentPending = products.filter(p => {
            const created = new Date(p.created_at);
            return p.status === 'pending' && created >= currentMonthStart && created <= currentMonthEnd;
          }).length;
          const prevPending = products.filter(p => {
            const created = new Date(p.created_at);
            return p.status === 'pending' && created >= previousMonthStart && created <= previousMonthEnd;
          }).length;
          setPendingGrowth(prevPending ? ((currentPending - prevPending) / prevPending) * 100 : null);
        }

        hasFetched.current = true;
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.company_id, trendPeriod]);

  // Re‑fetch data when trend period changes (optional)
  useEffect(() => {
    if (hasFetched.current && user?.company_id) {
      // Reset fetch flag and trigger refetch
      hasFetched.current = false;
      const fetch = async () => {
        // This will cause the main useEffect to run again because hasFetched is false
        // We need to call fetchData again, but the useEffect already has trendPeriod dependency.
        // So we can simply force a re-fetch by setting hasFetched to false and then the main useEffect will run again.
        // However, we need to ensure we don't duplicate the logic. A better way: move fetch logic to a function and call it.
      };
      // Actually, we'll just let the main useEffect re-run because dependency includes trendPeriod.
      // But to prevent double fetch we can keep the current logic – the useEffect will run when trendPeriod changes.
    }
  }, [trendPeriod]);

  const exportToCSV = async () => {
    if (!user?.company_id) return;
    setExportLoading(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          users!products_uploaded_by_fkey (name)
        `)
        .eq('company_id', user.company_id);
      if (error) throw error;

      const headers = [
        'ID', 'Name', 'Strength', 'Category', 'Quantity', 'Price',
        'Expiry Date', 'Location', 'Supplier', 'Batch Number',
        'Manufacturer', 'Dosage', 'Status', 'Uploaded By', 'Uploaded At'
      ];
      const rows = (data || []).map(p => [
        p.id,
        p.name,
        p.strength || '',
        p.category,
        p.quantity,
        p.price || '',
        p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '',
        p.specific_location || '',
        p.supplier || '',
        p.batch_number || '',
        p.manufacturer || '',
        p.dosage || '',
        p.status,
        p.users?.name || p.uploaded_by,
        p.created_at ? new Date(p.created_at).toLocaleString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `products_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to export: ${err.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Products by Category' },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const },
      title: { display: true, text: 'Product Status Distribution' },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Monthly Product Uploads' },
    },
  };

  const barChartData = {
    labels: categoryData.labels,
    datasets: [
      {
        label: 'Number of Products',
        data: categoryData.counts,
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
        borderColor: '#4f46e5',
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [statusData.pending, statusData.approved, statusData.rejected],
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
        borderColor: ['#f59e0b', '#10b981', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: uploadTrend.map(t => t.month),
    datasets: [
      {
        label: 'Products Uploaded',
        data: uploadTrend.map(t => t.count),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4f46e5',
      },
    ],
  };

  if (loading) return <div className="analytics-loading">Loading analytics...</div>;
  if (error) return <div className="analytics-error">{error}</div>;

  return (
    <div className="analytics">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <p className="subtitle">Key metrics and insights for your pharmacy</p>
      </div>

      {/* KPI Cards */}
      <div className="cards-grid">
        <div className="card">
          <div className="card-icon">👥</div>
          <div className="card-value">{totalPharmacists}</div>
          <div className="card-label">Pharmacists</div>
        </div>
        <div className="card">
          <div className="card-icon">📦</div>
          <div className="card-value">{totalProducts}</div>
          <div className="card-label">Total Products</div>
          {productGrowth !== null && (
            <div className={`card-trend ${productGrowth >= 0 ? 'positive' : 'negative'}`}>
              {productGrowth >= 0 ? '↑' : '↓'} {Math.abs(productGrowth).toFixed(1)}% from last month
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-icon">⏳</div>
          <div className="card-value">{totalPending}</div>
          <div className="card-label">Pending Approval</div>
          {pendingGrowth !== null && (
            <div className={`card-trend ${pendingGrowth <= 0 ? 'positive' : 'negative'}`}>
              {pendingGrowth >= 0 ? '↑' : '↓'} {Math.abs(pendingGrowth).toFixed(1)}% from last month
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-icon">✅</div>
          <div className="card-value">{totalApproved}</div>
          <div className="card-label">Approved</div>
        </div>
        <div className="card">
          <div className="card-icon">❌</div>
          <div className="card-value">{totalRejected}</div>
          <div className="card-label">Rejected</div>
        </div>
        <div className="card">
          <div className="card-icon">⚠️</div>
          <div className="card-value">{nearExpiry}</div>
          <div className="card-label">Near Expiry (&lt;30 days)</div>
        </div>
        <div className="card">
          <div className="card-icon">📉</div>
          <div className="card-value">{lowStock}</div>
          <div className="card-label">Low Stock (&lt;10 units)</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Products by Category</h3>
            <p className="chart-sub">Distribution across product categories</p>
          </div>
          <div className="chart-container">
            {categoryData.labels.length > 0 ? (
              <Bar options={barOptions} data={barChartData} />
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3>Product Status</h3>
            <p className="chart-sub">Pending, Approved, Rejected</p>
          </div>
          <div className="chart-container">
            <Pie options={pieOptions} data={pieChartData} />
          </div>
        </div>
      </div>

      {/* Upload Trend with Period Selector */}
      <div className="chart-card full-width">
        <div className="chart-header">
          <h3>Upload Trend</h3>
          <div className="period-selector">
            <button
              className={trendPeriod === 6 ? 'active' : ''}
              onClick={() => setTrendPeriod(6)}
            >
              6 Months
            </button>
            <button
              className={trendPeriod === 12 ? 'active' : ''}
              onClick={() => setTrendPeriod(12)}
            >
              12 Months
            </button>
          </div>
        </div>
        <div className="chart-container large">
          {uploadTrend.length > 0 ? (
            <Line options={lineOptions} data={lineChartData} />
          ) : (
            <p>No data</p>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="export-section">
        <button onClick={exportToCSV} disabled={exportLoading} className="export-button">
          {exportLoading ? 'Exporting...' : 'Export Product Data (CSV)'}
        </button>
      </div>
    </div>
  );
};

export default Analytics;