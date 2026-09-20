import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

interface Customer {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  credit_limit: number;
  current_balance: number;
  status: string;
  last_payment?: {
    amount: number;
    timestamp: number;
    payment_method: string;
  } | null;
}

export function ReceivablesView() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New debtor modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    credit_limit: '5000',
    initial_balance: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete customer state with password confirmation
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/customers`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {
      console.error('Error cargando cuentas por cobrar:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Computed Metrics
  const totalBalance = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const atRiskCount = customers.filter(c => (c.current_balance || 0) > (c.credit_limit || 0) * 0.8).length;
  const recentPaymentsSum = customers.reduce((sum, c) => sum + (c.last_payment?.amount || 0), 0);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const limit = parseFloat(formData.credit_limit);
    const initialBal = parseFloat(formData.initial_balance) || 0;

    if (isNaN(limit) || limit <= 0) {
      setError('El límite de crédito debe ser mayor a 0');
      setIsSubmitting(false);
      return;
    }

    if (initialBal > limit) {
      setError(`La deuda anterior ($${initialBal.toFixed(2)}) no puede ser mayor al límite a fiar ($${limit.toFixed(2)}).`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({
          name: '',
          phone: '',
          email: '',
          credit_limit: '5000',
          initial_balance: '0'
        });
        setIsModalOpen(false);
        await fetchCustomers();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar cliente');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToDelete) return;
    if (!deletePassword) {
      setDeleteError('Por favor ingrese su contraseña de login.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${customerToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteSuccess(`El cliente ${customerToDelete.name} fue eliminado correctamente.`);
        setCustomerToDelete(null);
        setDeletePassword('');
        await fetchCustomers();
        setTimeout(() => setDeleteSuccess(null), 3500);
      } else {
        setDeleteError(data.error || 'Contraseña incorrecta o error eliminando cliente.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error de conexión');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = 'Código,Cliente,Teléfono,Email,Límite de Crédito,Saldo Pendiente,Estado\n';
    const rows = customers.map(c => 
      `"${c.code}","${c.name}","${c.phone || ''}","${c.email || ''}",${c.credit_limit},${c.current_balance},"${c.status}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuentas_por_cobrar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Sin pagos registrados';
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 30) return `Hace ${days} días`;
    return new Date(timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex flex-col w-full h-full pb-8 bg-background">
      <div className="pt-6 flex flex-col md:flex-row md:items-end justify-between mb-8 px-6 gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2 font-bold">Clientes & Crédito (Fiado)</h1>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-2xl">
            Gestión de clientes de confianza autorizados para fiar, límites de crédito, saldos y seguimiento de abonos.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExportCSV}
            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center gap-2 px-6 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span className="text-sm font-bold">Exportar CSV</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-on-primary flex items-center gap-2 px-6 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="text-sm font-bold">+ Alta de Cliente de Confianza</span>
          </button>
        </div>
      </div>

      {/* Banner de Confirmación de Eliminación */}
      {deleteSuccess && (
        <div className="mx-6 mb-6 p-4 bg-secondary/15 border border-secondary/30 text-secondary rounded-2xl text-xs font-bold flex items-center justify-between animate-slide-up shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">check_circle</span>
            <span className="text-sm">{deleteSuccess}</span>
          </div>
          <button onClick={() => setDeleteSuccess(null)} className="text-secondary/70 hover:text-secondary p-1 cursor-pointer">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
        <div className="bg-surface-container rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <h3 className="text-body-md font-body-md text-on-surface-variant font-medium">Saldo Total Pendiente</h3>
          </div>
          <div className="font-mono text-4xl font-bold text-on-surface relative z-10">
            ${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3 className="text-body-md font-body-md text-on-surface-variant font-medium">Cuentas en Riesgo (&gt;80%)</h3>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <div className="font-mono text-4xl font-bold text-error">{atRiskCount}</div>
            <div className="text-body-md font-body-md text-on-surface-variant mb-2 font-medium">clientes</div>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <h3 className="text-body-md font-body-md text-on-surface-variant font-medium">Últimos Abonos Registrados</h3>
          </div>
          <div className="font-mono text-4xl font-bold text-secondary relative z-10">
            ${recentPaymentsSum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="flex-1 flex flex-col px-6">
        <div className="bg-surface-container rounded-t-2xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm border-b border-outline-variant/10 gap-3">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface py-3 pl-12 pr-4 rounded-xl text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
              placeholder="Buscar por cliente, teléfono o código..." 
              type="text"
            />
          </div>
          <div className="text-xs font-label-caps text-on-surface-variant uppercase font-semibold">
            {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} registrado{filteredCustomers.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="bg-surface-container rounded-b-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="font-label-caps text-xs text-on-surface-variant uppercase bg-surface-container-low">
                  <th className="py-4 px-6 font-semibold w-16">Código</th>
                  <th className="py-4 px-6 font-semibold">Cliente</th>
                  <th className="py-4 px-6 font-semibold text-right">Límite de Crédito</th>
                  <th className="py-4 px-6 font-semibold text-right">Saldo Pendiente</th>
                  <th className="py-4 px-6 font-semibold text-center">Estado</th>
                  <th className="py-4 px-6 font-semibold">Último Abono</th>
                  <th className="py-4 px-6 w-16"></th>
                </tr>
              </thead>
              <tbody className="text-body-md text-on-surface">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Cargando cuentas por cobrar...
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                      No se encontraron clientes registrados con crédito.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(customer => {
                    const initials = customer.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(w => w[0].toUpperCase())
                      .join('');

                    const percentUsed = customer.credit_limit > 0 
                      ? Math.min(100, Math.round((customer.current_balance / customer.credit_limit) * 100))
                      : 0;

                    let badgeClass = "bg-secondary/15 text-secondary border border-secondary/30";
                    let displayStatus = `${percentUsed}% usado`;

                    if (customer.current_balance <= 0) {
                      badgeClass = "bg-surface-container-high text-on-surface-variant";
                      displayStatus = "0% (Al Día)";
                    } else if (customer.current_balance >= customer.credit_limit) {
                      badgeClass = "bg-error/15 text-error border border-error/30 font-black";
                      displayStatus = "100% (Límite Tope)";
                    } else if (percentUsed >= 80) {
                      badgeClass = "bg-amber-500/15 text-amber-600 border border-amber-500/30 font-bold";
                      displayStatus = `${percentUsed}% usado`;
                    }

                    return (
                      <tr 
                        key={customer.id}
                        className="hover:bg-surface-container-high transition-colors group cursor-pointer border-t border-outline-variant/10"
                        onClick={() => navigate(`/admin/finance/receivables/${customer.code || customer.id}`)}
                      >
                        <td className="py-4 px-6 font-mono text-sm font-bold text-on-surface-variant">{customer.code}</td>
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold font-label-caps shrink-0">
                            {initials || 'CL'}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface">{customer.name}</div>
                            <div className="text-xs text-on-surface-variant">
                              {customer.phone || customer.email || 'Sin contacto registrado'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-sm font-bold">
                          ${customer.credit_limit.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono text-sm font-bold ${customer.current_balance >= customer.credit_limit ? 'text-error' : customer.current_balance > customer.credit_limit * 0.8 ? 'text-amber-600' : 'text-on-surface'}`}>
                          ${customer.current_balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-xs font-medium text-on-surface">
                            {formatTimeAgo(customer.last_payment?.timestamp)}
                          </div>
                          {customer.last_payment && (
                            <div className="text-xs text-secondary font-mono font-bold">
                              +${customer.last_payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({customer.last_payment.payment_method})
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              type="button"
                              title="Eliminar Cliente"
                              onClick={() => {
                                setDeletePassword('');
                                setDeleteError(null);
                                setCustomerToDelete(customer);
                              }}
                              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[19px]">delete</span>
                            </button>
                            <button 
                              type="button"
                              title="Ver Ficha y Movimientos"
                              onClick={() => navigate(`/admin/finance/receivables/${customer.code || customer.id}`)}
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Alta de Cliente de Confianza */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-outline-variant/20 animate-[scale-in_0.2s_ease-out] relative">
            
            {/* Header del Modal */}
            <div className="p-5 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl">person_add</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface leading-tight">Alta de Cliente de Confianza</h2>
                  <p className="text-xs text-on-surface-variant">Configurar persona autorizada para fiar y límite de crédito</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCreateCustomer} className="p-5 sm:p-6 space-y-4">
              {error && (
                <div className="p-3 bg-error/10 text-error border border-error/30 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Datos Personales */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Nombre del Cliente de Confianza *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-on-surface-variant text-base">
                      person
                    </span>
                    <input 
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej. Don Manuel / Familia Rodríguez"
                      className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 pl-10 pr-4 rounded-xl text-sm font-bold text-on-surface outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Teléfono de Contacto
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-on-surface-variant text-base">
                      call
                    </span>
                    <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="555-123-4567"
                      className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 pl-10 pr-4 rounded-xl text-sm text-on-surface outline-none focus:border-primary font-mono transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Tarjeta Destacada: Condiciones de Fiado y Crédito */}
              <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/30 space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-base">credit_score</span>
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Condiciones de Fiado y Crédito
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Límite a Fiar ($ MXN) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-primary font-mono font-bold text-sm">$</span>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                        className="w-full bg-surface border border-outline-variant py-2 pl-7 pr-3 rounded-xl font-mono text-sm font-bold text-primary outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Deuda Anterior / Pendiente ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-error font-mono font-bold text-sm">$</span>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.initial_balance}
                        onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                        className="w-full bg-surface border border-outline-variant py-2 pl-7 pr-3 rounded-xl font-mono text-sm font-bold text-error outline-none focus:border-error"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-on-surface-variant leading-tight flex items-center gap-1.5 pt-0.5">
                  <span className="material-symbols-outlined text-xs text-primary">info</span>
                  El cliente podrá fiar productos en caja hasta alcanzar su límite autorizado.
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-outline-variant/40 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-variant text-on-surface transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal de Eliminación con Contraseña de Login */}
      {customerToDelete && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
          <div className="relative bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-[scale-in_0.15s_ease-out] z-10">
            <div className="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4 mx-auto shadow-xs">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>

            <h2 className="text-lg font-bold text-on-surface text-center mb-1">
              ¿Eliminar Cliente de Confianza?
            </h2>
            <p className="text-xs text-on-surface-variant text-center mb-4 leading-relaxed">
              Esta acción dará de baja definitiva a <strong className="text-on-surface">{customerToDelete.name}</strong> ({customerToDelete.code}) y borrará su historial de crédito.
            </p>

            {customerToDelete.current_balance > 0 && (
              <div className="p-3 bg-error/10 border border-error/25 rounded-2xl mb-4 flex items-center gap-2.5 text-xs text-error font-bold">
                <span className="material-symbols-outlined text-lg shrink-0">warning</span>
                <span>¡Atención! Este cliente tiene un saldo deudor pendiente de ${customerToDelete.current_balance.toFixed(2)} MXN.</span>
              </div>
            )}

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Contraseña de Login *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-base">lock</span>
                  <input
                    required
                    type="password"
                    autoFocus
                    placeholder="Ingresa tu contraseña de usuario..."
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/40 py-2.5 pl-10 pr-3 rounded-xl text-xs text-on-surface outline-none focus:border-error focus:ring-1 focus:ring-error transition-all"
                  />
                </div>
              </div>

              {deleteError && (
                <div className="p-2.5 bg-error/15 border border-error/30 text-error rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="flex-1 py-2.5 border border-outline-variant/40 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword}
                  className="flex-1 py-2.5 bg-error hover:bg-error/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  <span>{isDeleting ? 'Eliminando...' : 'Eliminar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
