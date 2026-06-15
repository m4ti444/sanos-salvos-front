import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { PawPrint, MapPin, Camera, Send, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { petsAPI, geoAPI, matchesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function ReportPet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState(null);

  const [form, setForm] = useState({
    report_type: 'perdido',
    pet: {
      name: '',
      species: 'perro',
      breed: '',
      color: '',
      size: 'mediano',
      age_estimate: '',
      description: '',
      photo_url: '',
      distinctive_features: '',
    },
    latitude: -33.4489,
    longitude: -70.6693,
    address: '',
    date_event: new Date().toISOString().split('T')[0],
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
  });

  const updatePet = (field, value) => setForm({ ...form, pet: { ...form.pet, [field]: value } });
  const updateField = (field, value) => setForm({ ...form, [field]: value });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      contact_name: prev.contact_name || user.full_name || user.username || '',
      contact_phone: prev.contact_phone || user.phone || '',
      contact_email: prev.contact_email || user.email || '',
    }));
  }, [user]);

  const validateStep = (targetStep) => {
    if (targetStep === 1) {
      if (!form.pet.name?.trim()) {
        showToast('Completa el nombre de la mascota.', 'warning');
        return false;
      }
      if (!form.pet.color?.trim()) {
        showToast('Completa el color de la mascota.', 'warning');
        return false;
      }
      if (!form.pet.size?.trim()) {
        showToast('Selecciona el tamano de la mascota.', 'warning');
        return false;
      }
      if (!form.pet.description?.trim()) {
        showToast('La descripcion de la mascota es obligatoria.', 'warning');
        return false;
      }
      if (form.pet.description.trim().length < 10) {
        showToast('La descripcion debe tener al menos 10 caracteres.', 'warning');
        return false;
      }
      return true;
    }

    if (targetStep === 2) {
      const lat = position ? position[0] : null;
      const lng = position ? position[1] : null;
      if (!position) {
        showToast('Debes marcar un pin en el mapa.', 'warning');
        return false;
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        showToast('Debes marcar una ubicacion valida en el mapa.', 'warning');
        return false;
      }
      if (!form.address?.trim()) {
        showToast('Completa la direccion o referencia del lugar.', 'warning');
        return false;
      }
      if (!form.date_event) {
        showToast('Debes ingresar la fecha del evento.', 'warning');
        return false;
      }
      return true;
    }

    if (targetStep === 3) {
      if (!form.contact_name?.trim()) {
        showToast('Ingresa un nombre de contacto.', 'warning');
        return false;
      }
      if (!form.contact_phone?.trim()) {
        showToast('Ingresa un telefono de contacto.', 'warning');
        return false;
      }
      if (!form.contact_email?.trim()) {
        showToast('Ingresa un email de contacto.', 'warning');
        return false;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim());
      if (!emailOk) {
        showToast('Ingresa un email valido.', 'warning');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    setLoading(true);
    try {
      const data = {
        ...form,
        latitude: position ? position[0] : form.latitude,
        longitude: position ? position[1] : form.longitude,
      };
      const res = await petsAPI.createReport(data);

      try {
        await geoAPI.createLocation({
          report_id: res.data.id,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
        });      } catch {}

      try {
        await matchesAPI.triggerMatch({
          report_id: res.data.id,
          report_type: res.data.report_type,
          pet_name: res.data.pet.name,
          species: res.data.pet.species,
          breed: res.data.pet.breed,
          color: res.data.pet.color,
          size: res.data.pet.size,
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          date_event: res.data.date_event,
          user_id: res.data.user_id,
        });
      } catch (err) {
        console.error("Error triggering match", err);
      }

      setSuccess(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (typeof detail === 'string' ? detail : 'Error al crear reporte');
      showToast(errorMsg, 'warning');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page report-page success-wrap">
        <div className="brutal-card report-card success-card">
          <div className="success-icon-wrap">
            <CheckCircle size={40} color="var(--accent-green)" />
          </div>
          <h2>Reporte creado</h2>
          <p className="success-text">
            Tu reporte ha sido registrado correctamente. Ahora se puede buscar coincidencias desde el sistema.
          </p>
          <div className="report-nav center">
            <button onClick={() => navigate('/map')} className="brutal-btn primary nav-btn">Ver en mapa</button>
            <button onClick={() => navigate('/')} className="brutal-btn secondary nav-btn">Inicio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page report-page">
      <div className="container report-container">
        <h1 className="report-title">
          <PawPrint size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10, color: 'var(--accent-green)' }} />
          Reportar Mascota
        </h1>
        <p className="report-subtitle">Completa la informacion para crear un reporte</p>

        <div className="report-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`step-bar ${s <= step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="brutal-card report-card">
          {step === 1 && (
            <div className="report-step-content">
              <h3 className="report-step-title">Informacion del Animal</h3>

              <div className="report-type-toggle">
                {['perdido', 'encontrado'].map((type) => (
                  <button
                    key={type}
                    onClick={() => updateField('report_type', type)}
                    className={`brutal-btn report-type-btn ${form.report_type === type ? 'primary' : 'secondary'}`}
                  >
                    {type === 'perdido' ? 'Perdido' : 'Encontrado'}
                  </button>
                ))}
              </div>

              <div className="grid-2 form-grid-tight">
                <div className="input-group">
                  <label>Nombre</label>
                  <input className="input-field report-input" placeholder="Nombre de la mascota" value={form.pet.name} onChange={(e) => updatePet('name', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Especie *</label>
                  <select className="input-field report-input" value={form.pet.species} onChange={(e) => updatePet('species', e.target.value)}>
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid-2 form-grid-tight">
                <div className="input-group">
                  <label>Raza</label>
                  <input className="input-field report-input" placeholder="Ej: Labrador, Mestizo" value={form.pet.breed} onChange={(e) => updatePet('breed', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Color *</label>
                  <input className="input-field report-input" placeholder="Ej: Negro, Cafe con blanco" value={form.pet.color} onChange={(e) => updatePet('color', e.target.value)} required />
                </div>
              </div>

              <div className="grid-2 form-grid-tight">
                <div className="input-group">
                  <label>Tamano *</label>
                  <select className="input-field report-input" value={form.pet.size} onChange={(e) => updatePet('size', e.target.value)}>
                    <option value="peque�o">Peque�o</option>
                    <option value="mediano">Mediano</option>
                    <option value="grande">Grande</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Edad aproximada</label>
                  <input className="input-field report-input" placeholder="Ej: 3 anos, cachorro" value={form.pet.age_estimate} onChange={(e) => updatePet('age_estimate', e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>Descripcion</label>
                <textarea className="input-field report-input report-textarea" placeholder="Describe caracteristicas adicionales" value={form.pet.description} onChange={(e) => updatePet('description', e.target.value)} />
              </div>

              <div className="input-group">
                <label><Camera size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />URL de foto</label>
                <input className="input-field report-input" placeholder="https://..." value={form.pet.photo_url} onChange={(e) => updatePet('photo_url', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="report-step-content">
              <h3 className="report-step-title"><MapPin size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Ubicacion</h3>
              <p className="report-hint">Haz clic en el mapa para marcar la ubicacion</p>

              <div className="report-map-wrap">
                <MapContainer center={[-33.4489, -70.6693]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <LocationPicker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>

              {position && (
                <p className="report-coords">
                  Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
                </p>
              )}

              <div className="input-group">
                <label>Direccion / Referencia</label>
                <input className="input-field report-input" placeholder="Ej: Av. Providencia 123, Santiago" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
              </div>

              <div className="input-group">
                <label>Fecha del evento</label>
                <input type="date" className="input-field report-input" value={form.date_event} onChange={(e) => updateField('date_event', e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="report-step-content">
              <h3 className="report-step-title">Datos de Contacto</h3>

              <div className="input-group">
                <label>Nombre de contacto</label>
                <input className="input-field report-input" placeholder="Tu nombre" value={form.contact_name} onChange={(e) => updateField('contact_name', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Telefono</label>
                <input className="input-field report-input" placeholder="+56 9 1234 5678" value={form.contact_phone} onChange={(e) => updateField('contact_phone', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input-field report-input" placeholder="tu@email.com" value={form.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Notas adicionales</label>
                <textarea className="input-field report-input report-textarea" placeholder="Cualquier informacion adicional" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
              </div>
            </div>
          )}

          <div className="report-nav">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="brutal-btn secondary nav-btn">
                <ArrowLeft size={16} /> Anterior
              </button>
            ) : <div />}

            {step < 3 ? (
              <button onClick={handleNext} className="brutal-btn primary nav-btn">
                Siguiente <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} className="brutal-btn primary nav-btn" disabled={loading}>
                {loading ? 'Enviando...' : <><Send size={16} /> Enviar Reporte</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



