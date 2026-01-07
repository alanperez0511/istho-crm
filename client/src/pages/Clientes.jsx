/**
 * ISTHO CRM - Página de Clientes
 * Gestión completa de clientes
 */

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';

// Datos de ejemplo
const clientesData = [
  {
    id: 1,
    codigo: 'CLI-0001',
    razon_social: 'Lácteos Betania S.A.S',
    nit: '900123456-1',
    ciudad: 'Medellín',
    tipo: 'corporativo',
    sector: 'Alimentos',
    estado: 'activo',
    contacto: 'Juan Pérez',
    email: 'contacto@lactosbetania.com'
  },
  {
    id: 2,
    codigo: 'CLI-0002',
    razon_social: 'Almacenes Éxito S.A',
    nit: '890900608-9',
    ciudad: 'Envigado',
    tipo: 'corporativo',
    sector: 'Retail',
    estado: 'activo',
    contacto: 'María García',
    email: 'logistica@exito.com'
  },
  {
    id: 3,
    codigo: 'CLI-0003',
    razon_social: 'Distribuidora Norte S.A.S',
    nit: '901234567-8',
    ciudad: 'Bogotá',
    tipo: 'pyme',
    sector: 'Distribución',
    estado: 'activo',
    contacto: 'Carlos López',
    email: 'ventas@distnorte.com'
  },
  {
    id: 4,
    codigo: 'CLI-0004',
    razon_social: 'Comercializadora ABC',
    nit: '800456789-0',
    ciudad: 'Cali',
    tipo: 'pyme',
    sector: 'Comercio',
    estado: 'inactivo',
    contacto: 'Ana Martínez',
    email: 'info@comabc.com'
  }
];

const estadoColors = {
  activo: 'success',
  inactivo: 'default',
  suspendido: 'error'
};

const tipoColors = {
  corporativo: 'primary',
  pyme: 'secondary',
  persona_natural: 'info'
};

const Clientes = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'

  // Estado del formulario
  const [formData, setFormData] = useState({
    razon_social: '',
    nit: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: '',
    tipo_cliente: 'corporativo',
    sector: '',
    observaciones: ''
  });

  const handleMenuClick = (event, cliente) => {
    setAnchorEl(event.currentTarget);
    setSelectedCliente(cliente);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenDialog = (mode, cliente = null) => {
    setDialogMode(mode);
    if (cliente) {
      setFormData({
        razon_social: cliente.razon_social,
        nit: cliente.nit,
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad,
        telefono: cliente.telefono || '',
        email: cliente.email,
        tipo_cliente: cliente.tipo,
        sector: cliente.sector,
        observaciones: ''
      });
    } else {
      setFormData({
        razon_social: '',
        nit: '',
        direccion: '',
        ciudad: '',
        telefono: '',
        email: '',
        tipo_cliente: 'corporativo',
        sector: '',
        observaciones: ''
      });
    }
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCliente(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Datos del formulario:', formData);
    // Aquí iría la llamada al API
    handleCloseDialog();
  };

  // Filtrar clientes
  const filteredClientes = clientesData.filter(cliente => {
    const matchSearch = cliente.razon_social.toLowerCase().includes(search.toLowerCase()) ||
                       cliente.nit.includes(search) ||
                       cliente.codigo.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || cliente.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  return (
    <Box>
      {/* Título y acciones */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Clientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona la información de tus clientes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ height: 42 }}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {/* Filtros y búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre, NIT o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterEstado}
                  label="Estado"
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                  <MenuItem value="suspendido">Suspendido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<FilterIcon />} size="small">
                  Más filtros
                </Button>
                <Button variant="outlined" startIcon={<ExportIcon />} size="small">
                  Exportar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>NIT</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Sector</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClientes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {cliente.razon_social}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cliente.codigo} • {cliente.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{cliente.nit}</TableCell>
                  <TableCell>{cliente.ciudad}</TableCell>
                  <TableCell>
                    <Chip 
                      label={cliente.tipo} 
                      size="small" 
                      color={tipoColors[cliente.tipo]}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{cliente.sector}</TableCell>
                  <TableCell>
                    <Chip 
                      label={cliente.estado} 
                      size="small" 
                      color={estadoColors[cliente.estado]}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenDialog('view', cliente)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenDialog('edit', cliente)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuClick(e, cliente)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredClientes.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Card>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOpenDialog('view', selectedCliente)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} /> Ver detalles
        </MenuItem>
        <MenuItem onClick={() => handleOpenDialog('edit', selectedCliente)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
      </Menu>

      {/* Dialog para crear/editar cliente */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Nuevo Cliente'}
          {dialogMode === 'edit' && 'Editar Cliente'}
          {dialogMode === 'view' && 'Detalles del Cliente'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Razón Social"
                name="razon_social"
                value={formData.razon_social}
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="NIT"
                name="nit"
                value={formData.nit}
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="direccion"
                value={formData.direccion}
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={dialogMode === 'view'}>
                <InputLabel>Tipo de Cliente</InputLabel>
                <Select
                  name="tipo_cliente"
                  value={formData.tipo_cliente}
                  label="Tipo de Cliente"
                  onChange={handleFormChange}
                >
                  <MenuItem value="corporativo">Corporativo</MenuItem>
                  <MenuItem value="pyme">PYME</MenuItem>
                  <MenuItem value="persona_natural">Persona Natural</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sector"
                name="sector"
                value={formData.sector}
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            {dialogMode === 'view' ? 'Cerrar' : 'Cancelar'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clientes;
