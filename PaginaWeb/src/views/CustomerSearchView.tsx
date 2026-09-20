import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLiveDateTime } from '../hooks/useLiveDateTime';
import { useAuthStore } from '../store/authStore';
import { AuthModal } from '../components/AuthModal';

interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  email: string;
  credit_limit: number;
  current_balance: number;
  status: string;
}

export function CustomerSearchView() {

  const user = useAuthStore(state => state.user);
  const { time24, dateShortUpper } = useLiveDateTime();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/customers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(err => console.error('Error fetching customers in POS:', err));
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    
    if (val.trim().length > 0) {
      setIsSearching(true);
      setShowResults(true);
      setTimeout(() => {
        setIsSearching(false);
      }, 150);
    } else {
      setShowResults(false);
      setIsSearching(false);
    }
  };

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const filteredCustomers = customers.filter(c => {
    const q = normalizeText(search);
    if (!q) return false;

    const nameNorm = normalizeText(c.name || '');
    const codeNorm = normalizeText(c.code || '');
    const phoneClean = (c.phone || '').replace(/\D/g, '');
    const qDigits = search.replace(/\D/g, '');

    // Para búsquedas cortas (1 o 2 letras): filtrar por palabras que EMPIECEN con esa letra (omitiendo 'de', 'del', etc.)
    if (q.length <= 2) {
      const stopWords = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'a'];
      const words = nameNorm.split(/[\s,.-]+/).filter(w => !stopWords.includes(w));
      const wordStarts = words.some(w => w.startsWith(q));
      const codeStarts = codeNorm.startsWith(q) || codeNorm.replace('cli-', '').startsWith(q);
      const phoneStarts = qDigits.length > 0 && phoneClean.startsWith(qDigits);

      return wordStarts || codeStarts || phoneStarts;
    }

    // Para búsquedas de 3 letras o más: coincidencia de palabras o códigos
    const words = nameNorm.split(/[\s,.-]+/);
    const wordStarts = words.some(w => w.startsWith(q));
    const nameIncludes = nameNorm.includes(q);
    const codeIncludes = codeNorm.includes(q);
    const phoneIncludes = qDigits.length > 0 && phoneClean.includes(qDigits);

    return wordStarts || nameIncludes || codeIncludes || phoneIncludes;
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [storeSettings, setStoreSettings] = useState<{
    bank_name?: string;
    bank_beneficiary?: string;
    bank_clabe?: string;
  }>({});

  // Abono Modal State
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoMethod, setAbonoMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [abonoConcept, setAbonoConcept] = useState('Abono / Pago de Deuda en Turno');
  const [isSubmittingAbono, setIsSubmittingAbono] = useState(false);
  const [abonoError, setAbonoError] = useState<string | null>(null);
  const [abonoSuccess, setAbonoSuccess] = useState<{
    amount: number;
    remainingBalance: number;
    newAvailable: number;
  } | null>(null);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [showAbonoAuthModal, setShowAbonoAuthModal] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCustomers(data);
      }
    } catch (e) {
      console.error('Error fetching customers in POS:', e);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetch(`${API_BASE_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data) setStoreSettings(data);
      })
      .catch(err => console.error('Error fetching store settings in POS:', err));
  }, []);

  const handleRegisterAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setAbonoError(null);

    const val = parseFloat(abonoAmount);
    if (isNaN(val) || val <= 0) {
      setAbonoError('Ingrese un monto válido mayor a 0');
      return;
    }

    if (val > selectedCustomer.current_balance) {
      setAbonoError(`El abono ($${val.toFixed(2)}) no puede ser mayor a la deuda total actual ($${selectedCustomer.current_balance.toFixed(2)}).`);
      return;
    }

    // Solicitar NIP de confirmación
    setShowAbonoAuthModal(true);
  };

  const executeConfirmedAbono = async (authorizerName?: string) => {
    if (!selectedCustomer) return;
    setShowAbonoAuthModal(false);
    setIsSubmittingAbono(true);
    setAbonoError(null);

    const val = parseFloat(abonoAmount);

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${selectedCustomer.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          payment_method: abonoMethod,
          concept: `${abonoConcept || 'Abono a Deuda'} • Autorizado por ${authorizerName || 'Cajero'}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newBalance = data.newBalance ?? Math.max(0, selectedCustomer.current_balance - val);
        const newAvailable = Math.max(0, selectedCustomer.credit_limit - newBalance);
        
        // Update selected customer
        const updatedCustomer = {
          ...selectedCustomer,
          current_balance: newBalance,
          status: data.status || selectedCustomer.status
        };
        setSelectedCustomer(updatedCustomer);
        setAbonoSuccess({
          amount: val,
          remainingBalance: newBalance,
          newAvailable
        });
        await fetchCustomers();
      } else {
        const errData = await res.json();
        setAbonoError(errData.error || 'Error registrando el abono');
      }
    } catch (err: any) {
      setAbonoError(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsSubmittingAbono(false);
    }
  };

  const handleCopyClabe = () => {
    if (storeSettings.bank_clabe) {
      navigator.clipboard.writeText(storeSettings.bank_clabe);
      setCopiedClabe(true);
      setTimeout(() => setCopiedClabe(false), 2500);
    }
  };

  return (
    <div className="bg-background font-body-md text-on-surface h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 h-[64px] min-h-[64px] max-h-[64px] bg-primary shadow-lg z-50 flex items-center px-gutter justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/pos" className="w-10 h-10 flex items-center justify-center bg-on-primary-container/20 text-on-primary rounded-xl border border-white/10 hover:bg-on-primary-container/30 transition-all cursor-pointer" title="Volver al Punto de Venta">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div className="h-10 w-px bg-white/10 mx-2"></div>
          <div className="flex flex-col">
            <span className="text-white font-data-lg leading-tight tracking-tight font-bold text-lg">{time24}</span>
            <span className="text-[11px] text-primary-fixed-dim font-label-caps uppercase font-semibold tracking-wider">{dateShortUpper}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-headline-sm font-semibold">{user?.name || 'Cajero'}</p>
            <p className="text-xs text-white/70 font-label-caps uppercase">Punto de Venta Activo</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <span className="material-symbols-outlined text-white">person_search</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-4 flex-1 relative overflow-hidden flex flex-col items-center">
        <div className="max-w-[720px] mx-auto w-full pt-8 px-container-padding flex-1">
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-on-surface font-headline-lg mb-1.5 text-2xl sm:text-3xl font-bold">Búsqueda de Cliente / Crédito</h1>
            <p className="text-on-surface-variant font-body-md text-sm">Consulta el saldo actual, crédito disponible o recibe abonos a la deuda de clientes autorizados.</p>
          </div>

          {/* Combobox Container */}
          <div className="relative w-full shadow-lg rounded-2xl bg-surface border border-outline-variant/30">
            {/* Search Input */}
            <div className="relative flex items-center w-full px-4 py-3.5 bg-surface rounded-2xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-outline mr-3">search</span>
              <input 
                className="w-full bg-transparent text-on-surface font-body-md placeholder-outline-variant focus:outline-none text-base" 
                placeholder="Escribe el nombre, teléfono o código del cliente..." 
                type="text"
                value={search}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (search.trim().length > 0) setShowResults(true);
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setShowResults(false);
                  }}
                  className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer mr-2"
                  title="Limpiar búsqueda"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
              {isSearching && (
                <div className="ml-1">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                </div>
              )}
            </div>

            {/* Results Dropdown (Solo si hay texto escrito) */}
            {showResults && search.trim().length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden z-50 max-h-[420px] overflow-y-auto animate-slide-up">
                <div className="p-3 text-xs font-label-caps text-on-surface-variant uppercase tracking-wider bg-surface-container-low border-b border-outline-variant/10 flex justify-between items-center">
                  <span>Coincidencias encontradas ({filteredCustomers.length})</span>
                  <button onClick={() => setShowResults(false)} className="text-xs hover:text-primary cursor-pointer font-bold">Cerrar</button>
                </div>
                
                {filteredCustomers.length > 0 ? (
                  <ul className="flex flex-col w-full">
                    {filteredCustomers.map(customer => {
                      const percentUsed = customer.credit_limit > 0 
                        ? Math.min(100, Math.round((customer.current_balance / customer.credit_limit) * 100))
                        : 0;
                      const isExceeded = customer.current_balance >= customer.credit_limit;

                      let badgeText = `${percentUsed}% usado`;
                      let badgeClass = 'bg-secondary/15 text-secondary';

                      if (isExceeded) {
                        badgeText = '100% (Límite Tope)';
                        badgeClass = 'bg-error/15 text-error font-bold';
                      } else if (percentUsed >= 80) {
                        badgeClass = 'bg-amber-500/15 text-amber-600 font-bold';
                      } else if (customer.current_balance <= 0) {
                        badgeText = '0% (Al Día)';
                        badgeClass = 'bg-surface-container text-on-surface-variant';
                      }

                      return (
                        <li 
                          key={customer.id}
                          className="flex items-center justify-between p-4 cursor-pointer transition-colors border-b border-outline-variant/10 last:border-0 hover:bg-surface-container group"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowResults(false);
                          }}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-on-surface font-bold text-base group-hover:text-primary transition-colors">
                              {customer.name}
                            </span>
                            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-mono">
                              <span className="bg-surface-container px-1.5 py-0.5 rounded text-[11px]">{customer.code}</span>
                              {customer.phone && <span>• 📞 {customer.phone}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${badgeClass}`}>
                              {badgeText}
                            </span>
                            <div className="text-right">
                              <span className="text-xs text-on-surface-variant mr-1.5">Deuda:</span>
                              <span className={`font-mono font-bold text-base ${customer.current_balance > 0 ? 'text-error' : 'text-secondary'}`}>
                                ${customer.current_balance.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-on-surface-variant font-body-md text-sm">
                    No se encontraron clientes registrados con ese término.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Ficha de Consulta de Crédito y Abonos */}
        {selectedCustomer && !isAbonoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
            <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-outline-variant/20 animate-[scale-in_0.2s_ease-out]">
              
              {/* Header */}
              <div className="p-5 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-2xl">person_search</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface leading-tight">{selectedCustomer.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono">{selectedCustomer.code} • {selectedCustomer.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Badge de Estatus de Crédito */}
                {(() => {
                  const percentUsed = selectedCustomer.credit_limit > 0 
                    ? Math.min(100, Math.round((selectedCustomer.current_balance / selectedCustomer.credit_limit) * 100))
                    : 0;
                  const isExceeded = selectedCustomer.current_balance >= selectedCustomer.credit_limit;
                  return (
                    <div className={`p-3 rounded-2xl flex items-center justify-between ${
                      isExceeded
                        ? 'bg-error/10 text-error border border-error/20'
                        : percentUsed >= 80
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-secondary/10 text-secondary border border-secondary/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">
                          {isExceeded ? 'block' : 'verified'}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {isExceeded ? 'Límite Tope (No Fiar)' : selectedCustomer.current_balance > 0 ? `${percentUsed}% de crédito utilizado` : 'Al Día (Crédito Total Disponible)'}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold">
                        {isExceeded ? '100%' : `${percentUsed}%`}
                      </span>
                    </div>
                  );
                })()}

                {/* Métricas de Crédito */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/20">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Límite Autorizado</span>
                    <p className="font-mono text-base font-bold text-on-surface">
                      ${selectedCustomer.credit_limit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/20">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Saldo que Debe</span>
                    <p className={`font-mono text-base font-black ${selectedCustomer.current_balance > 0 ? 'text-error' : 'text-secondary'}`}>
                      ${selectedCustomer.current_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Crédito Disponible Restante */}
                <div className="bg-surface-container-lowest p-4 rounded-2xl border-2 border-primary/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Crédito Disponible para Fiar:</span>
                    <span className="text-xs text-on-surface-variant">Capacidad restante</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-black text-primary tracking-tight">
                      ${Math.max(0, selectedCustomer.credit_limit - selectedCustomer.current_balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant ml-1">MXN</span>
                  </div>
                </div>

                {/* Botón Principal de Abonar si tiene deuda */}
                {selectedCustomer.current_balance > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAbonoAmount(selectedCustomer.current_balance.toString());
                      setAbonoMethod('Efectivo');
                      setAbonoConcept('Abono / Pago de Deuda en Turno');
                      setAbonoError(null);
                      setAbonoSuccess(null);
                      setIsAbonoModalOpen(true);
                    }}
                    className="w-full py-3.5 bg-primary text-white rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span className="material-symbols-outlined text-xl text-white">payments</span>
                    <span>Recibir Abono / Pago de Deuda</span>
                  </button>
                ) : (
                  <div className="p-3 bg-secondary/10 rounded-2xl border border-secondary/20 flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span className="text-xs font-bold">Este cliente está totalmente al día y no presenta saldo pendiente.</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
                >
                  Cerrar Consulta
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal de Registro de Abono / Pago de Deuda con Portal Directo */}
        {selectedCustomer && isAbonoModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/65 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col border border-outline-variant/30 my-auto max-h-[92vh] animate-[scale-in_0.2s_ease-out] relative">
              
              {/* Header */}
              <div className="px-5 py-3.5 bg-primary text-white flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-xl">payments</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">Recibir Abono a Cuenta</h3>
                    <p className="text-[11px] text-white/80">Cliente: <strong className="text-white">{selectedCustomer.name}</strong> ({selectedCustomer.code})</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsAbonoModalOpen(false);
                    setAbonoSuccess(null);
                  }}
                  className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Contenido / Formulario */}
              {abonoSuccess ? (
                <div className="p-5 text-center space-y-3 animate-slide-up">
                  <div className="w-14 h-14 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto shadow-md">
                    <span className="material-symbols-outlined text-3xl">task_alt</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-on-surface mb-0.5">¡Abono Registrado con Éxito!</h4>
                    <p className="text-xs text-on-surface-variant">
                      Se ha ingresado el pago a caja y reducido la deuda en la base de datos.
                    </p>
                  </div>

                  <div className="p-3.5 bg-surface-container rounded-2xl border border-outline-variant/20 text-left space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1.5">
                      <span className="text-on-surface-variant uppercase text-[11px]">Monto Abonado:</span>
                      <span className="font-bold text-secondary text-sm">+${abonoSuccess.amount.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1.5">
                      <span className="text-on-surface-variant uppercase text-[11px]">Método:</span>
                      <span className="font-bold text-on-surface">{abonoMethod}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1.5">
                      <span className="text-on-surface-variant uppercase text-[11px]">Deuda Restante:</span>
                      <span className={`font-bold ${abonoSuccess.remainingBalance > 0 ? 'text-error' : 'text-secondary'}`}>
                        ${abonoSuccess.remainingBalance.toFixed(2)} MXN
                      </span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-on-surface-variant uppercase text-[11px]">Nuevo Crédito Disp:</span>
                      <span className="font-bold text-primary text-xs">${abonoSuccess.newAvailable.toFixed(2)} MXN</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAbonoModalOpen(false);
                        setAbonoSuccess(null);
                      }}
                      className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-md cursor-pointer"
                    >
                      Aceptar y Volver a Ficha
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterAbono} className="flex flex-col">
                  <div className="p-4 sm:p-5 space-y-3">
                    {abonoError && (
                      <div className="p-2.5 bg-error/10 text-error border border-error/30 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                        <span className="material-symbols-outlined text-base shrink-0">error</span>
                        <span>{abonoError}</span>
                      </div>
                    )}

                    {/* Resumen de Deuda Actual */}
                    <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Deuda Total Pendiente</span>
                        <span className="font-mono text-lg font-black text-error">${selectedCustomer.current_balance.toFixed(2)} MXN</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-medium">Límite: ${selectedCustomer.credit_limit.toFixed(2)}</span>
                    </div>

                    {/* Campo de Monto */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Monto a Abonar ($ MXN) *
                        </label>
                        <button
                          type="button"
                          onClick={() => setAbonoAmount(selectedCustomer.current_balance.toString())}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Liquidar Todo (${selectedCustomer.current_balance.toFixed(2)})
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-mono font-bold text-base">$</span>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={selectedCustomer.current_balance}
                          value={abonoAmount}
                          onChange={(e) => setAbonoAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-surface-container-lowest border border-outline-variant/40 py-2 pl-8 pr-3 rounded-xl font-mono text-base font-bold text-primary outline-none focus:border-primary transition-all"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Selección de Método de Pago */}
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        Medio de Pago del Abono *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'Efectivo', label: 'Efectivo', icon: 'payments' },
                          { id: 'Tarjeta', label: 'Tarjeta', icon: 'credit_card' },
                          { id: 'Transferencia', label: 'Transferencia', icon: 'account_balance' }
                        ].map(method => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setAbonoMethod(method.id as any)}
                            className={`py-2 px-2 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                              abonoMethod === method.id 
                                ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30' 
                                : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{method.icon}</span>
                            <span className="text-[11px]">{method.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tarjetas de Indicación con Altura Uniforme y Compacta */}
                    {abonoMethod === 'Transferencia' ? (
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-primary/25 space-y-1.5 shadow-xs animate-slide-up">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-on-surface">
                            <span className="material-symbols-outlined text-primary text-base">account_balance</span>
                            <span className="text-xs">{storeSettings.bank_name || 'BBVA México'} (SPEI)</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant truncate max-w-[150px]">
                            {storeSettings.bank_beneficiary || 'Abarrotes & Super'}
                          </span>
                        </div>

                        <div className="bg-surface py-1.5 px-2.5 rounded-lg border border-outline-variant/30 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-primary tracking-wider">
                            {storeSettings.bank_clabe ? storeSettings.bank_clabe.replace(/(\d{4})/g, '$1 ').trim() : '0121 8000 1234 5678 90'}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyClabe}
                            className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[11px]">content_copy</span>
                            {copiedClabe ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>
                    ) : abonoMethod === 'Tarjeta' ? (
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg shrink-0">credit_card</span>
                        <p className="text-[11px] text-on-surface-variant leading-tight">
                          Cobra en la terminal de tarjetas y verifica el ticket aprobado.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg shrink-0">payments</span>
                        <p className="text-[11px] text-on-surface-variant leading-tight">
                          Recibe el dinero en efectivo e ingrésalo en la gaveta de caja.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="px-5 py-3.5 bg-surface border-t border-outline-variant/20 shrink-0 flex items-center justify-end gap-2.5 shadow-xs">
                    <button 
                      type="button"
                      onClick={() => setIsAbonoModalOpen(false)}
                      className="h-10 px-4 border border-outline-variant/40 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingAbono || !abonoAmount || parseFloat(abonoAmount) <= 0}
                      className="h-10 px-5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5 active:scale-98"
                    >
                      <span className="material-symbols-outlined text-base">check</span>
                      {isSubmittingAbono ? 'Aplicando...' : `Confirmar Abono de $${parseFloat(abonoAmount || '0').toFixed(2)}`}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>,
          document.body
        )}

        {/* Modal de Validación de NIP para Abonos */}
        <AuthModal
          isOpen={showAbonoAuthModal}
          onClose={() => setShowAbonoAuthModal(false)}
          onSuccess={(authorizerName) => executeConfirmedAbono(authorizerName)}
          title="Autorizar Abono con NIP"
          description={`Ingresa tu NIP de 4 dígitos para registrar el abono de $${parseFloat(abonoAmount || '0').toFixed(2)} MXN a la cuenta de ${selectedCustomer?.name || 'Cliente'}.`}
          allowedRoles={['admin', 'cashier', 'Administrador', 'Supervisor', 'Cajero', 'gerente']}
        />
      </main>
    </div>
  );
}
