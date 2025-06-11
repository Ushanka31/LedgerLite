import { cookies } from 'next/headers';
import { db } from './db';
import { users, authSessions } from './db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { validatePhoneNumber, toInternationalPhone } from './utils';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'ledgerlite_session';
const SESSION_DURATION_DAYS = 30;

// Generate device token
export function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send SMS via Termii
export async function sendSMS(phoneNumber, message) {
  const termiiKey = process.env.TERMII_API_KEY;
  const termiiSender = process.env.TERMII_SENDER_ID || 'N-Alert';

  // If we don't have a Termii key, simply log for dev convenience
  if (!termiiKey) {
    console.log('\n' + '='.repeat(60));
    console.log('📱 SMS MESSAGE (DEVELOPMENT MODE — no TERMII_API_KEY)');
    console.log('='.repeat(60));
    console.log(`📞 To: ${phoneNumber}`);
    console.log(`💬 Message: ${message}`);
    console.log('='.repeat(60) + '\n');
    return { success: true, dev: true };
  }

  try {
    const termiiUrl = 'https://api.ng.termii.com/api/sms/send';

    const response = await fetch(termiiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        from: termiiSender,
        sms: message,
        type: 'plain',
        api_key: termiiKey,
        channel: 'dnd', // Better delivery for Nigerian numbers
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Termii API Error:', errorData);
      throw new Error('Failed to send SMS');
    }

    const result = await response.json();
    console.log('✅ SMS sent via Termii:', result);
    return { success: true };
  } catch (error) {
    // Log error but allow app flow to continue
    console.error('SMS sending error, falling back to console log:', error);
    console.log(`FALLBACK SMS → ${phoneNumber}: ${message}`);
    return { success: true, fallback: true };
  }
}

// Send OTP via Termii OTP endpoint (Termii generates the code)
export async function sendOTP(phoneNumber) {
  // Validate phone number (basic sanity)
  if (!validatePhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format');
  }

  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) {
    throw new Error('TERMII_API_KEY not set in environment');
  }

  const termiiUrl = 'https://api.ng.termii.com/api/sms/otp/send';

  const intlPhone = toInternationalPhone(phoneNumber); // 2347...

  const payload = {
    api_key: apiKey,
    message_type: 'NUMERIC',
    to: intlPhone,
    from: process.env.TERMII_SENDER_ID || 'N-Alert',
    channel: 'dnd',
    pin_attempts: 3,
    pin_time_to_live: 5,
    pin_length: 6,
    pin_placeholder: '< 123456 >',
    message_text: 'Your LedgerLite verification code is < 123456 >',
    pin_type: 'NUMERIC',
  };

  try {
    const response = await fetch(termiiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Termii OTP send error:', result);
      return { success: false, error: result.message || 'Failed to send OTP' };
    }

    return { success: true, pinId: result.pinId };
  } catch (err) {
    console.error('Termii OTP send exception:', err);
    return { success: false, error: err.message };
  }
}

// Verify OTP via Termii verify endpoint
export async function verifyOTP(code, pinId) {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) {
    throw new Error('TERMII_API_KEY not set in environment');
  }

  const termiiUrl = 'https://api.ng.termii.com/api/sms/otp/verify';

  const payload = {
    api_key: apiKey,
    pin_id: pinId,
    pin: code,
  };

  try {
    const response = await fetch(termiiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Termii OTP verify error:', result);
      return { success: false, error: result.message || 'OTP verification failed' };
    }

    // Termii returns { verified: true/false } etc.
    if (result.verified === true || result.verification_status === 'VERIFIED' || result.smsStatus === 'Message Sent') {
      return { success: true };
    }

    return { success: false, error: 'Invalid or expired code' };
  } catch (err) {
    console.error('Termii OTP verify exception:', err);
    return { success: false, error: err.message };
  }
}

// Login or register user
export async function loginUser(phoneNumber, deviceInfo = {}, userProfile = {}) {
  // Check if user exists
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.phoneNumber, phoneNumber))
    .limit(1);
  
  // Create user if doesn't exist
  if (!user) {
    const newUserData = {
      phoneNumber,
      countryCode: '+234',
      role: 'owner', // First user is owner
    };

    // Add name and email if provided
    if (userProfile.name) newUserData.name = userProfile.name;
    if (userProfile.email) newUserData.email = userProfile.email;

    [user] = await db
      .insert(users)
      .values(newUserData)
      .returning();
  }
  
  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  
  // Generate session
  const deviceToken = generateDeviceToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  
  await db.insert(authSessions).values({
    userId: user.id,
    deviceToken,
    deviceInfo,
    expiresAt,
  });
  
  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return { user, deviceToken };
}

// Get current user
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!deviceToken) {
    return null;
  }
  
  // Get session
  const [session] = await db
    .select({
      user: users,
      session: authSessions,
    })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(
      and(
        eq(authSessions.deviceToken, deviceToken),
        gt(authSessions.expiresAt, new Date())
      )
    )
    .limit(1);
  
  if (!session) {
    return null;
  }
  
  return session.user;
}

// Logout
export async function logout() {
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (deviceToken) {
    // Delete session from database
    await db
      .delete(authSessions)
      .where(eq(authSessions.deviceToken, deviceToken));
    
    // Delete cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
  
  return { success: true };
}

// Require auth middleware
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

// Clean up expired sessions
export async function cleanupSessions() {
  await db
    .delete(authSessions)
    .where(lt(authSessions.expiresAt, new Date()));
} 