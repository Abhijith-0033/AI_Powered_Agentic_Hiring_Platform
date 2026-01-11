import pool from './config/db.js';

/**
 * Test PostgreSQL connection to Supabase
 * This script verifies that the database connection is working properly
 */

async function testConnection() {
    try {
        console.log('🔍 Testing PostgreSQL connection...\n');

        // Test 1: Basic query
        const timeResult = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Connection successful!');
        console.log(`📅 Database time: ${timeResult.rows[0].current_time}\n`);

        // Test 2: Check credentials table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'credentials'
            ) as table_exists
        `);

        if (tableCheck.rows[0].table_exists) {
            console.log('✅ Credentials table found');

            // Test 3: Count users
            const countResult = await pool.query('SELECT COUNT(*) as total FROM credentials');
            console.log(`👥 Total users in database: ${countResult.rows[0].total}\n`);
        } else {
            console.log('⚠️  Credentials table not found - please create it first\n');
        }

        // Test 4: Check pool status
        console.log('📊 Connection Pool Status:');
        console.log(`   - Total connections: ${pool.totalCount}`);
        console.log(`   - Idle connections: ${pool.idleCount}`);
        console.log(`   - Waiting requests: ${pool.waitingCount}`);

        console.log('\n🎉 Database connection test completed successfully!');

        // Close the pool
        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('Error:', error.message);

        if (error.message.includes('password authentication failed')) {
            console.error('\n💡 Tip: Check your database password in .env file');
        } else if (error.message.includes('ENOTFOUND')) {
            console.error('\n💡 Tip: Check your internet connection and database host');
        } else if (error.message.includes('DATABASE_URL')) {
            console.error('\n💡 Tip: Make sure DATABASE_URL is set in your .env file');
        }

        process.exit(1);
    }
}

// Run the test
testConnection();
