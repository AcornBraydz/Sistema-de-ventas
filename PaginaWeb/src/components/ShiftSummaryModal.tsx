import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AuthModal } from './AuthModal';
import { useNavigate } from 'react-router-dom';
import { useLiveDateTime } from '../hooks/useLiveDateTime';
import { useAuthStore } from '../store/authStore';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShiftSummaryModal({ isOpen, onClose }: ShiftSummaryModalProps) {
  const [cutType, setCutType] = useState<'X' | 'Z'>('X');
  const [showAuth, setShowAuth] = useState(false);
  const [authAction, setAuthAction] = useState<'aperture' | 'close'>('close');
  const [printFeedback, setPrintFeedback] = useState(false);
  const { dateNumeric, time24 } = useLiveDateTime();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const [activeShift, setActiveShift] = useState<{
    active: boolean;
    shift: {
      id: number;
      user_name: string;
      open_time: number;
      initial_fund: number;
    } | null;
  }>({ active: false, shift: null });

  const [salesSummary, setSalesSummary] = useState({
    cashSales: 0,
    cashCount: 0,
    cardSales: 0,
    cardCount: 0,
    creditSales: 0,
    creditCount: 0,
    totalSales: 0
  });

  const fetchShiftAndSales = async () => {
    try {
      // 1. Shift active status
      const shiftRes = await fetch(`${API_BASE_URL}/api/cash-shifts/active`);
      if (shiftRes.ok) {
        const sData = await shiftRes.json();
        setActiveShift(sData);
      }
      // 2. Real sales from DB
      const salesRes = await fetch(`${API_BASE_URL}/api/sales`);
      if (salesRes.ok) {
        const sales: any[] = await salesRes.json();
        const todayStr = new Date().toLocaleDateString('en-CA');
        const todaySales = sales.filter(s => new Date(s.timestamp).toLocaleDateString('en-CA') === todayStr);
        
        const cashList = todaySales.filter(s => s.payment_method === 'Efectivo');
        const cardList = todaySales.filter(s => s.payment_method === 'Tarjeta');
        const creditList = todaySales.filter(s => s.payment_method === 'Fiado');

        const cashSales = cashList.reduce((sum, s) => sum + (s.total || 0), 0);
        const cardSales = cardList.reduce((sum, s) => sum + (s.total || 0), 0);
        const creditSales = creditList.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalSales = cashSales + cardSales + creditSales;

        setSalesSummary({
          cashSales,
          cashCount: cashList.length,
          cardSales,
          cardCount: cardList.length,
          creditSales,
          creditCount: creditList.length,
          totalSales
        });
      }
    } catch (err) {
      console.error('Error fetching shift/sales:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchShiftAndSales();
    }
  }, [isOpen]);

  const initialFund = activeShift.active ? (activeShift.shift?.initial_fund || 2000.00) : 2000.00;
  const isShiftOpen = activeShift.active;
  const openTimeStr = activeShift.shift?.open_time 
    ? new Date(activeShift.shift.open_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) 
    : '';

  const cashierDisplayName = activeShift.shift?.user_name || user?.name || 'Cajero';

  // Cálculos dinámicos diferenciados
  const cashInDrawer = initialFund + salesSummary.cashSales;
  const totalShiftSales = salesSummary.totalSales;

  const handlePrintOnly = () => {
    setPrintFeedback(true);
    window.print();
    setTimeout(() => {
      setPrintFeedback(false);
    }, 2000);
  };

  const [confirmedState, setConfirmedState] = useState<{
    type: 'aperture' | 'close';
    cashierName: string;
    fund?: number;
    cashDelivered?: number;
    hoursWorked?: number;
    totalPayout?: number;
    timeStr: string;
  } | null>(null);

  const handleOpenAuth = () => {
    if (cutType === 'X') {
      setAuthAction('aperture');
    } else {
      setAuthAction('close');
    }
    setShowAuth(true);
  };

  const handleAuthSuccess = async (authorizerName?: string) => {
    const cashierName = authorizerName || user?.name || 'Cajero';
    const nowStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    if (authAction === 'aperture') {
      try {
        await fetch(`${API_BASE_URL}/api/cash-shifts/open`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: cashierName,
            initial_fund: initialFund
          })
        });
        await fetchShiftAndSales();
      } catch (e) {
        console.error('Error registrando apertura:', e);
      }

      setConfirmedState({
        type: 'aperture',
        cashierName,
        fund: initialFund,
        timeStr: nowStr
      });
    } else {
      let hoursWorked = 0;
      let totalPayout = 0;
      try {
        const res = await fetch(`${API_BASE_URL}/api/cash-shifts/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: cashierName,
            total_sales: cashInDrawer
          })
        });
        if (res.ok) {
          const data = await res.json();
          hoursWorked = data.hours_worked || 0;
          totalPayout = data.total_payout || 0;
        }
        await fetchShiftAndSales();
      } catch (e) {
        console.error('Error registrando cierre:', e);
      }

      setConfirmedState({
        type: 'close',
        cashierName,
        cashDelivered: cashInDrawer,
        hoursWorked,
        totalPayout,
        timeStr: nowStr
      });
    }
  };

  const handleDismissConfirmation = () => {
    const isClose = confirmedState?.type === 'close';
    setConfirmedState(null);
    onClose();
    if (isClose) {
      navigate('/');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end animate-[fade-in_0.2s_ease-out]">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        ></div>

        {/* Sheet Container */}
        <div className="w-full max-w-[580px] bg-surface z-50 shadow-2xl flex flex-col h-full animate-[slide-in-right_0.3s_ease-out] border-l border-outline-variant/30 overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low shrink-0">
            <div>
              <h2 className="text-xl font-bold text-on-surface tracking-tight">
                {cutType === 'X' ? 'Revisión y Apertura de Caja' : 'Cierre de Turno y Arqueo'}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                {cutType === 'X' ? 'Consulta de ventas acumuladas y fondo de caja' : 'Verificación física y entrega de caja'}
              </p>
            </div>
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
              onClick={onClose}
              title="Cerrar ventana"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Simple Selector Cards */}
          <div className="p-4 sm:p-5 bg-surface-container-lowest border-b border-outline-variant/20 grid grid-cols-2 gap-3.5 shrink-0">
            <button 
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                cutType === 'X' 
                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                  : 'border-outline-variant/30 hover:bg-surface-container/60 text-on-surface-variant'
              }`}
              onClick={() => setCutType('X')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">visibility</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                  isShiftOpen ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary'
                }`}>
                  {isShiftOpen ? 'TURNO ACTIVO' : 'CORTE X'}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-on-surface">1. Ver Cómo Voy</p>
              <p className="text-xs text-on-surface-variant mt-1 leading-snug">
                {isShiftOpen ? 'Revisar dinero acumulado en tiempo real.' : 'Fondo inicial y apertura de caja.'}
              </p>
            </button>

            <button 
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                cutType === 'Z' 
                  ? 'border-error bg-error/5 shadow-sm ring-1 ring-error/20' 
                  : 'border-outline-variant/30 hover:bg-surface-container/60 text-on-surface-variant'
              }`}
              onClick={() => setCutType('Z')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-error text-2xl">lock</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error uppercase tracking-wider font-mono">
                  CORTE Z
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-on-surface">2. Cerrar y Salir</p>
              <p className="text-xs text-on-surface-variant mt-1 leading-snug">
                Contar efectivo y cerrar caja con tu NIP.
              </p>
            </button>
          </div>

          {/* Body Content */}
          <div 
            tabIndex={0}
            className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-4 no-scrollbar scrollbar-hide focus:outline-none"
          >
            
            {/* Context Alert Banner */}
            {cutType === 'Z' ? (
              <div className="bg-error-container/40 text-on-error-container p-4 rounded-2xl flex gap-3 border border-error/20">
                <span className="material-symbols-outlined text-error shrink-0 text-2xl mt-0.5">lock_clock</span>
                <div>
                  <p className="text-xs font-bold text-on-error-container uppercase tracking-wide">Cierre de Turno / Entrega de Caja</p>
                  <p className="text-xs mt-1 text-on-error-container leading-relaxed">
                    Cuenta físicamente el dinero en el cajón para verificar que coincida con el monto registrado. Al presionar Confirmar Cierre, ingresarás tu NIP.
                  </p>
                </div>
              </div>
            ) : isShiftOpen ? (
              <div className="bg-secondary/10 text-secondary p-4 rounded-2xl flex items-center gap-3 border border-secondary/20">
                <span className="material-symbols-outlined text-secondary shrink-0 text-2xl">check_circle</span>
                <p className="text-xs leading-relaxed text-on-surface font-medium">
                  <strong>Apertura de turno activa:</strong> Registrada a las <strong>{openTimeStr || time24} hrs</strong> con fondo inicial de <strong>${initialFund.toFixed(2)} MXN</strong>. La caja está en operación normal.
                </p>
              </div>
            ) : (
              <div className="bg-primary/10 text-primary p-4 rounded-2xl flex items-center gap-3 border border-primary/20">
                <span className="material-symbols-outlined text-primary shrink-0 text-2xl">info</span>
                <p className="text-xs leading-relaxed text-on-surface font-medium">
                  <strong>Apertura de caja pendiente:</strong> Confirma la recepción del fondo inicial de <strong>${initialFund.toFixed(2)} MXN</strong> ingresando tu NIP para iniciar tu turno de nómina.
                </p>
              </div>
            )}

            {/* Operator and Shift Meta */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                  {cashierDisplayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-on-surface font-bold">{cashierDisplayName}</p>
                  <p className="text-xs text-on-surface-variant font-mono">{dateNumeric} • {time24}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] bg-surface-container-high px-3 py-1 rounded-full text-on-surface font-semibold uppercase tracking-wider">
                  Caja 01 • {isShiftOpen ? 'En Operación' : 'Por Abrir'}
                </span>
              </div>
            </div>

            {/* Breakdown Cards */}
            <div className="space-y-3.5 pt-1">
              
              {/* Card 1: Dinero en Efectivo */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container/40 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">payments</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      {cutType === 'Z' 
                        ? 'Efectivo Total a Entregar' 
                        : (isShiftOpen ? 'Efectivo en Cajón' : 'Fondo Inicial de Apertura')}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {cutType === 'Z'
                        ? `Fondo ($${initialFund.toFixed(2)}) + ${salesSummary.cashCount} Ventas en Efectivo`
                        : (isShiftOpen 
                            ? `Fondo ($${initialFund.toFixed(2)}) + ${salesSummary.cashCount} Ventas en Efectivo` 
                            : 'Fondo para dar cambio listo')}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                    ${(isShiftOpen || cutType === 'Z' ? cashInDrawer : initialFund).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Card 2: Tarjetas */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">credit_card</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">Cobros con Tarjeta</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {salesSummary.cardCount} {salesSummary.cardCount === 1 ? 'Transacción en Terminal' : 'Transacciones en Terminal'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                    ${salesSummary.cardSales.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Card 3: Fiado */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed/40 text-tertiary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">receipt_long</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">Fiado / Cuentas por Cobrar</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {salesSummary.creditCount} {salesSummary.creditCount === 1 ? 'Compra a Crédito' : 'Compras a Crédito'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                    ${salesSummary.creditSales.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback alert on Print */}
            {printFeedback && (
              <div className="bg-secondary text-on-secondary p-3.5 rounded-xl text-center text-xs font-semibold animate-[fade-in_0.2s_ease-out] shadow-md flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">print</span>
                <span>Comprobante de corte enviado a la impresora...</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 sm:p-6 border-t border-outline-variant/30 bg-surface-container-lowest space-y-3.5 shrink-0">
            <div className="flex items-center justify-between gap-4 px-1">
              <span className="text-xs sm:text-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {cutType === 'X' && !isShiftOpen ? 'Fondo Inicial de Caja:' : 'Total Vendido en el Turno:'}
              </span>
              <span className="font-mono text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight shrink-0">
                ${(cutType === 'X' && !isShiftOpen ? initialFund : totalShiftSales).toFixed(2)}
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Botón 1: Volver */}
              <button 
                type="button"
                className="h-12 px-5 bg-surface-container hover:bg-surface-variant text-on-surface text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-outline-variant/30 flex items-center justify-center font-bold shrink-0"
                onClick={onClose}
              >
                Volver
              </button>

              {/* Botón 2: Confirmar Apertura (Bloqueado si ya se confirmó) / Confirmar Cierre */}
              {cutType === 'X' ? (
                isShiftOpen ? (
                  <button 
                    type="button"
                    disabled={true}
                    className="flex-1 h-12 px-4 bg-secondary/15 text-secondary border border-secondary/30 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-90 select-none shadow-xs"
                    title="La apertura de caja ya fue realizada para este turno"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>Apertura Confirmada ({openTimeStr || 'Activa'})</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    className="flex-1 h-12 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                    onClick={handleOpenAuth}
                  >
                    <span className="material-symbols-outlined text-lg">verified</span>
                    <span>Confirmar Apertura</span>
                  </button>
                )
              ) : (
                <button 
                  type="button"
                  className="flex-1 h-12 px-4 bg-error hover:bg-error/90 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                  onClick={handleOpenAuth}
                >
                  <span className="material-symbols-outlined text-lg">lock</span>
                  <span>Confirmar Cierre</span>
                </button>
              )}

              {/* Botón 3: Imprimir (Solo Icono) */}
              <button 
                type="button"
                className="w-12 h-12 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl transition-all border border-outline-variant/30 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm shrink-0"
                onClick={handlePrintOnly}
                title="Imprimir Comprobante de Caja"
              >
                <span className="material-symbols-outlined text-xl">print</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modal asking for cashier/supervisor NIP */}
      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        title={authAction === 'aperture' ? 'Confirmar Apertura de Turno' : 'Confirmar Cierre de Turno'}
        description={
          authAction === 'aperture'
            ? `Ingrese su NIP de 4 dígitos para confirmar la recepción de la caja con fondo de $${initialFund.toFixed(2)} MXN.`
            : `Ingrese su NIP de 4 dígitos para autorizar el cierre definitivo de la caja.`
        }
        allowedRoles={['Administrador', 'Supervisor', 'Cajero']}
      />

      {/* In-App Confirmation Modal */}
      {confirmedState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/30 text-center animate-slide-up flex flex-col items-center">

            <h3 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">
              {confirmedState.type === 'aperture' ? '¡Apertura de Turno Registrada!' : '¡Turno Cerrado con Éxito!'}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-xs mb-6">
              {confirmedState.type === 'aperture'
                ? 'La hora de entrada y el fondo inicial han sido vinculados a tu nómina y turno de caja.'
                : 'La entrega de efectivo y las horas trabajadas han sido registradas en tu nómina.'}
            </p>

            <div className="w-full bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-2.5 text-xs text-left mb-6">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-bold uppercase text-[10px]">Cajero / Personal:</span>
                <span className="font-bold text-on-surface">{confirmedState.cashierName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-bold uppercase text-[10px]">Hora de Registro:</span>
                <span className="font-mono font-bold text-on-surface">{confirmedState.timeStr} hrs</span>
              </div>

              {confirmedState.type === 'aperture' ? (
                <div className="flex justify-between items-center border-t border-outline-variant/20 pt-2.5">
                  <span className="text-on-surface-variant font-bold uppercase text-[10px]">Fondo Inicial Verificado:</span>
                  <span className="font-mono font-bold text-secondary text-sm">${confirmedState.fund?.toFixed(2)} MXN</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center border-t border-outline-variant/20 pt-2.5">
                    <span className="text-on-surface-variant font-bold uppercase text-[10px]">Horas Trabajadas:</span>
                    <span className="font-mono font-bold text-on-surface text-sm">{confirmedState.hoursWorked} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant font-bold uppercase text-[10px]">Sueldo Ganado en Turno:</span>
                    <span className="font-mono font-bold text-primary text-sm">${confirmedState.totalPayout?.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant font-bold uppercase text-[10px]">Efectivo Entregado:</span>
                    <span className="font-mono font-bold text-on-surface">${confirmedState.cashDelivered?.toFixed(2)} MXN</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleDismissConfirmation}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Aceptar y Continuar
            </button>
          </div>
        </div>
      )}

      {/* Printable Voucher for Corte X / Corte Z rendered into body for print isolation */}
      {createPortal(
        <div id="printable-cut" className="font-mono text-[11px] leading-tight text-black bg-white">
          <div className="text-center pb-2 border-b border-black mb-2">
            <p className="font-bold text-sm">HERITAGE TERMINAL</p>
            <p className="text-[10px]">Av. Principal 1234, Ciudad</p>
            <p className="text-[10px]">RFC: HTR-123456-ABC</p>
            <p className="text-[10px]">Tel: (555) 123-4567</p>
            <p className="font-bold text-xs mt-1.5 uppercase tracking-wide">
              {cutType === 'Z' ? '*** CORTE Z - CIERRE DE TURNO ***' : '*** CORTE X - REVISIÓN DE CAJA ***'}
            </p>
          </div>

          {/* Shift Meta */}
          <div className="space-y-0.5 pb-2 border-b border-dashed border-black mb-2 text-[10px]">
            <div className="flex justify-between">
              <span>FECHA:</span>
              <span className="font-bold">{dateNumeric}</span>
            </div>
            <div className="flex justify-between">
              <span>HORA IMPRESIÓN:</span>
              <span className="font-bold">{time24}</span>
            </div>
            <div className="flex justify-between">
              <span>CAJERO:</span>
              <span className="font-bold">{cashierDisplayName}</span>
            </div>
            <div className="flex justify-between">
              <span>ESTADO CAJA:</span>
              <span className="font-bold">{cutType === 'Z' ? 'CERRADA' : (isShiftOpen ? 'ABIERTA' : 'POR ABRIR')}</span>
            </div>
            {openTimeStr && (
              <div className="flex justify-between">
                <span>HORA APERTURA:</span>
                <span>{openTimeStr} hrs</span>
              </div>
            )}
          </div>

          {/* Desglose de Ventas del Turno */}
          <div className="mb-2 pb-2 border-b border-dashed border-black text-[10px]">
            <p className="font-bold text-center mb-1 uppercase">--- DESGLOSE DE VENTAS ---</p>
            <div className="flex justify-between py-0.5">
              <span>VENTAS EFECTIVO ({salesSummary.cashCount}):</span>
              <span className="font-bold">${salesSummary.cashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>COBROS TARJETA ({salesSummary.cardCount}):</span>
              <span className="font-bold">${salesSummary.cardSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>CRÉDITO / FIADO ({salesSummary.creditCount}):</span>
              <span className="font-bold">${salesSummary.creditSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-black pt-1 mt-1 text-[11px]">
              <span>TOTAL VENTAS TURNO:</span>
              <span>${totalShiftSales.toFixed(2)}</span>
            </div>
          </div>

          {/* Arqueo de Efectivo en Cajón */}
          <div className="mb-3 pb-2 border-b border-black text-[10px]">
            <p className="font-bold text-center mb-1 uppercase">--- ARQUEO DE EFECTIVO ---</p>
            <div className="flex justify-between py-0.5">
              <span>FONDO INICIAL:</span>
              <span>${initialFund.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>(+) EFECTIVO RECAUDADO:</span>
              <span>${salesSummary.cashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs border-t border-black pt-1 mt-1">
              <span>{cutType === 'Z' ? 'EFECTIVO A ENTREGAR:' : 'EFECTIVO EN CAJÓN:'}</span>
              <span>${cashInDrawer.toFixed(2)}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-3 text-center text-[10px] space-y-4">
            <div>
              <p className="border-b border-black w-40 mx-auto mb-0.5"></p>
              <p className="font-bold">FIRMA DEL CAJERO</p>
              <p className="text-[9px]">{cashierDisplayName}</p>
            </div>
            <div>
              <p className="border-b border-black w-40 mx-auto mb-0.5"></p>
              <p className="font-bold">SUPERVISOR / RECIBIÓ</p>
            </div>
            <p className="text-[9px] italic mt-2">Comprobante oficial de entrega y corte de caja</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

