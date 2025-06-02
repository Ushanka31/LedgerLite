import { NextResponse } from 'next/server';
import { sendOTP } from '@/app/lib/auth';
import { validatePhoneNumber } from '@/app/lib/utils';
import { db } from '@/app/lib/db';
import { users } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use Nigerian format (e.g., 08012345678)' },
        { status: 400 }
      );
    }

    // Check database connection first
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Database configuration error. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    // Send OTP
    const result = await sendOTP(phoneNumber);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'OTP sent successfully',
      isNewUser: !existingUser, // Tell frontend if this is a new user
      // Include OTP in development mode for easy testing
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    
    // Provide more specific error messages based on the error type
    if (error.message?.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your internet connection.' },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('DATABASE_URL')) {
      return NextResponse.json(
        { error: 'Database configuration error. Please check environment variables.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 