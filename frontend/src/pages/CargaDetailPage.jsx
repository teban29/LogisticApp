import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCarga,
  descargarEtiquetasDeCarga,
  descargarEtiquetasPorItem,
  descargarBlobComoPDF,
} from "../api/cargas";
import {
  RiArrowLeftLine,
  RiPrinterLine,
  RiDownloadLine,
  RiFileTextLine,
  RiUserLine,
  RiTruckLine,
  RiCalendarLine,
  RiBox3Line,
  RiNumbersLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiFilePdfLine,
  RiImageLine,
  RiFileLine,
  RiExternalLinkLine,
  RiCheckboxCircleLine
} from "react-icons/ri";

export default function CargaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCliente = user?.rol === "cliente";
  const puedeImprimir =
    user?.rol === "admin" ||
    user?.rol === "operador" ||
    (user?.rol === "cliente" && user?.cliente === carga?.cliente?.id);
  const [carga, setCarga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [printingAll, setPrintingAll] = useState(false);
  const [printingItems, setPrintingItems] = useState({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getCarga(id);
        setCarga(data);
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar la información de la carga");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleImprimirTodas = async () => {
    setPrintingAll(true);
    setError("");
    try {
      const blob = await descargarEtiquetasDeCarga(id);
      descargarBlobComoPDF(blob, `etiquetas_carga_${id}_completa.pdf`);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 403) {
        setError("No tiene permisos para imprimir etiquetas de esta carga");
      } else {
        setError("Error generando todas las etiquetas");
      }
    } finally {
      setPrintingAll(false);
    }
  };

  const handleImprimirItem = async (itemId, itemName) => {
    setPrintingItems((prev) => ({ ...prev, [itemId]: true }));
    setError("");
    try {
      const blob = await descargarEtiquetasPorItem(id, itemId);
      descargarBlobComoPDF(blob, `etiquetas_carga_${id}_${itemName}.pdf`);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 403) {
        setError("No tiene permisos para imprimir etiquetas de este ítem");
      } else {
        setError("Error generando etiquetas del ítem");
      }
    } finally {
      setPrintingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const getFilePreview = (url) => {
    if (!url) return null;

    const lower = url.toLowerCase();
    if (lower.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
      return (
        <div className="mt-3 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <RiImageLine className="text-blue-600" />
            <span className="font-medium">Vista previa de factura</span>
          </div>
          <img
            src={url}
            alt="Factura"
            className="max-h-64 w-auto object-contain border rounded-md mx-auto"
          />
          <div className="mt-3 flex justify-center">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
              <RiExternalLinkLine />
              Abrir en nueva pestaña
            </a>
          </div>
        </div>
      );
    }

    if (lower.endsWith(".pdf")) {
      return (
        <div className="mt-3 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <RiFilePdfLine className="text-red-600 text-2xl" />
            <div>
              <div className="font-medium">Documento PDF</div>
              <div className="text-sm text-gray-600">
                {url.split("/").pop()}
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
              <RiExternalLinkLine />
              Abrir PDF
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          <RiFileLine className="text-gray-600 text-2xl" />
          <div>
            <div className="font-medium">Archivo adjunto</div>
            <div className="text-sm text-gray-600">{url.split("/").pop()}</div>
          </div>
        </div>
        <div className="flex justify-center mt-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
            <RiExternalLinkLine />
            Abrir archivo
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de la carga...</p>
        </div>
      </div>
    );
  }

  if (error || !carga) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RiErrorWarningLine className="text-4xl text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "No se encontró la carga solicitada"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto">
            <RiArrowLeftLine />
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors">
            <RiArrowLeftLine />
            <span>Volver atrás</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Carga #{carga.id}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Detalles completos de la carga
          </p>
        </div>
        {puedeImprimir && (
          <div className="flex gap-3">
            <button
              onClick={handleImprimirTodas}
              disabled={printingAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {printingAll ? (
                <RiLoader4Line className="animate-spin" />
              ) : (
                <RiPrinterLine />
              )}
              {printingAll ? "Generando..." : "Imprimir todas"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <RiErrorWarningLine />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <RiCheckboxCircleLine />
            {success}
          </div>
        </div>
      )}

      {/* Información de la carga */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RiFileTextLine />
            Información de la carga
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RiUserLine className="text-blue-600" />
                <span className="font-medium">Cliente</span>
              </div>
              <p className="text-gray-900">
                {carga.cliente_nombre || carga.cliente}
              </p>
            </div>

            {/* Proveedor */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RiTruckLine className="text-green-600" />
                <span className="font-medium">Proveedor</span>
              </div>
              <p className="text-gray-900">
                {carga.proveedor_nombre || carga.proveedor}
              </p>
            </div>

            {/* Remisión */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RiFileTextLine className="text-purple-600" />
                <span className="font-medium">Remisión</span>
              </div>
              <p className="text-gray-900 font-mono">{carga.remision}</p>
            </div>

            {/* Fecha */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RiCalendarLine className="text-orange-600" />
                <span className="font-medium">Fecha de creación</span>
              </div>
              <p className="text-gray-900">
                {new Date(carga.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Factura */}
          {carga.factura && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <RiFileTextLine />
                Factura adjunta
              </h3>
              {getFilePreview(carga.factura)}
            </div>
          )}

          {/* Observaciones */}
          {carga.observaciones && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <RiFileTextLine />
                Forma de pago
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{carga.observaciones}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items de la carga */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <RiBox3Line />
              Items de la carga
              <span className="text-sm text-gray-500 font-normal">
                ({(carga.items || []).length} items)
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {(carga.items || []).map((it) => (
              <div
                key={it.id}
                className="p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Información del producto */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-lg mb-2">
                      {it.producto.nombre}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <RiFileTextLine className="text-gray-400" />
                        <span className="font-mono">{it.producto.sku}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiNumbersLine className="text-gray-400" />
                        <span>Cantidad: {it.cantidad}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiBox3Line className="text-gray-400" />
                        <span>Unidades generadas: {it.unidades_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {puedeImprimir && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleImprimirItem(it.id, it.producto.nombre)
                        }
                        disabled={printingItems[it.id] || !it.unidades_count}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          !it.unidades_count
                            ? "Primero debe generar las unidades"
                            : "Imprimir etiqueta"
                        }>
                        {printingItems[it.id] ? (
                          <RiLoader4Line className="animate-spin" />
                        ) : (
                          <RiPrinterLine />
                        )}
                        {printingItems[it.id] ? "Generando..." : "Etiquetas"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(carga.items || []).length === 0 && (
            <div className="text-center py-12">
              <RiBox3Line className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay items en esta carga</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
