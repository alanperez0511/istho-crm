/**
 * ============================================================================
 * ISTHO CRM - ViajeForm Page
 * ============================================================================
 * Formulario de pagina completa para crear y editar viajes.
 * URL: /viajes/viajes/nuevo  o  /viajes/viajes/:id/editar
 *
 * @author Coordinacion TI ISTHO
 * @version 1.0.0
 * @date Marzo 2026
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Paper,
  Grid,
  CircularProgress,
  Collapse,
  IconButton,
} from '@mui/material';
import { ArrowLeft, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/common';
import { viajesService, vehiculosService, cajasMenoresService } from '../../api/viajes.service';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const ViajeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const { user } = useAuth();

  const isEditing = !!id;

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    vehiculo_id: null,
    conductor_id: null,
    cliente_nombre: '',
    documento_cliente: '',
    origen: 'GIRARDOTA',
    destino: '',
    caja_menor_id: null,
    descripcion: '',
    // Informacion adicional
    peso: '',
    valor_descargue: '',
    num_personas: '',
    // Datos de facturacion
    no_factura: '',
    facturado: false,
    valor_viaje: '',
  });

  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [cajasMenores, setCajasMenores] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  // Secciones colapsables
  const [showAdicional, setShowAdicional] = useState(false);
  const [showFacturacion, setShowFacturacion] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // CARGA DE DATOS INICIALES
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchCatalogs = async () => {
      setLoadingData(true);
      try {
        const [vehRes, condRes, cajasRes] = await Promise.all([
          vehiculosService.getAll(),
          vehiculosService.getConductores(),
          cajasMenoresService.getAll({ estado: 'abierta' }),
        ]);

        if (vehRes.success) setVehiculos(vehRes.data || []);
        if (condRes.success) setConductores(condRes.data || []);
        if (cajasRes.success) {
          const lista = Array.isArray(cajasRes.data) ? cajasRes.data : (cajasRes.data?.cajasMenores || cajasRes.data?.rows || []);
          setCajasMenores(lista);
        }
      } catch (err) {
        console.error('Error cargando catalogos:', err);
        showError('Error al cargar los datos iniciales');
      } finally {
        setLoadingData(false);
      }
    };

    fetchCatalogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar viaje en modo edicion
  useEffect(() => {
    if (!id) return;

    const fetchViaje = async () => {
      setLoading(true);
      try {
        const response = await viajesService.getById(id);
        if (response.success && response.data) {
          const v = response.data;
          setFormData({
            fecha: v.fecha?.split('T')[0] || new Date().toISOString().split('T')[0],
            vehiculo_id: v.vehiculo_id || null,
            conductor_id: v.conductor_id || null,
            cliente_nombre: v.cliente_nombre || '',
            documento_cliente: v.documento_cliente || '',
            origen: v.origen || 'GIRARDOTA',
            destino: v.destino || '',
            caja_menor_id: v.caja_menor_id || null,
            descripcion: v.descripcion || '',
            peso: v.peso ?? '',
            valor_descargue: v.valor_descargue ?? '',
            num_personas: v.num_personas ?? '',
            no_factura: v.no_factura || '',
            facturado: v.facturado || false,
            valor_viaje: v.valor_viaje ?? '',
          });

          // Abrir secciones si tienen datos
          if (v.peso || v.valor_descargue || v.num_personas) setShowAdicional(true);
          if (v.no_factura || v.facturado || v.valor_viaje) setShowFacturacion(true);
        } else {
          showError('No se pudo cargar el viaje');
          navigate('/viajes/viajes');
        }
      } catch (err) {
        console.error('Error cargando viaje:', err);
        showError('Error al cargar el viaje');
        navigate('/viajes/viajes');
      } finally {
        setLoading(false);
      }
    };

    fetchViaje();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-set conductor si el usuario tiene rol conductor
  useEffect(() => {
    if (user?.rol?.nombre === 'conductor' && conductores.length > 0 && !isEditing) {
      const miConductor = conductores.find(
        (c) => c.usuario_id === user.id || c.cedula === user.cedula
      );
      if (miConductor) {
        setFormData((prev) => ({ ...prev, conductor_id: miConductor.id }));
      }
    }
  }, [user, conductores, isEditing]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    handleChange(name, type === 'checkbox' ? checked : value);
  };

  const handleSubmit = async () => {
    // Validacion basica
    if (!formData.fecha) {
      showError('La fecha es requerida');
      return;
    }
    if (!formData.origen?.trim()) {
      showError('El origen es requerido');
      return;
    }
    if (!formData.destino?.trim()) {
      showError('El destino es requerido');
      return;
    }

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

      let response;
      if (isEditing) {
        response = await viajesService.update(id, payload);
      } else {
        response = await viajesService.create(payload);
      }

      if (response.success) {
        success(isEditing ? 'Viaje actualizado correctamente' : 'Viaje creado correctamente');
        navigate('/viajes/viajes');
      } else {
        showError(response.message || 'Error al guardar el viaje');
      }
    } catch (err) {
      console.error('Error guardando viaje:', err);
      showError(err.response?.data?.message || 'Error al guardar el viaje');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // DATOS CALCULADOS
  // ──────────────────────────────────────────────────────────────────────────

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === formData.vehiculo_id) || null;
  const conductorSeleccionado = conductores.find((c) => c.id === formData.conductor_id) || null;
  const cajaSeleccionada = cajasMenores.find((c) => c.id === formData.caja_menor_id) || null;

  const esConductor = user?.rol?.nombre === 'conductor';

  // ──────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────────

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <CircularProgress size={40} sx={{ color: '#f97316' }} />
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HEADER                                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/viajes/viajes')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {isEditing ? `Editar Viaje #${id}` : 'Nuevo Viaje'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isEditing ? 'Modifique los datos del viaje' : 'Complete la informacion del viaje'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/viajes/viajes')}
            disabled={saving}
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={saving}
          >
            <Save className="w-4 h-4 mr-1" />
            {isEditing ? 'Guardar Cambios' : 'Crear Viaje'}
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECCION: BASICO                                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {/* Header azul */}
        <div className="bg-blue-600 px-5 py-3">
          <h2 className="text-white font-semibold text-sm tracking-wide uppercase">
            Datos Basicos
          </h2>
        </div>

        <div className="p-5">
          <Grid container spacing={2.5}>
            {/* Fecha */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleInputChange}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Vehiculo */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={vehiculos}
                value={vehiculoSeleccionado}
                onChange={(_, newValue) => handleChange('vehiculo_id', newValue?.id || null)}
                getOptionLabel={(option) =>
                  `${option.placa || ''} - ${option.tipo_vehiculo || ''}`.trim()
                }
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => (
                  <TextField {...params} label="Vehiculo" placeholder="Buscar por placa o tipo..." />
                )}
              />
            </Grid>

            {/* Conductor */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={conductores}
                value={conductorSeleccionado}
                onChange={(_, newValue) => handleChange('conductor_id', newValue?.id || null)}
                getOptionLabel={(option) =>
                  `${option.nombre || ''} ${option.apellido || ''}`.trim() || option.nombre_completo || ''
                }
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disabled={esConductor}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Conductor"
                    placeholder="Buscar conductor..."
                    helperText={esConductor ? 'Asignado automaticamente' : ''}
                  />
                )}
              />
            </Grid>

            {/* Cliente Nombre */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nombre del Cliente"
                name="cliente_nombre"
                value={formData.cliente_nombre}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>

            {/* Documento Cliente */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Documento del Cliente"
                name="documento_cliente"
                value={formData.documento_cliente}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>

            {/* Origen */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Origen"
                name="origen"
                value={formData.origen}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Grid>

            {/* Destino */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Destino"
                name="destino"
                value={formData.destino}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Grid>

            {/* Caja Menor */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={cajasMenores}
                value={cajaSeleccionada}
                onChange={(_, newValue) => handleChange('caja_menor_id', newValue?.id || null)}
                getOptionLabel={(option) =>
                  option.numero || `Caja #${option.id}`
                }
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => (
                  <TextField {...params} label="Caja Menor" placeholder="Seleccionar caja menor..." />
                )}
              />
            </Grid>

            {/* Descripcion */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </div>
      </Paper>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECCION: INFORMACION ADICIONAL (colapsable)                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={() => setShowAdicional(!showAdicional)}
          className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 tracking-wide uppercase">
            Informacion Adicional
          </h2>
          {showAdicional ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <Collapse in={showAdicional}>
          <div className="p-5">
            <Grid container spacing={2.5}>
              {/* Peso */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Peso (kg)"
                  name="peso"
                  type="number"
                  value={formData.peso}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              {/* Valor Descargue */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Valor Descargue ($)"
                  name="valor_descargue"
                  type="number"
                  value={formData.valor_descargue}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ min: 0, step: 100 }}
                />
              </Grid>

              {/* Numero de Personas */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Numero de Personas"
                  name="num_personas"
                  type="number"
                  value={formData.num_personas}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
            </Grid>
          </div>
        </Collapse>
      </Paper>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECCION: DATOS DE FACTURACION (colapsable)                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={() => setShowFacturacion(!showFacturacion)}
          className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 tracking-wide uppercase">
            Datos de Facturacion
          </h2>
          {showFacturacion ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <Collapse in={showFacturacion}>
          <div className="p-5">
            <Grid container spacing={2.5}>
              {/* No. Factura */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="No. Factura"
                  name="no_factura"
                  value={formData.no_factura}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>

              {/* Facturado */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="facturado"
                      checked={formData.facturado}
                      onChange={handleInputChange}
                      sx={{
                        '&.Mui-checked': { color: '#f97316' },
                      }}
                    />
                  }
                  label="Facturado"
                  sx={{ mt: 1 }}
                />
              </Grid>

              {/* Valor Viaje */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Valor del Viaje ($)"
                  name="valor_viaje"
                  type="number"
                  value={formData.valor_viaje}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ min: 0, step: 100 }}
                />
              </Grid>
            </Grid>
          </div>
        </Collapse>
      </Paper>
    </div>
  );
};

export default ViajeForm;
