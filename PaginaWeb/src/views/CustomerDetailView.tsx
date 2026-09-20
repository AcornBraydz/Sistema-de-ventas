import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface TransactionItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  isBulk?: boolean;
}

interface Transaction {
  id: number;
  customer_id: number;
  type: 'charge' | 'payment';
  amount: number;
  concept: string;
  payment_method?: string | null;
  timestamp: number;
  items?: TransactionItem[] | null;
}

interface CustomerDetail {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  credit_limit: number;
  current_balance: number;
  status: string;
  transactions?: Transaction[];
}

export function CustomerDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [isEditLimitModalOpen, setIsEditLimitModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTicketTx, setSelectedTicketTx] = useState<Transaction | null>(null);
  const [storeSettings, setStoreSettings] = useState<{
    store_name?: string;
    store_address?: string;
    store_phone?: string;
    bank_name?: string;
  }>({});

  // Abono form state
  const [amount, setAmount] = useState('50.00');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [concept, setConcept] = useState('Abono a Cuenta');

  // Cargo form state
  const [cargoAmount, setCargoAmount] = useState('');
  const [cargoConcept, setCargoConcept] = useState('Compra a Crédito / Fiado');

  // Edit Limit form state
  const [newLimit, setNewLimit] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
        setNewLimit(data.credit_limit.toString());
      }
    } catch (e) {
      console.error('Error fetching customer detail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetail();
    fetch(`${API_BASE_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data) setStoreSettings(data);
      })
      .catch(console.error);
  }, [id]);

  // 1. REGISTRAR ABONO
  const handleRegisterAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          concept
        })
      });

      if (res.ok) {
        setIsAbonoModalOpen(false);
        setAmount('50.00');
        await fetchCustomerDetail();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error registrando abono');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. REGISTRAR CARGO (VALIDA LÍMITE)
  const handleRegisterCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !id) return;
    setIsSubmitting(true);
    setError(null);

    const val = parseFloat(cargoAmount);
    if (!val || val <= 0) {
      setError('Ingrese un monto válido mayor a 0');
      setIsSubmitting(false);
      return;
    }

    if (customer.current_balance + val > customer.credit_limit) {
      const disponible = Math.max(0, customer.credit_limit - customer.current_balance);
      setError(`No se puede exceder el límite de crédito ($${customer.credit_limit.toFixed(2)}). Crédito disponible: $${disponible.toFixed(2)}.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${id}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          concept: cargoConcept
        })
      });

      if (res.ok) {
        setIsCargoModalOpen(false);
        setCargoAmount('');
        await fetchCustomerDetail();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error registrando cargo');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. EDITAR LÍMITE DE CRÉDITO PERSONALIZADO
  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !id) return;
    setIsSubmitting(true);
    setError(null);

    const limitVal = parseFloat(newLimit);
    if (isNaN(limitVal) || limitVal <= 0) {
      setError('El límite debe ser un número positivo.');
      setIsSubmitting(false);
      return;
    }

    if (customer.current_balance > limitVal) {
      setError(`El límite no puede ser menor al saldo pendiente actual ($${customer.current_balance.toFixed(2)}).`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          credit_limit: limitVal
        })
      });

      if (res.ok) {
        setIsEditLimitModalOpen(false);
        await fetchCustomerDetail();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error actualizando límite');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charges = customer?.transactions?.filter(t => t.type === 'charge') || [];
  const payments = customer?.transactions?.filter(t => t.type === 'payment') || [];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full py-20 text-on-surface-variant gap-2">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        <span className="text-sm font-bold">Cargando estado de cuenta del cliente...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-on-surface mb-2">Cliente no encontrado</h2>
        <button 
          onClick={() => navigate('/admin/finance/receivables')}
          className="mt-4 px-6 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold"
        >
          Volver a Cuentas por Cobrar
        </button>
      </div>
    );
  }

  const availableCredit = Math.max(0, customer.credit_limit - customer.current_balance);
  const usagePercentage = Math.min(100, Math.round((customer.current_balance / customer.credit_limit) * 100)) || 0;

  return (
    <div className="flex flex-col w-full h-full relative bg-background">
      {/* Top Navigation & Action Bar */}
      <div className="pt-6 px-6 z-10 flex flex-wrap items-center justify-between gap-4 max-w-[1200px] mx-auto w-full">
        <button 
          onClick={() => navigate('/admin/finance/receivables')}
          className="w-10 h-10 flex items-center justify-center bg-on-primary-container/20 text-on-primary rounded-xl border border-white/10 hover:bg-on-primary-container/30 transition-all cursor-pointer"
          title="Volver a Cuentas por Cobrar"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            <span>Imprimir Estado de Cuenta</span>
          </button>
          
          <span className="font-mono text-xs text-on-surface-variant font-bold bg-surface-container px-3 py-2 rounded-xl border border-outline-variant/20">
            {customer.code}
          </span>
        </div>
      </div>

      {/* Header / Saldo Actual & Límites */}
      <div className="flex-none p-6 z-10">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container rounded-3xl p-6 shadow-sm border border-outline-variant/10">
          <div className="flex-1">
            <div className="text-label-caps font-label-caps text-on-surface-variant uppercase text-xs font-bold mb-1">
              Cliente con Crédito
            </div>
            <h1 className="text-3xl font-bold text-on-surface mb-2">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
              {customer.phone && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">phone</span>{customer.phone}</span>}
              {customer.email && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">mail</span>{customer.email}</span>}
            </div>

            {/* Barra de Límite de Crédito Personalizado */}
            <div className="mt-4 max-w-md bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/20">
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">credit_card</span>
                  Límite Autorizado: <span className="font-mono text-on-surface">${customer.credit_limit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </span>
                <button 
                  onClick={() => {
                    setError(null);
                    setNewLimit(customer.credit_limit.toString());
                    setIsEditLimitModalOpen(true);
                  }}
                  className="text-primary hover:underline text-[11px] font-bold uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Modificar
                </button>
              </div>
              <div className="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${usagePercentage > 85 ? 'bg-error' : 'bg-primary'}`} 
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] mt-1.5 text-on-surface-variant">
                <span>Uso: <strong>{usagePercentage}%</strong></span>
                <span>Crédito disponible: <strong className="text-secondary font-mono">${availableCredit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right bg-surface-container-lowest md:bg-transparent p-4 md:p-0 rounded-2xl">
            <div className="text-label-caps font-label-caps text-on-surface-variant uppercase text-xs font-bold mb-1">Saldo Actual Pendiente</div>
            <div className={`font-mono text-4xl sm:text-5xl font-bold ${customer.current_balance > 0 ? 'text-error' : 'text-secondary'}`}>
              ${customer.current_balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Máximo permitido: ${customer.credit_limit.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 max-w-[1200px] mx-auto w-full gap-6 pb-12 px-6">
        
        {/* Left Column: Historial de Cargos (Deuda / Compras a Crédito) */}
        <div className="flex flex-col bg-surface-container rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
          <div className="p-4 bg-surface-container-high sticky top-0 z-10 flex justify-between items-center border-b border-outline-variant/10">
            <span className="font-mono font-bold text-on-surface text-sm uppercase">Historial de Cargos (Compras Fiadas)</span>
            <span className="material-symbols-outlined text-error text-base">receipt_long</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {charges.length === 0 ? (
              <p className="text-center py-8 text-xs text-on-surface-variant font-medium">No hay compras a crédito registradas.</p>
            ) : (
              charges.map(item => {
                const hasItems = item.items && item.items.length > 0;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedTicketTx(item)}
                    className="bg-surface p-4 rounded-2xl shadow-xs hover:bg-surface-bright transition-all border border-outline-variant/10 cursor-pointer group hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-lg">receipt_long</span>
                        </div>
                        <div>
                          <span className="font-mono text-sm font-bold text-on-surface group-hover:text-primary transition-colors block">
                            {item.concept}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">{formatDate(item.timestamp)}</span>
                        </div>
                      </div>
                      <span className="font-mono text-base font-bold text-error">-${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs mt-3 pt-2.5 border-t border-outline-variant/10">
                      <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span>{hasItems ? `Ver ${item.items?.length} ${item.items?.length === 1 ? 'producto' : 'productos'} comprados` : 'Ver detalle de la compra'}</span>
                      </div>
                      <div className="bg-error/10 text-error px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Cargo Fiado</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Historial de Abonos (Pagos Realizados) */}
        <div className="flex flex-col bg-surface-container rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
          <div className="p-4 bg-surface-container-high sticky top-0 z-10 flex justify-between items-center border-b border-outline-variant/10">
            <span className="font-mono font-bold text-on-surface text-sm uppercase">Historial de Abonos (Pagos)</span>
            <span className="material-symbols-outlined text-secondary text-base">payments</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {payments.length === 0 ? (
              <p className="text-center py-8 text-xs text-on-surface-variant font-medium">No hay abonos registrados para este cliente.</p>
            ) : (
              payments.map(item => (
                <div key={item.id} className="bg-secondary/5 p-4 rounded-xl shadow-sm hover:bg-secondary/10 transition-colors border border-secondary/15">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-sm font-bold text-secondary">{item.concept}</span>
                    <span className="font-mono text-base font-bold text-secondary">+${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant text-xs">
                    <span>{formatDate(item.timestamp)}</span>
                    <div className="bg-secondary text-on-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {item.payment_method || 'Efectivo'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: REGISTRAR ABONO */}
      {isAbonoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative border border-outline-variant/20">
            <button 
              onClick={() => setIsAbonoModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/10">
              <h3 className="text-xl font-bold text-on-surface mb-0.5">Registrar Nuevo Abono</h3>
              <p className="text-xs text-on-surface-variant">Cliente: <strong className="text-on-surface">{customer.name}</strong></p>
            </div>
            
            <form onSubmit={handleRegisterAbono} className="p-6 flex-1 flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-error-container/30 text-error border border-error/30 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Monto a abonar ($)</label>
                <div className="relative flex items-center bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-secondary/50 border border-outline-variant/30">
                  <span className="absolute left-4 font-mono text-2xl font-bold text-on-surface-variant">$</span>
                  <input 
                    required
                    className="w-full bg-transparent py-4 pl-10 pr-4 font-mono text-3xl font-bold text-on-surface outline-none" 
                    placeholder="0.00" 
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Montos Rápidos</label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map(val => (
                    <button 
                      key={val}
                      type="button" 
                      onClick={() => setAmount(val.toFixed(2))}
                      className="py-2.5 bg-surface-container rounded-xl font-mono text-xs font-bold text-on-surface hover:bg-secondary/20 hover:text-secondary transition-colors cursor-pointer"
                    >
                      +${val}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Método de Pago</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 px-4 rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-secondary/50 cursor-pointer"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Concepto</label>
                <input 
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej. Abono en efectivo"
                  className="w-full bg-surface-container-lowest border border-outline-variant py-2 px-4 rounded-xl text-sm text-on-surface outline-none"
                />
              </div>

              <div className="mt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAbonoModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider text-on-secondary bg-secondary rounded-xl hover:bg-secondary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registrando...' : 'Confirmar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR CARGO (VALIDA LÍMITE) */}
      {isCargoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative border border-outline-variant/20">
            <button 
              onClick={() => setIsCargoModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/10">
              <h3 className="text-xl font-bold text-on-surface mb-0.5">Registrar Compra a Crédito (Fiado)</h3>
              <p className="text-xs text-on-surface-variant">
                Crédito disponible para este cliente: <strong className="text-secondary font-mono">${availableCredit.toFixed(2)}</strong>
              </p>
            </div>
            
            <form onSubmit={handleRegisterCargo} className="p-6 flex-1 flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-error-container/30 text-error border border-error/30 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Monto del Cargo ($)</label>
                <div className="relative flex items-center bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 border border-outline-variant/30">
                  <span className="absolute left-4 font-mono text-2xl font-bold text-on-surface-variant">$</span>
                  <input 
                    required
                    className="w-full bg-transparent py-4 pl-10 pr-4 font-mono text-3xl font-bold text-on-surface outline-none" 
                    placeholder="0.00" 
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={availableCredit}
                    value={cargoAmount}
                    onChange={(e) => setCargoAmount(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  El saldo no puede exceder el límite de <strong>${customer.credit_limit.toFixed(2)}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Concepto / Referencia</label>
                <input 
                  type="text"
                  value={cargoConcept}
                  onChange={(e) => setCargoConcept(e.target.value)}
                  placeholder="Ej. Venta mostrador / Despensa fiada"
                  className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 px-4 rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="mt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCargoModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registrando...' : 'Confirmar Cargo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MODIFICAR LÍMITE DE CRÉDITO PERSONALIZADO */}
      {isEditLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative border border-outline-variant/20">
            <button 
              onClick={() => setIsEditLimitModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/10">
              <h3 className="text-xl font-bold text-on-surface mb-0.5">Límite de Crédito Personalizado</h3>
              <p className="text-xs text-on-surface-variant">Cliente: <strong className="text-on-surface">{customer.name}</strong></p>
            </div>
            
            <form onSubmit={handleUpdateLimit} className="p-6 flex-1 flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-error-container/30 text-error border border-error/30 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Nuevo Límite de Crédito ($)</label>
                <div className="relative flex items-center bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 border border-outline-variant/30">
                  <span className="absolute left-4 font-mono text-2xl font-bold text-on-surface-variant">$</span>
                  <input 
                    required
                    className="w-full bg-transparent py-4 pl-10 pr-4 font-mono text-3xl font-bold text-on-surface outline-none" 
                    placeholder="0.00" 
                    type="number"
                    step="0.01"
                    min={customer.current_balance}
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2">
                  * El límite no puede ser inferior al saldo pendiente actual (${customer.current_balance.toFixed(2)} MXN).
                </p>
              </div>

              <div className="mt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditLimitModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Límite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ESTADO DE CUENTA / REPORTE IMPRIMIBLE */}
      {isReportModalOpen && customer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-outline-variant/30 my-auto max-h-[92vh] animate-[scale-in_0.2s_ease-out]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-primary text-white flex items-center justify-between shrink-0 shadow-sm print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Estado de Cuenta / Reporte</h3>
                  <p className="text-xs text-white/80">Vista previa y comprobante de cuentas claras</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Printable Report Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-surface text-on-surface" id="printable-statement">
              {/* Header del Reporte */}
              <div className="border-b-2 border-primary/20 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-primary uppercase">
                    {storeSettings.store_name || 'Abarrotes & Super El Barrio'}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {storeSettings.store_address || 'Matriz Centro • Tel: ' + (storeSettings.store_phone || '555-123-4567')}
                  </p>
                  <span className="inline-block mt-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    Estado de Cuenta y Balance de Crédito
                  </span>
                </div>
                <div className="text-right text-xs text-on-surface-variant font-mono">
                  <p className="font-bold text-on-surface">Fecha de Emisión:</p>
                  <p>{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p className="text-[11px] mt-0.5">{new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs</p>
                </div>
              </div>

              {/* Ficha del Cliente */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Cliente</span>
                  <span className="font-bold text-on-surface text-sm">{customer.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Código Único</span>
                  <span className="font-mono font-bold text-primary">{customer.code}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Teléfono</span>
                  <span>{customer.phone || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Estado de Crédito</span>
                  <span className="font-bold text-secondary">{customer.status}</span>
                </div>
              </div>

              {/* Métricas Principales */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-surface-container rounded-2xl border border-outline-variant/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Límite Autorizado</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-on-surface">
                    ${customer.credit_limit.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 bg-error/10 rounded-2xl border border-error/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-error block">Deuda Pendiente Actual</span>
                  <span className="font-mono text-base sm:text-lg font-black text-error">
                    ${customer.current_balance.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 bg-secondary/10 rounded-2xl border border-secondary/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-secondary block">Crédito Disponible</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-secondary">
                    ${Math.max(0, customer.credit_limit - customer.current_balance).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Historial Detallado de Movimientos */}
              <div>
                <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">history</span>
                  Desglose Cronológico de Compras y Abonos
                </h4>

                <div className="border border-outline-variant/30 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-high text-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Concepto / Ref</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {!customer.transactions || customer.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-on-surface-variant text-xs">
                            No hay movimientos registrados para este cliente.
                          </td>
                        </tr>
                      ) : (
                        customer.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-surface-container-low/60">
                            <td className="py-2 px-3 font-mono text-[11px] text-on-surface-variant">
                              {formatDate(tx.timestamp)}
                            </td>
                            <td className="py-2 px-3">
                              {tx.type === 'charge' ? (
                                <span className="bg-error/15 text-error px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                                  Cargo (Fiado)
                                </span>
                              ) : (
                                <span className="bg-secondary/15 text-secondary px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                                  Abono (Pago)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-medium">{tx.concept}</td>
                            <td className="py-2 px-3 text-on-surface-variant text-[11px] font-mono">
                              {tx.payment_method || '-'}
                            </td>
                            <td className={`py-2 px-3 text-right font-mono font-bold ${
                              tx.type === 'charge' ? 'text-error' : 'text-secondary'
                            }`}>
                              {tx.type === 'charge' ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección de Firmas de Conformidad */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-on-surface-variant">
                <div className="border-t border-outline-variant/40 pt-2">
                  <p className="font-bold text-on-surface">Firma del Cajero / Encargado</p>
                  <p className="text-[10px] text-on-surface-variant">Autorización y Balance</p>
                </div>
                <div className="border-t border-outline-variant/40 pt-2">
                  <p className="font-bold text-on-surface">Firma de Conformidad del Cliente</p>
                  <p className="text-[10px] text-on-surface-variant">Acepto saldo y movimientos</p>
                </div>
              </div>

              <p className="text-[10px] text-center text-on-surface-variant/80 italic pt-2">
                * Documento de control interno y cuentas claras emitido por el sistema punto de venta.
              </p>
            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between shrink-0 shadow-md print:hidden">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="h-11 px-5 border border-outline-variant/40 rounded-xl text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-11 px-6 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-base">print</span>
                <span>Mandar a Imprimir Reporte</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: DETALLE DE TICKET Y PRODUCTOS COMPRADOS */}
      {selectedTicketTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fade-in_0.15s_ease-out]">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-outline-variant/30 max-h-[90vh] animate-[scale-in_0.15s_ease-out]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-primary text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">{selectedTicketTx.concept}</h3>
                  <p className="text-xs text-white/80">Cliente: <strong className="text-white">{customer?.name}</strong></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTicketTx(null)}
                className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Ticket Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
              <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Fecha y Hora de Compra</span>
                  <span className="font-mono text-xs font-bold text-on-surface">{formatDate(selectedTicketTx.timestamp)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-error block">Total Cargado a Cuenta</span>
                  <span className="font-mono text-base font-black text-error">-${selectedTicketTx.amount.toFixed(2)} MXN</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">shopping_bag</span>
                  Productos del Ticket
                </h4>

                {selectedTicketTx.items && selectedTicketTx.items.length > 0 ? (
                  <div className="border border-outline-variant/20 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container-high text-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Cant.</th>
                          <th className="py-2.5 px-3">Producto</th>
                          <th className="py-2.5 px-3 text-right">P. Unit</th>
                          <th className="py-2.5 px-3 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/15">
                        {selectedTicketTx.items.map((prod, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-low/50">
                            <td className="py-2 px-3 font-mono font-bold text-primary text-xs">
                              {prod.quantity} {prod.isBulk ? 'kg' : 'pz'}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-on-surface block">{prod.name}</span>
                              <span className="text-[10px] text-on-surface-variant font-mono">{prod.sku}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-on-surface-variant">
                              ${prod.price.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-on-surface">
                              ${(prod.quantity * prod.price).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-center space-y-1">
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant">inventory_2</span>
                    <p className="text-xs text-on-surface font-bold">{selectedTicketTx.concept}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      Este cargo fue registrado por un total de <strong>${selectedTicketTx.amount.toFixed(2)} MXN</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between shrink-0 shadow-md">
              <button
                type="button"
                onClick={() => setSelectedTicketTx(null)}
                className="h-11 px-5 border border-outline-variant/40 rounded-xl text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-11 px-6 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-base">print</span>
                <span>Imprimir Ticket</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
