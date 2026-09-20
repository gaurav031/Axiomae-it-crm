import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Edit2, Trash2, Building2, Phone, Mail, Globe, MapPin, Tag, User, IndianRupee, Calendar, CheckCircle, Clock, XCircle, Briefcase } from 'lucide-react';

const PROJECT_STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Completed: 'bg-blue-100 text-blue-700 border-blue-200',
  'On Hold': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-100 text-red-600 border-red-200',
};

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'edit'>('overview');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'Active', startDate: '', expectedEndDate: '', budget: '', amountPaid: '' });
  const [editForm, setEditForm] = useState<any>({});

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/clients/${id}`);
      setClient(res.data);
      setEditForm(res.data);
    } catch {
      toast.error('Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClient(); }, [id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/clients/${id}`, editForm);
      toast.success('Client updated!');
      fetchClient();
      setActiveTab('overview');
    } catch {
      toast.error('Failed to update client');
    }
  };

  const openProjectModal = (project?: any) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({ name: project.name, description: project.description || '', status: project.status, startDate: project.startDate?.slice(0,10) || '', expectedEndDate: project.expectedEndDate?.slice(0,10) || '', budget: project.budget || '', amountPaid: project.amountPaid || '' });
    } else {
      setEditingProject(null);
      setProjectForm({ name: '', description: '', status: 'Active', startDate: '', expectedEndDate: '', budget: '', amountPaid: '' });
    }
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...projectForm, budget: projectForm.budget ? Number(projectForm.budget) : undefined, amountPaid: projectForm.amountPaid ? Number(projectForm.amountPaid) : 0 };
      if (editingProject) {
        await api.put(`/clients/${id}/projects/${editingProject._id}`, data);
        toast.success('Project updated!');
      } else {
        await api.post(`/clients/${id}/projects`, data);
        toast.success('Project added!');
      }
      setShowProjectModal(false);
      fetchClient();
    } catch {
      toast.error('Failed to save project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/clients/${id}/projects/${projectId}`);
      toast.success('Project deleted');
      fetchClient();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm('Delete this client permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      navigate('/clients');
    } catch {
      toast.error('Failed to delete client');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading client...</div>;
  if (!client) return <div className="text-center py-16 text-gray-500">Client not found.</div>;

  const balance = (client.totalContractValue || 0) - (client.amountPaid || 0);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clients')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{client.clientId}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${client.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{client.status}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><User className="w-3.5 h-3.5" />{client.contactPerson}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/documents?clientId=${client._id}&clientName=${client.companyName}`)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
            📄 Generate Document
          </button>
          <button onClick={handleDeleteClient} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 font-medium">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Contract Value', value: `₹${(client.totalContractValue || 0).toLocaleString('en-IN')}`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Amount Paid', value: `₹${(client.amountPaid || 0).toLocaleString('en-IN')}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Balance Due', value: `₹${balance.toLocaleString('en-IN')}`, color: balance > 0 ? 'text-red-600' : 'text-gray-600', bg: balance > 0 ? 'bg-red-50' : 'bg-gray-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100`}>
            <p className="text-xs text-gray-500 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {(['overview', 'projects', 'edit'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'projects' ? `Projects (${client.projects.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Contact Information</h2>
            <div className="space-y-3">
              {[
                { icon: <Building2 className="w-4 h-4" />, label: 'Company', value: client.companyName },
                { icon: <User className="w-4 h-4" />, label: 'Contact', value: client.contactPerson },
                { icon: <Mail className="w-4 h-4" />, label: 'Email', value: client.email || '—' },
                { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: client.phone || '—' },
                { icon: <Globe className="w-4 h-4" />, label: 'Website', value: client.website || '—' },
                { icon: <Tag className="w-4 h-4" />, label: 'Industry', value: client.industry || '—' },
                { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: [client.city, client.state, client.country].filter(Boolean).join(', ') || '—' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-gray-400 flex-shrink-0">{row.icon}</span>
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{row.label}</span>
                  <span className="text-sm text-gray-700 font-medium truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-4">Contract Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Contract Signed</span>
                <span className={`font-medium ${client.contractSigned ? 'text-green-600' : 'text-red-500'}`}>{client.contractSigned ? '✓ Yes' : '✗ No'}</span>
              </div>
              {client.contractDate && <div className="flex justify-between text-sm"><span className="text-gray-500">Contract Date</span><span className="font-medium">{new Date(client.contractDate).toLocaleDateString()}</span></div>}
              {client.assignedTo && <div className="flex justify-between text-sm"><span className="text-gray-500">Account Manager</span><span className="font-medium">{client.assignedTo.name}</span></div>}
              {client.leadId && <div className="flex justify-between text-sm"><span className="text-gray-500">Source Lead</span><span className="font-medium text-primary">{client.leadId.fullName}</span></div>}
            </div>
            {client.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-2">Notes</p>
                <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100">{client.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-700">Projects</h2>
            <button onClick={() => openProjectModal()} className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Add Project
            </button>
          </div>

          {client.projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <Briefcase className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No projects yet</p>
              <button onClick={() => openProjectModal()} className="mt-3 text-sm text-primary font-medium hover:underline">+ Add first project</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.projects.map((project: any) => (
                <div key={project._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{project.name}</h3>
                      {project.description && <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PROJECT_STATUS_COLORS[project.status]}`}>{project.status}</span>
                      <button onClick={() => openProjectModal(project)} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteProject(project._id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    {project.startDate && <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>}
                    {project.expectedEndDate && <span>End: {new Date(project.expectedEndDate).toLocaleDateString()}</span>}
                  </div>
                  {project.budget && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                      <span className="text-gray-500">Budget: <strong>₹{Number(project.budget).toLocaleString('en-IN')}</strong></span>
                      <span className="text-green-600">Paid: <strong>₹{Number(project.amountPaid || 0).toLocaleString('en-IN')}</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'edit' && (
        <form onSubmit={handleSaveEdit} className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-800 mb-5">Edit Client</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'companyName', label: 'Company Name', required: true },
              { key: 'contactPerson', label: 'Contact Person', required: true },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'phone', label: 'Phone' },
              { key: 'website', label: 'Website' },
              { key: 'industry', label: 'Industry' },
              { key: 'city', label: 'City' },
              { key: 'state', label: 'State' },
              { key: 'totalContractValue', label: 'Contract Value (₹)', type: 'number' },
              { key: 'amountPaid', label: 'Amount Paid (₹)', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input required={f.required} type={f.type || 'text'} value={editForm[f.key] || ''} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none">
                <option>Active</option><option>Inactive</option><option>Churned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contract Signed</label>
              <select value={editForm.contractSigned ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, contractSigned: e.target.value === 'true' })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none">
                <option value="false">No</option><option value="true">Yes</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea rows={3} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setActiveTab('overview')} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">Save Changes</button>
          </div>
        </form>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingProject ? 'Edit Project' : 'Add Project'}</h2>
            </div>
            <form onSubmit={handleSaveProject} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project Name *</label>
                <input required value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={2} value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={projectForm.startDate} onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={projectForm.expectedEndDate} onChange={e => setProjectForm({ ...projectForm, expectedEndDate: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Budget (₹)</label>
                  <input type="number" value={projectForm.budget} onChange={e => setProjectForm({ ...projectForm, budget: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid (₹)</label>
                  <input type="number" value={projectForm.amountPaid} onChange={e => setProjectForm({ ...projectForm, amountPaid: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none">
                  <option>Active</option><option>Completed</option><option>On Hold</option><option>Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
