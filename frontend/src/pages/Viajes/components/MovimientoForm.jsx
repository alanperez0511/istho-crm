/**
 * ============================================================================
 * ISTHO CRM - MovimientoForm Component
 * ============================================================================
 * Formulario modal para crear y editar movimientos de caja menor.
 *
 * @author Coordinacion TI ISTHO
 * @version 1.0.0
 * @date Marzo 2026
 */

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Button } from '../../../components/common';
import { movimientosService, cajasMenoresService, viajesService } from '../../../api/viajes.service';
import useNotification from '../../../hooks/useNotification';
import { useAuth } from '../../../context/AuthContext';

// ════════════════════════════════════════════════════════════════════════════
// OPCIONES ESTATICAS
// ════════════════════════════════════════════════════════════════════════════

const TIPOS_MOVIMIENTO = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'egreso', label: 'Egreso' },
];

const CONCEPTOS_EGRESO = [
  { value: 'cuadre_de_caja', label: 'Cuadre de Caja' },
  { value: 'descargues', label: 'Descargues' },
  { value: 'acpm', label: 'ACPM' },
  { value: 'administracion', label: 'Administracion' },
  { value: 'alimentacion', label: 'Alimentacion' },
  { value: 'comisiones', label: 'Comisiones' },
  { value: 'desencarpe', label: 'Desencarpe' },
  { value: 'encarpe', label: 'Encarpe' },
  { value: 'hospedaje', label: 'Hospedaje' },
  { value: 'otros', label: 'Otros' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'repuestos', label: 'Repuestos' },
  { value: 'tecnomecanica', label: 'Tecnomecanica' },
  { value: 'peajes', label: 'Peajes' },
  { value: 'ligas', label: 'Ligas' },
  { value: 'parqueadero', label: 'Parqueadero' },
  { value: 'urea', label: 'UREA' },
];

const CONCEPTOS_INGRESO = [
  { value: 'ingreso_adicional', label: 'Ingreso Adicional' },
  { value: 'cuadre_de_caja', label: 'Cuadre de Caja' },
  { value: 'peajes_ingreso', label: 'Peajes Ingreso' },
  { value: 'ligas_ingresos', label: 'Ligas Ingresos' },
  { value: 'parqueadero_ingresos', label: 'Parqueadero Ingresos' },
  { value: 'urea_ingresos', label: 'UREA Ingresos' },
];

