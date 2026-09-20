import { useAuthStore } from '../store/authStore';

export function LicenseInfoView() {
  const licenseInfo = useAuthStore(state => state.licenseInfo);

  if (!licenseInfo) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Información de Licencia</h1>
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-8 text-center text-slate-400">
          No se pudo cargar la información de la licencia.
        </div>
      </div>
    );
  }

  const purchasedAt = new Date(licenseInfo.createdAt * 1000);
  const expiresAt = new Date(licenseInfo.expiresAt);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isExpiringSoon = diffDays <= 15;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500">workspace_premium</span>
          Estado de tu Licencia
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Información sobre la suscripción y vencimiento del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Días Restantes */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl">timer</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-1">Días Restantes</p>
            <p className={`text-4xl font-extrabold ${isExpiringSoon ? 'text-rose-500' : 'text-emerald-400'} mb-2`}>
              {diffDays}
            </p>
            <p className="text-xs text-slate-500">
              {diffDays > 0 ? 'Días para renovar' : 'Licencia Vencida'}
            </p>
          </div>
        </div>

        {/* Fecha de Adquisición */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl">calendar_month</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-1">Adquirida El</p>
            <p className="text-xl font-bold text-slate-200 mb-1">
              {purchasedAt.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-slate-500">Inicio de suscripción</p>
          </div>
        </div>

        {/* Fecha de Vencimiento */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl">event_busy</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-1">Finaliza El</p>
            <p className={`text-xl font-bold ${isExpiringSoon ? 'text-rose-400' : 'text-slate-200'} mb-1`}>
              {expiresAt.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-slate-500">Fin de suscripción</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-blue-400 text-3xl">info</span>
          <div>
            <h3 className="text-blue-400 font-bold mb-2">Acerca de tu Licencia</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              El Sistema de Ventas (Heritage POS) valida tu licencia automáticamente a través de internet de manera segura. Si deseas renovar, extender tu tiempo o solicitar asistencia, comunícate con tu proveedor.
            </p>
            <div className="bg-[#050505] border border-[#30363d] px-4 py-3 rounded-lg overflow-x-auto">
              <p className="text-xs font-mono text-slate-500 mb-1">Clave de Licencia Instalada:</p>
              <p className="text-xs text-slate-300 font-mono select-all break-all">{licenseInfo.token}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
