import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { PawPrint, MapPin, Camera, Send, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { petsAPI, geoAPI } from '../api/client';
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

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/;
const COLOR_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ, /-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value) => value?.trim() || '';
const lowerText = (value) => value.toLocaleLowerCase('es-CL');
const hasMinLetters = (value, min) => (value.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length >= min;
const wordCount = (value) => clean(value).split(/\s+/).filter(Boolean).length;

const validOptionalText = (value, regex, minLetters = 2) => {
  const text = clean(value);
  return !text || (regex.test(text) && hasMinLetters(text, minLetters));
};

const validPhotoUrl = (value) => {
  const text = clean(value);
  if (!text) return true;
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const validPhone = (value) => {
  const digits = clean(value).replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 12;
};

const getApiErrorMessage = (detail) => {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg || detail[0]?.message || 'Error al crear reporte';
  }
  return 'Error al crear reporte';
};

export default function ReportPet() {
  const navigate = useNavigate();
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
  const updateNormalizedPet = (field, value) => updatePet(field, lowerText(value));
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
      const petName = clean(form.pet.name);
      const breed = clean(form.pet.breed);
      const color = clean(form.pet.color);
      const age = clean(form.pet.age_estimate);
      const description = clean(form.pet.description);

      if (!petName) {
        showToast('Completa el nombre de la mascota.', 'warning');
        return false;
      }
      if (petName.length < 2 || petName.length > 60 || !NAME_RE.test(petName) || !hasMinLetters(petName, 2)) {
        showToast('El nombre solo debe contener letras y espacios.', 'warning');
        return false;
      }
      if (!validOptionalText(breed, NAME_RE)) {
        showToast('La raza solo debe contener letras y espacios.', 'warning');
        return false;
      }
      if (!color) {
        showToast('Completa el color de la mascota.', 'warning');
        return false;
      }
      if (color.length < 3 || color.length > 80 || !COLOR_RE.test(color) || !hasMinLetters(color, 3)) {
        showToast('El color debe describirse con palabras, no numeros.', 'warning');
        return false;
      }
      if (!form.pet.size?.trim()) {
        showToast('Selecciona el tamano de la mascota.', 'warning');
        return false;
      }
      if (age && (age.length > 40 || !hasMinLetters(age, 3))) {
        showToast('La edad aproximada debe incluir texto, por ejemplo "3 anos" o "cachorro".', 'warning');
        return false;
      }
      if (!description) {
        showToast('La descripcion de la mascota es obligatoria.', 'warning');
        return false;
      }
      if (description.length < 20 || wordCount(description) < 3 || !hasMinLetters(description, 10)) {
        showToast('La descripcion debe tener al menos 20 caracteres y 3 palabras.', 'warning');
        return false;
      }
      if (!validPhotoUrl(form.pet.photo_url)) {
        showToast('La URL de foto debe comenzar con http:// o https://.', 'warning');
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
      const address = clean(form.address);
      if (!address) {
        showToast('Completa la direccion o referencia del lugar.', 'warning');
        return false;
      }
      if (address.length < 5 || address.length > 160 || !hasMinLetters(address, 3)) {
        showToast('Ingresa una direccion o referencia valida.', 'warning');
        return false;
      }
      if (!form.date_event) {
        showToast('Debes ingresar la fecha del evento.', 'warning');
        return false;
      }
      const eventDate = new Date(`${form.date_event}T00:00:00`);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (Number.isNaN(eventDate.getTime()) || eventDate > today) {
        showToast('La fecha del evento no puede ser futura.', 'warning');
        return false;
      }
      return true;
    }

    if (targetStep === 3) {
      const contactName = clean(form.contact_name);
      const contactEmail = clean(form.contact_email);

      if (!contactName) {
        showToast('Ingresa un nombre de contacto.', 'warning');
        return false;
      }
      if (contactName.length < 2 || contactName.length > 80 || !NAME_RE.test(contactName) || !hasMinLetters(contactName, 2)) {
        showToast('El nombre de contacto solo debe contener letras y espacios.', 'warning');
        return false;
      }
      if (!form.contact_phone?.trim()) {
        showToast('Ingresa un telefono de contacto.', 'warning');
        return false;
      }
      if (!validPhone(form.contact_phone)) {
        showToast('Ingresa un telefono valido.', 'warning');
        return false;
      }
      if (!contactEmail) {
        showToast('Ingresa un email de contacto.', 'warning');
        return false;
      }
      if (!EMAIL_RE.test(contactEmail)) {
        showToast('Ingresa un email valido.', 'warning');
        return false;
      }
      if (clean(form.notes).length > 500) {
        showToast('Las notas no pueden superar 500 caracteres.', 'warning');
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
        pet: {
          ...form.pet,
          name: lowerText(clean(form.pet.name)),
          breed: lowerText(clean(form.pet.breed)),
          color: lowerText(clean(form.pet.color)),
        },
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
        });
      } catch {}

      setSuccess(true);
    } catch (err) {
      showToast(getApiErrorMessage(err.response?.data?.detail), 'warning');
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
                  <input className="input-field report-input" placeholder="Nombre de la mascota" value={form.pet.name} onChange={(e) => updateNormalizedPet('name', e.target.value)} maxLength={60} />
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
                  <input className="input-field report-input" placeholder="Ej: Labrador, Mestizo" value={form.pet.breed} onChange={(e) => updateNormalizedPet('breed', e.target.value)} maxLength={80} />
                </div>
                <div className="input-group">
                  <label>Color *</label>
                  <input className="input-field report-input" placeholder="Ej: Negro, Cafe con blanco" value={form.pet.color} onChange={(e) => updateNormalizedPet('color', e.target.value)} maxLength={80} required />
                </div>
              </div>

              <div className="grid-2 form-grid-tight">
                <div className="input-group">
                  <label>Tamano *</label>
                  <select className="input-field report-input" value={form.pet.size} onChange={(e) => updatePet('size', e.target.value)}>
                    <option value="pequeño">Pequeño</option>
                    <option value="mediano">Mediano</option>
                    <option value="grande">Grande</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Edad aproximada</label>
                  <input className="input-field report-input" placeholder="Ej: 3 anos, cachorro" value={form.pet.age_estimate} onChange={(e) => updatePet('age_estimate', e.target.value)} maxLength={40} />
                </div>
              </div>

              <div className="input-group">
                <label>Descripcion</label>
                <textarea className="input-field report-input report-textarea" placeholder="Describe caracteristicas adicionales" value={form.pet.description} onChange={(e) => updatePet('description', e.target.value)} minLength={20} maxLength={500} />
              </div>

              <div className="input-group">
                <label><Camera size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />URL de foto</label>
                <input className="input-field report-input" placeholder="https://..." value={form.pet.photo_url} onChange={(e) => updatePet('photo_url', e.target.value)} maxLength={300} />
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
                <input className="input-field report-input" placeholder="Ej: Av. Providencia 123, Santiago" value={form.address} onChange={(e) => updateField('address', e.target.value)} maxLength={160} />
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
                <input className="input-field report-input" placeholder="Tu nombre" value={form.contact_name} onChange={(e) => updateField('contact_name', e.target.value)} maxLength={80} />
              </div>
              <div className="input-group">
                <label>Telefono</label>
                <input className="input-field report-input" placeholder="+56 9 1234 5678" value={form.contact_phone} onChange={(e) => updateField('contact_phone', e.target.value)} maxLength={20} />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input-field report-input" placeholder="tu@email.com" value={form.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} maxLength={120} />
              </div>
              <div className="input-group">
                <label>Notas adicionales</label>
                <textarea className="input-field report-input report-textarea" placeholder="Cualquier informacion adicional" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} maxLength={500} />
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
