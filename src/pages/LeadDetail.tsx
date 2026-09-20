import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Phone, Mail, MapPin, Building, Globe, Tag, Calendar, Clock, ArrowLeft, MessageSquare, Plus, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [convertingToClient, setConvertingToClient] = useState(false);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  // Forms state
  const [editForm, setEditForm] = useState<any>({});
  const [followUpForm, setFollowUpForm] = useState({ date: '', time: '', type: 'Call', priority: 'Medium', notes: '' });
  const [noteContent, setNoteContent] = useState('');

  // This would typically fetch activities/timeline from a separate endpoint, 
  // but for now we'll just mock it or skip it if the API doesn't support it yet.
  
  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/leads/${id}`);
        setLead(res.data);
      } catch (err) {
        toast.error('Failed to load lead details');
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...editForm };
      if (typeof payload.tags === 'string') {
        payload.tags = payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
      await api.put(`/leads/${id}`, payload);
      toast.success('Lead updated successfully');
      setLead({ ...lead, ...payload });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update lead');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        await api.delete(`/leads/${id}`);
        toast.success('Lead deleted');
        window.location.href = '/leads';
      } catch (err: any) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleConvertToClient = async () => {
    if (!confirm('Convert this lead to a client? The lead status will be updated to WON.')) return;
    try {
      setConvertingToClient(true);
      const res = await api.post(`/clients/from-lead/${id}`);
      toast.success('Lead converted to client!');
      navigate(`/clients/${res.data.client._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to convert to client');
    } finally {
      setConvertingToClient(false);
    }
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...followUpForm,
        leadId: id,
        assignedTo: user?._id || lead.assignedTo?._id
      };
      await api.post('/follow-ups', payload);
      toast.success('Follow-up scheduled');
      setIsFollowUpModalOpen(false);
      setFollowUpForm({ date: '', time: '', type: 'Call', priority: 'Medium', notes: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule follow-up');
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent) return;
    try {
      await api.post('/follow-ups', {
        leadId: id,
        assignedTo: user?._id || lead.assignedTo?._id,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        type: 'Other',
        priority: 'Low',
        notes: noteContent,
        status: 'Completed'
      });
      toast.success('Note added');
      setIsNoteModalOpen(false);
      setNoteContent('');
    } catch (err: any) {
      toast.error('Failed to add note');
    }
  };

  if (loading) return <div className="text-center py-20">Loading lead details...</div>;
  if (!lead) return <div className="text-center py-20 text-gray-500">Lead not found</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link to="/leads" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{lead.fullName}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          lead.status === 'WON' ? 'bg-green-100 text-green-800' : 
          lead.status === 'LOST' ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {lead.status}
        </span>
        <div className="ml-auto flex space-x-2">
            {lead.status === 'WON' && (
              <button
                onClick={handleConvertToClient}
                disabled={convertingToClient}
                className="px-3 py-1.5 text-sm bg-emerald-600 text-white border border-emerald-600 rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60"
              >
                {convertingToClient ? 'Converting...' : '🏢 Convert to Client'}
              </button>
            )}
            <button
              onClick={() => navigate(`/documents?leadId=${id}&leadName=${encodeURIComponent(lead.fullName)}`)}
              className="px-3 py-1.5 text-sm bg-violet-600 text-white border border-violet-600 rounded hover:bg-violet-700 transition-colors font-medium"
            >
              📄 Generate Doc
            </button>
            <button 
                onClick={() => { setEditForm({
                    fullName: lead.fullName, company: lead.company, email: lead.email,
                    phoneNumber: lead.phoneNumber, priority: lead.priority, status: lead.status,
                    source: lead.source, tags: lead.tags?.join(', ') || ''
                }); setIsEditModalOpen(true); }}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
                Edit
            </button>
            <button 
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
            >
                Delete
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Contact Info</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <Phone className="w-5 h-5 mr-3 text-gray-400" />
                <span>{lead.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                <span className="truncate">{lead.email || 'N/A'}</span>
              </div>
              {lead.alternatePhone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{lead.alternatePhone} (Alt)</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Company Info</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <Building className="w-5 h-5 mr-3 text-gray-400" />
                <span>{lead.company || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Globe className="w-5 h-5 mr-3 text-gray-400" />
                <span className="truncate">{lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{lead.website}</a> : 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                <span>{[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">CRM Details</h2>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">Priority</span>
                <p className="font-medium mt-1">{lead.priority}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">Source</span>
                <p className="font-medium mt-1">{lead.source}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">Assigned To</span>
                <p className="font-medium mt-1">{lead.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">Tags</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lead.tags && lead.tags.length > 0 ? lead.tags.map((t: string) => (
                    <span key={t} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                      {t}
                    </span>
                  )) : <span className="text-sm text-gray-400">No tags</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activities, Notes, Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsNoteModalOpen(true)}
                  className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" /> Note
                </button>
                <button 
                  onClick={() => setIsFollowUpModalOpen(true)}
                  className="flex items-center px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm rounded transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-1.5" /> Follow-up
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Dummy Timeline item since we don't have activity API connected yet */}
              <div className="relative pl-6 border-l-2 border-gray-200">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                <div className="mb-1 text-sm text-gray-500">
                  {format(new Date(lead.createdAt), 'MMM d, yyyy h:mm a')}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="font-medium text-gray-900">Lead Created</p>
                  <p className="text-sm text-gray-600 mt-1">Lead was created in the system via {lead.source}.</p>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-400 pt-4">
                End of history
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Lead</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input required type="text" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input type="text" value={editForm.company || ''} onChange={e => setEditForm({...editForm, company: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="text" value={editForm.phoneNumber || ''} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source</label>
                  <input type="text" value={editForm.source || ''} onChange={e => setEditForm({...editForm, source: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                  <input type="text" value={editForm.tags || ''} onChange={e => setEditForm({...editForm, tags: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-primary outline-none" placeholder="e.g. vip, referral" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Follow-up</h2>
            <form onSubmit={handleSaveFollowUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date *</label>
                  <input required type="date" value={followUpForm.date} onChange={e => setFollowUpForm({...followUpForm, date: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time *</label>
                  <input required type="time" value={followUpForm.time} onChange={e => setFollowUpForm({...followUpForm, time: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select value={followUpForm.type} onChange={e => setFollowUpForm({...followUpForm, type: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none">
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Demo">Demo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select value={followUpForm.priority} onChange={e => setFollowUpForm({...followUpForm, priority: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea rows={3} value={followUpForm.notes} onChange={e => setFollowUpForm({...followUpForm, notes: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="What is this follow up about?" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsFollowUpModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Note</h2>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Note Content *</label>
                <textarea required rows={4} value={noteContent} onChange={e => setNoteContent(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="Enter note details..." />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
