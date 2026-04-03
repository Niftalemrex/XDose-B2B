import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './OverviewSuperAdmin.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OverviewSuperAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    totalProducts: 0,
    activeCompanies: 0,
    pendingCompanies: 0,
  });
  const [monthlySignups, setMonthlySignups] = useState<{ month: string; count: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Total companies
        const { count: companiesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true });
        const totalCompanies = companiesCount || 0;

        // Active vs pending companies
        const { data: companies } = await supabase
          .from('companies')
          .select('approval_status');
        const active = companies?.filter(c => c.approval_status === 'approved').length || 0;
        const pending = companies?.filter(c => c.approval_status === 'pending').length || 0;

        // Total users
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        const totalUsers = usersCount || 0;

        // Total products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        const totalProducts = productsCount || 0;

        // Monthly company signups (last 6 months)
        const { data: companySignups } = await supabase
          .from('companies')
          .select('created_at')
          .order('created_at', { ascending: true });

        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthLabel = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          months.push({
            label: monthLabel,
            start: date,
            end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          });
        }
        const monthlyCounts = months.map(m => ({
          month: m.label,
          count: companySignups?.filter(c => {
            const created = new Date(c.created_at);
            return created >= m.start && created <= m.end;
          }).length || 0,
        }));
        setMonthlySignups(monthlyCounts);

        setStats({
          totalCompanies,
          totalUsers,
          totalProducts,
          activeCompanies: active,
          pendingCompanies: pending,
        });
      } catch (err) {
        console.error('Error fetching overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Company Signups (Last 6 Months)' },
    },
  };

  const chartData = {
    labels: monthlySignups.map(m => m.month),
    datasets: [
      {
        label: 'New Companies',
        data: monthlySignups.map(m => m.count),
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
        borderColor: '#4f46e5',
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <div className="overview-loading">Loading platform data...</div>;

  return (
    <div className="overview-superadmin">
      <h1>Platform Overview</h1>
      <p className="subtitle">Summary statistics and insights for the entire platform.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-value">{stats.totalCompanies}</div>
          <div className="stat-label">Total Companies</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.activeCompanies}</div>
          <div className="stat-label">Active Companies</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pendingCompanies}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
      </div>

      <div className="chart-card">
        <h3>New Company Registrations</h3>
        <div className="chart-container">
          {monthlySignups.length > 0 ? (
            <Bar options={chartOptions} data={chartData} />
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewSuperAdmin;