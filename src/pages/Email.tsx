import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'intro', name: 'Introductory Email', subject: 'Axiomae IT Services Introduction', content: 'Hi {{name}},\n\nWe at Axiomae IT help businesses like yours build modern web applications and improve digital presence.\n\nLet me know if you are interested in a quick call to discuss how we can help.\n\nBest,\nYour Team' },
  { id: 'proposal', name: 'Follow up on Proposal', subject: 'Checking in regarding our Proposal', content: 'Hi {{name}},\n\nJust following up to see if you had a chance to review the proposal we sent over. Let me know if you have any questions or if you would like to proceed.\n\nBest,\nYour Team' },
  { id: 'custom', name: 'Custom Message', subject: '', content: '' }
];

const Email = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [emailTo, setEmailTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    api.get('/leads').then(res => setLeads(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const lead = leads.find(l => l._id === selectedLeadId);
    if (lead) {
      setEmailTo(lead.email || '');
      setSubject(selectedTemplate.subject);
      setBody(selectedTemplate.content.replace('{{name}}', lead.fullName || 'there'));
    } else {
      setEmailTo('');
      setSubject(selectedTemplate.subject);
      setBody(selectedTemplate.content.replace('{{name}}', 'there'));
    }
  }, [selectedLeadId, selectedTemplate, leads]);

  const handleOpenEmail = async () => {
    if (!emailTo) { toast.error('Please provide an email address'); return; }
    
    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    
    if (selectedLeadId) {
      try {
        await api.post('/follow-ups', {
          leadId: selectedLeadId,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          type: 'Email',
          priority: 'Low',
          notes: `Sent Email: ${subject}`,
          status: 'Completed'
        });
        toast.success('Logged Email interaction');
      } catch (err) {}
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Email Outreach</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Send Email via Default Client</h2>
          <p className="text-gray-500 text-sm mt-1">Draft an email and open it in Gmail/Outlook</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Lead (Optional)</label>
              <select 
                value={selectedLeadId}
                onChange={e => setSelectedLeadId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">Select a lead...</option>
                {leads.map(l => (
                  <option key={l._id} value={l._id}>{l.fullName} {l.company ? `(${l.company})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
              <select 
                value={selectedTemplate.id}
                onChange={e => setSelectedTemplate(TEMPLATES.find(t => t.id === e.target.value) || TEMPLATES[2])}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input 
                type="email" 
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                placeholder="client@example.com" 
                className="w-full border border-gray-300 rounded-md p-2 text-sm" 
              />
            </div>
          </div>

          <div className="space-y-4 flex flex-col h-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input 
                type="text" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm" 
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
              <textarea 
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full flex-1 border border-gray-300 rounded-md p-3 text-sm resize-none min-h-[160px]"
              />
            </div>
            
            <button 
              onClick={handleOpenEmail}
              className="w-full bg-primary text-white px-4 py-3 rounded-md flex items-center justify-center hover:bg-primary/90 font-medium transition-colors"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Open Default Mail Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Email;
