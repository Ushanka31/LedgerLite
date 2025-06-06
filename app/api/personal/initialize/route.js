import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { initializePersonalAccountsForAllUsers } from '@/app/lib/initializePersonalAccounts';

export async function POST(request) {
  try {
    const user = await requireAuth();
    
    // You might want to restrict this to admin users only
    // For now, any authenticated user can trigger initialization
    
    const result = await initializePersonalAccountsForAllUsers();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Personal accounts initialization error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to initialize personal accounts' },
      { status: 500 }
    );
  }
} 