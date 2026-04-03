import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import "./UserManagement.css";

interface Company {
  id: string;
  name: string;
  company_code: string;
  is_active: boolean;
}

const UserManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);
      setTotalCompanies(companiesData?.length || 0);

      const { count: usersCount, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });
      if (usersError) throw usersError;
      setTotalUsers(usersCount || 0);
    } catch (err: any) {
      console.error("Error fetching data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleActive = async (id: string, currentActive: boolean) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ is_active: !currentActive })
        .eq("id", id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCompany = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this company? This will also delete all associated users, products, etc. (if CASCADE is set).")) return;
    setActionLoading(id);
    try {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="user-management-loading">Loading dashboard...</div>;

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>Super Admin Dashboard</h1>
        <p className="subtitle">Manage companies and users across the platform</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-value">{totalCompanies}</div>
          <div className="stat-label">Total Companies</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
      </div>

      <div className="table-container">
        <h2>Company Management</h2>
        <table className="company-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.company_code}</td>
                <td>
                  <span className={`status-badge ${c.is_active ? "active" : "inactive"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className={`action-btn ${c.is_active ? "disable" : "enable"}`}
                    onClick={() => toggleActive(c.id, c.is_active)}
                    disabled={actionLoading === c.id}
                  >
                    {c.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => deleteCompany(c.id)}
                    disabled={actionLoading === c.id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;