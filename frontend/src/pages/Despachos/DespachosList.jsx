/**
 * ISTHO CRM - DespachosList Page
 * Listado de despachos con búsqueda, filtros y paginación
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Truck,
  MapPin,
  Calendar,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import {
  Button,
  SearchBar,
  FilterDropdown,
  StatusChip,
  Pagination,
  ConfirmDialog,
  KpiCard,
} from '../../components/common';

// Local Components
import DespachoForm from './components/DespachoForm';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_DESPACHOS = [
  { id: 'DSP-001', clienteId: 'CLI-001', cliente: 'Lácteos Betania S.A.S', destino: 'Medellín, Antioquia', direccion: 'Cra 45 #78-90, Zona Industrial', vehiculo: 'ABC-123', conductor: 'Juan Pérez', fechaProgramada: '2026-01-08', horaEstimada: '14:00', estado: 'en_transito', prioridad: 'alta', productos: 3, unidades: 450, fechaSalida: '2026-01-08 08:30' },
  { id: 'DSP-002', clienteId: 'CLI-002', cliente: 'Almacenes Éxito S.A', destino: 'Bogotá, Cundinamarca', direccion: 'Av 68 #22-15, Centro de Distribución', vehiculo: 'DEF-456', conductor: 'Carlos García', fechaProgramada: '2026-01-08', horaEstimada: '16:00', estado: 'completado', prioridad: 'normal', productos: 5, unidades: 1200, fechaSalida: '2026-01-08 06:00', fechaEntrega: '2026-01-08 15:45' },
  { id: 'DSP-003', clienteId: 'CLI-003', cliente: 'Eternit Colombia S.A', destino: 'Cali, Valle del Cauca', direccion: 'Zona Franca del Pacífico, Bod 15', vehiculo: 'JKL-012', conductor: 'Pedro Martínez', fechaProgramada: '2026-01-09', horaEstimada: '10:00', estado: 'programado', prioridad: 'normal', productos: 2, unidades: 850 },
  { id: 'DSP-004', clienteId: 'CLI-004', cliente: 'Prodenvases S.A.S', destino: 'Barranquilla, Atlántico', direccion: 'Vía 40 #85-55, Zona Industrial', vehiculo: 'DEF-456', conductor: 'Carlos García', fechaProgramada: '2026-01-08', horaEstimada: '18:00', estado: 'en_transito', prioridad: 'urgente', productos: 4, unidades: 2000, fechaSalida: '2026-01-08 10:15' },
  { id: 'DSP-005', clienteId: 'CLI-005', cliente: 'Klar Colombia S.A.S', destino: 'Cartagena, Bolívar', direccion: 'Mamonal Km 5, Parque Industrial', vehiculo: 'GHI-789', conductor: 'María López', fechaProgramada: '2026-01-07', horaEstimada: '12:00', estado: 'completado', prioridad: 'alta', productos: 1, unidades: 320, fechaSalida: '2026-01-07 05:00', fechaEntrega: '2026-01-07 11:30' },
  { id: 'DSP-006', clienteId: 'CLI-001', cliente: 'Lácteos Betania S.A.S', destino: 'Pereira, Risaralda', direccion: 'Zona Industrial La Popa, Bod 8', vehiculo: null, conductor: null, fechaProgramada: '2026-01-10', horaEstimada: '09:00', estado: 'programado', prioridad: 'normal', productos: 3, unidades: 680 },
  { id: 'DSP-007', clienteId: 'CLI-002', cliente: 'Almacenes Éxito S.A', destino: 'Bucaramanga, Santander', direccion: 'Av Quebrada Seca #35-20', vehiculo: 'ABC-123', conductor: 'Juan Pérez', fechaProgramada: '2026-01-08', horaEstimada: '15:00', estado: 'en_preparacion', prioridad: 'normal', productos: 6, unidades: 1500 },
  { id: 'DSP-008', clienteId: 'CLI-003', cliente: 'Eternit Colombia S.A', destino: 'Medellín, Antioquia', direccion: 'Cra 52 #10-30, Guayabal', vehiculo: null, conductor: null, fechaProgramada: '2026-01-06', horaEstimada: '14:00', estado: 'cancelado', prioridad: 'baja', productos: 1, unidades: 100, motivoCancelacion: 'Solicitud del cliente' },
];

// Opciones de filtros
const FILTER_OPTIONS = {
  estado: [
    { value: 'programado', label: 'Programado' },
    { value: 'en_preparacion', label: 'En Preparación' },
    { value: 'en_transito', label: 'En Tránsito' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
  ],
  prioridad: [
    { value: 'urgente', label: 'Urgente' },
    { value: 'alta', label: 'Alta' },
    { value: 'normal', label: 'Normal' },
    { value: 'baja', label: 'Baja' },
  ],
  fecha: [
    { value: 'hoy', label: 'Hoy' },
    { value: 'manana', label: 'Mañana' },
    { value: 'semana', label: 'Esta Semana' },
    { value: 'mes', label: 'Este Mes' },
  ],
};

// ============================================
// PRIORITY BADGE
// ============================================
const PriorityBadge = ({ prioridad }) => {
  const config = {
    urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
    alta: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
    normal: { color: 'bg-slate-100 text-slate-700', label: 'Normal' },
    baja: { color: 'bg-slate-100 text-slate-500', label: 'Baja' },
  };

  const { color, label } = config[prioridad] || config.normal;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>
      {label}
    </span>
  );
};

// ============================================
// ROW ACTIONS
// ============================================
const RowActions = ({ despacho, onView, onEdit, onDelete, onCancel }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <button
              onClick={() => { onView(despacho); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              Ver detalle
            </button>
            {despacho.estado !== 'completado' && despacho.estado !== 'cancelado' && (
              <>
                <button
                  onClick={() => { onEdit(despacho); setIsOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { onCancel(despacho); setIsOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </button>
              </>
            )}
            {despacho.estado === 'cancelado' && (
              <button
                onClick={() => { onDelete(despacho); setIsOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// DESPACHO CARD (Vista alternativa)
// ============================================
const DespachoCard = ({ despacho, onView, onEdit }) => {
  const estadoIcon = {
    programado: Calendar,
    en_preparacion: Package,
    en_transito: Truck,
    completado: CheckCircle,
    cancelado: XCircle,
  };

  const Icon = estadoIcon[despacho.estado] || Truck;

  return (
    <div 
      onClick={() => onView(despacho)}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{despacho.id}</p>
            <p className="text-sm text-slate-500">{despacho.cliente}</p>
          </div>
        </div>
        <PriorityBadge prioridad={despacho.prioridad} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          {despacho.destino}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          {despacho.fechaProgramada} • {despacho.horaEstimada}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="w-4 h-4 text-slate-400" />
          {despacho.productos} productos • {despacho.unidades.toLocaleString()} unidades
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <StatusChip status={despacho.estado} />
        {despacho.vehiculo && (
          <span className="text-xs text-slate-500">
            🚚 {despacho.vehiculo}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DespachosList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Estados
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  
  // Modals
  const [formModal, setFormModal] = useState({ isOpen: false, despacho: null });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, despacho: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, despacho: null });
  const [formLoading, setFormLoading] = useState(false);

  const itemsPerPage = 8;

  // Aplicar filtro de URL
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'programados') {
      setFilters({ estado: 'programado' });
    } else if (filterParam === 'completados') {
      setFilters({ estado: 'completado' });
    }
  }, [searchParams]);

  // Cargar datos
  useEffect(() => {
    const fetchDespachos = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setDespachos(MOCK_DESPACHOS);
      setLoading(false);
    };
    fetchDespachos();
  }, []);

  // KPIs calculados
  const kpis = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    const enTransito = despachos.filter(d => d.estado === 'en_transito').length;
    const programadosHoy = despachos.filter(d => d.estado === 'programado' && d.fechaProgramada === hoy).length;
    const completadosHoy = despachos.filter(d => d.estado === 'completado' && d.fechaEntrega?.startsWith(hoy)).length;
    const pendientes = despachos.filter(d => ['programado', 'en_preparacion'].includes(d.estado)).length;
    
    return { enTransito, programadosHoy, completadosHoy, pendientes };
  }, [despachos]);

  // Filtrar despachos
  const filteredDespachos = useMemo(() => {
    return despachos.filter((despacho) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchSearch = 
          despacho.id.toLowerCase().includes(search) ||
          despacho.cliente.toLowerCase().includes(search) ||
          despacho.destino.toLowerCase().includes(search);
        if (!matchSearch) return false;
      }

      if (filters.estado && despacho.estado !== filters.estado) return false;
      if (filters.prioridad && despacho.prioridad !== filters.prioridad) return false;

      return true;
    });
  }, [despachos, searchTerm, filters]);

  // Paginar
  const paginatedDespachos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDespachos.slice(start, start + itemsPerPage);
  }, [filteredDespachos, currentPage]);

  const totalPages = Math.ceil(filteredDespachos.length / itemsPerPage);

  // Handlers
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setFormModal({ isOpen: true, despacho: null });
  };

  const handleEdit = (despacho) => {
    setFormModal({ isOpen: true, despacho });
  };

  const handleView = (despacho) => {
    navigate(`/despachos/${despacho.id}`);
  };

  const handleCancel = (despacho) => {
    setCancelModal({ isOpen: true, despacho });
  };

  const handleDelete = (despacho) => {
    setDeleteModal({ isOpen: true, despacho });
  };

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    if (formModal.despacho) {
      setDespachos((prev) =>
        prev.map((d) => (d.id === formModal.despacho.id ? { ...d, ...data } : d))
      );
    } else {
      const newDespacho = {
        ...data,
        id: `DSP-${String(despachos.length + 1).padStart(3, '0')}`,
        cliente: data.clienteNombre || 'Cliente',
        productos: data.productos?.length || 0,
        unidades: data.productos?.reduce((sum, p) => sum + p.cantidad, 0) || 0,
      };
      setDespachos((prev) => [newDespacho, ...prev]);
    }

    setFormLoading(false);
    setFormModal({ isOpen: false, despacho: null });
  };

  const handleConfirmCancel = async () => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setDespachos((prev) =>
      prev.map((d) => (d.id === cancelModal.despacho.id ? { ...d, estado: 'cancelado' } : d))
    );
    setFormLoading(false);
    setCancelModal({ isOpen: false, despacho: null });
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setDespachos((prev) => prev.filter((d) => d.id !== deleteModal.despacho.id));
    setFormLoading(false);
    setDeleteModal({ isOpen: false, despacho: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={kpis.pendientes} />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Despachos</h1>
            <p className="text-slate-500 mt-1">
              Gestiona los despachos y entregas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" icon={Download} size="md">
              Exportar
            </Button>
            <Button variant="primary" icon={Plus} onClick={handleCreate}>
              Nuevo Despacho
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="En Tránsito"
            value={kpis.enTransito}
            icon={Truck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Programados Hoy"
            value={kpis.programadosHoy}
            icon={Calendar}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <KpiCard
            title="Completados Hoy"
            value={kpis.completadosHoy}
            icon={CheckCircle}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Pendientes"
            value={kpis.pendientes}
            icon={Clock}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por ID, cliente o destino..."
                value={searchTerm}
                onChange={handleSearch}
                onClear={() => handleSearch('')}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                >
                  Tarjetas
                </button>
              </div>

              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
                {Object.keys(filters).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                    {Object.keys(filters).length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterDropdown
                  label="Estado"
                  options={FILTER_OPTIONS.estado}
                  value={filters.estado}
                  onChange={(v) => handleFilterChange('estado', v)}
                  placeholder="Todos los estados"
                />
                <FilterDropdown
                  label="Prioridad"
                  options={FILTER_OPTIONS.prioridad}
                  value={filters.prioridad}
                  onChange={(v) => handleFilterChange('prioridad', v)}
                  placeholder="Todas las prioridades"
                />
                <FilterDropdown
                  label="Fecha"
                  options={FILTER_OPTIONS.fecha}
                  value={filters.fecha}
                  onChange={(v) => handleFilterChange('fecha', v)}
                  placeholder="Todas las fechas"
                />
              </div>
              
              {Object.keys(filters).length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            {filteredDespachos.length} despacho{filteredDespachos.length !== 1 && 's'} encontrado{filteredDespachos.length !== 1 && 's'}
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : paginatedDespachos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">
              No se encontraron despachos
            </h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primer despacho'}
            </p>
            {!searchTerm && Object.keys(filters).length === 0 && (
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nuevo Despacho
              </Button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          // Cards View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedDespachos.map((despacho) => (
              <DespachoCard
                key={despacho.id}
                despacho={despacho}
                onView={handleView}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Despacho
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cliente / Destino
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fecha / Hora
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDespachos.map((despacho) => (
                    <tr
                      key={despacho.id}
                      className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p 
                              className="text-sm font-semibold text-slate-800 hover:text-orange-600 cursor-pointer"
                              onClick={() => handleView(despacho)}
                            >
                              {despacho.id}
                            </p>
                            {despacho.vehiculo && (
                              <p className="text-xs text-slate-500">🚚 {despacho.vehiculo}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{despacho.cliente}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {despacho.destino}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div>
                          <p className="text-sm text-slate-800">{despacho.fechaProgramada}</p>
                          <p className="text-xs text-slate-500">{despacho.horaEstimada}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{despacho.productos}</p>
                          <p className="text-xs text-slate-500">{despacho.unidades.toLocaleString()} uds</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <PriorityBadge prioridad={despacho.prioridad} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusChip status={despacho.estado} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <RowActions
                          despacho={despacho}
                          onView={handleView}
                          onEdit={handleEdit}
                          onCancel={handleCancel}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredDespachos.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}

        {/* Pagination for Cards */}
        {viewMode === 'cards' && totalPages > 1 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDespachos.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* Modals */}
      <DespachoForm
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, despacho: null })}
        onSubmit={handleFormSubmit}
        despacho={formModal.despacho}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, despacho: null })}
        onConfirm={handleConfirmCancel}
        title="Cancelar Despacho"
        message={`¿Estás seguro de cancelar el despacho "${cancelModal.despacho?.id}"? Esta acción notificará al cliente.`}
        confirmText="Cancelar Despacho"
        type="warning"
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, despacho: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Despacho"
        message={`¿Eliminar permanentemente "${deleteModal.despacho?.id}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default DespachosList;