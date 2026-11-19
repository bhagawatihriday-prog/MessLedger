import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Shield,
  Building2,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  Info,
  Search,
  Check,
  Clock,
  Calendar,
  X,
  Tag,
  Plus,
  RotateCcw,
  FileText,
  Edit3,
  UserX,
  Trash2,
  Receipt,
  Bell,
  Users,
  UserCheck,
  DoorClosed,
} from 'lucide-react';
import { useAuth, useToast } from '../context';
import { PageContainer } from '../components/PageContainer';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/formatCurrency';
import { MOCK_ADMIN_STUDENTS } from '../services/mockData';
import { userService } from '../services/userService';
import { billService } from '../services/billService';
import { rebateService } from '../services/rebateService';
import api, { isMockMode } from '../services/api';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState(isMockMode ? MOCK_ADMIN_STUDENTS : []);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'FULLY_PAID' | 'PARTIALLY_PAID' | 'UNPAID'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deletingAccountStudent, setDeletingAccountStudent] = useState(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Generate Bills Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  // Student Room Reallocation State (Admin Only)
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [newRoomValue, setNewRoomValue] = useState('');
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  // Default month calculation (e.g. current month and code)
  const today = useMemo(() => new Date(), []);
  const defaultMonthName = useMemo(() => today.toLocaleString('default', { month: 'long', year: 'numeric' }), [today]);
  const defaultMonthCode = useMemo(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`, [today]);
  const defaultDeadline = useMemo(() => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], []);

  const [generateForm, setGenerateForm] = useState({
    month: defaultMonthName,
    monthCode: defaultMonthCode,
    baseBill: 2450,
    paymentDeadline: defaultDeadline,
    billingCycle: `${defaultMonthName} Regular Mess Cycle`,
    target: 'ALL', // 'ALL' | 'SINGLE'
    targetUserId: '',
  });

  // Restrict bill generation for upcoming / future months
  const isUpcomingMonth = useMemo(() => {
    if (!generateForm.monthCode) return false;
    const clean = String(generateForm.monthCode).trim();
    const [yStr, mStr] = clean.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    if (!isNaN(y) && !isNaN(m)) {
      if (y > curYear) return true;
      if (y === curYear && m > curMonth) return true;
      return false;
    }
    return clean > defaultMonthCode;
  }, [generateForm.monthCode, today, defaultMonthCode]);

  const handleMonthCodeChange = (newCode) => {
    const clean = (newCode || '').trim();
    let monthName = generateForm.month;
    if (clean) {
      const [y, m] = clean.split('-').map(Number);
      if (y && m >= 1 && m <= 12) {
        const d = new Date(y, m - 1, 1);
        monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
    }
    setGenerateForm((prev) => ({
      ...prev,
      monthCode: clean,
      month: monthName,
      billingCycle: `${monthName} Regular Mess Cycle`,
    }));
  };

  // Reusable loader for real bills & registered boarders from PostgreSQL
  const fetchRealBills = useCallback(async () => {
    if (isMockMode) return;
    try {
      const [billsRes, studentsRes, rebatesRes] = await Promise.all([
        billService.getBills().catch(() => []),
        userService.getStudents().catch(() => []),
        rebateService.getRebates().catch(() => []),
      ]);

      if (Array.isArray(studentsRes)) {
        setRegisteredStudents(studentsRes);
        // Pre-select first student for single target if empty
        if (studentsRes.length > 0) {
          setGenerateForm((prev) => ({
            ...prev,
            targetUserId: prev.targetUserId || studentsRes[0].id,
          }));
        }
      }

      // Group rebates by user ID
      const rebateMap = new Map();
      if (Array.isArray(rebatesRes)) {
        for (const rb of rebatesRes) {
          const key = rb.userId || rb.studentId;
          if (key) rebateMap.set(key, rb);
        }
      }

      // Group bills by unique student so each student has exactly ONE entry in the roster
      const studentMap = new Map();

      // 1. Initialize registered students for this hostel
      if (Array.isArray(studentsRes)) {
        for (const st of studentsRes) {
          studentMap.set(st.id, {
            id: st.id,
            userId: st.id,
            name: st.name || 'Resident Student',
            rollNo: st.roll_no || st.rollNo || 'N/A',
            room: st.room || '—',
            email: st.email || '',
            hostel: st.hostel || user?.hostel || '',
            totalBill: 0,
            paidAmount: 0,
            dueAmount: 0,
            lateFine: 0,
            status: 'FULLY_PAID',
            bills: [],
          });
        }
      }

      // 2. Attach bills to matching student or create entry if missing from registered list
      if (Array.isArray(billsRes)) {
        const studentBills = billsRes.filter(
          (b) => b.userId !== user?.id && (b.role || 'STUDENT') === 'STUDENT'
        );

        for (const b of studentBills) {
          let s = studentMap.get(b.userId);
          if (!s) {
            s = {
              id: b.userId,
              userId: b.userId,
              name: b.name || 'Resident Student',
              rollNo: b.rollNo || 'N/A',
              room: b.room || '—',
              email: b.email || '',
              hostel: b.hostel || user?.hostel || '',
              totalBill: 0,
              paidAmount: 0,
              dueAmount: 0,
              lateFine: 0,
              status: 'FULLY_PAID',
              bills: [],
            };
            studentMap.set(b.userId, s);
          }
          s.bills.push(b);
        }
      }

      // 3. Compute consolidated financials for each unique student, factoring in active rebates
      const aggregatedStudents = Array.from(studentMap.values()).map((st) => {
        // Sort bills newest first
        st.bills.sort((a, b) => new Date(b.createdAt || b.paymentDeadline) - new Date(a.createdAt || a.paymentDeadline));

        const baseBilledSum = st.bills.reduce((sum, b) => sum + (parseFloat(b.baseBill) || 0), 0);
        const totalLateFine = st.bills.reduce((sum, b) => sum + (parseFloat(b.lateFine) || 0), 0);
        const totalPaid = st.bills.reduce((sum, b) => sum + (parseFloat(b.paidAmount) || 0), 0);
        const originalTotalBill = baseBilledSum + totalLateFine;

        // Retrieve active diet rebate if granted
        const activeRebate = rebateMap.get(st.id) || rebateMap.get(st.userId);
        const rebateAmt = activeRebate ? parseFloat(activeRebate.amount || 0) : 0;
        const rebateDays = activeRebate ? parseInt(activeRebate.days || 0, 10) : 0;
        const dailyRate = activeRebate ? parseFloat(activeRebate.dailyRate || 115) : 115;

        const totalBilled = Math.max(0, originalTotalBill - rebateAmt);
        const totalDue = Math.max(0, totalBilled - totalPaid);

        let status = 'FULLY_PAID';
        if (st.bills.length === 0) {
          status = 'FULLY_PAID';
        } else if (totalDue === 0) {
          status = 'FULLY_PAID';
        } else if (totalPaid > 0) {
          status = 'PARTIALLY_PAID';
        } else {
          status = 'UNPAID';
        }

        const latestBill = st.bills[0] || {};

        return {
          ...st,
          originalTotalBill: originalTotalBill,
          totalBill: totalBilled,
          paidAmount: totalPaid,
          dueAmount: totalDue,
          lateFine: totalLateFine,
          status,
          breakdown: {
            baseMessCharge: baseBilledSum,
            specialFeastsCharge: 0,
            dietRebate: rebateAmt > 0 ? -rebateAmt : 0,
            dietRebateDays: rebateDays,
            dailyRate: dailyRate,
            subtotalCurrentMonth: Math.max(0, baseBilledSum - rebateAmt),
            rebateApplicationRef: activeRebate?.appRef || null,
            rebateCategory: activeRebate?.reasonCategory || null,
            rebateFromDate: activeRebate?.fromDate || null,
            rebateToDate: activeRebate?.toDate || null,
            rebateRemarks: activeRebate?.remarks || null,
            previousDue: 0,
            lateFine: totalLateFine,
            billingCycle: latestBill.billingCycle || `${st.bills.length} Bill Cycles`,
            mealCounts: latestBill.mealCounts,
          },
        };
      });

      setStudents(aggregatedStudents);
      setSelectedStudent((prev) => (prev ? (aggregatedStudents.find((s) => s.id === prev.id) || prev) : null));
    } catch (e) {
      console.warn('Failed to load real bills for admin dashboard:', e.message);
    }
  }, [user?.id, user?.hostel]);

  useEffect(() => {
    fetchRealBills();
  }, [fetchRealBills]);

  // Manual Rebate Modal State
  const [rebateStudent, setRebateStudent] = useState(null);
  const [isSavingRebate, setIsSavingRebate] = useState(false);
  const [rebateForm, setRebateForm] = useState({
    calcMode: 'DAYS', // 'DAYS' | 'CUSTOM'
    days: 3,
    customAmount: '',
    appRef: '',
    reasonCategory: 'VACATION',
    fromDate: '',
    toDate: '',
    remarks: '',
  });

  // Dynamic Metrics Calculation
  const metrics = useMemo(() => {
    const totalBilled = students.reduce((acc, s) => acc + (parseFloat(s.totalBill) || 0), 0);
    const totalCollected = students.reduce((acc, s) => acc + (parseFloat(s.paidAmount) || 0), 0);
    const totalOutstanding = students.reduce((acc, s) => acc + (parseFloat(s.dueAmount) || 0), 0);
    const totalLateFines = students.reduce((acc, s) => acc + (parseFloat(s.lateFine) || 0), 0);
    const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : 0;
    const unpaidCount = students.filter((s) => s.status === 'UNPAID' || s.status === 'PARTIALLY_PAID').length;

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalLateFines,
      collectionRate,
      unpaidCount,
    };
  }, [students]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      ALL: students.length,
      FULLY_PAID: students.filter((s) => s.status === 'FULLY_PAID').length,
      PARTIALLY_PAID: students.filter((s) => s.status === 'PARTIALLY_PAID').length,
      UNPAID: students.filter((s) => s.status === 'UNPAID').length,
    };
  }, [students]);

  // Filtered & Searched student roster
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Status Filter
      if (filterStatus !== 'ALL' && st.status !== filterStatus) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = st.name.toLowerCase().includes(query);
        const rollMatch = st.rollNo.toLowerCase().includes(query);
        const roomMatch = st.room.toLowerCase().includes(query);
        return nameMatch || rollMatch || roomMatch;
      }
      return true;
    });
  }, [students, filterStatus, searchQuery]);

  // Open Rebate Modal for a specific student
  const handleOpenRebateModal = (student) => {
    const b = student.breakdown || {};
    const existingRebate = Math.abs(b.dietRebate || 0);
    const dailyRate = b.dailyRate || 115;
    const existingDays = b.dietRebateDays || (existingRebate > 0 ? Math.round(existingRebate / dailyRate) : 3);

    setRebateForm({
      calcMode: existingDays > 0 ? 'DAYS' : 'CUSTOM',
      days: existingDays || 3,
      customAmount: existingRebate > 0 ? String(existingRebate) : '',
      appRef: b.rebateApplicationRef || '',
      reasonCategory: b.rebateCategory || 'VACATION',
      fromDate: b.rebateFromDate || '',
      toDate: b.rebateToDate || '',
      remarks: b.rebateRemarks || '',
    });
    setRebateStudent(student);
  };

  // Live calculation of concession in modal
  const currentDailyRate = rebateStudent?.breakdown?.dailyRate || 115;
  const computedRebateAmount = useMemo(() => {
    if (!rebateStudent) return 0;
    if (rebateForm.calcMode === 'DAYS') {
      const d = Math.max(0, parseInt(rebateForm.days, 10) || 0);
      return d * currentDailyRate;
    } else {
      return Math.max(0, parseInt(rebateForm.customAmount, 10) || 0);
    }
  }, [rebateStudent, rebateForm.calcMode, rebateForm.days, rebateForm.customAmount, currentDailyRate]);

  // Real-time before-and-after financial impact preview
  const previewImpact = useMemo(() => {
    if (!rebateStudent) return null;
    const b = rebateStudent.breakdown || {};
    // True original baseline total bill without any active diet concession
    const originalBill = rebateStudent.originalTotalBill != null
      ? rebateStudent.originalTotalBill
      : (rebateStudent.totalBill + Math.abs(b.dietRebate || 0));

    const baseCharges = b.baseMessCharge || originalBill;
    const newCurrentSubtotal = Math.max(0, baseCharges - computedRebateAmount);
    const newTotalBill = Math.max(0, originalBill - computedRebateAmount);
    const newDueAmount = Math.max(0, newTotalBill - (parseFloat(rebateStudent.paidAmount) || 0));

    let newStatus = rebateStudent.status;
    if ((parseFloat(rebateStudent.paidAmount) || 0) >= newTotalBill) {
      newStatus = 'FULLY_PAID';
    } else if ((parseFloat(rebateStudent.paidAmount) || 0) > 0) {
      newStatus = 'PARTIALLY_PAID';
    } else {
      newStatus = 'UNPAID';
    }

    return {
      originalBill,
      computedRebateAmount,
      newCurrentSubtotal,
      newTotalBill,
      newDueAmount,
      newStatus,
      isFullyCleared: newDueAmount === 0,
    };
  }, [rebateStudent, computedRebateAmount]);

  // Apply or update rebate
  const handleApplyRebate = async (e) => {
    if (e) e.preventDefault();
    if (!rebateStudent || !previewImpact) return;

    const rebateAmt = previewImpact.computedRebateAmount;
    if (rebateAmt <= 0) {
      toast.error('Please enter a valid number of days or concession amount.');
      return;
    }

    const calculatedDays = rebateForm.calcMode === 'DAYS'
      ? parseInt(rebateForm.days, 10) || 0
      : Math.round(rebateAmt / currentDailyRate);

    const ref = rebateForm.appRef.trim() || `REBATE-${Date.now().toString().slice(-4)}`;
    setIsSavingRebate(true);

    try {
      if (!isMockMode) {
        await rebateService.applyRebate({
          studentId: rebateStudent.userId || rebateStudent.id,
          amount: rebateAmt,
          days: calculatedDays,
          dailyRate: currentDailyRate,
          calcMode: rebateForm.calcMode,
          appRef: ref,
          reasonCategory: rebateForm.reasonCategory,
          fromDate: rebateForm.fromDate || null,
          toDate: rebateForm.toDate || null,
          remarks: rebateForm.remarks.trim(),
        });
      }

      const updatedStudents = students.map((s) => {
        if (s.id !== rebateStudent.id) return s;

        const b = s.breakdown || {};
        const newBreakdown = {
          ...b,
          dietRebate: -rebateAmt,
          dietRebateDays: calculatedDays,
          dailyRate: currentDailyRate,
          subtotalCurrentMonth: previewImpact.newCurrentSubtotal,
          rebateApplicationRef: ref,
          rebateCategory: rebateForm.reasonCategory,
          rebateFromDate: rebateForm.fromDate,
          rebateToDate: rebateForm.toDate,
          rebateRemarks: rebateForm.remarks.trim(),
        };

        return {
          ...s,
          originalTotalBill: previewImpact.originalBill,
          totalBill: previewImpact.newTotalBill,
          dueAmount: previewImpact.newDueAmount,
          status: previewImpact.newStatus,
          breakdown: newBreakdown,
        };
      });

      setStudents(updatedStudents);

      // Sync open breakdown modal if same student
      if (selectedStudent && selectedStudent.id === rebateStudent.id) {
        const updatedSelected = updatedStudents.find((s) => s.id === rebateStudent.id);
        setSelectedStudent(updatedSelected);
      }

      toast.success(
        `Applied ${formatCurrency(rebateAmt)} diet rebate for ${rebateStudent.name} (${rebateStudent.rollNo}).`
      );
      setRebateStudent(null);
    } catch (err) {
      console.error('Failed to save rebate:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save rebate to database.');
    } finally {
      setIsSavingRebate(false);
    }
  };

  // Reset or remove an existing rebate
  const handleRemoveRebate = async () => {
    if (!rebateStudent) return;
    setIsSavingRebate(true);

    try {
      if (!isMockMode) {
        await rebateService.removeRebate(rebateStudent.userId || rebateStudent.id);
      }

      const updatedStudents = students.map((s) => {
        if (s.id !== rebateStudent.id) return s;

        const b = s.breakdown || {};
        const restoredTotalBill = s.originalTotalBill != null
          ? s.originalTotalBill
          : (s.totalBill + Math.abs(b.dietRebate || 0));
        const restoredDueAmount = Math.max(0, restoredTotalBill - (parseFloat(s.paidAmount) || 0));

        let restoredStatus = s.status;
        if ((parseFloat(s.paidAmount) || 0) >= restoredTotalBill) {
          restoredStatus = 'FULLY_PAID';
        } else if ((parseFloat(s.paidAmount) || 0) > 0) {
          restoredStatus = 'PARTIALLY_PAID';
        } else {
          restoredStatus = 'UNPAID';
        }

        const newBreakdown = {
          ...b,
          dietRebate: 0,
          dietRebateDays: 0,
          subtotalCurrentMonth: b.baseMessCharge || restoredTotalBill,
          rebateApplicationRef: null,
          rebateCategory: null,
          rebateFromDate: null,
          rebateToDate: null,
          rebateRemarks: null,
        };

        return {
          ...s,
          totalBill: restoredTotalBill,
          dueAmount: restoredDueAmount,
          status: restoredStatus,
          breakdown: newBreakdown,
        };
      });

      setStudents(updatedStudents);

      if (selectedStudent && selectedStudent.id === rebateStudent.id) {
        const updatedSelected = updatedStudents.find((s) => s.id === rebateStudent.id);
        setSelectedStudent(updatedSelected);
      }

      toast.info(`Removed diet rebate for ${rebateStudent.name}. Bill restored.`);
      setRebateStudent(null);
    } catch (err) {
      console.error('Failed to remove rebate:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to remove rebate.');
    } finally {
      setIsSavingRebate(false);
    }
  };

  const handleNotifyDefaulters = async () => {
    setIsSendingReminders(true);
    try {
      if (isMockMode) {
        const pendingCount = students.filter((s) => s.status === 'UNPAID' || s.status === 'PARTIALLY_PAID').length;
        toast.success(`Dispatched automated due notifications to ${pendingCount} students with outstanding balances.`);
      } else {
        const res = await billService.notifyDefaulters();
        if (res.count === 0) {
          toast.info(res.message || 'All residents in this hostel are fully paid. No reminders needed!');
        } else {
          toast.success(res.message || `Dispatched automated due notifications to ${res.count} students with outstanding balances.`);
        }
      }
    } catch (err) {
      console.error('Failed to dispatch reminders:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to dispatch reminders to defaulters.');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleSaveRoom = async () => {
    if (!newRoomValue || !newRoomValue.trim()) {
      toast.warning('Please enter a valid room number.');
      return;
    }
    const cleanRoom = newRoomValue.trim();
    setIsSavingRoom(true);
    try {
      await userService.updateStudentRoom(selectedStudent.userId || selectedStudent.id, cleanRoom);
      
      // Update selectedStudent
      setSelectedStudent((prev) => prev ? { ...prev, room: cleanRoom } : null);

      // Update students list
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id || s.userId === selectedStudent.userId ? { ...s, room: cleanRoom } : s))
      );

      // Update registeredStudents list
      setRegisteredStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? { ...s, room: cleanRoom } : s))
      );

      toast.success(`Successfully reallocated ${selectedStudent.name} to Room ${cleanRoom}.`);
      setIsEditingRoom(false);
    } catch (err) {
      console.error('Failed to update student room:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update student room.');
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleExportLedger = () => {
    if (!students || students.length === 0) {
      toast.info('No student ledger records available to export.');
      return;
    }

    const headers = [
      'Roll No',
      'Student Name',
      'Room No',
      'Email',
      'Hostel',
      'Base Mess Charge (INR)',
      'Previous Due (INR)',
      'Late Fine (INR)',
      'Diet Rebate (INR)',
      'Total Billed (INR)',
      'Paid Amount (INR)',
      'Outstanding Due (INR)',
      'Payment Status',
    ];

    const rows = students.map((s) => {
      const b = s.breakdown || {};
      return [
        `"${s.rollNo || ''}"`,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${s.room || ''}"`,
        `"${s.email || ''}"`,
        `"${(s.hostel || user?.hostel || '').toUpperCase()}"`,
        (Number(b.baseMessCharge) || 0).toFixed(2),
        (Number(b.previousDue) || 0).toFixed(2),
        (Number(b.lateFine) || 0).toFixed(2),
        (Number(b.dietRebate) || 0).toFixed(2),
        (Number(s.totalBill) || 0).toFixed(2),
        (Number(s.paidAmount) || 0).toFixed(2),
        (Number(s.dueAmount) || 0).toFixed(2),
        `"${s.status || 'UNPAID'}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${user?.hostel ? `${user.hostel.toUpperCase()}_Hostel_` : ''}Mess_Ledger_Report_${new Date().toISOString().slice(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${students.length} student ledger records to CSV.`);
  };

  const handleGenerateBills = async (e) => {
    if (e) e.preventDefault();
    if (!generateForm.month || !generateForm.monthCode) {
      toast.error('Please enter the billing month and month code.');
      return;
    }
    if (isUpcomingMonth) {
      toast.error(`Cannot generate mess bills for upcoming months (${generateForm.month || generateForm.monthCode}). Bills can only be generated for current or past months.`);
      return;
    }
    if (generateForm.target === 'SINGLE' && !generateForm.targetUserId) {
      toast.error('Please select a student account.');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        month: generateForm.month.trim(),
        monthCode: generateForm.monthCode.trim(),
        baseBill: Number(generateForm.baseBill) || 2450,
        paymentDeadline: generateForm.paymentDeadline,
        billingCycle: generateForm.billingCycle?.trim() || `${generateForm.month} Mess Cycle`,
        target: generateForm.target,
        targetUserId: generateForm.target === 'SINGLE' ? generateForm.targetUserId : undefined,
      };

      const res = await billService.generateBills(payload);
      toast.success(
        res.message || `Successfully generated mess bills and sent notifications!`
      );
      setIsGenerateModalOpen(false);
      await fetchRealBills();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to generate mess bills.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        {/* Admin Header Banner */}
        <div className="card-base p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                {user?.role === 'WARDEN' ? 'Warden Portal' : 'Senior Warden Portal'}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Hostel: {user?.hostel ? user.hostel.toUpperCase() : 'Not Assigned'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {user?.role === 'WARDEN' ? 'Hostel Warden Console' : 'Senior Warden & Warden Console'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Oversee monthly meal bills, grant diet rebates, and monitor fee collections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={Receipt}
              onClick={() => setIsGenerateModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Generate Bills
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={FileSpreadsheet}
              onClick={handleExportLedger}
            >
              Export Ledger
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={Send}
              loading={isSendingReminders}
              disabled={isSendingReminders}
              onClick={handleNotifyDefaulters}
            >
              Send Reminders
            </Button>
          </div>
        </div>

        {/* Aggregate Stat Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Billed"
            value={formatCurrency(metrics.totalBilled)}
            subtext={`${defaultMonthName} (${students.length} ${students.length === 1 ? 'Student' : 'Students'})`}
            icon={Building2}
            variant="primary"
          />
          <StatCard
            title="Total Collected"
            value={formatCurrency(metrics.totalCollected)}
            subtext={`${metrics.collectionRate}% collection rate`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Outstanding Dues"
            value={formatCurrency(metrics.totalOutstanding)}
            subtext={`${metrics.unpaidCount} ${metrics.unpaidCount === 1 ? 'student' : 'students'} with dues`}
            icon={AlertCircle}
            variant="warning"
          />
        </div>

        {/* Student Ledger Roster Section */}
        <div className="card-base p-6 space-y-5" id="roster">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                Student Mess Ledger Roster {user?.hostel ? `(${user.hostel.toUpperCase()})` : ''}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Detailed dues, itemized billing breakdown, and manual rebate management
              </p>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                icon={Tag}
                onClick={() => {
                  const target = filteredStudents.length > 0 ? filteredStudents[0] : students[0];
                  if (target) handleOpenRebateModal(target);
                }}
                className="text-xs whitespace-nowrap"
              >
                Record Rebate
              </Button>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, roll, room..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Tabs by Payment Status */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Students', count: counts.ALL },
              { id: 'FULLY_PAID', label: 'Fully Paid', count: counts.FULLY_PAID },
              { id: 'PARTIALLY_PAID', label: 'Partially Paid', count: counts.PARTIALLY_PAID },
              { id: 'UNPAID', label: 'Unpaid', count: counts.UNPAID },
            ].map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${active
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-semibold rounded-full ${active
                      ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                      : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase font-semibold">
                  <th className="py-3 px-3">Roll No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1">
                      Total Bill <span className="text-[10px] font-normal lowercase tracking-normal text-zinc-400">(breakdown)</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Remaining Due</th>
                  <th className="py-3 px-3 text-right">Payment Status</th>
                  <th className="py-3 px-3 text-right">Rebate / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            No Active Mess Bills Published
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                            {registeredStudents.length > 0
                              ? `There are ${registeredStudents.length} student(s) registered in ${user?.hostel ? user.hostel.toUpperCase() : 'this hostel'}. Click below to publish this month's mess bill and notify them.`
                              : `No mess bills have been published yet for ${user?.hostel ? user.hostel.toUpperCase() : 'this hostel'}. Click below to generate monthly bills.`}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Receipt}
                          onClick={() => setIsGenerateModalOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white mx-auto shadow-xs"
                        >
                          Generate First Mess Bill
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <AlertCircle className="w-6 h-6 mx-auto text-zinc-400" />
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">No matching student bills</p>
                        <p className="text-[11px] text-zinc-400">
                          Try adjusting your search query or switching payment status filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr
                      key={st.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* Roll Number */}
                      <td className="py-3.5 px-3 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        {st.rollNo}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-zinc-950 dark:text-zinc-100">
                          {st.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {st.email}
                        </div>
                      </td>

                      {/* Room */}
                      <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        Room {st.room}
                      </td>

                      {/* Total Bill with (i) Info Breakdown Button */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                            {formatCurrency(st.totalBill)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(st)}
                            title="View Itemized Billing Breakdown"
                            aria-label={`View billing breakdown for ${st.name}`}
                            className="p-1 rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-3 text-right text-zinc-700 dark:text-zinc-300 font-medium">
                        {formatCurrency(st.paidAmount)}
                      </td>

                      {/* Remaining Due */}
                      <td className="py-3.5 px-3 text-right">
                        {st.dueAmount > 0 ? (
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {formatCurrency(st.dueAmount)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-medium">₹0</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 text-right">
                        <StatusBadge status={st.status} />
                      </td>

                      {/* Rebate / Action */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {st.breakdown?.dietRebate < 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenRebateModal(st)}
                            title="Click to adjust or remove applied diet rebate"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/60 transition-colors"
                          >
                            <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Rebate {formatCurrency(st.breakdown.dietRebate)}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenRebateModal(st)}
                            title="Grant diet rebate for this student"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Rebate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Roster View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {students.length === 0 ? (
              <div className="py-10 text-center p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-zinc-950 dark:text-zinc-50">No Active Mess Bills Published</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Click below to generate monthly bills for registered boarders.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Receipt}
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white mx-auto text-xs"
                >
                  Generate Bills
                </Button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                <AlertCircle className="w-6 h-6 mx-auto text-zinc-400 mb-1" />
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">No matching student bills</p>
                <p className="text-[11px] text-zinc-400">Try adjusting your search query or filter.</p>
              </div>
            ) : (
              filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-xs"
                >
                  {/* Card Header: Name, Roll, Room, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-zinc-950 dark:text-zinc-50">{st.name}</span>
                        <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">({st.rollNo})</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Room {st.room} • <span className="font-mono">{st.email}</span>
                      </div>
                    </div>
                    <StatusBadge status={st.status} size="sm" />
                  </div>

                  {/* Financial Snapshot 3-Box Grid */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center text-[11px]">
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase">Total Bill</div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {formatCurrency(st.totalBill)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase">Paid</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(st.paidAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase">Net Due</div>
                      <div
                        className={`font-bold mt-0.5 ${st.dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'
                          }`}
                      >
                        {formatCurrency(st.dueAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(st)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
                    >
                      <Info className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Itemized Breakdown</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDeletingAccountStudent(st)}
                        title="Delete resident user account"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <UserX className="w-3 h-3" />
                        <span>Delete User</span>
                      </button>

                      {st.breakdown?.dietRebate < 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRebateModal(st)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Rebate {formatCurrency(st.breakdown.dietRebate)}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenRebateModal(st)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Rebate</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grant / Adjust Mess Rebate Modal */}
      {rebateStudent && previewImpact && (
        <Modal
          isOpen={!!rebateStudent}
          onClose={() => setRebateStudent(null)}
          title={
            rebateStudent.breakdown?.dietRebate < 0
              ? 'Adjust Student Diet Rebate'
              : 'Grant Mess Rebate'
          }
          subtitle="Record and calculate meal fee concessions based on leave applications"
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                {rebateStudent.breakdown?.dietRebate < 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={RotateCcw}
                    onClick={handleRemoveRebate}
                    disabled={isSavingRebate}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900/60 dark:hover:bg-rose-950/40 text-xs"
                  >
                    Remove Rebate
                  </Button>
                ) : (
                  <span className="text-[11px] text-zinc-400">
                    Paper Slip / Leave Verification
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRebateStudent(null)}
                  disabled={isSavingRebate}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={Check}
                  loading={isSavingRebate}
                  disabled={isSavingRebate}
                  onClick={handleApplyRebate}
                  className="bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"
                >
                  Apply Concession
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Student Selector / Info Header */}
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Target Student
                </label>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Rate: <strong>₹{currentDailyRate}/day</strong>
                </span>
              </div>
              <select
                value={rebateStudent.id}
                onChange={(e) => {
                  const target = students.find((s) => s.id === e.target.value);
                  if (target) handleOpenRebateModal(target);
                }}
                className="w-full text-xs font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.rollNo}) — Room {st.room} [Bill: {formatCurrency(st.totalBill)}]
                  </option>
                ))}
              </select>
            </div>

            {/* Current Billing Context Summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="text-[10px] text-zinc-400 uppercase">Current Bill</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatCurrency(rebateStudent.totalBill)}
                </div>
              </div>
              <div className="p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="text-[10px] text-zinc-400 uppercase">Amount Paid</div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrency(rebateStudent.paidAmount)}
                </div>
              </div>
              <div className="p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="text-[10px] text-zinc-400 uppercase">Current Due</div>
                <div className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                  {formatCurrency(rebateStudent.dueAmount)}
                </div>
              </div>
            </div>

            {/* Calculation Mode Segmented Buttons */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Rebate Assessment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRebateForm({ ...rebateForm, calcMode: 'DAYS' })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${rebateForm.calcMode === 'DAYS'
                    ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50'
                    }`}
                >
                  By Absence Days (₹{currentDailyRate}/day)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRebateForm({
                      ...rebateForm,
                      calcMode: 'CUSTOM',
                      customAmount:
                        rebateForm.customAmount && Number(rebateForm.customAmount) > 0
                          ? String(rebateForm.customAmount).replace(/^0+(?=\d)/, '')
                          : (rebateForm.days && Number(rebateForm.days) > 0 ? String(Number(rebateForm.days) * currentDailyRate) : ''),
                    })
                  }
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${rebateForm.calcMode === 'CUSTOM'
                    ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50'
                    }`}
                >
                  Custom Concession Rupee Amount
                </button>
              </div>
            </div>

            {/* Assessment Input Field */}
            {rebateForm.calcMode === 'DAYS' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Number of Approved Absence Days
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {rebateForm.days || 0} days × ₹{currentDailyRate} = <strong>{formatCurrency(computedRebateAmount)}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={rebateForm.days}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setRebateForm({ ...rebateForm, days: '' });
                      return;
                    }
                    const sanitized = raw.replace(/^0+(?=\d)/, '');
                    setRebateForm({ ...rebateForm, days: sanitized });
                  }}
                  placeholder="e.g. 4"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Flat Rebate Amount (₹)
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    ≈ {currentDailyRate > 0 ? Math.round(computedRebateAmount / currentDailyRate) : 0} days equivalent
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={rebateForm.customAmount}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setRebateForm({ ...rebateForm, customAmount: '' });
                      return;
                    }
                    const sanitized = raw.replace(/^0+(?=\d)/, '');
                    setRebateForm({ ...rebateForm, customAmount: sanitized });
                  }}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            )}

            {/* Application Ref & Reason Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Paper Application / Slip Ref #
                </label>
                <input
                  type="text"
                  value={rebateForm.appRef}
                  onChange={(e) => setRebateForm({ ...rebateForm, appRef: e.target.value })}
                  placeholder="e.g. APP/2026/09/24 or Slip #14"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Absence / Leave Reason
                </label>
                <select
                  value={rebateForm.reasonCategory}
                  onChange={(e) => setRebateForm({ ...rebateForm, reasonCategory: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                >
                  <option value="VACATION">Festive / Semester Vacation</option>
                  <option value="ACADEMIC">Academic Workshop / Conference</option>
                  <option value="MEDICAL">Medical Absence / Hospitalization</option>
                  <option value="SPORTS">University Sports / Cultural Meet</option>
                  <option value="PERSONAL">Family / Personal Leave</option>
                  <option value="OTHER">Other Approved Concession</option>
                </select>
              </div>
            </div>

            {/* Leave Dates Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Absence From Date
                </label>
                <input
                  type="date"
                  value={rebateForm.fromDate}
                  onChange={(e) => setRebateForm({ ...rebateForm, fromDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Absence To Date
                </label>
                <input
                  type="date"
                  value={rebateForm.toDate}
                  onChange={(e) => setRebateForm({ ...rebateForm, toDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            </div>

            {/* Superintendent Remarks */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Approval Remarks / Audit Notes
              </label>
              <input
                type="text"
                value={rebateForm.remarks}
                onChange={(e) => setRebateForm({ ...rebateForm, remarks: e.target.value })}
                placeholder="e.g. Approved based on signed departmental leave letter."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
              />
            </div>

            {/* Financial Impact Live Preview Card */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 space-y-2">
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>Financial Reconciliation Impact</span>
                <span>Live Preview</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Original Bill</div>
                  <div className="font-semibold line-through text-zinc-500">
                    {formatCurrency(previewImpact.originalBill)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Diet Rebate</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-300">
                    - {formatCurrency(computedRebateAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">New Total Bill</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(previewImpact.newTotalBill)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">New Net Due</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(previewImpact.newDueAmount)}
                  </div>
                </div>
              </div>
              {previewImpact.isFullyCleared && (
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Rebate fully settles remaining balance! Status will update to Fully Paid.</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Itemized Billing Breakdown Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title="Itemized Billing Breakdown"
          subtitle={`${selectedStudent.name} (${selectedStudent.rollNo}) • Room ${selectedStudent.room}, ${(selectedStudent.hostel || '').toUpperCase()}`}
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={UserX}
                onClick={() => {
                  const target = selectedStudent;
                  setSelectedStudent(null);
                  setDeletingAccountStudent(target);
                }}
                className="text-xs"
              >
                Delete Student Account
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Quick Status Bar & Assigned Room */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                    Total Cycles
                  </div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedStudent.bills?.length || 0} Bills</span>
                  </div>
                </div>

                <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

                <div className="space-y-0.5">
                  <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                    Assigned Room
                  </div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <DoorClosed className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Room {selectedStudent.room || '—'}</span>
                    {!isEditingRoom && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewRoomValue(selectedStudent.room || '');
                          setIsEditingRoom(true);
                        }}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium ml-1"
                      >
                        Change Room
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <StatusBadge status={selectedStudent.status} />
            </div>

            {/* Room Reallocation Form (Admin Only) */}
            {isEditingRoom && (
              <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                    Reallocate Room for {selectedStudent.name}
                  </label>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Updates university directory & notifies student
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRoomValue}
                    onChange={(e) => setNewRoomValue(e.target.value)}
                    placeholder="Enter new room no. (e.g. 204)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    loading={isSavingRoom}
                    onClick={handleSaveRoom}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    Save Room
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingRoom(false)}
                    className="shrink-0"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Reconciliation Snapshot Grid (with Diet Rebate if granted) */}
            <div className={`grid gap-2 pt-1 ${selectedStudent.breakdown?.dietRebate < 0 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-center">
                <div className="text-[10px] uppercase font-semibold text-zinc-400">Total Billed</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatCurrency(selectedStudent.totalBill)}
                </div>
              </div>

              {selectedStudent.breakdown?.dietRebate < 0 && (
                <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 text-center">
                  <div className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400">Diet Rebate</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    - {formatCurrency(Math.abs(selectedStudent.breakdown.dietRebate))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-center">
                <div className="text-[10px] uppercase font-semibold text-zinc-400">Amount Paid</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrency(selectedStudent.paidAmount)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-center">
                <div className="text-[10px] uppercase font-semibold text-zinc-400">Late Fines</div>
                <div className={`text-sm font-bold mt-0.5 ${selectedStudent.lateFine > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'}`}>
                  {formatCurrency(selectedStudent.lateFine)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-center">
                <div className="text-[10px] uppercase font-semibold text-zinc-400">Net Due</div>
                <div className={`text-sm font-bold mt-0.5 ${selectedStudent.dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                  {formatCurrency(selectedStudent.dueAmount)}
                </div>
              </div>
            </div>

            {/* Active Diet Rebate Details Card */}
            {selectedStudent.breakdown?.dietRebate < 0 && (
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                      <span>Diet Rebate Concession Applied</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono">
                        {selectedStudent.breakdown.dietRebateDays || Math.round(Math.abs(selectedStudent.breakdown.dietRebate) / 115)} days
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700/90 dark:text-emerald-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                      {selectedStudent.breakdown.rebateApplicationRef && (
                        <span>Slip Ref: <strong>{selectedStudent.breakdown.rebateApplicationRef}</strong></span>
                      )}
                      {selectedStudent.breakdown.rebateCategory && (
                        <span>• Reason: <strong className="capitalize">{selectedStudent.breakdown.rebateCategory.toLowerCase()}</strong></span>
                      )}
                      {selectedStudent.breakdown.rebateFromDate && (
                        <span>• From: {selectedStudent.breakdown.rebateFromDate}</span>
                      )}
                      {selectedStudent.breakdown.rebateToDate && (
                        <span>• To: {selectedStudent.breakdown.rebateToDate}</span>
                      )}
                    </div>
                    {selectedStudent.breakdown.rebateRemarks && (
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 italic">
                        "{selectedStudent.breakdown.rebateRemarks}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right pl-3 shrink-0">
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    - {formatCurrency(Math.abs(selectedStudent.breakdown.dietRebate))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const st = selectedStudent;
                      setSelectedStudent(null);
                      handleOpenRebateModal(st);
                    }}
                    className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 hover:underline mt-0.5 block"
                  >
                    Adjust Rebate
                  </button>
                </div>
              </div>
            )}

            {/* All Monthly Bills Breakdown List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-950 dark:text-zinc-50 px-0.5">
                <span>Monthly Mess Bills ({selectedStudent.bills?.length || 0})</span>
                <span className="text-[11px] text-zinc-400 font-normal">All historical & active cycles</span>
              </div>

              {(!selectedStudent.bills || selectedStudent.bills.length === 0) ? (
                <div className="p-6 text-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                  No monthly mess bills generated yet for this student.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedStudent.bills.map((b) => {
                    const cycleCharge = (parseFloat(b.baseBill) || 0) + (parseFloat(b.lateFine) || 0);
                    const cycleDue = Math.max(0, cycleCharge - (parseFloat(b.paidAmount) || 0));

                    return (
                      <div
                        key={b.id}
                        className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 space-y-2 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-950 dark:text-zinc-100">{b.month}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ({b.billingCycle || b.monthCode})
                            </span>
                          </div>
                          <StatusBadge status={b.status} size="sm" />
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                          <div>
                            <div className="text-[10px] text-zinc-400 uppercase">Base Mess Fee</div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                              {formatCurrency(b.baseBill)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-400 uppercase">Late Penalty</div>
                            <div className={`font-semibold mt-0.5 ${b.lateFine > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'}`}>
                              {b.lateFine > 0 ? `+${formatCurrency(b.lateFine)} (${b.fineDays}d)` : '₹0'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-400 uppercase">Cycle Due</div>
                            <div className={`font-bold mt-0.5 ${cycleDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {formatCurrency(cycleDue)}
                            </div>
                          </div>
                        </div>

                      {b.paymentDeadline && (
                        <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-850">
                          <span>
                            Deadline: {new Date(b.paymentDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {b.lateFine > 0 && (
                            <span className="text-rose-500 font-semibold">
                              {b.fineDays} days overdue @ ₹{b.finePerDay || 20}/day
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Student Account Confirmation Modal (Admin Only) */}
      {deletingAccountStudent && (
        <Modal
          isOpen={!!deletingAccountStudent}
          onClose={() => setDeletingAccountStudent(null)}
          title="Delete Student User Account"
          subtitle={`Are you sure you want to delete the account for ${deletingAccountStudent.name} (${deletingAccountStudent.rollNo})?`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingAccountStudent(null)}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                loading={isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  try {
                    await userService.deleteUser(deletingAccountStudent.rollNo || deletingAccountStudent.id);
                    toast.success(
                      `Deleted user account for ${deletingAccountStudent.name} (${deletingAccountStudent.rollNo}).`
                    );
                    setStudents((prev) =>
                      prev.filter(
                        (s) =>
                          s.id !== deletingAccountStudent.id &&
                          s.rollNo !== deletingAccountStudent.rollNo
                      )
                    );
                    if (selectedStudent?.id === deletingAccountStudent.id) {
                      setSelectedStudent(null);
                    }
                    setDeletingAccountStudent(null);
                  } catch (err) {
                    toast.error(err.message || 'Failed to delete student account.');
                  } finally {
                    setIsDeletingAccount(false);
                  }
                }}
              >
                Delete User
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Irreversible Administrative Action</p>
                <p className="text-[11px] leading-relaxed">
                  This will delete the student's login account, wipe all active/past mess bills (including outstanding due of {formatCurrency(deletingAccountStudent.dueAmount)}), and reset their institutional registration status.
                </p>
              </div>
            </div>
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 font-mono text-[11px]">
              <div><strong>Student:</strong> {deletingAccountStudent.name}</div>
              <div><strong>Roll Number:</strong> {deletingAccountStudent.rollNo}</div>
              <div><strong>Room:</strong> Room {deletingAccountStudent.room}</div>
              <div><strong>Billing Status:</strong> {deletingAccountStudent.status} (Total: {formatCurrency(deletingAccountStudent.totalBill)})</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Mess Bills Modal */}
      {isGenerateModalOpen && (
        <Modal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          title="Generate Hostel Mess Bills"
          subtitle={`Publish monthly meal bills for ${user?.hostel ? user.hostel.toUpperCase() : 'Hostel'} residents with automated student notification`}
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGenerateModalOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Receipt}
                loading={isGenerating}
                disabled={isGenerating || isUpcomingMonth}
                onClick={handleGenerateBills}
                className={isUpcomingMonth ? "bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed text-white opacity-60" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
              >
                {generateForm.target === 'SINGLE' ? 'Generate & Notify Student' : 'Generate & Notify All Boarders'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleGenerateBills} className="space-y-4">
            {/* Target Scope Selection */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Target Residents Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGenerateForm({ ...generateForm, target: 'ALL' })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-left flex items-center gap-2.5 transition-all ${generateForm.target === 'ALL'
                      ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50'
                    }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-semibold">All Boarders (Bulk)</div>
                    <div className="text-[10px] opacity-75">
                      {registeredStudents.length > 0
                        ? `${registeredStudents.length} registered in ${user?.hostel ? user.hostel.toUpperCase() : 'hostel'}`
                        : `All registered boarders`}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const firstStudentId = registeredStudents[0]?.id || '';
                    setGenerateForm({
                      ...generateForm,
                      target: 'SINGLE',
                      targetUserId: generateForm.targetUserId || firstStudentId,
                    });
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-left flex items-center gap-2.5 transition-all ${generateForm.target === 'SINGLE'
                      ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50'
                    }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Single Student</div>
                    <div className="text-[10px] opacity-75">Target individual account</div>
                  </div>
                </button>
              </div>
            </div>

            {/* If Single Target: Select Student */}
            {generateForm.target === 'SINGLE' && (
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Select Registered Student
                </label>
                {registeredStudents.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    No registered students found for {user?.hostel ? user.hostel.toUpperCase() : 'this hostel'}. Students must log in via Google once to activate their profile.
                  </p>
                ) : (
                  <select
                    value={generateForm.targetUserId}
                    onChange={(e) => setGenerateForm({ ...generateForm, targetUserId: e.target.value })}
                    className="w-full text-xs font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                  >
                    <option value="">-- Choose student --</option>
                    {registeredStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.roll_no || st.rollNo || 'No Roll'}) — Room {st.room || '—'} [{st.email}]
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Month & Month Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Billing Month Display Name
                </label>
                <input
                  type="text"
                  value={generateForm.month}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGenerateForm({
                      ...generateForm,
                      month: val,
                      billingCycle: `${val} Mess Cycle`,
                    });
                  }}
                  placeholder="e.g. October 2026"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Billing Month (YYYY-MM)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Max: {defaultMonthCode}
                  </span>
                </div>
                <input
                  type="month"
                  max={defaultMonthCode}
                  value={generateForm.monthCode}
                  onChange={(e) => handleMonthCodeChange(e.target.value)}
                  placeholder="e.g. 2026-10"
                  required
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 font-mono ${
                    isUpcomingMonth
                      ? 'border-rose-500 focus:ring-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-zinc-300 dark:border-zinc-700 focus:ring-zinc-950 dark:focus:ring-zinc-100'
                  }`}
                />
              </div>
            </div>

            {/* Upcoming Month Warning Banner */}
            {isUpcomingMonth && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold">Future Billing Month Not Permitted</div>
                  <div className="text-[11px] leading-relaxed">
                    Mess bills cannot be generated for upcoming or future months (<strong>{generateForm.month || generateForm.monthCode}</strong>). Bills can only be issued up to the current month (<strong>{defaultMonthName}</strong>).
                  </div>
                </div>
              </div>
            )}

            {/* Base Bill & Payment Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Standard Monthly Mess Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={generateForm.baseBill}
                    onChange={(e) => setGenerateForm({ ...generateForm, baseBill: e.target.value })}
                    placeholder="2450"
                    required
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={generateForm.paymentDeadline}
                  onChange={(e) => setGenerateForm({ ...generateForm, paymentDeadline: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            </div>

            {/* Billing Cycle Name */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Billing Cycle Identifier
              </label>
              <input
                type="text"
                value={generateForm.billingCycle}
                onChange={(e) => setGenerateForm({ ...generateForm, billingCycle: e.target.value })}
                placeholder="e.g. October 2026 Regular Mess Cycle"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
              />
            </div>

            {/* Informational Callout & Notification guarantee */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Automated Notification & Due Accounting</span>
              </div>
              <ul className="text-[11px] text-emerald-700 dark:text-emerald-300/90 space-y-1 list-disc list-inside">
                <li>
                  An automated in-app notification (<strong className="font-semibold">"Mess Bill Published: {generateForm.month}"</strong>) will immediately be delivered to every targeted student.
                </li>
                <li>
                  Any previous unpaid arrears will automatically carry forward into each student's total bill payable.
                </li>
                <li>
                  Students can instantly review their itemized charges and settle dues directly on their dashboard.
                </li>
              </ul>
            </div>
          </form>
        </Modal>
      )}

    </PageContainer>
  );
};
