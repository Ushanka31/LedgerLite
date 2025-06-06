#!/usr/bin/env node

// Script to initialize personal accounts for the LedgerLite application
// Run this script once to set up the personal finance structure

import { initializePersonalAccountsForAllUsers } from '../app/lib/initializePersonalAccounts.js';

async function main() {
  console.log('🚀 Starting personal accounts initialization...\n');
  
  try {
    const result = await initializePersonalAccountsForAllUsers();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('\n📝 Next steps:');
      console.log('1. Users can now switch to Personal context using the context switcher');
      console.log('2. Personal transactions will be completely separate from business data');
      console.log('3. Each user can set their personal budget and track expenses');
    } else {
      console.error('❌ Error:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main(); 