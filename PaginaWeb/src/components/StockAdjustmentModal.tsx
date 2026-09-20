import { useState, useEffect } from 'react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    sku: string;
    name: string;
    stock: number;
    unit: string;
  } | null;
  onSave: (sku: string, newStock: number, reason: string) => void;
}

export function StockAdjustmentModal({ isOpen, onClose, product, onSave }: StockAdjustmentModalProps) {
  const [sku, setSku] = useState(product?.sku || '');
  const [productName, setProductName] = useState(product?.name || '');
  const [currentStock, setCurrentStock] = useState(product?.stock || 0);
  const [newStock, setNewStock] = useState(product?.stock?.toString() || '0');
  const [reason, setReason] = useState('Conteo Físico / Inventario');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const reasonOptions = [
    {
      id: 'Conteo Físico / Inventario',
      label: 'Conteo Físico / Auditoría',
      description: 'Conteo real en mostrador o anaquel',
      icon: 'inventory_2',
      color: 'text-primary bg-primary/10'
    },
    {
      id: 'Entrada de Mercancía sin Factura',
      label: 'Entrada de Mercancía',
      description: 'Recepción directa de proveedor o resurtido',
      icon: 'local_shipping',
      color: 'text-secondary bg-secondary/10'
    },
    {
      id: 'Corrección de Error de Captura',
      label: 'Corrección de Captura',
      description: 'Ajuste por equivocación previa en sistema',
      icon: 'edit_note',
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      id: 'Merma no Registrada',
      label: 'Merma / Desecho / Caducado',
      description: 'Producto dañado, roto o expirado',
      icon: 'delete_sweep',
      color: 'text-error bg-error/10'
    }
  ];

  const currentOption = reasonOptions.find(o => o.id === reason) || reasonOptions[0];

  useEffect(() => {
    if (product) {
      setSku(product.sku);
      setProductName(product.name);
      setCurrentStock(product.stock);
      setNewStock(product.stock.toString());
    } else {
      setSku('SKU-0014');
      setProductName('Café Tostado Origen Colombia');
      setCurrentStock(24.5);
      setNewStock('24.5');
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const newStockNum = parseFloat(newStock) || 0;
  const difference = newStockNum - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(sku, newStockNum, reason);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Box */}
      <div className="relative bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 border border-outline-variant/30 flex flex-col max-h-[90vh] animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-white">tune</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Ajuste Manual de Inventario</h2>
              <p className="text-xs text-white/70">Corrección de existencias por conteo o entrada</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {saved ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto animate-bounce">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">¡Inventario Ajustado con Éxito!</h3>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              Se actualizó el stock de <strong>{productName}</strong> a <strong>{newStockNum} unidades</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Product info */}
            <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{sku}</span>
                <span className="text-xs text-on-surface-variant">Stock Actual: <strong className="text-on-surface font-mono">{currentStock}</strong></span>
              </div>
              <p className="text-sm font-bold text-on-surface">{productName}</p>
            </div>

            {/* New Stock Input */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5 tracking-wider">
                  Nueva Existencia Real
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  autoFocus
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="relative">
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5 tracking-wider">
                  Motivo del Ajuste
                </label>
                
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-10 bg-surface-container-low hover:bg-surface-container px-3 rounded-xl border border-outline-variant/40 hover:border-primary/50 text-xs font-bold text-on-surface flex items-center justify-between transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${currentOption.color}`}>
                      <span className="material-symbols-outlined text-xs">{currentOption.icon}</span>
                    </span>
                    <span className="truncate">{currentOption.label}</span>
                  </div>
                  <span className={`material-symbols-outlined text-base text-on-surface-variant transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Custom Popover Menu */}
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 left-0 top-full mt-1.5 bg-surface rounded-2xl p-1.5 shadow-2xl border border-outline-variant/30 z-50 animate-[scale-in_0.15s_ease-out] space-y-1">
                      {reasonOptions.map(opt => {
                        const isSelected = opt.id === reason;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setReason(opt.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary/10 text-primary font-bold shadow-xs'
                                : 'hover:bg-surface-container text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${opt.color}`}>
                                <span className="material-symbols-outlined text-base">{opt.icon}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold leading-tight truncate">{opt.label}</p>
                                <p className="text-[10px] text-on-surface-variant/80 truncate mt-0.5">{opt.description}</p>
                              </div>
                            </div>

                            {isSelected && (
                              <span className="material-symbols-outlined text-primary text-base shrink-0 ml-2">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Difference Indicator */}
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex justify-between items-center">
              <span className="text-xs text-on-surface-variant font-medium">Diferencia calculada:</span>
              <span className={`font-mono text-sm font-bold ${difference > 0 ? 'text-secondary' : difference < 0 ? 'text-error' : 'text-on-surface'}`}>
                {difference > 0 ? `+${difference.toFixed(2)} (Incremento)` : difference < 0 ? `${difference.toFixed(2)} (Disminución)` : 'Sin cambio'}
              </span>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5 tracking-wider">
                Justificación / Notas (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalle o folio de conteo..."
                rows={2}
                className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Action buttons */}
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
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>Guardar Ajuste</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
