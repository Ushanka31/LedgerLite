import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { users } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    const { name, email } = await request.json();

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
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

    // Update user in database
    const updateData = {
      name: name.trim(),
      email: email?.trim() || null,
      updatedAt: new Date(),
    };

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        companyId: updatedUser.companyId,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error.message
      },
      { status: 500 }
    );
  }
} 