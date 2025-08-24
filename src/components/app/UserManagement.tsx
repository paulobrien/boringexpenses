import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Edit3, Shield, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface CompanyUser {
  id: string;
  full_name: string;
  role: 'employee' | 'manager' | 'admin';
  manager_id: string | null;
  created_at: string;
  manager?: {
    id: string;
    full_name: string;
  };
}

const UserManagement: React.FC = () => {
  const { user, profile, canManageUsers } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingManagerFor, setEditingManagerFor] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const loadCompanyUsers = useCallback(async () => {
    if (!user || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          role, 
          manager_id,
          created_at,
          manager:profiles!manager_id(id, full_name)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading company users:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.company_id]);

  useEffect(() => {
    if (canManageUsers()) {
      loadCompanyUsers();
    } else {
      setLoading(false);
    }
  }, [canManageUsers, loadCompanyUsers]);

  const updateUserRole = async (userId: string, newRole: 'employee' | 'manager' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const updateUserManager = async (userId: string, managerId: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ manager_id: managerId })
        .eq('id', userId);

      if (error) throw error;

      // Reload users to get updated manager information
      await loadCompanyUsers();
      setEditingManagerFor(null);
    } catch (error) {
      console.error('Error updating user manager:', error);
      alert('Failed to update user manager');
    }
  };

  const getAvailableManagers = (excludeUserId: string) => {
    return users.filter(u => 
      u.id !== excludeUserId && 
      (u.role === 'manager' || u.role === 'admin')
    );
  };

  const inviteUser = async () => {
    if (!newUserEmail.trim()) return;

    setInviteLoading(true);
    try {
      // Note: In a real implementation, you would send an invitation email
      // For now, we'll just show a message
      alert(`Invitation would be sent to ${newUserEmail}. User will need to sign up and will be automatically added to your company.`);
      setNewUserEmail('');
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  if (!canManageUsers()) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>You don't have permission to manage users.</p>
          <p className="text-sm">Only company administrators can access this feature.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'manager':
        return <Users className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Company Users</h3>
          </div>
          <span className="text-sm text-gray-500">{users.length} users</span>
        </div>

        {/* Invite User */}
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Enter email address to invite"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={inviteUser}
            disabled={inviteLoading || !newUserEmail.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {inviteLoading ? 'Inviting...' : 'Invite'}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {users.map((companyUser) => (
            <div key={companyUser.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRoleIcon(companyUser.role)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {companyUser.full_name || 'Unnamed User'}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Joined {new Date(companyUser.created_at).toLocaleDateString()}</p>
                      {companyUser.manager && (
                        <p>Manager: {companyUser.manager.full_name}</p>
                      )}
                      {!companyUser.manager && companyUser.role === 'employee' && (
                        <p className="text-amber-600">No manager assigned</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Role Management */}
                  {editingUser === companyUser.id ? (
                    <select
                      value={companyUser.role}
                      onChange={(e) => updateUserRole(companyUser.id, e.target.value as 'employee' | 'manager' | 'admin')}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={companyUser.id === user?.id} // Can't change own role
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(companyUser.role)}`}>
                      {companyUser.role.charAt(0).toUpperCase() + companyUser.role.slice(1)}
                    </span>
                  )}

                  {/* Manager Assignment */}
                  {companyUser.role === 'employee' && editingManagerFor === companyUser.id ? (
                    <select
                      value={companyUser.manager_id || ''}
                      onChange={(e) => updateUserManager(companyUser.id, e.target.value || null)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">No Manager</option>
                      {getAvailableManagers(companyUser.id).map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.full_name}
                        </option>
                      ))}
                    </select>
                  ) : companyUser.role === 'employee' ? (
                    <button
                      onClick={() => setEditingManagerFor(companyUser.id)}
                      className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                      title="Assign manager"
                    >
                      Manager
                    </button>
                  ) : null}

                  {/* Edit Role Button */}
                  {companyUser.id !== user?.id && editingUser !== companyUser.id && (
                    <button
                      onClick={() => setEditingUser(companyUser.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit role"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;