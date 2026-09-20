import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Lead {
  _id: string;
  fullName: string;
  company?: string;
  status: string;
  priority: string;
  source: string;
  nextFollowUp?: string;
}

interface Column {
  id: string;
  title: string;
  leads: Lead[];
}

const Pipeline = () => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'NEW', title: 'New', leads: [] },
    { id: 'CONTACTED', title: 'Contacted', leads: [] },
    { id: 'FOLLOW UP', title: 'Follow Up', leads: [] },
    { id: 'QUALIFIED', title: 'Qualified', leads: [] },
    { id: 'PROPOSAL', title: 'Proposal', leads: [] },
    { id: 'NEGOTIATION', title: 'Negotiation', leads: [] },
    { id: 'WON', title: 'Won', leads: [] },
    { id: 'LOST', title: 'Lost', leads: [] }
  ]);
  const [draggedLead, setDraggedLead] = useState<{ lead: Lead, sourceColumnId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Action Modal state
  const [actionModalLead, setActionModalLead] = useState<{ lead: Lead, newStatus: string, actionType: 'NOTE' | 'FOLLOW_UP' } | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [followUpForm, setFollowUpForm] = useState({ date: '', time: '', type: 'Call', priority: 'Medium', notes: '' });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads');
      const leads: Lead[] = res.data;
      
      const newCols = [
        { id: 'NEW', title: 'New', leads: leads.filter(l => l.status === 'NEW') },
        { id: 'CONTACTED', title: 'Contacted', leads: leads.filter(l => l.status === 'CONTACTED') },
        { id: 'FOLLOW UP', title: 'Follow Up', leads: leads.filter(l => l.status === 'FOLLOW UP') },
        { id: 'QUALIFIED', title: 'Qualified', leads: leads.filter(l => l.status === 'QUALIFIED') },
        { id: 'PROPOSAL', title: 'Proposal', leads: leads.filter(l => l.status === 'PROPOSAL') },
        { id: 'NEGOTIATION', title: 'Negotiation', leads: leads.filter(l => l.status === 'NEGOTIATION') },
        { id: 'WON', title: 'Won', leads: leads.filter(l => l.status === 'WON') },
        { id: 'LOST', title: 'Lost', leads: leads.filter(l => l.status === 'LOST') }
      ];
      
      setColumns(newCols);
    } catch (err) {
      console.error("Failed to load leads for pipeline", err);
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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

    // Update UI optimistically without duplicates
    setColumns(prevColumns => {
      return prevColumns.map(col => {
        if (col.id === sourceColumnId) {
          return { ...col, leads: col.leads.filter(l => l._id !== lead._id) };
        }
        if (col.id === targetColumnId) {
          // ensure no duplicate before pushing
          if (col.leads.some(l => l._id === lead._id)) return col;
          return { ...col, leads: [...col.leads, { ...lead, status: targetColumnId }] };
        }
        return col;
      });
    });

    // Update in backend
    try {
      await api.put(`/leads/${lead._id}`, { status: targetColumnId });
      toast.success(`Moved ${lead.fullName} to ${targetColumnId}`);
      // Prompt for note or follow up
      setActionModalLead({ 
        lead, 
        newStatus: targetColumnId, 
        actionType: targetColumnId === 'FOLLOW UP' ? 'FOLLOW_UP' : 'NOTE' 
      });
    } catch (err) {
      console.error("Failed to update lead status", err);
      toast.error("Error updating lead status");
      fetchLeads(); // Revert on failure
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
          assignedTo: user?._id,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          type: 'Other',
          priority: 'Low',
          notes: `[Moved to ${actionModalLead.newStatus}] ${noteContent}`,
          status: 'Completed'
        });
        toast.success('Note added successfully');
      } else {
        // Follow up logic
        if (!followUpForm.date || !followUpForm.time) return;
        
        await api.post('/follow-ups', {
          ...followUpForm,
          leadId: actionModalLead.lead._id,
          assignedTo: user?._id
        });
        
        const nextFollowUpStr = `${followUpForm.date} ${followUpForm.time}`;
        await api.put(`/leads/${actionModalLead.lead._id}`, { nextFollowUp: nextFollowUpStr });
        
        // Update optimistic UI to show the date
        setColumns(prevColumns => prevColumns.map(col => {
            if (col.id === 'FOLLOW UP') {
                return {
                    ...col,
                    leads: col.leads.map(l => l._id === actionModalLead.lead._id ? {...l, nextFollowUp: nextFollowUpStr} : l)
                };
            }
            return col;
        }));
        
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
      case 'Urgent': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max h-full items-stretch">
          {columns.map(column => (
            <div 
              key={column.id} 
              className="w-72 bg-gray-100/50 rounded-lg flex flex-col max-h-full border border-gray-200 shadow-sm"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-3 border-b border-gray-200 bg-gray-100 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{column.title}</h3>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 shadow-sm border border-gray-200">
                    {column.leads.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {loading ? (
                  <div className="text-center text-gray-500 text-sm py-4">Loading...</div>
                ) : column.leads.map(lead => (
                  <div
                    key={lead._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead, column.id)}
                    onClick={() => navigate(`/leads/${lead._id}`)}
                    className="bg-white p-4 rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900 truncate pr-2">{lead.fullName}</div>
                    </div>
                    {lead.company && <div className="text-xs text-gray-500 mb-3 truncate">{lead.company}</div>}
                    
                    {lead.nextFollowUp && column.id === 'FOLLOW UP' && (
                        <div className="mb-2 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded inline-block">
                            Follow-up: {new Date(lead.nextFollowUp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${getPriorityColor(lead.priority)}`}>
                        {lead.priority || 'Normal'}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate max-w-[100px]">
                        {lead.source}
                      </span>
                    </div>
                  </div>
                ))}
                
                {!loading && column.leads.length === 0 && (
                  <div className="h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-sm text-gray-400 bg-gray-50/50">
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Modal after drag drop */}
      {actionModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lead Moved Successfully</h2>
            <p className="text-sm text-gray-600 mb-4">Would you like to {actionModalLead.actionType === 'FOLLOW_UP' ? 'schedule a follow-up for' : 'add a note about moving'} {actionModalLead.lead.fullName} to {actionModalLead.newStatus}?</p>
            
            <form onSubmit={handleSaveNote} className="space-y-4">
              {actionModalLead.actionType === 'NOTE' ? (
                  <div>
                    <textarea rows={4} value={noteContent} onChange={e => setNoteContent(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="Enter note details (optional)..." />
                  </div>
              ) : (
                  <div className="space-y-4">
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
                        <textarea rows={2} value={followUpForm.notes} onChange={e => setFollowUpForm({...followUpForm, notes: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="Details..." />
                      </div>
                  </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => { setActionModalLead(null); setNoteContent(''); }} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Skip</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
