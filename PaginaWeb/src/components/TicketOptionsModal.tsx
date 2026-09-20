import { useState } from 'react';
import { usePosStore } from '../store/posStore';

interface TicketOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TicketOptionsModal({ isOpen, onClose }: TicketOptionsModalProps) {
  const { cart } = usePosStore();
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    setPrintStatus('Enviando orden a impresora térmica...');
    window.print();
    setTimeout(() => {
      setPrintStatus('¡Ticket impreso correctamente!');
      setTimeout(() => {
        setPrintStatus(null);
        onClose();
      }, 1200);
    }, 1500);
  };

  const handleShare = () => {
    setPrintStatus('Generando ticket digital...');
    setTimeout(() => {
      setPrintStatus('¡Comprobante copiado al portapapeles!');
      setTimeout(() => {
        setPrintStatus(null);
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Box */}
      <div className="relative bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 border border-outline-variant/30 flex flex-col max-h-[90vh] animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-white">receipt</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Opciones del Ticket</h2>
              <p className="text-xs text-white/70">Reimpresión y comprobante de venta</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {printStatus ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto animate-pulse">
                <span className="material-symbols-outlined text-3xl">print</span>
              </div>
              <p className="text-sm font-bold text-on-surface">{printStatus}</p>
            </div>
          ) : (
            <>
              {/* Ticket Preview Card */}
              <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-2xl p-4 font-mono text-xs space-y-2">
                <div className="text-center border-b border-outline-variant/30 pb-2">
                  <p className="font-bold text-sm">ABARROTES LA ESPERANZA</p>
                  <p className="text-[10px] text-on-surface-variant">RFC: XAXX010101000 • SUCURSAL MATRIZ</p>
                  <p className="text-[10px] text-on-surface-variant">Ticket #4829 • Caja 04</p>
                </div>

                <div className="space-y-1 py-1">
                  {cart.length === 0 ? (
                    <p className="text-center text-on-surface-variant italic py-2">Última venta: Coca-Cola 600ml ($18.00)</p>
                  ) : (
                    cart.map(item => (
                      <div key={item.sku} className="flex justify-between">
                        <span className="truncate max-w-[180px]">{item.quantity}x {item.name}</span>
                        <span>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-outline-variant/30 pt-2 flex justify-between font-bold text-sm">
                  <span>TOTAL PAGADO:</span>
                  <span>${cart.reduce((s, i) => s + i.price * (i.quantity || 1), 0).toFixed(2)} MXN</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">print</span>
                  <span>Reimprimir Ticket Térmico (58mm / 80mm)</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-outline-variant/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">share</span>
                  <span>Copiar Comprobante Digital (WhatsApp / Mensaje)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container border-t border-outline-variant/30 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface text-on-surface border border-outline-variant/40 hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
