import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEnvios } from "../hooks/useEnvios";
import { useAuth } from "../context/AuthContext";
import {
  RiTruckLine,
  RiUserLine,
  RiMapPinLine,
  RiBarcodeLine,
  RiMoneyDollarCircleLine,
  RiCalendarLine,
  RiArrowLeftLine,
  RiEditLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiPrinterLine,
  RiFileTextLine,
} from "react-icons/ri";
import { getEnvio } from "../api/envios";

const ESTADOS_ENVIO = {
  borrador: {
    label: "Borrador",
    color: "bg-gray-100 text-gray-800",
    icon: RiTimeLine,
  },
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: RiTimeLine,
  },
  en_transito: {
    label: "En Tránsito",
    color: "bg-blue-100 text-blue-800",
    icon: RiTruckLine,
  },
  entregado: {
    label: "Entregado",
    color: "bg-green-100 text-green-800",
    icon: RiCheckboxCircleLine,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
    icon: RiCloseCircleLine,
  },
};

// Función helper para extraer código de barras
const getCodigoBarra = (item) => {
  if (!item) return "Código no disponible";
  if (item.unidad_codigo) return item.unidad_codigo;
  if (item.codigo_barra) return item.codigo_barra;
  if (
    item.unidad &&
    typeof item.unidad === "object" &&
    item.unidad.codigo_barra
  ) {
    return item.unidad.codigo_barra;
  }
  if (item.unidad && typeof item.unidad === "string") return item.unidad;
  return "Código no disponible";
};

// Función helper para extraer nombre del producto
const getProductoNombre = (item) => {
  if (!item) return "Producto";
  if (item.producto_nombre) return item.producto_nombre;
  if (
    item.unidad &&
    item.unidad.carga_item &&
    item.unidad.carga_item.producto
  ) {
    return item.unidad.carga_item.producto.nombre;
  }
  if (item.unidad && item.unidad.producto_nombre)
    return item.unidad.producto_nombre;
  if (item.nombre) return item.nombre;
  return "Producto";
};

export default function EnvioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === "admin";

  const { fetchEnvios, loading, error } = useEnvios();
  const [envio, setEnvio] = useState(null);
  const [loadingEnvio, setLoadingEnvio] = useState(true);

  useEffect(() => {
    const loadEnvioDetails = async () => {
      try {
        setLoadingEnvio(true);
        // Usa getEnvio en lugar de fetchEnvios
        const envioData = await getEnvio(parseInt(id));
        setEnvio(envioData);
      } catch (err) {
        console.error('Error loading envio details:', err);
      } finally {
        setLoadingEnvio(false);
      }
    };
  
    if (id) {
      loadEnvioDetails();
    }
  }, [id, getEnvio]);

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    navigate(`/envios/editar/${id}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loadingEnvio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RiLoader4Line className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalles del envío...</p>
        </div>
      </div>
    );
  }

  if (error || !envio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RiErrorWarningLine className="text-4xl text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || "Envío no encontrado"}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  const EstadoIcon = ESTADOS_ENVIO[envio.estado]?.icon || RiTimeLine;
  const estadoConfig = ESTADOS_ENVIO[envio.estado] || ESTADOS_ENVIO.borrador;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volver atrás">
                <RiArrowLeftLine className="text-2xl" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Envío #{envio.numero_guia}
                </h1>
                <p className="text-gray-600 mt-1">
                  Detalles completos del envío
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <RiPrinterLine className="text-lg" />
                <span>Imprimir</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <RiEditLine className="text-lg" />
                  <span>Editar</span>
                </button>
              )}
            </div>
          </div>

          {/* Badge de estado */}
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${estadoConfig.color}`}>
              <EstadoIcon className="text-lg" />
              {estadoConfig.label}
            </span>
            <span className="text-sm text-gray-500">
              Creado el {new Date(envio.created_at).toLocaleDateString()} a las{" "}
              {new Date(envio.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal - Información del envío */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta de Información General */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <RiFileTextLine className="text-blue-600" />
                Información General
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Número de Guía
                  </label>
                  <p className="font-mono text-lg font-semibold text-gray-900">
                    {envio.numero_guia}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Cliente
                  </label>
                  <div className="flex items-center gap-2">
                    <RiUserLine className="text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900">
                      {envio.cliente_nombre}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Conductor
                  </label>
                  <div className="flex items-center gap-2">
                    <RiUserLine className="text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900">
                      {envio.conductor}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Placa del Vehículo
                  </label>
                  <div className="flex items-center gap-2">
                    <RiTruckLine className="text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900">
                      {envio.placa_vehiculo}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Origen
                  </label>
                  <div className="flex items-center gap-2">
                    <RiMapPinLine className="text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900">
                      {envio.origen}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Valor Total
                  </label>
                  <div className="flex items-center gap-2">
                    <RiMoneyDollarCircleLine className="text-gray-400" />
                    <p className="text-lg font-semibold text-green-600">
                      ${envio.valor_total}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Items del Envío */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <RiBarcodeLine className="text-blue-600" />
                Items del Envío ({envio.items?.length || 0})
              </h2>

              {envio.items && envio.items.length > 0 ? (
                <div className="space-y-4">
                  {envio.items.map((item, index) => {
                    const codigoBarra = getCodigoBarra(item);
                    const productoNombre = getProductoNombre(item);

                    return (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <RiBarcodeLine className="text-blue-600 text-xl" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-lg">
                              {productoNombre}
                            </p>
                            <p className="text-sm text-gray-500 font-mono mt-1">
                              {codigoBarra}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-lg">
                            ${item.valor_unitario || 0}
                          </p>
                          <p className="text-sm text-gray-500">
                            Valor unitario
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-lg mt-6">
                    <span className="text-lg font-semibold text-blue-900">
                      Total del envío:
                    </span>
                    <span className="text-2xl font-bold text-blue-900">
                      ${envio.valor_total}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <RiBarcodeLine className="text-4xl mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">No hay items en este envío</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna lateral - Información adicional */}
          <div className="space-y-6">
            {/* Tarjeta de Fechas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <RiCalendarLine className="text-blue-600" />
                Fechas
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Creación</p>
                  <p className="font-medium text-gray-900">
                    {new Date(envio.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(envio.created_at).toLocaleTimeString()}
                  </p>
                </div>

                {envio.updated_at !== envio.created_at && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Última actualización
                    </p>
                    <p className="font-medium text-gray-900">
                      {new Date(envio.updated_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(envio.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tarjeta de Acciones Rápidas */}
            {isAdmin && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Acciones</h3>

                <div className="space-y-3">
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <RiEditLine className="text-lg" />
                    <span>Editar Envío</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <RiPrinterLine className="text-lg" />
                    <span>Imprimir Detalles</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tarjeta de Información de Estado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Estado Actual
              </h3>

              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${estadoConfig.color}`}>
                <EstadoIcon className="text-lg" />
                <span className="font-medium">{estadoConfig.label}</span>
              </div>

              <p className="text-sm text-gray-600 mt-3">
                El envío se encuentra actualmente en estado "
                {estadoConfig.label}".
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          .bg-gray-50 { background-color: white !important; }
          button { display: none !important; }
          .shadow-sm { box-shadow: none !important; }
          .border { border-color: #e5e7eb !important; }
        }
      `}</style>
    </div>
  );
}
