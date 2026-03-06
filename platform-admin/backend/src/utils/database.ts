import { Pool, PoolConfig, QueryResultRow } from 'pg'
import { config } from 'dotenv'

config()

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}

// Create connection pool
const pool = new Pool(dbConfig)

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    console.log('Database connected successfully:', result.rows[0].now)
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Execute query helper
export async function query<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect()
  try {
    const result = await client.query<T>(sql, params)
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    }
  } finally {
    client.release()
  }
}

// Transaction helper
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export default pool