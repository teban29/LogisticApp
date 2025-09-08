import Modal from "./Modal";
import {
  RiTruckLine,
  RiUserLine,
  RiMapPinLine,
  RiBarcodeLine,
  RiMoneyDollarCircleLine,
  RiCalendarLine,
  RiCloseLine,
  RiCheckboxCircleLine,
  RiTimeLine,
} from "react-icons/ri";

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
    icon: RiCloseLine,
  },
};

const getCodigoBarra = (item) => {
  if (!item) return "Código no disponible";

  // Diferentes formas en que puede venir el código
  if (item.unidad_codigo) return item.unidad_codigo;
  if (item.codigo_barra) return item.codigo_barra;
  if (
    item.unidad &&
    typeof item.unidad === "object" &&
    item.unidad.codigo_barra
  ) {
    return item.unidad.codigo_barra;
  }
  if (item.unidad && typeof item.unidad === "string") {
    return item.unidad; // Por si solo viene el ID de la unidad
  }
  return "Código no disponible";
};

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

export default function EnvioDetailModal({ open, onClose, envio }) {
  if (!envio) return null;

  const EstadoIcon = ESTADOS_ENVIO[envio.estado]?.icon || RiTimeLine;
  const estadoConfig = ESTADOS_ENVIO[envio.estado] || ESTADOS_ENVIO.borrador;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Detalles del Envío - ${envio.numero_guia}`}
      size="lg">
      <div className="space-y-6">
        {/* Información General */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4">
            Información General
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RiUserLine className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{envio.cliente_nombre}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RiUserLine className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conductor</p>
                <p className="font-medium">{envio.conductor}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RiTruckLine className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Placa Vehículo</p>
                <p className="font-medium">{envio.placa_vehiculo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RiMapPinLine className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Origen</p>
                <p className="font-medium">{envio.origen}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RiMoneyDollarCircleLine className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="font-medium">${envio.valor_total}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <EstadoIcon className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoConfig.color}`}>
                  <EstadoIcon className="text-xs" />
                  {estadoConfig.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RiCalendarLine className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha Creación</p>
                <p className="font-medium">
                  {new Date(envio.created_at).toLocaleDateString()}{" "}
                  {new Date(envio.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {envio.updated_at !== envio.created_at && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <RiCalendarLine className="text-blue-600 text-lg" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Actualización</p>
                  <p className="font-medium">
                    {new Date(envio.updated_at).toLocaleDateString()}{" "}
                    {new Date(envio.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items del Envío */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4">Items del Envío</h3>

          {envio.items && envio.items.length > 0 ? (
            <div className="space-y-3">
              {envio.items.map((item, index) => {
                const codigoBarra = getCodigoBarra(item);
                const productoNombre = getProductoNombre(item);

                return (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <RiBarcodeLine className="text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {productoNombre}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {codigoBarra}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-sm">
                        ${item.valor_unitario || 0}
                      </p>
                      <p className="text-xs text-gray-500">Valor unitario</p>
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                <span className="font-medium text-blue-900">
                  Total del envío:
                </span>
                <span className="text-lg font-bold text-blue-900">
                  ${envio.valor_total}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <RiBarcodeLine className="text-3xl mx-auto mb-2 text-gray-400" />
              <p>No hay items en este envío</p>
            </div>
          )}
        </div>

        {/* Botón de Cerrar */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
