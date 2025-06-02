import { readFileSync } from 'fs';

console.log('Testing DATABASE_URL from .env.local...');

try {
  const envContent = readFileSync('.env.local', 'utf8');
  console.log('✅ .env.local file found');
  
  const lines = envContent.split('\n');
  const databaseUrlLine = lines.find(line => line.startsWith('DATABASE_URL='));
  
  if (databaseUrlLine) {
    const url = databaseUrlLine.split('=')[1];
    console.log('✅ DATABASE_URL found in .env.local');
    console.log('URL length:', url.length);
    console.log('URL starts with:', url.substring(0, 30) + '...');
    
    try {
      const parsed = new URL(url);
      console.log('✅ URL is valid');
      console.log('Protocol:', parsed.protocol);
      console.log('Hostname:', parsed.hostname);
      console.log('Port:', parsed.port);
      console.log('Database:', parsed.pathname);
    } catch (error) {
      console.error('❌ URL parsing error:', error.message);
    }
  } else {
    console.log('❌ DATABASE_URL not found in .env.local');
  }
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
} 