/**
 * ISTHO CRM - Dashboard Principal
 * Vista general con KPIs y estadísticas
 */

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Datos de ejemplo
const kpiData = [
  {
    title: 'Clientes Activos',
    value: '24',
    change: '+12%',
    trend: 'up',
    icon: <PeopleIcon />,
    color: '#E65100'
  },
  {
    title: 'Despachos del Mes',
    value: '156',
    change: '+8%',
    trend: 'up',
    icon: <ShippingIcon />,
    color: '#2E7D32'
  },
  {
    title: 'Ítems en Inventario',
    value: '12,450',
    change: '-3%',
    trend: 'down',
    icon: <InventoryIcon />,
    color: '#0288D1'
  },
  {
    title: 'Tasa de Entrega',
    value: '96.5%',
    change: '+2.1%',
    trend: 'up',
    icon: <TrendingUpIcon />,
    color: '#7B1FA2'
  }
];

const despachosData = [
  { mes: 'Jul', despachos: 120, entregas: 115 },
  { mes: 'Ago', despachos: 135, entregas: 130 },
  { mes: 'Sep', despachos: 128, entregas: 125 },
  { mes: 'Oct', despachos: 142, entregas: 138 },
  { mes: 'Nov', despachos: 156, entregas: 151 },
  { mes: 'Dic', despachos: 148, entregas: 145 }
];

const clientesTop = [
  { nombre: 'Lácteos Betania S.A.S', despachos: 45, porcentaje: 29 },
  { nombre: 'Almacenes Éxito S.A', despachos: 38, porcentaje: 24 },
  { nombre: 'Distribuidora XYZ', despachos: 28, porcentaje: 18 },
  { nombre: 'Comercial ABC', despachos: 22, porcentaje: 14 },
  { nombre: 'Otros', despachos: 23, porcentaje: 15 }
];

const despachosRecientes = [
  { id: 'D-2024-0156', cliente: 'Lácteos Betania', destino: 'Medellín', estado: 'entregado', fecha: '07/01/2026' },
  { id: 'D-2024-0155', cliente: 'Almacenes Éxito', destino: 'Bogotá', estado: 'en_transito', fecha: '07/01/2026' },
  { id: 'D-2024-0154', cliente: 'Distribuidora XYZ', destino: 'Cali', estado: 'despachado', fecha: '06/01/2026' },
  { id: 'D-2024-0153', cliente: 'Comercial ABC', destino: 'Barranquilla', estado: 'programado', fecha: '06/01/2026' }
];

const estadoColors = {
  entregado: { color: 'success', icon: <CheckIcon fontSize="small" /> },
  en_transito: { color: 'info', icon: <ShippingIcon fontSize="small" /> },
  despachado: { color: 'primary', icon: <ScheduleIcon fontSize="small" /> },
  programado: { color: 'warning', icon: <WarningIcon fontSize="small" /> }
};

const COLORS = ['#E65100', '#FF833A', '#FFB74D', '#FFCC80', '#FFE0B2'];

const Dashboard = () => {
  return (
    <Box>
      {/* Título */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenido al CRM de ISTHO S.A.S. - Vista general del sistema
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${kpi.color}15`,
                      color: kpi.color,
                      width: 48,
                      height: 48
                    }}
                  >
                    {kpi.icon}
                  </Avatar>
                  <Chip
                    size="small"
                    icon={kpi.trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    label={kpi.change}
                    color={kpi.trend === 'up' ? 'success' : 'error'}
                    sx={{ height: 24 }}
                  />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {kpi.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {kpi.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico de Despachos */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Despachos vs Entregas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Últimos 6 meses
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={despachosData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="despachos" fill="#E65100" name="Despachos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="entregas" fill="#2E7D32" name="Entregas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución por Cliente */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top Clientes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Por volumen de despachos
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={clientesTop}
                    dataKey="despachos"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                  >
                    {clientesTop.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {clientesTop.slice(0, 3).map((cliente, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      py: 0.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: COLORS[index] 
                        }} 
                      />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {cliente.nombre}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {cliente.porcentaje}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Despachos Recientes */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Despachos Recientes
            </Typography>
            <Chip label="Ver todos" size="small" clickable color="primary" variant="outlined" />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID Despacho</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {despachosRecientes.map((despacho) => (
                  <TableRow key={despacho.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {despacho.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{despacho.cliente}</TableCell>
                    <TableCell>{despacho.destino}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={estadoColors[despacho.estado]?.icon}
                        label={despacho.estado.replace('_', ' ')}
                        color={estadoColors[despacho.estado]?.color}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{despacho.fecha}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
