import api, { isMockMode, simulateDelay } from './api';
import { MOCK_CURRENT_BILL, MOCK_BILLS_HISTORY } from '../mocks/bills';

const BILL_STORAGE_KEY = 'messledger_current_bill';

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
      return await api.get('/bills/current');
    } catch (error) {
      console.warn('Using fallback current bill:', error.message);
      const saved = localStorage.getItem(BILL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_CURRENT_BILL;
    }
  },

  /**
   * Retrieves historical bills for charting and ledger review
   */
  async getBillHistory() {
    if (isMockMode) {
      await simulateDelay(350);
      return MOCK_BILLS_HISTORY;
    }

    try {
      return await api.get('/bills/history');
    } catch (error) {
      console.warn('Using fallback bill history:', error.message);
      return MOCK_BILLS_HISTORY;
    }
  },

  /**
   * Updates current bill locally after successful payment
   */
  updateLocalBillAfterPayment(paidAmount) {
    const current = JSON.parse(localStorage.getItem(BILL_STORAGE_KEY) || JSON.stringify(MOCK_CURRENT_BILL));
    const newPaidAmount = current.paidAmount + paidAmount;
    const newDueAmount = Math.max(0, current.baseBill - newPaidAmount);
    const newTotalPayable = Math.max(0, current.totalPayable - paidAmount);
    const newLateFine = newDueAmount === 0 ? 0 : current.lateFine;

    const updated = {
      ...current,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      lateFine: newLateFine,
      totalPayable: newTotalPayable,
      status: newDueAmount === 0 && newLateFine === 0 ? 'PAID' : 'DUE',
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
