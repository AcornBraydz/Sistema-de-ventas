import { useState } from 'react';

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashoutModal({ isOpen, onClose }: CashoutModalProps) {
  const [amount, setAmount] = useState('0.00');
  const [reason, setReason] = useState('Pago a Proveedor');
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    setAmount(val);
  };

  const handleConfirm = () => {
    // In a real app, this would dispatch an action
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/30 backdrop-blur-md px-gutter">
      {/* Modal Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        {/* Subtle Alert Header */}
        <div className="flex items-start gap-4 p-6 bg-secondary-container/30 text-on-secondary-container">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-on-secondary-container">account_balance_wallet</span>
          </div>
          <div className="flex flex-col pt-1">
            <h2 className="font-headline-sm">Retiro de Efectivo</h2>
            <p className="font-body-md text-on-surface-variant mt-1">
              Registra la salida de fondos de la caja actual. Esta acción requiere confirmación.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Main Form Content */}
        <div className="flex flex-col p-6 gap-8 bg-surface">
          {/* Large Numeric Input */}
          <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest rounded-xl shadow-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-lowest opacity-50 pointer-events-none"></div>
            <label className="font-label-caps text-on-surface-variant uppercase tracking-widest mb-4 z-10">
              Monto a Retirar
            </label>
            <div className="flex items-baseline justify-center w-full z-10">
              <span className="font-display-price text-on-surface-variant/50 mr-2">$</span>
              <input 
                autoComplete="off" 
                className="bg-transparent w-[240px] text-center focus:outline-none font-display-price text-on-surface caret-primary" 
                inputMode="decimal" 
                type="text" 
                value={amount}
                onChange={handleAmountChange}
              />
            </div>
          </div>

          {/* Custom Select */}
          <div className="flex flex-col gap-2 relative">
            <label className="font-label-caps text-on-surface-variant uppercase tracking-widest">
              Motivo del Retiro
            </label>
            <button 
              className="w-full flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl shadow-sm text-on-surface font-body-md hover:bg-surface-container-lowest/80 transition-colors" 
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span>{reason}</span>
              <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                unfold_more
              </span>
            </button>

            {/* Dropdown Options */}
            {showDropdown && (
              <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden z-20 flex flex-col border border-outline/10">
                {['Pago a Proveedor', 'Retiro de Seguridad', 'Otros Gastos'].map(opt => (
                  <button 
                    key={opt}
                    className="w-full text-left px-4 py-3 font-body-md text-on-surface hover:bg-surface-container transition-colors"
                    onClick={() => {
                      setReason(opt);
                      setShowDropdown(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center gap-4 p-6 bg-surface-container-lowest/50">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-surface-container-highest text-on-surface font-headline-sm rounded-xl shadow-sm hover:bg-surface-dim transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-[2] py-4 bg-secondary text-on-secondary rounded-xl shadow-md hover:bg-secondary/90 transition-colors flex items-center justify-center gap-3"
          >
            <span className="font-headline-sm">Confirmar Retiro</span>
            <span className="font-data-md bg-on-secondary/10 px-2 py-1 rounded shadow-sm">
              ${parseFloat(amount || '0').toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
