import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * PostgreSQL Connection Pool
 * Connects to Supabase PostgreSQL via Session Pooler (IPv4 + IPv6 support)
 * 
 * Security Features:
 * - SSL enabled with rejectUnauthorized: false for Supabase
 * - Connection pooling for optimal performance
 * - Parameterized queries to prevent SQL injection
 */

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
    throw new Error(
        'DATABASE_URL is not defined in environment variables. ' +
        'Please add it to your .env file in the format: ' +
        'postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres'
    );
}

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase hosted PostgreSQL
    },
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000 // Return error after 10 seconds if connection cannot be established
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ PostgreSQL pool connected');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL pool error:', err);
});

/**
 * Execute a parameterized query
 * @param {string} text - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`📊 Query executed in ${duration}ms`);
        return result;
    } catch (error) {
        console.error('❌ Database query error:', error.message);
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
export const getClient = async () => {
    return await pool.connect();
};

/**
 * Close the pool (used for graceful shutdown)
 */
export const closePool = async () => {
    await pool.end();
    console.log('✅ PostgreSQL pool closed');
};

export default pool;
