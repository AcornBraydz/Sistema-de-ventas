import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ShiftLog {
  id: number;
  user_id: number;
  date: string;
  hours: number;
  hourly_rate: number;
  total_pay: number;
  notes?: string;
  timestamp: number;
}

interface AdvanceLog {
  id: number;
  user_id: number;
  date: string;
  amount: number;
  reason?: string;
  timestamp: number;
}

interface CashShiftRecord {
  id: number;
  user_id?: number;
  user_name: string;
  open_time: number;
  close_time?: number;
  initial_fund: number;
  total_sales: number;
  hours_worked: number;
  hourly_rate: number;
  total_payout: number;
  status: 'open' | 'closed';
}

interface PaymentLog {
  id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  reference_info?: string;
  notes?: string;
  timestamp: number;
}

interface PayrollEmployee {
  id: number;
  name: string;
  username: string;
  role: string;
  pin: string;
  hourly_rate: number;
  total_hours: number;
  total_earned: number;
  total_advances: number;
  total_paid?: number;
  net_pay: number;
  bank_name?: string;
  bank_account?: string;
  transfer_phone?: string;
  shifts?: ShiftLog[];
  advances?: AdvanceLog[];
  payments?: PaymentLog[];
}

export function PayrollView() {
  const [searchParams, _setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'payroll' | 'estimator' | 'clock' | null;
  const [payrollList, setPayrollList] = useState<PayrollEmployee[]>([]);
  const [cashShifts, setCashShifts] = useState<CashShiftRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'payroll' | 'estimator' | 'clock'>(tabParam || 'payroll');
  const [isLoading, setIsLoading] = useState(true);

  // Sync tab if URL param changes
  useEffect(() => {
    if (tabParam && ['payroll', 'estimator', 'clock'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Estimator State (Horas, Minutos, Segundos)
  const [estimatorUserId, setEstimatorUserId] = useState<number | ''>('');
  const [estimatorHours, setEstimatorHours] = useState('5');
  const [estimatorMinutes, setEstimatorMinutes] = useState('0');
  const [estimatorSeconds, setEstimatorSeconds] = useState('0');
  const [estimatorRate, setEstimatorRate] = useState('50.00');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [showAllDropdown, setShowAllDropdown] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  // Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);

  // Pay Modal State
  const [payEmployee, setPayEmployee] = useState<PayrollEmployee | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [payNotes, setPayNotes] = useState('');
  const [payCopied, setPayCopied] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  // Shift Form State
  const [shiftUserId, setShiftUserId] = useState<number | ''>('');
  const [shiftHours, setShiftHours] = useState('5.0');
  const [shiftRate, setShiftRate] = useState('50.00');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftSearchQuery, setShiftSearchQuery] = useState('');
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);
  const [showAllShiftDropdown, setShowAllShiftDropdown] = useState(false);

  // Advance Form State
  const [advanceUserId, setAdvanceUserId] = useState<number | ''>('');
  const [advanceAmount, setAdvanceAmount] = useState('100.00');
  const [advanceDate, _setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [advanceReason, setAdvanceReason] = useState('Adelanto de efectivo');
  const [advanceSearchQuery, setAdvanceSearchQuery] = useState('');
  const [isAdvanceDropdownOpen, setIsAdvanceDropdownOpen] = useState(false);
  const [showAllAdvanceDropdown, setShowAllAdvanceDropdown] = useState(false);
  const [advanceMethod, setAdvanceMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [advanceConfirmedDelivered, setAdvanceConfirmedDelivered] = useState(false);
  const [advanceCopied, setAdvanceCopied] = useState(false);

  // Advance Authorization Modal State
  const [isAdvanceAuthModalOpen, setIsAdvanceAuthModalOpen] = useState(false);
  const [advanceAdminPassword, setAdvanceAdminPassword] = useState('');
  const [showAdvanceAdminPassword, setShowAdvanceAdminPassword] = useState(false);
  const [advanceAuthError, setAdvanceAuthError] = useState<string | null>(null);

  // Rate Form State
  const [newRate, setNewRate] = useState('50.00');
  const [_rateSuccessMsg, setRateSuccessMsg] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayroll = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/payroll/summary`);
      if (res.ok) {
        const data = await res.json();
        setPayrollList(data);
        if (data.length > 0 && !shiftUserId) {
          setShiftUserId(data[0].id);
          setAdvanceUserId(data[0].id);
          setShiftRate(data[0].hourly_rate?.toString() || '50.00');
          setEstimatorUserId(data[0].id);
          setEstimatorRate(data[0].hourly_rate?.toString() || '50.00');
          setEmployeeSearchQuery('');
        }
      }

      // Fetch cash shifts history
      const shiftsRes = await fetch(`${API_BASE_URL}/api/cash-shifts`);
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setCashShifts(shiftsData);
      }
    } catch (e) {
      console.error('Error fetching payroll:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);



  const handleSelectEmployeeForEstimator = (emp: PayrollEmployee) => {
    setEstimatorUserId(emp.id);
    setEstimatorRate(emp.hourly_rate?.toString() || '50.00');
    setEmployeeSearchQuery(emp.name);
    setIsEmployeeDropdownOpen(false);
    setShowAllDropdown(false);
  };

  const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredEstimatorEmployees = payrollList.filter(u => {
    const query = normalizeText(employeeSearchQuery.trim());
    if (!query) return true;
    return normalizeText(u.name).includes(query) || normalizeText(u.username).includes(query);
  });

  const handleSelectEmployeeForAdvance = (emp: PayrollEmployee) => {
    setAdvanceUserId(emp.id);
    setAdvanceSearchQuery(emp.name);
    setIsAdvanceDropdownOpen(false);
    setShowAllAdvanceDropdown(false);
    const hasBank = Boolean(emp.bank_account || emp.transfer_phone);
    if (!hasBank) {
      setAdvanceMethod('Efectivo');
    }
  };

  const filteredAdvanceEmployees = payrollList.filter(u => {
    const query = normalizeText(advanceSearchQuery.trim());
    if (!query) return true;
    return normalizeText(u.name).includes(query) || normalizeText(u.username).includes(query);
  });

  const handleSelectEmployeeForShift = (emp: PayrollEmployee) => {
    setShiftUserId(emp.id);
    setShiftRate(emp.hourly_rate?.toString() || '50.00');
    setShiftSearchQuery(emp.name);
    setIsShiftDropdownOpen(false);
    setShowAllShiftDropdown(false);
  };

  const filteredShiftEmployees = payrollList.filter(u => {
    const query = normalizeText(shiftSearchQuery.trim());
    if (!query) return true;
    return normalizeText(u.name).includes(query) || normalizeText(u.username).includes(query);
  });

  // 1. REGISTRAR HORAS / SUPLENCIA
  const handleRegisterShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftUserId) {
      setError('Por favor escribe y selecciona una persona de la lista desplegable.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: shiftUserId,
          date: shiftDate,
          hours: parseFloat(shiftHours),
          hourly_rate: parseFloat(shiftRate),
          notes: shiftNotes
        })
      });

      if (res.ok) {
        setIsShiftModalOpen(false);
        setShiftNotes('');
        await fetchPayroll();
      } else {
        const data = await res.json();
        setError(data.error || 'Error registrando turno');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. PRE-CONFIRMAR ADELANTO (ABRE MODAL DE CONTRASEÑA)
  const handleAdvancePreConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceUserId) {
      setError('Por favor busca y selecciona un empleado de la lista.');
      return;
    }
    const amt = parseFloat(advanceAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Por favor ingresa un monto válido a adelantar.');
      return;
    }
    if (!advanceConfirmedDelivered) {
      setError('Debes marcar la casilla confirmando que ya entregaste el efectivo o realizaste la transferencia.');
      return;
    }

    const selectedEmp = payrollList.find(u => u.id === advanceUserId);
    if (advanceMethod === 'Transferencia' && !selectedEmp?.bank_account && !selectedEmp?.transfer_phone) {
      setError('Este empleado no tiene datos registrados para transferencia bancaria.');
      return;
    }

    setError(null);
    setAdvanceAuthError(null);
    setAdvanceAdminPassword('');
    setIsAdvanceAuthModalOpen(true);
  };

  // 2.1 AUTORIZAR Y GUARDAR ADELANTO CON CONTRASEÑA DE ADMINISTRADOR
  const handleConfirmAdvanceWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceAdminPassword) {
      setAdvanceAuthError('Ingresa tu contraseña de administrador para autorizar.');
      return;
    }

    setIsSubmitting(true);
    setAdvanceAuthError(null);
    try {
      // 1. Validar contraseña de Administrador contra endpoint de login
      const currentAdmin = useAuthStore.getState().user;
      const adminUsername = currentAdmin?.username || 'admin';
      const authRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername,
          password: advanceAdminPassword
        })
      });

      if (!authRes.ok) {
        setAdvanceAuthError('Contraseña de administrador incorrecta. No se autorizó el adelanto.');
        setIsSubmitting(false);
        return;
      }

      // 2. Registrar Adelanto en BD
      const amt = parseFloat(advanceAmount);
      const res = await fetch(`${API_BASE_URL}/api/payroll/advances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: advanceUserId,
          date: advanceDate,
          amount: amt,
          reason: `${advanceReason || 'Adelanto'} (${advanceMethod})`
        })
      });

      if (res.ok) {
        setIsAdvanceAuthModalOpen(false);
        setIsAdvanceModalOpen(false);
        setAdvanceAmount('100.00');
        setAdvanceReason('Adelanto de efectivo');
        setAdvanceAdminPassword('');
        setAdvanceConfirmedDelivered(false);
        setAdvanceMethod('Efectivo');
        await fetchPayroll();
      } else {
        const data = await res.json();
        setAdvanceAuthError(data.error || 'Error registrando adelanto');
      }
    } catch (err: any) {
      setAdvanceAuthError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. EDITAR TARIFA POR HORA
  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${selectedEmployee.id}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hourly_rate: parseFloat(newRate)
        })
      });

      if (res.ok) {
        setIsRateModalOpen(false);
        setRateSuccessMsg(`¡Tarifa de $${parseFloat(newRate).toFixed(2)}/h guardada con éxito para ${selectedEmployee.name}!`);
        setTimeout(() => setRateSuccessMsg(null), 4000);
        await fetchPayroll();
      } else {
        const data = await res.json();
        setError(data.error || 'Error actualizando tarifa');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.1 ABRIR MODAL DE PAGO / LIQUIDACIÓN
  const handleOpenPayModal = (emp: PayrollEmployee) => {
    setPayEmployee(emp);
    setPayAmount(emp.net_pay > 0 ? emp.net_pay.toFixed(2) : '0.00');
    setPayMethod('Efectivo');
    setPayNotes('');
    setPayCopied(false);
    setError(null);
    setPaySuccessMsg(null);
  };

  // 3.2 CONFIRMAR PAGO DE NÓMINA (EFECTIVO O TRANSFERENCIA)
  const handleConfirmPayrollPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEmployee) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Por favor ingresa un monto válido a pagar.');
      return;
    }

    if (payMethod === 'Transferencia' && !payEmployee.bank_account && !payEmployee.transfer_phone) {
      setError('Este empleado no tiene registrados datos para transferencia bancaria.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: payEmployee.id,
          amount: amt,
          payment_method: payMethod,
          reference_info: payMethod === 'Transferencia' 
            ? `${payEmployee.bank_name || 'Banco'} - ${payEmployee.bank_account || payEmployee.transfer_phone || ''}` 
            : 'Pago en efectivo en mostrador',
          notes: payNotes || `Liquidación de nómina a ${payEmployee.name}`
        })
      });

      if (res.ok) {
        setPaySuccessMsg(`¡Pago de $${amt.toFixed(2)} (${payMethod}) registrado con éxito para ${payEmployee.name}!`);
        await fetchPayroll();
        setTimeout(() => {
          setPaySuccessMsg(null);
          setPayEmployee(null);
        }, 1800);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al procesar el pago.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. GUARDAR TARIFA DESDE ESTIMADOR


  // 5. REGISTRAR TURNO DESDE ESTIMADOR


  // Computed Totals
  const grandTotalNet = payrollList.reduce((sum, e) => sum + (e.net_pay || 0), 0);
  const grandTotalHours = payrollList.reduce((sum, e) => sum + (e.total_hours || 0), 0);
  const grandTotalAdvances = payrollList.reduce((sum, e) => sum + (e.total_advances || 0), 0);

  const totalEstimatorHoursDecimal = 
    (parseFloat(estimatorHours) || 0) + 
    (parseFloat(estimatorMinutes) || 0) / 60 + 
    (parseFloat(estimatorSeconds) || 0) / 3600;

// 

  const calculatedShiftPay = (parseFloat(shiftHours) || 0) * (parseFloat(shiftRate) || 0);
  const calculatedEstimate = totalEstimatorHoursDecimal * (parseFloat(estimatorRate) || 0);

  // Live chronometer tick for real-time tracking
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);



  const calculateLiveEarned = (openTime: number, hourlyRate: number) => {
    const diffHours = (now - openTime) / 3600000;
    return (diffHours * hourlyRate).toFixed(2);
  };

  const formatHoursToHMS = (totalDecimalHours: number) => {
    const totalSeconds = Math.max(0, Math.round((totalDecimalHours || 0) * 3600));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs} hrs ${mins.toString().padStart(2, '0')} min ${secs.toString().padStart(2, '0')} seg`;
  };

  const renderTimeBadge = (decimalHours: number) => {
    const totalSeconds = Math.max(0, Math.round((decimalHours || 0) * 3600));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return (
      <div className="inline-flex items-center gap-1 select-none">
        {/* Rectángulo Horas */}
        <div className="flex items-center justify-center bg-surface-container border border-outline-variant/30 px-2 py-0.5 rounded-md shadow-2xs min-w-[26px]">
          <span className="font-mono text-xs font-bold text-on-surface tracking-tight">
            {hrs.toString().padStart(2, '0')}
          </span>
        </div>

        <span className="text-outline-variant/70 font-mono text-xs font-bold">:</span>

        {/* Rectángulo Minutos */}
        <div className="flex items-center justify-center bg-surface-container border border-outline-variant/30 px-2 py-0.5 rounded-md shadow-2xs min-w-[26px]">
          <span className="font-mono text-xs font-bold text-on-surface tracking-tight">
            {mins.toString().padStart(2, '0')}
          </span>
        </div>

        <span className="text-outline-variant/70 font-mono text-xs font-bold">:</span>

        {/* Rectángulo Segundos */}
        <div className="flex items-center justify-center bg-surface-container border border-outline-variant/30 px-2 py-0.5 rounded-md shadow-2xs min-w-[26px]">
          <span className="font-mono text-xs font-bold text-on-surface tracking-tight">
            {secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    );
  };

  const renderLiveTimeBadge = (openTime: number) => {
    const diffSeconds = Math.max(0, Math.floor((now - openTime) / 1000));
    const hrs = Math.floor(diffSeconds / 3600);
    const mins = Math.floor((diffSeconds % 3600) / 60);
    const secs = diffSeconds % 60;

    return (
      <div className="inline-flex items-center gap-1 select-none">
        <div className="flex items-center justify-center bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md shadow-2xs min-w-[26px]">
          <span className="font-mono text-xs font-bold text-primary tracking-tight">
            {hrs.toString().padStart(2, '0')}
          </span>
        </div>
        <span className="text-primary/70 font-mono text-xs font-bold">:</span>
        <div className="flex items-center justify-center bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md shadow-2xs min-w-[26px]">
          <span className="font-mono text-xs font-bold text-primary tracking-tight">
            {mins.toString().padStart(2, '0')}
          </span>
        </div>
        <span className="text-primary/70 font-mono text-xs font-bold">:</span>
        <div className="flex items-center justify-center bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md shadow-2xs min-w-[26px]">
          <span className="font-mono text-xs font-bold text-primary tracking-tight">
            {secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    );
  };

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return 'En curso...';
    return new Date(timestamp).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6 bg-background">
      {/* Header Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 bg-surface-container rounded-3xl shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-md">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface">Gestión de Nómina & Turnos</h1>
            <p className="font-body-md text-sm text-on-surface-variant">
              Estimador de pago por horas, control de suplencias y checador automático con caja.
            </p>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col px-5 py-2.5 bg-surface-container-high rounded-2xl border border-outline-variant/10">
            <span className="font-label-caps text-xs text-on-surface-variant uppercase font-bold">Total Horas</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-on-surface">{formatHoursToHMS(grandTotalHours)}</span>
          </div>
          <div className="flex flex-col px-5 py-2.5 bg-surface-container-high rounded-2xl border border-outline-variant/10">
            <span className="font-label-caps text-xs text-on-surface-variant uppercase font-bold">Adelantos</span>
            <span className="font-mono text-2xl font-bold text-error">-${grandTotalAdvances.toFixed(2)}</span>
          </div>
          <div className="flex flex-col px-5 py-2.5 bg-primary/10 rounded-2xl border border-primary/20">
            <span className="font-label-caps text-xs text-primary uppercase font-bold">Total a Pagar</span>
            <span className="font-mono text-2xl font-bold text-primary">${grandTotalNet.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Actions Single Horizontal Row */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/20 pb-3.5 no-scrollbar whitespace-nowrap">
        {/* Tab 1: Resumen Semanal de Nómina */}
        <button 
          onClick={() => setActiveTab('payroll')}
          className={`px-3.5 py-2 rounded-xl font-label-caps font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${activeTab === 'payroll' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}
        >
          Resumen de Nómina
        </button>

        {/* Tab 2: Estimador Rápido de Horas */}
        <button 
          onClick={() => setActiveTab('estimator')}
          className={`px-3.5 py-2 rounded-xl font-label-caps font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${activeTab === 'estimator' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined text-sm">calculate</span>
          Estimador Rápido de Horas
        </button>

        {/* Tab 3: Checador de Turnos de Caja */}
        <button 
          onClick={() => setActiveTab('clock')}
          className={`px-3.5 py-2 rounded-xl font-label-caps font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${activeTab === 'clock' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined text-sm">history_toggle_off</span>
          Checador de Turnos de Caja
        </button>

        {/* Separador vertical */}
        <div className="h-5 w-px bg-outline-variant/30 shrink-0 mx-1"></div>

        {/* Action 1: Adelanto */}
        <button 
          onClick={() => {
            setError(null);
            setAdvanceSearchQuery('');
            setAdvanceUserId('');
            setIsAdvanceDropdownOpen(false);
            setShowAllAdvanceDropdown(false);
            setIsAdvanceModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
        >
          <span className="material-symbols-outlined text-sm text-error">price_change</span>
          Adelanto
        </button>
      </div>

      {/* TAB 1: RESUMEN DE NÓMINA */}
      {activeTab === 'payroll' && (
        <div className="flex-1 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col border border-outline-variant/10 animate-slide-up">
          {/* Top Filter Bar */}
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low/50 flex justify-end items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Filtrar por:</label>
              <select 
                className="bg-surface-container border border-outline-variant/30 text-on-surface text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer font-medium shadow-sm"
                defaultValue="semana"
              >
                <option value="dia">Día</option>
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
                <option value="ano">Año</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  <th className="py-4 px-6 text-left">Empleado / Personal</th>
                  <th className="py-4 px-6 text-center">Horas Registradas</th>
                  <th className="py-4 px-6 text-center">Total a Pagar</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-on-surface-variant">
                      <div className="flex items-center justify-center gap-2 font-bold">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Cargando nómina...
                      </div>
                    </td>
                  </tr>
                ) : payrollList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-on-surface-variant">
                      No hay empleados dados de alta. Ve a <strong>Personal y Accesos</strong> para registrar empleados.
                    </td>
                  </tr>
                ) : (
                  payrollList.map(emp => {
                    const initials = emp.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <tr key={emp.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 px-6 text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {initials || 'EM'}
                            </div>
                            <div>
                              <div className="font-bold text-on-surface">{emp.name}</div>
                              <div className="text-xs text-on-surface-variant font-mono">@{emp.username}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center">
                            {renderTimeBadge(emp.total_hours)}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-center font-mono text-base font-bold text-primary">
                          ${emp.net_pay.toFixed(2)}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleOpenPayModal(emp)}
                              disabled={emp.net_pay <= 0}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                                emp.net_pay > 0 
                                  ? 'bg-primary text-on-primary hover:bg-primary/90 cursor-pointer' 
                                  : 'bg-surface-container text-on-surface-variant/50 cursor-not-allowed border border-outline-variant/20'
                              }`}
                              title={emp.net_pay > 0 ? `Pagar $${emp.net_pay.toFixed(2)} a ${emp.name}` : 'Sin saldo pendiente por liquidar'}
                            >
                              <span className="material-symbols-outlined text-sm">payments</span>
                              Pagar
                            </button>

                            <button 
                              onClick={() => setSelectedEmployee(emp)}
                              className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs border border-outline-variant/30"
                            >
                              <span className="material-symbols-outlined text-sm text-primary">receipt_long</span>
                              Ver Desglose
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ESTIMADOR RÁPIDO DE HORAS */}
      {activeTab === 'estimator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          {/* Card de Cálculo */}
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase mb-1">
                <span className="material-symbols-outlined text-base">calculate</span>
                Cotizador de Sueldo
              </div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">Estimador Rápido de Pago</h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Calcula al instante cuánto pagarle a un empleado o suplente según las horas que te proponga trabajar hoy.
              </p>

              <div className="space-y-5">
                {/* Searchable Autocomplete Employee Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Buscar o Escribir Nombre del Empleado
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={employeeSearchQuery}
                      onChange={(e) => {
                        setEmployeeSearchQuery(e.target.value);
                        setIsEmployeeDropdownOpen(true);
                        setShowAllDropdown(false);
                      }}
                      placeholder="Escribe el nombre del empleado (ej. Juan)..."
                      className="w-full bg-surface-container border border-outline-variant/30 py-3 pl-11 pr-20 rounded-2xl text-sm font-bold text-on-surface outline-none focus:border-primary transition-all shadow-sm"
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-on-surface-variant text-lg">
                      search
                    </span>
                    <div className="absolute right-3 top-2.5 flex items-center gap-1">
                      {employeeSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setEmployeeSearchQuery('');
                            setIsEmployeeDropdownOpen(false);
                            setShowAllDropdown(false);
                          }}
                          className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                          title="Limpiar búsqueda"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !showAllDropdown;
                          setShowAllDropdown(nextState);
                          setIsEmployeeDropdownOpen(nextState);
                        }}
                        className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {(isEmployeeDropdownOpen && (employeeSearchQuery.trim().length > 0 || showAllDropdown)) ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Options List: Solo aparece cuando escribes coincidencias o cuando abres con la flecha */}
                  {isEmployeeDropdownOpen && (employeeSearchQuery.trim().length > 0 || showAllDropdown) && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 z-30 max-h-60 overflow-y-auto p-1.5 animate-slide-up space-y-1">
                      {filteredEstimatorEmployees.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-xs font-bold text-on-surface">No se encontró "{employeeSearchQuery}" en la lista</p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Puedes cotizarle escribiendo su tarifa abajo manualmente.</p>
                        </div>
                      ) : (
                        filteredEstimatorEmployees.map((u) => {
                          const isSelected = u.id === estimatorUserId;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleSelectEmployeeForEstimator(u)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                                  : 'hover:bg-surface-container text-on-surface'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-primary/10 text-primary'
                                  }`}
                                >
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-xs font-bold">{u.name}</div>
                                  <div
                                    className={`text-[10px] ${
                                      isSelected ? 'text-white/80' : 'text-on-surface-variant'
                                    }`}
                                  >
                                    @{u.username} • {u.role === 'admin' ? 'Administrador' : 'Cajero'}
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`font-mono text-xs font-bold ${
                                  isSelected ? 'text-white' : 'text-secondary'
                                }`}
                              >
                                ${u.hourly_rate.toFixed(2)}/h
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Tiempo a Trabajar: 3 Cuadros (Horas, Minutos, Segundos) */}
                <div>
                  <div className="mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Tiempo a Trabajar
                    </label>
                  </div>

                  {/* 3 Cuadros de Entrada Manual */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {/* Cuadro 1: Horas */}
                    <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 flex flex-col items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Horas (HH)
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={estimatorHours}
                        onChange={(e) => setEstimatorHours(e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent font-mono text-2xl font-bold text-on-surface outline-none"
                      />
                    </div>

                    {/* Cuadro 2: Minutos */}
                    <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 flex flex-col items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Minutos (MM)
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={estimatorMinutes}
                        onChange={(e) => setEstimatorMinutes(e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent font-mono text-2xl font-bold text-on-surface outline-none"
                      />
                    </div>

                    {/* Cuadro 3: Segundos */}
                    <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 flex flex-col items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Segundos (SS)
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={estimatorSeconds}
                        onChange={(e) => setEstimatorSeconds(e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent font-mono text-2xl font-bold text-on-surface outline-none"
                      />
                    </div>
                  </div>

                  {/* Botones de Acceso Rápido */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-on-surface-variant mr-1">Rápidos:</span>
                    {['1h', '3h', '4h', '5h', '8h', '12h'].map((label) => {
                      const hVal = label.replace('h', '');
                      const isMatch = estimatorHours === hVal && (estimatorMinutes === '0' || estimatorMinutes === '') && (estimatorSeconds === '0' || estimatorSeconds === '');
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setEstimatorHours(hVal);
                            setEstimatorMinutes('0');
                            setEstimatorSeconds('0');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                            isMatch
                              ? 'bg-primary text-white shadow-sm ring-1 ring-primary/40'
                              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Resultado */}
            <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase text-primary block">Pago Estimado para el Empleado</span>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-bold text-primary">
                ${calculatedEstimate.toFixed(2)} <span className="text-sm font-sans font-normal text-on-surface-variant">MXN</span>
              </div>
            </div>
          </div>

          {/* Tabla de Referencia de Turnos de Tienda */}
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase mb-1">
                <span className="material-symbols-outlined text-base">storefront</span>
                Operación de la Tienda
              </div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">Presupuesto por Turno Completo</h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Referencia rápida de cuánto cuesta cubrir la operación diaria de tu tienda según la tarifa base de <strong>${parseFloat(estimatorRate || '50').toFixed(2)}/h</strong>:
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-surface-container rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-on-surface block">Turno Corto / Medio Turno (4 Horas)</span>
                    <span className="text-xs text-on-surface-variant">Para horas pico o relevos de comida</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-on-surface">
                    ${(4 * parseFloat(estimatorRate || '50')).toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-surface-container rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-on-surface block">Turno Estándar (8 Horas)</span>
                    <span className="text-xs text-on-surface-variant">Turno matutino o vespertino regular</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-on-surface">
                    ${(8 * parseFloat(estimatorRate || '50')).toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-surface-container rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-on-surface block">Día Completo (12 Horas)</span>
                    <span className="text-xs text-on-surface-variant">Apertura a cierre (ej. 8:00 AM a 8:00 PM)</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-secondary">
                    ${(12 * parseFloat(estimatorRate || '50')).toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-surface-container rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-on-surface block">Tienda 24 Horas (Día y Noche)</span>
                    <span className="text-xs text-on-surface-variant">Cubre 3 turnos de 8 hrs o 2 turnos de 12 hrs</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-primary">
                    ${(24 * parseFloat(estimatorRate || '50')).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-on-surface-variant mt-4 text-center">
              💡 Si dos personas se dividen un turno de 12 horas (ej. 5 hrs y 7 hrs), la suma total a pagar sigue siendo exactamente la misma.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: CHECADOR DE TURNOS DE CAJA EN VIVO */}
      {activeTab === 'clock' && (
        <div className="space-y-6 animate-slide-up">
          {/* Banner de Turno en Vivo si hay alguien trabajando */}
          {cashShifts.find(s => s.status === 'open') ? (
            (() => {
              const active = cashShifts.find(s => s.status === 'open')!;
              const activeEarned = calculateLiveEarned(active.open_time, active.hourly_rate || 50);
              return (
                <div className="bg-surface-container-low p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md relative">
                      <span className="material-symbols-outlined text-3xl">hourglass_top</span>
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-surface animate-ping"></span>
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-surface"></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                          Turno en Vivo
                        </span>
                        <span className="text-xs font-mono text-on-surface-variant">Entrada: {formatDateTime(active.open_time)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-on-surface mt-1">{active.user_name} está en caja</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-surface-container px-6 py-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                    <div className="text-center sm:text-right">
                      <span className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Tiempo Transcurrido</span>
                      <div className="flex justify-center sm:justify-end">
                        {renderLiveTimeBadge(active.open_time)}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-outline-variant/30"></div>
                    <div className="text-center sm:text-right">
                      <span className="block text-[11px] font-bold text-on-surface-variant uppercase mb-0.5">Sueldo Acumulado</span>
                      <span className="font-mono text-2xl font-bold text-primary">
                        ${activeEarned} <span className="text-xs font-sans text-on-surface-variant font-normal">MXN</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex items-center gap-3 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-base text-on-surface-variant">lock_clock</span>
              <span>No hay turnos activos en este momento. La caja se encuentra cerrada.</span>
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/10">
            <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Historial de Turnos y Checador de Entradas/Salidas</h2>
                <p className="text-xs text-on-surface-variant">
                  Monitoreo en tiempo real del tiempo laborado y estado completado de cada jornada.
                </p>
              </div>
              <button 
                onClick={fetchPayroll}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold text-on-surface flex items-center gap-1.5 self-start cursor-pointer shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Actualizar
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                    <th className="py-4 px-6 text-left">Cajero / Personal</th>
                    <th className="py-4 px-6 text-center">Hora Entrada</th>
                    <th className="py-4 px-6 text-center">Hora Salida</th>
                    <th className="py-4 px-6 text-center">Estado de Jornada</th>
                    <th className="py-4 px-6 text-center">Tiempo Laborado</th>
                    <th className="py-4 px-6 text-center">Tarifa</th>
                    <th className="py-4 px-6 text-center">Pago Liquidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {cashShifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                        No hay registros de turnos todavía. Al iniciar turno en el POS con NIP se registrará aquí automáticamente.
                      </td>
                    </tr>
                  ) : (
                    cashShifts.map(s => {
                      const isOpen = s.status === 'open';
                      const livePay = isOpen ? calculateLiveEarned(s.open_time, s.hourly_rate || 50) : s.total_payout.toFixed(2);

                      return (
                        <tr key={s.id} className={`transition-colors ${isOpen ? 'bg-primary/5 font-semibold' : 'hover:bg-surface-container-low'}`}>
                          <td className="py-4 px-6 text-left font-bold text-on-surface">
                            <div className="flex items-center gap-2.5">
                              {isOpen ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0"></span>
                              ) : (
                                <span className="material-symbols-outlined text-sm text-on-surface-variant/60">person</span>
                              )}
                              <span>{s.user_name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-xs text-on-surface">
                            {formatDateTime(s.open_time)}
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-xs">
                            {s.close_time ? (
                              <span className="text-on-surface">{formatDateTime(s.close_time)}</span>
                            ) : (
                              <span className="text-primary font-bold inline-flex items-center gap-1 font-sans text-xs">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                Laborando ahora
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {isOpen ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                En Turno
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant border border-outline-variant/30">
                                <span className="material-symbols-outlined text-xs text-primary">check_circle</span>
                                Completado
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center">
                              {isOpen ? renderLiveTimeBadge(s.open_time) : renderTimeBadge(s.hours_worked)}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-xs text-on-surface-variant">
                            ${s.hourly_rate.toFixed(2)}/h
                          </td>
                          <td className="py-4 px-6 text-center font-mono font-bold text-base">
                            <span className="text-primary">${livePay}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRAR HORAS / SUPLENCIA */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative border border-outline-variant/20">
            <button 
              onClick={() => setIsShiftModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/10">
              <h3 className="text-xl font-bold text-on-surface mb-0.5">Registrar Horas Trabajadas</h3>
              <p className="text-xs text-on-surface-variant">Turnos regulares, horas extras o suplencias de personal</p>
            </div>
            
            <form onSubmit={handleRegisterShift} className="p-6 flex-1 flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-error-container/30 text-error border border-error/30 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Empleado con Búsqueda Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Persona que trabajó
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={shiftSearchQuery}
                    onChange={(e) => {
                      setShiftSearchQuery(e.target.value);
                      setIsShiftDropdownOpen(true);
                      setShowAllShiftDropdown(false);
                    }}
                    placeholder="Escribe el nombre del empleado..."
                    className="w-full bg-surface-container-lowest border border-outline-variant py-3 pl-11 pr-20 rounded-2xl text-sm font-bold text-on-surface outline-none focus:border-primary transition-all shadow-xs"
                  />
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-on-surface-variant text-lg">
                    search
                  </span>
                  <div className="absolute right-3 top-2.5 flex items-center gap-1">
                    {shiftSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setShiftSearchQuery('');
                          setShiftUserId('');
                          setIsShiftDropdownOpen(false);
                          setShowAllShiftDropdown(false);
                        }}
                        className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                        title="Limpiar"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !showAllShiftDropdown;
                        setShowAllShiftDropdown(nextState);
                        setIsShiftDropdownOpen(nextState);
                      }}
                      className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {(isShiftDropdownOpen && (shiftSearchQuery.trim().length > 0 || showAllShiftDropdown)) ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Dropdown Options List */}
                {isShiftDropdownOpen && (shiftSearchQuery.trim().length > 0 || showAllShiftDropdown) && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 z-30 max-h-52 overflow-y-auto p-1.5 animate-slide-up space-y-1">
                    {filteredShiftEmployees.length === 0 ? (
                      <div className="p-3 text-center text-xs text-on-surface-variant">
                        No se encontraron empleados con ese nombre.
                      </div>
                    ) : (
                      filteredShiftEmployees.map((u) => {
                        const isSelected = u.id === shiftUserId;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectEmployeeForShift(u)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-on-primary font-bold shadow-sm'
                                : 'hover:bg-surface-container text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-xs font-bold">{u.name}</div>
                                <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-on-surface-variant'}`}>
                                  @{u.username} • {u.role === 'admin' ? 'Administrador' : 'Cajero'}
                                </div>
                              </div>
                            </div>
                            <span className={`font-mono text-xs font-bold ${isSelected ? 'text-white' : 'text-secondary'}`}>
                              ${u.hourly_rate.toFixed(2)}/h
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Fecha del Turno</label>
                <input 
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 px-4 rounded-xl text-sm text-on-surface font-mono"
                />
              </div>

              {/* Horas Trabajadas y Presets */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Horas Trabajadas</label>
                  <span className="text-[11px] text-primary font-bold">Botones rápidos</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {['3.0', '4.0', '5.0', '8.0', '12.0'].map(hrs => (
                    <button 
                      key={hrs}
                      type="button"
                      onClick={() => setShiftHours(hrs)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${shiftHours === hrs ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
                <input 
                  required
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 px-4 rounded-xl text-sm font-mono font-bold text-on-surface"
                />
              </div>

              {/* Tarifa y Cálculo en Vivo */}
              <div className="grid grid-cols-2 gap-3 bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/30">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase">Tarifa ($/hora)</label>
                  <input 
                    type="number"
                    step="1"
                    min="1"
                    value={shiftRate}
                    onChange={(e) => setShiftRate(e.target.value)}
                    className="w-full bg-transparent font-mono text-sm font-bold text-on-surface outline-none"
                  />
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-bold text-on-surface-variant uppercase">Monto por este turno</span>
                  <span className="font-mono text-lg font-bold text-primary">
                    ${calculatedShiftPay.toFixed(2)} MXN
                  </span>
                </div>
              </div>

              {/* Notas / Suplencia */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Nota o Motivo (Opcional)</label>
                <input 
                  type="text"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="Ej. Cubrió 5 horas de la tarde por permiso"
                  className="w-full bg-surface-container-lowest border border-outline-variant py-2 px-4 rounded-xl text-sm text-on-surface"
                />
              </div>

              <div className="mt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Registrar Horas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR ADELANTO (VALE) */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col relative border border-outline-variant/20 animate-[scale-in_0.2s_ease-out]">
            
            {/* Header del Modal (Fijo arriba) */}
            <div className="p-4 sm:p-5 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-error/10 text-error flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-xl">price_change</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface leading-tight">Registrar Adelanto</h3>
                  <p className="text-xs text-on-surface-variant">Préstamos o anticipos a cuenta de horas trabajadas</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            {/* Formulario (Scrollable) */}
            <form onSubmit={handleAdvancePreConfirm} className="p-5 overflow-y-auto space-y-4 flex-1">
              {error && (
                <div className="p-3 bg-error/10 text-error border border-error/30 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Empleado con Búsqueda Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  1. Buscar Empleado *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={advanceSearchQuery}
                    onChange={(e) => {
                      setAdvanceSearchQuery(e.target.value);
                      setIsAdvanceDropdownOpen(true);
                      setShowAllAdvanceDropdown(false);
                    }}
                    placeholder="Escribe el nombre del empleado..."
                    className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 pl-9 pr-14 rounded-xl text-sm font-bold text-on-surface outline-none focus:border-primary transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-base">
                    search
                  </span>
                  <div className="absolute right-2 top-2 flex items-center gap-0.5">
                    {advanceSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdvanceSearchQuery('');
                          setAdvanceUserId('');
                          setIsAdvanceDropdownOpen(false);
                          setShowAllAdvanceDropdown(false);
                        }}
                        className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                        title="Limpiar"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !showAllAdvanceDropdown;
                        setShowAllAdvanceDropdown(nextState);
                        setIsAdvanceDropdownOpen(nextState);
                      }}
                      className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {(isAdvanceDropdownOpen && (advanceSearchQuery.trim().length > 0 || showAllAdvanceDropdown)) ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Dropdown Options List */}
                {isAdvanceDropdownOpen && (advanceSearchQuery.trim().length > 0 || showAllAdvanceDropdown) && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 z-30 max-h-44 overflow-y-auto p-1.5 animate-slide-up space-y-1">
                    {filteredAdvanceEmployees.length === 0 ? (
                      <div className="p-3 text-center text-xs text-on-surface-variant">
                        No se encontraron empleados.
                      </div>
                    ) : (
                      filteredAdvanceEmployees.map((u) => {
                        const isSelected = u.id === advanceUserId;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectEmployeeForAdvance(u)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-on-primary font-bold shadow-xs'
                                : 'hover:bg-surface-container text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-xs font-bold leading-tight">{u.name}</div>
                                <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-on-surface-variant'}`}>
                                  @{u.username} • {u.role === 'admin' ? 'Administrador' : 'Cajero'}
                                </div>
                              </div>
                            </div>
                            <span className={`font-mono text-xs font-bold ${isSelected ? 'text-white' : 'text-secondary'}`}>
                              ${u.hourly_rate.toFixed(2)}/h
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 2. Monto del Adelanto (Abajo) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  2. Monto del Adelanto ($ MXN) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-error font-mono font-bold text-base">$</span>
                  <input 
                    required
                    type="number"
                    step="any"
                    min="1"
                    placeholder="0.00"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 pl-8 pr-4 rounded-xl text-lg font-mono font-bold text-error outline-none focus:border-error"
                  />
                </div>
              </div>

              {/* 3. Concepto (Abajo) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  3. Concepto
                </label>
                <input 
                  type="text"
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  placeholder="Escribe el motivo del adelanto..."
                  className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 px-4 rounded-xl text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* 4. Medios por los cuales se dará el adelanto (Solo visible si hay empleado seleccionado) */}
              {advanceUserId && (() => {
                const selectedEmpForAdvance = payrollList.find(u => u.id === advanceUserId);
                const hasBankDetails = Boolean(selectedEmpForAdvance?.bank_account || selectedEmpForAdvance?.transfer_phone);

                return (
                  <div className="space-y-3 animate-slide-up pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        4. Medio de Entrega del Adelanto
                      </label>
                      <span className="text-[10px] text-primary font-bold">
                        {hasBankDetails ? '2 medios disponibles' : '1 medio disponible'}
                      </span>
                    </div>

                    <div className={`grid gap-2.5 ${hasBankDetails ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      {/* OPCIÓN 1: EFECTIVO (Siempre disponible) */}
                      <div 
                        onClick={() => setAdvanceMethod('Efectivo')}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          advanceMethod === 'Efectivo'
                            ? 'border-primary bg-primary/5 shadow-xs'
                            : 'border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-secondary">payments</span>
                            <span className="font-bold text-xs text-on-surface">Efectivo</span>
                          </div>
                          <input 
                            type="radio" 
                            name="advanceMethod" 
                            checked={advanceMethod === 'Efectivo'} 
                            onChange={() => setAdvanceMethod('Efectivo')}
                            className="accent-primary"
                          />
                        </div>
                        <p className="text-[10px] text-on-surface-variant">
                          {hasBankDetails 
                            ? 'Entrega en dinero físico directo de caja.' 
                            : 'Entrega en dinero físico de caja (Único medio registrado para este empleado).'}
                        </p>
                      </div>

                      {/* OPCIÓN 2: TRANSFERENCIA (Solo si tiene datos bancarios) */}
                      {hasBankDetails && (
                        <div 
                          onClick={() => setAdvanceMethod('Transferencia')}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            advanceMethod === 'Transferencia'
                              ? 'border-primary bg-primary/5 shadow-xs'
                              : 'border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container-low'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg text-primary">account_balance</span>
                              <span className="font-bold text-xs text-on-surface">Transferencia</span>
                            </div>
                            <input 
                              type="radio" 
                              name="advanceMethod" 
                              checked={advanceMethod === 'Transferencia'} 
                              onChange={() => setAdvanceMethod('Transferencia')}
                              className="accent-primary"
                            />
                          </div>
                          <p className="text-[10px] text-on-surface-variant">
                            SPEI o depósito a cuenta bancaria.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* DATOS BANCARIOS SI ELIGE TRANSFERENCIA */}
                    {advanceMethod === 'Transferencia' && selectedEmpForAdvance && hasBankDetails && (
                      <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl space-y-2 animate-slide-up">
                        <div className="flex items-center justify-between border-b border-primary/15 pb-1">
                          <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">credit_card</span>
                            Cuenta Bancaria del Empleado
                          </span>
                          {advanceCopied && (
                            <span className="text-[10px] bg-secondary text-on-secondary px-2 py-0.5 rounded-md font-bold animate-slide-up">
                              ¡Copiado!
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {selectedEmpForAdvance.bank_name && (
                            <div>
                              <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Banco:</span>
                              <span className="font-bold text-on-surface text-xs">{selectedEmpForAdvance.bank_name}</span>
                            </div>
                          )}

                          {selectedEmpForAdvance.transfer_phone && (
                            <div>
                              <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Teléfono / Dimo:</span>
                              <span className="font-mono font-bold text-on-surface text-xs">{selectedEmpForAdvance.transfer_phone}</span>
                            </div>
                          )}

                          {selectedEmpForAdvance.bank_account && (
                            <div className="sm:col-span-2 flex items-center justify-between bg-surface p-2 rounded-xl border border-outline-variant/30">
                              <div>
                                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">CLABE / Tarjeta:</span>
                                <span className="font-mono font-bold text-primary text-xs tracking-wider">{selectedEmpForAdvance.bank_account}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedEmpForAdvance.bank_account) {
                                    navigator.clipboard.writeText(selectedEmpForAdvance.bank_account);
                                    setAdvanceCopied(true);
                                    setTimeout(() => setAdvanceCopied(false), 2000);
                                  }
                                }}
                                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span className="material-symbols-outlined text-xs">content_copy</span>
                                Copiar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. Casilla de Confirmación de Entrega */}
                    <label className="flex items-start gap-3 p-3.5 bg-surface-container rounded-2xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-high transition-colors mt-2">
                      <input 
                        type="checkbox"
                        required
                        checked={advanceConfirmedDelivered}
                        onChange={(e) => setAdvanceConfirmedDelivered(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-on-surface font-medium leading-relaxed">
                        {advanceMethod === 'Efectivo' 
                          ? 'Confirmo que ya entregué el dinero físico en efectivo de caja al empleado.' 
                          : 'Confirmo que ya realicé la transferencia bancaria con éxito a su cuenta.'}
                      </span>
                    </label>
                  </div>
                );
              })()}
            </form>

            {/* Footer de Acciones (Fijo abajo) */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsAdvanceModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleAdvancePreConfirm}
                disabled={!advanceUserId || parseFloat(advanceAmount) <= 0 || !advanceConfirmedDelivered}
                className="px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white bg-error rounded-xl hover:bg-error/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span>Confirmar Adelanto</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2.1: VENTANA DE AUTORIZACIÓN CON CONTRASEÑA DE ADMINISTRADOR */}
      {isAdvanceAuthModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative border border-primary/30 animate-[scale-in_0.2s_ease-out]">
            
            {/* Header de Seguridad */}
            <div className="p-5 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface leading-tight">Autorización de Seguridad</h3>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider">Confirmación de Administrador</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdvanceAuthModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAdvanceWithPassword} className="p-5 space-y-4">
              {advanceAuthError && (
                <div className="p-3 bg-error/10 text-error border border-error/30 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{advanceAuthError}</span>
                </div>
              )}

              {/* Resumen del Adelanto a Autorizar */}
              <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/30 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant font-bold uppercase text-[10px]">Empleado:</span>
                  <span className="font-bold text-on-surface text-sm">
                    {payrollList.find(u => u.id === advanceUserId)?.name || 'Empleado'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant font-bold uppercase text-[10px]">Monto a Entregar:</span>
                  <span className="font-mono text-base font-black text-error">
                    ${(parseFloat(advanceAmount) || 0).toFixed(2)} MXN
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant font-bold uppercase text-[10px]">Método:</span>
                  <span className="font-bold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">
                      {advanceMethod === 'Transferencia' ? 'account_balance' : 'payments'}
                    </span>
                    {advanceMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold uppercase text-[10px]">Concepto:</span>
                  <span className="text-on-surface italic truncate max-w-[200px]">
                    {advanceReason || 'Adelanto de nómina'}
                  </span>
                </div>
              </div>

              {/* Input Contraseña */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Ingresa tu Contraseña de Administrador *
                  </label>
                  <button 
                    type="button"
                    onClick={() => setShowAdvanceAdminPassword(!showAdvanceAdminPassword)}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">{showAdvanceAdminPassword ? 'visibility_off' : 'visibility'}</span>
                    {showAdvanceAdminPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                <input 
                  type={showAdvanceAdminPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={advanceAdminPassword}
                  onChange={(e) => setAdvanceAdminPassword(e.target.value)}
                  placeholder="Contraseña de login de administrador..."
                  className="w-full bg-surface-container-lowest border border-outline-variant py-2.5 px-4 rounded-xl text-sm text-on-surface outline-none focus:border-primary font-medium shadow-xs"
                />
                <p className="text-[11px] text-on-surface-variant">
                  Esta autorización registrará formalmente el adelanto en la base de datos y afectará la nómina.
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAdvanceAuthModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
                >
                  Volver
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !advanceAdminPassword}
                  className="px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  {isSubmitting ? 'Verificando...' : 'Autorizar y Guardar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: MODIFICAR TARIFA POR HORA */}
      {isRateModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative border border-outline-variant/20">
            <button 
              onClick={() => setIsRateModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/10">
              <h3 className="text-xl font-bold text-on-surface mb-0.5">Tarifa por Hora</h3>
              <p className="text-xs text-on-surface-variant">Empleado: <strong className="text-on-surface">{selectedEmployee.name}</strong></p>
            </div>
            
            <form onSubmit={handleUpdateRate} className="p-6 flex-1 flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-error-container/30 text-error border border-error/30 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Tarifa por Hora ($ MXN)</label>
                <input 
                  required
                  type="number"
                  step="1"
                  min="1"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant py-3 px-4 rounded-xl text-xl font-mono font-bold text-on-surface"
                />
              </div>

              <div className="mt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Tarifa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DESGLOSE DE HORAS Y RECIBO DE PAGO */}
      {selectedEmployee && !isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative border border-outline-variant/20 max-h-[90vh]">
            <button 
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/10">
              <div className="text-xs uppercase font-bold text-primary">Comprobante / Desglose de Nómina</div>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <h3 className="text-2xl font-bold text-on-surface">{selectedEmployee.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Tarifa: <strong className="text-on-surface font-mono">${selectedEmployee.hourly_rate.toFixed(2)}/h</strong> • Rol: {selectedEmployee.role}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setNewRate(selectedEmployee.hourly_rate.toString());
                    setError(null);
                    setIsRateModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary border border-primary/20 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  title="Cambiar la tarifa por hora de este empleado"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Cambiar Tarifa
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Turnos / Horas */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  Turnos y Horas Registradas
                </h4>
                <div className="space-y-2">
                  {!selectedEmployee.shifts || selectedEmployee.shifts.length === 0 ? (
                    <p className="text-xs text-on-surface-variant py-3 text-center bg-surface-container rounded-xl">No hay turnos registrados para este empleado.</p>
                  ) : (
                    selectedEmployee.shifts.map(s => (
                      <div key={s.id} className="p-3 bg-surface-container rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-on-surface">{s.date} • {s.hours} horas</div>
                          <div className="text-on-surface-variant">{s.notes || 'Turno estándar'}</div>
                        </div>
                        <div className="font-mono font-bold text-sm text-on-surface">
                          +${s.total_pay.toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Historial de Pagos / Abonos / Liquidaciones */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-secondary">payments</span>
                  Historial de Pagos Realizados
                </h4>
                <div className="space-y-2">
                  {(!selectedEmployee.advances || selectedEmployee.advances.length === 0) && (!selectedEmployee.payments || selectedEmployee.payments.length === 0) ? (
                    <p className="text-xs text-on-surface-variant py-3 text-center bg-surface-container rounded-xl">Sin pagos registrados aún.</p>
                  ) : (
                    <>
                      {selectedEmployee.payments && selectedEmployee.payments.map(p => (
                        <div key={`p-${p.id}`} className="p-3 bg-surface-container rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-primary">
                                {p.payment_method === 'Transferencia' ? 'account_balance' : 'payments'}
                              </span>
                              <span>Pago de Nómina ({p.payment_method})</span>
                            </div>
                            <div className="text-on-surface-variant text-[11px] mt-0.5">
                              {new Date(p.timestamp).toLocaleDateString('es-MX')} • {p.reference_info || p.notes}
                            </div>
                          </div>
                          <div className="font-mono font-bold text-sm text-primary">
                            -${p.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}

                      {selectedEmployee.advances && selectedEmployee.advances.map(a => (
                        <div key={`a-${a.id}`} className="p-3 bg-surface-container rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-on-surface">{a.date}</div>
                            <div className="text-on-surface-variant">{a.reason || 'Adelanto / Vale de Caja'}</div>
                          </div>
                          <div className="font-mono font-bold text-sm text-error">
                            -${a.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Saldo Pendiente por Pagar */}
              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase font-bold text-primary block">Total Neto a Pagar</span>
                </div>
                <div className="font-mono text-2xl font-bold text-primary">
                  ${selectedEmployee.net_pay.toFixed(2)} MXN
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-between gap-3">
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="px-5 py-2.5 bg-surface-variant text-on-surface font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                {selectedEmployee.net_pay > 0 && (
                  <button 
                    onClick={() => {
                      const emp = selectedEmployee;
                      setSelectedEmployee(null);
                      handleOpenPayModal(emp);
                    }}
                    className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Pagar Saldo (${selectedEmployee.net_pay.toFixed(2)})
                  </button>
                )}
                <button 
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  Imprimir Recibo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PAGAR / LIQUIDAR NÓMINA (EFECTIVO O TRANSFERENCIA) */}
      {payEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative border border-outline-variant/20 max-h-[95vh] animate-[scale-in_0.2s_ease-out]">
            {/* Botón cerrar */}
            <button 
              onClick={() => setPayEmployee(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            
            {/* Header del Modal */}
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/10">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase mb-1">
                <span className="material-symbols-outlined text-base">payments</span>
                Liquidar / Pagar Nómina
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {payEmployee.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface leading-tight">{payEmployee.name}</h3>
                  <p className="text-xs text-on-surface-variant font-mono">@{payEmployee.username} • Tarifa: ${payEmployee.hourly_rate.toFixed(2)}/h</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleConfirmPayrollPayment} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Mensajes de Éxito o Error */}
              {paySuccessMsg && (
                <div className="p-4 bg-primary/10 border border-primary/30 text-primary rounded-2xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{paySuccessMsg}</span>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-error/10 border border-error/30 text-error rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Saldo Pendiente y Monto a Pagar */}
              <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Saldo Pendiente por Liquidar</span>
                  <span className="font-mono text-xl font-black text-primary">${payEmployee.net_pay.toFixed(2)} MXN</span>
                </div>
                <div className="w-full sm:w-44">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Monto a Entregar ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-on-surface-variant font-mono font-bold text-sm">$</span>
                    <input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 py-2 pl-7 pr-3 rounded-xl text-sm font-mono font-bold text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* SELECCIÓN DE MÉTODO DE PAGO */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Selecciona Método de Pago
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* OPCIÓN 1: EFECTIVO */}
                  <div 
                    onClick={() => setPayMethod('Efectivo')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      payMethod === 'Efectivo'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-secondary">payments</span>
                        <span className="font-bold text-sm text-on-surface">Efectivo</span>
                      </div>
                      <input 
                        type="radio" 
                        name="payMethod" 
                        checked={payMethod === 'Efectivo'} 
                        onChange={() => setPayMethod('Efectivo')}
                        className="accent-primary"
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Entrega directa del dinero físico de caja al empleado.
                    </p>
                  </div>

                  {/* OPCIÓN 2: TRANSFERENCIA */}
                  {(() => {
                    const hasBankDetails = Boolean(payEmployee.bank_account || payEmployee.transfer_phone);

                    if (!hasBankDetails) {
                      return (
                        <div 
                          className="p-4 rounded-2xl border-2 border-dashed border-outline-variant/40 bg-surface-container/50 opacity-60 flex flex-col justify-between gap-2 cursor-not-allowed select-none"
                          title="Este empleado no tiene registrados datos para transferencias bancarias."
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-xl text-on-surface-variant">account_balance</span>
                              <span className="font-bold text-sm text-on-surface-variant">Transferencia</span>
                            </div>
                            <span className="material-symbols-outlined text-lg text-error">lock</span>
                          </div>
                          <p className="text-[11px] text-error font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">info</span>
                            Sin datos bancarios registrados.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div 
                        onClick={() => setPayMethod('Transferencia')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          payMethod === 'Transferencia'
                            ? 'border-primary bg-primary/5 shadow-xs'
                            : 'border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl text-primary">account_balance</span>
                            <span className="font-bold text-sm text-on-surface">Transferencia</span>
                          </div>
                          <input 
                            type="radio" 
                            name="payMethod" 
                            checked={payMethod === 'Transferencia'} 
                            onChange={() => setPayMethod('Transferencia')}
                            className="accent-primary"
                          />
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          SPEI, Dimo o depósito a su cuenta bancaria.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* TARJETA DE DATOS BANCARIOS (SI SE ELIGE TRANSFERENCIA) */}
              {payMethod === 'Transferencia' && (payEmployee.bank_account || payEmployee.transfer_phone) && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3 animate-slide-up">
                  <div className="flex items-center justify-between border-b border-primary/15 pb-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">credit_card</span>
                      Datos para Realizar la Transferencia
                    </span>
                    {payCopied && (
                      <span className="text-[10px] bg-secondary text-on-secondary px-2 py-0.5 rounded-md font-bold animate-slide-up">
                        ¡Copiado!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {payEmployee.bank_name && (
                      <div>
                        <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Banco:</span>
                        <span className="font-bold text-on-surface text-sm">{payEmployee.bank_name}</span>
                      </div>
                    )}

                    {payEmployee.transfer_phone && (
                      <div>
                        <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Teléfono / Dimo:</span>
                        <span className="font-mono font-bold text-on-surface text-sm">{payEmployee.transfer_phone}</span>
                      </div>
                    )}

                    {payEmployee.bank_account && (
                      <div className="sm:col-span-2 flex items-center justify-between bg-surface p-2.5 rounded-xl border border-outline-variant/30">
                        <div>
                          <span className="text-on-surface-variant block text-[10px] uppercase font-bold">CLABE / Tarjeta:</span>
                          <span className="font-mono font-bold text-primary text-sm tracking-wider">{payEmployee.bank_account}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (payEmployee.bank_account) {
                              navigator.clipboard.writeText(payEmployee.bank_account);
                              setPayCopied(true);
                              setTimeout(() => setPayCopied(false), 2000);
                            }
                          }}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copiar número de cuenta o CLABE"
                        >
                          <span className="material-symbols-outlined text-xs">content_copy</span>
                          Copiar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notas Opcionales */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Notas / Folio de Operación (Opcional)
                </label>
                <input 
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder={payMethod === 'Transferencia' ? 'Ej. Folio SPEI 839201' : 'Ej. Pago liquidado en mostrador'}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 py-2.5 px-4 rounded-xl text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setPayEmployee(null)}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || parseFloat(payAmount) <= 0 || (payMethod === 'Transferencia' && !payEmployee.bank_account && !payEmployee.transfer_phone)}
                  className="px-6 py-2.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {isSubmitting ? 'Procesando...' : `Confirmar Pago ($${(parseFloat(payAmount) || 0).toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
