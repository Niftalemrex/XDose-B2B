// src/pages/Roles/Pharmacist/OverviewPharmacist.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "../../../context/UserContext";
import { supabaseAdmin } from "../../../lib/supabase";
import {
  Bar,
  Line,
  Pie,
} from "react-chartjs-2";
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
} from "chart.js";
import "./OverviewPharmacist.css";

// Register Chart.js components
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

// Types
interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiry_date: string | null;
  uploaded_by: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
}

interface UserStats {
  totalPharmacists: number;
  totalProducts: number;
  myUploads: number;
  lowStock: number;
  nearExpiry: number;
  newMessages: number;
}

// Helper functions
const calculateDaysLeft = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getGrowth = (current: number, previous: number): number | null => {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
};

// Sub-components
const KPICard: React.FC<{
  title: string;
  value: number | string;
  icon: string;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  tooltip?: string;
}> = ({ title, value, icon, trend, tooltip }) => (
  <div className="stat-card" title={tooltip}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{title}</div>
    {trend && (
      <div className={`stat-trend ${trend.direction}`}>
        {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {Math.abs(trend.value).toFixed(1)}%
      </div>
    )}
  </div>
);

const CategoryChart: React.FC<{ data: { labels: string[]; counts: number[] } }> = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Products",
        data: data.counts,
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Products by Category" },
    },
  };
  return <Bar options={options} data={chartData} />;
};

const UploadTrendChart: React.FC<{ monthlyData: { month: string; count: number }[] }> = ({ monthlyData }) => {
  const chartData = {
    labels: monthlyData.map((d) => d.month),
    datasets: [
      {
        label: "Products Uploaded",
        data: monthlyData.map((d) => d.count),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Product Uploads Over Time" },
    },
  };
  return <Line options={options} data={chartData} />;
};

const StatusPieChart: React.FC<{ data: { pending: number; approved: number; rejected: number } }> = ({ data }) => {
  const chartData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        data: [data.pending, data.approved, data.rejected],
        backgroundColor: ["rgba(245, 158, 11, 0.5)", "rgba(16, 185, 129, 0.5)", "rgba(239, 68, 68, 0.5)"],
        borderColor: ["rgba(245, 158, 11, 1)", "rgba(16, 185, 129, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 1,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Product Status Distribution" },
    },
  };
  return <Pie options={options} data={chartData} />;
};

const RecentProductsList: React.FC<{ products: Product[] }> = ({ products }) => {
  if (products.length === 0) return <p>No products added yet.</p>;
  return (
    <ul className="recent-list">
      {products.map((p) => (
        <li key={p.id}>
          <span className="product-name">{p.name}</span>
          <span className="product-date">{new Date(p.created_at).toLocaleDateString()}</span>
          <span className={`product-status status-${p.status}`}>{p.status.toUpperCase()}</span>
        </li>
      ))}
    </ul>
  );
};

