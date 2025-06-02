import { cookies } from 'next/headers';
import { db } from './db';
import { users, authSessions, otpCodes } from './db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { generateOTP, validatePhoneNumber } from './utils';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'ledgerlite_session';
const SESSION_DURATION_DAYS = 30;

// Generate device token
export function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send SMS via Termii
export async function sendSMS(phoneNumber, message) {
  try {
    // For development/testing - show OTP in console and return success
    console.log('\n' + '='.repeat(60));
    console.log('📱 SMS MESSAGE (DEVELOPMENT MODE)');
    console.log('='.repeat(60));
    console.log(`📞 To: ${phoneNumber}`);
    console.log(`💬 Message: ${message}`);
    console.log('='.repeat(60) + '\n');
    return { success: true };
    
    /* 
    // Send real SMS via Termii - disabled for development
    const termiiUrl = 'https://api.ng.termii.com/api/sms/send';
    
    const response = await fetch(termiiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        from: process.env.TERMII_SENDER_ID || 'N-Alert',
        sms: message,
        type: 'plain',
        api_key: process.env.TERMII_API_KEY,
        channel: 'dnd', // Using DND channel for better delivery
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Termii API Error:', errorData);
      throw new Error('Failed to send SMS');
    }
    
    const result = await response.json();
    console.log('SMS sent successfully:', result);
    return { success: true };
    */
  } catch (error) {
    console.error('SMS sending error:', error);
    
    // For development - fall back to console log if SMS fails
    console.log(`FALLBACK - SMS to ${phoneNumber}: ${message}`);
    return { success: true };
  }
}

// Send OTP
export async function sendOTP(phoneNumber) {
  // Validate phone number
  if (!validatePhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format');
  }
  
  // Generate OTP
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Save OTP to database
  await db.insert(otpCodes).values({
    phoneNumber,
    code,
    expiresAt,
  });
  
  // Send SMS
  const message = `Your LedgerLite verification code is: ${code}. Valid for 10 minutes.`;
  await sendSMS(phoneNumber, message);
  
  return { success: true, otp: code };
}

// Verify OTP
export async function verifyOTP(phoneNumber, code) {
  // Get valid OTP
  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phoneNumber, phoneNumber),
        eq(otpCodes.code, code),
        gt(otpCodes.expiresAt, new Date()),
        eq(otpCodes.attempts, 0) // Ensure not already used
      )
    )
    .limit(1);
  
  if (!otp) {
    // Increment attempts for this phone number
    await db
      .update(otpCodes)
      .set({ attempts: 1 })
      .where(
        and(
          eq(otpCodes.phoneNumber, phoneNumber),
          gt(otpCodes.expiresAt, new Date())
        )
      );
    
    return { success: false, error: 'Invalid or expired code' };
  }
  
  // Mark OTP as used
  await db
    .update(otpCodes)
    .set({ attempts: 1 })
    .where(eq(otpCodes.id, otp.id));
  
  return { success: true };
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
  
  await db
    .delete(otpCodes)
    .where(lt(otpCodes.expiresAt, new Date()));
} 