/**
 * ISTHO CRM - Páginas Placeholder
 * Módulos en desarrollo
 */

import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

// Componente genérico para páginas en construcción
const PlaceholderPage = ({ title, description, features = [] }) => (
  <Box>
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Box>

    <Card sx={{ textAlign: 'center', py: 6 }}>
      <CardContent>
        <ConstructionIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Módulo en Desarrollo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
          Este módulo está actualmente en construcción. Próximamente estará disponible con las siguientes funcionalidades:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3 }}>
          {features.map((feature, index) => (
            <Chip key={index} label={feature} variant="outlined" color="primary" />
          ))}
        </Box>
        <Button variant="contained" disabled>
          Próximamente
        </Button>
      </CardContent>
    </Card>
  </Box>
);

// Página de Inventario
export const Inventario = () => (
  <PlaceholderPage
    title="Inventario"
    description="Control y gestión de inventario en tiempo real"
    features={[
      'Sincronización con WMS Copérnico',
      'Control de stock en tiempo real',
      'Alertas de inventario bajo',
      'Gestión de ubicaciones',
      'Trazabilidad por lote'
    ]}
  />
);

// Página de Despachos
export const Despachos = () => (
  <PlaceholderPage
    title="Despachos"
    description="Seguimiento y control de despachos"
    features={[
      'Creación de órdenes de despacho',
      'Seguimiento en tiempo real',
      'Integración con transportadoras',
      'Notificaciones automáticas',
      'Confirmación de entregas'
    ]}
  />
);

// Página de Trazabilidad
export const Trazabilidad = () => (
  <PlaceholderPage
    title="Trazabilidad"
    description="Trazabilidad completa de productos y despachos"
    features={[
      'Historial de eventos',
      'Tracking GPS',
      'Evidencias fotográficas',
      'Timeline de estados',
      'Exportación de reportes'
    ]}
  />
);

// Página de Reportes
export const Reportes = () => (
  <PlaceholderPage
    title="Reportes"
    description="Generación de reportes personalizados"
    features={[
      'Reportes de despachos',
      'Estadísticas de clientes',
      'Análisis de inventario',
      'Exportación a Excel/PDF',
      'Integración con Power BI'
    ]}
  />
);

// Página de Documentos
export const Documentos = () => (
  <PlaceholderPage
    title="Documentos"
    description="Gestión documental centralizada"
    features={[
      'Carga de documentos',
      'Organización por cliente',
      'Control de vencimientos',
      'Búsqueda avanzada',
      'Historial de versiones'
    ]}
  />
);

// Página de Configuración
export const Configuracion = () => (
  <PlaceholderPage
    title="Configuración"
    description="Configuración del sistema"
    features={[
      'Gestión de usuarios',
      'Roles y permisos',
      'Configuración de notificaciones',
      'Integraciones API',
      'Parámetros del sistema'
    ]}
  />
);
