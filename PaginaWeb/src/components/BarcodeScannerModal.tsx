import { useState } from 'react';
import { usePosStore } from '../store/posStore';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const { products } = usePosStore();
  const [manualCode, setManualCode] = useState('');

  if (!isOpen) return null;

  const handleSimulateScan = (sku: string) => {
    onScan(sku);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
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
              <span className="material-symbols-outlined text-2xl text-white">barcode_scanner</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Lector de Código de Barras</h2>
              <p className="text-xs text-white/70">Escáner USB / Cámara o Ingreso Manual</p>
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
          {/* Scanner Animation Card */}
          <div className="bg-surface-container-low border border-primary/20 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
            <div className="w-full h-1 bg-primary/40 absolute top-0 left-0 animate-[pulse_1.5s_infinite]"></div>
            <span className="material-symbols-outlined text-4xl text-primary animate-bounce">barcode</span>
            <p className="text-xs font-bold text-on-surface">Escáner de código de barras activo</p>
            <p className="text-[11px] text-on-surface-variant">Pasa el producto frente a tu lector láser o pistola USB.</p>
          </div>

          {/* Manual Barcode Form */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">
              Ingresar Código de Barras Manual
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej. 7501055301234"
                className="flex-1 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </form>

          {/* Quick Scan Test Chips */}
          <div>
            <span className="block text-[10px] font-bold uppercase text-on-surface-variant mb-2 tracking-wider">
              Simulación de Escaneo Rápido
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar scrollbar-hide">
              {products.slice(0, 5).map(p => (
                <button
                  key={p.sku}
                  type="button"
                  onClick={() => handleSimulateScan(p.sku)}
                  className="w-full p-2 rounded-xl bg-surface-container hover:bg-primary/10 hover:border-primary/40 border border-outline-variant/20 transition-all text-left flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface truncate">{p.name}</p>
                    <p className="text-[10px] font-mono text-on-surface-variant">{p.sku}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-base">qr_code_scanner</span>
                </button>
              ))}
            </div>
          </div>
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
