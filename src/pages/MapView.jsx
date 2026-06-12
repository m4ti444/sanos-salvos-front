import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader, LocateFixed, Search, RotateCcw } from 'lucide-react';
import { geoAPI } from '../api/client';
import 'leaflet/dist/leaflet.css';
import { showToast } from '../utils/toast';

const DEFAULT_CENTER = [-33.4489, -70.6693];

const lostIcon = new L.DivIcon({
  html: '<div style="width:36px;height:36px;background:var(--accent-orange);border:4px solid var(--text-primary);display:flex;align-items:center;justify-content:center;box-shadow:4px 4px 0px var(--text-primary);transform:rotate(-5deg);font-weight:900;font-family:Syne;color:white;">P</div>',
  iconSize: [36, 36], className: '',
});

const foundIcon = new L.DivIcon({
  html: '<div style="width:36px;height:36px;background:var(--accent-green);border:4px solid var(--text-primary);display:flex;align-items:center;justify-content:center;box-shadow:4px 4px 0px var(--text-primary);transform:rotate(5deg);font-weight:900;font-family:Syne;color:white;">E</div>',
  iconSize: [36, 36], className: '',
});

const titleText = (value, fallback = '-') => {
  if (!value) return fallback;
  return value
    .toLocaleLowerCase('es-CL')
    .replace(/(^|\s|-|')([a-záéíóúüñ])/g, (match, prefix, char) => `${prefix}${char.toLocaleUpperCase('es-CL')}`);
};

function normalizeReport(raw, index) {
  const lat = Number(raw.lat ?? raw.latitude);
  const lng = Number(raw.lng ?? raw.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    ...raw,
    id: raw.id ?? `${index}-${lat}-${lng}`,
    lat,
    lng,
    pet_name: raw.pet_name ?? raw.name ?? 'Sin nombre',
    pet_name_display: titleText(raw.pet_name ?? raw.name, 'Sin nombre'),
    species_display: titleText(raw.species),
    breed_display: titleText(raw.breed),
    color_display: titleText(raw.color),
    report_type: raw.report_type ?? 'perdido',
    address: raw.address ?? '',
  };
}

export default function MapView() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [query, setQuery] = useState('');
  const [map, setMap] = useState(null);

  useEffect(() => {
    geoAPI.getReports()
      .then((res) => {
        const normalized = (res.data || [])
          .map(normalizeReport)
          .filter(Boolean);
        setReports(normalized);
      })
      .catch(() => {
        showToast('No se pudieron cargar los reportes del mapa.', 'warning');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      const typeOk = filter === 'todos' || r.report_type === filter;
      if (!typeOk) return false;
      if (!q) return true;

      const haystack = [r.pet_name, r.species, r.breed, r.color, r.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [reports, filter, query]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no soporta geolocalizacion.', 'warning');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map?.setView([lat, lng], 14);
        showToast('Mapa centrado en tu ubicacion.', 'info');
      },
      () => {
        showToast('No se pudo acceder a tu ubicacion.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleResetView = () => {
    setFilter('todos');
    setQuery('');
    map?.setView(DEFAULT_CENTER, 12);
  };

  const jumpToReport = (report) => {
    map?.setView([report.lat, report.lng], 15);
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ background: 'white', borderBottom: 'var(--border-thick)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <h1 className="display-font" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <MapPin size={48} color="var(--text-primary)" strokeWidth={3} /> MAPA DE REPORTES
              </h1>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {filtered.length} reportes visibles de {reports.length}
              </p>
            </div>

            <div className="map-controls-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '320px', maxWidth: '100%' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '8px', border: 'var(--border-thick)' }}>
                {[
                  { value: 'todos', label: 'Todos' },
                  { value: 'perdido', label: 'Perdidos', color: 'var(--accent-orange)' },
                  { value: 'encontrado', label: 'Encontrados', color: 'var(--accent-green)' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`brutal-btn ${filter === f.value ? '' : 'secondary'}`}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.92rem',
                      background: filter === f.value ? (f.color || 'var(--text-primary)') : 'white',
                      color: filter === f.value ? 'white' : 'var(--text-primary)',
                      boxShadow: filter === f.value ? '2px 2px 0px var(--text-primary)' : 'none',
                    }}
                  >
                    {f.color && <div style={{ width: 12, height: 12, background: f.color, border: '2px solid var(--text-primary)', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} />}
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px', border: 'var(--border-thick)', background: 'white', display: 'flex', alignItems: 'center', padding: '8px 10px', gap: '8px' }}>
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, raza o direccion"
                    style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'DM Sans', fontSize: '0.95rem', background: 'transparent' }}
                  />
                </div>
                <button onClick={handleUseMyLocation} className="brutal-btn" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                  <LocateFixed size={15} /> Mi ubicacion
                </button>
                <button onClick={handleResetView} className="brutal-btn secondary" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                  <RotateCcw size={15} /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        <div className="animate-in delay-1 map-shell" style={{
          border: 'var(--border-thick)',
          background: 'var(--bg-secondary)',
          boxShadow: '16px 16px 0px var(--text-primary)',
          height: '70vh',
          position: 'relative',
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Loader size={64} className="animate-spin" style={{ color: 'var(--text-primary)' }} />
              <h2 className="display-font" style={{ marginTop: '20px' }}>CARGANDO MAPA...</h2>
            </div>
          ) : (
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={12}
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              whenCreated={setMap}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap"
              />

              {filtered.map((r) => (
                <Marker
                  key={r.id}
                  position={[r.lat, r.lng]}
                  icon={r.report_type === 'perdido' ? lostIcon : foundIcon}
                >
                  <Popup className="brutal-popup">
                    <div style={{ minWidth: '220px', fontFamily: 'DM Sans', color: 'var(--text-primary)' }}>
                      <div style={{ borderBottom: '2px solid var(--text-primary)', paddingBottom: '8px', marginBottom: '8px' }}>
                        <div className="badge" style={{
                          background: r.report_type === 'perdido' ? 'var(--accent-orange)' : 'var(--accent-green)',
                          color: 'white', border: '2px solid var(--text-primary)', marginBottom: '4px',
                        }}>
                          {r.report_type}
                        </div>
                        <h3 className="display-font" style={{ fontSize: '1.2rem', margin: 0 }}>{r.pet_name_display}</h3>
                      </div>

                      {r.photo_url && (
                        <div style={{ border: '2px solid var(--text-primary)', marginBottom: '8px', overflow: 'hidden' }}>
                          <img src={r.photo_url} alt="Mascota" style={{ width: '100%', display: 'block' }} />
                        </div>
                      )}

                      <p style={{ margin: '4px 0', fontSize: '0.9rem', fontWeight: 600 }}>{r.species_display} • {r.breed_display}</p>
                      <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{r.color_display} | {titleText(r.size)}</p>
                      {r.address && <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>{r.address}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              zIndex: 5,
              background: 'white',
              border: 'var(--border-thick)',
              boxShadow: '6px 6px 0 var(--text-primary)',
              padding: '12px 14px',
              maxWidth: '320px',
            }}>
              <strong style={{ display: 'block', marginBottom: '6px' }}>Sin resultados</strong>
              <span style={{ fontSize: '0.9rem' }}>Prueba quitando filtros o limpiando la busqueda.</span>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div style={{ marginTop: '22px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {filtered.slice(0, 8).map((r) => (
              <button
                key={`jump-${r.id}`}
                onClick={() => jumpToReport(r)}
                className="brutal-btn"
                style={{ padding: '8px 10px', fontSize: '0.85rem' }}
              >
                {r.pet_name_display} ({r.report_type})
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '32px', marginTop: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: 700 }}>
            <div style={{ width: 24, height: 24, background: 'var(--accent-orange)', border: '2px solid var(--text-primary)' }} /> PERDIDO
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: 700 }}>
            <div style={{ width: 24, height: 24, background: 'var(--accent-green)', border: '2px solid var(--text-primary)' }} /> ENCONTRADO
          </div>
        </div>
      </div>
    </div>
  );
}



