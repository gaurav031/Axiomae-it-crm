import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Download, X, ChevronDown, AlertTriangle } from 'lucide-react';

interface Lead {
  _id: string;
  fullName: string;
  company?: string;
  status: string;
  priority: string;
  source: string;
  nextFollowUp?: string;
  phoneNumber?: string;
  email?: string;
  assignedTo?: any;
}

interface Column {
  id: string;
  title: string;
  color: string;
  headerBg: string;
  leads: Lead[];
}

const BATCH_OPTIONS = [25, 50, 100];

const Pipeline = () => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'NEW', title: 'New', color: 'border-blue-300', headerBg: 'bg-blue-50', leads: [] },
    { id: 'CONTACTED', title: 'Contacted', color: 'border-indigo-300', headerBg: 'bg-indigo-50', leads: [] },
    { id: 'FOLLOW UP', title: 'Follow Up', color: 'border-amber-300', headerBg: 'bg-amber-50', leads: [] },
    { id: 'QUALIFIED', title: 'Qualified', color: 'border-teal-300', headerBg: 'bg-teal-50', leads: [] },
    { id: 'PROPOSAL', title: 'Proposal', color: 'border-purple-300', headerBg: 'bg-purple-50', leads: [] },
    { id: 'NEGOTIATION', title: 'Negotiation', color: 'border-orange-300', headerBg: 'bg-orange-50', leads: [] },
    { id: 'WON', title: 'Won', color: 'border-green-300', headerBg: 'bg-green-50', leads: [] },
    { id: 'LOST', title: 'Lost', color: 'border-red-300', headerBg: 'bg-red-50', leads: [] },
    { id: 'WRONG INFORMATION', title: 'Wrong Info', color: 'border-rose-300', headerBg: 'bg-rose-50', leads: [] },
  ]);

  const [draggedLead, setDraggedLead] = useState<{ lead: Lead; sourceColumnId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Action Modal state
  const [actionModalLead, setActionModalLead] = useState<{ lead: Lead; newStatus: string; actionType: 'NOTE' | 'FOLLOW_UP' } | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [followUpForm, setFollowUpForm] = useState({ date: '', time: '', type: 'Call', priority: 'Medium', notes: '' });

  // Import Leads Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importBatch, setImportBatch] = useState(25);
  const [importableLeads, setImportableLeads] = useState<Lead[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [selectedImportLeads, setSelectedImportLeads] = useState<Set<string>>(new Set());
  const [totalNewLeads, setTotalNewLeads] = useState(0);

  const [users, setUsers] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const query = userFilter ? `?assignedTo=${userFilter}` : '';
      const res = await api.get(`/leads${query}`);
      const leads: Lead[] = res.data;
      setTotalNewLeads(leads.filter(l => l.status === 'NEW').length);

      setColumns(prev => prev.map(col => ({
        ...col,
        leads: leads.filter(l => l.status === col.id)
      })));
    } catch (err) {
      console.error('Failed to load leads for pipeline', err);
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [userFilter]);

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

  // Fetch importable NEW leads when modal opens or batch changes
  const openImportModal = async () => {
    setShowImportModal(true);
    await loadImportableLeads(importBatch);
  };

  const loadImportableLeads = async (batch: number) => {
    try {
      setImportLoading(true);
      // Get leads that are NEW and not yet in the pipeline columns (we just fetch top N NEW leads)
      const res = await api.get(`/leads?status=NEW&limit=${batch}`);
      setImportableLeads(res.data);
      setSelectedImportLeads(new Set(res.data.map((l: Lead) => l._id)));
    } catch (err) {
      toast.error('Failed to load leads');
    } finally {
      setImportLoading(false);
    }
  };

  const handleBatchChange = (batch: number) => {
    setImportBatch(batch);
    loadImportableLeads(batch);
  };

  const toggleSelectLead = (id: string) => {
    setSelectedImportLeads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedImportLeads.size === importableLeads.length) {
      setSelectedImportLeads(new Set());
    } else {
      setSelectedImportLeads(new Set(importableLeads.map(l => l._id)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedImportLeads.size === 0) {
      toast.error('No leads selected');
      return;
    }
    // These leads are already NEW, just close modal and refresh to show them in NEW column
    // If you want to mark them differently (e.g. pipeline-active) you can add a flag
    toast.success(`${selectedImportLeads.size} lead(s) added to pipeline view`);
    setShowImportModal(false);
    fetchLeads();
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead, columnId: string) => {
    setDraggedLead({ lead, sourceColumnId: columnId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedLead) return;

    const { lead, sourceColumnId } = draggedLead;

    if (sourceColumnId === targetColumnId) {
      setDraggedLead(null);
      return;
    }

    setColumns(prevColumns =>
      prevColumns.map(col => {
        if (col.id === sourceColumnId) return { ...col, leads: col.leads.filter(l => l._id !== lead._id) };
        if (col.id === targetColumnId) {
          if (col.leads.some(l => l._id === lead._id)) return col;
          return { ...col, leads: [...col.leads, { ...lead, status: targetColumnId }] };
        }
        return col;
      })
    );

    try {
      await api.put(`/leads/${lead._id}`, { status: targetColumnId });
      toast.success(`Moved ${lead.fullName} to ${targetColumnId}`);

      if (targetColumnId === 'WRONG INFORMATION') {
        // No follow up needed for wrong info
      } else {
        setActionModalLead({
          lead,
          newStatus: targetColumnId,
          actionType: targetColumnId === 'FOLLOW UP' ? 'FOLLOW_UP' : 'NOTE',
        });
      }
    } catch (err) {
      console.error('Failed to update lead status', err);
      toast.error('Error updating lead status');
      fetchLeads();
    }

    setDraggedLead(null);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalLead) return;
    try {
      if (actionModalLead.actionType === 'NOTE') {
        if (!noteContent) return;
        await api.post('/follow-ups', {
          leadId: actionModalLead.lead._id,
          assignedTo: actionModalLead.lead.assignedTo?._id || actionModalLead.lead.assignedTo || user?._id || user?.id,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          type: 'Other',
          priority: 'Low',
          notes: `[Moved to ${actionModalLead.newStatus}] ${noteContent}`,
          status: 'Completed',
        });
        toast.success('Note added successfully');
      } else {
        if (!followUpForm.date || !followUpForm.time) return;
        await api.post('/follow-ups', { ...followUpForm, leadId: actionModalLead.lead._id, assignedTo: actionModalLead.lead.assignedTo?._id || actionModalLead.lead.assignedTo || user?._id || user?.id });
        const nextFollowUpStr = `${followUpForm.date} ${followUpForm.time}`;
        await api.put(`/leads/${actionModalLead.lead._id}`, { nextFollowUp: nextFollowUpStr });
        setColumns(prevColumns =>
          prevColumns.map(col => {
            if (col.id === 'FOLLOW UP') {
              return {
                ...col,
                leads: col.leads.map(l => l._id === actionModalLead.lead._id ? { ...l, nextFollowUp: nextFollowUpStr } : l),
              };
            }
            return col;
          })
        );
        toast.success('Follow-up scheduled successfully');
      }
      setActionModalLead(null);
      setNoteContent('');
      setFollowUpForm({ date: '', time: '', type: 'Call', priority: 'Medium', notes: '' });
    } catch (err: any) {
      toast.error('Failed to save data');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 border border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border border-yellow-200';
      case 'Low': return 'text-blue-600 bg-blue-50 border border-blue-200';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalNewLeads > 0 && <span className="text-blue-600 font-medium">{totalNewLeads} new lead{totalNewLeads !== 1 ? 's' : ''} available to import</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'Super Admin' && (
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={openImportModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 shadow-sm font-medium text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Import Leads to Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max h-full items-stretch">
          {columns.map(column => (
            <div
              key={column.id}
              className={`w-64 bg-white rounded-xl flex flex-col max-h-full border-t-4 ${column.color} shadow-sm border border-gray-200`}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, column.id)}
            >
              <div className={`p-3 border-b border-gray-100 ${column.headerBg} rounded-t-lg`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                    {column.id === 'WRONG INFORMATION' && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                    {column.title}
                  </h3>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-600 shadow-sm border border-gray-200">
                    {column.leads.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5">
                {loading ? (
                  <div className="text-center text-gray-400 text-sm py-6">Loading...</div>
                ) : (
                  column.leads.map(lead => (
                    <div
                      key={lead._id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead, column.id)}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                      title={`Name: ${lead.fullName}\nCompany: ${lead.company || 'N/A'}\nPhone: ${lead.phoneNumber || 'N/A'}\nEmail: ${lead.email || 'N/A'}\nSource: ${lead.source}`}
                      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-md transition-all"
                    >
                      <div className="font-medium text-gray-900 text-sm truncate mb-0.5">{lead.fullName}</div>
                      {lead.company && <div className="text-[11px] text-gray-500 mb-2 truncate">{lead.company}</div>}

                      {lead.nextFollowUp && column.id === 'FOLLOW UP' && (
                        <div className="mb-2 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded inline-block">
                          {new Date(lead.nextFollowUp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${getPriorityColor(lead.priority)}`}>
                          {lead.priority || 'Normal'}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 truncate max-w-[90px]">
                          {lead.source}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {!loading && column.leads.length === 0 && (
                  <div className="h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 bg-gray-50/50">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Import Leads Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Import Leads to Pipeline</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select how many NEW leads to load into the pipeline. Work through them, then import the next batch.
                </p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Batch Size Selector */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Load top:</span>
                {BATCH_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => handleBatchChange(n)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      importBatch === n
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {n} leads
                  </button>
                ))}
                <span className="text-xs text-gray-400 ml-auto">
                  Sorted by newest first
                </span>
              </div>
            </div>

            {/* Lead List */}
            <div className="flex-1 overflow-y-auto">
              {importLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">Loading leads...</div>
              ) : importableLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <p className="font-medium">No NEW leads found</p>
                  <p className="text-sm mt-1">All leads are already in the pipeline or there are no leads.</p>
                </div>
              ) : (
                <>
                  {/* Select all row */}
                  <div className="flex items-center gap-3 px-6 py-2.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                    <input
                      type="checkbox"
                      checked={selectedImportLeads.size === importableLeads.length && importableLeads.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-primary accent-primary rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-gray-600">
                      Select all ({importableLeads.length}) &nbsp;·&nbsp; {selectedImportLeads.size} selected
                    </span>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {importableLeads.map(lead => (
                      <label
                        key={lead._id}
                        className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedImportLeads.has(lead._id)}
                          onChange={() => toggleSelectLead(lead._id)}
                          className="w-4 h-4 text-primary accent-primary rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{lead.fullName}</div>
                          <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                            {lead.company && <span className="truncate">{lead.company}</span>}
                            {lead.phoneNumber && <span>{lead.phoneNumber}</span>}
                            {lead.email && <span className="truncate">{lead.email}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            lead.priority === 'Urgent' ? 'text-red-600 bg-red-50' :
                            lead.priority === 'High' ? 'text-orange-600 bg-orange-50' :
                            lead.priority === 'Medium' ? 'text-yellow-600 bg-yellow-50' :
                            'text-blue-600 bg-blue-50'
                          }`}>
                            {lead.priority}
                          </span>
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {lead.source}
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-sm text-gray-500">
                {selectedImportLeads.size} lead{selectedImportLeads.size !== 1 ? 's' : ''} will be shown in the <strong>New</strong> column
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={selectedImportLeads.size === 0 || importLoading}
                  className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-semibold shadow-sm transition-all"
                >
                  View {selectedImportLeads.size} Lead{selectedImportLeads.size !== 1 ? 's' : ''} in Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Modal (after drag drop) ── */}
      {actionModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Lead Moved Successfully</h2>
            <p className="text-sm text-gray-500 mb-5">
              {actionModalLead.actionType === 'FOLLOW_UP'
                ? `Schedule a follow-up for `
                : `Add a note about moving `}
              <strong>{actionModalLead.lead.fullName}</strong> to <strong>{actionModalLead.newStatus}</strong>?
            </p>

            <form onSubmit={handleSaveNote} className="space-y-4">
              {actionModalLead.actionType === 'NOTE' ? (
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="Enter note (optional)..."
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                      <input required type="date" value={followUpForm.date} onChange={e => setFollowUpForm({ ...followUpForm, date: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Time *</label>
                      <input required type="time" value={followUpForm.time} onChange={e => setFollowUpForm({ ...followUpForm, time: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select value={followUpForm.type} onChange={e => setFollowUpForm({ ...followUpForm, type: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none">
                        {['Call', 'Email', 'WhatsApp', 'Meeting', 'Demo'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                      <select value={followUpForm.priority} onChange={e => setFollowUpForm({ ...followUpForm, priority: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none">
                        {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <textarea rows={2} value={followUpForm.notes} onChange={e => setFollowUpForm({ ...followUpForm, notes: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none" placeholder="Notes..." />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => { setActionModalLead(null); setNoteContent(''); }} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
                  Skip
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-semibold shadow-sm">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
