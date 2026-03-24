import { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Expense, Staff } from '../types';
import { format, parseISO } from 'date-fns';
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Receipt, 
  Truck, 
  Wallet, 
  X,
  Trash2,
  Edit2,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ExpensesModule() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'other' as 'advance' | 'transport' | 'other',
    amount: 0,
    staffId: '',
    description: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      setLoading(false);
    });

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)).filter(s => s.active));
    });

    return () => {
      unsubExpenses();
      unsubStaff();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateDoc(doc(db, 'expenses', editingExpense.id), formData);
        toast.success('Expense record updated');
      } else {
        await addDoc(collection(db, 'expenses'), formData);
        toast.success('New expense recorded');
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'other',
        amount: 0,
        staffId: '',
        description: ''
      });
    } catch (err) {
      console.error(err);
      alert('Error saving expense');
    }
  };

  const handleEdit = (e: Expense) => {
    setEditingExpense(e);
    setFormData({
      date: e.date,
      type: e.type,
      amount: e.amount,
      staffId: e.staffId || '',
      description: e.description
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast.error('Delete this expense?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteDoc(doc(db, 'expenses', id));
            toast.success('Expense record deleted');
          } catch (err) {
            console.error(err);
            toast.error('Error deleting expense');
          }
        }
      }
    });
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Expenses & <span className="gradient-text">Advances</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Track company spending and staff advance payments</p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setFormData({
              date: format(new Date(), 'yyyy-MM-dd'),
              type: 'other',
              amount: 0,
              staffId: '',
              description: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 gradient-bg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:opacity-90 transition-all purple-glow"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 perspective-1000">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by description or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 glass-card rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
          />
        </div>
        <div className="gradient-bg p-4 rounded-xl sm:rounded-2xl flex items-center justify-between text-white shadow-lg purple-glow card-3d">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold opacity-90">Total Expenses</span>
          </div>
          <span className="text-xl sm:text-2xl font-black">₹{totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 perspective-1000">
        {filteredExpenses.map((e) => (
          <motion.div
            layout
            key={e.id}
            className="glass-card p-6 rounded-[32px] card-3d group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-purple-600/10 transition-colors" />
            <div className="flex items-start justify-between mb-6">
              <div className={cn(
                "p-4 rounded-2xl text-white shadow-xl purple-glow",
                e.type === 'advance' ? "bg-amber-500" :
                e.type === 'transport' ? "bg-blue-500" :
                "gradient-bg"
              )}>
                {e.type === 'advance' ? <Wallet className="w-6 h-6" /> :
                 e.type === 'transport' ? <Truck className="w-6 h-6" /> :
                 <Receipt className="w-6 h-6" />}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <button 
                  onClick={() => handleEdit(e)}
                  className="p-2 text-slate-400 hover:text-purple-500 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(e.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{e.type}</h3>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">₹{e.amount.toLocaleString()}</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium opacity-70">{e.description}</p>
              </div>

              <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <Calendar className="w-3 h-3 text-purple-500" />
                  {format(parseISO(e.date), 'dd MMM yyyy')}
                </div>
                {e.staffId && (
                  <div className="flex items-center gap-2 text-[10px] text-purple-500 font-bold uppercase tracking-widest bg-purple-500/10 px-3 py-1.5 rounded-lg">
                    <User className="w-3 h-3" />
                    {staff.find(s => s.id === e.staffId)?.name}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {filteredExpenses.length === 0 && (
          <div className="lg:col-span-2 py-20 text-center glass-card rounded-[32px] border-dashed border-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-500 font-medium">No expense records found.</p>
          </div>
        )}
      </div>

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
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                    <input
                      required
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Expense Type</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {['advance', 'transport', 'other'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type as any })}
                        className={cn(
                          "py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold border-2 transition-all capitalize text-[10px] sm:text-xs tracking-widest",
                          formData.type === type 
                            ? "bg-purple-500/10 border-purple-500 text-purple-500" 
                            : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.type === 'advance' && (
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Select Staff</label>
                    <select
                      required
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium appearance-none"
                    >
                      <option value="">Choose Staff Member</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none dark:text-white text-sm sm:text-base font-medium"
                    placeholder="e.g. Advance for personal emergency, Fuel for transport..."
                  />
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
                    {editingExpense ? 'Update Expense' : 'Save Expense'}
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
