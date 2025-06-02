import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Debug Termii Configuration',
    hasApiKey: !!process.env.TERMII_API_KEY,
    apiKeyLength: process.env.TERMII_API_KEY?.length || 0,
    apiKeyPrefix: process.env.TERMII_API_KEY?.substring(0, 10) || 'Not set',
    apiKeySuffix: process.env.TERMII_API_KEY?.substring(-10) || 'Not set',
    senderId: process.env.TERMII_SENDER_ID || 'N-Alert (default)',
    instructions: 'Use POST with phoneNumber to test exact API call'
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

    const apiKey = process.env.TERMII_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TERMII_API_KEY environment variable not set' },
        { status: 500 }
      );
    }

    // Log the exact payload being sent (with masked API key)
    const payload = {
      to: phoneNumber,
      from: process.env.TERMII_SENDER_ID || 'N-Alert',
      sms: `Debug test from LedgerLite at ${new Date().toLocaleTimeString()}`,
      type: 'plain',
      api_key: apiKey,
      channel: 'dnd',
    };

    console.log('Sending to Termii:', {
      ...payload,
      api_key: `${payload.api_key.substring(0, 10)}...${payload.api_key.substring(-5)}`
    });

    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('Raw Termii Response:', responseText);
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { raw: responseText, parseError: e.message };
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      termiiResponse: result,
      debug: {
        payloadSent: {
          ...payload,
          api_key: `${payload.api_key.substring(0, 10)}...${payload.api_key.substring(-5)}`
        }
      }
    });

  } catch (error) {
    console.error('Debug Termii error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Termii',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 