import { useState } from 'react';
import { AuthModal } from './AuthModal';

interface ReturnsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReturnsModal({ isOpen, onClose }: ReturnsModalProps) {
  const [ticketId, setTicketId] = useState('');
  const [ticketFound, setTicketFound] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketId.trim().length > 0) {
      // Mock finding a ticket
      setTicketFound(true);
    }
  };

  const handleProcessReturn = () => {
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setTicketFound(false);
      setTicketId('');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-300">
        <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[80vh] max-h-[800px] z-50 overflow-hidden transform scale-100">
          {/* Header */}
          <div className="bg-primary text-on-primary p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl">assignment_return</span>
              <h2 className="font-headline-sm text-xl tracking-tight">Gestión de Devoluciones</h2>
            </div>
            <button onClick={onClose} className="text-on-primary/70 hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex flex-col">
            {success ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up">
                <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl">check_circle</span>
                </div>
                <h3 className="font-headline-lg text-2xl text-on-surface mb-2">Devolución Procesada</h3>
                <p className="font-body-md text-on-surface-variant max-w-sm">El monto de $128.50 ha sido devuelto exitosamente. El inventario ha sido actualizado.</p>
              </div>
            ) : !ticketFound ? (
              <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                <div className="w-16 h-16 bg-surface-container-high text-on-surface-variant rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl">receipt_long</span>
                </div>
                <h3 className="font-headline-sm text-xl text-on-surface mb-2">Buscar Ticket</h3>
                <p className="font-body-md text-on-surface-variant text-center mb-8">Escanea el código de barras del ticket original o ingresa el folio manualmente para procesar una devolución.</p>
                
                <form onSubmit={handleSearch} className="w-full flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
                    <input 
                      type="text" 
                      placeholder="Ej. TCK-93482"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      className="w-full bg-surface-container p-4 pl-12 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface font-body-md uppercase font-mono"
                      autoFocus
                    />
                  </div>
                  <button type="submit" disabled={!ticketId.trim()} className="bg-primary text-on-primary px-6 rounded-xl font-headline-sm hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Buscar
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-slide-up">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-outline-variant/20">
                  <div>
                    <h3 className="font-headline-sm text-xl text-on-surface">Ticket {ticketId.toUpperCase() || 'TCK-4829'}</h3>
                    <p className="font-data-md text-on-surface-variant text-sm mt-1">24 Oct, 2023 • 14:30 • Caja 04</p>
                  </div>
                  <div className="text-right">
                    <p className="font-label-caps text-on-surface-variant uppercase text-xs mb-1">Método de Pago</p>
                    <p className="font-body-md text-on-surface font-medium">Tarjeta de Crédito terminada en 4432</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-6">
                  <h4 className="font-label-caps text-on-surface-variant uppercase tracking-widest text-xs mb-4">Artículos (Selecciona para devolver)</h4>
                  <div className="space-y-3">
                    {/* Mock Item 1 */}
                    <label className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low cursor-pointer transition-colors group">
                      <input type="checkbox" className="mt-1 w-5 h-5 accent-primary" defaultChecked />
                      <div className="flex-1">
                        <p className="font-body-md font-medium text-on-surface group-hover:text-primary transition-colors">Latte Vainilla M.</p>
                        <p className="font-data-md text-on-surface-variant text-xs mt-1">SKU-0932 • 2 unidades</p>
                      </div>
                      <p className="font-display-price text-lg text-on-surface">$90.00</p>
                    </label>

                    {/* Mock Item 2 */}
                    <label className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low cursor-pointer transition-colors group">
                      <input type="checkbox" className="mt-1 w-5 h-5 accent-primary" defaultChecked />
                      <div className="flex-1">
                        <p className="font-body-md font-medium text-on-surface group-hover:text-primary transition-colors">Croissant Almendra</p>
                        <p className="font-data-md text-on-surface-variant text-xs mt-1">SKU-1104 • 1 unidad</p>
                      </div>
                      <p className="font-display-price text-lg text-on-surface">$38.50</p>
                    </label>
                  </div>
                </div>

                <div className="bg-surface-container-high rounded-xl p-6 mt-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-body-md text-on-surface-variant">Subtotal a devolver</span>
                    <span className="font-data-md text-on-surface-variant">$128.50</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-body-md text-on-surface-variant">Motivo</span>
                    <select className="bg-surface-container border border-outline-variant/20 rounded text-sm px-2 py-1 outline-none">
                      <option>Producto defectuoso</option>
                      <option>Error de cobro</option>
                      <option>Insatisfacción del cliente</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20 mb-6">
                    <span className="font-headline-sm text-on-surface text-lg">Total Reembolso</span>
                    <span className="font-display-price text-on-surface text-2xl text-error">$128.50</span>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setTicketFound(false)} className="flex-1 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-headline-sm py-3 rounded-xl transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleProcessReturn} className="flex-[2] bg-primary hover:bg-primary-container text-on-primary font-headline-sm py-3 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">assignment_return</span>
                      Procesar Devolución
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        title="Autorizar Devolución"
        description="Ingrese NIP personal de cajero o supervisor para confirmar el reembolso de $128.50."
        allowedRoles={['Administrador', 'Supervisor', 'Cajero']}
      />
    </>
  );
}
