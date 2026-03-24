import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, Attendance, Staff } from '../types';
import { format, startOfDay, startOfMonth, startOfYear, isSameDay, parseISO } from 'date-fns';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Package,
  ArrowUpRight,
  Clock,
  CalendarCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });
    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
    });
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
      setLoading(false);
    });

    return () => {
      unsubSales();
      unsubAttendance();
      unsubStaff();
    };
  }, []);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const todaySales = sales.filter(s => s.date === todayStr);
  const monthSales = sales.filter(s => s.date.startsWith(format(today, 'yyyy-MM')));
  const yearSales = sales.filter(s => s.date.startsWith(format(today, 'yyyy')));

  const totalToday = todaySales.reduce((sum, s) => sum + s.amount, 0);
  const totalMonth = monthSales.reduce((sum, s) => sum + s.amount, 0);
  const totalYear = yearSales.reduce((sum, s) => sum + s.amount, 0);

  const pendingPayments = sales.filter(s => s.paymentStatus === 'pending');
  const totalPending = pendingPayments.reduce((sum, s) => sum + s.amount, 0);

  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const halfDayCount = todayAttendance.filter(a => a.status === 'half-day').length;
  const activeStaffCount = staff.filter(s => s.active).length;

  const stats = [
    { 
      label: "Today's Sales", 
      value: `₹${totalToday.toLocaleString()}`, 
      icon: TrendingUp, 
      color: "bg-emerald-500",
      trend: `${todaySales.length} orders`
    },
    { 
      label: "Monthly Sales", 
      value: `₹${totalMonth.toLocaleString()}`, 
      icon: Package, 
      color: "bg-blue-500",
      trend: `${monthSales.length} orders`
    },
    { 
      label: "Pending Payments", 
      value: `₹${totalPending.toLocaleString()}`, 
      icon: CreditCard, 
      color: "bg-amber-500",
      trend: `${pendingPayments.length} pending`
    },
    { 
      label: "Staff Attendance", 
      value: `${presentCount + halfDayCount}/${activeStaffCount}`, 
      icon: Users, 
      color: "bg-indigo-500",
      trend: `${presentCount}P, ${halfDayCount}H today`
    },
  ];

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
            Business <span className="gradient-text">Overview</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time performance metrics</p>
        </div>
        <div className="flex items-center gap-2 glass-card px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl w-fit">
          <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {format(new Date(), 'MMMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 perspective-1000">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] card-3d group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-purple-600/10 transition-colors" />
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-white purple-glow", stat.color.replace('indigo', 'purple').replace('emerald', 'purple').replace('amber', 'purple').replace('blue', 'purple'))}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="p-1.5 sm:p-2 bg-white/5 rounded-lg sm:rounded-xl">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
              </div>
            </div>
            <div>
              <p className="text-[10px] sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1 font-bold">
                <Clock className="w-3 h-3" />
                {stat.trend}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Sales */}
        <div className="glass-card rounded-[24px] sm:rounded-[32px] overflow-hidden card-3d">
          <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Recent Sales</h3>
            <Link to="/sales" className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-bold hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-white/5">
            {sales.slice(0, 5).sort((a, b) => b.date.localeCompare(a.date)).map((sale) => (
              <div key={sale.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 glass-card rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-500 font-bold text-lg sm:text-xl shrink-0">
                    {sale.customerName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{sale.customerName}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium opacity-60 truncate">{sale.product} • {sale.quantity} units</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">₹{sale.amount.toLocaleString()}</p>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:py-1 rounded-lg",
                    sale.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                No sales recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Staff Summary */}
        <div className="glass-card rounded-[24px] sm:rounded-[32px] overflow-hidden card-3d p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Staff Status</h3>
            <Link to="/staff" className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-bold hover:underline">Manage</Link>
          </div>
          
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between p-4 sm:p-6 bg-white/5 rounded-[20px] sm:rounded-[24px]">
              <div>
                <p className="text-[10px] sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Staff</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{activeStaffCount}</p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-bg rounded-xl sm:rounded-2xl flex items-center justify-center text-white purple-glow">
                <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Attendance Today</p>
                <p className="text-xs sm:text-sm font-bold text-white">
                  {Math.round(((presentCount + halfDayCount) / Math.max(activeStaffCount, 1)) * 100)}%
                </p>
              </div>
              <div className="relative h-3 sm:h-4 bg-white/5 rounded-full overflow-hidden flex">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(presentCount / Math.max(activeStaffCount, 1)) * 100}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(halfDayCount / Math.max(activeStaffCount, 1)) * 100}%` }}
                  className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                />
              </div>
              <div className="flex flex-wrap justify-between gap-y-2 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <div className="flex gap-3 sm:gap-4">
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" /> {presentCount} Present</span>
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" /> {halfDayCount} Half Day</span>
                </div>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" /> {activeStaffCount - (presentCount + halfDayCount)} Absent</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Yearly Sales Target</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{totalYear.toLocaleString()} / ₹1Cr</span>
              </div>
              <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalYear / 10000000) * 100}%` }}
                  className="h-full gradient-bg purple-glow"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
