import { API_BASE_URL } from '../config';
import { useState } from 'react';
import { AuthModal } from './AuthModal';

interface CashFundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashFundModal({ isOpen, onClose }: CashFundModalProps) {
  const [amount, _setAmount] = useState('2000');
  const [notes, setNotes] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmedBy, setConfirmedBy] = useState('');



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setShowAuth(true);
  };

  const handleAuthSuccess = async (authorizerName?: string) => {
    const cashierName = authorizerName || 'Cajero';
    setConfirmedBy(cashierName);
    setSuccess(true);

    try {
      await fetch(`${API_BASE_URL}/api/cash-shifts/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: cashierName,
          initial_fund: parseFloat(amount || '2000')
        })
      });
    } catch (e) {
      console.error('Error registrando apertura de caja en nómina:', e);
    }

    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300">
        <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 scale-100 border border-outline-variant/30">
          {/* Header */}
          <div className="bg-primary text-white p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-white">account_balance_wallet</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-lg font-bold text-white tracking-tight">Iniciar Turno / Dinero en Caja</h2>
                <p className="text-[11px] text-white/70 font-label-caps uppercase">Fondo Inicial</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {success ? (
              <div className="flex flex-col items-center justify-center text-center animate-slide-up py-4">
                <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h3 className="font-headline-sm text-xl text-on-surface font-bold mb-1">Caja Recibida y Confirmada</h3>
                <p className="font-body-md text-sm text-on-surface-variant">
                  Fondo de <strong>${parseFloat(amount).toFixed(2)} MXN</strong> verificado por <strong>{confirmedBy}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col animate-slide-up">
                <p className="font-body-md text-on-surface-variant text-center mb-5 text-sm leading-relaxed">
                  Cuenta el dinero físico que hay en el cajón y verifica que coincida con el fondo establecido para iniciar tu turno.
                </p>
                
                {/* Fixed Amount Display Card */}
                <div className="bg-surface-container-low p-4 rounded-2xl mb-4 border-2 border-primary/30 text-center space-y-1">
                  <span className="text-[10px] font-label-caps bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
                    Fondo Inicial a Verificar
                  </span>
                  <div className="font-display-price text-4xl text-on-surface font-bold text-primary py-2">
                    ${parseFloat(amount).toFixed(2)} <span className="text-sm font-sans font-normal text-on-surface-variant">MXN</span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">
                    (Billetes de $20, $50, $100 y monedas para cambio)
                  </p>
                </div>

                <div className="bg-secondary-container/20 p-3 rounded-xl border border-secondary/30 flex items-center gap-2.5 mb-6 text-xs text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-base shrink-0">check_circle</span>
                  <span>Verifica que el dinero físico en el cajón coincida antes de ingresar tu NIP.</span>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block font-label-caps text-xs text-on-surface-variant uppercase font-semibold mb-1.5">
                    Observaciones / Comentarios (Opcional)
                  </label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Todo el cambio completo"
                    className="w-full bg-surface py-2.5 px-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-body-md text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="flex-1 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-headline-sm py-3 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={!amount} 
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-headline-sm py-3 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">pin</span>
                    Confirmar con NIP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        title="Confirmar Entrada / Fondo de Caja"
        description={`Ingrese su NIP personal para confirmar que verificó y recibió $${parseFloat(amount || '0').toFixed(2)} MXN en el cajón.`}
        allowedRoles={['Administrador', 'Supervisor', 'Cajero']}
      />
    </>
  );
}
