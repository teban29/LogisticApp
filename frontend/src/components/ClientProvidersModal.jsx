// src/components/ClientProvidersModal.jsx
import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';

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

  return (
    <Modal open={open} onClose={onClose} title={`${titlePrefix ? titlePrefix + ' — ' : ''}Proveedores asignados`}>
      <div className="space-y-3">
        <div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, NIT o ID"
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div className="max-h-64 overflow-auto border rounded-lg bg-white">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No se encontraron proveedores.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-xs text-gray-500">{p.nit} {p.ciudad ? `• ${p.ciudad}` : ''}</div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="text-gray-500">ID {p.id}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-3 py-2 border rounded-xl">Cerrar</button>
        </div>
      </div>
    </Modal>
  );
}
