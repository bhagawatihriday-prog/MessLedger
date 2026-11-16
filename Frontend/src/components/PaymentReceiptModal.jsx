import React from 'react';
import {
  Download,
  Printer,
  CheckCircle2,
  Building,
  ShieldCheck,
  Calendar,
  CreditCard,
  User,
  X,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export const PaymentReceiptModal = ({
  isOpen,
  onClose,
  receipt,
}) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const txnId = receipt.transactionId || receipt.referenceId || `TXN_${Date.now()}`;
  const amount = parseFloat(receipt.amount || 0);
  const remainingBalance = parseFloat(receipt.remainingBalance || 0);
  const totalPayable = parseFloat(receipt.totalPayable || (amount + remainingBalance));
  const isPartial = receipt.paymentType === 'PARTIAL' || remainingBalance > 0;
  const dateStr = receipt.date || receipt.paidAt || new Date().toISOString();
  const method = (receipt.paymentMethod || receipt.method || 'ONLINE').toUpperCase().replace('_', ' ');
  const studentName = receipt.studentName || receipt.name || 'Resident Boarder';
  const rollNo = receipt.rollNo || receipt.roll_no || 'N/A';
  const room = receipt.room || 'N/A';
  const hostel = (receipt.hostel || 'Hostel').toUpperCase();
  const department = receipt.department || 'Postgraduate & Undergraduate Studies';
  const billingMonth = receipt.billingMonth || receipt.month || 'Current Cycle';
  const status = receipt.status || 'SUCCESS';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Mess Fee Payment Receipt"
      subtitle="University Central Hostel Administration — Computer Generated Electronic Slip"
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full no-print">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Print / Save PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="printable-receipt text-xs space-y-4 font-sans bg-white text-zinc-900 p-2 sm:p-4 rounded-xl border border-zinc-200 shadow-xs">
        {/* University Header */}
        <div className="text-center pb-3 border-b-2 border-zinc-900/80 space-y-1">
          <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-700 tracking-wide uppercase">
            <Building className="w-3 h-3 text-zinc-600" />
            <span>Tezpur University • Central Hostel Management</span>
          </div>
          <h2 className="text-base font-extrabold tracking-tight text-zinc-950 uppercase mt-1">
            Mess Dues Payment Voucher / E-Receipt
          </h2>
          <p className="text-[10px] text-zinc-500 font-medium">
            Office of the Hostel Warden & Mess Committee • {hostel}
          </p>
        </div>

        {/* Receipt Meta & Verification Stamp Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
          <div className="space-y-0.5 text-[11px]">
            <div>
              <span className="text-zinc-500">Receipt No: </span>
              <strong className="font-mono text-zinc-900 font-bold">{txnId}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Issued On: </span>
              <span className="font-medium text-zinc-800">{formatDate(dateStr)}</span>
            </div>
            <div>
              <span className="text-zinc-500">Billing Cycle: </span>
              <strong className="text-zinc-900">{billingMonth}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Payment Status: </span>
              <strong className="text-emerald-700 font-semibold">{status === 'SUCCESS' ? 'SUCCESS (Verified & Credited)' : status}</strong>
            </div>
          </div>

          <div className={`border-2 rounded-lg px-3 py-1.5 text-center self-start sm:self-auto shrink-0 ${
            isPartial
              ? 'border-amber-600 bg-amber-50/70 text-amber-900'
              : 'border-emerald-600 bg-emerald-50/60 text-emerald-800'
          }`}>
            <div className="flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wider">
              <CheckCircle2 className={`w-3.5 h-3.5 ${isPartial ? 'text-amber-600' : 'text-emerald-600'}`} />
              <span>{isPartial ? 'PARTIAL SETTLEMENT' : (status === 'SUCCESS' ? 'PAID & VERIFIED' : status)}</span>
            </div>
            <div className={`text-[9px] font-mono tracking-tight mt-0.5 ${isPartial ? 'text-amber-700' : 'text-emerald-700'}`}>
              HOSTEL MESS ACCOUNT
            </div>
          </div>
        </div>

        {/* Boarder Details Grid */}
        <div className="rounded-lg border border-zinc-200 overflow-hidden">
          <div className="bg-zinc-100/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 border-b border-zinc-200">
            Student Boarder Particulars
          </div>
          <div className="grid grid-cols-2 p-3 gap-y-2 gap-x-4 text-[11px]">
            <div>
              <span className="text-zinc-500 block text-[10px]">Student Name</span>
              <span className="font-semibold text-zinc-900">{studentName}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">University Roll No</span>
              <span className="font-mono font-bold text-zinc-900">{rollNo}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Hostel & Room</span>
              <span className="font-medium text-zinc-800">{hostel} • Room {room}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Academic Department</span>
              <span className="font-medium text-zinc-800 truncate block">{department}</span>
            </div>
          </div>
        </div>

        {/* Payment Particulars Table */}
        <div className="rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Mode</th>
                <th className="py-2 px-3 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-zinc-900">
                    Hostel Mess Dues Settlement {isPartial && '(Partial Allocation)'}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {isPartial
                      ? 'Settles oldest outstanding arrears in FIFO order'
                      : 'Settlement for monthly boarding and cumulative mess arrears'}
                  </div>
                </td>
                <td className="py-2.5 px-3 font-medium text-zinc-700">
                  {method}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-zinc-950 font-mono text-xs">
                  {formatCurrency(amount)}
                </td>
              </tr>
              <tr className="bg-zinc-50 font-bold">
                <td colSpan={2} className="py-2.5 px-3 text-right text-zinc-700 uppercase text-[10px]">
                  Total Amount Paid & Credited
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700 font-mono text-sm">
                  {formatCurrency(amount)}
                </td>
              </tr>
              {isPartial && remainingBalance > 0 && (
                <tr className="bg-amber-50/50 text-amber-900 font-semibold">
                  <td colSpan={2} className="py-2 px-3 text-right text-amber-800 uppercase text-[10px]">
                    Remaining Balance Carried Forward
                  </td>
                  <td className="py-2 px-3 text-right text-amber-800 font-mono text-xs">
                    {formatCurrency(remainingBalance)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Notes & Security Assurance */}
        <div className="pt-2 border-t border-zinc-200 text-[10px] text-zinc-500 space-y-1 leading-relaxed">
          <div className="flex items-center gap-1 text-zinc-700 font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Official Computer Generated E-Receipt</span>
          </div>
          <p>
            This official electronic document has been authenticated by the MessLedger automated billing engine. Valid for semester clearance, hostel deposit accounting, and scholarship fee submission. No physical signature is required.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentReceiptModal;
