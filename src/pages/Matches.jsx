/**
 * Sanos y Salvos — Matches Page
 */

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Loader } from 'lucide-react';
import { matchesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

function ScoreBar({ score }) {
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  return (
    <div className="score-bar">
      <div className={`score-bar-fill ${cls}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function MatchCard({ match, onAction }) {
  const breakdown = match.score_breakdown || {};
  const labels = { breed: 'Raza', color: 'Color', size: 'Tamaño', proximity: 'Distancia', date: 'Fecha' };

  return (
    <div className="brutal-card animate-fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <span className="badge badge-match" style={{ marginBottom: '8px', display: 'inline-block' }}>Coincidencia</span>
          <h3 style={{ fontSize: '1.05rem' }}>
            {match.pet_lost_name || 'Mascota perdida'} ↔ {match.pet_found_name || 'Mascota encontrada'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Reporte #{match.report_lost_id} ↔ #{match.report_found_id}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit',
            color: match.score >= 70 ? 'var(--emerald-400)' : match.score >= 40 ? 'var(--amber-400)' : 'var(--red-400)',
          }}>
            {match.score?.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confianza</div>
        </div>
      </div>

      <ScoreBar score={match.score || 0} />

      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {Object.entries(breakdown).map(([key, val]) => (
          <div key={key} style={{ padding: '8px', textAlign: 'center', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {labels[key] || key}
            </div>
            <div style={{
              fontSize: '0.9rem', fontWeight: 700,
              color: (val?.score || 0) >= 70 ? 'var(--emerald-400)' : (val?.score || 0) >= 40 ? 'var(--amber-400)' : 'var(--red-400)',
            }}>
              {val?.score?.toFixed(0) || 0}
            </div>
          </div>
        ))}
      </div>

      {match.status === 'pendiente' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button onClick={() => onAction(match._id, 'confirmado')} className="brutal-btn primary btn-sm" style={{ flex: 1 }}>
            <CheckCircle size={14} /> Confirmar
          </button>
          <button onClick={() => onAction(match._id, 'descartado')} className="brutal-btn secondary btn-sm" style={{ flex: 1 }}>
            <XCircle size={14} /> Descartar
          </button>
        </div>
      )}

      {match.status !== 'pendiente' && (
        <div style={{
          marginTop: '16px', padding: '8px 16px', borderRadius: 'var(--radius-md)',
          background: match.status === 'confirmado' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
          color: match.status === 'confirmado' ? 'var(--emerald-400)' : 'var(--text-muted)',
          fontSize: '0.85rem', fontWeight: 500, textAlign: 'center', textTransform: 'capitalize',
        }}>
          Estado: {match.status}
        </div>
      )}
    </div>
  );
}

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      matchesAPI.getAll(user.id).then(res => setMatches(res.data)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user?.id]);

  const handleAction = async (matchId, status) => {
    try {
      await matchesAPI.updateStatus(matchId, status);
      setMatches(matches.map(m => m._id === matchId ? { ...m, status } : m));
    } catch {}
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Search size={24} color="var(--purple-400)" /> Coincidencias
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          Matches detectados automáticamente por el motor de coincidencias
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader size={32} style={{ color: 'var(--emerald-400)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : matches.length === 0 ? (
          <div className="brutal-card" style={{ padding: '60px', textAlign: 'center' }}>
            <Search size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-secondary)' }}>Sin coincidencias aún</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
              Cuando se detecte una coincidencia, aparecerá aquí automáticamente.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matches.map((match, i) => (
              <MatchCard key={match._id || i} match={match} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
