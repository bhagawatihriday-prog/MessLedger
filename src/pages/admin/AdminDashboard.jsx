import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Building2,
  Users,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PageContainer } from '../../components/layout/PageContainer';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState([
    { id: '1', rollNo: '22CS084', name: 'Bhargav Jyoti', room: '204', due: 450, fine: 100, status: 'DUE' },
    { id: '2', rollNo: '22EE012', name: 'Rohit Talukdar', room: '102', due: 0, fine: 0, status: 'PAID' },
    { id: '3', rollNo: '22ME045', name: 'Amitabh Baruah', room: '301', due: 2450, fine: 160, status: 'OVERDUE' },
    { id: '4', rollNo: '22CE033', name: 'Priyanku Gogoi', room: '205', due: 0, fine: 0, status: 'PAID' },
    { id: '5', rollNo: '22CS091', name: 'Deepshikha Kalita', room: '104', due: 450, fine: 0, status: 'DUE' },
  ]);

  const handleNotifyDefaulters = () => {
    toast.success('Sent automated fee due reminders to 3 students with outstanding balances.');
  };

  const handleExportLedger = () => {
    toast.success('Generated hostel ledger CSV report for September 2026.');
  };

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        {/* Admin Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                <Shield className="w-3 h-3" />
                Administrative Access
              </span>
              <span className="text-xs text-indigo-200/80">
                Hostel: {user?.hostel || 'LBBH'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Hostel Mess Superintendent Console
            </h1>
            <p className="mt-1 text-sm text-indigo-100/80">
              Oversee monthly meal bills, verify ledger reconciliations, and monitor fee collections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={FileSpreadsheet}
              onClick={handleExportLedger}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Export Ledger
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Send}
              onClick={handleNotifyDefaulters}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              Send Reminders
            </Button>
          </div>
        </div>

        {/* Aggregate Stat Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Billed"
            value="₹2,45,000"
            subtext="September 2026 (100 Students)"
            icon={Building2}
            variant="primary"
          />
          <StatCard
            title="Total Collected"
            value="₹1,84,500"
            subtext="75.3% fee collection rate"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Outstanding Dues"
            value="₹60,500"
            subtext="24 students with balances"
            icon={AlertCircle}
            variant="warning"
          />
          <StatCard
            title="Late Fines Assessed"
            value="₹3,200"
            subtext="₹20/day penalty pool"
            icon={DollarSign}
            variant="danger"
          />
        </div>

        {/* Student Ledger Roster Table */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Student Mess Ledger Roster ({user?.hostel || 'LBBH'})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live dues tracking across residential hostel rooms
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3">Roll No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3 text-right">Base Due</th>
                  <th className="py-3 px-3 text-right">Late Fine</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {st.rollNo}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {st.name}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      Room {st.room}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">
                      {formatCurrency(st.due)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-medium">
                      {formatCurrency(st.fine)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          st.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : st.status === 'OVERDUE'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
