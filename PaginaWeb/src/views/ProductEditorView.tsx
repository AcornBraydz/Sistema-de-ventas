import { API_BASE_URL } from '../config';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import ImageCropperModal from '../components/ImageCropperModal';

interface Supplier {
  id: number;
  name: string;
  category?: string;
}

export function ProductEditorView() {
  const navigate = useNavigate();
  const { categories: storeCategories } = usePosStore();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [saleType, setSaleType] = useState<'piece' | 'bulk'>('piece');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [existingProductWarning, setExistingProductWarning] = useState<any | null>(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const skuInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play audio beep for barcode scan
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  };

  // Fetch suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/suppliers`);
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };
    fetchSuppliers();

    // Auto-focus SKU input for immediate barcode gun scanning
    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveCategory = async () => {
    const val = category.trim();
    if (!val) {
      setIsAddingNewCategory(false);
      setEditingCategoryId(null);
      return;
    }

    try {
      if (editingCategoryId) {
        // Edit existing category
        const res = await fetch(`${API_BASE_URL}/api/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val })
        });
        if (res.ok) {
          await usePosStore.getState().fetchCategories();
          await usePosStore.getState().fetchProducts(); // Refresh products because category names might have changed
          showToast('Categoría actualizada', 'success');
        } else {
          const data = await res.json();
          showToast(data.error || 'Error al actualizar', 'error');
        }
      } else {
        // Add new category
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val })
        });
        if (res.ok) {
          await usePosStore.getState().fetchCategories();
          showToast('Categoría guardada', 'success');
        } else {
          const data = await res.json();
          if (data.error !== 'La categoría ya existe') {
            showToast(data.error, 'error');
          }
        }
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
    } finally {
      setIsAddingNewCategory(false);
      setEditingCategoryId(null);
    }
  };

  const handleDeleteCategory = (id: number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de que deseas eliminar la categoría "${name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, { method: 'DELETE' });
          if (res.ok) {
            await usePosStore.getState().fetchCategories();
            if (category === name) setCategory('');
            showToast('Categoría eliminada', 'success');
          } else {
            showToast('Error al eliminar categoría', 'error');
          }
        } catch (e) {
          showToast('Error de conexión', 'error');
        }
      }
    });
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check if SKU exists in store/db
  const checkSkuExists = async (code: string) => {
    if (!code) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const products: any[] = await res.json();
        const found = products.find(p => p.sku.toLowerCase() === code.toLowerCase().trim());
        if (found) {
          setExistingProductWarning(found);
          playBeep();
        } else {
          setExistingProductWarning(null);
        }
      }
    } catch (e) {}
  };

  // Handle SKU input keydown (Barcode Scanner shoots Enter key)
  const handleSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = sku.trim();
      if (val) {
        playBeep();
        checkSkuExists(val);
        // Move focus to product name
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }
    }
  };

  const handleGenerateBarcode = () => {
    const randomCode = '750' + Math.floor(1000000000 + Math.random() * 9000000000);
    setSku(randomCode);
    playBeep();
    showToast('Código de barras EAN-13 generado', 'info');
    if (nameInputRef.current) nameInputRef.current.focus();
  };

  const handleGeneratePLU = () => {
    const pluCode = 'PLU ' + Math.floor(4000 + Math.random() * 900);
    setSku(pluCode);
    setSaleType('bulk');
    playBeep();
    showToast('Código PLU para granel generado', 'info');
    if (nameInputRef.current) nameInputRef.current.focus();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setImage(croppedFile);
    setImagePreview(URL.createObjectURL(croppedFile));
    setCropImageSrc(null);
  };

  // Profit calculations
  const numCost = parseFloat(cost) || 0;
  const numPrice = parseFloat(price) || 0;
  const profitMargin = numPrice > 0 ? (((numPrice - numCost) / numPrice) * 100).toFixed(1) : '0.0';
  const profitAmount = (numPrice - numCost).toFixed(2);

  const resetForm = () => {
    setName('');
    setSku('');
    setCost('');
    setPrice('');
    setStock('');
    setMinStock('5');
    setImage(null);
    setImagePreview(null);
    setExistingProductWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (skuInputRef.current) skuInputRef.current.focus();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Por favor ingrese el nombre del producto', 'error');
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }
    if (!sku.trim()) {
      showToast('Por favor ingrese o escanee el código de barras / SKU', 'error');
      if (skuInputRef.current) skuInputRef.current.focus();
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showToast('Por favor ingrese un precio de venta válido', 'error');
      return;
    }

    setIsSubmitting(true);
    const savedName = name.trim();

    try {
      const formData = new FormData();
      formData.append('sku', sku.trim());
      formData.append('name', savedName);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('cost', cost || '0');
      formData.append('stock', stock || '0');
      formData.append('min_stock', minStock || '5');
      formData.append('is_bulk', saleType === 'bulk' ? 'true' : 'false');
      if (supplierId) {
        formData.append('supplier_id', supplierId);
      }
      if (image) {
        formData.append('image', image);
      }

      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        // Refresh global POS products
        await usePosStore.getState().fetchProducts();
        playBeep();
        showToast(`¡"${savedName}" guardado correctamente! Formulario listo para el siguiente código`, 'success');
        // Reset and clear all fields for the next product
        resetForm();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al guardar el producto.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión con el servidor local.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface p-4 sm:p-6 lg:p-8 relative">
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-high rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-outline-variant/20 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">{confirmModal.title}</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-8 pl-1">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-variant transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          aspectRatio={1}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
      
      {/* Toast Notifications */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border border-white/20 text-white ${
          toastMessage.type === 'success' ? 'bg-secondary' : toastMessage.type === 'error' ? 'bg-error' : 'bg-primary'
        }`}>
          <span className="material-symbols-outlined text-2xl">
            {toastMessage.type === 'success' ? 'check_circle' : toastMessage.type === 'error' ? 'error' : 'info'}
          </span>
          <div className="font-bold text-sm">{toastMessage.text}</div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/admin/inventory')}
            className="w-11 h-11 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface transition-all cursor-pointer shadow-xs"
            title="Volver a Existencias"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Alta de Producto</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
                Catálogo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 font-medium">
              Al guardar se limpia el formulario automáticamente para registrar el siguiente código.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button 
            type="button"
            onClick={resetForm}
            title="Limpiar todos los campos del formulario"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/30 uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            Limpiar
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/admin/inventory')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/30 uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            Ver Existencias
          </button>

          <button 
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold text-on-primary bg-primary hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-98 ${isSubmitting ? 'opacity-50' : ''}`}
          >
            <span className="material-symbols-outlined text-base">{isSubmitting ? 'sync' : 'save'}</span>
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (General Info & Barcode Area) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Scanner & Barcode Integration */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/25 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">barcode_scanner</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Escáner & Código de Barras</h2>
                  <p className="text-xs text-on-surface-variant">Listo para pistola lectora USB/Bluetooth o escáner óptico</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                <span>Lector Activo</span>
              </div>
            </div>

            {/* Input Barcode with Instant Scan Detection */}
            <div className="space-y-2">
              <label htmlFor="product-sku" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex justify-between">
                <span>Código de Barras / SKU *</span>
                <span className="text-[11px] text-primary font-normal">Presiona Enter tras escanear</span>
              </label>
              
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-primary text-2xl pointer-events-none">
                  qr_code_scanner
                </span>
                <input 
                  ref={skuInputRef}
                  id="product-sku"
                  type="text"
                  value={sku}
                  onChange={(e) => {
                    setSku(e.target.value);
                    if (existingProductWarning) setExistingProductWarning(null);
                  }}
                  onKeyDown={handleSkuKeyDown}
                  onBlur={() => checkSkuExists(sku)}
                  placeholder="Escanea el código con la pistola o escribe aquí..."
                  className="w-full h-14 bg-surface-container/60 hover:bg-surface-container focus:bg-surface pl-13 pr-32 rounded-2xl font-mono text-base font-bold text-on-surface border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-on-surface-variant/40 tracking-wider shadow-inner"
                />
                
                {/* Scanner Tool Action Buttons */}
                <div className="absolute right-2 flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => setIsScannerModalOpen(true)}
                    title="Simulador de escáner de cámara"
                    className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    Escanear
                  </button>
                </div>
              </div>

              {/* Warning if SKU exists */}
              {existingProductWarning && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-slide-up">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">warning</span>
                    <span>Código registrado en: <strong>{existingProductWarning.name}</strong> (${existingProductWarning.price} MXN)</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setName(existingProductWarning.name);
                      setPrice(existingProductWarning.price.toString());
                      setCost((existingProductWarning.cost || 0).toString());
                      setStock(existingProductWarning.stock.toString());
                      setCategory(existingProductWarning.category || 'Abarrotes');
                    }}
                    className="underline font-bold text-primary hover:text-primary/80 cursor-pointer ml-2"
                  >
                    Cargar datos
                  </button>
                </div>
              )}

              {/* Quick Generator Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button 
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-primary">barcode</span>
                  Generar EAN-13
                </button>
                <button 
                  type="button"
                  onClick={handleGeneratePLU}
                  className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-secondary">scale</span>
                  Generar PLU Granel
                </button>
              </div>
            </div>

            {/* Sale Type: Por Pieza vs A Granel */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/15">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Tipo de Venta / Medición
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setSaleType('piece')}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    saleType === 'piece'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs font-bold'
                      : 'border-outline-variant/30 bg-surface-container/30 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">inventory_2</span>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-tight">Por Pieza / Unidad</p>
                    <p className="text-[10px] opacity-80">Código de barras estándar</p>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setSaleType('bulk')}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    saleType === 'bulk'
                      ? 'border-secondary bg-secondary/10 text-secondary shadow-xs font-bold'
                      : 'border-outline-variant/30 bg-surface-container/30 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">scale</span>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-tight">A Granel / Peso</p>
                    <p className="text-[10px] opacity-80">Balanza por Kilogramos</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: General Information */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/25 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">description</span>
              Detalles del Producto
            </h2>

            <div className="space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label htmlFor="product-name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Nombre Comercial del Producto *
                </label>
                <input 
                  ref={nameInputRef}
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Coca-Cola Regular 600ml / Queso Oaxaca Artesanal"
                  className="w-full h-12 bg-surface px-4 rounded-xl text-sm font-bold text-on-surface border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-on-surface-variant/40"
                />
              </div>

              {/* Category & Supplier in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5" ref={dropdownRef}>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
                    Categoría
                    {!isAddingNewCategory && (
                      <div className="flex gap-2">
                        {category && storeCategories.find(c => c.name === category) && (
                          <div className="flex gap-1">
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingCategoryId(storeCategories.find(c => c.name === category)!.id);
                                setIsAddingNewCategory(true);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className="text-on-surface-variant hover:text-primary flex items-center gap-1 bg-surface-container hover:bg-primary/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              Editar
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteCategory(storeCategories.find(c => c.name === category)!.id, category)}
                              className="text-on-surface-variant hover:text-red-500 flex items-center gap-1 bg-surface-container hover:bg-red-500/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setIsAddingNewCategory(true);
                            setCategory('');
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          Nueva
                        </button>
                      </div>
                    )}
                  </label>
                  <div className="relative">
                    {isAddingNewCategory ? (
                      <div className="flex items-center gap-2 animate-fade-in">
                        <input 
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveCategory();
                            }
                          }}
                          placeholder={editingCategoryId ? "Nuevo nombre de categoría..." : "Escribe la categoría y presiona Enter..."}
                          autoFocus
                          className="w-full h-12 bg-surface px-4 rounded-xl text-sm font-bold text-on-surface border border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button 
                          type="button"
                          onClick={handleSaveCategory}
                          className="w-12 h-12 flex items-center justify-center shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl border border-primary/20 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined">check</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div 
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          className={`w-full h-12 bg-surface px-4 rounded-xl text-sm font-bold border transition-all cursor-pointer flex items-center justify-between ${
                            isCategoryDropdownOpen 
                              ? 'border-primary ring-2 ring-primary/20 text-on-surface' 
                              : 'border-outline-variant/40 text-on-surface hover:border-primary/50'
                          }`}
                        >
                          <span className={category ? 'text-on-surface' : 'text-on-surface-variant/50'}>
                            {category || 'Seleccionar categoría...'}
                          </span>
                          <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </div>
                        
                        {isCategoryDropdownOpen && (
                          <div className="absolute z-50 w-full mt-2 bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden animate-fade-in origin-top">
                            <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-0.5">
                              {storeCategories.length > 0 ? (
                                storeCategories.map(cat => (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                      setCategory(cat.name);
                                      setIsCategoryDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm font-bold rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                                      category === cat.name 
                                        ? 'bg-primary/10 text-primary' 
                                        : 'text-on-surface hover:bg-surface-container-highest hover:text-primary'
                                    }`}
                                  >
                                    {cat.name}
                                    {category === cat.name && <span className="material-symbols-outlined text-[18px]">check</span>}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-center text-sm text-on-surface-variant flex flex-col items-center gap-2">
                                  <span className="material-symbols-outlined text-3xl opacity-50">category</span>
                                  <span>No hay categorías.<br/>Haz clic en "+ Nueva" para crear la primera.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5" ref={supplierDropdownRef}>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Proveedor Asociado
                  </label>
                  <div className="relative">
                    <div 
                      onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                      className={`w-full h-12 bg-surface px-4 rounded-xl text-sm font-bold border transition-all cursor-pointer flex items-center justify-between ${
                        isSupplierDropdownOpen 
                          ? 'border-primary ring-2 ring-primary/20 text-on-surface' 
                          : 'border-outline-variant/40 text-on-surface hover:border-primary/50'
                      }`}
                    >
                      <span className={supplierId ? 'text-on-surface' : 'text-on-surface-variant/50'}>
                        {supplierId ? suppliers.find(s => s.id.toString() === supplierId)?.name || 'Desconocido' : '(Sin proveedor asignado)'}
                      </span>
                      <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isSupplierDropdownOpen ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                    
                    {isSupplierDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden animate-fade-in origin-top">
                        <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSupplierId('');
                              setIsSupplierDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-bold rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                              !supplierId 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-on-surface hover:bg-surface-container-highest hover:text-primary'
                            }`}
                          >
                            (Sin proveedor asignado)
                            {!supplierId && <span className="material-symbols-outlined text-[18px]">check</span>}
                          </button>
                          {suppliers.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSupplierId(s.id.toString());
                                setIsSupplierDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm font-bold rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                                supplierId === s.id.toString()
                                  ? 'bg-primary/10 text-primary' 
                                  : 'text-on-surface hover:bg-surface-container-highest hover:text-primary'
                              }`}
                            >
                              {s.name}
                              {supplierId === s.id.toString() && <span className="material-symbols-outlined text-[18px]">check</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Foto o Imagen del Producto (Opcional)
                </label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  id="image-file-input" 
                />
                
                <label 
                  htmlFor="image-file-input"
                  className="w-full h-32 rounded-2xl bg-surface-container/40 hover:bg-surface-container border-2 border-dashed border-outline-variant/40 hover:border-primary flex items-center justify-center p-4 cursor-pointer transition-all group overflow-hidden"
                >
                  {imagePreview ? (
                    <div className="flex items-center gap-4">
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl shadow-md border border-white/20" />
                      <div>
                        <p className="text-xs font-bold text-on-surface">{image?.name}</p>
                        <p className="text-[11px] text-primary mt-1 font-semibold">Clic para cambiar imagen</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-3xl text-primary mb-1">add_photo_alternate</span>
                      <p className="text-xs font-bold text-on-surface">Seleccionar imagen desde tu equipo</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">PNG, JPG o WEBP hasta 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Pricing, Stock & Margins) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 3: Pricing & Profits */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/25 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">payments</span>
              Precios y Costos
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Cost */}
                <div className="space-y-1.5">
                  <label htmlFor="product-cost" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Precio Costo ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm font-bold text-on-surface-variant">$</span>
                    <input 
                      id="product-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-12 bg-surface pl-8 pr-3 rounded-xl font-mono text-sm font-bold text-on-surface border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-on-surface-variant/40"
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div className="space-y-1.5">
                  <label htmlFor="product-price" className="text-xs font-bold text-primary uppercase tracking-wider">
                    Precio Venta ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm font-bold text-primary">$</span>
                    <input 
                      id="product-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-12 bg-surface pl-8 pr-3 rounded-xl font-mono text-base font-extrabold text-primary border-2 border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-on-surface-variant/40 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Profit Widget */}
              <div className="p-4 rounded-2xl bg-secondary-container/20 border border-secondary/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-secondary-container tracking-wider block">
                    Ganancia por Unidad
                  </span>
                  <span className="font-mono text-xl font-extrabold text-secondary">
                    +${profitAmount} MXN
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-on-secondary-container tracking-wider block">
                    Margen de Utilidad
                  </span>
                  <span className="font-mono text-xl font-extrabold text-primary">
                    {profitMargin}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Inventory & Stock */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/25 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">warehouse</span>
              Control de Existencias
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="product-stock" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Stock Inicial {saleType === 'bulk' ? '(Kg)' : '(Pzas)'}
                </label>
                <input 
                  id="product-stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full h-12 bg-surface px-4 rounded-xl font-mono text-sm font-bold text-on-surface border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="product-min-stock" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Stock Mínimo
                </label>
                <input 
                  id="product-min-stock"
                  type="number"
                  min="1"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="5"
                  className="w-full h-12 bg-surface px-4 rounded-xl font-mono text-sm font-bold text-on-surface border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              El sistema generará alertas automáticas de reabastecimiento en el Punto de Venta cuando las existencias alcancen el nivel mínimo.
            </p>
          </div>

          {/* Tips Card */}
          <div className="bg-primary/5 rounded-3xl p-5 border border-primary/15 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">tips_and_updates</span>
            <div className="text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface font-bold">Consejo de inventario:</strong> Puedes usar tu pistola de código de barras directamente mientras esta pantalla esté abierta para rellenar automáticamente el SKU y dar de alta cajas completas de mercancía.
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Camera Simulator Modal */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 text-center animate-slide-up flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">barcode_scanner</span>
                <h3 className="text-base font-bold text-on-surface">Escáner Óptico Activo</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsScannerModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Visual Scanning Viewport with Laser Line */}
            <div className="w-full h-48 bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border-2 border-primary/40 shadow-inner">
              <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-[bounce_1.5s_infinite]"></div>
              <span className="material-symbols-outlined text-white/40 text-5xl mb-2">qr_code_2</span>
              <p className="text-white/80 text-xs font-mono">Apunte el código al centro del visor</p>
            </div>

            <p className="text-xs text-on-surface-variant mt-4 mb-4">
              O selecciona un código de prueba para simular la lectura de la pistola:
            </p>

            <div className="grid grid-cols-2 gap-2 w-full">
              {[
                { label: 'Coca-Cola 600ml', code: '7501055301234' },
                { label: 'Leche Lala 1L', code: '7501017001429' },
                { label: 'Sabritas 45g', code: '7501032115148' },
                { label: 'Pan Bimbo Grande', code: '7501000210341' }
              ].map(sample => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => {
                    setSku(sample.code);
                    playBeep();
                    setIsScannerModalOpen(false);
                    checkSkuExists(sample.code);
                    if (nameInputRef.current) nameInputRef.current.focus();
                  }}
                  className="p-2.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-left border border-outline-variant/30 cursor-pointer transition-colors"
                >
                  <p className="text-xs font-bold text-on-surface">{sample.label}</p>
                  <p className="text-[10px] font-mono text-primary">{sample.code}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsScannerModalOpen(false)}
              className="mt-5 w-full py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Cerrar Visor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
