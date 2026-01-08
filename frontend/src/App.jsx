/**
 * ISTHO CRM - App.jsx
 * Configuración de rutas de la aplicación
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import FloatingHeader from './components/layout/FloatingHeader';

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500">Cargando...</p>
    </div>
  </div>
);

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ClientesList = lazy(() => import('./pages/Clientes/ClientesList'));
const ClienteDetail = lazy(() => import('./pages/Clientes/ClienteDetail'));
const InventarioList = lazy(() => import('./pages/Inventario/InventarioList'));
const ProductoDetail = lazy(() => import('./pages/Inventario/ProductoDetail'));
const AlertasInventario = lazy(() => import('./pages/Inventario/AlertasInventario'));
const DespachosList = lazy(() => import('./pages/Despachos/DespachosList'));
const DespachoDetail = lazy(() => import('./pages/Despachos/DespachoDetail'));
const TrazabilidadList = lazy(() => import('./pages/Trazabilidad/TrazabilidadList'));
const TrazabilidadTimeline = lazy(() => import('./pages/Trazabilidad/TrazabilidadTimeline'));
const EvidenciasView = lazy(() => import('./pages/Trazabilidad/EvidenciasView'));
const ReportesList = lazy(() => import('./pages/Reportes/ReportesList'));
const ReporteDespachos = lazy(() => import('./pages/Reportes/ReporteDespachos'));
const ReporteInventario = lazy(() => import('./pages/Reportes/ReporteInventario'));
const ReporteClientes = lazy(() => import('./pages/Reportes/ReporteClientes'));
const PerfilUsuario = lazy(() => import('./pages/Perfil/PerfilUsuario'));
const Configuracion = lazy(() => import('./pages/Perfil/Configuracion'));
const Notificaciones = lazy(() => import('./pages/Perfil/Notificaciones'));

// Placeholder para otras páginas
const ComingSoon = ({ title }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <FloatingHeader />
    <div className="text-center">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-500">Módulo en desarrollo</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Clientes */}
          <Route path="/clientes" element={<ClientesList />} />
          <Route path="/clientes/:id" element={<ClienteDetail />} />
          
          {/* Inventario */}
          <Route path="/inventario" element={<InventarioList />} />
          <Route path="/inventario/productos/:id" element={<ProductoDetail />} />
          <Route path="/inventario/alertas" element={<AlertasInventario />} />
          
          {/* Despachos */}
          <Route path="/despachos" element={<DespachosList />} />
          <Route path="/despachos/:id" element={<DespachoDetail />} />
          
          {/* Trazabilidad */}
          <Route path="/trazabilidad" element={<TrazabilidadList />} />
          <Route path="/trazabilidad/mapa" element={<TrazabilidadList />} />
          <Route path="/trazabilidad/timeline/:id" element={<TrazabilidadTimeline />} />
          <Route path="/trazabilidad/evidencias/:id" element={<EvidenciasView />} />
          
          {/* Reportes */}
          <Route path="/reportes" element={<ReportesList />} />
          <Route path="/reportes/despachos" element={<ReporteDespachos />} />
          <Route path="/reportes/inventario" element={<ReporteInventario />} />
          <Route path="/reportes/clientes" element={<ReporteClientes />} />
          <Route path="/reportes/operativo" element={<ReporteDespachos />} />
          <Route path="/reportes/kpis" element={<ReporteDespachos />} />
          <Route path="/reportes/financiero" element={<ReporteClientes />} />
          <Route path="/reportes/crear" element={<ReportesList />} />
          
          {/* Perfil y Configuración */}
          <Route path="/perfil" element={<PerfilUsuario />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/alertas" element={<Notificaciones />} />
          
          {/* 404 */}
          <Route path="*" element={<ComingSoon title="Página no encontrada" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;