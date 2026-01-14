/**
 * ============================================================================
 * ISTHO CRM - App.jsx (Fase 5 - Integración Completa)
 * ============================================================================
 * Aplicación principal con:
 * - AuthProvider para estado global de autenticación
 * - SnackbarProvider para notificaciones toast
 * - Rutas protegidas por rol
 * - Lazy loading para mejor rendimiento
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { SnackbarProvider } from 'notistack';

// ════════════════════════════════════════════════════════════════════════════
// PROVIDERS Y COMPONENTES DE AUTH
// ════════════════════════════════════════════════════════════════════════════
import { AuthProvider } from './context/AuthContext';
import PrivateRoute, {
  AdminRoute,
  SupervisorRoute,
  OperadorRoute
} from './components/auth/PrivateRoute';

// Layout
import FloatingHeader from './components/layout/FloatingHeader';

// ════════════════════════════════════════════════════════════════════════════
// LOADING COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <div className="text-center">
      {/* Logo animado */}
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
        <span className="text-white font-bold text-2xl">IS</span>
      </div>
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500">Cargando...</p>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// LAZY LOAD PAGES
// ════════════════════════════════════════════════════════════════════════════

// Auth (públicas)
const Login = lazy(() => import('./pages/Auth/Login'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));

// Dashboard
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Clientes
const ClientesList = lazy(() => import('./pages/Clientes/ClientesList'));
const ClienteDetail = lazy(() => import('./pages/Clientes/ClienteDetail'));

// Inventario
const InventarioList = lazy(() => import('./pages/Inventario/InventarioList'));
const ProductoDetail = lazy(() => import('./pages/Inventario/ProductoDetail'));
const AlertasInventario = lazy(() => import('./pages/Inventario/AlertasInventario'));

// Despachos
const DespachosList = lazy(() => import('./pages/Despachos/DespachosList'));
const DespachoDetail = lazy(() => import('./pages/Despachos/DespachoDetail'));

// Trazabilidad
const TrazabilidadList = lazy(() => import('./pages/Trazabilidad/TrazabilidadList'));
const TrazabilidadTimeline = lazy(() => import('./pages/Trazabilidad/TrazabilidadTimeline'));
const EvidenciasView = lazy(() => import('./pages/Trazabilidad/EvidenciasView'));

// Reportes
const ReportesList = lazy(() => import('./pages/Reportes/ReportesList'));
const ReporteDespachos = lazy(() => import('./pages/Reportes/ReporteDespachos'));
const ReporteInventario = lazy(() => import('./pages/Reportes/ReporteInventario'));
const ReporteClientes = lazy(() => import('./pages/Reportes/ReporteClientes'));

// Perfil y Configuración
const PerfilUsuario = lazy(() => import('./pages/Perfil/PerfilUsuario'));
const Configuracion = lazy(() => import('./pages/Perfil/Configuracion'));
const Notificaciones = lazy(() => import('./pages/Perfil/Notificaciones'));

// ════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER PARA PÁGINAS EN DESARROLLO
// ════════════════════════════════════════════════════════════════════════════
const ComingSoon = ({ title }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">🚧</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{title || 'Página no encontrada'}</h1>
      <p className="text-slate-500">Módulo en desarrollo</p>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// LAYOUT WRAPPER - Incluye Header en páginas protegidas
// ════════════════════════════════════════════════════════════════════════════
const ProtectedLayout = () => (
  <>
    <FloatingHeader />
    <Outlet />
  </>
);

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE NOTISTACK
// ════════════════════════════════════════════════════════════════════════════
const snackbarConfig = {
  maxSnack: 3,
  autoHideDuration: 4000,
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'right',
  },
  preventDuplicate: true,
  dense: false,
};

// ════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
function App() {
  return (
    <BrowserRouter>
      {/* Provider de notificaciones toast */}
      <SnackbarProvider {...snackbarConfig}>
        {/* Provider de autenticación */}
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ══════════════════════════════════════════════════════════ */}
              {/* RUTAS PÚBLICAS */}
              {/* ══════════════════════════════════════════════════════════ */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* ══════════════════════════════════════════════════════════ */}
              {/* RUTAS PROTEGIDAS - Requieren autenticación */}
              {/* ══════════════════════════════════════════════════════════ */}
              <Route element={
                <PrivateRoute>
                  <ProtectedLayout />
                </PrivateRoute>
              }>
                {/* Dashboard - Todos los roles */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* ────────────────────────────────────────────────────────── */}
                {/* CLIENTES */}
                {/* ────────────────────────────────────────────────────────── */}
                <Route path="/clientes" element={<ClientesList />} />
                <Route path="/clientes/:id" element={<ClienteDetail />} />

                {/* ────────────────────────────────────────────────────────── */}
                {/* INVENTARIO */}
                {/* ────────────────────────────────────────────────────────── */}
                <Route path="/inventario" element={<InventarioList />} />
                <Route path="/inventario/productos/:id" element={<ProductoDetail />} />
                <Route path="/inventario/alertas" element={<AlertasInventario />} />

                {/* ────────────────────────────────────────────────────────── */}
                {/* DESPACHOS (Operaciones) */}
                {/* ────────────────────────────────────────────────────────── */}
                <Route path="/despachos" element={<DespachosList />} />
                <Route path="/despachos/:id" element={<DespachoDetail />} />

                {/* ────────────────────────────────────────────────────────── */}
                {/* TRAZABILIDAD */}
                {/* ────────────────────────────────────────────────────────── */}
                <Route path="/trazabilidad" element={<TrazabilidadList />} />
                <Route path="/trazabilidad/mapa" element={<TrazabilidadList />} />
                <Route path="/trazabilidad/timeline/:id" element={<TrazabilidadTimeline />} />
                <Route path="/trazabilidad/evidencias/:id" element={<EvidenciasView />} />

                {/* ────────────────────────────────────────────────────────── */}
                {/* REPORTES - Solo supervisor y admin */}
                {/* ────────────────────────────────────────────────────────── */}
                <Route path="/reportes" element={<ReportesList />} />
                <Route path="/reportes/despachos" element={<ReporteDespachos />} />
                <Route path="/reportes/inventario" element={<ReporteInventario />} />
                <Route path="/reportes/clientes" element={<ReporteClientes />} />
                <Route path="/reportes/operativo" element={<ReporteDespachos />} />
                <Route path="/reportes/kpis" element={<ReporteDespachos />} />
                <Route path="/reportes/financiero" element={<ReporteClientes />} />
                <Route path="/reportes/crear" element={<ReportesList />} />

                {/* ────────────────────────────────────────────────────────── */}
                {/* PERFIL Y CONFIGURACIÓN */}
                {/* ────────────────────────────────────────────────────────── */}
                <Route path="/perfil" element={<PerfilUsuario />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/notificaciones" element={<Notificaciones />} />
                <Route path="/alertas" element={<Notificaciones />} />
              </Route>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* REDIRECCIONES */}
              {/* ══════════════════════════════════════════════════════════ */}

              {/* Raíz redirige a login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* 404 - Página no encontrada */}
              <Route path="*" element={<ComingSoon title="Página no encontrada" />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </SnackbarProvider>
    </BrowserRouter>
  );
}

export default App;