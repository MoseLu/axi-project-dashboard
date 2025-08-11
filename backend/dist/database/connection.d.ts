import mysql from 'mysql2/promise';
export declare const connectDatabase: () => Promise<mysql.Connection>;
export declare const getConnection: () => mysql.Connection;
export declare const disconnectDatabase: () => Promise<void>;
//# sourceMappingURL=connection.d.ts.map