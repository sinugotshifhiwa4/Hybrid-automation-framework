import { QueryExecutor } from "../query/queryExecutor";
import { DatabaseConnection } from "../connection/databaseConnection";
import { SecurityQueries } from "../query/securityQueries";
import ErrorHandler from "../../utils/errors/errorHandler";

interface UserSecurityInfo {
  Username: string;
  FailedLoginCount: number;
  PermittedFailedLoginCount: number;
  IsLockedOut: boolean;
  IsAdministrativeLockedOut: boolean;
}

export class SecurityService {
  private queryExecutor: QueryExecutor;
  private databaseConnection: DatabaseConnection;
  private securityQueries: SecurityQueries;

  constructor(
    queryExecutor: QueryExecutor,
    databaseConnection: DatabaseConnection,
    securityQueries: SecurityQueries,
  ) {
    this.queryExecutor = queryExecutor;
    this.databaseConnection = databaseConnection;
    this.securityQueries = securityQueries;
  }

  public async getUserSecurityInfo(username: string): Promise<UserSecurityInfo | undefined> {
    try {
      const pool = await this.databaseConnection.acquireConnectionPool();

      const result = await this.queryExecutor.executeQuery<UserSecurityInfo>(
        pool,
        this.securityQueries.getUserSecurityInfoQuery(),
        { username },
        true,
      );

      return this.queryExecutor.extractSingleResult(result);
    } catch (error) {
      ErrorHandler.captureError(error, "getUserSecurityInfo", "Failed to get user security info");
      throw error;
    }
  }
}
