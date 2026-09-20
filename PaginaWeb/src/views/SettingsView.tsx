import { API_BASE_URL } from '../config';
import { useState, useEffect, useRef } from 'react';
import { useSettingsStore, defaultSettings } from '../store/settingsStore';
import type { SystemSettings } from '../store/settingsStore';
import ImageCropperModal from '../components/ImageCropperModal';

interface EmployeeRateItem {
  id: number;
  name: string;
  username: string;
  role: string;
  hourly_rate: number;
}

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'general' | 'pos' | 'security' | 'devices' | 'payroll' | 'remote'>('general');
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [employees, setEmployees] = useState<EmployeeRateItem[]>([]);
  const [employeeRates, setEmployeeRates] = useState<Record<number, string>>({});
  const [savingEmpId, setSavingEmpId] = useState<number | null>(null);
  const [empRateSuccess, setEmpRateSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);
  const [scannerTestValue, setScannerTestValue] = useState('');
  const [publicLink, setPublicLink] = useState('');

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
    setSettings(prev => ({ ...prev }));
  };

  // Load from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setSettings(prev => ({ ...prev, ...data }));
          }
        }
      } catch (e) {
        console.error('Error cargando configuración:', e);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchPublicLink = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/system/public-link`);
        if (res.ok) {
          const data = await res.json();
          setPublicLink(data.url);
        }
      } catch (e) {
        console.error('Error cargando link publico:', e);
      }
    };
    fetchSettings();
    fetchEmployees();
    fetchPublicLink();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/summary`);
      if (res.ok) {
        const data: EmployeeRateItem[] = await res.json();
        setEmployees(data);
        const map: Record<number, string> = {};
        data.forEach(e => {
          map[e.id] = (e.hourly_rate || 50).toString();
        });
        setEmployeeRates(map);
      }
    } catch (e) {
      console.error('Error cargando empleados para tarifas:', e);
    }
  };

  const handleUpdateSingleRate = async (empId: number, name: string) => {
    const rateVal = parseFloat(employeeRates[empId]);
    if (isNaN(rateVal) || rateVal <= 0) return;
    setSavingEmpId(empId);
    setEmpRateSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${empId}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourly_rate: rateVal })
      });
      if (res.ok) {
        setEmpRateSuccess(`¡Tarifa de $${rateVal.toFixed(2)}/h guardada con éxito para ${name}!`);
        setTimeout(() => setEmpRateSuccess(null), 3500);
        await fetchEmployees();
      }
    } catch (e) {
      console.error('Error actualizando tarifa:', e);
    } finally {
      setSavingEmpId(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalLogoUrl = settings.store_logo || '';

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
          console.error("Error al subir logo");
        }
      }

      const newSettings = { ...settings, store_logo: finalLogoUrl };

      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        useSettingsStore.getState().fetchSettings();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (e) {
      console.error('Error guardando configuración:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = () => {
    setTestPrintSuccess(true);
    setTimeout(() => setTestPrintSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col w-full h-full max-w-7xl mx-auto py-8 px-6 relative">
      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          aspectRatio={1}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
      
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-secondary text-on-secondary px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border border-white/20">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
          <div>
            <div className="font-bold text-sm">¡Configuración Guardada!</div>
            <div className="text-xs opacity-90">Los cambios se aplicaron correctamente a la base de datos.</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-outline-variant/30 pb-6 mb-8">
        <div>
          <h1 className="font-headline-lg text-3xl font-bold text-on-surface mb-2 tracking-tight">Configuración del Sistema</h1>
          <p className="font-body-md text-on-surface-variant max-w-xl text-sm">
            Administra la información de tu tienda, políticas de seguridad, periféricos y dispositivos conectados.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-primary text-on-primary hover:bg-primary/90 px-8 py-3 rounded-xl font-label-caps font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-col gap-1.5 bg-surface-container rounded-2xl p-2 border border-outline-variant/10 shadow-sm">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body-md text-sm cursor-pointer ${activeTab === 'general' ? 'bg-primary text-white font-bold shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">storefront</span>
              General
            </button>
            <button 
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body-md text-sm cursor-pointer ${activeTab === 'pos' ? 'bg-primary text-white font-bold shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">point_of_sale</span>
              Kiosco / POS
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body-md text-sm cursor-pointer ${activeTab === 'security' ? 'bg-primary text-white font-bold shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">security</span>
              Seguridad & NIP
            </button>
            <button 
              onClick={() => setActiveTab('devices')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body-md text-sm cursor-pointer ${activeTab === 'devices' ? 'bg-primary text-white font-bold shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">devices</span>
              Dispositivos & Báscula
            </button>
            <button 
              onClick={() => setActiveTab('payroll')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body-md text-sm cursor-pointer ${activeTab === 'payroll' ? 'bg-primary text-white font-bold shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">price_check</span>
              Tarifas & Nómina
            </button>
            <button 
              onClick={() => setActiveTab('remote')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body-md text-sm cursor-pointer ${activeTab === 'remote' ? 'bg-primary text-white font-bold shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">public</span>
              Acceso Remoto
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">store</span>
                  Información de la Sucursal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Nombre Comercial del Negocio</label>
                    <input 
                      type="text" 
                      value={settings.branch_name}
                      onChange={(e) => setSettings({ ...settings, branch_name: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface font-bold text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Logo de la Sucursal (Opcional)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 bg-surface-container border border-outline-variant/30 border-dashed hover:border-primary rounded-xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden group"
                    >
                      {(logoPreview || settings.store_logo) ? (
                        <img src={logoPreview || settings.store_logo} alt="Logo Preview" className="h-full object-contain p-2" />
                      ) : (
                        <div className="text-center">
                          <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary transition-colors mb-1">add_photo_alternate</span>
                          <p className="text-xs text-on-surface-variant group-hover:text-primary">Click para cambiar logo</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">ID Sucursal / Terminal</label>
                    <input 
                      type="text" 
                      value={settings.branch_id}
                      disabled
                      className="w-full bg-surface-container/50 p-3 rounded-xl border border-outline-variant/10 text-on-surface-variant font-mono opacity-70 text-sm" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Dirección Completa</label>
                    <input 
                      type="text" 
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Teléfono de Contacto</label>
                    <input 
                      type="text" 
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">RFC / Identificación Fiscal</label>
                    <input 
                      type="text" 
                      value={settings.tax_id}
                      onChange={(e) => setSettings({ ...settings, tax_id: e.target.value.toUpperCase() })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface font-mono text-sm uppercase" 
                    />
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">account_balance</span>
                  Cuenta Bancaria para Transferencias (SPEI / Abonos)
                </h3>
                <p className="text-xs text-on-surface-variant mb-6 -mt-3">
                  Estos datos aparecerán en el Punto de Venta cuando un cliente deudor decida abonar o pagar por transferencia electrónica.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">
                      Nombre del Beneficiario / Titular de la Cuenta *
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej. Juan Pérez López / Abarrotes El Barrio"
                      value={settings.bank_beneficiary || ''}
                      onChange={(e) => setSettings({ ...settings, bank_beneficiary: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface font-bold text-sm" 
                    />
                  </div>

                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">
                      Banco Receptor *
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej. BBVA, Santander, Banorte, Nu, Mercado Pago"
                      value={settings.bank_name || ''}
                      onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface text-sm font-bold" 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">
                      CLABE Interbancaria (18 dígitos) *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-on-surface-variant text-base">
                        pin
                      </span>
                      <input 
                        type="text" 
                        maxLength={18}
                        placeholder="012180001234567890"
                        value={settings.bank_clabe || ''}
                        onChange={(e) => setSettings({ ...settings, bank_clabe: e.target.value.replace(/\D/g, '') })}
                        className="w-full bg-surface-container py-3 pl-10 pr-4 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface font-mono font-bold tracking-wider text-base" 
                      />
                    </div>
                  </div>
                </div>

                {/* Vista previa en tiempo real de la tarjeta bancaria */}
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl border border-slate-700 max-w-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Vista Previa en Kiosco POS</span>
                      <span className="font-bold text-base text-emerald-400">{settings.bank_name || 'BANCO NO DEFINIDO'}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-2xl">account_balance</span>
                  </div>
                  <div className="mb-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">CLABE Interbancaria</span>
                    <span className="font-mono text-sm tracking-widest font-bold text-white">
                      {settings.bank_clabe ? settings.bank_clabe.replace(/(\d{4})/g, '$1 ').trim() : '0000 0000 0000 0000 00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-700/60 pt-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Beneficiario / Titular</span>
                      <span className="font-semibold text-slate-200">{settings.bank_beneficiary || 'Nombre del Negocio'}</span>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-500/30">
                      SPEI Activo
                    </span>
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">language</span>
                  Preferencias Regionales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Moneda Principal</label>
                    <select 
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface text-sm cursor-pointer"
                    >
                      <option value="MXN - Peso Mexicano">MXN - Peso Mexicano ($)</option>
                      <option value="USD - Dólar Estadounidense">USD - Dólar Estadounidense ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Zona Horaria</label>
                    <select 
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface text-sm cursor-pointer"
                    >
                      <option value="America/Mexico_City (GMT-6)">America/Mexico_City (GMT-6 / CDMX)</option>
                      <option value="America/Monterrey (GMT-6)">America/Monterrey (GMT-6)</option>
                      <option value="America/Tijuana (GMT-8)">America/Tijuana (GMT-8)</option>
                      <option value="America/Hermosillo (GMT-7)">America/Hermosillo (GMT-7)</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: REMOTE */}
          {activeTab === 'remote' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400">public</span>
                  Acceso Remoto (Link Público)
                </h3>
                <p className="text-sm text-on-surface-variant mb-6 -mt-3">
                  Usa este enlace gratuito para consultar tu sistema de ventas desde tu celular u otra computadora en cualquier parte. El túnel es gratuito y automático, si experimentas lentitud, simplemente intenta más tarde o recarga la página.
                </p>
                <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 bg-[#050505] border border-outline-variant/20 rounded-lg p-3 w-full">
                    <p className="font-mono text-sm text-emerald-400 font-bold truncate select-all">{publicLink || 'Generando link...'}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(publicLink);
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg font-bold text-xs transition-colors border border-secondary/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      Copiar
                    </button>
                    <a 
                      href={publicLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-bold text-xs transition-colors border border-emerald-500/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      Abrir
                    </a>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: POS */}
          {activeTab === 'pos' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">tune</span>
                  Operación del Punto de Venta (POS)
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-outline-variant/20 rounded-2xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                    <div>
                      <span className="block font-bold text-sm text-on-surface">Ticket Digital por SMS/Email</span>
                      <span className="block text-xs text-on-surface-variant">Ofrecer opción de enviar ticket por mensaje o no imprimir papel.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.digital_ticket} 
                      onChange={(e) => setSettings({ ...settings, digital_ticket: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 border border-outline-variant/20 rounded-2xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                    <div>
                      <span className="block font-bold text-sm text-on-surface">Auto-Cierre de Sesión por Inactividad</span>
                      <span className="block text-xs text-on-surface-variant">Bloquear pantalla tras 15 minutos sin interactuar.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.auto_logout} 
                      onChange={(e) => setSettings({ ...settings, auto_logout: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-outline-variant/20 rounded-2xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                    <div>
                      <span className="block font-bold text-sm text-on-surface">Permitir Ventas a Crédito / Fiado en POS</span>
                      <span className="block text-xs text-on-surface-variant">Habilitar el botón de Cuentas por Cobrar al cobrar un ticket.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.allow_credit_in_pos} 
                      onChange={(e) => setSettings({ ...settings, allow_credit_in_pos: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-outline-variant/20 rounded-2xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                    <div>
                      <span className="block font-bold text-sm text-on-surface">Sonidos de Notificación y Cobro</span>
                      <span className="block text-xs text-on-surface-variant">Emitir sonido de confirmación al registrar productos y finalizar venta.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.sound_effects} 
                      onChange={(e) => setSettings({ ...settings, sound_effects: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
                  </label>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: SEGURIDAD (SECURITY PANEL) */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-slide-up">
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">pin</span>
                  Políticas de Autorización por NIP
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-outline-variant/20 rounded-2xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                    <div>
                      <span className="block font-bold text-sm text-on-surface">Exigir NIP para eliminar productos del ticket</span>
                      <span className="block text-xs text-on-surface-variant">Requiere NIP de administrador/supervisor para cancelar un producto ya escaneado.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.require_nip_for_delete_item} 
                      onChange={(e) => setSettings({ ...settings, require_nip_for_delete_item: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-outline-variant/20 rounded-2xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                    <div>
                      <span className="block font-bold text-sm text-on-surface">Exigir NIP para Apertura y Cierre de Turno</span>
                      <span className="block text-xs text-on-surface-variant">Confirma la entrega y recepción física de dinero en efectivo en el cajón.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.require_nip_for_shift} 
                      onChange={(e) => setSettings({ ...settings, require_nip_for_shift: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-outline-variant/20 rounded-2xl hover:bg-surface-container/50 cursor-pointer transition-colors">
                    <div>
                      <span className="block font-bold text-sm text-on-surface">Exigir NIP para Descuentos y Devoluciones</span>
                      <span className="block text-xs text-on-surface-variant">Evita que el personal aplique rebajas o reembolsos no autorizados.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.require_nip_for_discounts} 
                      onChange={(e) => setSettings({ ...settings, require_nip_for_discounts: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
                  </label>

                  <div className="p-4 border border-outline-variant/20 rounded-2xl bg-surface-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="block font-bold text-sm text-on-surface">Tiempo de Bloqueo por NIP Incorrecto</span>
                      <span className="block text-xs text-on-surface-variant">Si un usuario introduce 3 veces un NIP erróneo.</span>
                    </div>
                    <select 
                      value={settings.nip_block_time}
                      onChange={(e) => setSettings({ ...settings, nip_block_time: e.target.value })}
                      className="bg-surface-container-lowest border border-outline-variant py-2 px-4 rounded-xl text-xs font-bold text-on-surface cursor-pointer"
                    >
                      <option value="1 minuto">1 minuto</option>
                      <option value="5 minutos">5 minutos (Recomendado)</option>
                      <option value="15 minutos">15 minutos</option>
                      <option value="Sin bloqueo">Sin bloqueo</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">verified_user</span>
                  Estado de Seguridad de la Base de Datos
                </h3>
                <div className="flex items-center gap-3 bg-secondary/10 p-4 rounded-2xl border border-secondary/20 text-xs text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-2xl">lock</span>
                  <div>
                    <span className="font-bold block text-secondary">Base de Datos Local SQLite Protegida</span>
                    <span className="text-on-surface-variant">Todas las transacciones y contraseñas se almacenan localmente en tu terminal para garantizar total privacidad y velocidad offline.</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: DISPOSITIVOS (DEVICES PANEL) */}
          {activeTab === 'devices' && (
            <div className="space-y-6 animate-slide-up">
              
              {/* Impresora Térmica */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4 mb-6">
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">print</span>
                    Impresora Térmica de Tickets
                  </h3>
                  <button 
                    onClick={handleTestPrint}
                    className="bg-surface-container hover:bg-surface-container-high text-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">receipt</span>
                    Imprimir Ticket de Prueba
                  </button>
                </div>

                {testPrintSuccess && (
                  <div className="mb-6 p-3 bg-secondary/15 text-secondary border border-secondary/30 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Señal de impresión enviada a la impresora térmica ({settings.printer_name}).
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Tipo de Conexión</label>
                    <select 
                      value={settings.printer_type}
                      onChange={(e) => setSettings({ ...settings, printer_type: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 text-sm text-on-surface cursor-pointer"
                    >
                      <option value="Térmica USB / Windows">Térmica USB / Driver de Windows</option>
                      <option value="Red Ethernet / Wi-Fi">Red Ethernet / Wi-Fi (ESC/POS)</option>
                      <option value="Bluetooth">Bluetooth Portátil</option>
                      <option value="Simulada PDF">Simulador Digital (PDF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Nombre / Modelo de la Impresora</label>
                    <input 
                      type="text" 
                      value={settings.printer_name}
                      onChange={(e) => setSettings({ ...settings, printer_name: e.target.value })}
                      placeholder="Ej. EPSON TM-T20III"
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface" 
                    />
                  </div>

                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Ancho del Papel Térmico</label>
                    <select 
                      value={settings.paper_width}
                      onChange={(e) => setSettings({ ...settings, paper_width: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 text-sm text-on-surface cursor-pointer font-bold"
                    >
                      <option value="80mm">80 mm (Estándar Punto de Venta)</option>
                      <option value="58mm">58 mm (Compacto / Miniprinter)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.auto_open_cash_drawer}
                        onChange={(e) => setSettings({ ...settings, auto_open_cash_drawer: e.target.checked })}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="text-xs font-bold text-on-surface">Abrir cajón de dinero automáticamente (RJ11)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.auto_cut_paper}
                        onChange={(e) => setSettings({ ...settings, auto_cut_paper: e.target.checked })}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="text-xs font-bold text-on-surface">Corte automático de papel al finalizar ticket</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Lector de Código de Barras */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">barcode_scanner</span>
                  Lector de Código de Barras (Escáner)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Modo de Operación</label>
                    <select 
                      value={settings.scanner_mode}
                      onChange={(e) => setSettings({ ...settings, scanner_mode: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 text-sm text-on-surface cursor-pointer"
                    >
                      <option value="USB Emulación Teclado (HID)">USB Emulación Teclado (Recomendado)</option>
                      <option value="Puerto Serial Virtual COM">Puerto Serial Virtual COM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Probar Lector en Vivo</label>
                    <input 
                      type="text" 
                      value={scannerTestValue}
                      onChange={(e) => setScannerTestValue(e.target.value)}
                      placeholder="Dispara con tu lector aquí..."
                      className="w-full bg-surface-container p-3 rounded-xl border-2 border-dashed border-primary/40 focus:border-primary font-mono text-sm text-on-surface" 
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-wrap gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.scanner_auto_enter}
                        onChange={(e) => setSettings({ ...settings, scanner_auto_enter: e.target.checked })}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="text-xs font-bold text-on-surface">Enviar ENTER automáticamente tras escanear código</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.scanner_beep}
                        onChange={(e) => setSettings({ ...settings, scanner_beep: e.target.checked })}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="text-xs font-bold text-on-surface">Beep sonoro de lectura correcta</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Báscula Digital (Pesables) */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">scale</span>
                  Báscula Digital (Productos a Granel)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Protocolo / Marca</label>
                    <select 
                      value={settings.scale_model}
                      onChange={(e) => setSettings({ ...settings, scale_model: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 text-sm text-on-surface cursor-pointer"
                    >
                      <option value="Torrey L-EQ / LPCR">Torrey (L-EQ / LPCR / PCR)</option>
                      <option value="Rhino BAR">Rhino (BAR-8 / BAR-9)</option>
                      <option value="Toledo">Toledo / Metler</option>
                      <option value="Genérica Serial">Genérica RS232 / USB</option>
                      <option value="Modo Manual">Modo Manual (Captura por teclado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">Puerto de Comunicación</label>
                    <select 
                      value={settings.scale_port}
                      onChange={(e) => setSettings({ ...settings, scale_port: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant/30 text-sm text-on-surface cursor-pointer font-mono font-bold"
                    >
                      <option value="COM1">COM1</option>
                      <option value="COM2">COM2</option>
                      <option value="COM3">COM3</option>
                      <option value="COM4">COM4</option>
                      <option value="USB">USB Emulado</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.scale_auto_tare}
                        onChange={(e) => setSettings({ ...settings, scale_auto_tare: e.target.checked })}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="text-xs font-bold text-on-surface">Tara automática tras pesar producto</span>
                    </label>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* TAB 5: TARIFAS & NÓMINA */}
          {activeTab === 'payroll' && (
            <div className="space-y-6 animate-slide-up">
              {empRateSuccess && (
                <div className="p-4 bg-primary/10 border border-primary/30 text-primary rounded-2xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{empRateSuccess}</span>
                </div>
              )}

              {/* Parámetros Generales de Nómina */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-6">
                  <div>
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">price_check</span>
                      Configuración de Tarifas de Personal
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Establece el monto que estás dispuesto a pagar por hora a tus trabajadores y suplentes.
                    </p>
                  </div>
                </div>

                <div className="max-w-md">
                  <label className="block font-label-caps text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Tarifa Base Predeterminada ($ MXN / Hora)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-on-surface-variant font-mono font-bold text-sm">$</span>
                    <input 
                      type="number"
                      step="1"
                      min="1"
                      value={settings.default_hourly_rate || 50}
                      onChange={(e) => setSettings({ ...settings, default_hourly_rate: parseFloat(e.target.value) || 50 })}
                      className="w-full bg-surface-container p-3 pl-8 rounded-xl border border-outline-variant/30 text-sm font-mono font-bold text-on-surface"
                    />
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-1.5 block">
                    Esta tarifa se utiliza como valor base sugerido para cotizaciones y nuevos colaboradores.
                  </span>
                </div>
              </section>

              {/* Tabla de Tarifas por Empleado */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">group</span>
                  Tarifas por Hora por Empleado
                </h3>
                <p className="text-xs text-on-surface-variant mb-6">
                  Puedes personalizar individualmente cuánto gana cada persona por hora laborada en caja o en turno.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-low font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                        <th className="py-3 px-4">Empleado / Personal</th>
                        <th className="py-3 px-4 text-center">Rol</th>
                        <th className="py-3 px-4 text-center">Tarifa por Hora ($ MXN)</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-sm">
                      {employees.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-on-surface-variant text-xs">
                            No hay empleados dados de alta.
                          </td>
                        </tr>
                      ) : (
                        employees.map(emp => {
                          const rateVal = employeeRates[emp.id] || '50';
                          const isSavingThis = savingEmpId === emp.id;

                          return (
                            <tr key={emp.id} className="hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-on-surface text-sm">{emp.name}</div>
                                    <div className="text-xs text-on-surface-variant font-mono">@{emp.username}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${emp.role === 'admin' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-surface-container text-on-surface-variant'}`}>
                                  {emp.role === 'admin' ? 'Administrador' : 'Cajero'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 max-w-[140px]">
                                  <span className="font-mono text-on-surface-variant font-bold text-sm">$</span>
                                  <input 
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={rateVal}
                                    onChange={(e) => setEmployeeRates({ ...employeeRates, [emp.id]: e.target.value })}
                                    className="w-24 bg-surface-container py-1.5 px-3 rounded-xl border border-outline-variant/30 font-mono text-sm font-bold text-on-surface text-center outline-none focus:border-primary"
                                  />
                                  <span className="text-xs font-mono text-on-surface-variant">/h</span>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <button 
                                  type="button"
                                  onClick={() => handleUpdateSingleRate(emp.id, emp.name)}
                                  disabled={isSavingThis}
                                  className="px-3.5 py-1.5 bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1 mx-auto cursor-pointer disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">save</span>
                                  {isSavingThis ? 'Guardando...' : 'Guardar'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
