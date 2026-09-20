import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Upload, MoreHorizontal, Download } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Lead {
  _id: string;
  fullName: string;
  company?: string;
  email?: string;
  phoneNumber?: string;
  status: string;
  priority: string;
  source: string;
  assignedTo?: { _id: string, name: string };
  createdAt: string;
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state for adding a lead
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ fullName: '', company: '', email: '', phoneNumber: '', priority: 'Medium' });
  
  // Selection for bulk actions
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);
      
      const res = await api.get(`/leads?${query.toString()}`);
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l._id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const handleSelect = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
      setIsAllSelected(false);
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) {
      try {
        await api.post('/leads/bulk-delete', { leadIds: selectedLeads });
        toast.success('Leads deleted');
        setSelectedLeads([]);
        setIsAllSelected(false);
        fetchLeads();
      } catch (err) {
        toast.error('Failed to delete leads');
      }
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/leads', newLead);
      toast.success('Lead added successfully');
      setIsModalOpen(false);
      setNewLead({ fullName: '', company: '', email: '', phoneNumber: '', priority: 'Medium' });
      fetchLeads();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add lead');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'CONTACTED': return 'bg-yellow-100 text-yellow-800';
      case 'WON': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <div className="flex space-x-3">
          <Link to="/leads/import" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 shadow-sm transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center hover:bg-primary/90 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-4">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>
          
          {selectedLeads.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{selectedLeads.length} selected</span>
              <button onClick={handleBulkDelete} className="text-sm px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors">
                Delete Selected
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-10">
                  <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="rounded border-gray-300 text-primary focus:ring-primary" />
                </th>
                <th className="px-6 py-3">Lead Name</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-50 rounded-full p-3 mb-3">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-base font-medium text-gray-900">No leads found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead._id} className={`bg-white border-b hover:bg-gray-50 transition-colors ${selectedLeads.includes(lead._id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.includes(lead._id)} 
                        onChange={() => handleSelect(lead._id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.fullName}</div>
                      {lead.company && <div className="text-xs text-gray-500 mt-1">{lead.company}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{lead.phoneNumber || '-'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{lead.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {lead.source}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/leads/${lead._id}`} className="text-gray-400 hover:text-primary p-2 rounded hover:bg-primary/10 transition-colors inline-block" title="View Lead Details">
                        <MoreHorizontal className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50 rounded-b-lg">
          <div>Showing 1 to {leads.length} of {leads.length} entries</div>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 border border-gray-300 rounded hover:bg-white bg-gray-50 disabled:opacity-50 transition-colors" disabled>Previous</button>
            <button className="px-3 py-1.5 border border-gray-300 rounded hover:bg-white bg-gray-50 disabled:opacity-50 transition-colors" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Lead</h2>
            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input 
                  required 
                  type="text" 
                  value={newLead.fullName} 
                  onChange={e => setNewLead({...newLead, fullName: e.target.value})} 
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company / Organization</label>
                <input 
                  type="text" 
                  value={newLead.company} 
                  onChange={e => setNewLead({...newLead, company: e.target.value})} 
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input 
                    type="text" 
                    value={newLead.phoneNumber} 
                    onChange={e => setNewLead({...newLead, phoneNumber: e.target.value})} 
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input 
                    type="email" 
                    value={newLead.email} 
                    onChange={e => setNewLead({...newLead, email: e.target.value})} 
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select 
                  value={newLead.priority} 
                  onChange={e => setNewLead({...newLead, priority: e.target.value})} 
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
