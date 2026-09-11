import React, { useState } from 'react';
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  FileText,
  CheckCircle2,
  Download,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export const TransactionHistory = ({ transactions = [] }) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Transaction History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent mess dues and ledger credit settlements
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('CREDIT')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'CREDIT'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Payments
          </button>
          <button
            type="button"
            onClick={() => setFilter('DEBIT')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'DEBIT'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-3">Date / Month</th>
              <th className="py-3 px-3">Description</th>
              <th className="py-3 px-3">Reference / Method</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedTxns.map((txn) => {
              const isCredit = txn.type === 'CREDIT';
              return (
                <tr
                  key={txn.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {txn.month}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatDate(txn.date)}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1.5 rounded-lg ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {txn.title}
                        </span>
                        {txn.notes && (
                          <p className="text-[10px] text-slate-400">{txn.notes}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {txn.referenceId}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {txn.method.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span
                      className={`font-bold text-sm ${
                        isCredit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isCredit
                        ? `-${formatCurrency(txn.amount)}`
                        : formatCurrency(txn.amount)}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTxn(txn)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                      title="View Receipt"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (Transforms into mobile cards per Section 2 & 41) */}
      <div className="sm:hidden space-y-3 mt-4">
        {displayedTxns.map((txn) => {
          const isCredit = txn.type === 'CREDIT';
          return (
            <div
              key={txn.id}
              onClick={() => setSelectedTxn(txn)}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`p-2 rounded-xl shrink-0 ${
                    isCredit
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-slate-200/60 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isCredit ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {txn.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {txn.month} • {formatDate(txn.date)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-sm font-bold ${
                    isCredit
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {isCredit
                    ? `-${formatCurrency(txn.amount)}`
                    : formatCurrency(txn.amount)}
                </div>
                <span className="text-[10px] text-slate-400 uppercase">
                  {txn.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / View All Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Showing {displayedTxns.length} of {transactions.length} ledger entries
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllModal(true)}
        >
          View All Transactions
        </Button>
      </div>

      {/* View Receipt Modal */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title="Transaction Receipt"
          subtitle={`Reference: ${selectedTxn.referenceId}`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTxn(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => {
                  window.print();
                }}
              >
                Print / Save Receipt
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-slate-400">Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatCurrency(selectedTxn.amount)}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{selectedTxn.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400">Transaction Type</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedTxn.type === 'CREDIT' ? 'Payment Settlement' : 'Billing Assessment'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Payment Method</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedTxn.method}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Billing Period</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedTxn.month}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Processed At</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatDate(selectedTxn.date)}
                </p>
              </div>
            </div>

            {selectedTxn.notes && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Ledger Remarks</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  {selectedTxn.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* View All Transactions Modal */}
      {showAllModal && (
        <Modal
          isOpen={showAllModal}
          onClose={() => setShowAllModal(false)}
          title="Complete Mess Ledger History"
          subtitle="All transactions and monthly billing statements"
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
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 -mx-6 px-6">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {txn.title}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {txn.month} • {formatDate(txn.date)} • Ref: {txn.referenceId}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold text-sm ${
                      txn.type === 'CREDIT'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
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
