import api, { isMockMode, simulateDelay } from './api';
import { MOCK_CURRENT_BILL } from './mockData';

const BILL_STORAGE_KEY = 'messledger_current_bill_v3';

export const billService = {
  /**
   * Retrieves the current month's bill summary (Base bill, dues, fine, status)
   */
  async getCurrentBill() {
    if (isMockMode) {
      await simulateDelay(300);
      const saved = localStorage.getItem(BILL_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
      return MOCK_CURRENT_BILL;
    }

    try {
      const bill = await api.get('/bills/current');
      return bill || null;
    } catch (error) {
      console.warn('No active bill found or failed to load:', error.message);
      return null;
    }
  },

  /**
   * Generates hostel bills in bulk or for a single student (Admin only)
   */
  async generateBills(billData) {
    return await api.post('/bills/generate', billData);
  },

  /**
   * Retrieves all bills for current user or admin hostel
   */
  async getBills() {
    return await api.get('/bills');
  },

  /**
   * Dispatches automated payment reminders to all students with outstanding balances (Admin only)
   */
  async notifyDefaulters() {
    return await api.post('/bills/notify-defaulters');
  },

  /**
   * Updates current bill locally after successful payment
   */
  updateLocalBillAfterPayment(paidAmount) {
    const current = JSON.parse(localStorage.getItem(BILL_STORAGE_KEY) || JSON.stringify(MOCK_CURRENT_BILL));
    const newPaidAmount = (current.paidAmount || 0) + paidAmount;
    const newTotalPayable = Math.max(0, current.totalPayable - paidAmount);
    const newDueAmount = newTotalPayable === 0 ? 0 : Math.max(0, current.dueAmount - Math.max(0, paidAmount - (current.previousDue || 0) - (current.lateFine || 0)));
    const newPreviousDue = newTotalPayable === 0 ? 0 : Math.max(0, (current.previousDue || 0) - paidAmount);
    const newLateFine = newTotalPayable === 0 ? 0 : current.lateFine;

    const updated = {
      ...current,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      previousDue: newPreviousDue,
      lateFine: newLateFine,
      totalPayable: newTotalPayable,
      status: newTotalPayable === 0 ? 'PAID' : 'DUE',
    };

    localStorage.setItem(BILL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Reset local bill mock data
   */
  resetLocalBill() {
    localStorage.removeItem(BILL_STORAGE_KEY);
  },
};
