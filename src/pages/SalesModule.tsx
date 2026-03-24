import { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, Staff } from '../types';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Package, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  X,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function SalesModule() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    salesmanId: '',
    customerName: '',
    product: 'Stone',
    quantity: 0,
    amount: 0,
    paymentStatus: 'pending' as 'paid' | 'pending'
  });

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      setLoading(false);
    });

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)).filter(s => s.active));
    });

    return () => {
      unsubSales();
      unsubStaff();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), formData);
        toast.success('Sale updated successfully');
      } else {
        await addDoc(collection(db, 'sales'), formData);
        toast.success('New sale recorded');
      }
      setIsModalOpen(false);
      setEditingSale(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        salesmanId: '',
        customerName: '',
        product: 'Stone',
        quantity: 0,
        amount: 0,
        paymentStatus: 'pending'
      });
    } catch (err) {
      console.error(err);
      alert('Error saving sale');
    }
  };

  const handleEdit = (s: Sale) => {
    setEditingSale(s);
    setFormData({
      date: s.date,
      salesmanId: s.salesmanId || '',
      customerName: s.customerName,
      product: s.product,
      quantity: s.quantity,
      amount: s.amount,
      paymentStatus: s.paymentStatus
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast.error('Are you sure?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteDoc(doc(db, 'sales', id));
            toast.success('Sale record deleted');
          } catch (err) {
            console.error(err);
            toast.error('Error deleting sale');
          }
        }
      }
    });
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || s.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const totalAmount = filteredSales.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sales <span className="gradient-text">Entry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Track your daily stone and tile orders</p>
        </div>
        <button
          onClick={() => {
            setEditingSale(null);
            setFormData({
              date: format(new Date(), 'yyyy-MM-dd'),
              salesmanId: '',
              customerName: '',
              product: 'Stone',
              quantity: 0,
              amount: 0,
              paymentStatus: 'pending'
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 gradient-bg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:opacity-90 transition-all purple-glow"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Sale
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 perspective-1000">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="Search customer or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 glass-card rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
          />
        </div>
        <div className="relative group">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 glass-card rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
          />
        </div>
        <div className="gradient-bg p-4 rounded-xl sm:rounded-2xl flex items-center justify-between text-white shadow-lg purple-glow card-3d sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold opacity-90">Total Amount</span>
          </div>
          <span className="text-xl sm:text-2xl font-black">₹{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Sales List */}
      <div className="glass-card rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Product</th>
                <th className="px-8 py-5">Salesman</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6 text-sm font-bold text-slate-400">
                    {format(parseISO(sale.date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{sale.customerName}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{sale.product}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{sale.quantity} units</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {staff.find(s => s.id === sale.salesmanId)?.name || 'Direct Order'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-base font-black text-slate-900 dark:text-white">₹{sale.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      sale.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {sale.paymentStatus === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleEdit(sale)}
                        className="p-2 text-slate-400 hover:text-purple-500 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(sale.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-white/5">
          {filteredSales.map((sale) => (
            <div key={sale.id} className="p-6 space-y-6 card-3d">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-purple-500 font-bold text-xl purple-glow">
                    {sale.customerName[0]}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{sale.customerName}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{format(parseISO(sale.date), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEdit(sale)}
                    className="p-2 text-slate-400 hover:text-purple-500 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(sale.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-[24px]">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Product</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{sale.product}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{sale.quantity} units</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount</p>
                  <p className="text-base font-black text-slate-900 dark:text-white">₹{sale.amount.toLocaleString()}</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider mt-2",
                    sale.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
                <User className="w-3 h-3 text-purple-500" />
                <span>Salesman: {staff.find(s => s.id === sale.salesmanId)?.name || 'Direct Order'}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredSales.length === 0 && (
          <div className="px-6 py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-500 font-medium">No sales found for the selected filters.</p>
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
              className="relative w-full max-w-2xl glass-card rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden purple-glow max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-white/10 backdrop-blur-xl z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {editingSale ? 'Edit Sale Record' : 'Add New Sale'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Name</label>
                  <input
                    required
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Product</label>
                  <select
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium appearance-none"
                  >
                    <option value="Stone">Stone</option>
                    <option value="Tiles">Tiles</option>
                    <option value="Granite">Granite</option>
                    <option value="Marble">Marble</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Salesman (Optional)</label>
                  <select
                    value={formData.salesmanId}
                    onChange={(e) => setFormData({ ...formData, salesmanId: e.target.value })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium appearance-none"
                  >
                    <option value="">Direct Order (None)</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity</label>
                  <input
                    required
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Total Amount (₹)</label>
                  <input
                    required
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white text-sm sm:text-base font-medium"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Status</label>
                  <div className="flex gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentStatus: 'paid' })}
                      className={cn(
                        "flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold border-2 transition-all text-sm sm:text-base",
                        formData.paymentStatus === 'paid' 
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                          : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                      )}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentStatus: 'pending' })}
                      className={cn(
                        "flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold border-2 transition-all text-sm sm:text-base",
                        formData.paymentStatus === 'pending' 
                          ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                          : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                      )}
                    >
                      Pending
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-4 flex gap-3 sm:gap-4">
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
                    {editingSale ? 'Update Sale' : 'Save Sale'}
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
