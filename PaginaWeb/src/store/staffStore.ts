import { create } from 'zustand';
import { API_BASE_URL } from '../config';

export interface Employee {
  id: string; // The backend uses number, but we can treat as string on frontend
  name: string;
  username: string;
  password?: string; // Optional because we don't always fetch it or show it
  role: 'admin' | 'cashier' | string;
  pin: string;
  hourly_rate?: number;
  bank_name?: string;
  bank_account?: string;
  transfer_phone?: string;
}

interface StaffState {
  employees: Employee[];
  fetchEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<boolean>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  verifyNip: (nip: string, allowedRoles?: string[]) => { success: boolean; employee?: Employee };
}

export const useStaffStore = create<StaffState>((set, get) => ({
  employees: [],
  
  fetchEmployees: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`);
      if (res.ok) {
        const users = await res.json();
        // Convert to Employee format if needed
        set({ employees: users });
      }
    } catch (e) {
      console.error('Error fetching employees:', e);
    }
  },

  addEmployee: async (employee) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });
      if (res.ok) {
        await get().fetchEmployees();
        return true;
      }
    } catch (e) {
      console.error('Error adding employee:', e);
    }
    return false;
  },

  updateEmployee: async (id, updates) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await get().fetchEmployees();
        return true;
      }
    } catch (e) {
      console.error('Error updating employee:', e);
    }
    return false;
  },

  deleteEmployee: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await get().fetchEmployees();
        return true;
      }
    } catch (e) {
      console.error('Error deleting employee:', e);
    }
    return false;
  },

  verifyNip: (nip: string, allowedRoles?: string[]) => {
    const { employees } = get();
    // En la base de datos nueva los roles son 'admin' y 'cashier'
    // Map the old Spanish roles to new English DB roles if needed
    let mappedAllowedRoles = allowedRoles;
    if (allowedRoles) {
      mappedAllowedRoles = allowedRoles.map(r => {
        const lower = r.toLowerCase();
        if (lower === 'administrador') return 'admin';
        if (lower === 'cajero') return 'cashier';
        return lower;
      });
    }

    const employee = employees.find(e => e.pin === nip);

    if (!employee) {
      return { success: false, employee: undefined };
    }

    if (mappedAllowedRoles && mappedAllowedRoles.length > 0) {
      if (!mappedAllowedRoles.includes(employee.role)) {
        return { success: false, employee };
      }
    }

    return { success: true, employee };
  }
}));
