import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import ImportLeads from './pages/ImportLeads';
import Calls from './pages/Calls';
import FollowUps from './pages/FollowUps';
import LeadDetail from './pages/LeadDetail';
import WhatsApp from './pages/WhatsApp';
import Email from './pages/Email';
import Layout from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SetPassword from './pages/SetPassword';
import UserManagement from './pages/UserManagement';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Documents from './pages/Documents';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/set-password" element={<SetPassword />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              
              <Route element={<ProtectedRoute requiredPermission="Leads" />}>
                <Route path="/leads" element={<Leads />} />
                <Route path="/leads/import" element={<ImportLeads />} />
                <Route path="/leads/:id" element={<LeadDetail />} />
              </Route>
              
              <Route element={<ProtectedRoute requiredPermission="Pipeline" />}>
                <Route path="/pipeline" element={<Pipeline />} />
              </Route>
              
              <Route element={<ProtectedRoute requiredPermission="Calls" />}>
                <Route path="/calls" element={<Calls />} />
                <Route path="/follow-ups" element={<FollowUps />} />
              </Route>
              
              <Route element={<ProtectedRoute requiredPermission="WhatsApp" />}>
                <Route path="/whatsapp" element={<WhatsApp />} />
              </Route>
              
              <Route element={<ProtectedRoute requiredPermission="Email" />}>
                <Route path="/email" element={<Email />} />
              </Route>

              {/* Super Admin Only */}
              <Route element={<ProtectedRoute requiredPermission="Users" />}>
                <Route path="/users" element={<UserManagement />} />
              </Route>

              {/* Clients */}
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />

              {/* Documents */}
              <Route path="/documents" element={<Documents />} />

              {/* Reports */}
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
