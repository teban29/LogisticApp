import { useEffect, useState } from 'react';
import Modal from './Modal';
import Select from 'react-select';
import { listProviders } from '../api/partners';
import {
  RiUserLine,
  RiIdCardLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiBuildingLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiSaveLine,
  RiLoader4Line
} from 'react-icons/ri';

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
      setError('Error al guardar el cliente. Por favor, verifique los datos e intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // selected options for react-select
  const selectedProviders = providerOptions.filter(opt => form.proveedores.includes(opt.value));

  // Estilos personalizados para react-select
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '44px',
      border: '1px solid #D1D5DB',
      borderRadius: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
      '&:hover': {
        borderColor: state.isFocused ? '#3B82F6' : '#9CA3AF'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      border: '1px solid #E5E7EB',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#EFF6FF',
      borderRadius: '0.375rem'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1E40AF',
      fontWeight: '500'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#93C5FD',
      borderRadius: '0 0.375rem 0.375rem 0',
      '&:hover': {
        backgroundColor: '#DBEAFE',
        color: '#EF4444'
      }
    })
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title={isEdit ? 'Editar cliente' : 'Crear cliente'}
      size="lg"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <RiCloseLine className="text-lg mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiUserLine className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                name="nombre" 
                value={form.nombre} 
                onChange={handleChange} 
                required 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Ingrese el nombre del cliente"
              />
            </div>
          </div>

          {/* NIT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIT <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiIdCardLine className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                name="nit" 
                value={form.nit} 
                onChange={handleChange} 
                required 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Número de identificación tributaria"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiMailLine className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                type="email" 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiPhoneLine className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                name="telefono" 
                value={form.telefono} 
                onChange={handleChange} 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Número de contacto"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiMapPinLine className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                name="direccion" 
                value={form.direccion} 
                onChange={handleChange} 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Dirección completa"
              />
            </div>
          </div>

          {/* Ciudad */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiBuildingLine className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                name="ciudad" 
                value={form.ciudad} 
                onChange={handleChange} 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Ciudad del cliente"
              />
            </div>
          </div>

          {/* Proveedores asignados */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Proveedores asignados</label>
            <Select
              isMulti
              isLoading={loadingProviders}
              options={providerOptions}
              value={selectedProviders}
              onChange={handleProvidersChange}
              placeholder="Seleccione los proveedores..."
              noOptionsMessage={() => "No hay proveedores disponibles"}
              loadingMessage={() => "Cargando proveedores..."}
              styles={customSelectStyles}
              classNamePrefix="react-select"
            />
            <p className="text-xs text-gray-500 mt-1">
              Seleccione los proveedores asociados a este cliente
            </p>
          </div>

          {/* Estado activo */}
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  name="is_active" 
                  checked={form.is_active} 
                  onChange={handleChange} 
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.is_active ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {form.is_active ? (
                  <RiCheckboxCircleLine className="text-green-600" />
                ) : (
                  <RiCloseLine className="text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-700">Cliente activo</span>
              </div>
            </label>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <RiLoader4Line className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <RiSaveLine />
                {isEdit ? 'Guardar cambios' : 'Crear cliente'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}