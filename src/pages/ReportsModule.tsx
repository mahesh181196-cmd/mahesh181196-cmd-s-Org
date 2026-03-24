import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, Staff, Attendance, Expense } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDaysInMonth } from 'date-fns';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  FileText,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function ReportsModule() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
    });
    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
    });
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      setLoading(false);
    });

    return () => {
      unsubSales();
      unsubStaff();
      unsubAttendance();
      unsubExpenses();
    };
  }, []);

  const monthSales = sales.filter(s => s.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
  const monthAttendance = attendance.filter(a => a.date.startsWith(selectedMonth));

  const totalSales = monthSales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingPayments = monthSales.filter(s => s.paymentStatus === 'pending').reduce((sum, s) => sum + s.amount, 0);

  // Salesman Performance
  const salesmanPerformance = staff.map(s => {
    const sSales = monthSales.filter(sale => sale.salesmanId === s.id);
    const total = sSales.reduce((sum, sale) => sum + sale.amount, 0);
    return { name: s.name, total, count: sSales.length };
  }).filter(p => p.total > 0).sort((a, b) => b.total - a.total);

  // Salary Report
  const salaryReport = staff.filter(s => s.active).map(s => {
    const daysInMonth = getDaysInMonth(parseISO(`${selectedMonth}-01`));
    const presentDays = monthAttendance.filter(a => a.staffId === s.id && a.status === 'present').length;
    const halfDays = monthAttendance.filter(a => a.staffId === s.id && a.status === 'half-day').length;
    const effectiveDays = presentDays + (halfDays * 0.5);
    
    const advances = monthExpenses.filter(e => e.type === 'advance' && e.staffId === s.id).reduce((sum, e) => sum + e.amount, 0);
    
    const baseSalary = (s.monthlySalary / daysInMonth) * effectiveDays;
    const finalSalary = baseSalary - advances;

    return {
      name: s.name,
      monthlySalary: s.monthlySalary,
      presentDays,
      halfDays,
      daysInMonth,
      advances,
      finalSalary: Math.max(0, finalSalary)
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Business <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Analyze your monthly performance and payroll</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative group flex-1 sm:flex-none">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto pl-4 pr-10 py-2.5 sm:py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-bold text-sm sm:text-base text-slate-900 dark:text-white appearance-none"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
          </div>
          <button className="p-2.5 sm:p-3 glass-card text-purple-500 rounded-xl hover:bg-white/5 transition-all purple-glow shrink-0">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 perspective-1000">
        <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] card-3d relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors" />
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Monthly Revenue</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">₹{totalSales.toLocaleString()}</h3>
          <div className="mt-4 sm:mt-6 flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg w-fit uppercase tracking-wider">
            <TrendingUp className="w-3 h-3" />
            {monthSales.length} Orders
          </div>
        </div>
        <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] card-3d relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/10 transition-colors" />
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pending Payments</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">₹{pendingPayments.toLocaleString()}</h3>
          <div className="mt-4 sm:mt-6 flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1.5 rounded-lg w-fit uppercase tracking-wider">
            <CreditCard className="w-3 h-3" />
            {monthSales.filter(s => s.paymentStatus === 'pending').length} Customers
          </div>
        </div>
        <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] card-3d relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-blue-500/10 transition-colors" />
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Expenses</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">₹{totalExpenses.toLocaleString()}</h3>
          <div className="mt-4 sm:mt-6 flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1.5 rounded-lg w-fit uppercase tracking-wider">
            <Wallet className="w-3 h-3" />
            {monthExpenses.length} Records
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 perspective-1000">
        {/* Salesman Performance */}
        <div className="glass-card rounded-[24px] sm:rounded-[32px] card-3d overflow-hidden">
          <div className="p-5 sm:p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 gradient-bg text-white rounded-xl sm:rounded-2xl shadow-lg purple-glow">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Salesman Performance</h3>
            </div>
          </div>
          <div className="p-5 sm:p-8 space-y-6 sm:space-y-8">
            {salesmanPerformance.map((p, i) => (
              <div key={p.name} className="space-y-3">
                <div className="flex justify-between text-sm items-end gap-2">
                  <div className="space-y-1 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{p.name}</span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{p.count} sales completed</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-purple-500 shrink-0">₹{p.total.toLocaleString()}</span>
                </div>
                <div className="h-2.5 sm:h-3 bg-white/5 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.total / totalSales) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full gradient-bg rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)]"
                  />
                </div>
              </div>
            ))}
            {salesmanPerformance.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-medium">
                No salesman sales recorded this month.
              </div>
            )}
          </div>
        </div>

        {/* Salary Report */}
        <div className="glass-card rounded-[24px] sm:rounded-[32px] card-3d overflow-hidden">
          <div className="p-5 sm:p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-emerald-500 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-500/20">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Staff Salary Summary</h3>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {salaryReport.map((s) => (
              <div key={s.name} className="p-5 sm:p-6 hover:bg-white/5 transition-colors group">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors truncate">{s.name}</p>
                  <p className="text-lg sm:text-xl font-black text-purple-500 shrink-0">₹{Math.round(s.finalSalary).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  <div className="space-y-1">
                    <p className="opacity-50">Attendance</p>
                    <p className="text-slate-900 dark:text-slate-300">{s.presentDays}P, {s.halfDays}H</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-50">Base Salary</p>
                    <p className="text-slate-900 dark:text-slate-300">₹{s.monthlySalary.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-50">Advances</p>
                    <p className="text-red-500">-₹{s.advances.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-50">Days/Mo</p>
                    <p className="text-slate-900 dark:text-slate-300">{s.daysInMonth}</p>
                  </div>
                </div>
              </div>
            ))}
            {salaryReport.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-medium">
                No active staff members.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Payments Detail */}
      <div className="glass-card rounded-[24px] sm:rounded-[32px] card-3d overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-amber-500 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-amber-500/20">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Pending Payments List</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px] sm:min-w-full">
            <thead>
              <tr className="bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                <th className="px-5 sm:px-8 py-4 sm:py-5">Date</th>
                <th className="px-5 sm:px-8 py-4 sm:py-5">Customer</th>
                <th className="px-5 sm:px-8 py-4 sm:py-5">Product</th>
                <th className="px-5 sm:px-8 py-4 sm:py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthSales.filter(s => s.paymentStatus === 'pending').map((sale) => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-sm text-slate-500 font-medium">{format(parseISO(sale.date), 'dd MMM')}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">{sale.customerName}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-sm text-slate-500 font-medium">{sale.product}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-black text-slate-900 dark:text-white text-right">₹{sale.amount.toLocaleString()}</td>
                </tr>
              ))}
              {monthSales.filter(s => s.paymentStatus === 'pending').length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-medium">
                    No pending payments for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
