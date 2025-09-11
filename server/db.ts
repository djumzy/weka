import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create PostgreSQL connection pool
// Ensure SSL for managed providers like Render
const useSsl = /render\.com|sslmode=require/i.test(process.env.DATABASE_URL);
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
