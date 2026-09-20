import { useState, useEffect } from 'react';
import { useStaffStore, type Employee } from '../store/staffStore';

export function StaffAccessView() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, fetchEmployees } = useStaffStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos los roles');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNip, setShowNip] = useState(false);
  const [showModalNip, setShowModalNip] = useState(false);
  const [showModalPass, setShowModalPass] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Form state
  const [formState, setFormState] = useState<Partial<Employee>>({
    name: '',
    username: '',
    password: '',
    role: 'cashier',
    pin: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenNewModal = () => {
    setFormState({
      name: '',
      username: '',
      password: '',
      role: 'cashier',
      pin: '',
      bank_name: '',
      bank_account: '',
      transfer_phone: ''
    });
    setSelectedEmployee(null);
    setShowModalNip(false);
    setShowModalPass(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormState({
      name: emp.name,
      username: emp.username,
      password: emp.password || '',
      role: emp.role,
      pin: emp.pin,
      bank_name: emp.bank_name || '',
      bank_account: emp.bank_account || '',
      transfer_phone: emp.transfer_phone || ''
    });
    setShowModalNip(false);
    setShowModalPass(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.name?.trim() || !formState.username?.trim() || !formState.password?.trim()) {
      showToast('Por favor llene todos los campos obligatorios.');
      return;
    }

    if (!formState.pin || formState.pin.length < 4) {
      showToast('El NIP debe ser numérico de al menos 4 dígitos.');
      return;
    }

    if (selectedEmployee) {
      const success = await updateEmployee(selectedEmployee.id, {
        name: formState.name,
        username: formState.username,
        password: formState.password,
        role: formState.role,
        pin: formState.pin,
        bank_name: formState.bank_name || '',
        bank_account: formState.bank_account || '',
        transfer_phone: formState.transfer_phone || ''
      });
      if (success) {
        showToast(`Empleado ${formState.name} actualizado correctamente.`);
        setIsModalOpen(false);
      } else {
        showToast('Hubo un error al actualizar el empleado.');
      }
    } else {
      const success = await addEmployee({
        name: formState.name,
        username: formState.username,
        password: formState.password,
        role: formState.role as 'admin' | 'cashier',
        pin: formState.pin,
        bank_name: formState.bank_name || '',
        bank_account: formState.bank_account || '',
        transfer_phone: formState.transfer_phone || ''
      });
      if (success) {
        showToast(`Nuevo empleado ${formState.name} registrado.`);
        setIsModalOpen(false);
      } else {
        showToast('Error al crear el empleado. El usuario ya existe.');
      }
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'Todos los roles' || 
      (roleFilter === 'admin' && emp.role === 'admin') ||
      (roleFilter === 'cashier' && emp.role === 'cashier');

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-secondary-container/40 text-on-secondary-container border border-secondary/20';
      case 'cashier':
        return 'bg-surface-variant text-on-surface-variant border border-outline-variant/30';
      default:
        return 'bg-surface-variant text-on-surface';
    }
  };

  const getRoleName = (role: string) => role === 'admin' ? 'Administrador' : 'Cajero';

  return (
    <div className="flex flex-col w-full h-full max-w-[1400px] mx-auto gap-6 p-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-[slide-in-right_0.3s_ease-out]">
          <span className="material-symbols-outlined text-secondary-fixed">check_circle</span>
          <span className="font-body-md text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/40">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl tracking-tight text-on-surface font-semibold">
            Gestión de Personal y Accesos
          </h1>
          <p className="font-body-md text-on-surface-variant mt-1 text-sm">
            Administra los usuarios reales de la base de datos (Usuario, Contraseña y NIP).
          </p>
        </div>
        <button 
          onClick={handleOpenNewModal}
          className="bg-primary text-on-primary font-headline-sm text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Nuevo Empleado
        </button>
      </div>

      {/* Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Employee Table Card */}
        <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden min-h-[500px]">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 bg-surface-container-lowest border-b border-outline-variant/20">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input 
                className="w-full bg-surface py-2.5 pl-10 pr-4 rounded-xl font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30 transition-all"
                placeholder="Buscar por nombre o usuario..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-label-caps text-xs text-on-surface-variant uppercase">Filtro:</span>
              <select 
                className="flex-1 sm:flex-none bg-surface py-2.5 px-3 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30 cursor-pointer"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="Todos los roles">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="cashier">Cajero</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto p-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-on-surface-variant font-label-caps text-xs uppercase tracking-wider border-b border-outline-variant/20">
                  <th className="py-3 px-3 font-semibold">Empleado</th>
                  <th className="py-3 px-3 font-semibold">Rol</th>
                  <th className="py-3 px-3 font-semibold">ID</th>
                  <th className="py-3 px-3 font-semibold">Teléfono / Contacto</th>
                  <th className="py-3 px-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-outline-variant/10">
                {filteredEmployees.map((emp) => (
                  <tr 
                    key={emp.id}
                    className={`group hover:bg-surface-container/50 transition-colors cursor-pointer ${
                      selectedEmployee?.id === emp.id ? 'bg-surface-container' : ''
                    }`}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setShowNip(false);
                    }}
                  >
                    <td className="py-3.5 px-3 rounded-l-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-headline-sm flex items-center justify-center font-semibold text-sm">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-headline-sm text-sm text-on-surface font-medium">{emp.name}</p>
                          <p className="font-body-md text-xs text-on-surface-variant">@{emp.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-label-caps text-[11px] font-semibold ${getRoleBadgeClasses(emp.role)}`}>
                        {getRoleName(emp.role)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-data-md text-on-surface text-xs font-mono">{emp.id}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      {emp.transfer_phone ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-on-surface bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/30 font-semibold">
                          <span className="material-symbols-outlined text-xs text-primary">call</span>
                          {emp.transfer_phone}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant/50 italic">Sin registrar</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right rounded-r-xl">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface transition-colors"
                          title="Editar empleado"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm(`¿Eliminar al empleado ${emp.name}?`)) {
                              const ok = await deleteEmployee(emp.id);
                              if (ok) {
                                showToast(`Empleado ${emp.name} eliminado.`);
                                if (selectedEmployee?.id === emp.id) setSelectedEmployee(null);
                              } else {
                                showToast('Error al eliminar empleado');
                              }
                            }
                          }}
                          className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface transition-colors"
                          title="Eliminar empleado"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-40">person_off</span>
                      <p className="font-body-md text-sm">No se encontraron empleados en la BD.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Details Card (Right) */}
        <div className="w-full lg:w-[380px] bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col p-6 relative overflow-hidden">
          {(() => {
            const activeEmployee = employees.find(e => e.id === selectedEmployee?.id) || selectedEmployee;
            if (!activeEmployee) {
              return (
                <div className="flex flex-col items-center justify-center text-center h-full my-auto py-12">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline-variant mb-4">
                    <span className="material-symbols-outlined text-3xl">badge</span>
                  </div>
                  <h3 className="font-headline-sm text-base text-on-surface font-semibold mb-1">Selecciona un empleado</h3>
                  <p className="font-body-md text-xs text-on-surface-variant max-w-[240px] leading-relaxed">
                    Haz clic en cualquier empleado de la lista para ver su perfil.
                  </p>
                </div>
              );
            }

            return (
              <div className="flex flex-col h-full space-y-6 animate-[fade-in_0.2s_ease-out]">
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">Detalle de Empleado</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-label-caps font-semibold ${getRoleBadgeClasses(activeEmployee.role)}`}>
                    {getRoleName(activeEmployee.role)}
                  </span>
                </div>

                {/* Avatar & Name */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-headline-sm flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
                    {activeEmployee.name.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-headline-sm text-lg text-on-surface font-semibold">{activeEmployee.name}</h3>
                  <p className="font-body-md text-xs text-on-surface-variant mt-0.5">Usuario: @{activeEmployee.username}</p>
                  <p className="font-data-md text-xs text-on-surface-variant font-mono mt-1">ID BD: {activeEmployee.id}</p>
                </div>

                {/* Teléfono & Contacto en Sidebar */}
                <div className="bg-surface-container p-3.5 rounded-xl border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">call</span>
                      Teléfono de Contacto:
                    </span>
                    <span className="font-mono font-bold text-on-surface">
                      {activeEmployee.transfer_phone || 'No registrado'}
                    </span>
                  </div>

                  {activeEmployee.bank_name && (
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-outline-variant/20">
                      <span className="text-on-surface-variant font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
                        Banco Nómina:
                      </span>
                      <span className="font-bold text-on-surface">
                        {activeEmployee.bank_name}
                      </span>
                    </div>
                  )}

                  {activeEmployee.bank_account && (
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-outline-variant/20">
                      <span className="text-on-surface-variant font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">credit_card</span>
                        Cuenta / CLABE:
                      </span>
                      <span className="font-mono font-bold text-primary text-[11px]">
                        •••• {activeEmployee.bank_account.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>

                {/* NIP Configuration Box */}
                <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg">key</span>
                      <span className="font-headline-sm text-sm font-semibold text-on-surface">NIP Operativo</span>
                    </div>
                    <button 
                      onClick={() => setShowNip(!showNip)}
                      className="text-xs text-secondary hover:text-primary font-label-caps font-semibold flex items-center gap-1 bg-surface py-1 px-2.5 rounded-lg border border-outline-variant/30 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">{showNip ? 'visibility_off' : 'visibility'}</span>
                      {showNip ? 'Ocultar NIP' : 'Ver NIP'}
                    </button>
                  </div>
                  <div className="bg-surface p-3 rounded-lg flex items-center justify-between border border-outline-variant/20">
                    <span className="font-data-lg text-lg tracking-[0.4em] font-mono text-primary font-bold">
                      {showNip ? activeEmployee.pin : '••••'}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-2 mt-auto">
                  <button 
                    onClick={() => handleOpenEditModal(activeEmployee)}
                    className="w-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-headline-sm text-sm py-2.5 rounded-xl border border-outline-variant/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    Modificar Perfil
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal Formulario Empleado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
          <div 
            className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-outline-variant/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">manage_accounts</span>
                </div>
                <h2 className="font-headline-sm text-lg text-on-surface font-semibold">
                  {selectedEmployee ? `Editar Empleado: ${selectedEmployee.name}` : 'Registrar Nuevo Empleado'}
                </h2>
              </div>
              <button 
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nombre */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-label-caps text-on-surface-variant uppercase font-semibold">
                    Nombre Completo *
                  </label>
                  <input 
                    required
                    className="w-full bg-surface py-2.5 px-3 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
                    placeholder="Ej. Juan Pérez González"
                    type="text"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  />
                </div>

                {/* Rol */}
                <div className="space-y-1.5">
                  <label className="text-xs font-label-caps text-on-surface-variant uppercase font-semibold">
                    Nivel de Acceso *
                  </label>
                  <select 
                    className="w-full bg-surface py-2.5 px-3 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30 cursor-pointer"
                    value={formState.role || 'cashier'}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                  >
                    <option value="cashier">Cajero (Solo POS)</option>
                    <option value="admin">Administrador (Acceso Total)</option>
                  </select>
                </div>

                {/* Teléfono de Contacto (Arriba en Perfil General) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-label-caps text-on-surface-variant uppercase font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">call</span>
                    Teléfono de Contacto / Móvil
                  </label>
                  <input 
                    className="w-full bg-surface py-2.5 px-3 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30 font-mono"
                    placeholder="Ej. 55 1234 5678"
                    type="text"
                    value={formState.transfer_phone || ''}
                    onChange={(e) => setFormState({ ...formState, transfer_phone: e.target.value })}
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5 bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <label className="text-xs font-label-caps text-on-surface-variant uppercase font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">person</span>
                    Usuario (Login) *
                  </label>
                  <input 
                    required
                    className="w-full mt-2 bg-surface py-2.5 px-3 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
                    placeholder="ej. juanp"
                    type="text"
                    value={formState.username || ''}
                    onChange={(e) => setFormState({ ...formState, username: e.target.value.toLowerCase() })}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5 bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-label-caps text-on-surface-variant uppercase font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-primary">lock</span>
                      Contraseña (Login) *
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowModalPass(!showModalPass)}
                      className="text-[11px] font-label-caps text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">{showModalPass ? 'visibility_off' : 'visibility'}</span>
                      {showModalPass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  <input 
                    required
                    className="w-full mt-2 bg-surface py-2.5 px-3 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
                    placeholder="Contraseña segura"
                    type={showModalPass ? 'text' : 'password'}
                    value={formState.password || ''}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                  />
                </div>

                {/* NIP PERSONALIZADO (DESTACADO) */}
                <div className="space-y-1.5 bg-secondary-container/20 p-4 rounded-xl border border-secondary/30 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-label-caps text-on-secondary-container uppercase font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">key</span>
                      NIP para Autorizaciones POS *
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowModalNip(!showModalNip)}
                      className="text-[11px] font-label-caps text-secondary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">{showModalNip ? 'visibility_off' : 'visibility'}</span>
                      {showModalNip ? 'Ocultar' : 'Ver NIP'}
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <input 
                      required
                      className="w-full bg-surface py-2 px-3 rounded-lg font-data-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary border border-secondary/40 tracking-[0.5em] text-center text-lg font-bold"
                      maxLength={6}
                      placeholder="••••"
                      type={showModalNip ? 'text' : 'password'}
                      value={formState.pin || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormState({ ...formState, pin: val });
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-body-md mt-2">
                    Código numérico (4 a 6 dígitos) que el trabajador ingresa rápido en el Kiosco para autorizar procesos.
                  </p>
                </div>

                {/* DATOS BANCARIOS PARA TRANSFERENCIA */}
                <div className="space-y-4 bg-surface-container p-5 rounded-2xl border border-outline-variant/30 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                    <label className="text-xs font-label-caps text-primary uppercase font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">account_balance</span>
                      Datos Bancarios para Transferencia (Nómina)
                    </label>
                    <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
                      Opcional
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Banco */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-label-caps text-on-surface-variant uppercase font-semibold">
                        Banco / Institución
                      </label>
                      <input 
                        className="w-full bg-surface py-2.5 px-3 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
                        placeholder="Ej. BBVA, Nu, Santander, Banamex, Mercado Pago..."
                        type="text"
                        value={formState.bank_name || ''}
                        onChange={(e) => setFormState({ ...formState, bank_name: e.target.value })}
                      />
                    </div>

                    {/* CLABE o Tarjeta */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-label-caps text-on-surface-variant uppercase font-semibold">
                        CLABE Interbancaria (18 dígitos) o Tarjeta de Débito (16 dígitos)
                      </label>
                      <input 
                        className="w-full bg-surface py-2.5 px-3 rounded-xl font-mono text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30 tracking-wider"
                        placeholder="Ej. 012180001234567890"
                        type="text"
                        maxLength={18}
                        value={formState.bank_account || ''}
                        onChange={(e) => setFormState({ ...formState, bank_account: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        Si este empleado no tiene registrados estos datos, la opción de pago por Transferencia aparecerá bloqueada con candado en el módulo de Nómina.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  className="px-5 py-2.5 text-sm font-headline-sm text-on-surface-variant hover:bg-surface-variant rounded-xl transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-primary text-on-primary px-6 py-2.5 text-sm font-headline-sm rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
