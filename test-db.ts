import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;
    console.log('Testing connection to:', connectionString?.replace(/:[^:@]*@/, ':****@')); // mask password

    const pool = new Pool({ connectionString });

    try {
        const client = await pool.connect();
        console.log('Successfully connected to Postgres!');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await pool.end();
    }
}

testConnection();
