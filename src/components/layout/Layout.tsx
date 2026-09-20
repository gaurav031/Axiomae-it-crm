import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, PhoneCall, Mail, CheckSquare, MessageSquare, Shield, LogOut, Upload, UserPlus, CalendarClock, Ban, CheckCircle, BarChart, Building2, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Layout = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="flex h-screen bg-gray-50 text-sm">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-extrabold text-primary tracking-tight">Enterprise CRM</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          <div className="space-y-1">
            <Link to="/" className={`flex items-center px-3 py-2 rounded-md font-medium transition-colors ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
          </div>
          
          {hasPermission('Leads') && (
            <div className="space-y-1">
              <div className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Lead Management</div>
              <Link to="/leads" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/leads') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Users className="w-5 h-5 mr-3" /> All Leads
              </Link>
              <Link to="/leads/import" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/leads/import') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Upload className="w-5 h-5 mr-3" /> Import Leads
              </Link>
              <Link to="/pipeline" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/pipeline') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                <CheckSquare className="w-5 h-5 mr-3" /> Pipeline
              </Link>
            </div>
          )}
          
          {hasPermission('Calls') && (
            <div className="space-y-1">
              <div className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Outreach</div>
              <Link to="/calls" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/calls') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                <PhoneCall className="w-5 h-5 mr-3" /> Contacts / Calls
              </Link>
              <Link to="/follow-ups" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/follow-ups') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                <CalendarClock className="w-5 h-5 mr-3" /> Follow-ups
              </Link>
              {hasPermission('WhatsApp') && (
                <Link to="/whatsapp" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/whatsapp') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <MessageSquare className="w-5 h-5 mr-3" /> WhatsApp
                </Link>
              )}
            </div>
          )}

          {hasPermission('Customers') && (
            <div className="space-y-1">
              <div className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Customers</div>
              <Link to="/clients" className={`flex items-center px-3 py-2 rounded-md transition-colors ${location.pathname.startsWith('/clients') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Building2 className="w-5 h-5 mr-3 text-emerald-600" /> All Clients
              </Link>
              <Link to="/leads?status=WON" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <CheckCircle className="w-5 h-5 mr-3 text-green-600" /> Won Leads
              </Link>
              <Link to="/leads?status=LOST" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Ban className="w-5 h-5 mr-3 text-red-600" /> Lost Leads
              </Link>
            </div>
          )}

          {hasPermission('Documents') && (
            <div className="space-y-1">
              <div className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Documents</div>
              <Link to="/documents" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/documents') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                <FileText className="w-5 h-5 mr-3 text-violet-600" /> Templates & Docs
              </Link>
            </div>
          )}
          
          <div className="space-y-1">
            <div className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Administration</div>
            <Link to="/reports" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/reports') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
              <BarChart className="w-5 h-5 mr-3" /> Reports & Analytics
            </Link>
            {hasPermission('Users') && (
              <Link to="/users" className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive('/users') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Shield className="w-5 h-5 mr-3" /> Users & Permissions
              </Link>
            )}
          </div>
        </nav>
        
        {user && (
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">{user.name}</span>
                <span className="text-xs text-gray-500">{user.role}</span>
              </div>
              <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-0 relative">
          <h2 className="text-lg font-medium text-gray-800">Welcome back, {user?.name || 'User'}!</h2>
          <div className="flex items-center space-x-4">
             {/* We can put a global search or notifications here in the future */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
