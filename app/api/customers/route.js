import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { customers } from '@/app/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Query customers for the company
    const customerList = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        company: customers.company,
        address: customers.address,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(eq(customers.companyId, user.companyId))
      .orderBy(desc(customers.createdAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      customers: customerList,
      total: customerList.length,
    });
  } catch (error) {
    console.error('Get customers error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    const { name, email, phone, company, address } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    // Create customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        companyId: user.companyId,
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        address: address || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      customer: newCustomer,
    });
  } catch (error) {
    console.error('Customer creation error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
} 