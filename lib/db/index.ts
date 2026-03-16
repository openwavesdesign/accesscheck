import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// In serverless environments, use a connection pool with max 1 connection
const client = postgres(process.env.DATABASE_URL!, { max: 1 });

export const db = drizzle(client, { schema });
export * from './schema';
