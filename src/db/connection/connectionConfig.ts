import * as sql from 'mssql';
import logger from '../../utils/logging/loggerManager';

export class DatabaseConnection {
  private pool: sql.ConnectionPool | null = null;

  async connect(config: sql.config): Promise<sql.ConnectionPool> {
    try {
      this.pool = new sql.ConnectionPool(config);
      await this.pool.connect();
      logger.info('Successfully connected to SQL Server')
      return this.pool;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      logger.info('Database connection closed');
    }
  }

  getPool(): sql.ConnectionPool {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  isConnected(): boolean {
    return this.pool !== null && this.pool.connected;
  }
}