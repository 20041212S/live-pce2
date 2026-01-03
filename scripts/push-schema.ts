#!/usr/bin/env tsx
/**
 * Push Prisma schema to database
 * This script pushes the schema directly to the database (useful for initial setup)
 * 
 * Usage:
 *   tsx scripts/push-schema.ts
 * 
 * Or with DATABASE_URL:
 *   DATABASE_URL="your-connection-string" tsx scripts/push-schema.ts
 */

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env file or as an environment variable');
  process.exit(1);
}

console.log('🔄 Pushing Prisma schema to database...');
console.log(`📊 Database: ${databaseUrl.substring(0, 30)}...`);

try {
  // Push schema to database
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });
  
  console.log('✅ Schema pushed successfully!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   - Run seed script: npm run db:seed');
  console.log('   - Or create admin user manually');
} catch (error) {
  console.error('❌ Failed to push schema:', error);
  process.exit(1);
}

