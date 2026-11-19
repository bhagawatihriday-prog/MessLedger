import React, { useState } from 'react';
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Check,
  Download,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { Button } from './Button';
import { Modal } from './Modal';
import { useAuth } from '../context';
import { PaymentReceiptModal } from './PaymentReceiptModal';

export const TransactionHistory = ({ transactions = [] }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'CREDIT', 'DEBIT'
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);

  const filteredTxns = transactions.filter((t) => {
    if (filter === 'CREDIT') return t.type === 'CREDIT';
    if (filter === 'DEBIT') return t.type === 'DEBIT';
    return true;
  });

  const displayedTxns = filteredTxns.slice(0, 6);

  return (
    <div className="card-base p-6" id="ledger">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Transaction History
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Recent mess dues and payment settlements
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === 'ALL'
                ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('CREDIT')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === 'CREDIT'
                ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            Payments
          </button>
          <button
            type="button"
            onClick={() => setFilter('DEBIT')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === 'DEBIT'
                ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            Bills & Fines
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto mt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3">Date / Month</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3">Reference / Method</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {displayedTxns.map((txn) => {
              const isCredit = txn.type === 'CREDIT';
              return (
                <tr
                  key={txn.id}
                  className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {txn.month}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {formatDate(txn.date)}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {isCredit ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {txn.title}
                        </span>
                        {txn.notes && (
                          <p className="text-[11px] text-zinc-400">{txn.notes}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {txn.referenceId}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {txn.method.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {(() => {
                      const displayStatus = txn.status === 'PENDING' ? 'FAILED' : (txn.status || 'SUCCESS');
                      const isSuccess = displayStatus === 'SUCCESS';
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/50'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/40 dark:border-rose-700/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {displayStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold text-xs ${
                        isCredit
                          ? 'text-zinc-950 dark:text-zinc-50 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {isCredit
                        ? `-${formatCurrency(txn.amount)}`
                        : formatCurrency(txn.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTxn(txn)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="View Receipt"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-2 mt-3">
        {displayedTxns.map((txn) => {
          const isCredit = txn.type === 'CREDIT';
          return (
            <div
              key={txn.id}
              onClick={() => setSelectedTxn(txn)}
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                  {isCredit ? (
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {txn.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {txn.month} • {formatDate(txn.date)}
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <div className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                  {isCredit
                    ? `-${formatCurrency(txn.amount)}`
                    : formatCurrency(txn.amount)}
                </div>
                {(() => {
                  const displayStatus = txn.status === 'PENDING' ? 'FAILED' : (txn.status || 'SUCCESS');
                  const isSuccess = displayStatus === 'SUCCESS';
                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold uppercase ${
                        isSuccess
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {displayStatus}
                    </span>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / View All Action */}
      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {displayedTxns.length} of {transactions.length} entries
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllModal(true)}
        >
          View All Transactions
        </Button>
      </div>

      {/* Official Printable Payment Receipt Modal */}
      {selectedTxn && (
        <PaymentReceiptModal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          receipt={{
            transactionId: selectedTxn.referenceId,
            amount: selectedTxn.amount,
            date: selectedTxn.date,
            paymentMethod: selectedTxn.method,
            studentName: selectedTxn.studentName || user?.name,
            rollNo: selectedTxn.rollNo || user?.rollNo,
            hostel: selectedTxn.hostel || user?.hostel,
            room: selectedTxn.room || user?.room,
            department: user?.department,
            billingMonth: selectedTxn.month,
            status: selectedTxn.status,
            notes: selectedTxn.notes,
          }}
        />
      )}

      {/* View All Transactions Modal */}
      {showAllModal && (
        <Modal
          isOpen={showAllModal}
          onClose={() => setShowAllModal(false)}
          title="Complete Mess Ledger History"
          subtitle="All transactions and monthly statements"
          maxWidth="max-w-2xl"
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllModal(false)}
            >
              Done
            </Button>
          }
        >
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 -mx-6 px-6">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {txn.title}
                    </p>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full uppercase ${
                        txn.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {txn.status === 'PENDING' ? 'FAILED' : (txn.status || 'SUCCESS')}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    {txn.month} • {formatDate(txn.date)} • Ref: {txn.referenceId}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {txn.type === 'CREDIT' ? `-${formatCurrency(txn.amount)}` : formatCurrency(txn.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};
