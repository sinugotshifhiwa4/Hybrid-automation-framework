import * as sql from "mssql";

// export class QueryExecutor {
//   // Base query execution method
//   public async executeQuery<T = Record<string, unknown>>(
//     pool: sql.ConnectionPool,
//     query: string,
//     parameters?: Record<string, unknown>,
//   ): Promise<sql.IResult<T>> {
//     const request = pool.request();

//     if (parameters) {
//       for (const [key, value] of Object.entries(parameters)) {
//         request.input(key, value);
//       }
//     }

//     return request.query<T>(query);
//   }

//   public async executeQueryWithResult<T = Record<string, unknown>>(
//     pool: sql.ConnectionPool,
//     query: string,
//     parameters?: Record<string, unknown>,
//     expectSingle: boolean = false,
//   ): Promise<T | T[] | null> {
//     try {
//       const result = await this.executeQuery<T>(pool, query, parameters);

//       // Check if result is valid and has recordset
//       if (!result || !result.recordset) {
//         return null;
//       }

//       const records = result.recordset;

//       // Check if we have any records
//       if (!records || records.length === 0) {
//         return null;
//       }

//       // Return based on expectSingle flag
//       if (expectSingle) {
//         return records[0]; // Return first record only
//       } else {
//         return records; // Return full array
//       }
//     } catch (error) {
//       console.error("Database query error:", error);
//       throw error;
//     }
//   }

//   public async executeQuerySingle<T = Record<string, unknown>>(
//     pool: sql.ConnectionPool,
//     query: string,
//     parameters?: Record<string, unknown>,
//   ): Promise<T | null> {
//     const result = await this.executeQueryWithResult<T>(pool, query, parameters, true);
//     return result as T | null;
//   }

//   public async executeQueryArray<T = Record<string, unknown>>(
//     pool: sql.ConnectionPool,
//     query: string,
//     parameters?: Record<string, unknown>,
//   ): Promise<T[] | null> {
//     const result = await this.executeQueryWithResult<T>(pool, query, parameters, false);
//     return result as T[] | null;
//   }
// }



// // Usage examples:

// // Example 1: Get single user by ID
// // async function getUserById(pool: sql.ConnectionPool, userId: number) {
// //   const user = await executeQuerySingle<{ id: number; name: string; email: string }>(
// //     pool,
// //     'SELECT id, name, email FROM users WHERE id = @userId',
// //     { userId }
// //   );
  
// //   if (user) {
// //     console.log('User found:', user);
// //   } else {
// //     console.log('User not found');
// //   }
  
// //   return user;
// // }

// // // Example 2: Get all users
// // async function getAllUsers(pool: sql.ConnectionPool) {
// //   const users = await executeQueryArray<{ id: number; name: string; email: string }>(
// //     pool,
// //     'SELECT id, name, email FROM users'
// //   );
  
// //   if (users && users.length > 0) {
// //     console.log(`Found ${users.length} users:`, users);
// //   } else {
// //     console.log('No users found');
// //   }
  
// //   return users;
// // }

// // // Example 3: Using the flexible method
// // async function getUsers(pool: sql.ConnectionPool, single: boolean = false) {
// //   const result = await executeQueryWithResult<{ id: number; name: string }>(
// //     pool,
// //     'SELECT id, name FROM users',
// //     {},
// //     singleimport * as sql from "mssql";

export class QueryExecutor {

  
   public async executeQuery<T = Record<string, unknown>>(
    pool: sql.ConnectionPool,
    query: string,
    parameters?: Record<string, unknown>,
    isSingleRow: boolean = false,
  ): Promise<T | T[] | null> {
    try {
      const result = await this.executeRawQuery<T>(pool, query, parameters);

      if (!this.isValidResult(result)) {
        return null;
      }

      return this.formatResult(result.recordset, isSingleRow);
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

   private isValidResult<T>(result: sql.IResult<T>): boolean {
    return !!(result && result.recordset && result.recordset.length > 0);
  }

  // Helper method to format result based on expectSingle flag
  private formatResult<T>(records: T[], expectSingle: boolean): T | T[] {
    return expectSingle ? records[0] : records;
  }

    // Private base query execution method
  private async executeRawQuery<T = Record<string, unknown>>(
    pool: sql.ConnectionPool,
    query: string,
    parameters?: Record<string, unknown>,
  ): Promise<sql.IResult<T>> {
    const request = pool.request();

    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        request.input(key, value);
      }
    }

    return request.query<T>(query);
  }

  public extractSingleResult<T>(result: T | T[] | null): T | undefined {
    if (Array.isArray(result)) {
      return result[0];
    } else if (result === null) {
      return undefined;
    }
    return result;
  }

   public extractArrayResult<T>(result: T | T[] | null): T[] {
    if (Array.isArray(result)) {
      return result;
    } else if (result === null) {
      return [];
    }
    return [result];
  }
}




