import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { journalEntries, journalLines, accounts } from '@/app/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range based on period or custom dates
    const getDateRange = (period, customStart, customEnd) => {
      // If custom dates are provided, use them with proper timezone handling
      if (customStart && customEnd) {
        // Parse dates and set to start/end of day in local timezone
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
        case 'today':
          return {
            start: today,
            end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
          };
          
        case 'week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return { start: startOfWeek, end: now };
        
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return { start: startOfMonth, end: now };
        
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          return { start: quarterStart, end: now };
        
        case 'year':
        case 'ytd':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return { start: startOfYear, end: now };
        
        case 'all':
          return { start: new Date('2020-01-01'), end: now };
        
        default:
          return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      }
    };

    const { start, end } = getDateRange(period, startDate, endDate);

    // Get revenue transactions
    const getRevenueTransactions = async (startDate, endDate) => {
      const results = await db
        .select({
          entryId: journalEntries.id,
          entryDate: journalEntries.entryDate,
          reference: journalEntries.reference,
          narration: journalEntries.narration,
          amount: journalLines.credit,
        })
        .from(journalEntries)
        .innerJoin(journalLines, eq(journalLines.journalEntryId, journalEntries.id))
        .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
        .where(
          and(
            eq(journalEntries.companyId, user.companyId),
            eq(accounts.type, 'revenue'),
            gte(journalEntries.entryDate, startDate),
            lte(journalEntries.entryDate, endDate)
          )
        )
        .orderBy(desc(journalEntries.entryDate));

      return results
        .filter(row => parseFloat(row.amount) > 0)
        .map(row => ({
          id: row.entryId,
          amount: parseFloat(row.amount),
          date: row.entryDate,
          reference: row.reference,
          description: row.narration,
        }));
    };

    const revenueTransactions = await getRevenueTransactions(start, end);

    // Get previous period for growth calculation
    const getPreviousPeriod = (period, start) => {
      const diff = end.getTime() - start.getTime();
      return {
        start: new Date(start.getTime() - diff),
        end: new Date(start.getTime())
      };
    };

    const { start: prevStart, end: prevEnd } = getPreviousPeriod(period, start);
    const previousRevenueTransactions = await getRevenueTransactions(prevStart, prevEnd);

    // Calculate totals
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const previousRevenue = previousRevenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate growth rate
    let growth = 0;
    if (previousRevenue > 0) {
      growth = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
    } else if (totalRevenue > 0) {
      growth = 100;
    }

    // Calculate average order value
    const averageOrder = revenueTransactions.length > 0 
      ? totalRevenue / revenueTransactions.length 
      : 0;

    // Generate chart data with proper timezone handling
    const generateChartData = (transactions, period, start, end) => {
      const data = [];
      const dayMs = 24 * 60 * 60 * 1000;
      
      // Create transaction map using local date keys
      const transactionMap = new Map();
      transactions.forEach(t => {
        const transactionDate = new Date(t.date);
        // Use local date components to avoid timezone shifts
        const year = transactionDate.getFullYear();
        const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const day = String(transactionDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        
        if (!transactionMap.has(dateKey)) {
          transactionMap.set(dateKey, 0);
        }
        transactionMap.set(dateKey, transactionMap.get(dateKey) + t.amount);
      });
      
      // Determine aggregation level based on date range
      const diffDays = Math.ceil((end - start) / dayMs);
      const useCustomPeriod = (startDate && endDate) || period === 'custom' || period === 'all';
      
      if (useCustomPeriod && diffDays <= 31) {
        // Daily aggregation for short custom ranges
        for (let i = 0; i <= diffDays; i++) {
          const currentDate = new Date(start.getTime() + i * dayMs);
          if (currentDate > end) break;
          
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          data.push({
            label: currentDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            }),
            value: transactionMap.get(dateKey) || 0,
            date: currentDate.toISOString()
          });
        }
      } else if (period === 'month') {
        // Daily data for current month
        let currentDate = new Date(start);
        
        while (currentDate <= end && currentDate.getMonth() === start.getMonth()) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          data.push({
            label: currentDate.getDate().toString(),
            value: transactionMap.get(dateKey) || 0,
            date: currentDate.toISOString()
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (period === 'week') {
        // Daily data for the week
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(start.getTime() + i * dayMs);
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          data.push({
            label: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
            value: transactionMap.get(dateKey) || 0,
            date: currentDate.toISOString()
          });
        }
      } else {
        // Monthly aggregation for longer periods
        let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
        
        while (currentDate <= end) {
          const monthStart = new Date(currentDate);
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          const actualEnd = new Date(Math.min(monthEnd.getTime(), end.getTime()));
          
          let monthRevenue = 0;
          for (let currentDay = new Date(Math.max(monthStart.getTime(), start.getTime())); 
               currentDay <= actualEnd; 
               currentDay.setDate(currentDay.getDate() + 1)) {
            
            const year = currentDay.getFullYear();
            const month = String(currentDay.getMonth() + 1).padStart(2, '0');
            const day = String(currentDay.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            monthRevenue += transactionMap.get(dateKey) || 0;
          }
          
          data.push({
            label: monthStart.toLocaleDateString('en-US', { 
              month: 'short',
              year: currentDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            }),
            value: monthRevenue,
            date: monthStart.toISOString()
          });
          
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
      
      return data;
    };

    const chartData = generateChartData(
      revenueTransactions, 
      startDate && endDate ? 'custom' : period,
      start, 
      end
    );

    return NextResponse.json({
      success: true,
      chartData,
      totalRevenue,
      growth: Math.round(growth * 10) / 10,
      averageOrder,
      totalTransactions: revenueTransactions.length,
      period: startDate && endDate ? 'custom' : period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error.message
      },
      { status: 500 }
    );
  }
} 