// src/pages/Roles/pharmacy-admin/StaffManagement.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../../context/UserContext';
import { supabaseAdmin } from '../../../lib/supabase';
import './StaffManagement.css';

interface User {
  id: string;
  name: string;
  role: string;
  status: string; // 'active' or 'inactive'
  created_at?: string;
}

const StaffManagement: React.FC = () => {
  const { user } = useUser();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const hasFetched = useRef(false); // Prevent double fetch

  useEffect(() => {
    const fetchStaff = async () => {
      if (!user?.company_id || hasFetched.current) return;

      setLoading(true);
      try {
        const { data, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('id, name, role, status, created_at')
          .eq('company_id', user.company_id)
          .eq('role', 'pharmacist')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setStaff(data || []);
        hasFetched.current = true; // Mark as fetched
      } catch (err: any) {
        console.error('Error fetching staff:', err);
        setError(err.message || 'Failed to load staff members');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [user?.company_id]); // Only re-run if company ID changes

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this staff member?`)) return;

    setUpdatingId(userId);
    try {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (updateError) throw updateError;
      setStaff(prev => prev.map(m => m.id === userId ? { ...m, status: newStatus } : m));
    } catch (err: any) {
      console.error('Error updating staff status:', err);
      alert(`Failed to ${action} staff member: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this staff member? This action cannot be undone.')) return;

    setUpdatingId(userId);
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;
      setStaff(prev => prev.filter(m => m.id !== userId));
    } catch (err: any) {
      console.error('Error deleting staff:', err);
      alert(`Failed to delete staff member: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="staff-loading">Loading staff members...</div>;
  if (error) return <div className="staff-error">{error}</div>;

  return (
    <div className="staff-management">
      <h1>Staff Management</h1>
      <p>Manage your pharmacy staff (pharmacists).</p>

      {staff.length === 0 ? (
        <div className="no-staff">No staff members found.</div>
      ) : (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id} className={member.status === 'inactive' ? 'inactive-row' : ''}>
                <td>{member.name}</td>
                <td>{member.role}</td>
                <td>
                  <span className={`status-badge ${member.status}`}>
                    {member.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}</td>
                <td className="actions">
                  {member.id !== user?.id && (
                    <>
                      <button
                        className={`status-toggle ${member.status === 'active' ? 'deactivate' : 'activate'}`}
                        onClick={() => toggleStatus(member.id, member.status)}
                        disabled={updatingId === member.id}
                      >
                        {updatingId === member.id ? '...' : (member.status === 'active' ? 'Deactivate' : 'Activate')}
                      </button>
                      <button
                        className="delete-permanent"
                        onClick={() => deleteUser(member.id)}
                        disabled={updatingId === member.id}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {member.id === user?.id && <span className="self-note">(You)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StaffManagement;