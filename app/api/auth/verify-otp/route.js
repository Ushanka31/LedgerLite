import { NextResponse } from 'next/server';
import { verifyOTP, loginUser } from '@/app/lib/auth';
import { headers } from 'next/headers';

export async function POST(request) {
  try {
    const { phoneNumber, code, name, email } = await request.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const verifyResult = await verifyOTP(phoneNumber, code);

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Get device info from headers
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const deviceInfo = {
      userAgent,
      timestamp: new Date().toISOString(),
    };

    // Login user with optional name and email for new users
    const userProfile = {};
    if (name) userProfile.name = name;
    if (email) userProfile.email = email;

    const { user, deviceToken } = await loginUser(phoneNumber, deviceInfo, userProfile);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 