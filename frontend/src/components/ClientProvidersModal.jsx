import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import {
  RiSearchLine,
  RiCloseLine,
  RiBuildingLine,
  RiIdCardLine,
  RiMapPinLine,
  RiNumber1,
  RiCheckboxCircleLine
} from 'react-icons/ri';

export default function ClientProvidersModal({ open, onClose, providers = [], titlePrefix = '' }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return providers;
    const q = query.trim().toLowerCase();
    return providers.filter((p) => {
      const nombre = (p.nombre || '').toLowerCase();
      const nit = (p.nit || '').toLowerCase();
      return nombre.includes(q) || nit.includes(q) || `${p.id}` === q;
    });
  }, [providers, query]);

  const hasProviders = providers.length > 0;

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title={`${titlePrefix ? titlePrefix + ' — ' : ''}Proveedores asignados`}
      size="md"
    >
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <RiSearchLine className="h-4 w-4 text-gray-400" />
          </div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, NIT o ID"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RiCloseLine className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {filtered.length} de {providers.length} proveedores
          </span>
          {query && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Filtrado
            </span>
          )}
        </div>

        {/* Lista de proveedores */}
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          {!hasProviders ? (
            <div className="p-6 text-center">
              <RiBuildingLine className="mx-auto text-3xl text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">Sin proveedores asignados</p>
              <p className="text-sm text-gray-500 mt-1">
                Este cliente no tiene proveedores asociados
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <RiSearchLine className="mx-auto text-3xl text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">No se encontraron proveedores</p>
              <p className="text-sm text-gray-500 mt-1">
                Intente con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {filtered.map((p) => (
                <li key={p.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <RiBuildingLine className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 truncate">{p.nombre}</h3>
                        {p.is_active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <RiCheckboxCircleLine className="h-3 w-3" />
                            Activo
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <RiIdCardLine className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-mono">{p.nit || 'Sin NIT'}</span>
                        </div>
                        
                        {p.ciudad && (
                          <div className="flex items-center gap-2">
                            <RiMapPinLine className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span>{p.ciudad}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full">
                        <RiNumber1 className="h-3.5 w-3.5 text-gray-600" />
                        <span className="text-xs font-medium text-gray-700">ID {p.id}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Botón de cerrar */}
        <div className="flex justify-end pt-2">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}