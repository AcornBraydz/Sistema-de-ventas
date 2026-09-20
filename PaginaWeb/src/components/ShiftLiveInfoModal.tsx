import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface ShiftLiveInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCashCloseModal: () => void;
}

interface ActiveShiftData {
  id: number;
  user_id: number | null;
  user_name: string;
  open_time: number;
  initial_fund: number;
  hourly_rate: number;
}

export function ShiftLiveInfoModal({ isOpen, onClose, onOpenCashCloseModal }: ShiftLiveInfoModalProps) {
  const [activeShift, setActiveShift] = useState<ActiveShiftData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentUser = useAuthStore.getState().user;

  const fetchActiveShift = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/cash-shifts/active`);
      if (res.ok) {
        const data = await res.json();
        if (data.active && data.shift) {
          setActiveShift(data.shift);
          const initialDiffSecs = Math.max(0, Math.floor((Date.now() - data.shift.open_time) / 1000));
          setElapsedSeconds(initialDiffSecs);
        } else {
          setActiveShift(null);
        }
      }
    } catch (e) {
      console.error('Error fetching active shift:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveShift();
    }
  }, [isOpen]);

  // Live timer interval updating every second
  useEffect(() => {
    if (!isOpen || !activeShift) return;

    const interval = setInterval(() => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - activeShift.open_time) / 1000));
      setElapsedSeconds(diffSecs);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, activeShift]);

  if (!isOpen) return null;

  // Format Elapsed Time
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const hoursDecimal = elapsedSeconds / 3600;
  const hourlyRate = activeShift?.hourly_rate || currentUser?.hourly_rate || 50.0;
  const currentEarnings = hoursDecimal * hourlyRate;

  const openDate = activeShift ? new Date(activeShift.open_time) : null;
  const openTimeFormatted = openDate ? openDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';
  const openDateFormatted = openDate ? openDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) : '';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden flex flex-col relative border border-outline-variant/20 animate-[scale-in_0.2s_ease-out] select-none">
        
        {/* Header (Fijo) */}
        <div className="p-3.5 sm:p-4 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-on-surface leading-tight">Información de Mi Turno</h3>
              <p className="text-[10px] text-on-surface-variant">Control de tiempo y ganancias en tiempo real</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content (Fijo sin scroll) */}
        <div className="p-3.5 sm:p-4 space-y-2.5">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
              <p className="text-xs font-bold">Consultando estado de turno...</p>
            </div>
          ) : activeShift ? (
            <>
              {/* Badge de Estatus Activo */}
              <div className="flex items-center justify-between bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface leading-tight">Turno en Curso (Caja Abierta)</p>
                    <p className="text-[9px] text-on-surface-variant capitalize">{openDateFormatted}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[9px] font-mono font-bold rounded-lg border border-secondary/30">
                  ACTIVO
                </span>
              </div>

              {/* Grid 2 Columnas: Cajero y Hora de Entrada */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/20">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Cajero Activo</span>
                  <p className="text-xs font-bold text-on-surface truncate">
                    {activeShift.user_name || currentUser?.name || 'Cajero'}
                  </p>
                  <p className="text-[9px] text-primary font-bold mt-0.5">
                    Tarifa: ${hourlyRate.toFixed(2)}/h
                  </p>
                </div>

                <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/20">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Hora de Apertura</span>
                  <p className="font-mono text-xs font-bold text-on-surface">
                    {openTimeFormatted}
                  </p>
                  <p className="text-[9px] text-on-surface-variant mt-0.5 truncate">
                    Fondo: ${(activeShift.initial_fund || 2000).toFixed(2)} MXN
                  </p>
                </div>
              </div>

              {/* CRONÓMETRO Y GANANCIA EN VIVO */}
              <div className="bg-surface-container-lowest p-3 rounded-2xl border-2 border-primary/20 shadow-xs space-y-2.5">
                {/* Tiempo Transcurrido */}
                <div className="text-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant block mb-1">
                    Tiempo Trabajado en Vivo
                  </span>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-on-surface tracking-tight flex items-center justify-center gap-1.5">
                    <span className="bg-surface-container px-2 py-0.5 rounded-lg">{String(hours).padStart(2, '0')}</span>
                    <span className="text-on-surface-variant text-lg">:</span>
                    <span className="bg-surface-container px-2 py-0.5 rounded-lg">{String(minutes).padStart(2, '0')}</span>
                    <span className="text-on-surface-variant text-lg">:</span>
                    <span className="bg-surface-container px-2 py-0.5 rounded-lg text-primary">{String(seconds).padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-center gap-6 text-[8px] font-bold text-on-surface-variant uppercase mt-0.5">
                    <span>Horas</span>
                    <span>Minutos</span>
                    <span>Segundos</span>
                  </div>
                </div>

                <div className="h-px bg-outline-variant/20"></div>

                {/* Ganancia Generada */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                    Generado hasta el momento:
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-xl font-black text-secondary tracking-tight">
                      +${currentEarnings.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-bold text-on-surface-variant ml-1">MXN</span>
                  </div>
                </div>
              </div>

              {/* Nota Explicativa */}
              <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/30 flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">info</span>
                <p className="text-[10px] text-on-surface-variant leading-tight">
                  Tu tiempo y pago se calculan automáticamente minuto a minuto hasta que presiones <strong className="text-on-surface">Confirmar Cierre</strong>.
                </p>
              </div>
            </>
          ) : (
            <div className="p-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
                <span className="material-symbols-outlined text-xl">storefront</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-on-surface">No hay un turno de caja abierto</h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5 max-w-xs mx-auto">
                  Para comenzar a contabilizar tu tiempo y ganancias, realiza la apertura de caja al iniciar tu jornada.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Fijo abajo) */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-between gap-2.5 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {activeShift && (
            <button 
              type="button"
              onClick={() => {
                onClose();
                onOpenCashCloseModal();
              }}
              className="px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white bg-error rounded-xl hover:bg-error/90 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Ir a Cierre de Caja</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