// Main Component
const OverviewPharmacist: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalPharmacists: 0,
    totalProducts: 0,
    myUploads: 0,
    lowStock: 0,
    nearExpiry: 0,
    newMessages: 0,
  });
  const [categoryData, setCategoryData] = useState<{ labels: string[]; counts: number[] }>({
    labels: [],
    counts: [],
  });
  const [monthlyUploads, setMonthlyUploads] = useState<{ month: string; count: number }[]>([]);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [previousMonthUploads, setPreviousMonthUploads] = useState(0);
  const [lowStockPercent, setLowStockPercent] = useState(0);
  const [nearExpiryPercent, setNearExpiryPercent] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.company_id) return;
      setLoading(true);
      try {
        // Fetch all products in the company
        const { data: products, error: prodErr } = await supabaseAdmin
          .from("products")
          .select("*")
          .eq("company_id", user.company_id);
        if (prodErr) throw prodErr;
        const productList = products as Product[];

        // Base metrics
        const totalProducts = productList.length;
        const myUploads = productList.filter((p) => p.uploaded_by === user.id).length;
        const lowStock = productList.filter((p) => (p.quantity || 0) < 10).length;
        const nearExpiry = productList.filter((p) => {
          if (!p.expiry_date) return false;
          const days = calculateDaysLeft(p.expiry_date);
          return days <= 30 && days >= 0;
        }).length;

        // Percentages
        setLowStockPercent(totalProducts ? (lowStock / totalProducts) * 100 : 0);
        setNearExpiryPercent(totalProducts ? (nearExpiry / totalProducts) * 100 : 0);

        // Category breakdown
        const catMap = new Map<string, number>();
        productList.forEach((p) => {
          const cat = p.category;
          catMap.set(cat, (catMap.get(cat) || 0) + 1);
        });
        setCategoryData({
          labels: Array.from(catMap.keys()),
          counts: Array.from(catMap.values()),
        });

        // Status breakdown
        const pending = productList.filter((p) => p.status === "pending").length;
        const approved = productList.filter((p) => p.status === "approved").length;
        const rejected = productList.filter((p) => p.status === "rejected").length;
        setStatusCounts({ pending, approved, rejected });

        // Monthly uploads (last 6 months)
        const now = new Date();
        const months: { label: string; start: Date; end: Date }[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthLabel = date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
          months.push({
            label: monthLabel,
            start: date,
            end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          });
        }
        const monthlyCounts = months.map((m) => ({
          month: m.label,
          count: productList.filter((p) => {
            const created = new Date(p.created_at);
            return created >= m.start && created <= m.end;
          }).length,
        }));
        setMonthlyUploads(monthlyCounts);

        // Previous month uploads (for growth)
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const prevMonthCount = productList.filter((p) => {
          const created = new Date(p.created_at);
          return created >= prevMonthStart && created <= prevMonthEnd;
        }).length;
        setPreviousMonthUploads(prevMonthCount);

        // Recent products (last 5)
        const recent = [...productList]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentProducts(recent);

        // Staff count
        const { data: staff, error: staffErr } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("company_id", user.company_id)
          .eq("role", "pharmacist");
        if (staffErr) throw staffErr;
        const totalPharmacists = staff?.length || 0;

        // New messages (all received)
        const { data: messages, error: msgErr } = await supabaseAdmin
          .from("chats")
          .select("id")
          .eq("receiver_id", user.id);
        if (msgErr) throw msgErr;
        const newMessages = messages?.length || 0;

        setStats({
          totalPharmacists,
          totalProducts,
          myUploads,
          lowStock,
          nearExpiry,
          newMessages,
        });
      } catch (err: any) {
        console.error("Error fetching overview data:", err);
        setError(err.message || "Failed to load overview");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Derived trends
  const uploadGrowth = getGrowth(
    monthlyUploads.length ? monthlyUploads[monthlyUploads.length - 1]?.count || 0 : 0,
    previousMonthUploads
  );

  if (userLoading) return <div className="overview-loading">Loading session...</div>;
  if (!user) return <div className="overview-loading">Redirecting...</div>;
  if (loading) return <div className="overview-loading">Loading overview...</div>;
  if (error) return <div className="overview-error">{error}</div>;

  return (
    <div className="overview-pharmacist">
      <div className="overview-header">
        <h1>Welcome back, {user.name}!</h1>
        <p className="subtitle">Your advanced pharmacy analytics dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <KPICard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          trend={
            uploadGrowth !== null
              ? { value: Math.abs(uploadGrowth), direction: uploadGrowth >= 0 ? "up" : "down" }
              : undefined
          }
          tooltip="Total products in your pharmacy"
        />
        <KPICard title="Your Uploads" value={stats.myUploads} icon="📤" />
        <KPICard
          title="Low Stock"
          value={`${stats.lowStock} (${lowStockPercent.toFixed(1)}%)`}
          icon="⚠️"
          tooltip="Products with quantity < 10"
        />
        <KPICard
          title="Near Expiry"
          value={`${stats.nearExpiry} (${nearExpiryPercent.toFixed(1)}%)`}
          icon="⏰"
          tooltip="Products expiring in ≤30 days"
        />
        <KPICard title="New Messages" value={stats.newMessages} icon="💬" />
        <KPICard title="Pharmacists" value={stats.totalPharmacists} icon="👥" />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Products by Category</h3>
          <div className="chart-container">
            {categoryData.labels.length ? (
              <CategoryChart data={categoryData} />
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>
        <div className="chart-card">
          <h3>Product Status Distribution</h3>
          <div className="chart-container">
            <StatusPieChart data={statusCounts} />
          </div>
        </div>
        <div className="chart-card wide">
          <h3>Upload Trend (Last 6 Months)</h3>
          <div className="chart-container">
            {monthlyUploads.length ? (
              <UploadTrendChart monthlyData={monthlyUploads} />
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="recent-card">
        <h3>Recently Added Products</h3>
        <RecentProductsList products={recentProducts} />
      </div>
    </div>
  );
};

export default OverviewPharmacist;