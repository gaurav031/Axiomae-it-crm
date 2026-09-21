import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, CheckCircle, Phone, Mail, MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface FollowUp {
  _id: string;
  leadId: {
    _id: string;
    fullName: string;
    company?: string;
    phoneNumber?: string;
  };
  assignedTo?: {
    name: string;
  };
  date: string;
  time: string;
  type: string;
  priority: string;
  notes?: string;
  status: string;
}

const FollowUps = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today'); // today, tomorrow, thisWeek, upcoming, overdue, completed
  const [users, setUsers] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const { user } = useAuth();

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const query = userFilter ? `&assignedTo=${userFilter}` : '';
      const res = await api.get(`/follow-ups?filter=${filter}${query}`);
      setFollowUps(res.data);
    } catch (err) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [filter, userFilter]);

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

  const handleComplete = async (id: string) => {
    try {
      await api.put(`/follow-ups/${id}/status`, { status: 'Completed', notes: 'Completed via UI' });
      toast.success('Follow-up completed');
      fetchFollowUps();
    } catch (err) {
      toast.error('Failed to complete follow-up');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Call': return <Phone className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'WhatsApp': return <MessageSquare className="w-4 h-4" />;
      case 'Meeting': return <User className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
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
        <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-4">
        {user?.role === 'Super Admin' && (
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        )}
        <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
          {['today', 'tomorrow', 'thisWeek', 'upcoming', 'overdue', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Loading follow-ups...
          </div>
        ) : followUps.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-lg border border-gray-200 border-dashed">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No follow-ups found for this view.</p>
          </div>
        ) : (
          followUps.map(fu => (
            <div key={fu._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
              {fu.status === 'Completed' && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-8 py-1 rotate-45 translate-x-6 translate-y-3 shadow">
                  DONE
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate pr-4">{fu.leadId?.fullName || 'Unknown Lead'}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{fu.leadId?.company}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getPriorityColor(fu.priority)}`}>
                  {fu.priority}
                </span>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {getTypeIcon(fu.type)}
                  <span className="ml-2 font-medium">{fu.type}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                  <span>{format(new Date(fu.date), 'MMM d, yyyy')}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                  <span>{fu.time}</span>
                </div>
                {fu.notes && (
                  <p className="text-sm text-gray-600 bg-yellow-50/50 p-2 border border-yellow-100 rounded">
                    {fu.notes}
                  </p>
                )}
                <div className="text-sm text-gray-500 flex items-center pt-2">
                   <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                   {fu.leadId?.phoneNumber || 'No phone'}
                </div>
              </div>
              
              <div className="flex justify-end border-t border-gray-100 pt-4 mt-auto">
                {fu.status !== 'Completed' && (
                  <button 
                    onClick={() => handleComplete(fu._id)}
                    className="flex items-center text-sm text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowUps;
