import { useState } from 'react';
import { usePosStore, type Product } from '../store/posStore';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ProductCard } from '../components/ProductCard';
import { TicketPanel } from '../components/TicketPanel';
import { BulkModal } from '../components/BulkModal';
import { CashoutModal } from '../components/CashoutModal';
import { ShiftSummaryModal } from '../components/ShiftSummaryModal';
import { GitHubStyleDrawer } from '../components/GitHubStyleDrawer';
import { UnifiedNavbar } from '../components/UnifiedNavbar';
import { ReturnsModal } from '../components/ReturnsModal';
import { CashFundModal } from '../components/CashFundModal';
import { StockLookupModal } from '../components/StockLookupModal';
import { WasteRegistrationModal } from '../components/WasteRegistrationModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ShiftLiveInfoModal } from '../components/ShiftLiveInfoModal';
import { AuthModal } from '../components/AuthModal';
import { Link } from 'react-router-dom';

export function PosView() {
  const { products, categories: storeCategories, addItem } = usePosStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [bulkProduct, setBulkProduct] = useState<Product | null>(null);
  
  // Modals state
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showCashWithdrawal, setShowCashWithdrawal] = useState(false);
  const [showXCut, setShowXCut] = useState(false);
  const [showReturns, setShowReturns] = useState(false);
  const [showCashFund, setShowCashFund] = useState(false);
  const [showStockLookup, setShowStockLookup] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showShiftInfoModal, setShowShiftInfoModal] = useState(false);
  const [showShiftAuth, setShowShiftAuth] = useState(false);

  // Barcode scanner hook
  useBarcodeScanner({
    onScan: (barcode) => {
      const product = products.find(p => p.sku === barcode);
      if (product) {
        if (product.isBulk) {
          setBulkProduct(product);
        } else {
          addItem(product);
        }
      }
    }
  });

  const categories = ['Todos', ...storeCategories.map(c => c.name)];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.includes(search);
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (product: Product) => {
    if (product.isBulk) {
      setBulkProduct(product);
    } else {
      addItem(product);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-surface via-surface to-surface-variant/30 flex-col font-body-md relative overflow-hidden">
      {/* Unified Navbar */}
      <UnifiedNavbar 
        onOpenDrawer={() => setShowMainMenu(true)}
        title="PUNTO DE VENTA"
        badgeText="TERMINAL ACTIVA"
      />

      {/* Main Content */}
      <main className="w-full pt-4 flex-1 overflow-hidden">
        <div className="flex flex-col w-full h-full overflow-hidden">
          <div className="flex flex-1 overflow-hidden h-full">
            {/* Left Panel: Product Search & Grid */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Search & Filters */}
              <div className="flex gap-4 mb-6 shrink-0">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input 
                    className="w-full bg-surface-container rounded-xl py-4 pl-12 pr-4 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all placeholder:text-on-surface-variant/50 border border-outline/10" 
                    placeholder="Buscar producto, SKU o código de barras..." 
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Link 
                    to="/pos/customers"
                    className="absolute right-12 top-1/2 -translate-y-1/2 bg-surface p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors border border-outline/10 mr-2 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">person_search</span>
                  </Link>
                  <button 
                    type="button"
                    onClick={() => setShowBarcodeModal(true)}
                    title="Escanear o Ingresar Código de Barras"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors border border-outline/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">barcode_scanner</span>
                  </button>
                </div>
                <button 
                  className="px-4 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-body-md whitespace-nowrap transition-colors border border-outline/10 flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowXCut(true)}
                >
                  <span className="material-symbols-outlined text-primary">point_of_sale</span>
                  Revisar / Cerrar Caja
                </button>
                <button 
                  className="px-4 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-body-md whitespace-nowrap transition-colors border border-outline/10 flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowCashWithdrawal(true)}
                >
                  <span className="material-symbols-outlined">payments</span>
                  Retiro
                </button>
                <Link 
                  to="/pos/history"
                  className="px-4 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-body-md whitespace-nowrap transition-colors border border-outline/10 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">history</span>
                  Historial
                </Link>
              </div>

              {/* Dynamic Categories */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 shrink-0 scrollbar-hide">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl font-headline-sm text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-primary text-white shadow-premium font-bold border-primary'
                        : 'bg-white hover:bg-surface-container-low text-on-surface border border-outline-variant/30 hover:shadow-sm'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onClick={handleProductClick} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel: The Ticket */}
            <div className="w-[360px] bg-surface-container-lowest shadow-2xl flex flex-col border-l border-outline/10 z-10 relative">
              <TicketPanel />
            </div>
          </div>
        </div>
      </main>

      <BulkModal 
        product={bulkProduct}
        onClose={() => setBulkProduct(null)}
        onAdd={addItem}
      />
      
      <CashoutModal 
        isOpen={showCashWithdrawal}
        onClose={() => setShowCashWithdrawal(false)}
      />

      <ShiftSummaryModal 
        isOpen={showXCut}
        onClose={() => setShowXCut(false)}
      />
      <GitHubStyleDrawer 
        isOpen={showMainMenu}
        onClose={() => setShowMainMenu(false)}
        onShowCashWithdrawal={() => setShowCashWithdrawal(true)}
        onShowXCut={() => setShowXCut(true)}
        onShowReturns={() => setShowReturns(true)}
        onShowCashFund={() => setShowCashFund(true)}
        onShowStockLookup={() => setShowStockLookup(true)}
        onShowWasteModal={() => setShowWasteModal(true)}
      />
      <AuthModal 
        isOpen={showShiftAuth}
        onClose={() => setShowShiftAuth(false)}
        onSuccess={() => setShowShiftInfoModal(true)}
        title="Consultar Mi Turno"
        description="Ingrese su NIP de 4 dígitos para acceder a la información de su turno y ganancias."
        allowedRoles={['Administrador', 'Supervisor', 'Cajero', 'admin', 'cashier']}
      />
      <ShiftLiveInfoModal 
        isOpen={showShiftInfoModal}
        onClose={() => setShowShiftInfoModal(false)}
        onOpenCashCloseModal={() => setShowXCut(true)}
      />
      <ReturnsModal 
        isOpen={showReturns}
        onClose={() => setShowReturns(false)}
      />
      <CashFundModal 
        isOpen={showCashFund}
        onClose={() => setShowCashFund(false)}
      />
      <StockLookupModal 
        isOpen={showStockLookup}
        onClose={() => setShowStockLookup(false)}
        onSelectProduct={(p) => {
          if (p.isBulk) {
            setBulkProduct(p);
          } else {
            addItem(p);
          }
        }}
      />
      <WasteRegistrationModal 
        isOpen={showWasteModal}
        onClose={() => setShowWasteModal(false)}
      />
      <BarcodeScannerModal 
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        onScan={(barcode) => {
          const product = products.find(p => p.sku === barcode);
          if (product) {
            if (product.isBulk) {
              setBulkProduct(product);
            } else {
              addItem(product);
            }
          }
        }}
      />
    </div>
  );
}
