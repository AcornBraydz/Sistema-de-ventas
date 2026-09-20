import { API_BASE_URL } from '../config';
import { useState } from 'react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Trigger a refresh of the inventory
}

export function ProductModal({ isOpen, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    category: 'Abarrotes',
    is_bulk: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['Abarrotes', 'Lácteos', 'Limpieza', 'Botanas', 'Bebidas', 'Perecederos', 'Otros'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('sku', formData.sku);
      data.append('name', formData.name);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category);
      data.append('is_bulk', formData.is_bulk ? 'true' : 'false');
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: data, // fetch automatically sets the correct Content-Type with boundary for FormData
      });

      if (!response.ok) {
        throw new Error('Error al guardar el producto');
      }

      // Reset form
      setFormData({
        sku: '',
        name: '',
        price: '',
        stock: '',
        category: 'Abarrotes',
        is_bulk: false,
      });
      setImageFile(null);
      setPreviewUrl(null);
      
      onSave(); // Refresh parent
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">Nuevo Producto</h2>
            <p className="text-sm text-on-surface-variant">Da de alta un producto en el catálogo</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-error-container/30 text-on-error-container border border-error/30 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <form id="productForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Foto del Producto */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col gap-2 w-full md:w-1/3">
                <label className="text-sm font-bold text-on-surface uppercase tracking-wider">Fotografía</label>
                <div className="relative w-full aspect-square bg-surface-container rounded-2xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center overflow-hidden group hover:border-primary transition-colors cursor-pointer">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-outline mb-2 group-hover:text-primary transition-colors">add_photo_alternate</span>
                      <span className="text-xs text-on-surface-variant font-bold">Subir Imagen</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant text-center mt-1">Formato cuadrado recomendado</p>
              </div>

              {/* Campos de texto */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">SKU / Código</label>
                  <input 
                    required
                    type="text" 
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    placeholder="Ej. B-001"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nombre del Producto</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold"
                    placeholder="Ej. Sabritas Sal 170g"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Precio ($)</label>
                  <input 
                    required
                    type="number"
                    step="0.01" 
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-lg"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Stock Inicial</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-lg"
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Categoría</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1 pt-2 sm:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_bulk ? 'bg-primary' : 'bg-surface-variant'}`}>
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${formData.is_bulk ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={formData.is_bulk}
                      onChange={(e) => setFormData({...formData, is_bulk: e.target.checked})}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Se vende a granel (Pesable)</span>
                      <span className="text-xs text-on-surface-variant">Frutas, verduras, jamón, etc. (Permite decimales en POS)</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="px-8 py-5 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-variant transition-colors uppercase tracking-wider"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="productForm"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all uppercase tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Guardar Producto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
