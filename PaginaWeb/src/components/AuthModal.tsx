import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStaffStore } from '../store/staffStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authorizerName?: string) => void;
  title?: string;
  description?: string;
  allowedRoles?: string[];
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Autorización Requerida",
  description = "Ingrese NIP de supervisor o administrador para autorizar la operación.",
  allowedRoles = ['Administrador', 'Supervisor', 'Cajero', 'admin', 'cashier', 'gerente']
}: AuthModalProps) {
  const [nip, setNip] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('NIP INCORRECTO');
  const inputRef = useRef<HTMLInputElement>(null);
  const { verifyNip, fetchEmployees } = useStaffStore();

  useEffect(() => {
    if (isOpen) {
      setNip('');
      setError(false);
      fetchEmployees(); // Always ensure employees are fresh from DB
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, fetchEmployees]);

  const handleValidate = () => {
    if (nip.length !== 4) {
      setErrorMessage('DEBE TENER 4 DÍGITOS');
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    const result = verifyNip(nip, allowedRoles);
    if (!result.success) {
      if (result.employee) {
        setErrorMessage(`ROL NO AUTORIZADO (${result.employee.role.toUpperCase()})`);
      } else {
        setErrorMessage('NIP INCORRECTO');
      }
      setError(true);
      setTimeout(() => setError(false), 2500);
    } else {
      setError(false);
      onSuccess(result.employee?.name || 'Autorizado');
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative bg-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-[scale-in_0.15s_ease-out] z-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 mx-auto shadow-xs">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        
        <h2 className="font-headline-sm text-on-surface text-center mb-1 text-lg font-bold">{title}</h2>
        <p className="font-body-md text-on-surface-variant text-center text-xs mb-5 max-w-xs mx-auto leading-relaxed">{description}</p>
        
        <div className={`bg-surface-container p-2 rounded-2xl mb-4 border border-outline-variant/30 ${error ? 'border-error animate-[shake_0.3s_ease-in-out]' : 'focus-within:border-primary'}`}>
          <input 
            ref={inputRef}
            type="password"
            className="w-full bg-transparent font-display-price text-center text-3xl tracking-[0.8em] text-on-surface outline-none py-2 placeholder-on-surface-variant/30"
            maxLength={4}
            placeholder="••••"
            value={nip}
            onChange={(e) => setNip(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleValidate();
            }}
          />
        </div>
        
        <p className={`font-label-caps text-error text-center mb-4 h-4 transition-opacity text-xs font-semibold ${error ? 'opacity-100' : 'opacity-0'}`}>
          {errorMessage}
        </p>
        
        <div className="flex gap-2.5">
          <button 
            type="button"
            className="flex-1 bg-surface-container hover:bg-surface-variant text-on-surface font-bold py-3 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="button"
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors text-xs uppercase tracking-wider shadow-md cursor-pointer active:scale-98"
            onClick={handleValidate}
          >
            Autorizar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
