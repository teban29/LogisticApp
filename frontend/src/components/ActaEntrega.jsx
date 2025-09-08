import { RiTruckLine, RiUserLine, RiMapPinLine, RiBarcodeLine } from "react-icons/ri";

const ActaEntrega = ({ envio, onClose }) => {
  // Función helper para extraer información
  const getProductoNombre = (item) => {
    if (!item) return "Producto";
    if (item.producto_nombre) return item.producto_nombre;
    if (item.unidad && item.unidad.carga_item && item.unidad.carga_item.producto) {
      return item.unidad.carga_item.producto.nombre;
    }
    if (item.unidad && item.unidad.producto_nombre) return item.unidad.producto_nombre;
    if (item.nombre) return item.nombre;
    return "Producto";
  };

  const getRemision = (item) => {
    if (item.unidad && item.unidad.carga_item && item.unidad.carga_item.carga) {
      return item.unidad.carga_item.carga.remision || "N/A";
    }
    return "N/A";
  };

  const getProveedor = (item) => {
    if (item.unidad && item.unidad.carga_item && item.unidad.carga_item.carga && item.unidad.carga_item.carga.proveedor) {
      return item.unidad.carga_item.carga.proveedor.nombre || "N/A";
    }
    return "N/A";
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
        <div className="flex justify-center mb-4">
          {/* Logo de la empresa - reemplaza con tu logo */}
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            LOGO
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ACTA DE ENTREGA</h1>
        <p className="text-lg text-gray-600">Comprobante de entrega de mercancía</p>
        <p className="text-sm text-gray-500 mt-2">Fecha: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Información del envío */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Envío</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <RiBarcodeLine className="text-blue-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Número de Guía</p>
              <p className="font-semibold text-gray-900">{envio.numero_guia}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <RiUserLine className="text-blue-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-semibold text-gray-900">{envio.cliente_nombre}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <RiMapPinLine className="text-blue-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Origen</p>
              <p className="font-semibold text-gray-900">{envio.origen}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <RiTruckLine className="text-blue-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Conductor</p>
              <p className="font-semibold text-gray-900">{envio.conductor}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de items */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalle de Productos Entregados</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                Nombre del Producto
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                Remisión de Carga
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                Proveedor
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                Código de Barras
              </th>
            </tr>
          </thead>
          <tbody>
            {envio.items && envio.items.length > 0 ? (
              envio.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-3 text-gray-800">
                    {getProductoNombre(item)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-800">
                    {getRemision(item)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-800">
                    {getProveedor(item)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-mono text-sm text-gray-600">
                    {item.unidad?.codigo_barra || item.unidad_codigo || 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                  No hay items en este envío
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sección de firmas */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Confirmación de Recepción</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Firmante 1 - Quien entrega */}
          <div className="text-center">
            <div className="border-2 border-dashed border-gray-400 h-32 mb-4 flex items-center justify-center">
              <span className="text-gray-500">Firma del conductor</span>
            </div>
            <div className="mb-2">
              <p className="font-semibold text-gray-900">Nombre: {envio.conductor}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cédula: ___________________</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Persona que entrega</p>
          </div>

          {/* Firmante 2 - Quien recibe */}
          <div className="text-center">
            <div className="border-2 border-dashed border-gray-400 h-32 mb-4 flex items-center justify-center">
              <span className="text-gray-500">Firma del receptor</span>
            </div>
            <div className="mb-2">
              <p className="font-semibold text-gray-900">Nombre: ___________________</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cédula: ___________________</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Persona que recibe</p>
          </div>
        </div>
      </div>

      {/* Pie de página */}
      <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center">
        <p className="text-sm text-gray-600">
          Este documento sirve como comprobante de entrega de la mercancía descrita anteriormente.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Fecha y hora de impresión: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Botón de cerrar (solo para preview) */}
      {onClose && (
        <div className="mt-6 text-center print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cerrar Vista Previa
          </button>
        </div>
      )}
    </div>
  );
};

export default ActaEntrega;