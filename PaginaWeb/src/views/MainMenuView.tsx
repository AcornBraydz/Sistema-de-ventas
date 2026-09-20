import { Link, Navigate } from 'react-router-dom';
import { useLiveDateTime } from '../hooks/useLiveDateTime';
import { useAuthStore } from '../store/authStore';

export function MainMenuView() {
  const { timeShort, dayAndDate } = useLiveDateTime();
  const user = useAuthStore(state => state.user);

  if (user?.role === 'cashier') {
    return <Navigate to="/pos" replace />;
  }

  return (
    <div className="flex h-screen bg-surface flex-col font-body-md relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-surface to-secondary-fixed/20 pointer-events-none z-0"></div>
      
      {/* Top Header */}
      <header className="relative z-10 p-6 flex justify-between items-center bg-surface/50 backdrop-blur-sm border-b border-outline-variant/20">
        <div className="flex items-center gap-4">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlT5ry5CUNSVSoYgfpCifhGtTPCftlQTOBv5_ZQ7ATz2U-kpDYKMu6-YY3C-4Il_mJSX0-i5omtXYDp5lNR4eirdT-eQFh3H2F29cvQ81Wf80dcATxacJ0CLk-0pbxdsHSuoQP595cWSXSvsH_VSU_7_-gdXd1hEavPLkIr1b99JNVAJpvRcHHdVXFo2wd_mgnDtVXx05lGuYe5CI7ea6mcO2lVsGdc9eQn0ZhibkPVzc-QcCBvN9c" 
            alt="Heritage Logo" 
            className="h-10 object-contain drop-shadow-md"
          />
          <div>
            <h1 className="font-headline-lg tracking-tight text-on-surface leading-none mb-1">Heritage</h1>
            <p className="font-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Terminal OS</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-display-price text-xl text-on-surface leading-none">{timeShort}</p>
            <p className="font-label-caps text-on-surface-variant uppercase">{dayAndDate}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          </div>
        </div>
      </header>

      {/* Main Content Hub */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="font-headline-lg text-4xl text-on-surface mb-12 text-center">¿Qué deseas hacer hoy?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* POS Launcher */}
          <Link 
            to="/pos" 
            className="group relative flex flex-col items-center justify-center bg-primary rounded-3xl p-12 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden text-on-primary"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent z-0"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-6xl">point_of_sale</span>
              </div>
              <h3 className="font-headline-lg text-3xl mb-2">Kiosco de Venta</h3>
              <p className="text-center font-body-md text-on-primary/80 max-w-xs">Iniciar turno, cobrar productos, buscar clientes y generar tickets.</p>
            </div>
          </Link>

          {/* Admin Launcher */}
          <Link 
            to="/admin" 
            className="group relative flex flex-col items-center justify-center bg-surface-container-lowest rounded-3xl p-12 shadow-lg border border-outline-variant/20 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 transition-all duration-300 overflow-hidden text-on-surface"
          >
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl z-0 group-hover:bg-primary/10 transition-colors duration-500"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-surface-container rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-outline-variant/30 text-primary">
                <span className="material-symbols-outlined text-6xl">space_dashboard</span>
              </div>
              <h3 className="font-headline-lg text-3xl mb-2">Administración</h3>
              <p className="text-center font-body-md text-on-surface-variant max-w-xs">Ver reportes, gestionar inventario, finanzas, nómina y configuración.</p>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 p-6 flex justify-between items-center text-on-surface-variant font-label-caps text-xs uppercase">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-secondary">wifi</span>
          Conectado a Red Local
        </div>
        <div>
          Versión 2.0.4 • <span className="opacity-70">Heritage Systems</span>
        </div>
      </footer>
    </div>
  );
}
