/**
 * Sanos y Salvos — Register Page
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PawPrint, UserPlus } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="brutal-card animate-in" style={{ width: '100%', maxWidth: '500px', padding: '30px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', background: 'var(--accent-orange)', color: 'white',
            border: 'var(--border-thick)', borderRadius: 'var(--radius-sharp)', marginBottom: '10px'
          }}>
            <PawPrint size={24} />
          </div>
          <h1 className="display-font" style={{ fontSize: '2rem' }}>CREAR CUENTA</h1>
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Unete a la comunidad de rescate</p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="display-font" style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>NOMBRE COMPLETO</label>
            <input name="full_name" className="brutal-input" placeholder="Ej. Juan Perez"
              value={form.full_name} onChange={handleChange} required />
          </div>

          <div>
            <label className="display-font" style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>USUARIO</label>
            <input name="username" className="brutal-input" placeholder="juanperez"
              value={form.username} onChange={handleChange} required />
          </div>

          <div>
            <label className="display-font" style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>EMAIL</label>
            <input type="email" name="email" className="brutal-input" placeholder="tu@email.com"
              value={form.email} onChange={handleChange} required />
          </div>

          <div>
            <label className="display-font" style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>TELEFONO</label>
            <input name="phone" className="brutal-input" placeholder="+56 9 1234 5678"
              value={form.phone} onChange={handleChange} />
          </div>

          <div>
            <label className="display-font" style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>CONTRASENA</label>
            <input type="password" name="password" className="brutal-input" placeholder="********"
              value={form.password} onChange={handleChange} required />
          </div>

          <button type="submit" className="brutal-btn primary" disabled={loading} style={{ marginTop: '10px', width: '100%', padding: '12px 24px' }}>
            {loading ? 'CREANDO...' : <><UserPlus size={20} /> CREAR CUENTA</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px', fontWeight: 600 }}>
          Ya tienes cuenta? <Link to="/login" state={{ from: redirectTo }} style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>Inicia sesion</Link>
        </div>
      </div>
    </div>
  );
}
