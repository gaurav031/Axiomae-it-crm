import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [leadsTrend, setLeadsTrend] = useState<any[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<any[]>([]);
  const [sourcePerformance, setSourcePerformance] = useState<any[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<any[]>([]);
  const [revenueReport, setRevenueReport] = useState<any[]>([]);
  
  const [months, setMonths] = useState(6);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [trendRes, funnelRes, sourceRes, agentRes, revRes] = await Promise.all([
        api.get(`/dashboard/reports/leads-trend?months=${months}`),
        api.get('/dashboard/reports/conversion-funnel'),
        api.get('/dashboard/reports/source-performance'),
        api.get('/dashboard/reports/agent-performance'),
        api.get(`/dashboard/reports/revenue?months=${months}`)
      ]);
      
      setLeadsTrend(trendRes.data);
      setConversionFunnel(funnelRes.data);
      setSourcePerformance(sourceRes.data);
      setAgentPerformance(agentRes.data);
      setRevenueReport(revRes.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [months]);

  if (loading) return <div className="py-20 text-center text-gray-500">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Key metrics and performance indicators</p>
        </div>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value={3}>Last 3 Months</option>
          <option value={6}>Last 6 Months</option>
          <option value={12}>Last 12 Months</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Leads Trend */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">Leads Added Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} name="Leads" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Report */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">Revenue Trend (Total Contract Value)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueReport}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                <RechartsTooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">Pipeline Status Distribution</h2>
          <div className="h-72 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={conversionFunnel} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                  {conversionFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Performance */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">Source Performance</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourcePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="_id" axisLine={false} tickLine={false} width={100} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="total" fill="#93c5fd" name="Total Leads" radius={[0, 4, 4, 0]} />
                <Bar dataKey="won" fill="#10b981" name="Won Leads" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Agent Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Agent Performance Leaderboard</h2>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-semibold">Agent Name</th>
              <th className="px-6 py-3 font-semibold">Total Assigned</th>
              <th className="px-6 py-3 font-semibold">Won Deals</th>
              <th className="px-6 py-3 font-semibold">Conversion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agentPerformance.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-6 text-gray-400">No data available</td></tr>
            ) : agentPerformance.map(agent => (
              <tr key={agent._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{agent.agentName}</td>
                <td className="px-6 py-4 text-gray-600">{agent.totalAssigned}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">{agent.won}</td>
                <td className="px-6 py-4 text-gray-600">
                  {agent.totalAssigned > 0 ? ((agent.won / agent.totalAssigned) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
