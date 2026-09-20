import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  delivery_days: string;
  category: string;
  notes: string;
  product_count?: number;
}

export function ProvidersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('LUN • MIE • VIE');
  const [category, setCategory] = useState('Abarrotes y Granos');
  const [notes, setNotes] = useState('');

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers`);
      if (res.ok) {
        const data: Supplier[] = await res.json();
        setSuppliers(data);
        if (data.length > 0 && !selectedSupplier) {
          setSelectedSupplier(data[0]);
        } else if (selectedSupplier) {
          const updated = data.find(s => s.id === selectedSupplier.id);
          if (updated) setSelectedSupplier(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setDeliveryDays('LUN • MIE • VIE');
    setCategory('Abarrotes y Granos');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sup: Supplier) => {
    setIsEditing(true);
    setName(sup.name);
    setContactPerson(sup.contact_person || '');
    setPhone(sup.phone || '');
    setEmail(sup.email || '');
    setDeliveryDays(sup.delivery_days || 'LUN • VIE');
    setCategory(sup.category || 'General');
    setNotes(sup.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('El nombre del proveedor es obligatorio');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        delivery_days: deliveryDays.trim(),
        category: category.trim(),
        notes: notes.trim()
      };

      if (isEditing && selectedSupplier) {
        const res = await fetch(`${API_BASE_URL}/api/suppliers/${selectedSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('¡Proveedor actualizado con éxito!');
          setIsModalOpen(false);
          await fetchSuppliers();
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/suppliers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('¡Proveedor registrado con éxito!');
          setIsModalOpen(false);
          await fetchSuppliers();
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error al guardar proveedor');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este proveedor del directorio?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Proveedor eliminado');
        setSelectedSupplier(null);
        await fetchSuppliers();
      }
    } catch (err) {
      console.error(err);
      showToast('Error eliminando proveedor');
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      s.name.toLowerCase().includes(term) ||
      (s.contact_person || '').toLowerCase().includes(term) ||
      (s.category || '').toLowerCase().includes(term) ||
      (s.phone || '').includes(term)
    );
  });

  return (
    <div className="flex flex-col w-full h-full p-4 sm:p-6 lg:p-8 relative bg-surface">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-secondary text-on-secondary px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border border-white/20">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
          <div className="font-bold text-sm">{toastMessage}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Gestión de Proveedores</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider font-mono">
              Logística
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 font-medium">
            Directorio de contacto, días de visita de preventistas y logística de abastecimiento.
          </p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          + Nuevo Proveedor
        </button>
      </div>

      {/* 2 Columns: List & Selected Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Side: Directory Table / Cards */}
        <div className="lg:col-span-7 flex flex-col bg-surface-container-lowest rounded-3xl border border-outline-variant/25 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-surface-container-low/60 border-b border-outline-variant/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">Directorio de Abastecimiento</h2>
              <p className="text-xs text-on-surface-variant">{filteredSuppliers.length} proveedores registrados</p>
            </div>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">search</span>
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por empresa o preventista..."
                className="w-full bg-surface pl-9 pr-4 py-2 rounded-xl text-xs text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">local_shipping</span>
                <p className="text-sm font-bold">No se encontraron proveedores</p>
                <p className="text-xs mt-1">Presiona "+ Nuevo Proveedor" para agregar uno.</p>
              </div>
            ) : (
              filteredSuppliers.map(sup => {
                const isSelected = selectedSupplier?.id === sup.id;
                return (
                  <div 
                    key={sup.id}
                    onClick={() => setSelectedSupplier(sup)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                        : 'border-outline-variant/20 hover:border-outline-variant/40 bg-surface hover:bg-surface-container/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-surface-container text-primary'
                      }`}>
                        {sup.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-on-surface truncate">{sup.name}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container uppercase">
                            {sup.delivery_days || 'LUN • VIE'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">person</span>
                          <span>{sup.contact_person || 'Sin contacto asignado'}</span>
                          {sup.phone && (
                            <>
                              <span className="text-outline mx-1">•</span>
                              <span className="font-mono">{sup.phone}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/15 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Catálogo</p>
                        <p className="font-mono text-sm font-extrabold text-primary">
                          {sup.product_count || 0} <span className="text-xs font-normal text-on-surface-variant">arts</span>
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-base">
                        chevron_right
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected Supplier Details */}
        <div className="lg:col-span-5 flex flex-col bg-surface-container-lowest rounded-3xl border border-outline-variant/25 shadow-sm p-6 space-y-6">
          {selectedSupplier ? (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xl">
                    {selectedSupplier.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Proveedor Seleccionado
                    </span>
                    <h2 className="text-lg font-bold text-on-surface leading-tight">
                      {selectedSupplier.name}
                    </h2>
                    <span className="text-xs text-primary font-semibold">
                      {selectedSupplier.category || 'General'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenEditModal(selectedSupplier)}
                    title="Editar Proveedor"
                    className="w-9 h-9 rounded-xl bg-surface-container hover:bg-primary/10 text-on-surface hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteSupplier(selectedSupplier.id)}
                    title="Eliminar Proveedor"
                    className="w-9 h-9 rounded-xl bg-surface-container hover:bg-error/10 text-on-surface hover:text-error transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="p-4 rounded-2xl bg-surface-container-low space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">person</span>
                    Preventista / Contacto:
                  </span>
                  <span className="font-bold text-on-surface">{selectedSupplier.contact_person || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">call</span>
                    Teléfono Móvil:
                  </span>
                  <span className="font-mono font-bold text-on-surface">{selectedSupplier.phone || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">mail</span>
                    Email:
                  </span>
                  <span className="font-mono text-on-surface">{selectedSupplier.email || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    Días de Pedido / Visita:
                  </span>
                  <span className="font-bold text-secondary uppercase">{selectedSupplier.delivery_days || 'LUN • VIE'}</span>
                </div>
              </div>

              {/* Logistics & Commercial Notes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">notes</span>
                  Condiciones Comerciales y Pedidos
                </h4>
                <div className="p-4 rounded-2xl bg-surface border border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed">
                  {selectedSupplier.notes || 'Sin notas o condiciones especiales registradas para este proveedor.'}
                </div>
              </div>

              {/* Communication Quick Shortcuts */}
              <div className="pt-2 border-t border-outline-variant/20 flex gap-3">
                {selectedSupplier.phone && (
                  <a 
                    href={`https://wa.me/${selectedSupplier.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 bg-secondary/15 hover:bg-secondary/25 text-secondary font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    WhatsApp
                  </a>
                )}
                {selectedSupplier.phone && (
                  <a 
                    href={`tel:${selectedSupplier.phone}`}
                    className="flex-1 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                    Llamar
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">touch_app</span>
              <p className="text-sm font-bold">Selecciona un proveedor</p>
              <p className="text-xs mt-1">Haz clic en un elemento de la lista para ver su logística de entrega.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create / Edit Supplier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/30 animate-slide-up space-y-5">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {isEditing ? 'edit_note' : 'add_business'}
                </span>
                <h3 className="text-lg font-bold text-on-surface">
                  {isEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-on-surface-variant uppercase tracking-wider">
                  Nombre de la Empresa / Distribuidora *
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="ej. Distribuidora Los Andes S.A. de C.V."
                  className="w-full h-11 bg-surface px-3.5 rounded-xl text-xs font-bold text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider">
                    Nombre del Preventista / Contacto
                  </label>
                  <input 
                    type="text" 
                    value={contactPerson} 
                    onChange={e => setContactPerson(e.target.value)} 
                    placeholder="ej. Carlos Mendoza"
                    className="w-full h-11 bg-surface px-3.5 rounded-xl text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider">
                    Teléfono / WhatsApp
                  </label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="ej. 5512345678"
                    className="w-full h-11 bg-surface px-3.5 rounded-xl text-xs font-mono text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider">
                    Email de Pedidos
                  </label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="pedidos@empresa.com"
                    className="w-full h-11 bg-surface px-3.5 rounded-xl text-xs font-mono text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider">
                    Días de Visita / Entrega
                  </label>
                  <input 
                    type="text" 
                    value={deliveryDays} 
                    onChange={e => setDeliveryDays(e.target.value)} 
                    placeholder="ej. LUN • MIE • VIE"
                    className="w-full h-11 bg-surface px-3.5 rounded-xl text-xs uppercase font-bold text-secondary border border-outline-variant/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface-variant uppercase tracking-wider">
                  Ramo / Categoría Principal
                </label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  placeholder="ej. Lácteos, Embutidos, Bebidas, Abarrotes"
                  className="w-full h-11 bg-surface px-3.5 rounded-xl text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface-variant uppercase tracking-wider">
                  Notas de Pedido y Condiciones Comerciales
                </label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Condiciones de crédito, horario de entrega, etc."
                  rows={3}
                  className="w-full bg-surface p-3 rounded-xl text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isEditing ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
