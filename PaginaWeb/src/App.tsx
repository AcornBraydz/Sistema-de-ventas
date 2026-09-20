import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { usePosStore } from './store/posStore';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { PosView } from './views/PosView';
import { CustomerSearchView } from './views/CustomerSearchView';
import { AdminView } from './views/AdminView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { InventoryReportsView } from './views/InventoryReportsView';
import { TransactionHistoryView } from './views/TransactionHistoryView';
import { ProductEditorView } from './views/ProductEditorView';
import { ProvidersView } from './views/ProvidersView';
import { FinanceView } from './views/FinanceView';
import { ReceivablesView } from './views/ReceivablesView';
import { CustomerDetailView } from './views/CustomerDetailView';
import { PayrollView } from './views/PayrollView';
import { SettingsView } from './views/SettingsView';
import { MainMenuView } from './views/MainMenuView';
import { InventoryView } from './views/InventoryView';
import { StaffAccessView } from './views/StaffAccessView';
import { LoginView } from './views/LoginView';
import { OnboardingView } from './views/OnboardingView';
import { LicenseLockView } from './views/LicenseLockView';
import { LicenseInfoView } from './views/LicenseInfoView';

import { useStaffStore } from './store/staffStore';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const user = useAuthStore(state => state.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { requireSetup, isCheckingStatus, licenseValid, checkSystemStatus } = useAuthStore();

  useEffect(() => {
    // Initial data fetch from local backend
    usePosStore.getState().fetchProducts();
    usePosStore.getState().fetchCategories();
    useStaffStore.getState().fetchEmployees();
    useSettingsStore.getState().fetchSettings();
    checkSystemStatus();
  }, [checkSystemStatus]);

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
      </div>
    );
  }

  if (!licenseValid) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<LicenseLockView />} />
        </Routes>
      </Router>
    );
  }

  if (requireSetup) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<OnboardingView />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        
        <Route path="/" element={<ProtectedRoute><MainMenuView /></ProtectedRoute>} />
        
        <Route path="/pos" element={<ProtectedRoute><PosView /></ProtectedRoute>} />
        <Route path="/pos/customers" element={<ProtectedRoute><CustomerSearchView /></ProtectedRoute>} />
        <Route path="/pos/history" element={<ProtectedRoute><TransactionHistoryView /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><TransactionHistoryView /></ProtectedRoute>} />
        
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminView /></ProtectedRoute>}>
          <Route index element={<AdminDashboardView />} />
          <Route path="history" element={<TransactionHistoryView />} />
          <Route path="inventory" element={<InventoryView />} />
          <Route path="inventory/new" element={<ProductEditorView />} />
          <Route path="inventory/suppliers" element={<ProvidersView />} />
          <Route path="inventory/reports" element={<InventoryReportsView />} />
          <Route path="products/new" element={<ProductEditorView />} />
          <Route path="providers" element={<ProvidersView />} />
          <Route path="finance" element={<FinanceView />} />
          <Route path="finance/receivables" element={<ReceivablesView />} />
          <Route path="finance/receivables/:id" element={<CustomerDetailView />} />
          <Route path="receivables" element={<ReceivablesView />} />
          <Route path="receivables/:id" element={<CustomerDetailView />} />
          <Route path="customers/:id" element={<CustomerDetailView />} />
          <Route path="payroll" element={<PayrollView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="staff" element={<StaffAccessView />} />
          <Route path="license" element={<LicenseInfoView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
