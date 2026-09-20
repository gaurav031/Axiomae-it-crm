import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const AVAILABLE_PERMISSIONS = ['Leads', 'Pipeline', 'Calls', 'WhatsApp', 'Email', 'Analytics'];

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const { user: loggedInUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentUser._id) {
        await axios.put(`/api/users/${currentUser._id}`, currentUser);
        toast.success('User updated successfully');
      } else {
        await axios.post('/api/users', currentUser);
        toast.success('User created and welcome email sent');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      try {
        await axios.delete(`/api/users/${id}`);
        toast.success('User deleted');
        fetchUsers();
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  const openModal = (user?: any) => {
    if (user) {
      setCurrentUser(user);
      setIsEditing(true);
    } else {
      setCurrentUser({ role: 'Custom User', status: 'active', permissions: [] });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const togglePermission = (perm: string) => {
    const perms = currentUser.permissions || [];
    if (perms.includes(perm)) {
      setCurrentUser({ ...currentUser, permissions: perms.filter((p: string) => p !== perm) });
    } else {
      setCurrentUser({ ...currentUser, permissions: [...perms, perm] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button onClick={() => openModal()} className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Permissions</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {u.role === 'Super Admin' || u.permissions.includes('*') ? 'All Permissions' : u.permissions.join(', ') || 'None'}
                    </td>
                    <td className="px-6 py-4">
                      {u._id !== loggedInUser?.id && (
                        <div className="flex space-x-2">
                          <button onClick={() => openModal(u)} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                          <button onClick={() => handleDelete(u._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit User' : 'Create User'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input required type="text" value={currentUser.name || ''} onChange={e => setCurrentUser({...currentUser, name: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
              </div>
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (Used for login)</label>
                  <input required type="email" value={currentUser.email || ''} onChange={e => setCurrentUser({...currentUser, email: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select value={currentUser.role} onChange={e => setCurrentUser({...currentUser, role: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Staff</option>
                  <option>Custom User</option>
                </select>
              </div>
              
              {currentUser.role !== 'Super Admin' && (
                <div className="border border-gray-200 p-3 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Page Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm} className="flex items-center space-x-2 text-sm">
                        <input 
                          type="checkbox" 
                          checked={(currentUser.permissions || []).includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span>{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={currentUser.status} onChange={e => setCurrentUser({...currentUser, status: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
