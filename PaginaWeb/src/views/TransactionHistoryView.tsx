import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useLiveDateTime } from '../hooks/useLiveDateTime';
import { useAuthStore } from '../store/authStore';

interface Transaction {
  id: number;
  timestamp: number;
  total: number;
  payment_method: string;
  cashier: string;
}

export function TransactionHistoryView() {
  const navigate = useNavigate();
  const { time24, dateShortUpper } = useLiveDateTime();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin';

  const [selectedTx, setSelectedTx] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txDetails, setTxDetails] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('Todo');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Para trabajadores siempre se bloquea a la fecha de hoy. El admin puede seleccionar cualquier fecha o ver todo.
  const effectiveDate = isAdmin ? selectedDate : todayStr;

  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth()); // 0-11

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Days in selected month
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();

  // Transactions per day lookup
  const txDaysMap = new Map<string, number>();
  transactions.forEach(t => {
    const d = new Date(t.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    txDaysMap.set(key, (txDaysMap.get(key) || 0) + 1);
  });

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const dStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dStr);
    setIsCalendarOpen(false);
  };

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/sales`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
          if (data.length > 0) setSelectedTx(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching sales:', err);
      }
    };
    fetchSales();
  }, []);

  useEffect(() => {
    if (!selectedTx) return;
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/sales/${selectedTx}`);
        if (res.ok) {
          const data = await res.json();
          setTxDetails(data);
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      }
    };
    fetchDetails();
  }, [selectedTx]);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Efectivo': return 'payments';
      case 'Tarjeta': return 'credit_card';
      case 'Fiado': return 'request_quote';
      case 'SPEI': return 'account_balance';
      case 'Mixto': return 'pie_chart';
      default: return 'payments';
    }
  };

  const getTxType = (tx: Transaction) => {
    if (tx.total < 0) return 'Devolución';
    if (tx.payment_method === 'Fiado') return 'Crédito';
    return 'Venta';
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'Devolución': return 'bg-error/15 text-error font-bold';
      case 'Crédito': return 'bg-primary/15 text-primary font-bold';
      default: return 'bg-secondary/20 text-secondary font-bold';
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('es-MX', { hour12: false });
  };

  const filteredTransactions = transactions.filter(tx => {
    // 1. Filtro por Fecha (Trabajadores = Solo Hoy; Admin = Fecha elegida o todas)
    if (effectiveDate) {
      const txDate = new Date(tx.timestamp);
      const y = txDate.getFullYear();
      const m = String(txDate.getMonth() + 1).padStart(2, '0');
      const d = String(txDate.getDate()).padStart(2, '0');
      const txDateStr = `${y}-${m}-${d}`;
      if (txDateStr !== effectiveDate) return false;
    }

    // 2. Filtro por Búsqueda de Texto
    const term = searchTerm.toLowerCase().trim();
    const folioMatch = `TX-${tx.id.toString().padStart(5, '0')}`.toLowerCase().includes(term);
    const amountMatch = Math.abs(tx.total).toFixed(2).includes(term) || tx.total.toString().includes(term);
    const cashierMatch = (tx.cashier || '').toLowerCase().includes(term);
    const methodMatch = (tx.payment_method || '').toLowerCase().includes(term);

    const matchesSearch = !term || folioMatch || amountMatch || cashierMatch || methodMatch;
    if (!matchesSearch) return false;

    // 3. Filtro por Método / Tipo
    const methodLower = (tx.payment_method || '').toLowerCase();
    switch (filterMethod) {
      case 'Ventas':
        return tx.total >= 0;
      case 'Devoluciones':
        return tx.total < 0 || methodLower.includes('devolución') || methodLower.includes('devolucion');
      case 'Efectivo':
        return methodLower.includes('efectivo');
      case 'Tarjeta':
        return methodLower.includes('tarjeta') || methodLower.includes('card');
      case 'Fiado':
        return methodLower.includes('fiado') || methodLower.includes('crédito') || methodLower.includes('credito');
      case 'Todo':
      default:
        return true;
    }
  });

  // Mantener sincronizado el ticket seleccionado al cambiar de filtro o fecha
  useEffect(() => {
    if (filteredTransactions.length > 0) {
      if (!selectedTx || !filteredTransactions.some(t => t.id === selectedTx)) {
        setSelectedTx(filteredTransactions[0].id);
      }
    } else {
      setSelectedTx(null);
      setTxDetails(null);
    }
  }, [filterMethod, searchTerm, selectedDate, transactions]);

  return (
    <div className="flex flex-col w-full h-screen bg-surface overflow-hidden">
      {/* Header POS / Admin Style */}
      <header className="sticky top-0 h-[64px] min-h-[64px] max-h-[64px] bg-primary shadow-lg z-50 flex items-center px-6 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {isAdmin ? (
            <>
              <button 
                onClick={() => navigate('/admin')}
                className="w-10 h-10 flex items-center justify-center bg-on-primary-container/20 text-on-primary rounded-xl border border-white/10 hover:bg-on-primary-container/30 transition-all cursor-pointer"
                title="Panel Administrador"
              >
                <span className="material-symbols-outlined text-xl">dashboard</span>
              </button>
              <button 
                onClick={() => navigate('/pos')}
                className="w-10 h-10 flex items-center justify-center bg-on-primary-container/20 text-on-primary rounded-xl border border-white/10 hover:bg-on-primary-container/30 transition-all cursor-pointer"
                title="Punto de Venta"
              >
                <span className="material-symbols-outlined text-xl">point_of_sale</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/pos')}
              className="w-10 h-10 flex items-center justify-center bg-on-primary-container/20 text-on-primary rounded-xl border border-white/10 hover:bg-on-primary-container/30 transition-all cursor-pointer"
              title="Volver al Punto de Venta"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          )}

          <div className="h-10 w-px bg-white/10 mx-1"></div>
          <div className="flex flex-col">
            <span className="text-white font-mono text-lg leading-tight tracking-tight font-bold">{time24}</span>
            <span className="text-[11px] text-primary-fixed-dim font-bold uppercase tracking-wider">{dateShortUpper}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-bold text-lg">{isAdmin ? 'Historial Global' : 'Ventas del Día'}</p>
            <p className="text-xs text-white/70 font-bold uppercase tracking-widest">{isAdmin ? 'Modo Administrador' : 'Turno Activo'}</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <span className="material-symbols-outlined text-white">receipt_long</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row relative bg-surface overflow-hidden">
        
        {/* Left Side: Table */}
        <div className="flex-1 flex flex-col w-full bg-surface-container-low min-h-0 relative z-10 shadow-sm border-r border-outline-variant/30">
          <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md px-6 py-6 border-b border-outline-variant/30 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Historial de Transacciones</h1>
                <p className="text-body-md text-on-surface-variant max-w-2xl">
                  {isAdmin 
                    ? 'Registro detallado de operaciones de la jornada actual o histórico completo.' 
                    : 'Registro detallado de las operaciones de la jornada actual en curso.'}
                </p>
              </div>
              
              {/* Selector de Fecha: Interactivo para Admin / Fijo a Hoy para Empleados */}
              {isAdmin ? (
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="flex items-center gap-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/50 px-4 py-2 rounded-2xl transition-all shadow-xs group cursor-pointer active:scale-98"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">calendar_month</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block tracking-wider leading-none">Fecha de Consulta</span>
                      <span className="font-mono text-xs font-bold text-on-surface uppercase tracking-wider block mt-0.5">
                        {selectedDate 
                          ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Todas las Fechas'}
                      </span>
                    </div>
                    <span className={`material-symbols-outlined text-base text-on-surface-variant transition-transform ${isCalendarOpen ? 'rotate-180 text-primary' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Popover Custom Calendario */}
                  {isCalendarOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsCalendarOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-3xl p-5 shadow-2xl border border-outline-variant/30 z-50 animate-[scale-in_0.15s_ease-out]">
                        
                        {/* Cabecera del Mes */}
                        <div className="flex items-center justify-between mb-3">
                          <button 
                            type="button"
                            onClick={handlePrevMonth}
                            className="w-8 h-8 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                          </button>
                          
                          <div className="text-center">
                            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                              {monthNames[calendarMonth]} {calendarYear}
                            </span>
                          </div>

                          <button 
                            type="button"
                            onClick={handleNextMonth}
                            className="w-8 h-8 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                          </button>
                        </div>

                        {/* Días de la Semana */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {daysOfWeek.map((d, i) => (
                            <span key={i} className="text-[10px] font-bold text-on-surface-variant/70 uppercase">
                              {d}
                            </span>
                          ))}
                        </div>

                        {/* Cuadrícula de Días */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8" />
                          ))}

                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const isSelected = selectedDate === dateStr;
                            const todayDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                            const isToday = todayDayStr === dateStr;
                            const txCount = txDaysMap.get(dateStr) || 0;

                            return (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => handleSelectDay(dayNum)}
                                className={`h-8 w-full rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary text-white shadow-md scale-105'
                                    : isToday
                                    ? 'bg-primary/15 text-primary border border-primary/40 font-black hover:bg-primary hover:text-white'
                                    : 'text-on-surface hover:bg-surface-container hover:scale-105'
                                }`}
                              >
                                <span>{dayNum}</span>
                                {txCount > 0 && !isSelected && (
                                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-secondary" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Accesos Directos */}
                        <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex justify-between items-center text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate('');
                              setIsCalendarOpen(false);
                            }}
                            className="text-on-surface-variant hover:text-primary font-bold uppercase tracking-wider text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">history</span>
                            Ver Todo
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const todayDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                              setCalendarYear(now.getFullYear());
                              setCalendarMonth(now.getMonth());
                              setSelectedDate(todayDayStr);
                              setIsCalendarOpen(false);
                            }}
                            className="px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl font-bold uppercase tracking-wider text-[11px] transition-colors cursor-pointer"
                          >
                            Hoy ({now.getDate()})
                          </button>
                        </div>

                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Badge Fijo para Empleados */
                <div className="flex items-center gap-2.5 bg-surface-container border border-outline-variant/30 px-4 py-2 rounded-2xl shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block tracking-wider leading-none">Jornada Actual</span>
                    <span className="font-mono text-xs font-bold text-on-surface uppercase tracking-wider block mt-0.5">
                      HOY • {dateShortUpper}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center w-full">
              <div className="relative flex-1 w-full group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-3 pl-12 pr-4 font-body-md transition-all shadow-sm outline-none" 
                  placeholder="Buscar por Folio, Monto o Cajero..." 
                  type="text" 
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {['Todo', 'Ventas', 'Devoluciones', 'Efectivo', 'Tarjeta', 'Fiado'].map((m) => (
                  <button 
                    key={m}
                    onClick={() => setFilterMethod(m)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm whitespace-nowrap border cursor-pointer ${
                      filterMethod === m 
                        ? 'bg-primary text-on-primary border-transparent' 
                        : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-variant'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container z-10 shadow-sm">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap w-24">Hora</th>
                  <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap w-36">Folio</th>
                  <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Tipo</th>
                  <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Método</th>
                  <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap hidden lg:table-cell">Cajero / Usuario</th>
                  <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap text-right">Total</th>
                  <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap w-16 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/20 cursor-pointer">
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant font-body-md">
                      No hay transacciones registradas que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
                {filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.id}
                    onClick={() => setSelectedTx(tx.id)}
                    className={`transition-colors group relative ${selectedTx === tx.id ? 'bg-primary/5' : 'hover:bg-secondary/10'}`}
                  >
                    <td className="py-4 px-6 font-mono text-sm font-bold text-on-surface whitespace-nowrap">{formatTime(tx.timestamp)}</td>
                    <td className="py-4 px-6 font-mono whitespace-nowrap">
                      <span className="text-sm font-bold text-on-surface block">TX-{tx.id.toString().padStart(5, '0')}</span>
                      <span className="text-[11px] text-on-surface-variant font-sans flex items-center gap-1 font-semibold lg:hidden">
                        <span className="material-symbols-outlined text-[12px] text-primary">person</span>
                        {tx.cashier || 'Cajero'}
                      </span>
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getTypeStyle(getTxType(tx))}`}>
                        {getTxType(tx)}
                      </span>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-[18px]">{getMethodIcon(tx.payment_method)}</span>
                        <span className="text-sm font-medium text-on-surface">{tx.payment_method}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          <span className="material-symbols-outlined text-[15px]">person</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface whitespace-nowrap">
                          {tx.cashier || 'Cajero'}
                        </span>
                      </div>
                    </td>
                    <td className={`py-4 px-6 font-mono text-lg font-bold text-right whitespace-nowrap ${tx.total < 0 ? 'text-error' : 'text-on-surface'}`}>
                      {tx.total < 0 ? '-' : ''}$ {Math.abs(tx.total).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center" onClick={(e) => { e.stopPropagation(); setSelectedTx(tx.id); setShowDetailModal(true); }}>
                      <button 
                        type="button"
                        aria-label="Ver Detalle" 
                        title="Ver Detalle Completo de la Venta"
                        className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 mx-auto cursor-pointer shadow-xs active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>Detalle</span>
                      </button>
                    </td>
                    {selectedTx === tx.id && (
                      <td className="absolute left-0 top-0 bottom-0 w-1 bg-secondary block"></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Receipt Preview */}
        <div className="w-full lg:w-[400px] xl:w-[480px] bg-surface flex flex-col h-[600px] lg:h-auto border-t lg:border-t-0 lg:border-l border-outline-variant/30 flex-shrink-0 z-20 shadow-xl lg:shadow-none overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest flex justify-center items-center shadow-sm shrink-0">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">receipt_long</span>
              Vista Previa
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-surface-container-low p-6 lg:p-8 flex justify-center custom-scrollbar">
            {/* The Ticket Itself */}
            {txDetails ? (
            <div id="printable-receipt" className="w-full max-w-[360px] h-fit bg-surface-container-lowest p-6 shadow-md relative group font-mono font-bold text-on-surface">
              <div className="text-center mb-6">
                <h3 className="font-sans text-xl font-bold uppercase tracking-widest text-primary mb-1">HERITAGE TERMINAL</h3>
                <p className="text-[11px] leading-tight text-on-surface-variant uppercase tracking-widest font-sans">
                    Av. Principal 1234, Ciudad<br/>
                    RFC: HTR-123456-ABC<br/>
                    Tel: (555) 123-4567
                </p>
              </div>
              <div className="border-t border-dashed border-outline-variant/50 pt-4 pb-4 mb-4 text-[12px] text-on-surface-variant uppercase tracking-widest font-sans">
                <div className="flex justify-between mb-1">
                  <span>Caja: 01</span>
                  <span>Cajero: {txDetails.cashier}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Fecha: {new Date(txDetails.timestamp).toLocaleDateString('es-MX')}</span>
                  <span>Hora: {formatTime(txDetails.timestamp)}</span>
                </div>
                <div className="flex justify-between font-bold text-on-surface">
                  <span>Ticket: TX-{txDetails.id.toString().padStart(5, '0')}</span>
                  <span>Turno: MATUTINO</span>
                </div>
              </div>
              
              <div className="border-t border-dashed border-outline-variant/50 pt-4 pb-2 text-[12px] uppercase font-sans">
                <div className="flex justify-between text-on-surface-variant mb-2 font-bold">
                  <span className="w-8">CANT</span>
                  <span className="flex-1 px-2">DESCRIPCION</span>
                  <span className="text-right">IMPORTE</span>
                </div>
                
                {txDetails.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between mb-2 items-start">
                    <span className="w-8 text-on-surface font-bold">{item.quantity}</span>
                    <div className="flex-1 px-2 flex flex-col">
                      <span className="text-on-surface leading-tight font-bold">{item.name || item.product_sku}</span>
                      {item.name && item.name !== item.product_sku && (
                        <span className="text-[10px] text-on-surface-variant font-mono">{item.product_sku}</span>
                      )}
                    </div>
                    <span className="text-right text-on-surface font-mono font-bold">$ {(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed border-outline-variant/50 pt-4 mt-2">
                <div className="flex justify-between text-[12px] mb-1 text-on-surface-variant uppercase font-sans font-bold">
                  <span>Subtotal:</span>
                  <span className="font-mono">$ {(txDetails.total / 1.16).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[12px] mb-3 text-on-surface-variant uppercase font-sans font-bold">
                  <span>IVA (16%):</span>
                  <span className="font-mono">$ {(txDetails.total - (txDetails.total / 1.16)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[18px] font-bold text-on-surface mb-4 font-sans">
                  <span>TOTAL:</span>
                  <span className="font-mono">$ {txDetails.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[12px] mb-1 text-on-surface-variant uppercase font-sans font-bold">
                  <span>PAGO {txDetails.payment_method.toUpperCase()}:</span>
                  <span className="font-mono text-on-surface">$ {txDetails.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[12px] text-on-surface-variant uppercase font-sans font-bold">
                  <span>Cambio:</span>
                  <span className="font-mono">$ 0.00</span>
                </div>
              </div>
              
              <div className="text-center mt-8 text-[10px] text-on-surface-variant uppercase tracking-widest border-t border-dashed border-outline-variant/50 pt-4 font-sans">
                <p className="mb-1 font-bold text-on-surface">¡GRACIAS POR SU COMPRA!</p>
                <p>Conserve este ticket para</p>
                <p>cualquier aclaracion.</p>
                <div className="mt-4 flex justify-center">
                  <svg className="text-on-surface fill-current" height="40" viewBox="0 0 120 40" width="120">
                    <rect height="30" width="4" x="0" y="5"></rect>
                    <rect height="30" width="2" x="6" y="5"></rect>
                    <rect height="30" width="6" x="10" y="5"></rect>
                    <rect height="30" width="2" x="18" y="5"></rect>
                    <rect height="30" width="4" x="22" y="5"></rect>
                    <rect height="30" width="8" x="28" y="5"></rect>
                    <rect height="30" width="2" x="38" y="5"></rect>
                    <rect height="30" width="4" x="42" y="5"></rect>
                    <rect height="30" width="6" x="48" y="5"></rect>
                    <rect height="30" width="2" x="56" y="5"></rect>
                    <rect height="30" width="8" x="60" y="5"></rect>
                    <rect height="30" width="4" x="70" y="5"></rect>
                    <rect height="30" width="2" x="76" y="5"></rect>
                    <rect height="30" width="6" x="80" y="5"></rect>
                    <rect height="30" width="4" x="88" y="5"></rect>
                    <rect height="30" width="2" x="94" y="5"></rect>
                    <rect height="30" width="8" x="98" y="5"></rect>
                    <rect height="30" width="2" x="108" y="5"></rect>
                    <rect height="30" width="4" x="112" y="5"></rect>
                  </svg>
                </div>
                <p className="mt-1 font-mono font-bold">TX-{txDetails.id.toString().padStart(5, '0')}</p>
              </div>
              
              {/* Receipt Cutouts */}
              <div className="absolute -left-2 top-10 w-4 h-4 bg-surface-container-low rounded-full"></div>
              <div className="absolute -right-2 top-10 w-4 h-4 bg-surface-container-low rounded-full"></div>
              <div className="absolute -left-2 bottom-20 w-4 h-4 bg-surface-container-low rounded-full"></div>
              <div className="absolute -right-2 bottom-20 w-4 h-4 bg-surface-container-low rounded-full"></div>
            </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2">receipt</span>
                <p>Seleccione una transacción para ver los detalles.</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
            <button 
              type="button"
              disabled={!txDetails}
              onClick={() => window.print()}
              className="w-full bg-primary text-white hover:bg-primary/90 transition-all py-4 px-6 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 shadow-md border border-transparent cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-xl">print</span>
              <span>Imprimir Comprobante</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modal: Detalle Completo de la Venta */}
      {showDetailModal && txDetails && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
          <div className="bg-surface w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] animate-[scale-in_0.15s_ease-out]">
            
            {/* Header */}
            <div className="p-5 bg-primary text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Detalle de Venta • TX-{txDetails.id.toString().padStart(5, '0')}
                  </h3>
                  <p className="text-xs text-white/80">Información completa de la operación registrada</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-container rounded-2xl border border-outline-variant/20">
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Cajero / Operador</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-base">person</span>
                    <span className="font-bold text-on-surface">{txDetails.cashier || 'Cajero General'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Método de Pago</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-base">{getMethodIcon(txDetails.payment_method)}</span>
                    <span className="font-bold text-on-surface">{txDetails.payment_method}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Fecha</span>
                  <span className="font-mono font-bold text-on-surface">
                    {new Date(txDetails.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Hora Exacta</span>
                  <span className="font-mono font-bold text-on-surface">{formatTime(txDetails.timestamp)} hrs</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">shopping_bag</span>
                  Productos Vendidos ({txDetails.items?.length || 0})
                </h4>

                <div className="border border-outline-variant/20 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-high text-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Cant.</th>
                        <th className="py-2.5 px-3">Producto</th>
                        <th className="py-2.5 px-3 text-right">P. Unit</th>
                        <th className="py-2.5 px-3 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {!txDetails.items || txDetails.items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-on-surface-variant text-xs">
                            Venta registrada sin desglose individual de artículos.
                          </td>
                        </tr>
                      ) : (
                        txDetails.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-container-low/50">
                            <td className="py-2 px-3 font-mono font-bold text-primary text-xs">
                              {item.quantity} {item.is_bulk ? 'kg' : 'pz'}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-on-surface block">{item.name || item.product_sku}</span>
                              {item.name && item.name !== item.product_sku && (
                                <span className="text-[10px] text-on-surface-variant font-mono">{item.product_sku}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-on-surface-variant">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-on-surface">
                              ${(item.quantity * item.price).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="p-3.5 bg-surface-container rounded-2xl border border-outline-variant/20 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span className="font-sans">Subtotal (sin IVA):</span>
                  <span>${(txDetails.total / 1.16).toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span className="font-sans">IVA (16%):</span>
                  <span>${(txDetails.total - (txDetails.total / 1.16)).toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-sm font-black text-on-surface pt-1.5 border-t border-outline-variant/20">
                  <span className="font-sans">TOTAL VENTA:</span>
                  <span className="text-primary text-base">${txDetails.total.toFixed(2)} MXN</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-end shrink-0 shadow-md">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="w-full sm:w-auto h-11 px-8 bg-surface-container border border-outline-variant/40 hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer active:scale-98"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
