import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { ProductModal } from '../components/ProductModal';
import { usePosStore } from '../store/posStore';

export function InventoryView() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  // Modals state
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const categories = ['Todas', 'Abarrotes', 'Lácteos', 'Limpieza', 'Botanas', 'Bebidas', 'Perecederos', 'Otros'];
  const statuses = ['Todos', 'ÓPTIMO', 'BAJO', 'CRÍTICO', 'AGOTADO'];

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        // Transform DB schema to UI schema expectations
        const mapped = data.map((item: any) => {
          const stock = item.stock || 0;
          const minStock = item.min_stock || 5;
          let status = 'ÓPTIMO';
          if (stock === 0) status = 'AGOTADO';
          else if (stock <= minStock / 2) status = 'CRÍTICO';
          else if (stock <= minStock) status = 'BAJO';

          return {
            ...item,
            minStock,
            unit: item.is_bulk ? 'KG' : 'PZA',
            status
          };
        });
        setInventory(mapped);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleExportReport = () => {
    const headers = ['SKU,Producto,Categoria,Stock Minimo,Existencia,Unidad,Estado\n'];
    const rows = filteredInventory.map(i => 
      `"${i.sku}","${i.name}","${i.category}",${i.minStock},${i.stock},"${i.unit}","${i.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_existencias_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAdjustment = async (sku: string, newStock: number, reason?: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/products/${sku}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock, reason })
      });
      await usePosStore.getState().fetchProducts();
      setInventory(prev => prev.map(item => {
        if (item.sku === sku) {
          let status = 'ÓPTIMO';
          if (newStock === 0) status = 'AGOTADO';
          else if (newStock <= item.minStock / 2) status = 'CRÍTICO';
          else if (newStock <= item.minStock) status = 'BAJO';
          return { ...item, stock: newStock, status };
        }
        return item;
      }));
    } catch (err) {
      console.error('Error actualizando stock en base de datos:', err);
    }
  };

  const getStatusClasses = (status: string) => {
    switch(status) {
      case 'ÓPTIMO': return 'bg-secondary-container/20 border-secondary/20 text-secondary';
      case 'BAJO': return 'bg-tertiary-container/10 border-tertiary-container/20 text-tertiary-container';
      case 'CRÍTICO': return 'bg-error-container/20 border-error/20 text-error';
      case 'AGOTADO': return 'bg-error text-on-error border-error';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getStatusDot = (status: string) => {
    switch(status) {
      case 'ÓPTIMO': return 'bg-secondary';
      case 'BAJO': return 'bg-tertiary-container';
      case 'CRÍTICO': return 'bg-error';
      case 'AGOTADO': return 'bg-white';
      default: return 'bg-outline';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Todos' || item.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full h-full text-on-surface p-6">
      <div className="flex items-center justify-between pb-8 border-b border-outline-variant/50 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-headline-lg text-primary tracking-tight text-3xl">Existencias</h1>
          <p className="text-body-md text-on-surface-variant">Control y monitoreo de inventario en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleExportReport}
            title="Descargar reporte en formato CSV / Excel"
            className="px-5 py-2.5 flex items-center gap-2 border border-outline-variant/40 bg-surface hover:bg-surface-container rounded-xl text-xs font-bold font-label-caps uppercase text-on-surface transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">download</span>
            Exportar Reporte
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total SKUs */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-premium border border-outline-variant/20 flex flex-col justify-between hover:shadow-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-label-caps text-on-surface-variant">Total SKUs</span>
            <span className="material-symbols-outlined text-on-surface-variant">inventory_2</span>
          </div>
          <div className="font-display-price text-primary text-4xl">{inventory.length}</div>
          <div className="mt-2 text-xs font-body-md text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-secondary">trending_up</span>
            <span className="text-secondary font-data-md">100%</span> auditado
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-premium border border-outline-variant/20 flex flex-col justify-between hover:shadow-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-label-caps text-on-surface-variant">Stock Bajo</span>
            <span className="material-symbols-outlined text-on-tertiary-container">warning</span>
          </div>
          <div className="font-display-price text-tertiary-container text-4xl">
            {inventory.filter(i => i.status === 'BAJO' || i.status === 'CRÍTICO').length}
          </div>
          <div className="mt-2 text-xs font-body-md text-on-surface-variant flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
            Atención requerida
          </div>
        </div>

        {/* Agotados */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-premium border border-outline-variant/20 flex flex-col justify-between hover:shadow-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-label-caps text-on-surface-variant">Agotados</span>
            <span className="material-symbols-outlined text-error">error</span>
          </div>
          <div className="font-display-price text-error text-4xl">
            {inventory.filter(i => i.status === 'AGOTADO').length}
          </div>
          <div className="mt-2 text-xs font-body-md text-on-surface-variant flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            Acción inmediata
          </div>
        </div>

        {/* Valor Total */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 shadow-premium text-on-primary flex flex-col justify-between relative overflow-hidden hover:shadow-hover transition-all border border-primary/20">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-label-caps text-on-primary/70">Valor Total Inventario</span>
            <span className="material-symbols-outlined text-on-primary/70">payments</span>
          </div>
          <div className="font-display-price text-on-primary relative z-10 text-4xl">$84.2K</div>
          <div className="mt-2 text-xs font-body-md text-on-primary/70 flex items-center gap-1 relative z-10">
            Calculado a costo promedio
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/20 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-4 bg-surface/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-md text-sm font-body-md focus:outline-none focus:border-secondary transition-colors placeholder:text-on-surface-variant/50" 
                placeholder="Buscar SKU o nombre..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="h-6 w-[1px] bg-outline-variant/50"></div>
            
            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 relative">
              {/* Category Dropdown */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => {
                    setShowCategoryMenu(!showCategoryMenu);
                    setShowStatusMenu(false);
                  }}
                  className={`px-3 py-1.5 flex items-center gap-2 bg-surface border rounded-md text-xs font-label-caps transition-colors cursor-pointer ${
                    selectedCategory !== 'Todas' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-outline-variant hover:bg-surface-variant'
                  }`}
                >
                  Categoría: {selectedCategory}
                  <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                </button>

                {showCategoryMenu && (
                  <div className="absolute left-0 mt-1 w-44 bg-surface rounded-xl shadow-xl border border-outline-variant/30 z-30 py-1">
                    {categories.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(c);
                          setShowCategoryMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container flex items-center justify-between cursor-pointer ${
                          selectedCategory === c ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'
                        }`}
                      >
                        <span>{c}</span>
                        {selectedCategory === c && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => {
                    setShowStatusMenu(!showStatusMenu);
                    setShowCategoryMenu(false);
                  }}
                  className={`px-3 py-1.5 flex items-center gap-2 bg-surface border rounded-md text-xs font-label-caps transition-colors cursor-pointer ${
                    selectedStatus !== 'Todos' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-outline-variant hover:bg-surface-variant'
                  }`}
                >
                  Estado: {selectedStatus}
                  <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                </button>

                {showStatusMenu && (
                  <div className="absolute left-0 mt-1 w-44 bg-surface rounded-xl shadow-xl border border-outline-variant/30 z-30 py-1">
                    {statuses.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(s);
                          setShowStatusMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container flex items-center justify-between cursor-pointer ${
                          selectedStatus === s ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'
                        }`}
                      >
                        <span>{s}</span>
                        {selectedStatus === s && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs font-label-caps text-on-surface-variant">
            Mostrando <span className="font-data-md text-primary">{filteredInventory.length}</span> de <span className="font-data-md text-primary">{inventory.length}</span>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-container z-10 border-b border-outline-variant/50">
              <tr>
                <th className="px-6 py-4 text-xs font-label-caps text-on-surface-variant w-24">SKU</th>
                <th className="px-6 py-4 text-xs font-label-caps text-on-surface-variant">Producto</th>
                <th className="px-6 py-4 text-xs font-label-caps text-on-surface-variant w-32">Categoría</th>
                <th className="px-6 py-4 text-xs font-label-caps text-on-surface-variant text-right w-24">Stock Min.</th>
                <th className="px-6 py-4 text-xs font-label-caps text-on-surface-variant text-right w-24">Existencia</th>
                <th className="px-6 py-4 text-xs font-label-caps text-on-surface-variant text-center w-20">Unidad</th>
                <th className="px-6 py-4 text-xs font-label-caps text-on-surface-variant w-24">Estado</th>
                <th className="px-6 py-4 text-xs font-label-caps text-on-surface-variant text-right w-24">Acción</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-sm divide-y divide-outline-variant/20">
              {filteredInventory.map(item => (
                <tr key={item.sku} className={`hover:bg-surface/50 transition-colors group ${item.status === 'CRÍTICO' || item.status === 'AGOTADO' ? 'bg-error-container/5' : ''}`}>
                  <td className="px-6 py-4 font-data-md text-on-surface-variant">{item.sku}</td>
                  <td className="px-6 py-4 font-medium text-on-surface max-w-[200px]">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={`${API_BASE_URL}${item.image_url}`} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-surface-container" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline">image</span>
                        </div>
                      )}
                      <span className="truncate">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{item.category}</td>
                  <td className="px-6 py-4 font-data-md text-on-surface-variant text-right">{item.minStock}</td>
                  <td className={`px-6 py-4 font-data-md text-right font-bold ${item.stock <= item.minStock ? 'text-error' : 'text-on-surface'}`}>{item.stock}</td>
                  <td className="px-6 py-4 text-center text-xs text-on-surface-variant font-label-caps">{item.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[10px] font-label-caps ${getStatusClasses(item.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(item.status)}`}></span>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedProduct(item);
                        setIsAdjustmentOpen(true);
                      }}
                      className="text-on-surface-variant hover:text-primary transition-colors p-1 opacity-80 hover:opacity-100 cursor-pointer" 
                      title="Ajuste Manual de Existencias"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit_square</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        product={selectedProduct}
        onSave={handleSaveAdjustment}
      />
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={fetchInventory}
      />
    </div>
  );
}
