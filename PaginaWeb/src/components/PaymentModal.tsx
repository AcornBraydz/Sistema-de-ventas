import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import { AuthModal } from './AuthModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: 'Efectivo' | 'Tarjeta' | 'Fiado' | 'Transferencia';
  onSelectMethod: (method: 'Efectivo' | 'Tarjeta' | 'Fiado' | 'Transferencia') => void;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  code: string;
  phone?: string;
  credit_limit: number;
  current_balance: number;
  credit: number;
  status: string;
}

export function PaymentModal({ isOpen, onClose, selectedMethod, onSelectMethod, total }: PaymentModalProps) {
  const { cart, clearCart, fetchProducts } = usePosStore();
  const [cashReceived, setCashReceived] = useState(() => total.toFixed(2));
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [ticketNum] = useState(() => Math.floor(1000 + Math.random() * 9000));
  
  // Handling Fiado / Mixed Payments / Deficits
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [storeSettings, setStoreSettings] = useState<{
    bank_name?: string;
    bank_beneficiary?: string;
    bank_clabe?: string;
  }>({});

  const loadCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDbCustomers(data.map((c: any) => ({
            id: c.id?.toString() || c.code,
            name: c.name,
            code: c.code,
            phone: c.phone || '',
            credit_limit: c.credit_limit || 0,
            current_balance: c.current_balance || 0,
            credit: Math.max(0, (c.credit_limit || 0) - (c.current_balance || 0)),
            status: c.status || 'Disponible'
          })));
        }
      }
    } catch (e) {
      console.error('Error fetching customers in PaymentModal:', e);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data) setStoreSettings(data);
      }
    } catch (e) {
      console.error('Error fetching settings in PaymentModal:', e);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadSettings();
  }, []);

  // Auto-fill with total amount whenever opened & always default to Efectivo
  useEffect(() => {
    if (isOpen) {
      onSelectMethod('Efectivo');
      setCashReceived(total.toFixed(2));
      setSelectedCustomer(null);
      setShowCustomerPicker(false);
      setCustomerSearch('');
      setModalError(null);
      loadCustomers();
      loadSettings();
    }
  }, [isOpen, total]);

  const receivedNum = parseFloat(cashReceived) || 0;
  const isDeficit = selectedMethod === 'Efectivo' && receivedNum < total && receivedNum > 0;
  const missingAmount = Math.max(0, total - receivedNum);
  const change = Math.max(0, receivedNum - total);

  // Billetes en circulación oficial en México (Familia G y F de Banxico)
  const mexicanBills = [20, 50, 100, 200, 500, 1000];

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Solo mostrar resultados cuando el usuario escribe (evitar mostrar todos)
  const filteredCustomers = (() => {
    const q = normalizeText(customerSearch);
    if (!q) return [];

    return dbCustomers.filter(c => {
      const nameNorm = normalizeText(c.name || '');
      const codeNorm = normalizeText(c.code || '');
      const phoneClean = (c.phone || '').replace(/\D/g, '');
      const qDigits = customerSearch.replace(/\D/g, '');

      if (q.length <= 2) {
        const stopWords = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'a'];
        const words = nameNorm.split(/[\s,.-]+/).filter(w => !stopWords.includes(w));
        const wordStarts = words.some(w => w.startsWith(q));
        const codeStarts = codeNorm.startsWith(q) || codeNorm.replace('cli-', '').startsWith(q);
        const phoneStarts = qDigits.length > 0 && phoneClean.startsWith(qDigits);
        return wordStarts || codeStarts || phoneStarts;
      }

      const words = nameNorm.split(/[\s,.-]+/);
      const wordStarts = words.some(w => w.startsWith(q));
      const nameIncludes = nameNorm.includes(q);
      const codeIncludes = codeNorm.includes(q);
      const phoneIncludes = qDigits.length > 0 && phoneClean.includes(qDigits);
      return wordStarts || nameIncludes || codeIncludes || phoneIncludes;
    });
  })();

  const fiadoAmount = selectedMethod === 'Fiado' ? total : isDeficit ? missingAmount : 0;
  const availableCredit = selectedCustomer ? Math.max(0, (selectedCustomer.credit_limit || 0) - (selectedCustomer.current_balance || 0)) : 0;
  const isCreditExceeded = selectedCustomer ? fiadoAmount > availableCredit : false;

  const handleCopyClabe = () => {
    if (storeSettings.bank_clabe) {
      navigator.clipboard.writeText(storeSettings.bank_clabe);
      setCopiedClabe(true);
      setTimeout(() => setCopiedClabe(false), 2500);
    }
  };

  const handleProcessSale = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setModalError(null);

    // Prevent submitting if insufficient funds and not fiado
    if (selectedMethod === 'Efectivo' && receivedNum < total && !selectedCustomer) {
      setModalError(`Monto insuficiente. Faltan $${missingAmount.toFixed(2)} MXN. Ingresa el dinero completo o selecciona a un cliente de confianza para fiar el restante.`);
      return;
    }

    // Validation for credit / fiado
    if (selectedMethod === 'Fiado' && !selectedCustomer) {
      setModalError('Debes seleccionar un cliente registrado para autorizar la venta a crédito.');
      return;
    }

    if (selectedCustomer && (selectedMethod === 'Fiado' || isDeficit)) {
      if (fiadoAmount > availableCredit) {
        setModalError(`No es posible venderle a crédito a "${selectedCustomer.name}": La cantidad a fiar ($${fiadoAmount.toFixed(2)} MXN) excede su crédito disponible restante ($${availableCredit.toFixed(2)} MXN). Su límite autorizado es de $${selectedCustomer.credit_limit.toFixed(2)} y su deuda actual es de $${selectedCustomer.current_balance.toFixed(2)}.`);
        return;
      }
    }

    // Solicitar NIP de 4 dígitos para confirmar la transacción
    setShowAuthModal(true);
  };

  const executeConfirmedSale = async (authorizerName?: string) => {
    setShowAuthModal(false);
    setModalError(null);

    try {
      const itemsPayload = cart.map(item => ({
        sku: item.sku || item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const cashierName = authorizerName || useAuthStore.getState().user?.name || 'Cajero';

      // First check & register the credit charge if applicable
      if (selectedCustomer && (selectedMethod === 'Fiado' || isDeficit)) {
        const chargeRes = await fetch(`${API_BASE_URL}/api/customers/${selectedCustomer.id}/charges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: fiadoAmount,
            concept: `Compra en mostrador Ticket #${ticketNum}`,
            items: cart.map(i => ({
              sku: i.sku || i.id,
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              isBulk: i.isBulk
            }))
          })
        });

        if (!chargeRes.ok) {
          const errData = await chargeRes.json().catch(() => ({}));
          setModalError(errData.error || 'No es posible autorizar el fiado por políticas de crédito del cliente.');
          return;
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total,
          method: selectedMethod,
          cashier: cashierName,
          items: itemsPayload
        })
      });

      if (res.ok) {
        setPaymentSuccess(true);
        // Refresh products to show new stock
        await fetchProducts();

        setTimeout(() => {
          setPaymentSuccess(false);
          clearCart();
          setCashReceived('');
          setSelectedCustomer(null);
          onClose();
        }, 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.error || 'Error al registrar la venta en la base de datos.');
      }
    } catch (error: any) {
      console.error('Error processing sale:', error);
      setModalError(error.message || 'Error de red al procesar la venta.');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/65 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      {/* Modal Container */}
      <div className="relative bg-surface w-full max-w-[500px] rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col my-auto max-h-[92vh] animate-[scale-in_0.2s_ease-out]">
        
        {/* Header Superior Principal */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-2xl text-white">
                {showCustomerPicker ? 'person_search' : 'point_of_sale'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                {showCustomerPicker ? 'Seleccionar Cliente para Fiado' : `Cobrar Venta • Ticket #${ticketNum}`}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {showCustomerPicker 
                  ? `Se cargarán $${(selectedMethod === 'Fiado' ? total : missingAmount).toFixed(2)} MXN a la cuenta del cliente` 
                  : 'Selecciona el método de pago'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (showCustomerPicker) {
                setShowCustomerPicker(false);
                if (!selectedCustomer) onSelectMethod('Efectivo');
              } else {
                onClose();
              }
            }} 
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer p-1.5"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar scrollbar-hide flex-1">
          {paymentSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center animate-bounce">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">¡Venta Registrada con Éxito!</h3>
              <p className="text-xs text-on-surface-variant max-w-xs">
                {selectedCustomer ? (
                  <>
                    Pago Mixto registrado: <strong>${receivedNum.toFixed(2)} en efectivo</strong> y <strong>${missingAmount.toFixed(2)} fiado</strong> a <strong>{selectedCustomer.name}</strong>.
                  </>
                ) : (
                  <>
                    Pago de <strong>${total.toFixed(2)} MXN</strong> registrado con <strong>{selectedMethod}</strong>.
                    {selectedMethod === 'Efectivo' && change > 0 && (
                      <span className="block text-secondary font-bold mt-1 text-sm">Cambio a entregar: ${change.toFixed(2)} MXN</span>
                    )}
                  </>
                )}
              </p>
              <div className="text-[11px] text-on-surface-variant font-mono mt-2 bg-surface-container px-3 py-1 rounded-full">
                Imprimiendo ticket de comprobante...
              </div>
            </div>
          ) : showCustomerPicker ? (
            /* Customer Picker View */
            <div className="space-y-3.5 animate-slide-up">
              {/* Tarjeta Informativa de Cargo */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">receipt_long</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Total a Fiar</span>
                    <span className="text-xs font-bold text-on-surface">Ticket #{ticketNum}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-black text-primary">
                    ${(selectedMethod === 'Fiado' ? total : missingAmount).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant ml-1">MXN</span>
                </div>
              </div>

              {/* Barra de Búsqueda */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setModalError(null);
                  }}
                  placeholder="Escribe el nombre o código del cliente..."
                  className="w-full bg-surface-container py-2.5 pl-10 pr-9 rounded-xl text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                  autoFocus
                />
                {customerSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerSearch('');
                      setModalError(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded-full hover:bg-surface-variant cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>

              {/* Lista de Clientes */}
              <div className="max-h-56 overflow-y-auto space-y-2 no-scrollbar scrollbar-hide pt-1">
                {dbCustomers.length === 0 ? (
                  <div className="py-6 text-center text-on-surface-variant text-xs space-y-1.5 bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/20">
                    <span className="material-symbols-outlined text-3xl text-primary/70 block mb-1">admin_panel_settings</span>
                    <p className="font-bold text-on-surface text-xs">No hay clientes de confianza registrados aún.</p>
                    <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                      Por favor, <strong>comunícate con el Administrador</strong> para registrar al cliente y autorizar su límite de crédito.
                    </p>
                  </div>
                ) : customerSearch.trim().length === 0 ? null : filteredCustomers.length === 0 ? (
                  <div className="py-6 text-center text-on-surface-variant text-xs bg-surface-container/30 rounded-2xl border border-outline-variant/10">
                    No se encontró ningún cliente registrado con "<strong>{customerSearch}</strong>".
                  </div>
                ) : (
                  filteredCustomers.map(cust => {
                    const chargeAmount = selectedMethod === 'Fiado' ? total : missingAmount;
                    const hasEnoughCredit = cust.credit >= chargeAmount;
                    const deficit = Math.max(0, chargeAmount - cust.credit);

                    return (
                      <div
                        key={cust.id}
                        onClick={() => {
                          if (!hasEnoughCredit) {
                            setModalError(`El cliente ${cust.name} solo tiene $${cust.credit.toFixed(2)} MXN de crédito disponible. Faltan $${deficit.toFixed(2)} MXN para cubrir este ticket.`);
                            return;
                          }
                          setSelectedCustomer(cust);
                          setShowCustomerPicker(false);
                          setModalError(null);
                        }}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          hasEnoughCredit 
                            ? 'border-outline-variant/30 hover:border-primary hover:bg-primary/5 bg-surface-container-low shadow-xs' 
                            : 'border-error/25 bg-error/5 hover:border-error/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                            hasEnoughCredit ? 'bg-primary/10 text-primary' : 'bg-error/15 text-error'
                          }`}>
                            <span className="material-symbols-outlined text-lg">
                              {hasEnoughCredit ? 'person' : 'person_cancel'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-bold text-on-surface truncate">{cust.name}</p>
                              <span className="bg-surface-container px-1.5 py-0.5 rounded font-mono text-[10px] text-on-surface-variant shrink-0">
                                {cust.code}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant">
                              <span>Límite: ${cust.credit_limit.toFixed(2)}</span>
                              <span>•</span>
                              <span className={hasEnoughCredit ? 'text-secondary font-bold' : 'text-error font-bold'}>
                                Disp: ${cust.credit.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {!hasEnoughCredit ? (
                            <div className="flex items-center gap-1 bg-error/15 text-error px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <span className="material-symbols-outlined text-xs">block</span>
                              <span>Insuficiente</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-secondary/15 text-secondary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <span className="material-symbols-outlined text-xs">add_circle</span>
                              <span>Elegir</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Resumen Total a Cobrar */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold block">Total a Cobrar</span>
                  <span className="text-[11px] text-on-surface-variant">Ticket #{ticketNum}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-black text-on-surface">
                    ${total.toFixed(2)}
                  </span>
                  <span className="text-xs font-sans font-bold text-on-surface-variant ml-1">MXN</span>
                </div>
              </div>

              {/* Selector de Medios de Pago */}
              <div>
                <label className="block text-[10px] font-label-caps uppercase font-bold text-on-surface-variant mb-2 tracking-wider">
                  Selecciona Medio de Pago
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMethod('Efectivo');
                      setSelectedCustomer(null);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedMethod === 'Efectivo'
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                        : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMethod === 'Efectivo' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-xl">payments</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Efectivo</p>
                      <p className="text-[10px] text-on-surface-variant">Billetes y monedas</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectMethod('Tarjeta');
                      setSelectedCustomer(null);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedMethod === 'Tarjeta'
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                        : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMethod === 'Tarjeta' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-xl">credit_card</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Tarjeta</p>
                      <p className="text-[10px] text-on-surface-variant">Débito o Crédito</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectMethod('Fiado');
                      loadCustomers();
                      setShowCustomerPicker(true);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedMethod === 'Fiado'
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                        : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMethod === 'Fiado' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-xl">receipt_long</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Fiado</p>
                      <p className="text-[10px] text-on-surface-variant">Cuenta del cliente</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectMethod('Transferencia');
                      setSelectedCustomer(null);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedMethod === 'Transferencia'
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                        : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMethod === 'Transferencia' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Transferencia</p>
                      <p className="text-[10px] text-on-surface-variant">SPEI / QR</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ficha de Cliente Seleccionado para 100% Fiado */}
              {selectedMethod === 'Fiado' && selectedCustomer && (
                <div className={`border rounded-2xl p-4 space-y-2.5 transition-all shadow-xs ${
                  isCreditExceeded 
                    ? 'bg-error/5 border-error/40' 
                    : 'bg-secondary/5 border-secondary/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isCreditExceeded ? 'bg-error/15 text-error' : 'bg-secondary/15 text-secondary'
                      }`}>
                        <span className="material-symbols-outlined text-xl">person</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{selectedCustomer.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono">Código: {selectedCustomer.code}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        loadCustomers();
                        setShowCustomerPicker(true);
                      }}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                    >
                      Cambiar
                    </button>
                  </div>

                  {/* Estado de Crédito del Cliente Seleccionado */}
                  <div className="pt-2 border-t border-outline-variant/15 text-xs">
                    {isCreditExceeded ? (
                      <div className="p-2.5 bg-error/10 text-error rounded-xl flex items-start gap-2 text-[11px] font-bold">
                        <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                        <div>
                          <span>Límite de Crédito Superado.</span>
                          <span className="block font-normal text-[10px] mt-0.5 leading-tight">
                            Este cliente solo cuenta con <strong>${availableCredit.toFixed(2)} MXN</strong> disponibles y la venta es de <strong>${fiadoAmount.toFixed(2)} MXN</strong>. No es posible autorizar el fiado.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-secondary font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          Crédito Disponible: ${availableCredit.toFixed(2)} MXN
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-normal">
                          Restarán: ${(availableCredit - fiadoAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN ESPECÍFICA: EFECTIVO */}
              {selectedMethod === 'Efectivo' && (
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                      ¿Con cuánto paga el cliente?
                    </label>
                    <button
                      type="button"
                      onClick={() => setCashReceived(total.toFixed(2))}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Pago Exacto (${total.toFixed(2)})
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xl text-on-surface-variant font-bold">$</span>
                    <input
                      type="number"
                      step="0.50"
                      className="w-full bg-surface py-2.5 pl-9 pr-3 rounded-xl font-mono text-xl text-on-surface font-black border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={cashReceived}
                      onChange={(e) => {
                        setCashReceived(e.target.value);
                      }}
                      placeholder={total.toFixed(2)}
                    />
                  </div>

                  {/* Billetes de México (Selección Rápida) */}
                  <div>
                    <span className="block text-[10px] font-label-caps uppercase text-primary font-bold mb-1.5 tracking-wider">
                      Billetes de México (Selección Rápida)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {mexicanBills.map(bill => (
                        <button
                          key={bill}
                          type="button"
                          onClick={() => {
                            setCashReceived(bill.toString());
                          }}
                          className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer flex flex-col items-center justify-center active:scale-95 shadow-xs ${
                            cashReceived === bill.toString()
                              ? 'bg-primary text-white border-primary ring-2 ring-primary/30 scale-105'
                              : 'bg-surface-container hover:bg-primary/10 text-on-surface border-outline-variant/30 hover:border-primary/40'
                          }`}
                        >
                          <span>${bill}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cálculo de Cambio o Deficit */}
                  {isDeficit ? (
                    <div className="space-y-2 pt-1">
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">warning</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-amber-900">Monto incompleto (Faltan ${missingAmount.toFixed(2)} MXN)</p>
                          <p className="text-[10px] text-amber-800/90 mt-0.5">
                            Se cobran ${receivedNum.toFixed(2)} en efectivo pero el total es ${total.toFixed(2)}.
                          </p>
                        </div>
                      </div>

                      {/* Opción de fiar diferencia */}
                      {selectedCustomer ? (
                        <div className={`border rounded-xl p-3 space-y-1.5 ${
                          isCreditExceeded ? 'bg-error/5 border-error/30' : 'bg-primary/5 border-primary/25'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className={`text-xs font-bold flex items-center gap-1 ${isCreditExceeded ? 'text-error' : 'text-primary'}`}>
                                <span className="material-symbols-outlined text-sm">{isCreditExceeded ? 'block' : 'how_to_reg'}</span>
                                Fiar ${missingAmount.toFixed(2)} a: {selectedCustomer.name}
                              </p>
                              <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                                Efectivo: ${receivedNum.toFixed(2)} • Restante a cuenta: ${missingAmount.toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(null)}
                              className="text-error hover:underline text-xs font-bold p-1 cursor-pointer"
                            >
                              Quitar
                            </button>
                          </div>
                          {isCreditExceeded && (
                            <p className="text-[10px] font-bold text-error">
                              ⚠️ Crédito insuficiente: Solo tiene ${availableCredit.toFixed(2)} disponibles.
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            loadCustomers();
                            setShowCustomerPicker(true);
                          }}
                          className="w-full py-2.5 px-3 bg-primary/10 hover:bg-primary/15 border border-primary/30 rounded-xl text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-base">person_add</span>
                          ¿Es cliente de confianza? Fiar los ${missingAmount.toFixed(2)} restantes
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2.5 border-t border-outline-variant/15 flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cambio a entregar:</span>
                      <span className="font-mono text-2xl font-black text-secondary">
                        ${change.toFixed(2)} <span className="text-xs font-sans text-on-surface-variant font-normal">MXN</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN ESPECÍFICA: TARJETA */}
              {selectedMethod === 'Tarjeta' && (
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">contactless</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Cobro con Terminal Bancaria</h4>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-xs mx-auto">
                      Inserta, desliza o acerca la tarjeta en la terminal por:
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container rounded-xl font-mono text-2xl font-black text-primary">
                    ${total.toFixed(2)} <span className="text-xs font-sans text-on-surface-variant">MXN</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Una vez aprobado el voucher en la terminal, pulsa <strong>«Confirmar Cobro»</strong>.
                  </p>
                </div>
              )}

              {/* SECCIÓN ESPECÍFICA: TRANSFERENCIA SPEI */}
              {selectedMethod === 'Transferencia' && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg border border-slate-700 space-y-3 animate-slide-up">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Datos Bancarios para SPEI</span>
                      <span className="font-bold text-base text-emerald-400">{storeSettings.bank_name || 'BBVA México'}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-2xl">account_balance</span>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">CLABE Interbancaria</span>
                      <span className="font-mono text-sm tracking-wider font-bold text-white">
                        {storeSettings.bank_clabe ? storeSettings.bank_clabe.replace(/(\d{4})/g, '$1 ').trim() : '0121 8000 1234 5678 90'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyClabe}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      {copiedClabe ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-slate-700/60 pt-2">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Titular / Beneficiario</span>
                      <span className="font-semibold text-slate-200">{storeSettings.bank_beneficiary || 'Abarrotes & Super El Barrio'}</span>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-300 text-sm">
                      ${total.toFixed(2)} MXN
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Error message */}
        {modalError && (
          <div className="mx-5 my-2 p-3 bg-error/10 border border-error/30 text-error rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-slide-up shadow-xs">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span className="leading-tight flex-1">{modalError}</span>
            <button 
              type="button" 
              onClick={() => setModalError(null)} 
              className="p-1 hover:bg-error/10 rounded-full cursor-pointer text-error transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Footer for Customer Picker View */}
        {showCustomerPicker && !paymentSuccess && (
          <div className="px-6 py-3.5 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between shrink-0">
            <span className="text-xs text-on-surface-variant font-medium">
              {filteredCustomers.length > 0 ? `${filteredCustomers.length} coincidencia(s)` : 'Clientes de confianza'}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowCustomerPicker(false);
                if (!selectedCustomer) onSelectMethod('Efectivo');
                setModalError(null);
              }}
              className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
            >
              Volver
            </button>
          </div>
        )}

        {/* Modal Actions Footer for Payment Methods View */}
        {!paymentSuccess && !showCustomerPicker && (
          <div className="px-6 py-4 bg-surface border-t border-outline-variant/20 shrink-0 flex gap-3 shadow-md">
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-6 border border-outline-variant/40 text-on-surface hover:bg-surface-container font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Regresar
            </button>
            <button
              type="button"
              disabled={(isDeficit && !selectedCustomer) || (selectedMethod === 'Fiado' && !selectedCustomer) || isCreditExceeded}
              onClick={() => handleProcessSale()}
              className={`flex-1 h-12 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 ${
                isCreditExceeded
                  ? 'bg-error/80 text-white cursor-not-allowed opacity-90'
                  : (isDeficit && !selectedCustomer) || (selectedMethod === 'Fiado' && !selectedCustomer)
                  ? 'bg-outline-variant/40 text-on-surface-variant cursor-not-allowed opacity-60'
                  : selectedCustomer && isDeficit
                  ? 'bg-tertiary hover:bg-tertiary/90 cursor-pointer'
                  : 'bg-primary hover:bg-primary/90 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {isCreditExceeded ? 'block' : 'check'}
              </span>
              {isCreditExceeded
                ? '🚫 Límite Excedido (No se puede fiar)'
                : isDeficit && selectedCustomer
                ? `Cobrar $${receivedNum.toFixed(2)} + Fiar $${missingAmount.toFixed(2)}`
                : isDeficit
                ? `Faltan $${missingAmount.toFixed(2)} MXN`
                : 'Confirmar Cobro'}
            </button>
          </div>
        )}
      </div>

      {/* NIP Authentication Modal for Confirming Transactions */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(authorizerName) => executeConfirmedSale(authorizerName)}
        title="Confirmar Cobro con NIP"
        description={`Ingresa tu NIP de 4 dígitos para autorizar y registrar la venta por $${total.toFixed(2)} MXN (${selectedMethod}).`}
        allowedRoles={['admin', 'cashier', 'Administrador', 'Supervisor', 'Cajero', 'gerente']}
      />
    </div>,
    document.body
  );
}
