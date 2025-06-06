import { cookies } from 'next/headers';

const CONTEXT_COOKIE_NAME = 'ledgerlite_context';
const PERSONAL_CONTEXT_ID = '00000000-0000-0000-0000-000000000000'; // Special UUID for personal context

export const ContextType = {
  PERSONAL: 'personal',
  BUSINESS: 'business'
};

// Get current context from cookies
export async function getCurrentContext() {
  const cookieStore = await cookies();
  const contextCookie = cookieStore.get(CONTEXT_COOKIE_NAME);
  
  if (!contextCookie) {
    return {
      type: ContextType.PERSONAL,
      companyId: null
    };
  }
  
  try {
    const context = JSON.parse(contextCookie.value);
    return context;
  } catch {
    return {
      type: ContextType.PERSONAL,
      companyId: null
    };
  }
}

// Set current context
export async function setCurrentContext(type, companyId = null) {
  const cookieStore = await cookies();
  
  const context = {
    type,
    companyId: type === ContextType.PERSONAL ? null : companyId
  };
  
  cookieStore.set(CONTEXT_COOKIE_NAME, JSON.stringify(context), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  });
  
  return context;
}

// Check if user has any business accounts
export async function getUserContexts(userId) {
  const { db } = await import('./db');
  const { companies, companyUsers } = await import('./db/schema');
  const { or, eq, ne, and } = await import('drizzle-orm');
  
  // Get all companies where user is owner or member, excluding the technical personal finance system
  const userCompanies = await db
    .select({
      id: companies.id,
      name: companies.name,
      role: companyUsers.role
    })
    .from(companies)
    .leftJoin(companyUsers, eq(companies.id, companyUsers.companyId))
    .where(
      and(
        or(
          eq(companies.ownerId, userId),
          eq(companyUsers.userId, userId)
        ),
        ne(companies.id, PERSONAL_CONTEXT_ID) // Exclude the technical personal finance system
      )
    );
  
  return {
    hasPersonal: true, // Everyone has personal context
    businesses: userCompanies,
    totalContexts: userCompanies.length + 1 // +1 for personal
  };
}

// Get context-aware company ID for queries
export function getContextCompanyId(context) {
  if (context.type === ContextType.PERSONAL) {
    return PERSONAL_CONTEXT_ID;
  }
  return context.companyId;
}

// Check if current context is personal
export function isPersonalContext(context) {
  return context.type === ContextType.PERSONAL;
}

// Helper to filter queries by context
export function addContextFilter(query, context, companyIdField = 'companyId') {
  const { eq } = require('drizzle-orm');
  
  if (isPersonalContext(context)) {
    // For personal context, we'll use a special companyId
    return query.where(eq(companyIdField, PERSONAL_CONTEXT_ID));
  }
  
  // For business context, use the actual company ID
  return query.where(eq(companyIdField, context.companyId));
} 