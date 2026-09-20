import { useState } from 'react';
import { usePosStore, type Product } from '../store/posStore';

interface StockLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
}

export function StockLookupModal({ isOpen, onClose, onSelectProduct }: StockLookupModalProps) {
  const { products } = usePosStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  if (!isOpen) return null;

  const categories = ['Todos', 'Abarrotes', 'Lácteos', 'Frutas y Verduras', 'Bebidas', 'Snacks', 'Limpieza'];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.includes(searchTerm);
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Box */}
      <div className="relative bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 border border-outline-variant/30 flex flex-col max-h-[85vh] animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-white">inventory_2</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Consulta Rápida de Existencias y Precios</h2>
              <p className="text-xs text-white/70">Revisa inventario en mostrador y bodega sin salir de la venta</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 space-y-3 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, SKU o código de barras..."
              className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-xl text-sm text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar scrollbar-hide pb-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar scrollbar-hide">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-4xl opacity-40">search_off</span>
              <p className="text-sm font-bold">No se encontraron productos</p>
              <p className="text-xs">Prueba con otro nombre o código</p>
            </div>
          ) : (
            filtered.map(product => {
              // Simulated stock
              const stock = product.stock !== undefined ? product.stock : (product.isBulk ? 18.5 : 24);
              const minStock = product.minStock || 5;
              const isLowStock = stock <= minStock;

              return (
                <div 
                  key={product.id}
                  className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">{product.sku}</span>
                      {product.category && (
                        <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{product.category}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-on-surface mt-1 truncate">{product.name}</h3>
                    <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                      Precio de Venta: <strong className="text-on-surface">${product.price.toFixed(2)} {product.isBulk ? 'x kg' : 'c/u'}</strong>
                    </p>
                  </div>

                  {/* Stock Status Badge */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Existencia</span>
                      <span className={`font-mono text-base font-extrabold ${isLowStock ? 'text-error' : 'text-secondary'}`}>
                        {product.isBulk ? `${stock.toFixed(3)} kg` : `${stock} pzas`}
                      </span>
                    </div>

                    {onSelectProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(product);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container border-t border-outline-variant/30 flex justify-between items-center shrink-0">
          <span className="text-xs text-on-surface-variant font-mono">Mostrando {filtered.length} productos</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-surface text-on-surface border border-outline-variant/40 hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar Consulta
          </button>
        </div>
      </div>
    </div>
  );
}
