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
  CalendarCheck,
  ShoppingCart
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
            className="glass-card p-5 sm:p-6 rounded-[32px] card-hover-effect group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-purple-600/10 transition-colors" />
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 text-white purple-glow group-hover:scale-110 transition-transform duration-500">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/5 group-hover:border-purple-500/20 transition-colors">
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{stat.value}</h3>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Clock className="w-3 h-3 text-purple-500" />
                  <span className="text-[10px] sm:text-xs text-purple-500 font-bold">{stat.trend}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Sales */}
        <div className="glass-card rounded-[32px] overflow-hidden card-hover-effect">
          <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Recent Sales</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Latest transactions</p>
            </div>
            <Link to="/sales" className="px-4 py-2 glass-card rounded-xl text-xs text-purple-500 font-bold hover:bg-purple-500/10 transition-all">View all</Link>
          </div>
          <div className="divide-y divide-white/5">
            {sales.slice(0, 5).sort((a, b) => b.date.localeCompare(a.date)).map((sale) => (
              <div key={sale.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-purple-500 font-bold text-xl shrink-0 group-hover:scale-110 transition-transform">
                    {sale.customerName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{sale.customerName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-50 truncate">{sale.product} • {sale.quantity} units</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">₹{sale.amount.toLocaleString()}</p>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg mt-1 inline-block",
                    sale.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  )}>
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No sales recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Staff Summary */}
        <div className="glass-card rounded-[32px] overflow-hidden card-hover-effect p-6 sm:p-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Staff Status</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Real-time attendance</p>
            </div>
            <Link to="/staff" className="px-4 py-2 glass-card rounded-xl text-xs text-purple-500 font-bold hover:bg-purple-500/10 transition-all">Manage</Link>
          </div>
          
          <div className="space-y-10">
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-purple-600/10 to-transparent rounded-[28px] border border-purple-500/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-colors" />
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Active Staff</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1 tracking-tighter">{activeStaffCount}</p>
              </div>
              <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center text-white purple-glow relative z-10 group-hover:scale-110 transition-transform duration-500">
                <Users className="w-8 h-8" />
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Attendance Today</p>
                <p className="text-sm font-black text-purple-500 tracking-tight">
                  {Math.round(((presentCount + halfDayCount) / Math.max(activeStaffCount, 1)) * 100)}%
                </p>
              </div>
              <div className="relative h-4 bg-white/5 rounded-full overflow-hidden flex p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(presentCount / Math.max(activeStaffCount, 1)) * 100}%` }}
                  className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(halfDayCount / Math.max(activeStaffCount, 1)) * 100}%` }}
                  className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)] ml-1"
                />
              </div>
              <div className="flex flex-wrap justify-between gap-y-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> {presentCount} Present</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> {halfDayCount} Half Day</span>
                </div>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" /> {activeStaffCount - (presentCount + halfDayCount)} Absent</span>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <div className="flex items-center justify-between text-xs mb-4">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em]">Yearly Sales Target</span>
                <span className="font-black text-slate-900 dark:text-white tracking-tight">₹{totalYear.toLocaleString()} <span className="text-slate-500 font-bold">/ ₹1Cr</span></span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalYear / 10000000) * 100}%` }}
                  className="h-full gradient-bg rounded-full shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
