import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e'];

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasPermission } = useAuth();

  const canViewLeads = hasPermission('Leads') || hasPermission('Pipeline');
  const canViewCalls = hasPermission('Calls');


  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats', err);
        setError(err?.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-500">
        <p className="text-lg font-medium">{error}</p>
        <p className="text-sm">Please contact your administrator if this persists.</p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, charts } = data;

  const statusData = (charts.statusCounts || []).map((item: any) => ({
    name: item._id,
    value: item.count
  }));

  const sourceData = (charts.leadsBySource || []).map((item: any) => ({
    name: item._id,
    value: item.count
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Cards — Leads section */}
      {canViewLeads && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Total Leads</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">New Leads</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.newLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Won Leads</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.won}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Conversion Rate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.conversionRate}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Contacted Leads</h3>
              <p className="text-2xl font-semibold text-gray-800 mt-2">{stats.contactedLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Leads This Week</h3>
              <p className="text-2xl font-semibold text-blue-600 mt-2">{stats.leadsAddedThisWeek}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Lost Leads</h3>
              <p className="text-2xl font-semibold text-red-600 mt-2">{stats.lost}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Leads This Month</h3>
              <p className="text-2xl font-semibold text-gray-800 mt-2">{stats.leadsAddedThisMonth}</p>
            </div>
          </div>
        </>
      )}

      {/* Stats Cards — Calls / Follow-ups section */}
      {canViewCalls && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Follow-ups Today</h3>
            <p className="text-3xl font-bold text-orange-500 mt-2">{stats.followUpsDueToday}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Follow-ups This Week</h3>
            <p className="text-2xl font-semibold text-gray-800 mt-2">{stats.followUpsDueThisWeek}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Overdue Follow-ups</h3>
            <p className="text-2xl font-semibold text-red-500 mt-2">{stats.overdueFollowUps}</p>
          </div>
        </div>
      )}

      {/* No access at all */}
      {!canViewLeads && !canViewCalls && (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-gray-500">
          <div className="text-center">
            <p className="font-medium">Welcome to Axiomae IT CRM</p>
            <p className="text-sm mt-1">You currently have no module permissions assigned. Please contact your Super Admin.</p>
          </div>
        </div>
      )}

      {/* Charts — only if user has leads access */}
      {canViewLeads && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads by Status</h2>
            <div className="h-64">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Leads by Source */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads by Source</h2>
            <div className="h-64 flex justify-center">
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {sourceData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