const INITIAL_FORM = {
  caja_menor_id: '',
  viaje_id: '',
  tipo_movimiento: '',
  concepto: '',
  concepto_otro: '',
  valor: '',
  descripcion: '',
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const MovimientoForm = ({ open, onClose, onSuccess, movimientoId, defaultCajaId, defaultViajeId }) => {
  const { success, error } = useNotification();
  const { user } = useAuth();

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [cajas, setCajas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [soporte, setSoporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const fileInputRef = useRef(null);

  const isEditing = !!movimientoId;
  const isConductor = user?.rol === 'conductor';

  const conceptosDisponibles = formData.tipo_movimiento === 'ingreso'
    ? CONCEPTOS_INGRESO
    : formData.tipo_movimiento === 'egreso'
      ? CONCEPTOS_EGRESO
      : [];

  // ──────────────────────────────────────────────────────────────────────────
  // EFECTOS
  // ──────────────────────────────────────────────────────────────────────────

  // Cargar cajas menores al abrir
  useEffect(() => {
    if (!open) return;

    const fetchCajas = async () => {
      try {
        const params = { estado: 'abierta' };
        if (isConductor) params.conductor_id = user.id;
        const response = await cajasMenoresService.getAll(params);
        if (response.success) {
          setCajas(response.data?.rows || response.data || []);
        }
      } catch (err) {
        console.error('Error cargando cajas menores:', err);
      }
    };

    fetchCajas();
  }, [open, isConductor, user?.id]);

  // Cargar viajes cuando cambia la caja menor
  useEffect(() => {
    if (!formData.caja_menor_id) {
      setViajes([]);
      return;
    }

    const fetchViajes = async () => {
      try {
        const response = await viajesService.getAll({ caja_menor_id: formData.caja_menor_id });
        if (response.success) {
          setViajes(response.data?.rows || response.data || []);
        }
      } catch (err) {
        console.error('Error cargando viajes:', err);
      }
    };

    fetchViajes();
  }, [formData.caja_menor_id]);

  // Cargar datos del movimiento en modo edicion o resetear
  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM);
      setSoporte(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (movimientoId) {
      const fetchMovimiento = async () => {
        setLoadingData(true);
        try {
          const response = await movimientosService.getById(movimientoId);
          if (response.success && response.data) {
            const m = response.data;
            setFormData({
              caja_menor_id: m.caja_menor_id ?? '',
              viaje_id: m.viaje_id ?? '',
              tipo_movimiento: m.tipo_movimiento || '',
              concepto: m.concepto || '',
              concepto_otro: m.concepto_otro || '',
              valor: m.valor ?? '',
              descripcion: m.descripcion || '',
            });
          } else {
            error('No se pudo cargar la informacion del movimiento');
            onClose();
          }
        } catch (err) {
          console.error('Error cargando movimiento:', err);
          error('Error al cargar el movimiento');
          onClose();
        } finally {
          setLoadingData(false);
        }
      };

      fetchMovimiento();
    } else {
      // Modo creacion: aplicar defaults
      setFormData({
        ...INITIAL_FORM,
        caja_menor_id: defaultCajaId || '',
        viaje_id: defaultViajeId || '',
      });
      setSoporte(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, movimientoId, defaultCajaId, defaultViajeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Resetear concepto cuando cambia el tipo de movimiento
      if (name === 'tipo_movimiento') {
        updated.concepto = '';
        updated.concepto_otro = '';
      }

      // Limpiar viaje_id si cambia la caja
      if (name === 'caja_menor_id') {
        updated.viaje_id = '';
      }

      return updated;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSoporte(file);
    }
  };

  const formatMoney = (value) => {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('es-CO');
  };

  const handleValorChange = (e) => {
    // Solo permitir numeros y punto decimal
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setFormData((prev) => ({ ...prev, valor: raw }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones basicas
    if (!formData.caja_menor_id) {
      error('Debe seleccionar una caja menor');
      return;
    }
    if (!formData.tipo_movimiento) {
      error('Debe seleccionar el tipo de movimiento');
      return;
    }
    if (!formData.concepto) {
      error('Debe seleccionar un concepto');
      return;
    }
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      error('Debe ingresar un valor valido');
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('caja_menor_id', formData.caja_menor_id);
      if (formData.viaje_id) fd.append('viaje_id', formData.viaje_id);
      fd.append('tipo_movimiento', formData.tipo_movimiento);
      fd.append('concepto', formData.concepto);
      if (formData.concepto === 'otros' && formData.concepto_otro) {
        fd.append('concepto_otro', formData.concepto_otro);
      }
      fd.append('valor', parseFloat(formData.valor));
      if (formData.descripcion) fd.append('descripcion', formData.descripcion);
      if (soporte) fd.append('soporte', soporte);

      let response;
      if (isEditing) {
        response = await movimientosService.update(movimientoId, fd);
      } else {
        response = await movimientosService.create(fd);
      }

      if (response.success) {
        success(isEditing ? 'Movimiento actualizado correctamente' : 'Movimiento registrado correctamente');
        onSuccess?.();
        onClose();
      } else {
        error(response.message || 'Error al guardar el movimiento');
      }
    } catch (err) {
      console.error('Error guardando movimiento:', err);
      error(err.response?.data?.message || 'Error al guardar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
        </DialogTitle>

        <DialogContent dividers>
          {loadingData ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <CircularProgress />
            </div>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {/* Caja Menor */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Caja Menor</InputLabel>
                  <Select
                    name="caja_menor_id"
                    value={formData.caja_menor_id}
                    onChange={handleChange}
                    label="Caja Menor"
                  >
                    {cajas.map((caja) => (
                      <MenuItem key={caja.id} value={caja.id}>
                        {caja.numero || `Caja #${caja.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Viaje (Opcional) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Viaje (Opcional)</InputLabel>
                  <Select
                    name="viaje_id"
                    value={formData.viaje_id}
                    onChange={handleChange}
                    label="Viaje (Opcional)"
                    disabled={!formData.caja_menor_id}
                  >
                    <MenuItem value="">
                      <em>Sin viaje asociado</em>
                    </MenuItem>
                    {viajes.map((viaje) => (
                      <MenuItem key={viaje.id} value={viaje.id}>
                        {viaje.numero || `Viaje #${viaje.id}`}{viaje.destino ? ` - ${viaje.destino}` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tipo de Movimiento */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Movimiento</InputLabel>
                  <Select
                    name="tipo_movimiento"
                    value={formData.tipo_movimiento}
                    onChange={handleChange}
                    label="Tipo de Movimiento"
                  >
                    {TIPOS_MOVIMIENTO.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Concepto */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Concepto</InputLabel>
                  <Select
                    name="concepto"
                    value={formData.concepto}
                    onChange={handleChange}
                    label="Concepto"
                    disabled={!formData.tipo_movimiento}
                  >
                    {conceptosDisponibles.map((c) => (
                      <MenuItem key={c.value} value={c.value}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Concepto Otro (solo si concepto === 'otros') */}
              {formData.concepto === 'otros' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Especifique el Concepto"
                    name="concepto_otro"
                    value={formData.concepto_otro}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
              )}

              {/* Valor */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleValorChange}
                  required
                  fullWidth
                  placeholder="0"
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    },
                  }}
                  helperText={formData.valor ? `$ ${formatMoney(formData.valor)}` : ''}
                />
              </Grid>

              {/* Soporte (archivo) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Soporte"
                  type="file"
                  onChange={handleFileChange}
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: {
                      accept: '.pdf,.jpg,.jpeg,.png',
                      ref: fileInputRef,
                    },
                  }}
                  helperText="PDF, JPG o PNG"
                />
              </Grid>

              {/* Descripcion */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={loading} disabled={loadingData}>
            {isEditing ? 'Guardar Cambios' : 'Registrar Movimiento'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MovimientoForm;
