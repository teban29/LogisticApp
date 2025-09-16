import React from "react";

const TopLists = ({ data, loading = false, user }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6 animate-pulse">
        <div>
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
          ))}
        </div>
        <div>
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  // Verificar si hay datos reales, no solo array vacío
  const hasClientesCargas = data.top_clientes_cargas && data.top_clientes_cargas.length > 0;
  const hasClientesEnvios = data.top_clientes_envios && data.top_clientes_envios.length > 0;
  const hasProveedores = data.top_proveedores && data.top_proveedores.length > 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      {/* Top clientes por cargas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📦 Top Clientes - Cargas
        </h3>
        {hasClientesCargas ? (
          <div className="space-y-2">
            {data.top_clientes_cargas.map((cliente, index) => (
              <div
                key={cliente.cliente_id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      {cliente.cliente_nombre || "Cliente sin nombre"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cliente.total_cargas || 0} cargas
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-blue-600">
                  {cliente.total_items || 0} unidades
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-gray-500">No hay datos de cargas</p>
            <p className="text-sm text-gray-400 mt-1">
              Los clientes aparecerán aquí cuando tengan cargas
            </p>
          </div>
        )}
      </div>

      {/* Top clientes por envíos */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          🚚 Top Clientes - Envíos
        </h3>
        {hasClientesEnvios ? (
          <div className="space-y-2">
            {data.top_clientes_envios.map((cliente, index) => (
              <div
                key={cliente.cliente_id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      {cliente.cliente_nombre || "Cliente sin nombre"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cliente.total_envios || 0} envíos
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-green-600">
                  ${(cliente.valor_total || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">🚚</div>
            <p className="text-gray-500">No hay datos de envíos</p>
            <p className="text-sm text-gray-400 mt-1">
              Los clientes aparecerán aquí cuando tengan envíos
            </p>
          </div>
        )}
      </div>

      {/* Top proveedores */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          🏭 Top Proveedores
        </h3>
        {hasProveedores ? (
          <div className="space-y-2">
            {data.top_proveedores.map((proveedor, index) => (
              <div
                key={proveedor.proveedor_id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      {proveedor.proveedor_nombre || "Proveedor sin nombre"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {proveedor.total_cargas || 0} cargas
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-orange-600">
                  {proveedor.total_items || 0} unidades
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">🏭</div>
            <p className="text-gray-500">No hay datos de proveedores</p>
            <p className="text-sm text-gray-400 mt-1">
              {user && user.rol === "cliente"
                ? "Los proveedores aparecerán aquí cuando tengan cargas asociadas a tu cliente"
                : "Los proveedores aparecerán aquí cuando tengan cargas en el sistema"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopLists;