import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Edit3, Shield, User, X, Clock, Mail, Check } from 'lucide-react';
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
  } | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  status: 'pending' | 'accepted' | 'revoked';
  expires_at: string;
  created_at: string;
  invited_by_user_id: string;
}

const UserManagement: React.FC = () => {
  const { user, profile, canManageUsers } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingManagerFor, setEditingManagerFor] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<'employee' | 'manager' | 'admin' | null>(null);
  const [tempManagerId, setTempManagerId] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'employee' | 'manager' | 'admin'>('employee');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          manager:manager_id(id, full_name)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Supabase returns manager as an array with the foreign key syntax, so we need to handle it
      const processedData = data?.map(user => ({
        ...user,
        manager: Array.isArray(user.manager) ? user.manager[0] : user.manager
      })) || [];
      
      setUsers(processedData);
    } catch (error) {
      console.error('Error loading company users:', error);
      setError('Failed to load company users');
    }
  }, [user, profile?.company_id]);

  const loadPendingInvites = useCallback(async () => {
    if (!user || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingInvites(data || []);
    } catch (error) {
      console.error('Error loading pending invites:', error);
      setError('Failed to load pending invites');
    }
  }, [user, profile?.company_id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCompanyUsers(), loadPendingInvites()]);
    setLoading(false);
  }, [loadCompanyUsers, loadPendingInvites]);

  useEffect(() => {
    // Check role directly from profile instead of using canManageUsers function
    if (profile?.role === 'admin') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [profile?.role, loadData]);

  const updateUserRole = async (userId: string, newRole: 'employee' | 'manager' | 'admin') => {
    try {
      // Prevent users from modifying their own role
      if (userId === user?.id) {
        setError('You cannot change your own role');
        setTimeout(() => setError(null), 3000);
        setEditingUser(null);
        setTempRole(null);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
      setTempRole(null);
      setSuccess('User role updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update user role. You can only modify users in your company.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const startEditRole = (userId: string, currentRole: 'employee' | 'manager' | 'admin') => {
    setEditingUser(userId);
    setTempRole(currentRole);
  };

  const cancelEditRole = () => {
    setEditingUser(null);
    setTempRole(null);
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
      setTempManagerId(null);
      setSuccess('Manager assignment updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating user manager:', error);
      setError('Failed to update user manager');
      setTimeout(() => setError(null), 3000);
    }
  };

  const startEditManager = (userId: string, currentManagerId: string | null) => {
    setEditingManagerFor(userId);
    setTempManagerId(currentManagerId);
  };

  const cancelEditManager = () => {
    setEditingManagerFor(null);
    setTempManagerId(null);
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
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: newUserEmail.trim(),
          role: newUserRole
        }
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(data.message);
        setNewUserEmail('');
        setNewUserRole('employee');
        
        // Reload data to show updated state
        if (data.existing_user) {
          await loadCompanyUsers(); // Existing user was added directly
        } else {
          await loadPendingInvites(); // New invite was created
        }
      } else {
        setError(data.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('invites')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) throw error;

      setSuccess('Invitation revoked successfully');
      await loadPendingInvites();
    } catch (error) {
      console.error('Error revoking invite:', error);
      setError('Failed to revoke invitation');
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
          <span className="text-sm text-gray-500">
            {users.length} users {pendingInvites.length > 0 && `• ${pendingInvites.length} pending invites`}
          </span>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Invite User */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address to invite"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'employee' | 'manager' | 'admin')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
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
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-yellow-600 mr-2" />
              <h4 className="text-sm font-medium text-yellow-800">Pending Invitations</h4>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                      <p className="text-xs text-gray-500">
                        Invited as {invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                    <button
                      onClick={() => revokeInvite(invite.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Revoke invitation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                      {/* Only show manager info for non-admin roles */}
                      {companyUser.role !== 'admin' && (
                        <p className={companyUser.manager ? '' : 'text-amber-600'}>
                          {companyUser.manager ? `Manager: ${companyUser.manager.full_name}` : 'No Manager Assigned'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Role Management */}
                  {editingUser === companyUser.id ? (
                    <div className="flex items-center space-x-1">
                      <select
                        value={tempRole || companyUser.role}
                        onChange={(e) => setTempRole(e.target.value as 'employee' | 'manager' | 'admin')}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => tempRole && updateUserRole(companyUser.id, tempRole)}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Confirm"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditRole}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : editingManagerFor === companyUser.id ? (
                    <div className="flex items-center space-x-1">
                      <select
                        value={tempManagerId !== null ? tempManagerId : (companyUser.manager_id || '')}
                        onChange={(e) => setTempManagerId(e.target.value || null)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">No Manager</option>
                        {getAvailableManagers(companyUser.id).map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateUserManager(companyUser.id, tempManagerId)}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Confirm"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditManager}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(companyUser.role)}`}>
                        {companyUser.role.charAt(0).toUpperCase() + companyUser.role.slice(1)}
                      </span>
                      {/* Only show edit options for other users, not yourself */}
                      {companyUser.id !== user?.id && (
                        <div className="relative group">
                          <button
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit user settings"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {/* Invisible hover bridge - covers gap between button and dropdown */}
                          <div className="hidden group-hover:block absolute right-0 -top-2 -bottom-12 w-36 z-10"></div>
                          {/* Dropdown menu */}
                          <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                            <button
                              onClick={() => startEditRole(companyUser.id, companyUser.role)}
                              className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-t-md"
                            >
                              Change Role
                            </button>
                            {companyUser.role !== 'admin' && (
                              <button
                                onClick={() => startEditManager(companyUser.id, companyUser.manager_id)}
                                className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 border-t border-gray-100 rounded-b-md"
                              >
                                Assign Manager
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Show "You" badge for current user */}
                      {companyUser.id === user?.id && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                          You
                        </span>
                      )}
                    </>
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