import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function LicenseLockView() {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [machineId, setMachineId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/system/machine-id`)
      .then(res => res.json())
      .then(data => setMachineId(data.machineId))
      .catch(console.error);
  }, []);

  const handleActivate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          useAuthStore.getState().checkLicense();
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Licencia inválida o expirada.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
      </div>

      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-3xl shadow-2xl overflow-hidden z-10 p-8 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-blue-500/20">
          <span className="material-symbols-outlined text-4xl">lock</span>
        </div>
        
        {success ? (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-emerald-400 mb-2">¡Licencia Activada!</h1>
            <p className="text-slate-400 text-sm mb-6">El sistema se ha desbloqueado correctamente.</p>
            <div className="flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-emerald-500">autorenew</span>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-2">Sistema Bloqueado</h1>
            <p className="text-slate-400 text-sm mb-6">
              La licencia de uso ha expirado o no ha sido configurada. Por favor contacta a tu proveedor para adquirir una nueva licencia.
            </p>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 mb-6">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Tu Código de Máquina</p>
              
              <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-2">
                <p className="text-white font-mono text-sm tracking-wider flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide">{machineId || 'Cargando...'}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(machineId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`p-2 rounded-md transition-colors flex items-center justify-center shrink-0 ${
                    copied 
                      ? 'bg-blue-500 text-white scale-110' 
                      : 'bg-blue-600/20 hover:bg-blue-500/40 text-blue-400'
                  }`}
                  title={copied ? "¡Copiado!" : "Copiar Código"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>

              <p className="text-slate-400 text-[10px] mt-3 leading-tight">Haz clic en el botón de copiar y envía este código para obtener una licencia.</p>
            </div>

            <div className="text-left mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clave de Licencia</label>
              <input 
                type="text" 
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !isLoading && licenseKey.trim()) {
                    handleActivate();
                  }
                }}
                placeholder="Pegar licencia aquí..."
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors font-mono tracking-widest text-center"
              />
              {error && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-lg flex items-center justify-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button 
              onClick={handleActivate}
              disabled={isLoading || !licenseKey.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Activar Licencia'}
            </button>
          </div>
        )}
      </div>
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
