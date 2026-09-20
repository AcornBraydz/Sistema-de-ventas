import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ImageCropperModal from '../components/ImageCropperModal';

export function OnboardingView() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [storeName, setStoreName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setLogoFile(croppedFile);
    setLogoPreview(URL.createObjectURL(croppedFile));
    setCropImageSrc(null);
  };

  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    if (step === 2 && !storeName.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }
    if (step === 3) {
      if (!adminName.trim() || !adminUsername.trim() || !adminPassword.trim() || !adminPin.trim()) {
        setError('Todos los campos del administrador son obligatorios.');
        return;
      }
      if (adminPin.length < 4) {
        setError('El PIN debe ser de al menos 4 dígitos.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (step < 4) handleNext();
      else handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      let finalLogoUrl = '';
      
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload-logo`, {
          method: 'POST',
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalLogoUrl = uploadData.url;
        } else {
          setError('Error al subir el logo.');
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/system/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: storeName,
          store_logo: finalLogoUrl,
          admin_name: adminName,
          admin_username: adminUsername,
          admin_password: adminPassword,
          admin_pin: adminPin
        })
      });
      
      if (res.ok) {
        await useAuthStore.getState().checkSystemStatus();
        navigate('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'Ocurrió un error al configurar el sistema.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 flex items-center justify-center p-4 font-sans select-none overflow-hidden relative">
      
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          aspectRatio={1}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      <div className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in-up">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-[#0d1117]">
          <div 
            className="h-full bg-blue-500 transition-all duration-500 ease-out" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 sm:p-10">
          
          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-blue-500/20">
                <span className="material-symbols-outlined text-4xl">storefront</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Bienvenido a Heritage</h1>
              <p className="text-slate-400 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
                El sistema de punto de venta premium para tu negocio. Vamos a configurarlo en 3 sencillos pasos para que empieces a vender hoy mismo.
              </p>
              <button 
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 tracking-wide text-sm"
              >
                Comenzar
              </button>
            </div>
          )}

          {/* STEP 2: Store Info */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#21262d] text-slate-300 rounded-full flex items-center justify-center font-bold text-lg border border-[#30363d]">1</div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Tu Negocio</h2>
                  <p className="text-xs text-slate-400">Personaliza la terminal con tu marca</p>
                </div>
              </div>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre Comercial</label>
                  <input 
                    type="text" 
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej. Abarrotes San Juan"
                    autoFocus
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logo de la Sucursal (Opcional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 bg-[#0d1117] border border-[#30363d] border-dashed hover:border-blue-500 rounded-xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden group"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center">
                        <span className="material-symbols-outlined text-3xl text-slate-500 group-hover:text-blue-500 transition-colors mb-2">cloud_upload</span>
                        <p className="text-sm text-slate-400 group-hover:text-slate-300">Click para subir imagen</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs font-bold mb-4">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] text-white font-bold py-3.5 rounded-xl transition-all text-sm">Atrás</button>
                <button onClick={handleNext} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm">Siguiente</button>
              </div>
            </div>
          )}

          {/* STEP 3: Admin Info */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#21262d] text-slate-300 rounded-full flex items-center justify-center font-bold text-lg border border-[#30363d]">2</div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Cuenta Maestra</h2>
                  <p className="text-xs text-slate-400">Crea el administrador principal</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tu Nombre Real</label>
                  <input 
                    type="text" 
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej. Juan Pérez"
                    autoFocus
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Usuario del Sistema</label>
                  <input 
                    type="text" 
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="••••••••"
                        className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none transition-colors"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">NIP (Caja)</label>
                    <div className="relative">
                      <input 
                        type={showPin ? "text" : "password"} 
                        value={adminPin}
                        onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onKeyDown={handleKeyDown}
                        placeholder="1234"
                        className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none tracking-widest text-center transition-colors font-mono"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPin ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs font-bold mb-4">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] text-white font-bold py-3.5 rounded-xl transition-all text-sm">Atrás</button>
                <button onClick={handleNext} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm">Siguiente</button>
              </div>
            </div>
          )}



          {/* STEP 4: Finalize */}
          {step === 4 && (
            <div className="text-center animate-fade-in py-4">
              <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-blue-500/20">
                <span className="material-symbols-outlined text-4xl">done_all</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Todo listo, {adminName.split(' ')[0]}</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-[250px] mx-auto">
                Tu terminal está configurada y lista para empezar a registrar ventas.
              </p>
              
              {error && <p className="text-red-400 text-xs font-bold mb-4">{error}</p>}

              <button 
                onClick={handleFinish}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Finalizando...</>
                ) : (
                  <>Ir al Login <span className="material-symbols-outlined text-lg">arrow_forward</span></>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
      
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
