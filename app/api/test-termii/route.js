import { NextResponse } from 'next/server';

export async function GET() {
  // Check environment variables
  const config = {
    hasTermiiKey: !!process.env.TERMII_API_KEY,
    termiiKeyLength: process.env.TERMII_API_KEY?.length || 0,
    hasTermiiSenderId: !!process.env.TERMII_SENDER_ID,
    termiiSenderId: process.env.TERMII_SENDER_ID || 'Not set',
  };

  return NextResponse.json({
    message: 'Termii configuration check',
    config,
    instructions: 'Use POST request with phoneNumber to send test SMS'
  });
}

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!process.env.TERMII_API_KEY) {
      return NextResponse.json(
        { error: 'TERMII_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Test SMS message
    const message = `LedgerLite Test: Your Termii integration is working! This is a test message sent at ${new Date().toLocaleTimeString()}.`;

    // Send test SMS via Termii
    const termiiUrl = 'https://api.ng.termii.com/api/sms/send';
    
    const payload = {
      to: phoneNumber,
      from: process.env.TERMII_SENDER_ID || 'N-Alert',
      sms: message,
      type: 'plain',
      api_key: process.env.TERMII_API_KEY,
      channel: 'dnd',
    };

    console.log('Sending test SMS with payload:', {
      ...payload,
      api_key: payload.api_key.substring(0, 10) + '...' // Hide full API key in logs
    });

    const response = await fetch(termiiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('Termii Response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { raw: responseText };
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Termii API error',
          status: response.status,
          details: result
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test SMS sent successfully',
      termiiResponse: result,
      sentTo: phoneNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test SMS error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test SMS',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 