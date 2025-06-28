import { test, expect } from '@playwright/test';
import { dbConfig } from '../../src/db/types/databaseConfig.type';
import { DatabaseConnection } from '../../src/db/connection/connectionConfig';
import * as sql from 'mssql';
import logger from '../../src/utils/logging/loggerManager';

async function executeQuery<T = Record<string, unknown>>(
  pool: sql.ConnectionPool,
  query: string,
  parameters?: Record<string, unknown>
): Promise<sql.IResult<T>> {
  const request = pool.request();

  if (parameters) {
    for (const [key, value] of Object.entries(parameters)) {
      request.input(key, value);
    }
  }

  return request.query<T>(query);
}

test.describe('SQL Server Database Tests', () => {
  let db: DatabaseConnection;
  let pool: sql.ConnectionPool;

  test.beforeAll(async () => {
    db = new DatabaseConnection();
    pool = await db.connect(dbConfig);
  });

  test.afterAll(async () => {
    await db.disconnect();
  });

  test('should connect to SQL Server successfully and return version', async () => {
    const result = await executeQuery<{ version: string }>(
      pool,
      'SELECT @@VERSION as version'
    );

    expect(result.recordset.length).toBeGreaterThan(0);
    expect(result.recordset[0].version).toBeTruthy();
  });

  test.only('should extract admin user data', async () => {
    const result = await executeQuery<{
      Username: string;
      FailedLoginCount: number;
      PermittedFailedLoginCount: number;
      IsLockedOut: boolean;
      IsAdministrativeLockedOut: boolean;
    }>(
      pool,
      `
        SELECT TOP (1)
          [Username],
          [FailedLoginCount],
          [PermittedFailedLoginCount],
          [IsLockedOut],
          [IsAdministrativeLockedOut]
        FROM [tshifhiwaDemo].[dbo].[Users]
        WHERE [Username] = @username
      `,
      { username: 'admin' }
    );

    expect(result.recordset.length).toBe(1);
    const admin = result.recordset[0];

    expect(admin.Username).toBe('admin');
    expect(typeof admin.FailedLoginCount).toBe('number');
    expect(typeof admin.IsLockedOut).toBe('boolean');
    logger.info(`result: ${JSON.stringify(result.recordset, null, 2)}`);
  });
});
