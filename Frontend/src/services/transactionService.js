import api, { isMockMode, simulateDelay } from './api';
import { MOCK_TRANSACTIONS } from './mockData';

const TXN_STORAGE_KEY = 'messledger_transactions';

export const transactionService = {
  /**
   * Fetches user's transaction ledger history
   */
  async getTransactions() {
    const normalize = (txns) =>
      (txns || []).map((t) => ({
        ...t,
        status: t.status === 'PENDING' ? 'FAILED' : (t.status || 'SUCCESS'),
      }));

    if (isMockMode) {
      await simulateDelay(300);
      const saved = localStorage.getItem(TXN_STORAGE_KEY);
      if (saved) {
        try {
          return normalize(JSON.parse(saved));
        } catch {
          // fallback
        }
      }
      return normalize(MOCK_TRANSACTIONS);
    }

    try {
      const response = await api.get('/transactions');
      return normalize(response);
    } catch (error) {
      console.warn('Using fallback transactions:', error.message);
      const saved = localStorage.getItem(TXN_STORAGE_KEY);
      return normalize(saved ? JSON.parse(saved) : MOCK_TRANSACTIONS);
    }
  },

  /**
   * Appends a new credit transaction after successful payment
   */
  addTransaction(txn) {
    const existing = JSON.parse(
      localStorage.getItem(TXN_STORAGE_KEY) || JSON.stringify(MOCK_TRANSACTIONS)
    );
    const updated = [txn, ...existing];
    localStorage.setItem(TXN_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Reset local transactions
   */
  resetTransactions() {
    localStorage.removeItem(TXN_STORAGE_KEY);
  },
};
