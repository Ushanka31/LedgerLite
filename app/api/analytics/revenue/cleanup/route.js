import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { journalEntries, journalLines, accounts, invoices, invoiceItems } from '@/app/lib/db/schema';
import { eq, and, gte, lte, desc, isNull, notInArray, inArray } from 'drizzle-orm';

export async function GET(request) {
  try {
    const user = await requireAuth();
    
    console.log('=== REVENUE DATA ANALYSIS ===');
    
    // 1. Get all May 2025 revenue transactions
    const mayRevenue = await db
      .select({
        entryId: journalEntries.id,
        entryDate: journalEntries.entryDate,
        reference: journalEntries.reference,
        narration: journalEntries.narration,
        amount: journalLines.credit,
        createdAt: journalEntries.createdAt,
      })
      .from(journalEntries)
      .innerJoin(journalLines, eq(journalLines.journalEntryId, journalEntries.id))
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .where(
        and(
          eq(journalEntries.companyId, user.companyId),
          eq(accounts.type, 'revenue'),
          gte(journalEntries.entryDate, new Date('2025-05-01')),
          lte(journalEntries.entryDate, new Date('2025-05-31'))
        )
      )
      .orderBy(desc(journalEntries.entryDate));

    console.log('May 2025 revenue entries found:', mayRevenue.length);
    
    // 2. Get all current May 2025 invoices (use invoiceDate instead of createdAt for better matching)
    const mayInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
        createdAt: invoices.createdAt,
        dueDate: invoices.dueDate
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, user.companyId),
          gte(invoices.invoiceDate, new Date('2025-05-01')),
          lte(invoices.invoiceDate, new Date('2025-05-31'))
        )
      )
      .orderBy(desc(invoices.createdAt));

    console.log('May 2025 invoices found:', mayInvoices.length);
    
    // 3. Group revenue by date and analyze
    const revenueByDate = {};
    let totalRevenue = 0;
    
    mayRevenue.forEach(entry => {
      const dateKey = new Date(entry.entryDate).toISOString().split('T')[0];
      const amount = parseFloat(entry.amount);
      totalRevenue += amount;
      
      if (!revenueByDate[dateKey]) {
        revenueByDate[dateKey] = { entries: [], total: 0 };
      }
      revenueByDate[dateKey].entries.push({
        id: entry.entryId,
        amount: amount,
        reference: entry.reference,
        narration: entry.narration,
        createdAt: entry.createdAt
      });
      revenueByDate[dateKey].total += amount;
    });
    
    // 4. Identify potential orphaned entries AND date mismatches
    // Look for journal entries that reference invoice numbers that no longer exist
    const existingInvoiceNumbers = new Set(mayInvoices.map(inv => inv.invoiceNumber));
    const orphanedEntries = [];
    const suspiciousDates = [];
    const dateMismatches = [];
    
    // Create a map of invoice numbers to their dates for comparison
    const invoiceDateMap = new Map();
    mayInvoices.forEach(inv => {
      invoiceDateMap.set(inv.invoiceNumber, new Date(inv.invoiceDate).toISOString().split('T')[0]);
    });
    
    console.log('Existing invoice numbers:', Array.from(existingInvoiceNumbers));
    console.log('Invoice date map:', Object.fromEntries(invoiceDateMap));
    
    // Check ALL revenue entries, not just those on dates with multiple entries
    Object.entries(revenueByDate).forEach(([date, data]) => {
      // Mark dates with multiple entries as suspicious
      if (data.entries.length > 1) {
        suspiciousDates.push({ date, count: data.entries.length, total: data.total });
      }
      
      // Check each entry regardless of count
      data.entries.forEach(entry => {
        console.log(`Checking entry: ${entry.reference} on ${date} for ₦${entry.amount}`);
        
        // Check for PAY- prefixed references
        if (entry.reference && entry.reference.startsWith('PAY-')) {
          const invoiceNumber = entry.reference.replace('PAY-', '');
          console.log(`  PAY reference found: ${invoiceNumber}`);
          
          if (!existingInvoiceNumbers.has(invoiceNumber)) {
            orphanedEntries.push({
              ...entry,
              date,
              reason: `References deleted invoice ${invoiceNumber}`
            });
            console.log(`  -> ORPHANED: Invoice ${invoiceNumber} not found`);
          } else {
            // Check if journal entry date matches invoice date
            const expectedDate = invoiceDateMap.get(invoiceNumber);
            if (expectedDate && expectedDate !== date) {
              dateMismatches.push({
                ...entry,
                currentDate: date,
                expectedDate: expectedDate,
                invoiceNumber,
                reason: `Entry date ${date} doesn't match invoice date ${expectedDate}`
              });
              console.log(`  -> DATE MISMATCH: Expected ${expectedDate}, got ${date}`);
            } else {
              console.log(`  -> OK: Date matches or no expected date`);
            }
          }
        }
        
        // Check for company prefixed references (e.g., ABC-0001)
        else if (entry.reference && entry.reference.match(/^[A-Z]{3}-\d{4}$/)) {
          const invoiceNumber = entry.reference;
          console.log(`  Company prefix found: ${invoiceNumber}`);
          
          if (!existingInvoiceNumbers.has(invoiceNumber)) {
            orphanedEntries.push({
              ...entry,
              date,
              reason: `References deleted invoice ${invoiceNumber} (company format)`
            });
            console.log(`  -> ORPHANED: Invoice ${invoiceNumber} not found`);
          } else {
            // Check date mismatch for company format too
            const expectedDate = invoiceDateMap.get(invoiceNumber);
            if (expectedDate && expectedDate !== date) {
              dateMismatches.push({
                ...entry,
                currentDate: date,
                expectedDate: expectedDate,
                invoiceNumber,
                reason: `Entry date ${date} doesn't match invoice date ${expectedDate}`
              });
              console.log(`  -> DATE MISMATCH: Expected ${expectedDate}, got ${date}`);
            }
          }
        }
        
        // Check for entries that don't reference any specific invoice (potential old manual entries)
        else if (!entry.reference || (!entry.reference.includes('INV-') && !entry.reference.includes('PAY-') && !entry.reference.match(/^[A-Z]{3}-\d{4}$/))) {
          console.log(`  -> SUSPICIOUS: No clear invoice reference: "${entry.reference}"`);
          // These might be old manual revenue entries that should be reviewed
        }
      });
    });
    
    console.log(`Found ${orphanedEntries.length} orphaned entries and ${dateMismatches.length} date mismatches`);
    
    // 5. Calculate expected vs actual
    const expectedTransactions = [
      { date: '2025-05-28', amount: 53750, description: 'Recent invoice payment' },
      { date: '2025-05-29', amount: 1075, description: 'Recent invoice payment' }
    ];
    
    const expectedTotal = expectedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const discrepancy = totalRevenue - expectedTotal;
    
    // 6. Recommendations
    const recommendations = [];
    
    if (orphanedEntries.length > 0) {
      recommendations.push({
        type: 'cleanup_orphaned',
        description: `Remove ${orphanedEntries.length} orphaned journal entries from deleted invoices`,
        impact: `Will reduce revenue by ₦${orphanedEntries.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`
      });
    }
    
    if (dateMismatches.length > 0) {
      recommendations.push({
        type: 'fix_date_mismatches',
        description: `Fix ${dateMismatches.length} journal entries with incorrect dates`,
        impact: `Will move revenue to correct invoice dates`,
        details: dateMismatches.map(m => `${m.invoiceNumber}: ${m.currentDate} → ${m.expectedDate}`)
      });
    }
    
    if (suspiciousDates.length > 0) {
      recommendations.push({
        type: 'review_duplicates',
        description: `Review ${suspiciousDates.length} dates with multiple revenue entries`,
        dates: suspiciousDates.map(d => d.date)
      });
    }
    
    return NextResponse.json({
      success: true,
      analysis: {
        totalMayRevenue: totalRevenue,
        totalMayInvoices: mayInvoices.length,
        expectedTotal,
        discrepancy,
        suspiciousDates: suspiciousDates.length,
        orphanedEntries: orphanedEntries.length,
        dateMismatches: dateMismatches.length
      },
      revenueByDate: Object.entries(revenueByDate).map(([date, data]) => ({
        date,
        count: data.entries.length,
        total: data.total,
        entries: data.entries.map(e => ({
          id: e.id,
          amount: e.amount,
          reference: e.reference,
          narration: e.narration
        }))
      })).sort((a, b) => a.date.localeCompare(b.date)),
      invoices: mayInvoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: new Date(inv.invoiceDate).toISOString().split('T')[0],
        total: parseFloat(inv.totalAmount),
        status: inv.status,
        created: inv.createdAt.toISOString().split('T')[0]
      })),
      orphanedEntries: orphanedEntries.map(e => ({
        id: e.id,
        amount: e.amount,
        reference: e.reference,
        date: e.date,
        reason: e.reason
      })),
      dateMismatches: dateMismatches.map(e => ({
        id: e.id,
        amount: e.amount,
        reference: e.reference,
        currentDate: e.currentDate,
        expectedDate: e.expectedDate,
        invoiceNumber: e.invoiceNumber,
        reason: e.reason
      })),
      recommendations,
      expectedVsActual: expectedTransactions.map(expected => {
        const actual = revenueByDate[expected.date];
        return {
          date: expected.date,
          expected: expected.amount,
          actual: actual ? actual.total : 0,
          match: actual ? Math.abs(actual.total - expected.amount) <= 1 : false
        };
      })
    });

  } catch (error) {
    console.error('Revenue analysis error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { action, entryIds, dateCorrections } = await request.json();
    
    if (action === 'nuclear_cleanup') {
      console.log('=== NUCLEAR CLEANUP: Removing ALL business data ===');
      
      // Find all journal entries for this company (not just revenue)
      const allEntries = await db
        .select({
          entryId: journalEntries.id,
          reference: journalEntries.reference,
          narration: journalEntries.narration
        })
        .from(journalEntries)
        .where(eq(journalEntries.companyId, user.companyId));

      console.log(`Found ${allEntries.length} total journal entries to delete`);
      
      // Find all invoices for this company
      const allInvoices = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.companyId, user.companyId));

      console.log(`Found ${allInvoices.length} total invoices to delete`);
      
      if (allEntries.length === 0 && allInvoices.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No business data found to clean up',
          deletedEntries: 0,
          deletedLines: 0,
          deletedInvoices: 0,
          deletedInvoiceItems: 0
        });
      }
      
      let deletedLines = [];
      let deletedEntries = [];
      let deletedInvoiceItems = [];
      let deletedInvoices = [];
      
      // Delete all journal data if it exists
      if (allEntries.length > 0) {
        const entryIdsToDelete = allEntries.map(e => e.entryId);
        
        // Delete all journal lines for this company
        deletedLines = await db
          .delete(journalLines)
          .where(inArray(journalLines.journalEntryId, entryIdsToDelete))
          .returning();
        
        // Delete all journal entries for this company
        deletedEntries = await db
          .delete(journalEntries)
          .where(eq(journalEntries.companyId, user.companyId))
          .returning();
      }
      
      // Delete all invoice data if it exists
      if (allInvoices.length > 0) {
        const invoiceIds = allInvoices.map(inv => inv.id);
        
        // Delete all invoice items first
        deletedInvoiceItems = await db
          .delete(invoiceItems)
          .where(inArray(invoiceItems.invoiceId, invoiceIds))
          .returning();
        
        // Delete all invoices
        deletedInvoices = await db
          .delete(invoices)
          .where(eq(invoices.companyId, user.companyId))
          .returning();
      }
      
      console.log(`Nuclear cleanup complete: ${deletedEntries.length} entries, ${deletedLines.length} lines, ${deletedInvoices.length} invoices, ${deletedInvoiceItems.length} invoice items deleted`);
      
      return NextResponse.json({
        success: true,
        message: `🧹 Complete business reset successful! Removed all data: ${deletedEntries.length} journal entries, ${deletedLines.length} lines, ${deletedInvoices.length} invoices, ${deletedInvoiceItems.length} items. Your account is completely fresh!`,
        deletedEntries: deletedEntries.length,
        deletedLines: deletedLines.length,
        deletedInvoices: deletedInvoices.length,
        deletedInvoiceItems: deletedInvoiceItems.length
      });
    }
    
    if (action === 'cleanup_orphaned' && entryIds && Array.isArray(entryIds)) {
      // Delete orphaned journal lines first
      const deletedLines = await db
        .delete(journalLines)
        .where(inArray(journalLines.journalEntryId, entryIds))
        .returning();
      
      // Then delete the journal entries
      const deletedEntries = await db
        .delete(journalEntries)
        .where(and(
          eq(journalEntries.companyId, user.companyId),
          inArray(journalEntries.id, entryIds)
        ))
        .returning();
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${deletedEntries.length} orphaned journal entries`,
        deletedEntries: deletedEntries.length,
        deletedLines: deletedLines.length
      });
    }
    
    if (action === 'fix_date_mismatches' && dateCorrections && Array.isArray(dateCorrections)) {
      let fixedCount = 0;
      
      for (const correction of dateCorrections) {
        const { entryId, newDate } = correction;
        
        const updated = await db
          .update(journalEntries)
          .set({ 
            entryDate: new Date(newDate),
            updatedAt: new Date()
          })
          .where(and(
            eq(journalEntries.id, entryId),
            eq(journalEntries.companyId, user.companyId)
          ))
          .returning();
          
        if (updated.length > 0) {
          fixedCount++;
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Fixed ${fixedCount} journal entry dates`,
        fixedCount
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action or parameters' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Revenue cleanup error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
} 