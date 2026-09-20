import { API_BASE_URL } from '../config';
import type { Product } from '../store/posStore';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button 
      onClick={() => onClick(product)}
      className="group relative bg-surface-container-lowest rounded-2xl p-4 text-left flex flex-col h-40 shadow-premium hover:shadow-hover transition-all duration-300 border border-outline-variant/10 hover:border-primary/30 hover:-translate-y-1 overflow-hidden"
    >
      {product.imageUrl && (
        <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-50 transition-opacity">
          <img 
            src={product.imageUrl.startsWith('http') ? product.imageUrl : `${API_BASE_URL}${product.imageUrl}`} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/60 to-transparent" />
        </div>
      )}
      <div className="relative z-10 flex flex-col h-full justify-between drop-shadow-md">
        <div>
          <span className="text-[10px] text-on-surface-variant font-label-caps bg-surface-container px-2 py-1 rounded ligatures-normal">
            {product.isBulk ? 'A Granel' : product.sku}
          </span>
          <h3 className="font-headline-sm text-on-surface mt-2 group-hover:text-primary transition-colors text-base leading-tight line-clamp-2">
            {product.name}
          </h3>
        </div>
        <div className="flex justify-between items-end mt-2">
          <span className="font-data-md text-on-surface-variant text-xs">
            {product.isBulk ? '/kg' : 'PZA'}
          </span>
          <span className="font-data-lg text-primary font-bold ligatures-normal">
            ${product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </button>
  );
}
