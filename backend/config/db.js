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

// Validate DATABASE_URL exists (Support both NEON_DATABASE_URL and DATABASE_URL)
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        'Database connection string is not defined. ' +
        'Please set NEON_DATABASE_URL or DATABASE_URL in your .env file.'
    );
}

// Create connection pool
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Neon / Supabase hosted PostgreSQL
    },
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 120000, // Return error after 120 seconds if connection cannot be established
    keepAlive: true // Keep connection alive to prevent timeouts
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
