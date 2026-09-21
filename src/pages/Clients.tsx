import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Building2, Phone, Mail, Globe, User, ChevronRight, Tag } from 'lucide-react';

interface Client {
  _id: string;
  clientId: string;
  companyName: string;
  contactPerson: string;
  email?: string;
  phone?: string;
  industry?: string;
  city?: string;
  state?: string;
  status: 'Active' | 'Inactive' | 'Churned';
  totalContractValue?: number;
  amountPaid?: number;
  projects: any[];
  assignedTo?: { name: string };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  Churned: 'bg-red-100 text-red-600 border-red-200',
};

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', phone: '', industry: '', city: '', state: '' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (userFilter) params.set('assignedTo', userFilter);
      const res = await api.get(`/clients?${params}`);
      setClients(res.data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [search, statusFilter, userFilter]);

  useEffect(() => {
    if (user?.role === 'Super Admin') {
      const fetchUsers = async () => {
        try {
          const res = await api.get('/users');
          setUsers(res.data);
        } catch (err) {
          console.error("Failed to fetch users");
        }
      };
      fetchUsers();
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', form);
      toast.success('Client created!');
      setShowCreateModal(false);
      setForm({ companyName: '', contactPerson: '', email: '', phone: '', industry: '', city: '', state: '' });
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create client');
    }
  };

  const totalRevenue = clients.reduce((s, c) => s + (c.totalContractValue || 0), 0);
  const totalPaid = clients.reduce((s, c) => s + (c.amountPaid || 0), 0);
  const activeProjects = clients.reduce((s, c) => s + c.projects.filter((p: any) => p.status === 'Active').length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage existing company clients and projects</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 font-medium text-sm shadow-sm">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, color: 'text-blue-600' },
          { label: 'Active Clients', value: clients.filter(c => c.status === 'Active').length, color: 'text-green-600' },
          { label: 'Active Projects', value: activeProjects, color: 'text-purple-600' },
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-emerald-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        {user?.role === 'Super Admin' && (
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Churned">Churned</option>
        </select>
      </div>

      {/* Client Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <Building2 className="w-12 h-12 text-gray-300 mb-3" />
          <p className="font-medium text-gray-500">No clients yet</p>
          <p className="text-sm text-gray-400 mt-1">Add a client manually or convert a WON lead from the Leads page</p>
          <button onClick={() => setShowCreateModal(true)} className="mt-4 text-sm text-primary font-medium hover:underline">+ Add first client</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <div key={client._id} onClick={() => navigate(`/clients/${client._id}`)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer p-5 group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{client.clientId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[client.status]}`}>{client.status}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-primary transition-colors">{client.companyName}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1"><User className="w-3 h-3" />{client.contactPerson}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors mt-1" />
              </div>

              <div className="space-y-1 mb-4">
                {client.email && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Mail className="w-3 h-3" />{client.email}</p>}
                {client.phone && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3 h-3" />{client.phone}</p>}
                {client.industry && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Tag className="w-3 h-3" />{client.industry}</p>}
                {(client.city || client.state) && <p className="text-xs text-gray-400">{[client.city, client.state].filter(Boolean).join(', ')}</p>}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Projects</p>
                  <p className="font-semibold text-gray-700 text-sm">{client.projects.length} ({client.projects.filter((p: any) => p.status === 'Active').length} active)</p>
                </div>
                {client.totalContractValue ? (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Contract Value</p>
                    <p className="font-semibold text-emerald-600 text-sm">₹{client.totalContractValue.toLocaleString('en-IN')}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
              <p className="text-sm text-gray-500 mt-1">Or convert a lead from the Leads page using "Convert to Client"</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
                  <input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person *</label>
                  <input required value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
                  <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-sm">Create Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
