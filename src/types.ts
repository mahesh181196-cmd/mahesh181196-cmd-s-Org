export interface Staff {
  id: string;
  name: string;
  role: string;
  monthlySalary: number;
  active: boolean;
}

export interface Attendance {
  id: string;
  date: string;
  staffId: string;
  status: 'present' | 'absent' | 'half-day' | 'holiday';
}

export interface Sale {
  id: string;
  date: string;
  salesmanId?: string;
  customerName: string;
  product: string;
  quantity: number;
  amount: number;
  paymentStatus: 'paid' | 'pending';
}

export interface Expense {
  id: string;
  date: string;
  type: 'advance' | 'transport' | 'other';
  amount: number;
  staffId?: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin';
}
