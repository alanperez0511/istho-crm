/**
 * ISTHO CRM - ReportesList Page
 * Dashboard principal de reportes con acceso a diferentes tipos
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  Package,
  Users,
  Truck,
  Calendar,
  Download,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  FileSpreadsheet,
  Filter,
  Plus,
  Star,
  Eye,
} from 'lucide-react';

// Layout


// Components
import { Button, SearchBar } from '../../components/common';

// ============================================
// DATOS MOCK
// ============================================
const REPORTES_DISPONIBLES = [
  {
    id: 'despachos',
    titulo: 'Reporte de Despachos',
    descripcion: 'Análisis completo de despachos, entregas y tiempos de cumplimiento',
    icon: Truck,
    color: 'bg-blue-500',
    categoria: 'operaciones',
    frecuencia: 'Diario',
    ultimaGeneracion: '2026-01-08 08:00',
    favorito: true,
  },
  {
    id: 'inventario',
    titulo: 'Reporte de Inventario',
    descripcion: 'Estado del inventario, rotación de productos y valorización',
    icon: Package,
    color: 'bg-emerald-500',
    categoria: 'inventario',
    frecuencia: 'Semanal',
    ultimaGeneracion: '2026-01-06 09:30',
    favorito: true,
  },
  {
    id: 'clientes',
    titulo: 'Reporte de Clientes',
    descripcion: 'Actividad de clientes, facturación y satisfacción',
    icon: Users,
    color: 'bg-violet-500',
    categoria: 'comercial',
    frecuencia: 'Mensual',
    ultimaGeneracion: '2026-01-01 10:00',
    favorito: false,
  },
  {
    id: 'operativo',
    titulo: 'Reporte Operativo Diario',
    descripcion: 'Resumen ejecutivo de operaciones del día',
    icon: Activity,
    color: 'bg-amber-500',
    categoria: 'operaciones',
    frecuencia: 'Diario',
    ultimaGeneracion: '2026-01-08 06:00',
    favorito: true,
  },
  {
    id: 'kpis',
    titulo: 'Dashboard de KPIs',
    descripcion: 'Indicadores clave de rendimiento consolidados',
    icon: BarChart3,
    color: 'bg-rose-500',
    categoria: 'gerencial',
    frecuencia: 'Tiempo real',
    ultimaGeneracion: 'En vivo',
    favorito: false,
  },
  {
    id: 'financiero',
    titulo: 'Reporte Financiero',
    descripcion: 'Ingresos, costos operativos y rentabilidad por cliente',
    icon: TrendingUp,
    color: 'bg-cyan-500',
    categoria: 'financiero',
    frecuencia: 'Mensual',
    ultimaGeneracion: '2026-01-01 08:00',
    favorito: false,
  },
];

const REPORTES_RECIENTES = [
  { id: 1, titulo: 'Despachos Enero 2026', tipo: 'despachos', fecha: '2026-01-08 08:00', formato: 'PDF' },
  { id: 2, titulo: 'Inventario Semana 1', tipo: 'inventario', fecha: '2026-01-06 09:30', formato: 'Excel' },
  { id: 3, titulo: 'KPIs Diciembre 2025', tipo: 'kpis', fecha: '2026-01-02 10:15', formato: 'PDF' },
  { id: 4, titulo: 'Clientes Q4 2025', tipo: 'clientes', fecha: '2026-01-01 11:00', formato: 'Excel' },
];

const REPORTES_PROGRAMADOS = [
  { id: 1, titulo: 'Reporte Operativo Diario', proxima: '2026-01-09 06:00', destinatarios: 5 },
  { id: 2, titulo: 'Inventario Semanal', proxima: '2026-01-13 09:00', destinatarios: 3 },
  { id: 3, titulo: 'Resumen Mensual Gerencia', proxima: '2026-02-01 08:00', destinatarios: 2 },
];

const CATEGORIAS = [
  { value: 'todos', label: 'Todos' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'financiero', label: 'Financiero' },
  { value: 'gerencial', label: 'Gerencial' },
];

// ============================================
// REPORTE CARD
// ============================================
const ReporteCard = ({ reporte, onGenerar, onVer, onToggleFavorito }) => {
  const Icon = reporte.icon;
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${reporte.color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <button
          onClick={() => onToggleFavorito(reporte.id)}
          className={`p-2 rounded-lg transition-colors ${reporte.favorito
              ? 'text-amber-500 bg-amber-50'
              : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
            }`}
        >
          <Star className={`w-5 h-5 ${reporte.favorito ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-slate-800 mb-1">{reporte.titulo}</h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{reporte.descripcion}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {reporte.frecuencia}
        </span>
        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full capitalize">
          {reporte.categoria}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={Eye}
          onClick={() => navigate(`/reportes/${reporte.id}`)}
          fullWidth
        >
          Ver Reporte
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={Download}
          onClick={() => onGenerar(reporte)}
        >
          Exportar
        </Button>
      </div>
    </div>
  );
};

// ============================================
// REPORTE RECIENTE ROW
// ============================================
const ReporteRecienteRow = ({ reporte }) => {
  const tipoConfig = {
    despachos: { icon: Truck, color: 'text-blue-500' },
    inventario: { icon: Package, color: 'text-emerald-500' },
    clientes: { icon: Users, color: 'text-violet-500' },
    kpis: { icon: BarChart3, color: 'text-rose-500' },
  };

  const config = tipoConfig[reporte.tipo] || { icon: FileText, color: 'text-slate-500' };
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer">
      <div className={`w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{reporte.titulo}</p>
        <p className="text-xs text-slate-400">{reporte.fecha}</p>
      </div>
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${reporte.formato === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
        {reporte.formato}
      </span>
      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ReportesList = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [reportes, setReportes] = useState(REPORTES_DISPONIBLES);
  const [showFavoritosOnly, setShowFavoritosOnly] = useState(false);

  // Filtrar reportes
  const filteredReportes = reportes.filter((r) => {
    if (searchTerm && !r.titulo.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (categoria !== 'todos' && r.categoria !== categoria) {
      return false;
    }
    if (showFavoritosOnly && !r.favorito) {
      return false;
    }
    return true;
  });

  // Handlers
  const handleToggleFavorito = (id) => {
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, favorito: !r.favorito } : r))
    );
  };

  const handleGenerar = (reporte) => {
    // Simular descarga
    console.log('Generando reporte:', reporte.titulo);
  };

  const handleVer = (reporte) => {
    navigate(`/reportes/${reporte.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">


      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Reportes</h1>
            <p className="text-slate-500 mt-1">
              Genera y consulta reportes de gestión
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" icon={Calendar}>
              Programar
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => navigate('/reportes/crear')}>
              Nuevo Reporte
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{reportes.length}</p>
                <p className="text-sm text-slate-500">Reportes disponibles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {reportes.filter(r => r.favorito).length}
                </p>
                <p className="text-sm text-slate-500">Favoritos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">24</p>
                <p className="text-sm text-slate-500">Generados este mes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">3</p>
                <p className="text-sm text-slate-500">Programados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reportes List */}
          <div className="lg:col-span-2">
            {/* Search & Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar
                    placeholder="Buscar reportes..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onClear={() => setSearchTerm('')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowFavoritosOnly(!showFavoritosOnly)}
                    className={`p-2.5 rounded-xl transition-colors ${showFavoritosOnly
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    <Star className={`w-5 h-5 ${showFavoritosOnly ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Reportes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReportes.map((reporte) => (
                <ReporteCard
                  key={reporte.id}
                  reporte={reporte}
                  onGenerar={handleGenerar}
                  onVer={handleVer}
                  onToggleFavorito={handleToggleFavorito}
                />
              ))}
            </div>

            {filteredReportes.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-1">No se encontraron reportes</h3>
                <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Reportes Recientes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Reportes Recientes</h3>
                <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                  Ver todos
                </button>
              </div>
              <div>
                {REPORTES_RECIENTES.map((reporte) => (
                  <ReporteRecienteRow key={reporte.id} reporte={reporte} />
                ))}
              </div>
            </div>

            {/* Reportes Programados */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Programados</h3>
                <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                  Gestionar
                </button>
              </div>
              <div className="space-y-3">
                {REPORTES_PROGRAMADOS.map((reporte) => (
                  <div key={reporte.id} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-800">{reporte.titulo}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {reporte.proxima}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {reporte.destinatarios} destinatarios
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-2">Reporte Rápido</h3>
              <p className="text-sm text-orange-100 mb-4">
                Genera un reporte personalizado con los datos que necesitas
              </p>
              <Button
                variant="secondary"
                icon={Plus}
                onClick={() => navigate('/reportes/crear')}
                fullWidth
              >
                Crear Reporte
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>
    </div>
  );
};

export default ReportesList;