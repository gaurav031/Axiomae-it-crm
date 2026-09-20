import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, Plus, Search, Filter } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Lead {
  _id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  status: string;
  lastContacted?: string;
}

const Calls = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchContactedLeads = async () => {
    try {
      setLoading(true);
      // Fetch all leads for now, filter locally or could use query params
      const res = await api.get('/leads');
      const filtered = res.data.filter((l: Lead) => 
        ['CONTACTED', 'RECEIVED / CONNECTED', 'NOT PICKED UP'].includes(l.status)
      );
      setLeads(filtered);
    } catch (err) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactedLeads();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED / CONNECTED': return 'text-green-600 bg-green-50 border-green-200';
      case 'NOT PICKED UP': return 'text-red-600 bg-red-50 border-red-200';
      case 'CONTACTED': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Calls & Contact History</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Contacted Leads</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Received / Connected</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.status === 'RECEIVED / CONNECTED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 text-red-600 rounded-full mr-4">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Not Picked Up</p>
              <p className="text-2xl font-bold text-gray-900">
                 {leads.filter(l => l.status === 'NOT PICKED UP').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Contacted Leads</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Lead Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Contacted</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td>
                </tr>
              ) : leads.filter(l => l.fullName.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">No calls found.</td>
                </tr>
              ) : (
                leads.filter(l => l.fullName.toLowerCase().includes(search.toLowerCase())).map(lead => (
                  <tr key={lead._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{lead.fullName}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.phoneNumber || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {lead.lastContacted ? new Date(lead.lastContacted).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary hover:underline font-medium">Log Call / Note</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Calls;
