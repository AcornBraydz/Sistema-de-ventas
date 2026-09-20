import { useState } from 'react';
import { usePosStore } from '../store/posStore';

interface WasteRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WasteRegistrationModal({ isOpen, onClose }: WasteRegistrationModalProps) {
  const { products } = usePosStore();
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<'Caducado' | 'Rotura / Empaque Dañado' | 'Merma Natural / Deshidratación' | 'Defecto de Fábrica'>('Rotura / Empaque Dañado');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.sku === selectedSku) || products[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setQuantity('1');
      setNotes('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Box */}
      <div className="relative bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 border border-outline-variant/30 flex flex-col max-h-[90vh] animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="bg-error text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-white">remove_shopping_cart</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Registro de Merma y Bajas</h2>
              <p className="text-xs text-white/80">Reportar producto roto, caducado o inservible</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto animate-bounce">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">¡Merma Registrada con Éxito!</h3>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              Se han descontado <strong>{quantity} {selectedProduct?.isBulk ? 'kg' : 'piezas'}</strong> de <strong>{selectedProduct?.name}</strong> por motivo de <strong>{reason}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Product Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5 tracking-wider">
                Seleccionar Producto
              </label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-error/20"
              >
                {products.map(p => (
                  <option key={p.sku} value={p.sku}>
                    {p.name} ({p.sku}) - ${p.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5 tracking-wider">
                  Cantidad a dar de baja
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step={selectedProduct?.isBulk ? "0.05" : "1"}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-error/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                    {selectedProduct?.isBulk ? 'KG' : 'PZA'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5 tracking-wider">
                  Motivo de la Merma
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-error/20"
                >
                  <option value="Rotura / Empaque Dañado">Rotura / Empaque Dañado</option>
                  <option value="Caducado">Caducado / Vencido</option>
                  <option value="Merma Natural / Deshidratación">Merma Natural / Peso</option>
                  <option value="Defecto de Fábrica">Defecto de Fábrica</option>
                </select>
              </div>
            </div>

            {/* Notes / Observation */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5 tracking-wider">
                Observaciones / Detalle (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ejemplo: Se cayó de la repisa al acomodar la mercancía..."
                rows={2}
                className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-error/20 resize-none"
              />
            </div>

            {/* Cost Preview */}
            <div className="bg-error/5 border border-error/20 rounded-2xl p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-error block">Pérdida Estimada</span>
                <span className="text-xs text-on-surface-variant">Costo total del producto merma</span>
              </div>
              <span className="font-mono text-lg font-black text-error">
                ${((parseFloat(quantity) || 0) * (selectedProduct?.price || 0)).toFixed(2)} MXN
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-error hover:bg-error/90 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Confirmar Baja</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
