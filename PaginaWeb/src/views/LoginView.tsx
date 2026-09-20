import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) return;
    
    const success = await login(username, password);
    if (success) {
      const user = useAuthStore.getState().user;
      if (user?.role === 'cashier') {
        navigate('/pos');
      } else {
        navigate('/');
      }
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-container-lowest flex items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 bg-surface/60 backdrop-blur-3xl border border-white/20 shadow-2xl rounded-3xl p-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Logo / Icon */}
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
          <span className="material-symbols-outlined text-white text-3xl">storefront</span>
        </div>
        
        <h1 className="font-headline-md text-on-surface mb-2 tracking-tight">Bienvenido al Kiosco</h1>
        <p className="text-body-sm text-on-surface-variant text-center mb-8">
          Ingresa tus credenciales para acceder al sistema.
        </p>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Usuario</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">person</span>
              <input 
                type="text" 
                value={username}
                onChange={e => { setUsername(e.target.value); setError(false); }}
                placeholder="ej. admin o cajero"
                className="w-full h-12 bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Contraseña</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">lock</span>
              <input 
                type="password" 
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder="••••••••"
                className="w-full h-12 bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!username || !password}
            className="h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">login</span>
            Iniciar Sesión
          </button>
        </form>

        <div className="h-6">
          {error && (
            <p className="text-error text-sm font-bold text-center animate-[fade-in_0.3s_ease-out]">
              Credenciales incorrectas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
