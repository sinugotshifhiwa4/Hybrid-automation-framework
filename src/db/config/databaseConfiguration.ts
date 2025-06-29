import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity";
import { LocalDbConfig, AzureDbConfig } from "../types/dbConfig.types";
import { EnvironmentResolver } from "../../config/environment/resolver/environmentResolver";
import { TIMEOUTS } from "../../config/timeouts/timeout.config";
import { CIAzureCredentials } from "../types/dbConfig.types";
import ErrorHandler from "../../utils/errors/errorHandler";
import logger from "../../utils/logging/loggerManager";

export class DatabaseConfiguration {
  private readonly credential: DefaultAzureCredential;
  private environmentResolver: EnvironmentResolver;

  constructor(environmentResolver: EnvironmentResolver) {
    this.credential = new DefaultAzureCredential();
    this.environmentResolver = environmentResolver;
  }

  public async configLocalDb(): Promise<LocalDbConfig | undefined> {
    try {
      const [serverName, databaseName] = await Promise.all([
        this.environmentResolver.getDatabaseServer(),
        this.environmentResolver.getDatabaseName(),
      ]);

      const { username, password } = await this.environmentResolver.getDatabaseCredentials();
      const poolConfig = await this.getPoolConfiguration();

      const dbConfig: LocalDbConfig = {
        server: serverName,
        database: databaseName,
        user: username,
        password: password,
        pool: poolConfig,
        requestTimeout: TIMEOUTS.db.request,
        connectionTimeout: TIMEOUTS.db.connection,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
      };

      return dbConfig;
    } catch (error) {
      ErrorHandler.captureError(error, "configLocalDb", "Failed to configure local database");
      return undefined;
    }
  }

  public async configLocalAzureDb(): Promise<AzureDbConfig | undefined> {
    try {
      const [serverName, databaseName, port] = await Promise.all([
        this.environmentResolver.getDatabaseServer(),
        this.environmentResolver.getDatabaseName(),
        this.environmentResolver.getDatabasePort(),
      ]);

      const accessToken = await this.getLocalAzureAccessToken();
      const poolConfig = await this.getPoolConfiguration();

      const dbConfig: AzureDbConfig = {
        server: serverName,
        database: databaseName,
        port: port,
        pool: poolConfig,
        requestTimeout: TIMEOUTS.db.request,
        connectionTimeout: TIMEOUTS.db.connection,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
        authentication: {
          type: "azure-active-directory-access-token",
          options: { token: accessToken },
        },
      };

      return dbConfig;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "configLocalAzureDb",
        "Failed to configure Local Azure database",
      );
      return undefined;
    }
  }

  public async configCIAzureDb(): Promise<AzureDbConfig | undefined> {
    try {
      const [serverName, databaseName, port] = await Promise.all([
        this.environmentResolver.getDatabaseServer(),
        this.environmentResolver.getDatabaseName(),
        this.environmentResolver.getDatabasePort(),
      ]);

      const accessToken = await this.getCIAccessToken();
      const poolConfig = await this.getPoolConfiguration();

      const dbConfig: AzureDbConfig = {
        server: serverName,
        database: databaseName,
        port: port,
        pool: poolConfig,
        requestTimeout: TIMEOUTS.db.request,
        connectionTimeout: TIMEOUTS.db.connection,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
        authentication: {
          type: "azure-active-directory-access-token",
          options: { token: accessToken },
        },
      };

      return dbConfig;
    } catch (error) {
      ErrorHandler.captureError(error, "configCIAzureDb", "Failed to configure CI Azure database");
      return undefined;
    }
  }

  private async getPoolConfiguration() {
    try {
      return {
        max: 10,
        min: 1,
        idleTimeoutMillis: TIMEOUTS.db.idle,
        acquireTimeoutMillis: TIMEOUTS.db.poolAcquisition,
      };
    } catch (error) {
      ErrorHandler.captureError(error, "getPoolConfiguration", "Failed to get pool configuration");
      return {
        max: 10,
        min: 1,
        idleTimeoutMillis: TIMEOUTS.db.idle,
        acquireTimeoutMillis: TIMEOUTS.db.poolAcquisition,
      };
    }
  }

  private async getCIAccessToken(): Promise<string> {
    try {
      // Get CI credentials from environment
      const ciCredentials = await this.getAzureCICredentials();

      // Create service principal credential
      const credential = new ClientSecretCredential(
        ciCredentials.tenantId,
        ciCredentials.clientId,
        ciCredentials.clientSecret,
      );

      // Get token for SQL Database
      const response = await credential.getToken("https://database.windows.net/");

      if (!response?.token) {
        throw new Error("Failed to retrieve CI access token");
      }

      logger.debug("CI access token retrieved successfully");
      return response.token;
    } catch (error) {
      ErrorHandler.captureError(error, "getCIAccessToken", "Failed to get CI access token");
      throw error;
    }
  }

  private async getLocalAzureAccessToken(): Promise<string> {
    try {
      const response = await this.credential.getToken("https://database.windows.net/");

      if (!response?.token) {
        throw new Error("Failed to retrieve access token");
      }

      logger.debug("Access token retrieved successfully");
      return response.token;
    } catch (error) {
      ErrorHandler.captureError(error, "getAccessToken", "Failed to get access token");
      throw error;
    }
  }

  private async getAzureCICredentials(): Promise<CIAzureCredentials> {
    const [subscriptionId, tenantId, clientId, clientSecret] = await Promise.all([
      this.environmentResolver.getAzureSubscriptionId(),
      this.environmentResolver.getAzureTenantId(),
      this.environmentResolver.getAzureClientId(),
      this.environmentResolver.getAzureClientSecret(),
    ]);

    // Validate required values
    if (!this.validateRequiredValues({ subscriptionId, tenantId, clientId, clientSecret })) {
      ErrorHandler.logAndThrow("Missing required Azure credentials", "getAzureCICredentials");
    }

    return {
      subscriptionId: subscriptionId!,
      tenantId: tenantId!,
      clientId: clientId!,
      clientSecret: clientSecret!,
    };
  }

  private validateRequiredValues<T extends Record<string, string | null>>(
    values: T,
    context: string = "Required values",
  ): values is T & Record<keyof T, string> {
    const missingKeys: string[] = [];

    for (const [key, value] of Object.entries(values)) {
      if (!value || value.trim() === "") {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      const errorMessage = `${context} validation failed. Missing or empty values for: ${missingKeys.join(", ")}`;
      throw new Error(errorMessage);
    }

    return true;
  }
}
