import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { 
  accounts, 
  journalEntries, 
  journalLines, 
  invoices, 
  invoiceItems, 
  expenses,
  customers 
} from '@/app/lib/db/schema';
import { requireAuth } from '@/app/lib/auth';

export async function POST(request) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    const { type, items } = await request.json();

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid sync request' },
        { status: 400 }
      );
    }

    const results = [];

    for (const item of items) {
      try {
        let result;
        
        switch (type) {
          case 'accounts':
            result = await syncAccount(item.data, user);
            break;
            
          case 'journalEntries':
            result = await syncJournalEntry(item.data, user);
            break;
            
          case 'invoices':
            result = await syncInvoice(item.data, user);
            break;
            
          case 'expenses':
            result = await syncExpense(item.data, user);
            break;
            
          case 'customers':
            result = await syncCustomer(item.data, user);
            break;
            
          default:
            throw new Error(`Unknown sync type: ${type}`);
        }
        
        results.push({ 
          id: item.id, 
          success: true, 
          data: result 
        });
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        results.push({ 
          id: item.id, 
          success: false, 
          error: error.message 
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results 
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

async function syncAccount(data, user) {
  const [account] = await db.insert(accounts).values({
    ...data,
    id: data.id || undefined, // Use provided ID or let DB generate
  }).returning();
  
  return account;
}

async function syncJournalEntry(data, user) {
  const { entry, lines } = data;
  
  // Insert journal entry
  const [journalEntry] = await db.insert(journalEntries).values({
    ...entry,
    id: entry.id || undefined,
    createdBy: user.id,
  }).returning();
  
  // Insert journal lines
  const journalLineData = lines.map(line => ({
    ...line,
    journalEntryId: journalEntry.id,
  }));
  
  const insertedLines = await db.insert(journalLines)
    .values(journalLineData)
    .returning();
  
  return { entry: journalEntry, lines: insertedLines };
}

async function syncInvoice(data, user) {
  const { invoice, items } = data;
  
  // Insert invoice
  const [insertedInvoice] = await db.insert(invoices).values({
    ...invoice,
    id: invoice.id || undefined,
    createdBy: user.id,
  }).returning();
  
  // Insert invoice items
  const itemData = items.map(item => ({
    ...item,
    invoiceId: insertedInvoice.id,
  }));
  
  const insertedItems = await db.insert(invoiceItems)
    .values(itemData)
    .returning();
  
  return { invoice: insertedInvoice, items: insertedItems };
}

async function syncExpense(data, user) {
  const [expense] = await db.insert(expenses).values({
    ...data,
    id: data.id || undefined,
    createdBy: user.id,
  }).returning();
  
  return expense;
}

async function syncCustomer(data, user) {
  const [customer] = await db.insert(customers).values({
    ...data,
    id: data.id || undefined,
  }).returning();
  
  return customer;
} 