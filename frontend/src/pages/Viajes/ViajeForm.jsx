/**
 * ISTHO CRM - ViajeForm Page
 * Formulario de página completa para crear y editar viajes.
 * Rediseñado con Tailwind puro (sin MUI).
 * @version 2.0.0
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, ChevronDown, ChevronUp, MapPin, Truck, User, FileText, DollarSign, Calendar, Package } from 'lucide-react';
import { Button } from '../../components/common';
import { viajesService, vehiculosService, cajasMenoresService } from '../../api/viajes.service';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const formatThousands = (value) => {
  if (!value && value !== 0) return '';
  const num = String(value).replace(/[^\d]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('es-CO');
};

const parseThousands = (formatted) => {
  const clean = String(formatted).replace(/[^\d]/g, '');
  return clean ? Number(clean) : '';
};

const inputClasses = (hasIcon = false) => `
  w-full px-4 py-2.5
  bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl
  text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500
  focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
  transition-all duration-200
  ${hasIcon ? 'pl-10' : ''}
`;

const selectClasses = (hasIcon = false) => `${inputClasses(hasIcon)} appearance-none cursor-pointer`;

// ════════════════════════════════════════════════════════════════════════════
// INPUT FIELD
// ════════════════════════════════════════════════════════════════════════════

const Field = ({ label, icon: Icon, required, children, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      )}
      {children}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// SECTION CARD
// ════════════════════════════════════════════════════════════════════════════

const SectionCard = ({ title, color = 'blue', collapsible = false, open, onToggle, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
    {collapsible ? (
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
      >
        <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 tracking-wide uppercase">{title}</h2>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
    ) : (
      <div className={`px-5 py-3 ${color === 'blue' ? 'bg-blue-600' : 'bg-slate-600'}`}>
        <h2 className="text-white font-semibold text-sm tracking-wide uppercase">{title}</h2>
      </div>
    )}
    {(!collapsible || open) && <div className="p-5">{children}</div>}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const ViajeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    vehiculo_id: '', conductor_id: '', cliente_nombre: '', documento_cliente: '',
    origen: 'GIRARDOTA', destino: '', caja_menor_id: '', descripcion: '',
    peso: '', valor_descargue: '', num_personas: '',
    no_factura: '', facturado: false, valor_viaje: '',
  });

  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [cajasMenores, setCajasMenores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdicional, setShowAdicional] = useState(false);
  const [showFacturacion, setShowFacturacion] = useState(false);

  const esConductor = user?.rol === 'conductor';

  // Carga inicial
  useEffect(() => {
    const fetch = async () => {
      try {
        const [vehRes, condRes, cajasRes] = await Promise.all([
          vehiculosService.getAll({ limit: 200 }),
          vehiculosService.getConductores(),
          cajasMenoresService.getAll({ estado: 'abierta', limit: 100 }),
        ]);
        if (vehRes.success) setVehiculos(vehRes.data || []);
        if (condRes.success) setConductores(condRes.data || []);
        if (cajasRes.success) setCajasMenores(Array.isArray(cajasRes.data) ? cajasRes.data : []);
      } catch (err) {
        showError('Error al cargar datos iniciales');
      }

      if (id) {
        try {
          const res = await viajesService.getById(id);
          if (res.success && res.data) {
            const v = res.data;
            setFormData({
              fecha: v.fecha?.split('T')[0] || '', vehiculo_id: v.vehiculo_id || '',
              conductor_id: v.conductor_id || '', cliente_nombre: v.cliente_nombre || '',
              documento_cliente: v.documento_cliente || '', origen: v.origen || 'GIRARDOTA',
              destino: v.destino || '', caja_menor_id: v.caja_menor_id || '',
              descripcion: v.descripcion || '', peso: v.peso ?? '',
              valor_descargue: v.valor_descargue ?? '', num_personas: v.num_personas ?? '',
              no_factura: v.no_factura || '', facturado: v.facturado || false,
              valor_viaje: v.valor_viaje ?? '',
            });
            if (v.peso || v.valor_descargue || v.num_personas) setShowAdicional(true);
            if (v.no_factura || v.facturado || v.valor_viaje) setShowFacturacion(true);
          }
        } catch { showError('Error al cargar viaje'); navigate('/viajes/viajes'); }
      }
      setLoading(false);
    };
    fetch();
  }, [id]); // eslint-disable-line

  const handleChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if (!formData.destino?.trim()) { showError('El destino es requerido'); return; }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        vehiculo_id: formData.vehiculo_id || null,
        conductor_id: formData.conductor_id || null,
        caja_menor_id: formData.caja_menor_id || null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        valor_descargue: formData.valor_descargue ? parseFloat(formData.valor_descargue) : null,
        num_personas: formData.num_personas ? parseInt(formData.num_personas) : null,
        valor_viaje: formData.valor_viaje ? parseFloat(formData.valor_viaje) : null,
      };

      const response = isEditing
        ? await viajesService.update(id, payload)
        : await viajesService.create(payload);

      if (response.success) {
        success(isEditing ? 'Viaje actualizado' : 'Viaje creado');
        navigate('/viajes/viajes');
      } else {
        showError(response.message || 'Error al guardar');
      }
    } catch (err) {
      showError(err.message || 'Error al guardar el viaje');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/viajes/viajes')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {isEditing ? `Editar Viaje #${id}` : 'Nuevo Viaje'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isEditing ? 'Modifique los datos del viaje' : 'Complete la información del viaje'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/viajes/viajes')} disabled={saving}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            <Save className="w-4 h-4 mr-1" /> {isEditing ? 'Guardar' : 'Crear Viaje'}
          </Button>
        </div>
      </div>

      {/* DATOS BÁSICOS */}
      <SectionCard title="Datos Básicos" color="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Fecha" icon={Calendar} required>
            <input type="date" value={formData.fecha} onChange={e => handleChange('fecha', e.target.value)} className={inputClasses(true)} required />
          </Field>

          <Field label="Vehículo" icon={Truck}>
            <select value={formData.vehiculo_id} onChange={e => handleChange('vehiculo_id', e.target.value)} className={selectClasses(true)}>
              <option value="">Seleccionar vehículo...</option>
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>{v.placa} - {v.tipo_vehiculo}</option>
              ))}
            </select>
          </Field>

          <Field label="Conductor" icon={User}>
            <select value={formData.conductor_id} onChange={e => handleChange('conductor_id', e.target.value)} disabled={esConductor} className={`${selectClasses(true)} ${esConductor ? 'opacity-60' : ''}`}>
              <option value="">Seleccionar conductor...</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre_completo || c.username}</option>
              ))}
            </select>
          </Field>

          <Field label="Nombre del Cliente" icon={Package}>
            <input type="text" value={formData.cliente_nombre} onChange={e => handleChange('cliente_nombre', e.target.value)} placeholder="Nombre del cliente" className={inputClasses(true)} />
          </Field>

          <Field label="Documento del Cliente" icon={FileText}>
            <input type="text" value={formData.documento_cliente} onChange={e => handleChange('documento_cliente', e.target.value)} placeholder="Remisión o documento" className={inputClasses(true)} />
          </Field>

          <Field label="Origen" icon={MapPin} required>
            <input type="text" value={formData.origen} onChange={e => handleChange('origen', e.target.value.toUpperCase())} className={inputClasses(true)} required />
          </Field>

          <Field label="Destino" icon={MapPin} required>
            <input type="text" value={formData.destino} onChange={e => handleChange('destino', e.target.value)} placeholder="Ciudad destino" className={inputClasses(true)} required />
          </Field>

          <Field label="Caja Menor">
            <select value={formData.caja_menor_id} onChange={e => handleChange('caja_menor_id', e.target.value)} className={selectClasses()}>
              <option value="">Sin caja menor</option>
              {cajasMenores.map(c => (
                <option key={c.id} value={c.id}>{c.numero} - {c.conductor?.nombre_completo || c.conductor?.username || ''}</option>
              ))}
            </select>
          </Field>

          <Field label="Descripción" className="md:col-span-2">
            <textarea value={formData.descripcion} onChange={e => handleChange('descripcion', e.target.value)} rows={3} placeholder="Notas del viaje..." className={inputClasses()} />
          </Field>
        </div>
      </SectionCard>

      {/* INFORMACIÓN ADICIONAL */}
      <SectionCard title="Información Adicional" collapsible open={showAdicional} onToggle={() => setShowAdicional(!showAdicional)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Peso (kg)">
            <input type="number" value={formData.peso} onChange={e => handleChange('peso', e.target.value)} min={0} step={0.01} placeholder="0.00" className={inputClasses()} />
          </Field>
          <Field label="Valor Descargue ($)" icon={DollarSign}>
            <input type="text" value={formatThousands(formData.valor_descargue)} onChange={e => handleChange('valor_descargue', parseThousands(e.target.value))} placeholder="0" className={inputClasses(true)} />
          </Field>
          <Field label="Nº Personas">
            <input type="number" value={formData.num_personas} onChange={e => handleChange('num_personas', e.target.value)} min={0} step={1} placeholder="0" className={inputClasses()} />
          </Field>
        </div>
      </SectionCard>

      {/* DATOS DE FACTURACIÓN */}
      <SectionCard title="Datos de Facturación" collapsible open={showFacturacion} onToggle={() => setShowFacturacion(!showFacturacion)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nº Factura" icon={FileText}>
            <input type="text" value={formData.no_factura} onChange={e => handleChange('no_factura', e.target.value)} placeholder="Número de factura" className={inputClasses(true)} />
          </Field>
          <Field label="Valor del Viaje ($)" icon={DollarSign}>
            <input type="text" value={formatThousands(formData.valor_viaje)} onChange={e => handleChange('valor_viaje', parseThousands(e.target.value))} placeholder="0" className={inputClasses(true)} />
          </Field>
          <Field label="Facturado">
            <label className="flex items-center gap-3 mt-2 cursor-pointer">
              <input type="checkbox" checked={formData.facturado} onChange={e => handleChange('facturado', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{formData.facturado ? 'Sí' : 'No'}</span>
            </label>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
};

export default ViajeForm;
