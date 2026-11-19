import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Upload,
  FileUp,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Hash,
  Mail,
  Building2,
  ShieldCheck,
  Check,
  Download,
  UserX,
  Phone,
  GraduationCap,
} from 'lucide-react';
import { useAuth, useToast } from '../context';
import { boarderService } from '../services/boarderService';
import { userService } from '../services/userService';
import { PageContainer } from '../components/PageContainer';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { DEPARTMENTS } from '../utils/constants';

export const AdminBoarders = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [boarders, setBoarders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'REGISTERED' | 'PENDING'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingBoarder, setEditingBoarder] = useState(null);
  const [deletingBoarder, setDeletingBoarder] = useState(null);
  const [deletingUserAccountBoarder, setDeletingUserAccountBoarder] = useState(null);
  const [isDeletingUserAccount, setIsDeletingUserAccount] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleteUserModalOpen, setIsBulkDeleteUserModalOpen] = useState(false);
  const [isBulkDeletingUsers, setIsBulkDeletingUsers] = useState(false);
  const [isBulkRemoveRosterModalOpen, setIsBulkRemoveRosterModalOpen] = useState(false);
  const [isBulkRemovingRoster, setIsBulkRemovingRoster] = useState(false);

  // Single Boarder Form State
  const [formData, setFormData] = useState({
    rollNo: '',
    name: '',
    room: '',
    email: '',
    department: '',
    phone: '',
    hostel: user?.hostel || '',
  });
  const [formError, setFormError] = useState('');

  // Bulk Import State
  const fileInputRef = useRef(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [importMode, setImportMode] = useState('file'); // 'file' | 'text'
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');

  // Load boarders list
  const refreshBoarders = async () => {
    try {
      const list = await boarderService.getBoarders(user?.hostel);
      setBoarders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to refresh boarders:', err);
    }
  };

  useEffect(() => {
    refreshBoarders();
  }, [user?.hostel]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = boarders.length;
    const registered = boarders.filter((b) => b.isRegistered).length;
    const pending = total - registered;
    const completionRate = total > 0 ? ((registered / total) * 100).toFixed(1) : 0;

    return {
      total,
      registered,
      pending,
      completionRate,
    };
  }, [boarders]);

  // Filtered & Searched Boarders
  const filteredBoarders = useMemo(() => {
    return boarders.filter((b) => {
      if (filterStatus === 'REGISTERED' && !b.isRegistered) return false;
      if (filterStatus === 'PENDING' && b.isRegistered) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const rollMatch = b.rollNo.toLowerCase().includes(q);
        const nameMatch = b.name.toLowerCase().includes(q);
        const roomMatch = b.room.toLowerCase().includes(q);
        const emailMatch = b.email.toLowerCase().includes(q);
        return rollMatch || nameMatch || roomMatch || emailMatch;
      }
      return true;
    });
  }, [boarders, filterStatus, searchQuery]);

  // Bulk Selection Helpers
  const toggleSelectBoarder = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredBoarders.map((b) => b.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedBoarders = useMemo(() => {
    return boarders.filter((b) => selectedIds.has(b.id));
  }, [boarders, selectedIds]);

  const selectedRegisteredBoarders = useMemo(() => {
    return selectedBoarders.filter((b) => b.isRegistered);
  }, [selectedBoarders]);

  const isAllVisibleSelected = useMemo(() => {
    return filteredBoarders.length > 0 && filteredBoarders.every((b) => selectedIds.has(b.id));
  }, [filteredBoarders, selectedIds]);

  const isSomeVisibleSelected = useMemo(() => {
    return filteredBoarders.some((b) => selectedIds.has(b.id)) && !isAllVisibleSelected;
  }, [filteredBoarders, selectedIds, isAllVisibleSelected]);

  // Handle Add Single Boarder
  const handleOpenAddModal = () => {
    setFormData({
      rollNo: '',
      name: '',
      room: '',
      email: '',
      department: '',
      phone: '',
      hostel: user?.hostel || '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveBoarder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.rollNo.trim() || !formData.name.trim() || !formData.room.trim() || !formData.email.trim()) {
      setFormError('All fields (Roll No, Name, Room No, Institution Email) are mandatory.');
      return;
    }

    try {
      await boarderService.addBoarder(formData);
      toast.success(`Added ${formData.name} (${formData.rollNo.toUpperCase()}) to authorized boarder roster.`);
      await refreshBoarders();
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to add boarder.');
    }
  };

  // Handle Edit Boarder
  const handleOpenEditModal = (boarder) => {
    setEditingBoarder(boarder);
    setFormData({
      rollNo: boarder.rollNo,
      name: boarder.name,
      room: boarder.room,
      email: boarder.email,
      department: boarder.department || '',
      phone: boarder.phone || '',
      hostel: boarder.hostel,
    });
    setFormError('');
  };

  const handleUpdateBoarder = async (e) => {
    e.preventDefault();
    if (!editingBoarder) return;
    setFormError('');

    try {
      await boarderService.updateBoarder(editingBoarder.id, formData);
      toast.success(`Updated resident record for ${formData.name}.`);
      await refreshBoarders();
      setEditingBoarder(null);
    } catch (err) {
      setFormError(err.message || 'Failed to update boarder.');
    }
  };

  // Handle Delete Boarder Roster Record
  const handleConfirmDelete = async () => {
    if (!deletingBoarder) return;
    try {
      await boarderService.deleteBoarder(deletingBoarder.id);
      toast.info(`Permanently deleted ${deletingBoarder.name} (${deletingBoarder.rollNo}) from hostel roster.`);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingBoarder.id);
        return next;
      });
      await refreshBoarders();
      setDeletingBoarder(null);
    } catch (_err) {
      toast.error('Failed to permanently delete boarder.');
    }
  };

  // Handle Delete Registered User Account (Admin Only)
  const handleConfirmDeleteUserAccount = async () => {
    if (!deletingUserAccountBoarder) return;
    setIsDeletingUserAccount(true);
    try {
      await userService.deleteUser(deletingUserAccountBoarder.rollNo || deletingUserAccountBoarder.id);
      toast.success(
        `Deleted user account for ${deletingUserAccountBoarder.name} (${deletingUserAccountBoarder.rollNo}).`
      );
      refreshBoarders();
      setDeletingUserAccountBoarder(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user account.');
    } finally {
      setIsDeletingUserAccount(false);
    }
  };

  // Handle Bulk Delete Registered User Accounts
  const handleConfirmBulkDeleteUsers = async () => {
    if (selectedRegisteredBoarders.length === 0) return;
    setIsBulkDeletingUsers(true);
    try {
      const rollNos = selectedRegisteredBoarders.map((b) => b.rollNo).filter(Boolean);
      const ids = selectedRegisteredBoarders.map((b) => b.id).filter(Boolean);
      const emails = selectedRegisteredBoarders.map((b) => b.email).filter(Boolean);

      await userService.deleteUsersBulk({ rollNos, ids, emails });
      toast.success(`Deleted user accounts for ${selectedRegisteredBoarders.length} resident(s).`);
      clearSelection();
      await refreshBoarders();
      setIsBulkDeleteUserModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to bulk delete user accounts.');
    } finally {
      setIsBulkDeletingUsers(false);
    }
  };

  // Handle Bulk Remove from Roster
  const handleConfirmBulkRemoveFromRoster = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkRemovingRoster(true);
    try {
      const ids = Array.from(selectedIds);
      await boarderService.deleteBoardersBulk(ids);
      toast.success(`Permanently deleted ${ids.length} resident(s) from hostel roster.`);
      clearSelection();
      await refreshBoarders();
      setIsBulkRemoveRosterModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to permanently delete boarders.');
    } finally {
      setIsBulkRemovingRoster(false);
    }
  };

  // Handle Bulk Import File & Text
  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setBulkError('Please select a valid .csv or .txt spreadsheet file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result || '';
      setBulkText(text);
      setUploadedFileName(file.name);
      setBulkError('');
      toast.info(`Loaded data from ${file.name}`);
    };
    reader.onerror = () => {
      setBulkError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleProcessBulkImport = async (e) => {
    e.preventDefault();
    setBulkError('');

    let lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setBulkError('Please upload a .csv file or paste at least one student record.');
      return;
    }

    // Automatically strip column headers if present (e.g. "RollNo,Name,Room,Email")
    if (lines.length > 0) {
      const firstLineLower = lines[0].toLowerCase();
      if (firstLineLower.includes('roll') && (firstLineLower.includes('name') || firstLineLower.includes('room'))) {
        lines = lines.slice(1);
      }
    }

    if (lines.length === 0) {
      setBulkError('The uploaded file contains only a header row with no student records.');
      return;
    }

    const records = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 4) {
        setBulkError(`Row ${i + 1} is missing fields. Format must be: RollNo, Name, Room, Email, [Department], [Phone]`);
        return;
      }
      records.push({
        rollNo: parts[0],
        name: parts[1],
        room: parts[2],
        email: parts[3],
        department: parts[4] || '',
        phone: parts[5] || '',
        hostel: user?.hostel || '',
      });
    }

    try {
      const result = await boarderService.addBoardersBulk(records, user?.hostel || '');
      if (result.added && result.added.length > 0) {
        toast.success(`Successfully imported ${result.added.length} new boarders!`);
      }
      if (result.skipped && result.skipped.length > 0) {
        toast.warning(`Skipped ${result.skipped.length} records (duplicates or missing info).`);
      }
      await refreshBoarders();
      setIsBulkModalOpen(false);
      setBulkText('');
      setUploadedFileName('');
    } catch (err) {
      setBulkError(err.message || 'Bulk import failed.');
    }
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    if (boarders.length === 0) {
      toast.error('No boarders to export.');
      return;
    }

    const headers = ['Roll No', 'Full Name', 'Room No', 'Institution Email', 'Department', 'Phone No', 'Hostel', 'Registration Status', 'Registered At'];
    const rows = boarders.map((b) => [
      b.rollNo,
      `"${(b.name || '').replace(/"/g, '""')}"`,
      b.room,
      b.email,
      `"${(b.department || '').replace(/"/g, '""')}"`,
      b.phone || '',
      b.hostel,
      b.isRegistered ? 'REGISTERED' : 'PENDING',
      b.registeredAt || 'Not Registered',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${user?.hostel ? `${user.hostel.toUpperCase()}_Hostel_` : ''}Boarders_Master_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded hostel boarders CSV roster.');
  };

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        {/* Master Banner */}
        <div className="card-base p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                Master Access List
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Hostel: <strong className="text-zinc-700 dark:text-zinc-300">{user?.hostel ? user.hostel.toUpperCase() : 'Not Assigned'}</strong>
              </span>
              <span className="text-xs text-zinc-300 dark:text-zinc-700">â€¢</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Authority: <strong className="text-zinc-700 dark:text-zinc-300">
                  {user?.role === 'WARDEN' ? 'Warden' : 'Senior Warden'}
                  {user?.hostel ? ` (${user.hostel.toUpperCase()})` : ''}
                </strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Hostel Boarders Master Directory
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Maintain the authorized roster of admitted hostel residents with Roll No, Room, and Institution Email.
              Students must be on this list to verify and register their accounts.
            </p>
          </div>

          {/* Banner Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              icon={Upload}
              onClick={() => {
                setBulkError('');
                setIsBulkModalOpen(true);
              }}
              className="text-xs"
            >
              Bulk Import CSV
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={Download}
              onClick={handleExportCSV}
              className="text-xs"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={UserPlus}
              onClick={handleOpenAddModal}
              className="text-xs font-semibold"
            >
              + Add Boarder
            </Button>
          </div>
        </div>

        {/* Aggregate Stat Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Boarders"
            value={metrics.total.toString()}
            subtext={user?.hostel ? `Authorized for ${user.hostel.toUpperCase()}` : 'Hostel residents'}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Registered Accounts"
            value={metrics.registered.toString()}
            subtext={`${metrics.completionRate}% registration rate`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Pending Signup"
            value={metrics.pending.toString()}
            subtext="Awaiting student self-registration"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Roster Integrity"
            value="100%"
            subtext="Pre-verified institution emails"
            icon={ShieldCheck}
            variant="default"
          />
        </div>

        {/* Boarder Master Directory Section */}
        <div className="card-base p-6 space-y-5">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                Resident Student Access Roster
              </h3>
              {/* <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pre-authorized students eligible to create an account and access mess facilities
              </p> */}
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roll, name, room, email..."
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

          {/* Filter Tabs by Registration Status */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Boarders', count: metrics.total },
              { id: 'REGISTERED', label: 'Registered Accounts', count: metrics.registered },
              { id: 'PENDING', label: 'Pending Registration', count: metrics.pending },
            ].map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-semibold rounded-full ${
                      active
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
                  <th className="w-10 py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all visible boarders"
                      checked={isAllVisibleSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeVisibleSelected;
                      }}
                      onChange={toggleSelectAllVisible}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-950 dark:focus:ring-zinc-100 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                    />
                  </th>
                  <th className="py-3 px-3">Roll Number</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3">Institution Email ID</th>
                  <th className="py-3 px-3 text-center">Registration Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredBoarders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <AlertCircle className="w-6 h-6 mx-auto text-zinc-400" />
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">No boarders found</p>
                        <p className="text-[11px] text-zinc-400">
                          Try adjusting your search query or add a new boarder to the list.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBoarders.map((bdr) => {
                    const isSelected = selectedIds.has(bdr.id);
                    return (
                      <tr
                        key={bdr.id}
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group ${
                          isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/25' : ''
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td className="w-10 py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Select ${bdr.name}`}
                            checked={isSelected}
                            onChange={() => toggleSelectBoarder(bdr.id)}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-950 dark:focus:ring-zinc-100 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                          />
                        </td>

                        {/* Roll Number */}
                        <td className="py-3.5 px-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {bdr.rollNo}
                        </td>

                        {/* Student Name & Department */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-zinc-950 dark:text-zinc-100">
                            {bdr.name}
                          </div>
                          {bdr.department && (
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                              {bdr.department}
                            </div>
                          )}
                        </td>

                        {/* Room */}
                        <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          Room {bdr.room}
                        </td>

                        {/* Institution Email & Phone */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>{bdr.email}</span>
                          </span>
                          {bdr.phone && (
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              {bdr.phone}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          {bdr.isRegistered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Registered</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Pending Signup</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(bdr)}
                              title="Edit resident details"
                              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {bdr.isRegistered && (
                              <button
                                type="button"
                                onClick={() => setDeletingUserAccountBoarder(bdr)}
                                title="Delete registered user account"
                                className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeletingBoarder(bdr)}
                              title="Permanently Delete Boarder"
                              className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Boarder View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredBoarders.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                <AlertCircle className="w-6 h-6 mx-auto text-zinc-400 mb-1" />
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">No boarders found</p>
                <p className="text-[11px] text-zinc-400">Try adjusting your search query or add a new boarder.</p>
              </div>
            ) : (
              filteredBoarders.map((bdr) => {
                const isSelected = selectedIds.has(bdr.id);
                return (
                  <div
                    key={bdr.id}
                    className={`p-3.5 rounded-xl border transition-colors space-y-2.5 shadow-xs ${
                      isSelected
                        ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
                    }`}
                  >
                    {/* Card Header: Roll, Room, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${bdr.name}`}
                          checked={isSelected}
                          onChange={() => toggleSelectBoarder(bdr.id)}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-950 dark:focus:ring-zinc-100 cursor-pointer accent-zinc-900 dark:accent-zinc-100 shrink-0"
                        />
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                          {bdr.rollNo}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Room {bdr.room}</span>
                      </div>
                    {bdr.isRegistered ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Registered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  {/* Name and Email */}
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-zinc-950 dark:text-zinc-50">{bdr.name}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{bdr.email}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(bdr)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                    >
                      <Edit2 className="w-3 h-3 text-zinc-400" />
                      <span>Edit</span>
                    </button>
                    {bdr.isRegistered && (
                      <button
                        type="button"
                        onClick={() => setDeletingUserAccountBoarder(bdr)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                      >
                        <UserX className="w-3 h-3" />
                        <span>Delete User</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingBoarder(bdr)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Permanently Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      </div>

      {/* Add Single Boarder Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Hostel Boarder"
          subtitle={`Authorize student residency for ${user?.hostel ? `${user.hostel.toUpperCase()} Hostel` : 'Hostel'}`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Check}
                onClick={handleSaveBoarder}
              >
                Save Boarder
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveBoarder} className="space-y-3.5">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Roll Number */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                University Roll Number *
              </label>
              <input
                type="text"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                placeholder="e.g. 24CS099"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 font-mono"
                required
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arunav Das"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                required
              />
            </div>

            {/* Room Number */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Allocated Room Number *
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g. 112"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                required
              />
            </div>

            {/* Institution Email */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Institution Email ID *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. arunav.cs24@tezu.ac.in"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 font-mono"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Academic Department (Optional)
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
              >
                <option value="">Select Academic Department (Optional)</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Contact Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 94350 12345"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Boarder Modal */}
      {editingBoarder && (
        <Modal
          isOpen={!!editingBoarder}
          onClose={() => setEditingBoarder(null)}
          title="Edit Boarder Details"
          subtitle={`Editing record for ${editingBoarder.name} (${editingBoarder.rollNo})`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingBoarder(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Check}
                onClick={handleUpdateBoarder}
              >
                Update Details
              </Button>
            </div>
          }
        >
          <form onSubmit={handleUpdateBoarder} className="space-y-3.5">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Roll Number
              </label>
              <input
                type="text"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Room Number
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Institution Email ID
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Academic Department (Optional)
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
              >
                <option value="">Select Academic Department (Optional)</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Contact Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 94350 12345"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          title="Bulk Import Hostel Boarders"
          subtitle="Paste multi-line records or import CSV data"
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={handleProcessBulkImport}
              >
                Import Records
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Import Mode Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setImportMode('file')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  importMode === 'file'
                    ? 'border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-zinc-50'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Upload File (.csv)
              </button>
              <button
                type="button"
                onClick={() => setImportMode('text')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  importMode === 'text'
                    ? 'border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-zinc-50'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Paste CSV Text
              </button>
            </div>

            {bulkError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{bulkError}</span>
              </div>
            )}

            {importMode === 'file' ? (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-900/30"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-600 dark:text-zinc-300 mb-2.5">
                    <FileUp className="w-5 h-5" />
                  </div>
                  {uploadedFileName ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Selected: {uploadedFileName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Click or drag another file to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Comma-separated .csv or .txt file (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                {bulkText && (
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      <span>Data Preview</span>
                      <span className="font-mono text-zinc-500">
                        {bulkText.split('\n').filter((l) => l.trim().length > 0).length} records ready
                      </span>
                    </div>
                    <pre className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 max-h-28 overflow-y-auto whitespace-pre-wrap">
                      {bulkText.split('\n').slice(0, 5).join('\n')}
                      {bulkText.split('\n').length > 5 ? '\n... and more' : ''}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Paste comma-separated rows. Line format:
                  <br />
                  <code className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200">
                    RollNo, Full Name, Room No, Institution Email, [Department], [Phone No]
                  </code>
                </p>

                <textarea
                  rows={7}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`24CS101, Tapan Baruah, 105, tapan.cs24@tezu.ac.in\n24EC102, Rimjim Sharma, 209, rimjim.ec24@tezu.ac.in`}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBoarder && (
        <Modal
          isOpen={!!deletingBoarder}
          onClose={() => setDeletingBoarder(null)}
          title="Permanently Delete Boarder?"
          subtitle={`Are you sure you want to permanently delete ${deletingBoarder.name} (${deletingBoarder.rollNo}) from the roster?`}
          maxWidth="max-w-sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingBoarder(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleConfirmDelete}
              >
                Permanently Delete
              </Button>
            </div>
          }
        >
          <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <p>
              Removing this student from the master roster will revoke their authorization to register or access
              mess ledger billing for <strong>{user?.hostel ? `${user.hostel.toUpperCase()} Hostel` : 'the hostel'}</strong>.
            </p>
          </div>
        </Modal>
      )}

      {/* Delete Registered User Account Modal (Admin Only) */}
      {deletingUserAccountBoarder && (
        <Modal
          isOpen={!!deletingUserAccountBoarder}
          onClose={() => setDeletingUserAccountBoarder(null)}
          title="Delete Resident User Account"
          subtitle={`Delete user credentials and data for ${deletingUserAccountBoarder.name}?`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingUserAccountBoarder(null)}
                disabled={isDeletingUserAccount}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={UserX}
                loading={isDeletingUserAccount}
                onClick={handleConfirmDeleteUserAccount}
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
                <p className="font-semibold">Administrator Privileges Enforced</p>
                <p className="text-[11px] leading-relaxed">
                  Deleting this user account will revoke student login access, cancel all pending/active mess bills, and reset their roster registration status.
                </p>
              </div>
            </div>
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 font-mono text-[11px]">
              <div><strong>Student:</strong> {deletingUserAccountBoarder.name}</div>
              <div><strong>Roll Number:</strong> {deletingUserAccountBoarder.rollNo}</div>
              <div><strong>Email:</strong> {deletingUserAccountBoarder.email}</div>
              <div><strong>Hostel & Room:</strong> {deletingUserAccountBoarder.hostel} â€¢ Room {deletingUserAccountBoarder.room}</div>
            </div>
          </div>
        </Modal>
      )}
      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-[72px] md:bottom-6 inset-x-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="pointer-events-auto bg-zinc-900 dark:bg-zinc-850 text-white rounded-2xl shadow-2xl border border-zinc-700/60 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 max-w-2xl w-full">
            <div className="flex items-center justify-between sm:justify-start gap-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-zinc-800 text-zinc-100 text-xs font-bold font-mono">
                  {selectedIds.size}
                </span>
                <span className="text-xs font-medium text-zinc-200">
                  {selectedIds.size === 1 ? '1 student selected' : `${selectedIds.size} students selected`}
                </span>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-2 ml-1"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Bulk Delete User Accounts Button */}
              <button
                type="button"
                disabled={selectedRegisteredBoarders.length === 0}
                onClick={() => setIsBulkDeleteUserModalOpen(true)}
                title={
                  selectedRegisteredBoarders.length === 0
                    ? 'None of the selected students have registered user accounts'
                    : `Delete accounts for ${selectedRegisteredBoarders.length} registered student(s)`
                }
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedRegisteredBoarders.length === 0
                    ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-400'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-rose-300 hover:text-rose-200 border border-zinc-700 shadow-xs'
                }`}
              >
                <UserX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Delete Accounts ({selectedRegisteredBoarders.length})</span>
              </button>

              {/* Bulk Permanently Delete Button */}
              <button
                type="button"
                onClick={() => setIsBulkRemoveRosterModalOpen(true)}
                title={`Permanently delete ${selectedIds.size} student(s) from hostel roster`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Permanently Delete ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete User Accounts Modal */}
      {isBulkDeleteUserModalOpen && (
        <Modal
          isOpen={isBulkDeleteUserModalOpen}
          onClose={() => setIsBulkDeleteUserModalOpen(false)}
          title="Delete Resident User Accounts"
          subtitle={`Revoke user credentials for ${selectedRegisteredBoarders.length} registered resident(s)`}
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkDeleteUserModalOpen(false)}
                disabled={isBulkDeletingUsers}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={UserX}
                loading={isBulkDeletingUsers}
                onClick={handleConfirmBulkDeleteUsers}
              >
                Delete Accounts ({selectedRegisteredBoarders.length})
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Administrator Privileges Enforced</p>
                <p className="text-[11px] leading-relaxed">
                  Deleting these registered user accounts will revoke student login access, cancel all pending/active mess bills, and reset their roster registration status to Pending Signup.
                </p>
              </div>
            </div>

            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Affected Registered Students ({selectedRegisteredBoarders.length}):
            </p>
            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-900/50">
              {selectedRegisteredBoarders.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-[11px] p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{b.name}</span>{' '}
                    <span className="text-zinc-500">({b.rollNo})</span>
                    <div className="text-[10px] text-zinc-400 font-sans truncate">{b.email}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 font-sans">
                    Room {b.room}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Permanently Delete Modal */}
      {isBulkRemoveRosterModalOpen && (
        <Modal
          isOpen={isBulkRemoveRosterModalOpen}
          onClose={() => setIsBulkRemoveRosterModalOpen(false)}
          title="Permanently Delete Boarders"
          subtitle={`Are you sure you want to permanently delete ${selectedIds.size} student(s) from the hostel roster?`}
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkRemoveRosterModalOpen(false)}
                disabled={isBulkRemovingRoster}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                loading={isBulkRemovingRoster}
                onClick={handleConfirmBulkRemoveFromRoster}
              >
                Permanently Delete ({selectedIds.size})
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Hostel Roster Deletion Warning</p>
                <p className="text-[11px] leading-relaxed">
                  Removing these students from the master roster will revoke their residency authorization for{' '}
                  <strong>{user?.hostel ? `${user.hostel.toUpperCase()} Hostel` : 'this hostel'}</strong>. Any
                  registered student user accounts linked to them will also be deleted, and room occupancy will be updated.
                </p>
              </div>
            </div>

            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Selected Students ({selectedBoarders.length}):
            </p>
            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-900/50">
              {selectedBoarders.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-[11px] p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{b.name}</span>{' '}
                    <span className="text-zinc-500">({b.rollNo})</span>
                    <div className="text-[10px] text-zinc-400 font-sans truncate">{b.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-sans">
                      Room {b.room}
                    </span>
                    {b.isRegistered ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-sans font-medium">
                        Registered
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-sans">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
