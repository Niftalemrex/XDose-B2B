// src/pages/super-admin/Reports.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './Reports.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Company {
  id: string;
  name: string;
  company_code: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metrics
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeCompanies, setActiveCompanies] = useState(0);
  const [inactiveCompanies, setInactiveCompanies] = useState(0);

  // Chart data for company status
  const [statusData, setStatusData] = useState({ labels: ['Active', 'Inactive'], counts: [0, 0] });

  // Top 5 companies by user count
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [topLabels, setTopLabels] = useState<string[]>([]);
  const [topCounts, setTopCounts] = useState<number[]>([]);

  // Export loading
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Total companies and active/inactive counts
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, company_code, is_active, created_at');
        if (companiesError) throw companiesError;

        setTotalCompanies(companies.length);
        const active = companies.filter(c => c.is_active === true).length;
        const inactive = companies.filter(c => c.is_active === false).length;
        setActiveCompanies(active);
        setInactiveCompanies(inactive);
        setStatusData({ labels: ['Active', 'Inactive'], counts: [active, inactive] });

        // 2. Total users
        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        if (usersError) throw usersError;
        setTotalUsers(usersCount || 0);

        // 3. User counts per company
        const companiesWithCounts: Company[] = [];
        for (const company of companies) {
          const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
          if (countError) throw countError;
          companiesWithCounts.push({
            ...company,
            user_count: count || 0,
          });
        }

        // Sort by user count descending, take top 5
        const sorted = companiesWithCounts.sort((a, b) => b.user_count - a.user_count);
        const top5 = sorted.slice(0, 5);
        setTopCompanies(top5);
        setTopLabels(top5.map(c => c.name.length > 20 ? c.name.slice(0, 20) + '...' : c.name));
        setTopCounts(top5.map(c => c.user_count));

      } catch (err: any) {
        console.error('Error fetching reports data:', err);
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const exportToCSV = async () => {
    setExportLoading(true);
    try {
      // Get all companies with user counts (reuse data from state, but fetch fresh if needed)
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, company_code, is_active, created_at');
      if (companiesError) throw companiesError;

      const companiesWithCounts = [];
      for (const company of companies) {
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id);
        if (countError) throw countError;
        companiesWithCounts.push({
          ...company,
          user_count: count || 0,
        });
      }

      const headers = ['Company Name', 'Code', 'Status', 'User Count', 'Created At'];
      const rows = companiesWithCounts.map(c => [
        c.name,
        c.company_code,
        c.is_active ? 'Active' : 'Inactive',
        c.user_count,
        new Date(c.created_at).toLocaleDateString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `companies_report_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Company Status Distribution' },
    },
  };

  const topCompaniesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Top 5 Companies by Number of Users' },
    },
  };

  const statusChartData = {
    labels: statusData.labels,
    datasets: [
      {
        label: 'Number of Companies',
        data: statusData.counts,
        backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const topCompaniesChartData = {
    labels: topLabels,
    datasets: [
      {
        label: 'Number of Users',
        data: topCounts,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <div className="reports-loading">Loading reports...</div>;
  if (error) return <div className="reports-error">{error}</div>;

  return (
    <div className="reports">
      <h1>Reports</h1>

      {/* Metrics Cards */}
      <div className="cards-grid">
        <div className="card">
          <div className="card-icon">🏢</div>
          <div className="card-value">{totalCompanies}</div>
          <div className="card-label">Total Companies</div>
        </div>
        <div className="card">
          <div className="card-icon">👥</div>
          <div className="card-value">{totalUsers}</div>
          <div className="card-label">Total Users</div>
        </div>
        <div className="card">
          <div className="card-icon">✅</div>
          <div className="card-value">{activeCompanies}</div>
          <div className="card-label">Active Companies</div>
        </div>
        <div className="card">
          <div className="card-icon">❌</div>
          <div className="card-value">{inactiveCompanies}</div>
          <div className="card-label">Inactive Companies</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-container">
          <Bar options={chartOptions} data={statusChartData} />
        </div>
        <div className="chart-container">
          {topCompanies.length > 0 ? (
            <Bar options={topCompaniesOptions} data={topCompaniesChartData} />
          ) : (
            <p>No company data available.</p>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="export-section">
        <button onClick={exportToCSV} disabled={exportLoading} className="export-button">
          {exportLoading ? 'Exporting...' : 'Export Company Data (CSV)'}
        </button>
      </div>
    </div>
  );
};

export default Reports;