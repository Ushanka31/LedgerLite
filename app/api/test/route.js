import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Not authenticated',
          message: 'No valid session found',
          authenticated: false 
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication working!',
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        companyId: user.companyId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error.message,
        authenticated: false 
      },
      { status: 500 }
    );
  }
} 