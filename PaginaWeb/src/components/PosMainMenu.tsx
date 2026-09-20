import { Link, useNavigate } from 'react-router-dom';

interface PosMainMenuProps {
  onClose: () => void;
  onShowCustomerSearch: () => void;
  onShowCashWithdrawal: () => void;
  onShowXCut: () => void;
  onShowReturns: () => void;
  onShowCashFund: () => void;
  onShowStockLookup?: () => void;
  onShowWasteModal?: () => void;
  onShowShiftInfo?: () => void;
}

export function PosMainMenu({ 
  onClose, 
  onShowCustomerSearch: _onShowCustomerSearch, 
  onShowCashWithdrawal, 
  onShowXCut, 
  onShowReturns, 
  onShowCashFund: _onShowCashFund,
  onShowStockLookup,
  onShowWasteModal,
  onShowShiftInfo
}: PosMainMenuProps) {
  const navigate = useNavigate();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-0 left-0 bottom-0 w-[320px] bg-surface-container-lowest shadow-2xl z-[101] flex flex-col overflow-hidden animate-slide-right">
        {/* Header */}
        <div className="bg-primary text-on-primary p-6 flex justify-between items-start">
          <div>
            <h2 className="font-headline-sm text-lg tracking-tight mb-1">SISTEMA POS</h2>
            <p className="font-label-caps text-[10px] text-on-primary/60 uppercase tracking-widest">Heritage Terminal V1.0</p>
          </div>
          <button 
            onClick={onClose}
            className="text-on-primary/70 hover:text-on-primary transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          <div className="space-y-2">
            <h3 className="px-4 text-[10px] font-label-caps text-on-surface-variant opacity-60 uppercase tracking-widest mb-2">Operaciones</h3>
            <button 
              onClick={() => { navigate('/pos'); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">shopping_cart</span>
                <span className="font-body-md font-medium">Nueva Venta</span>
              </div>
              <span className="bg-surface-variant text-on-surface-variant text-[10px] font-label-caps px-2 py-1 rounded">ALT+N</span>
            </button>
            
            <Link 
              to="/pos/history"
              onClick={onClose}
              className="flex items-center gap-4 px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">history</span>
              <span className="font-body-md font-medium">Historial</span>
            </Link>
            
            <button 
              onClick={() => handleAction(onShowReturns)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">assignment_return</span>
              <span className="font-body-md font-medium">Devoluciones</span>
            </button>
            
            <Link 
              to="/pos/customers"
              onClick={onClose}
              className="flex items-center gap-4 px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">person_search</span>
              <span className="font-body-md font-medium">Buscar Cliente</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h3 className="px-4 text-[10px] font-label-caps text-on-surface-variant opacity-60 uppercase tracking-widest mb-2">Caja</h3>
            
            {/* Botón: Información de Mi Turno */}
            <button 
              onClick={() => onShowShiftInfo && handleAction(onShowShiftInfo)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">schedule</span>
              <div className="text-left">
                <span className="font-body-md font-medium block">Información de Mi Turno</span>
                <span className="text-[10px] text-on-surface-variant">Tiempo y ganancias generadas</span>
              </div>
            </button>

            <button 
              onClick={() => handleAction(onShowXCut)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">point_of_sale</span>
              <span className="font-body-md font-medium">Revisar o Cerrar Caja</span>
            </button>
            
            <button 
              onClick={() => handleAction(onShowCashWithdrawal)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">payments</span>
              <span className="font-body-md font-medium">Retiro de Efectivo</span>
            </button>
          </div>

          <div className="space-y-2 pb-6">
            <h3 className="px-4 text-[10px] font-label-caps text-on-surface-variant opacity-60 uppercase tracking-widest mb-2">Inventario</h3>
            <button 
              onClick={() => onShowStockLookup && handleAction(onShowStockLookup)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">inventory_2</span>
              <span className="font-body-md font-medium">Existencias</span>
            </button>
            
            <button 
              onClick={() => onShowWasteModal && handleAction(onShowWasteModal)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-surface-container rounded-xl transition-colors text-on-surface group cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-error transition-colors">remove_shopping_cart</span>
              <span className="font-body-md font-medium">Registro Merma</span>
            </button>
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="bg-surface-container border-t border-outline-variant/20 p-4">
           <Link 
             to="/"
             onClick={onClose}
             className="w-full flex justify-center items-center gap-2 py-3 bg-surface-container-highest hover:bg-surface-variant text-on-surface transition-colors rounded-xl font-label-caps uppercase text-xs"
           >
             <span className="material-symbols-outlined text-lg">exit_to_app</span>
             Salir a Hub Principal
           </Link>
        </div>
      </div>
    </>
  );
}
