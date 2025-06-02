import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    databaseUrlStart: process.env.DATABASE_URL?.substring(0, 30) + '...' || 'Not found',
    nodeEnv: process.env.NODE_ENV,
    hasTermiiKey: !!process.env.TERMII_API_KEY,
    termiiKeyLength: process.env.TERMII_API_KEY?.length || 0,
    hasTermiiSenderId: !!process.env.TERMII_SENDER_ID,
    termiiSenderId: process.env.TERMII_SENDER_ID || 'Not found',
  });
} 