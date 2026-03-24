import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Staff, Attendance } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subMonths, addMonths } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Check, X, UserCheck, UserX, Loader2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function AttendanceModule() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)).filter(s => s.active));
    });

    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
      setLoading(false);
    });

    return () => {
      unsubStaff();
      unsubAttendance();
    };
  }, []);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayAttendance = attendance.filter(a => a.date === dateStr);

  const handleSetAttendance = async (staffId: string, newStatus: 'present' | 'absent' | 'half-day' | 'holiday') => {
    setSaving(staffId);
    try {
      const existing = todayAttendance.find(a => a.staffId === staffId);
      
      if (existing) {
        if (existing.status === newStatus) {
          // If clicking the same status, we could either do nothing or remove it.
          // Let's keep it as is for now, or maybe allow deselecting?
          // For now, just update.
          await updateDoc(doc(db, 'attendance', existing.id), { status: newStatus });
        } else {
          await updateDoc(doc(db, 'attendance', existing.id), { status: newStatus });
        }
      } else {
        await addDoc(collection(db, 'attendance'), {
          date: dateStr,
          staffId,
          status: newStatus
        });
      }
      toast.success(`Attendance marked as ${newStatus} for ${staff.find(s => s.id === staffId)?.name}`);
    } catch (err) {
      console.error(err);
      toast.error('Error updating attendance');
    } finally {
      setSaving(null);
    }
  };

  const getStatus = (staffId: string) => {
    return todayAttendance.find(a => a.staffId === staffId)?.status;
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Staff <span className="gradient-text">Attendance</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Mark daily presence, half-days, or holidays</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 glass-card p-1.5 sm:p-2 rounded-2xl w-full sm:w-auto">
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-2 px-2 sm:px-4 py-1 font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            <Calendar className="w-4 h-4 text-purple-500" />
            {format(selectedDate, 'EEE, dd MMM yyyy')}
          </div>
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="glass-card p-3 sm:p-6 rounded-[24px] card-3d flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Present</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{todayAttendance.filter(a => a.status === 'present').length}</p>
          </div>
        </div>
        <div className="glass-card p-3 sm:p-6 rounded-[24px] card-3d flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Half Day</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{todayAttendance.filter(a => a.status === 'half-day').length}</p>
          </div>
        </div>
        <div className="glass-card p-3 sm:p-6 rounded-[24px] card-3d flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
            <UserX className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Absent</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{todayAttendance.filter(a => a.status === 'absent').length}</p>
          </div>
        </div>
        <div className="glass-card p-3 sm:p-6 rounded-[24px] card-3d flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Holiday</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{todayAttendance.filter(a => a.status === 'holiday').length}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[24px] sm:rounded-[32px] overflow-hidden card-3d">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Staff Roster</h3>
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">{staff.length} Total Staff</span>
        </div>
        <div className="divide-y divide-white/5">
          {staff.map((s) => {
            const status = getStatus(s.id);
            const isSaving = saving === s.id;
            
            return (
              <div key={s.id} className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 glass-card rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-500 font-bold text-lg sm:text-xl shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium opacity-60 truncate">{s.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                  {[
                    { id: 'present', label: 'Present', icon: Check, color: 'emerald' },
                    { id: 'half-day', label: 'Half Day', icon: Clock, color: 'amber' },
                    { id: 'absent', label: 'Absent', icon: X, color: 'rose' },
                    { id: 'holiday', label: 'Holiday', icon: Calendar, color: 'purple' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      disabled={isSaving}
                      onClick={() => handleSetAttendance(s.id, opt.id as any)}
                      className={cn(
                        "flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-300 border",
                        status === opt.id 
                          ? `bg-${opt.color}-500/10 text-${opt.color}-500 border-${opt.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.1)]`
                          : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-400"
                      )}
                    >
                      {isSaving && status === opt.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <opt.icon className="w-3 h-3" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {staff.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
              No staff members found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
