import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'intro', name: 'Initial Intro (Web Dev)', content: 'Hi {{name}}, I noticed your business could use a better online presence. We at Axiomae IT help businesses like yours build stunning websites. Let me know if you are interested!' },
  { id: 'followup', name: 'Follow-up', content: 'Hi {{name}}, just following up on our previous conversation. Did you get a chance to review the proposal?' },
  { id: 'custom', name: 'Custom Message', content: '' }
];

const WhatsApp = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    api.get('/leads').then(res => setLeads(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const lead = leads.find(l => l._id === selectedLeadId);
    if (lead) {
      setPhone(lead.phoneNumber || '');
      let text = selectedTemplate.content.replace('{{name}}', lead.fullName || 'there');
      setMessage(text);
    } else {
      setPhone('');
      setMessage(selectedTemplate.content.replace('{{name}}', 'there'));
    }
  }, [selectedLeadId, selectedTemplate, leads]);

  const handleOpenWhatsApp = async () => {
    if (!phone) { toast.error('Please provide a phone number'); return; }
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    // Log the interaction
    if (selectedLeadId) {
      try {
        await api.post('/follow-ups', {
          leadId: selectedLeadId,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          type: 'Other', // Using other or we can map to WhatsApp if backend allows it, backend enum for follow-up type is Call, Email, Meeting, Other.
          priority: 'Low',
          notes: `Sent WhatsApp: ${message.substring(0, 50)}...`,
          status: 'Completed'
        });
        toast.success('Logged WhatsApp interaction');
      } catch (err) {}
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Outreach</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Send WhatsApp Message</h2>
          <p className="text-gray-500 text-sm mt-1">Draft a message and open it directly in WhatsApp Web</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (with Country Code)</label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210" 
                className="w-full border border-gray-300 rounded-md p-2 text-sm" 
              />
            </div>
          </div>

          <div className="space-y-4 flex flex-col h-full">
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Preview</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full flex-1 border border-gray-300 rounded-md p-3 text-sm resize-none min-h-[160px]"
              />
            </div>
            
            <button 
              onClick={handleOpenWhatsApp}
              className="w-full bg-[#25D366] text-white px-4 py-3 rounded-md flex items-center justify-center hover:bg-[#128C7E] font-medium transition-colors"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Open in WhatsApp Web
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
