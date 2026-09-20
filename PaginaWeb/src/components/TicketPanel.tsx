import { useState, Fragment } from 'react';
import { usePosStore } from '../store/posStore';
import { AuthModal } from './AuthModal';
import { PaymentModal } from './PaymentModal';
import { TicketOptionsModal } from './TicketOptionsModal';

export function TicketPanel() {
  const { cart, removeItem, clearCart, updateItemQuantity } = usePosStore();
  
  const [authAction, setAuthAction] = useState<{ type: 'delete' | 'clear', payload?: string } | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTicketOptions, setShowTicketOptions] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'Efectivo' | 'Tarjeta' | 'Fiado' | 'Transferencia'>('Efectivo');
  
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [tempQty, setTempQty] = useState('');

  const subtotal = cart.reduce((sum, item) => {
    const qty = item.isBulk ? (item.weight || 1) : item.quantity;
    return sum + (item.price * qty);
  }, 0);
  
  const tax = subtotal * 0.16; // 16% tax example
  const total = subtotal + tax;

  const handleDeleteItem = (sku: string) => {
    setAuthAction({ type: 'delete', payload: sku });
  };

  const handleClearCart = () => {
    clearCart();
  };

  const onAuthSuccess = () => {
    if (authAction?.type === 'delete' && authAction.payload) {
      removeItem(authAction.payload);
    } else if (authAction?.type === 'clear') {
      clearCart();
    }
    setAuthAction(null);
  };

  return (
    <div className="w-[360px] bg-surface-container-lowest shadow-2xl flex flex-col border-l border-outline/10 z-10 relative h-full flex-shrink-0">
      {/* Ticket Header */}
      <div className="p-container-padding bg-surface-container-high border-b border-outline/10">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-headline-sm text-on-surface">Ticket #4829</p>
            <p className="font-data-md text-on-surface-variant text-xs mt-0.5">Venta en Mostrador</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsFullscreen(true)}
              title="Pantalla Completa (Letra Grande y Clara)"
              className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
            </button>
            <button 
              onClick={() => setShowTicketOptions(true)}
              title="Opciones de Ticket y Reimpresión"
              className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Items List */}
      <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-container-padding flex flex-col gap-2">
        {cart.length === 0 ? (
          <div className="text-center text-on-surface-variant text-sm mt-10 font-body-md">
            El carrito está vacío
          </div>
        ) : (
          cart.map((item, idx) => {
            const qty = item.isBulk ? item.weight : item.quantity;
            const lineTotal = item.price * (qty || 1);
            const isEditing = editingSku === item.sku && !item.isBulk;
            
            return (
              <Fragment key={`${item.sku}-${idx}`}>
                <div className="flex items-start justify-between py-2 group relative">
                  <div className="flex gap-3 w-full items-start">
                    
                    {/* Editable Quantity (No pencil, clean number with direct edit on click/enter) */}
                    {item.isBulk ? (
                      <div className="w-11 h-8 bg-surface-container/60 border border-outline-variant/20 rounded-lg flex items-center justify-center">
                        <span className="font-mono text-xs font-bold text-on-surface">{qty?.toFixed(3)}</span>
                      </div>
                    ) : (
                      <div className="w-11 h-8 rounded-lg relative">
                        {isEditing ? (
                          <input 
                            type="number"
                            min="1"
                            max="999"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            className="w-full h-full bg-primary/10 border-2 border-primary text-center font-mono text-sm font-bold text-primary outline-none rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={tempQty}
                            onChange={(e) => setTempQty(e.target.value)}
                            onBlur={() => {
                              const newQty = parseInt(tempQty);
                              if (newQty > 0) {
                                updateItemQuantity(item.sku, newQty);
                              }
                              setEditingSku(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newQty = parseInt(tempQty);
                                if (newQty > 0) {
                                  updateItemQuantity(item.sku, newQty);
                                }
                                setEditingSku(null);
                              } else if (e.key === 'Escape') {
                                setEditingSku(null);
                              }
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSku(item.sku);
                              setTempQty(qty?.toString() || '1');
                            }}
                            title="Haz clic para modificar la cantidad"
                            className="w-full h-full bg-surface-container/60 hover:bg-primary/10 hover:border-primary/40 border border-outline-variant/20 rounded-lg flex items-center justify-center font-mono text-sm font-bold text-on-surface hover:text-primary transition-all cursor-pointer"
                          >
                            <span>{qty}</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-data-md text-on-surface-variant text-[10px] tracking-wider">{item.sku}</p>
                      <p className="font-body-md text-on-surface text-sm truncate leading-tight">{item.name}</p>
                      <p className="font-data-md text-on-surface-variant text-xs mt-1">${item.price.toFixed(2)} {item.isBulk ? 'x kg' : 'c/u'}</p>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between h-full min-h-[44px]">
                      <button 
                        onClick={() => handleDeleteItem(item.sku)}
                        className="text-on-surface-variant/40 hover:text-error transition-colors p-1 -mt-1 -mr-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                      <p className="font-display-price text-on-surface text-base">${lineTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                {idx < cart.length - 1 && (
                  <div className="w-full h-px border-b border-dashed border-outline/20 my-1 opacity-50"></div>
                )}
              </Fragment>
            );
          })
        )}
      </div>

      {/* Ticket Totals & Action */}
      <div className="bg-surface-container p-container-padding pb-gutter rounded-t-2xl mt-auto shadow-[0_-4px_16px_rgba(0,0,0,0.05)] relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="font-body-md text-on-surface-variant text-sm">Subtotal</span>
          <span className="font-data-md text-on-surface-variant">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-body-md text-on-surface-variant text-sm">IVA (16%)</span>
          <span className="font-data-md text-on-surface-variant">${tax.toFixed(2)}</span>
        </div>
        
        <div className="w-full border-t border-dashed border-outline-variant mb-4"></div>
        
        <div className="flex justify-between items-end mb-6">
          <span className="font-headline-sm text-on-surface text-lg">Total</span>
          <span className="font-display-price text-on-surface text-3xl">${total.toFixed(2)}</span>
        </div>
        
        <div className="mb-3">
          <button 
            className="w-full py-2.5 px-3 border border-outline-variant/30 hover:border-error/40 hover:bg-error/5 rounded-xl font-headline-sm text-on-surface-variant hover:text-error transition-all disabled:opacity-40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer" 
            onClick={handleClearCart} 
            disabled={cart.length === 0}
            title="Vaciar todos los productos del carrito"
          >
            <span className="material-symbols-outlined text-base">delete_sweep</span>
            Limpiar Carrito
          </button>
        </div>

        <button 
          onClick={() => {
            setSelectedMethod('Efectivo');
            setIsPaymentOpen(true);
          }}
          disabled={cart.length === 0}
          className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-xl flex items-center justify-center gap-2 px-6 transition-all shadow-md hover:shadow-lg group disabled:opacity-40 disabled:bg-surface-container-high disabled:text-on-surface-variant cursor-pointer active:scale-98"
        >
          <span className="font-headline-sm uppercase tracking-wider text-base font-bold">Cobrar</span>
          <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>

      {/* Fullscreen High-Visibility Modal (Positioned below top navbar) */}
      {isFullscreen && (
        <div className="fixed inset-x-0 bottom-0 top-20 z-40 bg-background flex flex-col p-3 sm:p-4 gap-3 overflow-hidden animate-[fade-in_0.2s_ease-out]">
          {/* Header */}
          <div className="bg-primary text-white px-5 py-3 rounded-2xl flex justify-between items-center shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-white">receipt_long</span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">Ticket #4829 • Venta en Mostrador</h1>
                <p className="text-[11px] text-white/80 font-medium">Modo Pantalla Completa • Vista Amplia</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-white/20"
            >
              <span className="material-symbols-outlined text-xl">fullscreen_exit</span>
              <span>Salir de Pantalla Completa</span>
            </button>
          </div>

          {/* Body Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
            {/* Products List (7 cols) */}
            <div className="lg:col-span-7 bg-surface rounded-2xl border border-outline-variant/30 p-4 flex flex-col shadow-sm min-h-0">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20 mb-2.5">
                <span className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">Productos en la Venta ({cart.length})</span>
                <span className="text-[11px] text-on-surface-variant font-mono">Toca [+] o [-] para ajustar</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar scrollbar-hide pr-1">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-on-surface-variant py-8">
                    <span className="material-symbols-outlined text-4xl mb-1.5 opacity-40">shopping_cart</span>
                    <p className="text-base font-bold">No hay productos agregados</p>
                  </div>
                ) : (
                  cart.map((item, idx) => {
                    const qty = item.isBulk ? item.weight : item.quantity;
                    const lineTotal = item.price * (qty || 1);

                    return (
                      <div key={`${item.sku}-${idx}`} className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[10px] text-on-surface-variant tracking-wider bg-surface-container px-1.5 py-0.5 rounded font-bold">{item.sku}</span>
                          <h3 className="text-base font-bold text-on-surface mt-0.5 truncate">{item.name}</h3>
                          <p className="text-xs font-mono text-on-surface-variant">${item.price.toFixed(2)} {item.isBulk ? 'x kg' : 'c/u'}</p>
                        </div>

                        {/* Large Stepper & Price */}
                        <div className="flex items-center gap-3 shrink-0">
                          {item.isBulk ? (
                            <div className="px-3 py-1.5 bg-surface rounded-lg border border-outline-variant/30 font-mono text-base font-bold text-on-surface">
                              {qty?.toFixed(3)} kg
                            </div>
                          ) : (
                            <div className="flex items-center bg-surface border border-outline-variant/40 rounded-xl p-0.5 shadow-sm">
                              <button
                                type="button"
                                onClick={() => {
                                  if ((qty || 1) > 1) {
                                    updateItemQuantity(item.sku, (qty || 1) - 1);
                                  } else {
                                    handleDeleteItem(item.sku);
                                  }
                                }}
                                className="w-9 h-9 rounded-lg bg-surface-container hover:bg-error/10 hover:text-error text-on-surface flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="Disminuir"
                              >
                                <span className="material-symbols-outlined text-lg">remove</span>
                              </button>

                              <span className="w-10 text-center font-mono text-lg font-extrabold text-primary">
                                {qty}
                              </span>

                              <button
                                type="button"
                                onClick={() => updateItemQuantity(item.sku, (qty || 1) + 1)}
                                className="w-9 h-9 rounded-lg bg-surface-container hover:bg-primary hover:text-white text-on-surface flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="Aumentar"
                              >
                                <span className="material-symbols-outlined text-lg">add</span>
                              </button>
                            </div>
                          )}

                          <div className="text-right w-24">
                            <span className="font-mono text-xl font-extrabold text-on-surface">${lineTotal.toFixed(2)}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.sku)}
                            className="w-9 h-9 rounded-xl bg-error/10 hover:bg-error text-error hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Eliminar producto"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Totals & Action Buttons (5 cols) */}
            <div className="lg:col-span-5 bg-surface rounded-2xl border border-outline-variant/30 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-0">
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">Resumen de la Cuenta</h2>
                
                <div className="space-y-1.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-on-surface-variant font-medium">Subtotal</span>
                    <span className="font-mono text-base font-bold text-on-surface">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-on-surface-variant font-medium">IVA (16%)</span>
                    <span className="font-mono text-base font-bold text-on-surface">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-3.5 text-center shadow-inner">
                  <span className="text-[10px] uppercase tracking-widest text-primary font-extrabold block mb-0.5">TOTAL A COBRAR</span>
                  <div className="font-mono text-3xl sm:text-4xl font-black text-primary tracking-tight">
                    ${total.toFixed(2)} <span className="text-base font-sans font-bold text-on-surface-variant">MXN</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={handleClearCart}
                  disabled={cart.length === 0}
                  className="w-full h-11 rounded-xl border border-outline-variant/30 hover:border-error/40 hover:bg-error/5 text-on-surface-variant hover:text-error font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-lg">delete_sweep</span>
                  Limpiar Carrito
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('Efectivo');
                    setIsPaymentOpen(true);
                  }}
                  disabled={cart.length === 0}
                  className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-40"
                >
                  <span>COBRAR VENTA</span>
                  <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={authAction !== null}
        onClose={() => setAuthAction(null)}
        onSuccess={onAuthSuccess}
      />

      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        total={total}
      />

      <TicketOptionsModal
        isOpen={showTicketOptions}
        onClose={() => setShowTicketOptions(false)}
      />
    </div>
  );
}
