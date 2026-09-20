import { useState, useEffect } from 'react';
import type { Product } from '../store/posStore';

interface BulkModalProps {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product, weight: number) => void;
}

export function BulkModal({ product, onClose, onAdd }: BulkModalProps) {
  const [weightStr, setWeightStr] = useState('');

  useEffect(() => {
    if (product) {
      setWeightStr('');
    }
  }, [product]);

  if (!product) return null;

  const handleNumpad = (val: string) => {
    if (val === 'backspace') {
      setWeightStr(prev => prev.slice(0, -1));
    } else {
      if (val === '.' && weightStr.includes('.')) return;
      setWeightStr(prev => prev + val);
    }
  };

  const weight = parseFloat(weightStr) || 0;
  const total = weight * product.price;

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-6 bg-surface-container-highest flex justify-between items-start">
          <div>
            <span className="font-data-md text-on-surface-variant text-xs uppercase ligatures-normal">{product.sku}</span>
            <h3 className="font-headline-lg text-on-surface leading-tight mt-1">{product.name}</h3>
            <p className="font-data-lg text-primary mt-2 font-bold ligatures-normal">${product.price.toFixed(2)} / kg</p>
          </div>
          <button 
            className="p-2 bg-surface hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors" 
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 flex flex-col gap-6">
          {/* Weight Display */}
          <div className="bg-surface p-6 rounded-xl border border-primary/20 flex flex-col items-center justify-center relative">
            <span className="absolute top-4 left-4 text-on-surface-variant font-body-md">Peso (kg)</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="font-display-price text-primary font-bold ligatures-normal text-4xl">{weightStr || '0.000'}</span>
            </div>
            <div className="w-full h-px bg-outline/10 my-4"></div>
            <div className="flex justify-between w-full items-center">
              <span className="font-body-md text-on-surface-variant">Importe Calculado</span>
              <span className="font-data-lg text-on-surface text-xl font-bold ligatures-normal">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.'].map((key) => (
              <button 
                key={key}
                onClick={() => handleNumpad(key)}
                className="bg-surface-container hover:bg-surface-container-high py-4 rounded-xl font-data-lg text-xl text-on-surface transition-colors shadow-sm border border-outline/5 font-bold ligatures-normal"
              >
                {key}
              </button>
            ))}
            <button 
              onClick={() => handleNumpad('backspace')}
              className="bg-error-container hover:bg-error-container/80 py-4 rounded-xl font-data-lg text-xl text-on-error-container transition-colors shadow-sm flex items-center justify-center"
            >
              <span className="material-symbols-outlined">backspace</span>
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button 
              className="py-4 border border-outline rounded-xl font-headline-sm text-on-surface hover:bg-surface-container transition-colors" 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              className="py-4 bg-primary rounded-xl font-headline-sm text-on-primary hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50" 
              onClick={() => {
                if (weight > 0) {
                  onAdd(product, weight);
                  onClose();
                }
              }}
              disabled={weight <= 0}
            >
              Agregar al Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
