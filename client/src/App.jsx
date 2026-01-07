/**
 * ISTHO CRM - Aplicación Principal
 * Configuración de rutas y providers
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import {
  Dashboard,
  Clientes,
  Inventario,
  Despachos,
  Trazabilidad,
  Reportes,
  Documentos,
  Configuracion
} from './pages';

function App() {
  return (
    <ThemeProvider>
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={4000}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="despachos" element={<Despachos />} />
              <Route path="trazabilidad" element={<Trazabilidad />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="documentos" element={<Documentos />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App
