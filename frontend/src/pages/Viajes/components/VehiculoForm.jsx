/**
 * ============================================================================
 * ISTHO CRM - VehiculoForm Component
 * ============================================================================
 * Formulario modal para crear y editar vehiculos.
 *
 * @author Coordinacion TI ISTHO
 * @version 1.0.0
 * @date Marzo 2026
 */

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Button } from '../../../components/common';
import { vehiculosService } from '../../../api/viajes.service';
import useNotification from '../../../hooks/useNotification';

// ════════════════════════════════════════════════════════════════════════════
// OPCIONES ESTATICAS
// ════════════════════════════════════════════════════════════════════════════

const TIPOS_VEHICULO = [
  { value: 'sencillo', label: 'Sencillo' },
  { value: 'tractomula', label: 'Tractomula' },
  { value: 'turbo', label: 'Turbo' },
  { value: 'dobletroque', label: 'Doble Troque' },
  { value: 'minimula', label: 'Minimula' },
  { value: 'otro', label: 'Otro' },
];

const ESTADOS_VEHICULO = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'mantenimiento', label: 'En Mantenimiento' },
];

const INITIAL_FORM = {
  placa: '',
  tipo_vehiculo: '',
  capacidad_ton: '',
  marca: '',
  modelo: '',
  color: '',
  vencimiento_soat: '',
  vencimiento_tecnicomecanica: '',
  poliza_responsabilidad: '',
  numero_motor: '',
  numero_chasis: '',
  conductor_id: '',
  descripcion: '',
  estado: 'activo',
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const VehiculoForm = ({ open, onClose, onSuccess, vehiculoId }) => {
  const { success, error } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const isEditing = !!vehiculoId;

  // ──────────────────────────────────────────────────────────────────────────
  // EFECTOS
  // ──────────────────────────────────────────────────────────────────────────

  // Cargar conductores al abrir
  useEffect(() => {
    if (!open) return;

    const fetchConductores = async () => {
      try {
        const response = await vehiculosService.getConductores();
        if (response.success) {
          setConductores(response.data || []);
        }
      } catch (err) {
        console.error('Error cargando conductores:', err);
      }
    };

    fetchConductores();
  }, [open]);

  // Cargar datos del vehiculo en modo edicion
  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM);
      return;
    }

    if (!vehiculoId) {
      setFormData(INITIAL_FORM);
      return;
    }

    const fetchVehiculo = async () => {
      setLoadingData(true);
      try {
        const response = await vehiculosService.getById(vehiculoId);
        if (response.success && response.data) {
          const v = response.data;
          setFormData({
            placa: v.placa || '',
            tipo_vehiculo: v.tipo_vehiculo || '',
            capacidad_ton: v.capacidad_ton ?? '',
            marca: v.marca || '',
            modelo: v.modelo || '',
            color: v.color || '',
            vencimiento_soat: v.vencimiento_soat?.split('T')[0] || '',
            vencimiento_tecnicomecanica: v.vencimiento_tecnicomecanica?.split('T')[0] || '',
            poliza_responsabilidad: v.poliza_responsabilidad || '',
            numero_motor: v.numero_motor || '',
            numero_chasis: v.numero_chasis || '',
            conductor_id: v.conductor_id ?? '',
            descripcion: v.descripcion || '',
            estado: v.estado || 'activo',
          });
        } else {
          error('No se pudo cargar la informacion del vehiculo');
          onClose();
        }
      } catch (err) {
        console.error('Error cargando vehiculo:', err);
        error('Error al cargar el vehiculo');
        onClose();
      } finally {
        setLoadingData(false);
      }
    };

    fetchVehiculo();
  }, [open, vehiculoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'placa' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validacion basica
    if (!formData.placa.trim()) {
      error('La placa es requerida');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        capacidad_ton: formData.capacidad_ton ? parseFloat(formData.capacidad_ton) : null,
        conductor_id: formData.conductor_id || null,
        vencimiento_soat: formData.vencimiento_soat || null,
        vencimiento_tecnicomecanica: formData.vencimiento_tecnicomecanica || null,
      };

      let response;
      if (isEditing) {
        response = await vehiculosService.update(vehiculoId, payload);
      } else {
        response = await vehiculosService.create(payload);
      }

      if (response.success) {
        success(isEditing ? 'Vehiculo actualizado correctamente' : 'Vehiculo creado correctamente');
        onSuccess?.();
        onClose();
      } else {
        error(response.message || 'Error al guardar el vehiculo');
      }
    } catch (err) {
      console.error('Error guardando vehiculo:', err);
      error(err.response?.data?.message || 'Error al guardar el vehiculo');
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
          {isEditing ? 'Editar Vehiculo' : 'Nuevo Vehiculo'}
        </DialogTitle>

        <DialogContent dividers>
          {loadingData ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <CircularProgress />
            </div>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {/* Placa */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Placa"
                  name="placa"
                  value={formData.placa}
                  onChange={handleChange}
                  required
                  fullWidth
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              {/* Tipo de Vehiculo */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Vehiculo</InputLabel>
                  <Select
                    name="tipo_vehiculo"
                    value={formData.tipo_vehiculo}
                    onChange={handleChange}
                    label="Tipo de Vehiculo"
                  >
                    {TIPOS_VEHICULO.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Capacidad */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Capacidad (Toneladas)"
                  name="capacidad_ton"
                  type="number"
                  value={formData.capacidad_ton}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>

              {/* Marca */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Modelo (Ano) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Modelo (Ano)"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Color */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Vencimiento SOAT */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Vencimiento SOAT"
                  name="vencimiento_soat"
                  type="date"
                  value={formData.vencimiento_soat}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* Vencimiento Tecnicomecanica */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Vencimiento Tecnicomecanica"
                  name="vencimiento_tecnicomecanica"
                  type="date"
                  value={formData.vencimiento_tecnicomecanica}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* Poliza de Responsabilidad */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Poliza de Responsabilidad"
                  name="poliza_responsabilidad"
                  value={formData.poliza_responsabilidad}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Numero de Motor */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Numero de Motor"
                  name="numero_motor"
                  value={formData.numero_motor}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Numero de Chasis */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Numero de Chasis"
                  name="numero_chasis"
                  value={formData.numero_chasis}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Conductor */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Conductor Asignado</InputLabel>
                  <Select
                    name="conductor_id"
                    value={formData.conductor_id}
                    onChange={handleChange}
                    label="Conductor Asignado"
                  >
                    <MenuItem value="">
                      <em>Sin asignar</em>
                    </MenuItem>
                    {conductores.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre} {c.apellido} - {c.cedula}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Estado */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    label="Estado"
                  >
                    {ESTADOS_VEHICULO.map((est) => (
                      <MenuItem key={est.value} value={est.value}>
                        {est.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
            {isEditing ? 'Guardar Cambios' : 'Crear Vehiculo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default VehiculoForm;
