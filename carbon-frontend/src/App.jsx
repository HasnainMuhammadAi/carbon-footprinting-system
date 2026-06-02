import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import FarmingPanel from './pages/FarmingPanel';
import TransportPanel from './pages/TransportPanel';
import StoragePanel from './pages/StoragePanel';
import PackagingPanel from './pages/PackagingPanel';
import ReportsPage from './pages/ReportsPage';
import Unauthorized from './pages/Unauthorized';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Authenticated routes with Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* Owner-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                <Route path="/dashboard" element={<OwnerDashboard />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* Farming: owner + farming_admin */}
              <Route element={<ProtectedRoute allowedRoles={['owner', 'farming_admin']} />}>
                <Route path="/farming" element={<FarmingPanel />} />
              </Route>

              {/* Transport: owner + transport_admin */}
              <Route element={<ProtectedRoute allowedRoles={['owner', 'transport_admin']} />}>
                <Route path="/transport" element={<TransportPanel />} />
              </Route>

              {/* Storage: owner + storage_admin */}
              <Route element={<ProtectedRoute allowedRoles={['owner', 'storage_admin']} />}>
                <Route path="/storage" element={<StoragePanel />} />
              </Route>

              {/* Packaging: owner + packaging_admin */}
              <Route element={<ProtectedRoute allowedRoles={['owner', 'packaging_admin']} />}>
                <Route path="/packaging" element={<PackagingPanel />} />
              </Route>

            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
