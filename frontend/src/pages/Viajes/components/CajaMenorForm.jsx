/**
 * ============================================================================
 * ISTHO CRM - CajaMenorForm Component
 * ============================================================================
 * Formulario modal para crear y editar cajas menores.
 * Soporta traslado de saldo desde cajas cerradas anteriores.
 *
 * @author Coordinacion TI ISTHO
 * @version 1.0.0
 * @date Marzo 2026
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  Button,
  CircularProgress,
  InputAdornment,
  Alert,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { Wallet, Info } from 'lucide-react';

import { cajasMenoresService, vehiculosService } from '../../../api/viajes.service';
import useNotification from '../../../hooks/useNotification';

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const formatMoney = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const CajaMenorForm = ({ open, onClose, onSuccess, cajaId }) => {
  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────

  const [formData, setFormData] = useState({
    conductor_id: '',
    saldo_inicial: '',
    caja_anterior_id: null,
    observaciones: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Datos para selects
  const [conductores, setConductores] = useState([]);
  const [cajasCerradas, setCajasCerradas] = useState([]);
  const [cajaAnteriorSeleccionada, setCajaAnteriorSeleccionada] = useState(null);

  const isEditing = !!cajaId;
  const { success, error: notifyError, apiError } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // CARGA DE DATOS
  // ──────────────────────────────────────────────────────────────────────────

  const fetchConductores = useCallback(async () => {
    try {
      const response = await vehiculosService.getConductores();
      if (response.success || response.data) {
        setConductores(response.data || []);
      }
    } catch (err) {
      console.error('Error cargando conductores:', err);
      notifyError('No se pudieron cargar los conductores');
    }
  }, [notifyError]);

  const fetchCajasCerradas = useCallback(async () => {
    try {
      const response = await cajasMenoresService.getAll({ estado: 'cerrada' });
      if (response.success || response.data) {
        setCajasCerradas(response.data || []);
      }
    } catch (err) {
      console.error('Error cargando cajas cerradas:', err);
    }
  }, []);

  const fetchCajaExistente = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await cajasMenoresService.getById(id);
      if (response.success || response.data) {
        const caja = response.data;
        setFormData({
          conductor_id: caja.conductor_id || '',
          saldo_inicial: caja.saldo_inicial || '',
          caja_anterior_id: caja.caja_anterior_id || null,
          observaciones: caja.observaciones || '',
        });

        // Si tiene caja anterior, buscarla en las cerradas
        if (caja.caja_anterior_id) {
          const cajaAnterior = cajasCerradas.find(
            (c) => c.id === caja.caja_anterior_id
          );
          setCajaAnteriorSeleccionada(cajaAnterior || null);
        }
      }
    } catch (err) {
      console.error('Error cargando caja menor:', err);
      apiError(err);
    } finally {
      setLoading(false);
    }
  }, [apiError, cajasCerradas]);

  // ──────────────────────────────────────────────────────────────────────────
  // EFECTOS
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setLoadingData(true);
      setErrors({});

      Promise.all([fetchConductores(), fetchCajasCerradas()]).finally(() => {
        setLoadingData(false);
      });

      // Reset si es creacion
      if (!cajaId) {
        setFormData({
          conductor_id: '',
          saldo_inicial: '',
          caja_anterior_id: null,
          observaciones: '',
        });
        setCajaAnteriorSeleccionada(null);
      }
    }
  }, [open, cajaId, fetchConductores, fetchCajasCerradas]);

  // Cargar datos de caja existente en modo edicion
  useEffect(() => {
    if (open && cajaId && !loadingData) {
      fetchCajaExistente(cajaId);
    }
  }, [open, cajaId, loadingData, fetchCajaExistente]);

  // ──────────────────────────────────────────────────────────────────────────
  // CALCULOS
  // ──────────────────────────────────────────────────────────────────────────

  const saldoTrasladado = useMemo(() => {
    if (!cajaAnteriorSeleccionada) return 0;
    return parseFloat(cajaAnteriorSeleccionada.saldo_actual) || 0;
  }, [cajaAnteriorSeleccionada]);

  const saldoTotal = useMemo(() => {
    const inicial = parseFloat(formData.saldo_inicial) || 0;
    return inicial + saldoTrasladado;
  }, [formData.saldo_inicial, saldoTrasladado]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleCajaAnteriorChange = (_event, newValue) => {
    setCajaAnteriorSeleccionada(newValue);
    handleChange('caja_anterior_id', newValue?.id || null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // VALIDACION
  // ──────────────────────────────────────────────────────────────────────────

  const validate = () => {
    const newErrors = {};

    if (!formData.conductor_id) {
      newErrors.conductor_id = 'El conductor es requerido';
    }

    if (!isEditing) {
      if (!formData.saldo_inicial && formData.saldo_inicial !== 0) {
        newErrors.saldo_inicial = 'El saldo inicial es requerido';
      } else if (parseFloat(formData.saldo_inicial) < 0) {
        newErrors.saldo_inicial = 'El saldo inicial no puede ser negativo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ──────────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = isEditing
        ? {
            conductor_id: formData.conductor_id,
            observaciones: formData.observaciones,
          }
        : {
            conductor_id: formData.conductor_id,
            saldo_inicial: parseFloat(formData.saldo_inicial) || 0,
            caja_anterior_id: formData.caja_anterior_id || null,
            observaciones: formData.observaciones || null,
          };

      let response;
      if (isEditing) {
        response = await cajasMenoresService.update(cajaId, payload);
      } else {
        response = await cajasMenoresService.create(payload);
      }

      if (response.success !== false) {
        success(
          isEditing
            ? 'Caja menor actualizada correctamente'
            : 'Caja menor creada correctamente'
        );
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error guardando caja menor:', err);
      apiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  const isLoading = loading || loadingData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Wallet size={22} />
        <span>{isEditing ? 'Editar Caja Menor' : 'Nueva Caja Menor'}</span>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 6,
            }}
          >
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2, color: 'text.secondary' }}>
              Cargando datos...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Conductor */}
            <TextField
              select
              label="Conductor"
              value={formData.conductor_id}
              onChange={(e) => handleChange('conductor_id', e.target.value)}
              error={!!errors.conductor_id}
              helperText={errors.conductor_id}
              required
              fullWidth
              disabled={isLoading}
            >
              <MenuItem value="" disabled>
                Seleccionar conductor...
              </MenuItem>
              {conductores.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre} {c.apellido ? `${c.apellido}` : ''}{' '}
                  {c.cedula ? `- CC ${c.cedula}` : ''}
                </MenuItem>
              ))}
            </TextField>

            {/* Saldo Inicial */}
            <TextField
              label="Saldo Inicial"
              type="number"
              value={formData.saldo_inicial}
              onChange={(e) => handleChange('saldo_inicial', e.target.value)}
              error={!!errors.saldo_inicial}
              helperText={
                errors.saldo_inicial ||
                (formData.saldo_inicial
                  ? formatMoney(formData.saldo_inicial)
                  : '')
              }
              required
              fullWidth
              disabled={isEditing || isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              inputProps={{ min: 0, step: 1000 }}
            />

            {/* Caja Anterior (traslado de saldo) */}
            {!isEditing && (
              <Autocomplete
                options={cajasCerradas}
                value={cajaAnteriorSeleccionada}
                onChange={handleCajaAnteriorChange}
                getOptionLabel={(option) =>
                  option
                    ? `Caja #${option.id} - ${option.conductor_nombre || 'Sin conductor'} - ${formatMoney(option.saldo_actual)}`
                    : ''
                }
                isOptionEqualToValue={(option, value) =>
                  option?.id === value?.id
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Caja Anterior (Traslado de saldo)"
                    placeholder="Buscar caja cerrada..."
                    helperText="Opcional. Seleccione una caja cerrada para trasladar su saldo."
                  />
                )}
                noOptionsText="No hay cajas cerradas disponibles"
                disabled={isLoading}
                fullWidth
              />
            )}

            {/* Saldo a Trasladar (info) */}
            {cajaAnteriorSeleccionada && !isEditing && (
              <Alert
                severity="info"
                icon={<Info size={20} />}
                sx={{ borderRadius: '12px' }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Saldo a trasladar:{' '}
                  <strong>{formatMoney(saldoTrasladado)}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.5, color: 'text.secondary' }}
                >
                  De la caja #{cajaAnteriorSeleccionada.id}
                  {cajaAnteriorSeleccionada.conductor_nombre
                    ? ` (${cajaAnteriorSeleccionada.conductor_nombre})`
                    : ''}
                </Typography>
              </Alert>
            )}

            {/* Saldo Total Calculado */}
            {!isEditing && (parseFloat(formData.saldo_inicial) > 0 || saldoTrasladado > 0) && (
              <Alert
                severity="success"
                sx={{ borderRadius: '12px' }}
              >
                <Typography variant="body2">
                  <strong>Saldo total de la caja:</strong>{' '}
                  {formatMoney(saldoTotal)}
                </Typography>
                {saldoTrasladado > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
                  >
                    ({formatMoney(formData.saldo_inicial || 0)} inicial +{' '}
                    {formatMoney(saldoTrasladado)} trasladado)
                  </Typography>
                )}
              </Alert>
            )}

            {/* Observaciones */}
            <TextField
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              multiline
              rows={3}
              fullWidth
              disabled={isLoading}
              placeholder="Notas adicionales sobre la caja menor..."
            />
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || isLoading}
          startIcon={
            submitting ? <CircularProgress size={18} color="inherit" /> : null
          }
        >
          {submitting
            ? 'Guardando...'
            : isEditing
              ? 'Guardar Cambios'
              : 'Crear Caja Menor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CajaMenorForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  cajaId: PropTypes.number,
};

CajaMenorForm.defaultProps = {
  onSuccess: null,
  cajaId: null,
};

export default CajaMenorForm;
