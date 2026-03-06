/**
 * Supabase Database 服务
 * 提供数据库操作功能，与官方 Supabase Database API 完全兼容
 */
import { TableSchema, SQLQueryRequest, SQLQueryResponse, TableOperationResponse, DataOperationResponse, BatchOperationRequest, BatchOperationResponse, DatabaseStats, QueryParams } from './types';
export declare class DatabaseService {
    executeSQL(projectRef: string, sqlRequest: SQLQueryRequest): Promise<SQLQueryResponse>;
    listTables(projectRef: string, schema?: string): Promise<string[]>;
    getTableSchema(projectRef: string, tableName: string, schema?: string): Promise<TableSchema>;
    createTable(projectRef: string, tableSchema: TableSchema): Promise<TableOperationResponse>;
    dropTable(projectRef: string, schema: string, tableName: string, cascade?: boolean): Promise<TableOperationResponse>;
    queryData(projectRef: string, tableName: string, params?: QueryParams, schema?: string): Promise<DataOperationResponse>;
    insertData(projectRef: string, tableName: string, data: any | any[], schema?: string): Promise<DataOperationResponse>;
    updateData(projectRef: string, tableName: string, data: any, where?: Record<string, any>, schema?: string): Promise<DataOperationResponse>;
    deleteData(projectRef: string, tableName: string, where?: Record<string, any>, schema?: string): Promise<DataOperationResponse>;
    batchOperation(projectRef: string, batchRequest: BatchOperationRequest): Promise<BatchOperationResponse>;
    getDatabaseStats(projectRef: string): Promise<DatabaseStats>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=service.d.ts.map