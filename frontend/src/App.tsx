import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/public/Home';
import Istatistik from './pages/public/Istatistik';
import MacGecmisi from './pages/public/MacGecmisi';
import Login from './pages/admin/Login';
import AdminOylama from './pages/admin/Oylama';
import AdminRank from './pages/admin/Rank';
import AdminMacGecmisi from './pages/admin/MacGecmisi';
import AdminIstatistikler from './pages/admin/Istatistikler';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/istatistik" element={<Istatistik />} />
            <Route path="/mac-gecmisi" element={<MacGecmisi />} />
          </Route>
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/oylama" replace />} />
            <Route path="oylama" element={<AdminOylama />} />
            <Route path="rank" element={<AdminRank />} />
            <Route path="mac-gecmisi" element={<AdminMacGecmisi />} />
            <Route path="istatistikler" element={<AdminIstatistikler />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
