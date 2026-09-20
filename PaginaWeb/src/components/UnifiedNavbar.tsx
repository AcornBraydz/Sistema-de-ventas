import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLiveDateTime } from '../hooks/useLiveDateTime';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

interface UnifiedNavbarProps {
  onOpenDrawer: () => void;
  title?: string;
  badgeText?: string;
  rightActions?: React.ReactNode;
}

export function UnifiedNavbar({
  onOpenDrawer,
  title = 'HERITAGE TERMINAL',
  badgeText,
  rightActions
}: UnifiedNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { time24, dateShortUpper } = useLiveDateTime();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin';
  const settings = useSettingsStore(state => state.settings);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-[64px] min-h-[64px] max-h-[64px] w-full bg-primary text-white backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-premium z-30 border-b border-white/10 select-none font-sans">
      
      {/* Left Section: GitHub Hamburger Menu + Branding + Time */}
      <div className="flex items-center gap-3 sm:gap-6">
        
        {/* GitHub-style Hamburger Button */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white px-3.5 sm:px-4 py-2 rounded-xl border border-white/15 transition-all cursor-pointer font-bold text-xs uppercase tracking-wider active:scale-98 shadow-sm group"
          title="Abrir Menú Principal (GitHub Style)"
        >
          <div className="flex flex-col gap-1 w-4.5 items-start">
            <span className="w-full h-0.5 bg-white rounded-full group-hover:bg-slate-200 transition-colors"></span>
            <span className="w-3/4 h-0.5 bg-white rounded-full group-hover:w-full group-hover:bg-slate-200 transition-all"></span>
            <span className="w-full h-0.5 bg-white rounded-full group-hover:bg-slate-200 transition-colors"></span>
          </div>
          <span className="hidden sm:inline font-bold text-slate-100">Menú</span>
        </button>

        <div className="h-8 w-px bg-white/15 hidden sm:block"></div>

        {/* Branding & Status */}
        <div className="flex items-center gap-3">
          {settings.store_logo && (
            <img 
              src={settings.store_logo} 
              alt="Store Logo" 
              className="h-8 max-w-[80px] object-contain hidden sm:block" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white uppercase">
                {title !== 'HERITAGE TERMINAL' ? title : settings.branch_name}
              </span>
              <span className="hidden md:inline px-2 py-0.5 rounded-full bg-white/15 text-slate-200 text-[10px] font-bold font-mono tracking-wider border border-white/15">
                {badgeText || (isAdmin ? 'GERENCIA' : 'CAJA ACTIVA')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-semibold uppercase font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Red Local Activa</span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-white/15 hidden lg:block"></div>

        {/* Clock & Date */}
        <div className="hidden lg:flex flex-col">
          <span className="text-white font-mono leading-tight tracking-tight font-extrabold text-base">{time24}</span>
          <span className="text-[10px] text-slate-300 font-mono uppercase font-semibold tracking-wider">{dateShortUpper}</span>
        </div>
      </div>

      {/* Right Section: Custom Actions + User Profile Menu */}
      <div className="flex items-center gap-3 sm:gap-4 relative">
        {rightActions}

        {/* User Profile Trigger Button */}
        <button
          type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-3 py-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer text-left border border-transparent hover:border-white/15"
        >
          <div className="text-right hidden sm:block">
            <p className="text-white font-bold text-xs uppercase tracking-tight leading-tight">{user?.name || 'Usuario'}</p>
            <p className="text-[10px] text-slate-300 font-mono uppercase font-semibold">{isAdmin ? 'Gerente / Administrador' : 'Cajero Activo'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white text-sm font-extrabold shadow-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
        </button>

        {/* Profile Dropdown Popover (Compact & Clean) */}
        {showProfileMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowProfileMenu(false)}
            />
            <div className="absolute right-0 top-14 w-52 bg-[#0d1117] text-slate-100 rounded-xl shadow-2xl border border-[#30363d] z-50 p-1.5 animate-[scale-in_0.12s_ease-out] space-y-0.5 font-sans text-xs">
              <div className="px-2.5 py-2 border-b border-[#30363d] bg-[#161b22] rounded-lg mb-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Usuario'}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.username || 'usuario'} • {isAdmin ? 'Administrador' : 'Cajero'}</p>
              </div>

              {isAdmin && (
                location.pathname.startsWith('/pos') ? (
                  <Link
                    to="/admin"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#21262d] rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">dashboard</span>
                    <span>Panel Administrador</span>
                  </Link>
                ) : (
                  <Link
                    to="/pos"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#21262d] rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">point_of_sale</span>
                    <span>Punto de Venta</span>
                  </Link>
                )
              )}

              {isAdmin && location.pathname.startsWith('/admin') && (
                <>
                  <Link
                    to="/admin/staff"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#21262d] rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">manage_accounts</span>
                    <span>Control de Personal</span>
                  </Link>

                  <Link
                    to="/admin/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#21262d] rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">settings</span>
                    <span>Configuración</span>
                  </Link>

                  <Link
                    to="/admin/license"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#21262d] rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">workspace_premium</span>
                    <span>Licencia</span>
                  </Link>
                </>
              )}

              <div className="border-t border-[#30363d] pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    useAuthStore.getState().logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
