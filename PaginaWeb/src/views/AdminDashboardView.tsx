import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const weeklyData = [
  { name: 'Lun', ingresos: 0, cogs: 0, utilidad: 0 },
  { name: 'Mar', ingresos: 0, cogs: 0, utilidad: 0 },
  { name: 'Mie', ingresos: 0, cogs: 0, utilidad: 0 },
  { name: 'Jue', ingresos: 0, cogs: 0, utilidad: 0 },
  { name: 'Vie', ingresos: 0, cogs: 0, utilidad: 0 },
  { name: 'Sab', ingresos: 0, cogs: 0, utilidad: 0 },
  { name: 'Dom', ingresos: 0, cogs: 0, utilidad: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-outline-variant p-3 shadow-sm rounded-lg">
        <p className="font-label-caps text-on-surface-variant mb-2">{label}, 24 Oct</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-data-md" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminDashboardView() {
  return (
    <div className="flex flex-col w-full gap-8 bg-background h-full">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="font-headline-lg text-on-surface mb-1">Financial Insights</h1>
          <p className="font-body-md text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">sync</span> Last synced: Just now
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container rounded-lg p-1 flex">
            <button className="px-4 py-1.5 rounded bg-white shadow-sm font-label-caps text-on-surface">Daily</button>
            <button className="px-4 py-1.5 rounded hover:bg-surface-variant transition-colors font-label-caps text-on-surface-variant">Weekly</button>
            <button className="px-4 py-1.5 rounded hover:bg-surface-variant transition-colors font-label-caps text-on-surface-variant">Monthly</button>
          </div>
          <button className="bg-primary text-on-primary font-label-caps px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">download</span> Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-on-surface-variant uppercase tracking-wider">Ingresos Brutos</span>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-1.5 rounded-md">trending_up</span>
          </div>
          <div className="font-mono text-4xl font-bold text-on-surface mb-2">$0.00</div>
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <span className="text-on-surface-variant bg-surface-variant px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">horizontal_rule</span> 0.0%
            </span>
            <span className="text-on-surface-variant font-sans font-normal text-sm">vs last period</span>
          </div>
        </div>

        {/* COGS */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-on-surface-variant uppercase tracking-wider">Costo de Ventas (COGS)</span>
            <span className="material-symbols-outlined text-error bg-error/10 p-1.5 rounded-md">inventory_2</span>
          </div>
          <div className="font-mono text-4xl font-bold text-on-surface mb-2">$0.00</div>
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <span className="text-on-surface-variant bg-surface-variant px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">horizontal_rule</span> 0.0%
            </span>
            <span className="text-on-surface-variant font-sans font-normal text-sm">vs last period</span>
          </div>
        </div>

        {/* Operational Expenses */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-on-surface-variant uppercase tracking-wider">Gastos Operativos</span>
            <span className="material-symbols-outlined text-tertiary bg-tertiary/10 p-1.5 rounded-md">receipt_long</span>
          </div>
          <div className="font-mono text-4xl font-bold text-on-surface mb-2">$0.00</div>
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <span className="text-on-surface-variant font-sans font-normal text-sm truncate">Caja Chica + Nómina</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-primary text-on-primary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-caps text-inverse-primary uppercase tracking-wider">Utilidad Neta</span>
            <span className="material-symbols-outlined text-on-primary bg-white/20 p-1.5 rounded-md">account_balance</span>
          </div>
          <div className="font-mono text-4xl font-bold text-on-primary mb-2 relative z-10">$0.00</div>
          <div className="flex items-center gap-2 font-mono text-sm font-bold relative z-10">
            <span className="text-on-primary bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">horizontal_rule</span> 0.0%
            </span>
            <span className="text-inverse-primary font-sans font-normal text-sm">Margen: 0.0%</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 mt-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-headline-sm text-on-surface">Rendimiento Financiero</h2>
            <p className="font-body-md text-sm text-on-surface-variant">Ingresos vs Costos vs Utilidad Neta (Últimos 7 días)</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1F2937]"></div>
              <span className="font-label-caps text-on-surface">Ingresos Brutos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ba1a1a]"></div>
              <span className="font-label-caps text-on-surface">Costo de Ventas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#546254]"></div>
              <span className="font-label-caps text-on-surface">Utilidad Neta</span>
            </div>
          </div>
        </div>
        
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e2e0" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#44474c', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#44474c', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e3e2e0', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="ingresos" name="Ingresos Brutos" stroke="#1F2937" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#faf9f7' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="cogs" name="Costo de Ventas" stroke="#ba1a1a" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, strokeWidth: 2, fill: '#faf9f7' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="utilidad" name="Utilidad Neta" stroke="#546254" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#faf9f7' }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4 pb-8">
        
        {/* Expenses Breakdown */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 flex flex-col h-full">
          <h3 className="font-headline-sm text-on-surface mb-6">Desglose de Gastos Operativos</h3>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <div className="font-body-md font-semibold text-on-surface">Nómina (Payroll)</div>
                  <div className="font-label-caps text-[10px] text-on-surface-variant mt-0.5 uppercase">Sueldos y comisiones</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-on-surface">$0.00</div>
                <div className="font-mono font-bold text-[11px] text-on-surface-variant">0.0% del G.O.</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">point_of_sale</span>
                </div>
                <div>
                  <div className="font-body-md font-semibold text-on-surface">Caja Chica (Petty Cash)</div>
                  <div className="font-label-caps text-[10px] text-on-surface-variant mt-0.5 uppercase">Gastos menores diarios</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-on-surface">$0.00</div>
                <div className="font-mono font-bold text-[11px] text-on-surface-variant">0.0% del G.O.</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-outline-variant/30 shrink-0">
            <div className="flex justify-between font-label-caps text-[10px] text-on-surface-variant mb-2 uppercase">
              <span>Distribución de Gastos</span>
              <span>$0.00 Total</span>
            </div>
            <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: '61.5%' }} title="Nómina"></div>
              <div className="h-full bg-[#250d05]" style={{ width: '38.5%' }} title="Caja Chica"></div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Ledger */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
            <h3 className="font-headline-sm text-on-surface">Registro de Deducciones Recientes</h3>
            <button className="text-primary hover:text-primary/80 font-label-caps text-[12px] uppercase">Ver Todo</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/20 uppercase">
              <span>Descripción</span>
              <span className="text-right w-24">Categoría</span>
              <span className="text-right w-24">Monto</span>
            </div>
            
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-3">receipt_long</span>
              <p className="font-headline-sm text-on-surface-variant">Sin deducciones recientes</p>
              <p className="font-body-md text-sm text-on-surface-variant/70 mt-1 max-w-[250px]">
                No hay registros de caja chica ni nómina en el periodo actual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
