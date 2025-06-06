import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getCurrentContext, setCurrentContext, getUserContexts, ContextType } from '@/app/lib/context';
import { ensurePersonalAccountsExist } from '@/app/lib/initializePersonalAccounts';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get current context
    const currentContext = await getCurrentContext();
    
    // Get all available contexts for the user
    const contexts = await getUserContexts(user.id);
    
    return NextResponse.json({
      success: true,
      current: currentContext,
      available: contexts
    });
  } catch (error) {
    console.error('Context fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch context' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { type, companyId } = await request.json();
    
    // Validate context type
    if (!Object.values(ContextType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid context type' },
        { status: 400 }
      );
    }
    
    // If switching to business context, verify user has access
    if (type === ContextType.BUSINESS && companyId) {
      const contexts = await getUserContexts(user.id);
      const hasAccess = contexts.businesses.some(b => b.id === companyId);
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }
    
    // If switching to personal context, ensure personal accounts exist
    if (type === ContextType.PERSONAL) {
      const initResult = await ensurePersonalAccountsExist();
      if (!initResult.success) {
        console.error('Failed to ensure personal accounts:', initResult.error);
      }
    }
    
    // Set the new context
    const newContext = await setCurrentContext(type, companyId);
    
    return NextResponse.json({
      success: true,
      context: newContext
    });
  } catch (error) {
    console.error('Context switch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to switch context' },
      { status: 500 }
    );
  }
} 