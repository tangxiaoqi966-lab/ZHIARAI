"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = testConnection;
exports.query = query;
exports.withTransaction = withTransaction;
const pg_1 = require("pg");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
// Create connection pool
const pool = new pg_1.Pool(dbConfig);
// Test database connection
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('Database connected successfully:', result.rows[0].now);
        return true;
    }
    catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}
// Execute query helper
async function query(sql, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return {
            rows: result.rows,
            rowCount: result.rowCount || 0
        };
    }
    finally {
        client.release();
    }
}
// Transaction helper
async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
exports.default = pool;
//# sourceMappingURL=database.js.map