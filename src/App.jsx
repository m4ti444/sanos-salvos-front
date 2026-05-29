/**
 * Sanos y Salvos — Main App
 * Root component with routing.
 */

import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ToastHost from './components/layout/ToastHost';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportPet from './pages/ReportPet';
import MapView from './pages/MapView';
import Matches from './pages/Matches';
import { useAuth } from './context/AuthContext';
import { showToast } from './utils/toast';

function RequireAuth({ children, message = 'Debes iniciar sesion para continuar.' }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      showToast(message, 'warning');
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [loading, user, navigate, location.pathname, message]);

  if (loading || !user) return null;
  return children;
}

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <ToastHost />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/report" element={<RequireAuth message="Debes iniciar sesion o registrarte para crear un reporte."><ReportPet /></RequireAuth>} />
          <Route path="/map" element={<MapView />} />
          <Route path="/matches" element={<Matches />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
