import sql from "mssql";
import { DatabaseConfiguration } from "../config/databaseConfiguration";
import EnvironmentDetector from "../../config/environment/detector/detector";
import { TIMEOUTS } from "../../config/timeouts/timeout.config";
import ErrorHandler from "../../utils/errors/errorHandler";
import logger from "../../utils/logging/loggerManager";

export class DatabaseConnection {
  private databaseConfiguration: DatabaseConfiguration;
  private pool: sql.ConnectionPool | null = null;
  private isConnecting = false;

  constructor(databaseConfiguration: DatabaseConfiguration) {
    this.databaseConfiguration = databaseConfiguration;
  }

/**
 * Retrieves the appropriate database configuration based on the current environment.
 * 
 * This method first checks if the application is running in a Continuous Integration (CI) 
 * environment and returns the Azure database configuration for CI if true. For non-CI 
 * environments, it evaluates the current environment stage and returns the corresponding 
 * database configuration:
 * - For development environments, it returns the local database configuration.
 * - For other environments, it returns the local Azure database configuration.
 * 
 * @returns {Promise<AzureDbConfig | LocalDbConfig | undefined>} A promise that resolves to the 
 * appropriate database configuration object or undefined if configuration fails.
 */
  public async getEnvironmentBasedConfig() {
    // Check if the current environment is CI
    const isCI = EnvironmentDetector.isCI();

    // Get the current environment
    const currentEnvironment = EnvironmentDetector.getCurrentStage();

    // Handle CI environment first
    if (isCI) {
      return await this.databaseConfiguration.configCIAzureDb();
    }

    // Handle other environments
    if (currentEnvironment === "uat") { // change to dev, using uat for this testing only
      return await this.databaseConfiguration.configLocalDb();
    } else {
      return await this.databaseConfiguration.configLocalAzureDb();
    }
  }

  private async establishConnectionPool(): Promise<sql.ConnectionPool> {
    try {
      const config = await this.getEnvironmentBasedConfig();
      if (!config) {
        ErrorHandler.logAndThrow("Database configuration is undefined", "establishConnectionPool");
      }

      const pool = new sql.ConnectionPool(config);
      await pool.connect();

      logger.info("Database connection established successfully");
      return pool;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "establishConnectionPool",
        "Failed to establish database connection",
      );
      throw error;
    }
  }

  private validatePoolHealth(pool: sql.ConnectionPool): boolean {
    try {
      return pool.connected === true;
    } catch {
      return false;
    }
  }

  private async removeUnhealthyPool(): Promise<void> {
    if (this.pool && !this.validatePoolHealth(this.pool)) {
      await this.terminateConnectionPool();
    }
  }

  private async awaitPendingConnection(): Promise<void> {
    const maxWaitTime = TIMEOUTS.db.connection;
    const startTime = Date.now();

    while (this.isConnecting && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  public async acquireConnectionPool(): Promise<sql.ConnectionPool> {
    // Return existing healthy connection
    if (this.pool && this.validatePoolHealth(this.pool)) {
      return this.pool;
    }

    // Wait for any ongoing connection attempts
    if (this.isConnecting) {
      await this.awaitPendingConnection();

      if (this.pool && this.validatePoolHealth(this.pool)) {
        return this.pool;
      }
    }

    // Establish new connection
    this.isConnecting = true;

    try {
      await this.removeUnhealthyPool();
      this.pool = await this.establishConnectionPool();
      return this.pool;
    } finally {
      this.isConnecting = false;
    }
  }

  public async terminateConnectionPool(): Promise<void> {
    if (!this.pool) {
      logger.warn("Connection pool already closed or never initialized");
      return;
    }

    try {
      await this.pool.close();
      logger.info("Database connection pool closed successfully");
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "terminateConnectionPool",
        "Failed to close connection pool",
      );
      throw error;
    } finally {
      this.pool = null;
    }
  }

  public hasActiveConnection(): boolean {
    return this.pool ? this.validatePoolHealth(this.pool) : false;
  }

  public async performHealthCheck(): Promise<boolean> {
    try {
      const pool = await this.acquireConnectionPool();
      const request = pool.request();
      const result = await request.query("SELECT 1 as test");

      return result.recordset?.[0]?.test === 1;
    } catch (error) {
      logger.debug("Health check failed", error);
      return false;
    }
  }
}
