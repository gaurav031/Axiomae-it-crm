import React from 'react';
import { Mail, Plus, ExternalLink } from 'lucide-react';

const Email = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Email Outreach</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Log Email
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Manual Email (mailto)</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Use this tool to quickly draft emails using your default mail client (Outlook, Gmail).
          </p>
          
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="email" placeholder="client@example.com" className="w-full border border-gray-300 rounded-md p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input type="text" placeholder="Proposal for Web Development" className="w-full border border-gray-300 rounded-md p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
              <textarea 
                rows={6}
                className="w-full border border-gray-300 rounded-md p-2"
                defaultValue="Hi there,\n\nWe at Axiomae IT help businesses like yours build modern web applications..."
              />
            </div>
            
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center hover:bg-primary/90">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Default Mail Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Email;
