import { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Staff, Attendance, Expense } from '../types';
import { Plus, Edit2, Trash2, UserPlus, X, Check, Search, Eye, Calendar, Wallet, ReceiptIndianRupee, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    monthlySalary: 0,
    active: true
  });

  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
      setLoading(false);
    });
    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
    });
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    return () => {
      unsubStaff();
      unsubAttendance();
      unsubExpenses();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'staff', editingStaff.id), formData);
        toast.success('Staff details updated');
      } else {
        await addDoc(collection(db, 'staff'), formData);
        toast.success('New staff member added');
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      setFormData({ name: '', role: '', monthlySalary: 0, active: true });
    } catch (err) {
      console.error(err);
      alert('Error saving staff member');
    }
  };

  const handleEdit = (s: Staff) => {
    setEditingStaff(s);
    setFormData({
      name: s.name,
      role: s.role,
      monthlySalary: s.monthlySalary,
      active: s.active
    });
    setIsModalOpen(true);
  };

  const handleViewProfile = (s: Staff) => {
    setSelectedStaff(s);
    setIsProfileOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast.error('Are you sure?', {
      description: 'This will permanently remove the staff record.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteDoc(doc(db, 'staff', id));
            toast.success('Staff member removed');
          } catch (err) {
            console.error(err);
            toast.error('Error deleting staff member');
          }
        }
      }
    });
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Profile calculations
  const getStaffStats = (staffId: string) => {
    const staffAttendance = attendance.filter(a => a.staffId === staffId);
    const staffAdvances = expenses.filter(e => e.staffId === staffId && e.type === 'advance');
    
    const currentMonth = format(new Date(), 'yyyy-MM');
    const monthAttendance = staffAttendance.filter(a => a.date.startsWith(currentMonth));
    const monthAdvances = staffAdvances.filter(e => e.date.startsWith(currentMonth));

    const present = monthAttendance.filter(a => a.status === 'present').length;
    const halfDay = monthAttendance.filter(a => a.status === 'half-day').length;
    const absent = monthAttendance.filter(a => a.status === 'absent').length;
    const totalAdvances = monthAdvances.reduce((sum, e) => sum + e.amount, 0);

    return { present, halfDay, absent, totalAdvances, monthAdvances, monthAttendance };
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Staff <span className="gradient-text">Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your team and their compensation</p>
        </div>
        <button
          onClick={() => {
            setEditingStaff(null);
            setFormData({ name: '', role: '', monthlySalary: 0, active: true });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 gradient-bg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:opacity-90 transition-all purple-glow"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Staff
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
        <input
          type="text"
          placeholder="Search staff by name or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 glass-card rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
        {filteredStaff.map((s) => (
          <motion.div
            layout
            key={s.id}
            className="glass-card p-6 rounded-[32px] card-hover-effect group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-purple-600/10 transition-colors" />
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center text-white font-black text-2xl purple-glow group-hover:scale-110 transition-transform duration-500">
                {s.name[0]}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={() => handleViewProfile(s)}
                  className="p-2.5 glass-card text-slate-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(s)}
                  className="p-2.5 glass-card text-slate-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2.5 glass-card text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{s.name}</h3>
                <button 
                  onClick={() => handleViewProfile(s)}
                  className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                >
                  View Profile
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-50">{s.role}</p>
              <div className="mt-6 flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group-hover:border-purple-500/10 transition-colors">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Monthly Salary</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">₹{s.monthlySalary.toLocaleString()}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                  s.active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-slate-500 border-white/10"
                )}>
                  {s.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Staff Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && selectedStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-card rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden purple-glow max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-white/10 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 glass-card rounded-2xl flex items-center justify-center text-purple-500 font-bold text-xl sm:text-2xl purple-glow">
                    {selectedStaff.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedStaff.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedStaff.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* Monthly Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(() => {
                    const stats = getStaffStats(selectedStaff.id);
                    return (
                      <>
                        <div className="glass-card p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Present</p>
                          <p className="text-xl font-bold text-emerald-500">{stats.present}</p>
                        </div>
                        <div className="glass-card p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Half Day</p>
                          <p className="text-xl font-bold text-amber-500">{stats.halfDay}</p>
                        </div>
                        <div className="glass-card p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Leaves (Absent)</p>
                          <p className="text-xl font-bold text-rose-500">{stats.absent}</p>
                        </div>
                        <div className="glass-card p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Advances</p>
                          <p className="text-xl font-bold text-purple-500">₹{stats.totalAdvances.toLocaleString()}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Salary Calculation */}
                <div className="glass-card p-6 rounded-3xl bg-purple-500/5 border-purple-500/10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-500" />
                    Estimated Salary (Current Month)
                  </h4>
                  {(() => {
                    const stats = getStaffStats(selectedStaff.id);
                    const perDaySalary = selectedStaff.monthlySalary / 30;
                    const halfDayDeduction = stats.halfDay * (perDaySalary / 2);
                    const absentDeduction = stats.absent * perDaySalary;
                    const estimatedSalary = selectedStaff.monthlySalary - halfDayDeduction - absentDeduction - stats.totalAdvances;

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Base Salary</span>
                          <span className="font-bold text-slate-900 dark:text-white">₹{selectedStaff.monthlySalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Half Day Deductions ({stats.halfDay})</span>
                          <span className="font-bold text-amber-500">- ₹{Math.round(halfDayDeduction).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Leave Deductions ({stats.absent})</span>
                          <span className="font-bold text-rose-500">- ₹{Math.round(absentDeduction).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total Advances</span>
                          <span className="font-bold text-purple-500">- ₹{stats.totalAdvances.toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                          <span className="text-base font-bold text-slate-900 dark:text-white">Net Payable</span>
                          <span className="text-xl font-black gradient-text">₹{Math.max(0, Math.round(estimatedSalary)).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Recent Advances */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-500" />
                    Recent Advances
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      const stats = getStaffStats(selectedStaff.id);
                      return stats.monthAdvances.length > 0 ? (
                        stats.monthAdvances.map(e => (
                          <div key={e.id} className="flex items-center justify-between p-4 glass-card rounded-2xl">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{e.description}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{format(parseISO(e.date), 'MMMM d, yyyy')}</p>
                            </div>
                            <p className="text-sm font-bold text-purple-500">₹{e.amount.toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-4">No advances recorded this month.</p>
                      );
                    })()}
                  </div>
                </div>

                {/* Recent Attendance */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Attendance History (Current Month)
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {(() => {
                      const stats = getStaffStats(selectedStaff.id);
                      const monthStart = startOfMonth(new Date());
                      const monthEnd = endOfMonth(new Date());
                      const days = [];
                      for (let d = 1; d <= monthEnd.getDate(); d++) {
                        const dateStr = format(new Date(new Date().getFullYear(), new Date().getMonth(), d), 'yyyy-MM-dd');
                        const att = stats.monthAttendance.find(a => a.date === dateStr);
                        days.push({ date: d, status: att?.status });
                      }
                      return days.map(d => (
                        <div 
                          key={d.date} 
                          className={cn(
                            "aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-bold border",
                            d.status === 'present' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                            d.status === 'absent' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                            d.status === 'half-day' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                            d.status === 'holiday' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                            "bg-white/5 border-white/5 text-slate-500"
                          )}
                        >
                          {d.date}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-card rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden purple-glow max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-white/10 backdrop-blur-xl z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Role / Designation</label>
                  <input
                    required
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
                    placeholder="e.g. Salesman, Manager, Helper"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Salary (₹)</label>
                  <input
                    required
                    type="number"
                    value={formData.monthlySalary || ''}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl sm:rounded-2xl">
                  <span className="text-xs sm:text-sm font-bold text-slate-300">Currently Active</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={cn(
                      "w-12 sm:w-14 h-6 sm:h-7 rounded-full transition-all relative",
                      formData.active ? "gradient-bg" : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transition-transform shadow-sm",
                      formData.active ? "translate-x-6 sm:translate-x-7" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <div className="pt-4 flex gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 glass-card text-slate-400 rounded-xl sm:rounded-2xl font-bold hover:bg-white/5 transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 gradient-bg text-white rounded-xl sm:rounded-2xl font-bold hover:opacity-90 transition-all purple-glow text-sm sm:text-base"
                  >
                    {editingStaff ? 'Update Staff' : 'Save Staff'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
