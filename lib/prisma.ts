import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Process and clean the database URL for Neon pooler compatibility
// This function processes the DATABASE_URL and sets it back to process.env
// PrismaClient reads from process.env.DATABASE_URL automatically
function processDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  
  // During build time, DATABASE_URL might not be set - that's okay
  // It will be available at runtime in Vercel
  if (!url) {
    // In development/build, return undefined and let Prisma handle it
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      // Only warn in production server-side (not during build)
      console.warn("DATABASE_URL environment variable is not set");
    }
    return undefined;
  }
  
  // For Neon pooler, ensure proper connection string format
  // Neon pooler works with Prisma, but we need to ensure SSL and proper settings
  let databaseUrl = url.trim();
  
  // Parse URL to ensure proper formatting
  try {
    const urlObj = new URL(databaseUrl);
    
    // Ensure sslmode=require is set (required for Neon)
    if (!urlObj.searchParams.has('sslmode')) {
      urlObj.searchParams.set('sslmode', 'require');
    }
    
    // Remove channel_binding parameter if present - it's not standard and may cause issues
    // Prisma/PostgreSQL drivers may not support this parameter
    if (urlObj.searchParams.has('channel_binding')) {
      urlObj.searchParams.delete('channel_binding');
    }
    
    // For Neon pooler with Prisma, we don't need additional parameters
    // Prisma handles connection pooling automatically
    databaseUrl = urlObj.toString();
  } catch (e) {
    // If URL parsing fails, try to manually remove channel_binding
    // This is a fallback for malformed URLs
    if (databaseUrl.includes('channel_binding')) {
      databaseUrl = databaseUrl
        .replace(/[&?]channel_binding=[^&]*/g, '')
        .replace(/channel_binding=[^&]*&?/g, '');
    }
    console.warn('Could not parse DATABASE_URL, using fallback cleanup:', e);
  }
  
  // Set the processed URL back to process.env so PrismaClient can read it
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}

// Prisma Client configuration for serverless environments (Vercel)
// For Neon, the pooler connection string should work directly with Prisma
// We use the pg adapter for proper PostgreSQL connection handling
function createPrismaClient(): PrismaClient {
  // Process the database URL - this ensures channel_binding is removed and sslmode is set
  const processedUrl = processDatabaseUrl();
  
  // Use the processed URL or fall back to environment variable
  const databaseUrl = processedUrl || process.env.DATABASE_URL;
  
  // Check if we have a valid database URL
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set. Database operations will fail.");
    // Still create client for build-time, but it will fail at runtime
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  
  // Validate that we're not using a dummy connection string
  if (databaseUrl.includes("dummy:dummy")) {
    console.error("❌ DATABASE_URL appears to be a dummy value. Please set a valid database URL.");
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  
  try {
    // Create PostgreSQL connection pool with proper configuration for Neon
    const pool = new Pool({
      connectionString: databaseUrl,
      // Connection pool settings optimized for serverless
      max: 1, // Limit connections for serverless (each function instance)
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // SSL is handled via connection string parameters
    });
    
    // Create adapter with the pool
    const adapter = new PrismaPg(pool);
    
    // Create PrismaClient with adapter
    const client = new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    
    console.log("✅ Prisma Client created successfully with adapter");
    return client;
  } catch (error: any) {
    console.error("❌ Failed to create Prisma adapter:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      databaseUrl: databaseUrl ? `${databaseUrl.substring(0, 20)}...` : "not set",
    });
    
    // Fallback: create client without adapter (may not work with Prisma 7.x)
    // This should only happen if there's a configuration issue
    console.warn("⚠️ Attempting to create PrismaClient without adapter (may fail)");
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// In production (Vercel serverless), we should reuse the client to avoid connection exhaustion
// Prisma Client is designed to be reused across requests in serverless environments
// This prevents creating too many database connections
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Export as default for consistency (supports both import styles)
export default prisma;
