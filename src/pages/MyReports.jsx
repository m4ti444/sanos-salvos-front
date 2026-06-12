import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader, MapPin, PawPrint, Plus, Trash2 } from 'lucide-react';
import { petsAPI } from '../api/client';
import { showToast } from '../utils/toast';

const emptySummary = {
  total: 0,
  perdidos: 0,
  encontrados: 0,
  activos: 0,
  resueltos: 0,
};

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function ReportCard({ report, onDelete }) {
  const pet = report.pet || {};
  const typeLabel = report.report_type === 'perdido' ? 'Perdido' : 'Encontrado';

  return (
    <div className="brutal-card" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
        <div>
          <span className="badge" style={{ display: 'inline-block', marginBottom: '10px', background: report.report_type === 'perdido' ? 'var(--accent-orange)' : 'var(--accent-green)', color: 'white' }}>
            {typeLabel}
          </span>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
            {pet.name || 'Mascota sin nombre'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {[pet.species, pet.breed, pet.color].filter(Boolean).join(' - ') || 'Sin detalles'}
          </p>
        </div>
        <span style={{ fontWeight: 800, textTransform: 'uppercase', color: report.status === 'resuelto' ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
          {report.status}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '10px', marginTop: '18px', color: 'var(--text-secondary)' }}>
        <p style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <MapPin size={16} /> {report.address || 'Sin direccion'}
        </p>
        <p style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <FileText size={16} /> Fecha del evento: {formatDate(report.date_event)}
        </p>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => onDelete(report.id)} className="brutal-btn" style={{ background: '#ef4444', color: 'white', padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', borderColor: '#b91c1c' }}>
          <Trash2 size={16} /> Borrar
        </button>
      </div>
    </div>
  );
}

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [reportsRes, summaryRes] = await Promise.all([
          petsAPI.getMyReports(),
          petsAPI.getMyReportsSummary(),
        ]);
        setReports(reportsRes.data || []);
        setSummary({ ...emptySummary, ...(summaryRes.data || {}) });
      } catch {
        showToast('No se pudieron cargar tus reportes.', 'warning');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estas seguro de borrar este reporte?')) return;
    try {
      await petsAPI.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setSummary((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      showToast('Reporte borrado exitosamente.', 'success');
    } catch {
      showToast('No se pudo borrar el reporte.', 'error');
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: '42px', paddingBottom: '70px', maxWidth: '980px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <PawPrint size={28} color="var(--accent-orange)" /> Mis reportes
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Revisa los reportes que creaste con tu cuenta.
            </p>
          </div>
          <Link to="/report" className="brutal-btn primary">
            <Plus size={18} /> Nuevo reporte
          </Link>
        </div>

        <div className="grid-4" style={{ gap: '18px', marginBottom: '28px' }}>
          {[
            ['Total', summary.total, 'var(--accent-blue)'],
            ['Perdidos', summary.perdidos, 'var(--accent-orange)'],
            ['Encontrados', summary.encontrados, 'var(--accent-green)'],
            ['Activos', summary.activos, 'var(--text-primary)'],
          ].map(([label, value, color]) => (
            <div key={label} className="brutal-card" style={{ padding: '20px', textAlign: 'center', borderTop: `6px solid ${color}` }}>
              <strong style={{ display: 'block', fontSize: '2rem', color }}>{value}</strong>
              <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : reports.length === 0 ? (
          <div className="brutal-card" style={{ padding: '50px', textAlign: 'center' }}>
            <FileText size={42} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3>Aun no tienes reportes</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '22px' }}>
              Cuando publiques un reporte, aparecera en esta seccion privada.
            </p>
            <Link to="/report" className="brutal-btn primary">Crear primer reporte</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
