
export function InventoryReportsView() {
  return (
    <div className="flex flex-col w-full gap-8">
      {/* Top Grid: Top Sellers & Stagnant Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
        {/* Card 1: Top 10 Más Vendidos */}
        <div className="bg-surface-container rounded-xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-secondary-container rounded-full blur-3xl opacity-30 pointer-events-none"></div>
          <div className="flex items-center justify-between z-10">
            <div>
              <h2 className="font-headline-sm text-on-surface">Top 10 Más Vendidos</h2>
              <p className="font-body-md text-on-surface-variant">Rendimiento por volumen e ingresos</p>
            </div>
            <svg className="w-16 h-8 text-primary" fill="none" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
              <rect fill="currentColor" fillOpacity="0.4" height="16" rx="2" width="6" x="0" y="16"></rect>
              <rect fill="currentColor" fillOpacity="0.6" height="8" rx="2" width="6" x="10" y="24"></rect>
              <rect fill="currentColor" fillOpacity="0.8" height="24" rx="2" width="6" x="20" y="8"></rect>
              <rect fill="currentColor" fillOpacity="0.5" height="20" rx="2" width="6" x="30" y="12"></rect>
              <rect fill="currentColor" fillOpacity="0.7" height="12" rx="2" width="6" x="40" y="20"></rect>
              <rect fill="currentColor" height="32" rx="2" width="6" x="50" y="0"></rect>
            </svg>
          </div>
          
          <div className="grid grid-cols-12 gap-1 px-3 mt-4 z-10">
            <div className="col-span-4 font-label-caps text-on-surface-variant uppercase text-xs font-semibold">Producto</div>
            <div className="col-span-3 font-label-caps text-on-surface-variant uppercase text-xs font-semibold">Categoría</div>
            <div className="col-span-2 font-label-caps text-on-surface-variant uppercase text-xs font-semibold text-right">Unds</div>
            <div className="col-span-3 font-label-caps text-on-surface-variant uppercase text-xs font-semibold text-right">Ingresos</div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center mt-2 z-10 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-3">bar_chart</span>
            <p className="font-headline-sm text-on-surface-variant">Sin datos de ventas</p>
            <p className="font-body-md text-sm text-on-surface-variant/70 mt-1 max-w-[250px]">
              Aún no hay suficientes ventas registradas para calcular el Top 10.
            </p>
          </div>
        </div>

        {/* Card 2: Productos Estancados */}
        <div className="bg-surface-container rounded-xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-error-container rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          <div className="flex items-center justify-between z-10">
            <div>
              <h2 className="font-headline-sm text-on-surface">Productos Estancados</h2>
              <p className="font-body-md text-on-surface-variant">Baja rotación de inventario</p>
            </div>
            <svg className="w-16 h-8 text-error" fill="none" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2L18 16L34 8L62 28" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
              <circle cx="62" cy="28" fill="currentColor" r="3"></circle>
            </svg>
          </div>
          
          <div className="grid grid-cols-12 gap-1 px-3 mt-4 z-10">
            <div className="col-span-5 font-label-caps text-on-surface-variant uppercase text-xs font-semibold">Producto</div>
            <div className="col-span-3 font-label-caps text-on-surface-variant uppercase text-xs font-semibold text-right">Días S/Venta</div>
            <div className="col-span-2 font-label-caps text-on-surface-variant uppercase text-xs font-semibold text-right">Stock</div>
            <div className="col-span-2 font-label-caps text-on-surface-variant uppercase text-xs font-semibold text-right">Valor</div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center mt-2 z-10 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-3">inventory_2</span>
            <p className="font-headline-sm text-on-surface-variant">Todo en movimiento</p>
            <p className="font-body-md text-sm text-on-surface-variant/70 mt-1 max-w-[250px]">
              No hay productos con baja rotación en el inventario actual.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Lista de Resurtido */}
      <div className="bg-surface-container-low rounded-xl p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">inventory</span>
              Lista de Resurtido
            </h2>
            <p className="font-body-md text-on-surface-variant">Productos en o por debajo de su nivel de stock mínimo permitido.</p>
          </div>
          <button className="bg-primary text-on-primary font-label-caps uppercase text-xs font-semibold px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-sm hover:bg-inverse-surface transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Exportar Lista
          </button>
        </div>
        
        <div className="grid grid-cols-12 gap-1 px-3 mt-4">
          <div className="col-span-4 font-label-caps text-on-surface-variant uppercase text-xs font-semibold">SKU / Producto</div>
          <div className="col-span-3 font-label-caps text-on-surface-variant uppercase text-xs font-semibold">Proveedor</div>
          <div className="col-span-2 font-label-caps text-on-surface-variant uppercase text-xs font-semibold text-right">Stock Min.</div>
          <div className="col-span-2 font-label-caps text-on-surface-variant uppercase text-xs font-semibold text-right">Stock Act.</div>
          <div className="col-span-1 font-label-caps text-on-surface-variant uppercase text-xs font-semibold text-center">Estado</div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center mt-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-5xl text-outline-variant/40 mb-4">check_circle</span>
          <p className="font-headline-sm text-on-surface-variant">Stock Saludable</p>
          <p className="font-body-md text-sm text-on-surface-variant/70 mt-2 max-w-[400px]">
            No hay productos que requieran resurtido inmediato. Todos los productos están por encima de su nivel mínimo.
          </p>
        </div>
      </div>
    </div>
  );
}
