import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PawPrint, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('demo@sanosysalvos.cl');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate(redirectTo, { replace: true });
      } else {
        setError('Credenciales invalidas');
      }
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Credenciales invalidas');
      } else {
        setError('Error al intentar iniciar sesion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Cerraste la ventana de Google antes de completar el ingreso');
      } else {
        setError('No se pudo iniciar sesion con Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="brutal-card animate-in auth-card" style={{ width: '100%', maxWidth: '500px', padding: '50px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '60px', height: '60px', background: 'var(--accent-blue)', color: 'white',
            border: 'var(--border-thick)', borderRadius: 'var(--radius-sharp)', marginBottom: '20px'
          }}>
            <PawPrint size={32} />
          </div>
          <h1 className="display-font" style={{ fontSize: '2.5rem' }}>ACCESO</h1>
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Ingresa al panel del sistema</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--accent-orange)', color: 'white', padding: '16px',
            border: 'var(--border-thick)', fontWeight: 700, marginBottom: '24px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="display-font" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '8px' }}>EMAIL</label>
            <input
              type="email"
              className="brutal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="display-font" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '8px' }}>CONTRASENA</label>
            <input
              type="password"
              className="brutal-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="brutal-btn primary" disabled={loading} style={{ marginTop: '20px', width: '100%' }}>
            {loading ? 'AUTENTICANDO...' : <><LogIn size={20} /> INICIAR SESION</>}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '18px', marginBottom: '10px' }}>
          <div style={{ flex: 1, height: '2px', background: 'var(--text-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>O</span>
          <div style={{ flex: 1, height: '2px', background: 'var(--text-primary)' }} />
        </div>

        <button onClick={handleGoogleLogin} className="brutal-btn secondary" style={{ width: '100%' }} disabled={googleLoading}>
          {googleLoading ? 'ABRIENDO GOOGLE...' : 'CONTINUAR CON GOOGLE'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '30px', fontWeight: 600 }}>
          No tienes cuenta? <Link to="/register" state={{ from: redirectTo }} style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>Registrate</Link>
        </div>
      </div>
    </div>
  );
}
