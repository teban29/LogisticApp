import { useEffect, useState } from 'react';
import Modal from './Modal';
import Select from 'react-select';
import { listProviders } from '../api/partners';

const initial = {
  nombre: '',
  nit: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  is_active: true,
  proveedores: [], // array de ids
};

export default function ClientFormModal({ open, onClose, onSubmit, editing }) {
  const isEdit = Boolean(editing?.id);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [providerOptions, setProviderOptions] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    // cargar proveedores para el multiselect
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const data = await listProviders({ page: 1, search: '', ordering: 'nombre' });
        const list = data.results || data;
        setProviderOptions(list.map(p => ({ value: p.id, label: `${p.nombre} — ${p.nit}` })));
      } catch (err) {
        setProviderOptions([]);
      } finally {
        setLoadingProviders(false);
      }
    };
    if (open) fetchProviders();
  }, [open]);

  useEffect(() => {
    if (isEdit) {
      setForm({
        nombre: editing.nombre || '',
        nit: editing.nit || '',
        email: editing.email || '',
        telefono: editing.telefono || '',
        direccion: editing.direccion || '',
        ciudad: editing.ciudad || '',
        is_active: editing.is_active ?? true,
        proveedores: (editing.proveedores || []).map(p => p.id),
      });
    } else {
      setForm(initial);
    }
  }, [editing, open, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProvidersChange = (selected) => {
    setForm(f => ({ ...f, proveedores: (selected || []).map(s => s.value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      payload.proveedores_ids = payload.proveedores || [];
      delete payload.proveedores;
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError('Error al guardar el cliente. Revisa los datos.');
    } finally {
      setSaving(false);
    }
  };

  // selected options for react-select
  const selectedProviders = providerOptions.filter(opt => form.proveedores.includes(opt.value));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar cliente' : 'Crear cliente'}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">NIT</label>
            <input name="nit" value={form.nit} onChange={handleChange} required className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} className="w-full border rounded-lg p-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Ciudad</label>
            <input name="ciudad" value={form.ciudad} onChange={handleChange} className="w-full border rounded-lg p-2" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Proveedores asignados</label>
            <Select
              isMulti
              isLoading={loadingProviders}
              options={providerOptions}
              value={selectedProviders}
              onChange={handleProvidersChange}
              placeholder="Selecciona proveedores..."
            />
          </div>

          <label className="inline-flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            <span className="text-sm">Activo</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 border rounded-xl">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-black text-white">
            {saving ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear cliente')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
