import { NextResponse } from 'next/server';
import { logout } from '@/app/lib/auth';

export async function POST(request) {
  try {
    await logout();
    
    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

// Also support GET requests for convenience
export async function GET(request) {
  try {
    await logout();
    
    // Redirect to login page after logout
    return NextResponse.redirect(new URL('/auth/login', request.url));
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
} 