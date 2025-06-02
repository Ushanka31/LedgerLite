import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { companies } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { 
          error: 'No company associated with user',
          hasCompany: false
        },
        { status: 400 }
      );
    }

    // Fetch company details
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, user.companyId))
      .limit(1);

    if (!company) {
      return NextResponse.json(
        { 
          error: 'Company not found',
          hasCompany: false
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        website: company.website,
        logo: company.logo
      }
    });
  } catch (error) {
    console.error('Company API error:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error.message
      },
      { status: 500 }
    );
  }
} 