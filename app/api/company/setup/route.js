import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { companies, users } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request) {
  try {
    console.log('🏢 Company setup request received');
    
    // Require authentication
    const user = await requireAuth();
    console.log('👤 User authenticated:', user ? `ID: ${user.id}` : 'No user');
    
    if (!user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user already has a company
    if (user.companyId) {
      console.log('⚠️ User already has a company:', user.companyId);
      return NextResponse.json(
        { error: 'User already has a company set up' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const {
      companyName,
      businessType,
      businessAddress,
      businessEmail,
      businessPhone,
      taxId,
      currency
    } = body;

    // Validate required fields
    if (!companyName) {
      console.log('❌ Company name missing');
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    console.log('💾 Creating company in database...');
    
    // Create company
    const companyData = {
      name: companyName,
      ownerId: user.id,
      phoneNumber: businessPhone || null,
      email: businessEmail || null,
      address: businessAddress || null,
      taxNumber: taxId || null,
      currency: currency || 'NGN',
      currencySymbol: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₦',
    };
    
    console.log('📊 Company data to insert:', companyData);
    
    const insertedResult = await db
      .insert(companies)
      .values(companyData)
      .returning();

    console.log('🔍 Result from db.insert().returning():', JSON.stringify(insertedResult, null, 2));
    
    // Check if insertedResult is an array and not empty
    if (!insertedResult || !Array.isArray(insertedResult) || insertedResult.length === 0) {
      console.error('❌ Company insertion failed or did not return expected data.');
      return NextResponse.json(
        { error: 'Failed to create company. No data returned from database.' },
        { status: 500 }
      );
    }

    const [company] = insertedResult; // Destructure after validation

    console.log('✅ Company created (after destructuring):', company ? `ID: ${company.id}, Name: ${company.name}` : 'Company object is undefined/null');

    console.log('✅ Company created:', company.id);

    // Update user with company ID
    console.log('🔗 Updating user with company ID...');
    await db
      .update(users)
      .set({ companyId: company.id })
      .where(eq(users.id, user.id));

    console.log('🎉 Company setup completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Company setup completed successfully',
      company: {
        id: company.id,
        name: company.name,
        currency: company.currency,
      }
    });

  } catch (error) {
    console.error('💥 Company setup error details:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Return more specific error messages
    if (error.code === '23505') { // Duplicate key error
      return NextResponse.json(
        { error: 'A company with this information already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === '23503') { // Foreign key constraint error
      return NextResponse.json(
        { error: 'Invalid user reference. Please try logging in again.' },
        { status: 400 }
      );
    }
    
    if (error.message?.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your internet connection.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `Database error: ${error.message}` },
      { status: 500 }
    );
  }
} 