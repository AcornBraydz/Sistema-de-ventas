import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

interface GitHubStyleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowReturns?: () => void;
  onShowCashFund?: () => void;
  onShowCashWithdrawal?: () => void;
  onShowXCut?: () => void;
  onShowWasteModal?: () => void;
  onShowStockLookup?: () => void;
}

export function GitHubStyleDrawer({
  isOpen,
  onClose,
  onShowReturns,
  onShowCashFund: _onShowCashFund,
  onShowCashWithdrawal: _onShowCashWithdrawal,
  onShowXCut,
  onShowWasteModal,
  onShowStockLookup: _onShowStockLookup
}: GitHubStyleDrawerProps) {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const settings = useSettingsStore(state => state.settings);
  const isAdmin = user?.role === 'admin';
  const [filterQuery, setFilterQuery] = useState('');
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  if (!isOpen) return null;

  const isCurrent = (path: string) => location.pathname === path;

  // Compact, ultra-clean top-tier navigation item
  const getNavItemClass = (path: string) => `
    flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group cursor-pointer border
    ${isCurrent(path)
      ? 'bg-[#21262d] text-white border-blue-500/40 shadow-xs border-l-[3px] border-l-blue-500'
      : 'text-slate-300 hover:text-white hover:bg-[#1c2128] border-transparent'
    }
  `;

  const q = filterQuery.toLowerCase().trim();
  const matches = (text: string) => !q || text.toLowerCase().includes(q);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] transition-opacity duration-200 animate-[fade-in_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Compact GitHub-Style Drawer */}
      <div className="fixed top-0 left-0 bottom-0 w-[300px] max-w-[85vw] bg-[#0d1117] text-slate-100 shadow-2xl z-[201] flex flex-col border-r border-[#30363d] animate-[slide-right_0.2s_cubic-bezier(0.16,1,0.3,1)] font-sans text-xs select-none">
        
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {settings.store_logo ? (
              <div className="w-8 h-8 rounded-lg bg-white border border-[#30363d] flex items-center justify-center overflow-hidden shadow-xs">
                <img src={settings.store_logo} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-lg text-slate-300">storefront</span>
              </div>
            )}
            <div>
              <h2 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                {settings.branch_name || 'Heritage POS'}
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#21262d] text-slate-400 font-mono font-bold border border-[#30363d]">
                  v2.0
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Terminal Unificada</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#30363d]"
            title="Cerrar Menú (Esc)"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Compact Search Bar */}
        <div className="px-3 py-2 border-b border-[#30363d] bg-[#0d1117]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">
              search
            </span>
            <input 
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Buscar sección o comando..."
              className="w-full bg-[#161b22] pl-8 pr-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 border border-[#30363d] focus:border-blue-500 focus:outline-none placeholder:text-slate-500 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
          
          {/* Section 1: Punto de Venta */}
          <div className="space-y-1">
            <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Punto de Venta</span>
              <span className="text-[9px] text-slate-500 font-mono">OPERATIVO</span>
            </div>

            {location.pathname !== '/pos' && matches('kiosco de venta punto terminal cobrar') && (
              <Link 
                to="/pos" 
                onClick={onClose}
                className={getNavItemClass('/pos')}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">point_of_sale</span>
                  <span>Kiosco de Venta</span>
                </div>
              </Link>
            )}

            {matches('historial de transacciones tickets ventas') && (
              <Link 
                to="/history" 
                onClick={onClose}
                className={getNavItemClass('/history')}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">receipt_long</span>
                  <span>Historial de Transacciones</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-[#21262d] px-1.5 py-0.2 rounded border border-[#30363d]">
                  F2
                </span>
              </Link>
            )}

            {matches('buscar cliente abonar fiado credito') && (
              <Link 
                to="/pos/customers" 
                onClick={onClose}
                className={getNavItemClass('/pos/customers')}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">person_search</span>
                  <span>Clientes & Crédito (Abonos)</span>
                </div>
              </Link>
            )}
          </div>

          {/* Section 2: Gestión de Caja & Turno */}
          {(onShowXCut || onShowReturns || onShowWasteModal) && (
            <div className="space-y-1">
              <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Gestión de Caja</span>
                <span className="text-[9px] text-slate-500 font-mono">ARQUEO</span>
              </div>

            {/* Fondo Inicial eliminado a petición del usuario */}

            {onShowXCut && matches('cierre de turno arqueo') && (
              <button 
                type="button"
                onClick={() => { onClose(); onShowXCut(); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1c2128] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">lock_clock</span>
                  <span>Cierre de Turno</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-[#21262d] px-1.5 py-0.2 rounded border border-[#30363d]">
                  NIP
                </span>
              </button>
            )}

            {onShowReturns && matches('devolucion de mercancia devoluciones') && (
              <button 
                type="button"
                onClick={() => { onClose(); onShowReturns(); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1c2128] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">assignment_return</span>
                  <span>Devolución de Mercancía</span>
                </div>
              </button>
            )}

            {onShowWasteModal && matches('registro de merma merma desecho') && (
              <button 
                type="button"
                onClick={() => { onClose(); onShowWasteModal(); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1c2128] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">delete_sweep</span>
                  <span>Registro de Merma / Daño</span>
                </div>
              </button>
            )}
          </div>
          )}

          {/* Section 3: Administración & Almacén (Para administradores) */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-[#30363d]">
              <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Administración</span>
                <span className="text-[9px] text-slate-500 font-mono font-bold">GERENCIA</span>
              </div>

              {location.pathname !== '/admin' && matches('panel general dashboard administracion') && (
                <Link 
                  to="/admin" 
                  onClick={onClose}
                  className={getNavItemClass('/admin')}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">dashboard</span>
                    <span>Panel General (Dashboard)</span>
                  </div>
                </Link>
              )}

              {matches('historial ventas transacciones tickets admin') && (
                <Link 
                  to="/admin/history" 
                  onClick={onClose}
                  className={getNavItemClass('/admin/history')}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">receipt_long</span>
                    <span>Historial de Ventas</span>
                  </div>
                </Link>
              )}

              {matches('existencias auditoria inventario stock reportes estadisticas alta de producto escaner lector codigo barras proveedores abastecimiento preventistas') && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1c2128] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">inventory_2</span>
                      <span>Gestión de Inventario</span>
                    </div>
                    <span className={`material-symbols-outlined text-sm text-slate-500 transition-transform ${isInventoryOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  
                  {isInventoryOpen && (
                    <div className="pl-9 pr-3 py-1 space-y-1 bg-[#0d1117] rounded-lg mt-1 border border-[#30363d]/50">
                      <Link 
                        to="/admin/inventory" 
                        onClick={onClose}
                        className={getNavItemClass('/admin/inventory')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-slate-400">check_box</span>
                          <span>Existencias & Auditoría</span>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/admin/inventory/reports" 
                        onClick={onClose}
                        className={getNavItemClass('/admin/inventory/reports')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-slate-400">bar_chart</span>
                          <span>Reportes de Inventario</span>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/admin/inventory/new" 
                        onClick={onClose}
                        className={getNavItemClass('/admin/inventory/new')}
                      >
                        <div className="flex items-center gap-2 justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">barcode_scanner</span>
                            <span>Alta de Producto</span>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#21262d] text-slate-400 font-mono border border-[#30363d]">
                            NUEVO
                          </span>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/admin/inventory/suppliers" 
                        onClick={onClose}
                        className={getNavItemClass('/admin/inventory/suppliers')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-slate-400">local_shipping</span>
                          <span>Directorio de Proveedores</span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {matches('finanzas resumen fiscal metricas cuentas por cobrar fiado deudores nomina turnos trabajadores sueldos') && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer group ${
                      location.pathname.startsWith('/admin/finance') || location.pathname.startsWith('/admin/payroll')
                        ? 'bg-[#21262d] text-white border border-blue-500/40 border-l-[3px] border-l-blue-500' 
                        : 'text-slate-300 hover:text-white hover:bg-[#1c2128]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">account_balance</span>
                      <span>Finanzas</span>
                    </div>
                    <span className={`material-symbols-outlined text-base text-slate-400 transition-transform ${isFinanceOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {isFinanceOpen && (
                    <div className="pl-6 space-y-1 mt-1">
                      <Link 
                        to="/admin/finance" 
                        onClick={onClose}
                        className={getNavItemClass('/admin/finance')}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">analytics</span>
                          <span>Resumen Fiscal</span>
                        </div>
                      </Link>
                      <Link 
                        to="/admin/finance/receivables" 
                        onClick={onClose}
                        className={getNavItemClass('/admin/finance/receivables')}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">account_balance_wallet</span>
                          <span>Cuentas por Cobrar (Fiado)</span>
                        </div>
                      </Link>
                      <Link 
                        to="/admin/payroll" 
                        onClick={onClose}
                        className={getNavItemClass('/admin/payroll')}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">calculate</span>
                          <span>Gestión de Nómina y Turnos</span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-section: Sistema */}
              <div className="space-y-1 pt-3 mt-3 border-t border-[#30363d]/50">
                <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Sistema</span>
                  <span className="text-[9px] text-slate-500 font-mono">CONFIG</span>
                </div>

                {matches('control de personal empleados staff usuarios acceso roles permisos') && (
                  <Link 
                    to="/admin/staff" 
                    onClick={onClose}
                    className={getNavItemClass('/admin/staff')}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">manage_accounts</span>
                      <span>Control de Personal</span>
                    </div>
                  </Link>
                )}

                {matches('configuracion ajustes sistema preferencias negocio impresora') && (
                  <Link 
                    to="/admin/settings" 
                    onClick={onClose}
                    className={getNavItemClass('/admin/settings')}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-white">settings</span>
                      <span>Configuración</span>
                    </div>
                  </Link>
                )}
              </div>

            </div>
          )}
        </div>

        {/* User Footer Profile Card - Sin icono de cerrar sesión */}
        <div className="px-3.5 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'Usuario'}</p>
              <p className="text-[10px] text-slate-400 uppercase font-mono">{isAdmin ? 'Administrador' : 'Cajero'}</p>
            </div>
          </div>


        </div>
      </div>
    </>
  );
}
