import React from 'react';
import { MessageSquare, Plus, ExternalLink, Search } from 'lucide-react';

const WhatsApp = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Outreach</h1>
        <button className="bg-[#25D366] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#128C7E]">
          <Plus className="w-4 h-4 mr-2" />
          Log WhatsApp Message
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Manual Outreach (Web / App)</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Use this tool to quickly draft WhatsApp messages and open them in WhatsApp Web or the Desktop app.
          </p>
          
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
              <select className="w-full border border-gray-300 rounded-md p-2">
                <option>Initial Intro (Web Dev)</option>
                <option>Follow-up</option>
                <option>Custom Message</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (with Country Code)</label>
              <input type="text" placeholder="e.g. +919876543210" className="w-full border border-gray-300 rounded-md p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Preview</label>
              <textarea 
                rows={5}
                className="w-full border border-gray-300 rounded-md p-2"
                defaultValue="Hi there, I noticed your business could use a better online presence. We at Axiomae IT help businesses like yours..."
              />
            </div>
            
            <button className="bg-[#25D366] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#128C7E]">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in WhatsApp Web
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
