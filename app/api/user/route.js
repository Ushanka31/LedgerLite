import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Not authenticated',
          message: 'No valid session found'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error.message
      },
      { status: 500 }
    );
  }
} 