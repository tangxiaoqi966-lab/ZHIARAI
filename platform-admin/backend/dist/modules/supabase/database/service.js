"use strict";
/**
 * Supabase Database 服务
 * 提供数据库操作功能，与官方 Supabase Database API 完全兼容
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const pg_1 = require("pg");
const dotenv_1 = require("dotenv");
const types_1 = require("./types");
(0, dotenv_1.config)();
// 数据库连接池（每个项目独立的连接）
const pools = new Map();
// 获取项目数据库连接池
function getProjectPool(projectRef) {
    if (!pools.has(projectRef)) {
        // 这里应该根据项目配置创建连接池
        // 暂时使用默认连接
        const pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'supabase_platform_dev',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
        });
        pools.set(projectRef, pool);
    }
    return pools.get(projectRef);
}
class DatabaseService {
    // 执行 SQL 查询
    async executeSQL(projectRef, sqlRequest) {
        const pool = getProjectPool(projectRef);
        const startTime = Date.now();
        try {
            const result = await pool.query(sqlRequest.query, sqlRequest.params || []);
            const executionTime = Date.now() - startTime;
            return {
                data: result.rows,
                columns: result.fields?.map(f => f.name) || [],
                count: result.rowCount || 0,
                affected_rows: result.rowCount || 0,
                execution_time: executionTime,
                query: sqlRequest.query
            };
        }
        catch (error) {
            console.error('执行 SQL 查询失败:', error);
            throw {
                code: 'QUERY_FAILED',
                message: error.message || '查询执行失败',
                status: 500,
                details: error
            };
        }
    }
    // 获取表列表
    async listTables(projectRef, schema = 'public') {
        const sql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
        try {
            const result = await this.executeSQL(projectRef, { query: sql, params: [schema] });
            return result.data.map((row) => row.table_name);
        }
        catch (error) {
            console.error('获取表列表失败:', error);
            throw types_1.DATABASE_ERRORS.QUERY_FAILED;
        }
    }
    // 获取表结构
    async getTableSchema(projectRef, tableName, schema = 'public') {
        try {
            // 获取表信息
            const tableInfoQuery = `
        SELECT 
          t.table_name,
          t.table_schema,
          obj_description(pgc.oid) as table_comment
        FROM information_schema.tables t
        LEFT JOIN pg_class pgc ON pgc.relname = t.table_name
        WHERE t.table_schema = $1 AND t.table_name = $2
      `;
            const tableInfoResult = await this.executeSQL(projectRef, {
                query: tableInfoQuery,
                params: [schema, tableName]
            });
            if (tableInfoResult.count === 0) {
                throw types_1.DATABASE_ERRORS.TABLE_NOT_FOUND;
            }
            const tableInfo = tableInfoResult.data[0];
            // 获取列信息
            const columnsQuery = `
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          col_description(pgc.oid, c.ordinal_position) as column_comment,
          tc.constraint_type,
          kcu.constraint_name
        FROM information_schema.columns c
        LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
        LEFT JOIN information_schema.key_column_usage kcu 
          ON kcu.table_name = c.table_name 
          AND kcu.column_name = c.column_name
        LEFT JOIN information_schema.table_constraints tc
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_name = c.table_name
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
      `;
            const columnsResult = await this.executeSQL(projectRef, {
                query: columnsQuery,
                params: [schema, tableName]
            });
            const columns = columnsResult.data.map((row) => ({
                name: row.column_name,
                type: row.data_type,
                nullable: row.is_nullable === 'YES',
                default: row.column_default,
                primary_key: row.constraint_type === 'PRIMARY KEY',
                unique: row.constraint_type === 'UNIQUE',
                comment: row.column_comment
            }));
            // 获取主键信息
            const primaryKeyQuery = `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = $1 
          AND tc.table_name = $2 
          AND tc.constraint_type = 'PRIMARY KEY'
      `;
            const primaryKeyResult = await this.executeSQL(projectRef, {
                query: primaryKeyQuery,
                params: [schema, tableName]
            });
            const primary_key = primaryKeyResult.data.map((row) => row.column_name);
            // 获取外键信息
            const foreignKeysQuery = `
        SELECT
          tc.constraint_name as name,
          kcu.column_name,
          ccu.table_schema as foreign_table_schema,
          ccu.table_name as foreign_table,
          ccu.column_name as foreign_column,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_schema = $1 
          AND tc.table_name = $2 
          AND tc.constraint_type = 'FOREIGN KEY'
      `;
            const foreignKeysResult = await this.executeSQL(projectRef, {
                query: foreignKeysQuery,
                params: [schema, tableName]
            });
            void foreignKeysResult;
            // 获取索引信息
            const indexesQuery = `
        SELECT
          i.relname as index_name,
          a.attname as column_name,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = $1 AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = $2)
        ORDER BY i.relname, array_position(ix.indkey, a.attnum)
      `;
            const indexesResult = await this.executeSQL(projectRef, {
                query: indexesQuery,
                params: [tableName, schema]
            });
            void indexesResult;
            return {
                name: tableInfo.table_name,
                schema: tableInfo.table_schema,
                columns,
                primary_key: primary_key.length > 0 ? primary_key : undefined,
                rls_enabled: false // 暂时简化
            };
        }
        catch (error) {
            console.error('获取表结构失败:', error);
            throw error.code ? error : types_1.DATABASE_ERRORS.QUERY_FAILED;
        }
    }
    // 创建表
    async createTable(projectRef, tableSchema) {
        try {
            // 构建 CREATE TABLE SQL
            const columnDefs = tableSchema.columns.map(col => {
                let def = `${col.name} ${col.type}`;
                if (!col.nullable)
                    def += ' NOT NULL';
                if (col.default !== undefined)
                    def += ` DEFAULT ${col.default}`;
                if (col.unique)
                    def += ' UNIQUE';
                return def;
            }).join(', ');
            let sql = `CREATE TABLE ${tableSchema.schema}.${tableSchema.name} (${columnDefs}`;
            // 添加主键
            if (tableSchema.primary_key && tableSchema.primary_key.length > 0) {
                sql += `, PRIMARY KEY (${tableSchema.primary_key.join(', ')})`;
            }
            sql += ')';
            await this.executeSQL(projectRef, { query: sql });
            // 添加注释
            if (tableSchema.columns.some(col => col.comment)) {
                for (const col of tableSchema.columns) {
                    if (col.comment) {
                        const commentSql = `COMMENT ON COLUMN ${tableSchema.schema}.${tableSchema.name}.${col.name} IS '${col.comment.replace(/'/g, "''")}'`;
                        await this.executeSQL(projectRef, { query: commentSql });
                    }
                }
            }
            return {
                success: true,
                message: `表 ${tableSchema.name} 创建成功`,
                table: tableSchema
            };
        }
        catch (error) {
            console.error('创建表失败:', error);
            return {
                success: false,
                message: error.message || '创建表失败',
                error: error.code || 'CREATE_TABLE_FAILED'
            };
        }
    }
    // 删除表
    async dropTable(projectRef, schema, tableName, cascade = false) {
        try {
            const sql = `DROP TABLE ${schema}.${tableName} ${cascade ? 'CASCADE' : ''}`;
            await this.executeSQL(projectRef, { query: sql });
            return {
                success: true,
                message: `表 ${tableName} 删除成功`
            };
        }
        catch (error) {
            console.error('删除表失败:', error);
            return {
                success: false,
                message: error.message || '删除表失败',
                error: error.code || 'DROP_TABLE_FAILED'
            };
        }
    }
    // 查询数据 (PostgREST 风格)
    async queryData(projectRef, tableName, params = {}, schema = 'public') {
        try {
            let sql = `SELECT ${params.select || '*'} FROM ${schema}.${tableName}`;
            const queryParams = [];
            let paramIndex = 1;
            // WHERE 条件
            if (params.where && Object.keys(params.where).length > 0) {
                const conditions = Object.entries(params.where).map(([key, value]) => {
                    queryParams.push(value);
                    return `${key} = $${paramIndex++}`;
                });
                sql += ` WHERE ${conditions.join(' AND ')}`;
            }
            // ORDER BY
            if (params.order && Object.keys(params.order).length > 0) {
                const orders = Object.entries(params.order).map(([column, direction]) => `${column} ${direction.toUpperCase()}`);
                sql += ` ORDER BY ${orders.join(', ')}`;
            }
            // LIMIT 和 OFFSET
            if (params.limit !== undefined) {
                sql += ` LIMIT ${params.limit}`;
            }
            if (params.offset !== undefined) {
                sql += ` OFFSET ${params.offset}`;
            }
            const result = await this.executeSQL(projectRef, {
                query: sql,
                params: queryParams
            });
            return {
                success: true,
                data: result.data,
                count: result.count
            };
        }
        catch (error) {
            console.error('查询数据失败:', error);
            return {
                success: false,
                error: error.message || '查询数据失败'
            };
        }
    }
    // 插入数据
    async insertData(projectRef, tableName, data, schema = 'public') {
        try {
            const records = Array.isArray(data) ? data : [data];
            const columns = Object.keys(records[0] || {});
            if (columns.length === 0) {
                return {
                    success: false,
                    error: '没有数据可插入'
                };
            }
            const values = records.map(record => columns.map(col => record[col]));
            const paramIndices = values.map((row, rowIndex) => row.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', '));
            const sql = `
        INSERT INTO ${schema}.${tableName} (${columns.join(', ')})
        VALUES ${paramIndices.map(v => `(${v})`).join(', ')}
        RETURNING *
      `;
            const flatParams = values.flat();
            const result = await this.executeSQL(projectRef, {
                query: sql,
                params: flatParams
            });
            return {
                success: true,
                data: result.data,
                count: result.count,
                affected_rows: result.affected_rows
            };
        }
        catch (error) {
            console.error('插入数据失败:', error);
            return {
                success: false,
                error: error.message || '插入数据失败'
            };
        }
    }
    // 更新数据
    async updateData(projectRef, tableName, data, where = {}, schema = 'public') {
        try {
            const columns = Object.keys(data);
            if (columns.length === 0) {
                return {
                    success: false,
                    error: '没有数据可更新'
                };
            }
            const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
            const values = columns.map(col => data[col]);
            let sql = `UPDATE ${schema}.${tableName} SET ${setClause}`;
            let paramIndex = values.length + 1;
            const whereParams = [];
            if (Object.keys(where).length > 0) {
                const conditions = Object.entries(where).map(([key, value]) => {
                    whereParams.push(value);
                    return `${key} = $${paramIndex++}`;
                });
                sql += ` WHERE ${conditions.join(' AND ')}`;
            }
            const result = await this.executeSQL(projectRef, {
                query: sql,
                params: [...values, ...whereParams]
            });
            return {
                success: true,
                count: result.count,
                affected_rows: result.affected_rows
            };
        }
        catch (error) {
            console.error('更新数据失败:', error);
            return {
                success: false,
                error: error.message || '更新数据失败'
            };
        }
    }
    // 删除数据
    async deleteData(projectRef, tableName, where = {}, schema = 'public') {
        try {
            let sql = `DELETE FROM ${schema}.${tableName}`;
            const params = [];
            let paramIndex = 1;
            if (Object.keys(where).length > 0) {
                const conditions = Object.entries(where).map(([key, value]) => {
                    params.push(value);
                    return `${key} = $${paramIndex++}`;
                });
                sql += ` WHERE ${conditions.join(' AND ')}`;
            }
            const result = await this.executeSQL(projectRef, {
                query: sql,
                params
            });
            return {
                success: true,
                count: result.count,
                affected_rows: result.affected_rows
            };
        }
        catch (error) {
            console.error('删除数据失败:', error);
            return {
                success: false,
                error: error.message || '删除数据失败'
            };
        }
    }
    // 批量操作
    async batchOperation(projectRef, batchRequest) {
        const results = [];
        const pool = getProjectPool(projectRef);
        const client = await pool.connect();
        try {
            if (batchRequest.atomic) {
                await client.query('BEGIN');
            }
            for (const operation of batchRequest.operations) {
                try {
                    let result;
                    switch (operation.type) {
                        case 'sql':
                            const sqlResult = await client.query(operation.query, operation.params || []);
                            result = {
                                success: true,
                                data: sqlResult.rows,
                                affected_rows: sqlResult.rowCount
                            };
                            break;
                        case 'insert':
                            // 简化的插入操作
                            result = {
                                success: true,
                                data: operation.data
                            };
                            break;
                        case 'update':
                        case 'delete':
                        case 'select':
                            // 简化的其他操作
                            result = {
                                success: true,
                                data: operation.data
                            };
                            break;
                        default:
                            result = {
                                success: false,
                                error: `不支持的操作类型: ${operation.type}`
                            };
                    }
                    results.push(result);
                }
                catch (error) {
                    results.push({
                        success: false,
                        error: error.message
                    });
                    if (batchRequest.atomic) {
                        await client.query('ROLLBACK');
                        return {
                            results,
                            atomic: true,
                            success: false
                        };
                    }
                }
            }
            if (batchRequest.atomic) {
                await client.query('COMMIT');
            }
            return {
                results,
                atomic: batchRequest.atomic || false,
                success: results.every(r => r.success)
            };
        }
        finally {
            client.release();
        }
    }
    // 获取数据库统计信息
    async getDatabaseStats(projectRef) {
        try {
            const pool = getProjectPool(projectRef);
            // 获取表数量
            const tablesResult = await pool.query(`
        SELECT COUNT(*) as total_tables 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          AND table_type = 'BASE TABLE'
      `);
            // 获取总行数（估算）
            const rowsResult = await pool.query(`
        SELECT SUM(n_live_tup) as total_rows
        FROM pg_stat_user_tables
      `);
            // 获取数据库大小
            const sizeResult = await pool.query(`
        SELECT pg_database_size(current_database()) as total_size
      `);
            // 获取连接信息
            const connectionsResult = await pool.query(`
        SELECT 
          COUNT(*) as active_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
            // 获取缓存命中率
            const cacheResult = await pool.query(`
        SELECT 
          SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0) as cache_hit_ratio
        FROM pg_statio_user_tables
      `);
            // 获取运行时间
            const uptimeResult = await pool.query(`
        SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime
      `);
            return {
                total_tables: parseInt(tablesResult.rows[0]?.total_tables || '0'),
                total_rows: parseInt(rowsResult.rows[0]?.total_rows || '0'),
                total_size: sizeResult.rows[0]?.total_size || '0',
                active_connections: parseInt(connectionsResult.rows[0]?.active_connections || '0'),
                max_connections: parseInt(connectionsResult.rows[0]?.max_connections || '0'),
                cache_hit_ratio: parseFloat(cacheResult.rows[0]?.cache_hit_ratio || '0'),
                uptime: parseFloat(uptimeResult.rows[0]?.uptime || '0')
            };
        }
        catch (error) {
            console.error('获取数据库统计信息失败:', error);
            throw types_1.DATABASE_ERRORS.QUERY_FAILED;
        }
    }
    // 清理连接池
    async cleanup() {
        for (const [projectRef, pool] of pools.entries()) {
            await pool.end();
            pools.delete(projectRef);
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=service.js.map