import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { companies } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 400 }
      );
    }

    const { name, email, phone, address, website, taxNumber, currency } = await request.json();

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate website URL if provided
    if (website && website.trim().length > 0) {
      try {
        new URL(website);
      } catch {
        return NextResponse.json(
          { error: 'Invalid website URL' },
          { status: 400 }
        );
      }
    }

    // Validate currency
    const validCurrencies = ['NGN', 'USD', 'EUR', 'GBP'];
    if (currency && !validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      email: email?.trim() || null,
      phoneNumber: phone?.trim() || null,
      address: address?.trim() || null,
      website: website?.trim() || null,
      taxNumber: taxNumber?.trim() || null,
      currency: currency || 'NGN',
      updatedAt: new Date(),
    };

    // Set currency symbol based on currency
    const currencySymbols = {
      'NGN': '₦',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    updateData.currencySymbol = currencySymbols[updateData.currency];

    // Update company in database
    const [updatedCompany] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, user.companyId))
      .returning();

    if (!updatedCompany) {
      return NextResponse.json(
        { error: 'Failed to update company' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Company updated successfully',
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        email: updatedCompany.email,
        phone: updatedCompany.phoneNumber,
        address: updatedCompany.address,
        website: updatedCompany.website,
        taxNumber: updatedCompany.taxNumber,
        currency: updatedCompany.currency,
        currencySymbol: updatedCompany.currencySymbol,
        updatedAt: updatedCompany.updatedAt
      }
    });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error.message
      },
      { status: 500 }
    );
  }
} 