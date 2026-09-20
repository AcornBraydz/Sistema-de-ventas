
export function FinanceView() {
  return (
    <div className="flex flex-col w-full h-full max-w-7xl mx-auto py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-outline-variant/30 pb-6 mb-8">
        <div>
          <h1 className="font-headline-lg text-on-surface mb-2 tracking-tight">Contabilidad y Fiscal</h1>
          <p className="font-body-md text-on-surface-variant max-w-xl">Gestión de obligaciones fiscales, reportes y conciliación bancaria.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container py-2 px-4 rounded-xl shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant">calendar_month</span>
          <select className="bg-transparent border-none outline-none font-label-caps text-on-surface cursor-pointer appearance-none pr-4 uppercase">
            <option value="2023-10">Octubre 2023</option>
            <option value="2023-09">Septiembre 2023</option>
            <option value="2023-08">Agosto 2023</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Taxes & Reports */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-sm text-on-surface">Resumen de Impuestos</h2>
              <span className="font-label-caps text-on-surface-variant opacity-60 uppercase">MXN • Octubre</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* IVA Trasladado */}
              <div className="bg-surface-container-low p-6 rounded-xl shadow-sm border border-outline-variant/20 hover:border-outline-variant/40 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-4xl">account_balance</span>
                </div>
                <span className="font-label-caps text-on-surface-variant block mb-3 uppercase tracking-wider text-xs">IVA Trasladado</span>
                <div className="font-mono text-[32px] leading-none text-on-surface font-bold">$0<span className="text-lg opacity-50">.00</span></div>
                <div className="mt-4 flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                  <span className="font-mono text-xs font-bold">Ventas gravadas</span>
                </div>
              </div>
              
              {/* IVA Acreditable */}
              <div className="bg-surface-container-low p-6 rounded-xl shadow-sm border border-outline-variant/20 hover:border-outline-variant/40 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-4xl">receipt_long</span>
                </div>
                <span className="font-label-caps text-on-surface-variant block mb-3 uppercase tracking-wider text-xs">IVA Acreditable</span>
                <div className="font-mono text-[32px] leading-none text-on-surface font-bold">$0<span className="text-lg opacity-50">.00</span></div>
                <div className="mt-4 flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                  <span className="font-mono text-xs font-bold">Gastos deducibles</span>
                </div>
              </div>
              
              {/* ISR Estimado */}
              <div className="bg-primary-container p-6 rounded-xl shadow-md border border-primary/20 text-on-primary-container group relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                <span className="font-label-caps text-on-primary-container/70 block mb-3 uppercase tracking-wider text-xs">ISR Estimado</span>
                <div className="font-mono text-[32px] leading-none text-on-primary-container font-bold">$0<span className="text-lg opacity-50">.00</span></div>
                <div className="mt-4 flex items-center gap-2 text-on-primary-container/80">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span className="font-mono text-xs font-bold">Proyección mensual</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Conciliation Table */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-headline-sm text-on-surface">Conciliación de Ventas vs Depósitos</h2>
              <div className="flex gap-2">
                <button className="bg-surface text-on-surface border border-outline-variant/40 px-3 py-1.5 rounded flex items-center gap-2 hover:bg-surface-container transition-colors text-sm font-label-caps uppercase">
                  <span className="material-symbols-outlined text-sm">filter_list</span> Filtrar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                    <th className="py-3 px-6 font-label-caps tracking-wider uppercase text-xs">Folio / Ref</th>
                    <th className="py-3 px-6 font-label-caps tracking-wider uppercase text-xs">Fecha</th>
                    <th className="py-3 px-6 font-label-caps tracking-wider uppercase text-right text-xs">POS (Venta)</th>
                    <th className="py-3 px-6 font-label-caps tracking-wider uppercase text-right text-xs">Banco (Depósito)</th>
                    <th className="py-3 px-6 font-label-caps tracking-wider uppercase text-center text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm text-on-surface divide-y divide-outline-variant/10">
                  <tr>
                    <td colSpan={5} className="py-12 px-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-3">account_balance_wallet</span>
                        <p className="font-headline-sm text-on-surface-variant">Sin transacciones</p>
                        <p className="font-body-md text-sm text-on-surface-variant/70 mt-1">
                          No hay depósitos registrados en el periodo seleccionado para conciliar.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
        
        {/* Right Column: Actions & Config */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Export Reports */}
          <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20">
            <h3 className="font-headline-sm text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">download</span> Descargas Contador
            </h3>
            <div className="flex flex-col gap-3">
              <button className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-3 px-4 rounded-lg flex items-center justify-between transition-colors border border-outline-variant/10 group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary-container group-hover:text-tertiary transition-colors">csv</span>
                  <span className="font-body-md text-sm font-medium">Resumen de Ventas</span>
                </div>
                <span className="material-symbols-outlined text-sm opacity-50">arrow_forward</span>
              </button>
              <button className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-3 px-4 rounded-lg flex items-center justify-between transition-colors border border-outline-variant/10 group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary group-hover:text-secondary-fixed-variant transition-colors">receipt</span>
                  <span className="font-body-md text-sm font-medium">Listado de Gastos</span>
                </div>
                <span className="material-symbols-outlined text-sm opacity-50">arrow_forward</span>
              </button>
              <button className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-3 px-4 rounded-lg flex items-center justify-between transition-colors border border-outline-variant/10 group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary group-hover:text-primary-fixed-variant transition-colors">folder_zip</span>
                  <span className="font-body-md text-sm font-medium">Bitácora CFDI (XML/PDF)</span>
                </div>
                <span className="material-symbols-outlined text-sm opacity-50">arrow_forward</span>
              </button>
              <button className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-3 px-4 rounded-lg flex items-center justify-between transition-colors border border-outline-variant/10 group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface transition-colors">account_balance_wallet</span>
                  <span className="font-body-md text-sm font-medium">Auxiliar de Bancos</span>
                </div>
                <span className="material-symbols-outlined text-sm opacity-50">arrow_forward</span>
              </button>
            </div>
          </section>
          
          {/* Config Quick Access */}
          <section className="bg-tertiary-container text-on-tertiary-container p-6 rounded-xl shadow-md relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 100% 0%, currentColor 0%, transparent 50%)" }}></div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <h3 className="font-headline-sm flex items-center gap-2">
                <span className="material-symbols-outlined">settings_suggest</span> Fiscal
              </h3>
              <button className="text-on-tertiary-container/80 hover:text-on-tertiary-container transition-colors p-1 bg-tertiary/20 rounded">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div className="space-y-4 relative z-10 mt-6">
              <div>
                <span className="font-label-caps opacity-70 block text-xs mb-1 uppercase">Razón Social</span>
                <p className="font-body-md text-sm font-medium truncate">HERITAGE TERMINAL S.A. DE C.V.</p>
              </div>
              <div>
                <span className="font-label-caps opacity-70 block text-xs mb-1 uppercase">RFC</span>
                <p className="font-mono font-bold tracking-wider">HTE210815XYZ</p>
              </div>
              <div>
                <span className="font-label-caps opacity-70 block text-xs mb-1 uppercase">Régimen</span>
                <p className="font-body-md text-sm">General de Ley Personas Morales</p>
              </div>
            </div>
          </section>
          
          <section className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 border border-outline-variant/20">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 text-secondary">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div>
              <p className="font-body-md text-sm font-medium text-on-surface">Firma Electrónica (FIEL)</p>
              <p className="font-label-caps text-[10px] text-on-surface-variant mt-1 uppercase">VIGENTE HASTA: <span className="font-mono font-bold text-secondary text-xs">15/05/2025</span></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
