import { Pool, QueryResultRow } from 'pg';
declare const pool: Pool;
export declare function testConnection(): Promise<boolean>;
export declare function query<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<{
    rows: T[];
    rowCount: number;
}>;
export declare function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
export default pool;
//# sourceMappingURL=database.d.ts.map