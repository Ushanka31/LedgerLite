import Dexie from 'dexie';

// Create the database
export const offlineDb = new Dexie('LedgerLiteOffline');

// Define the schema
offlineDb.version(1).stores({
  syncQueue: '++id, type, action, data, companyId, synced, createdAt',
  accounts: 'id, companyId, code, name, type, category, parentId',
  journalEntries: 'id, companyId, entryDate, reference, status',
  journalLines: 'id, journalEntryId, accountId',
  customers: 'id, companyId, name',
  invoices: 'id, companyId, invoiceNumber, customerId, status',
  invoiceItems: 'id, invoiceId',
  expenses: 'id, companyId, date, accountId',
  companies: 'id, name',
  users: 'id, phoneNumber',
});

// Sync Queue Actions
export const SyncActions = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

// Add to sync queue
export async function addToSyncQueue(type, action, data, companyId) {
  return await offlineDb.syncQueue.add({
    type,
    action,
    data,
    companyId,
    synced: false,
    createdAt: new Date().toISOString()
  });
}

// Get pending sync items
export async function getPendingSyncItems() {
  return await offlineDb.syncQueue
    .where('synced')
    .equals(false)
    .toArray();
}

// Mark items as synced
export async function markAsSynced(ids) {
  return await offlineDb.syncQueue
    .where('id')
    .anyOf(ids)
    .modify({ synced: true });
}

// Clear synced items
export async function clearSyncedItems() {
  return await offlineDb.syncQueue
    .where('synced')
    .equals(true)
    .delete();
}

// Offline-first data operations
export const offlineOperations = {
  // Save account offline
  async saveAccount(account) {
    await offlineDb.accounts.put(account);
    await addToSyncQueue('accounts', SyncActions.CREATE, account, account.companyId);
  },

  // Save journal entry with lines offline
  async saveJournalEntry(entry, lines) {
    await offlineDb.transaction('rw', offlineDb.journalEntries, offlineDb.journalLines, async () => {
      await offlineDb.journalEntries.put(entry);
      await offlineDb.journalLines.bulkPut(lines);
    });
    await addToSyncQueue('journalEntries', SyncActions.CREATE, { entry, lines }, entry.companyId);
  },

  // Save invoice with items offline
  async saveInvoice(invoice, items) {
    await offlineDb.transaction('rw', offlineDb.invoices, offlineDb.invoiceItems, async () => {
      await offlineDb.invoices.put(invoice);
      await offlineDb.invoiceItems.bulkPut(items);
    });
    await addToSyncQueue('invoices', SyncActions.CREATE, { invoice, items }, invoice.companyId);
  },

  // Save expense offline
  async saveExpense(expense) {
    await offlineDb.expenses.put(expense);
    await addToSyncQueue('expenses', SyncActions.CREATE, expense, expense.companyId);
  },

  // Get all accounts for a company
  async getAccounts(companyId) {
    return await offlineDb.accounts
      .where('companyId')
      .equals(companyId)
      .toArray();
  },

  // Get journal entries with lines
  async getJournalEntries(companyId, startDate, endDate) {
    const entries = await offlineDb.journalEntries
      .where('companyId')
      .equals(companyId)
      .filter(entry => {
        const date = new Date(entry.entryDate);
        return date >= startDate && date <= endDate;
      })
      .toArray();

    // Get lines for each entry
    for (const entry of entries) {
      entry.lines = await offlineDb.journalLines
        .where('journalEntryId')
        .equals(entry.id)
        .toArray();
    }

    return entries;
  },

  // Get invoices
  async getInvoices(companyId, status = null) {
    let query = offlineDb.invoices
      .where('companyId')
      .equals(companyId);
    
    if (status) {
      query = query.filter(invoice => invoice.status === status);
    }

    return await query.toArray();
  },

  // Get expenses
  async getExpenses(companyId, startDate, endDate) {
    return await offlineDb.expenses
      .where('companyId')
      .equals(companyId)
      .filter(expense => {
        const date = new Date(expense.date);
        return date >= startDate && date <= endDate;
      })
      .toArray();
  }
};

// Sync manager
export class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
  }

  async syncWithServer() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    try {
      const pendingItems = await getPendingSyncItems();
      
      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return;
      }

      // Group by type for batch processing
      const grouped = pendingItems.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      }, {});

      for (const [type, items] of Object.entries(grouped)) {
        try {
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, items }),
          });

          if (response.ok) {
            const syncedIds = items.map(item => item.id);
            await markAsSynced(syncedIds);
          }
        } catch (error) {
          console.error(`Error syncing ${type}:`, error);
        }
      }

      // Clear old synced items
      await clearSyncedItems();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  startAutoSync(intervalMs = 30000) { // 30 seconds default
    this.stopAutoSync();
    
    // Initial sync
    this.syncWithServer();
    
    // Set up interval
    this.syncInterval = setInterval(() => {
      this.syncWithServer();
    }, intervalMs);

    // Sync on online event
    window.addEventListener('online', () => {
      this.syncWithServer();
    });
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Create global sync manager instance
export const syncManager = new SyncManager(); 