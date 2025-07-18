import { EnvironmentUtils } from "../environmentUtils";
import ENV from "../../variables/variables";
import { Credentials } from "../../../coreTypes/auth/credentials.types";

export class FetchLocalEnvironmentVariables {
  // Urls

  public async getApiBaseUrl(): Promise<string> {
    return EnvironmentUtils.getEnvironmentVariable<string>(
      () => ENV.API_BASE_URL,
      "localApiBaseUrl",
      "getApiBaseUrl",
      "Failed to get local API base URL",
    );
  }

  public async getPortalBaseUrl(): Promise<string> {
    return EnvironmentUtils.getEnvironmentVariable<string>(
      () => ENV.PORTAL_BASE_URL,
      "localPortalBaseUrl",
      "getPortalBaseUrl",
      "Failed to get local portal base URL",
    );
  }

  // Users

  public async getAdminCredentials(): Promise<Credentials> {
    EnvironmentUtils.verifyCredentials({
      username: ENV.ADMIN_USERNAME,
      password: ENV.ADMIN_PASSWORD,
    });
    return EnvironmentUtils.decryptCredentials(
      ENV.ADMIN_USERNAME,
      ENV.ADMIN_PASSWORD,
      EnvironmentUtils.getSecretKeyForCurrentEnvironment(),
    );
  }

  /**
   * Get portal credentials for specified environment
   * @param environmentForSecretKeyVariable - The environment ('dev', 'uat', or 'prod'). Defaults to 'dev'
   * @param shouldDecrypt - Whether to decrypt the credentials. Defaults to true
   */
  public async getPortalCredentials(): Promise<Credentials> {
    EnvironmentUtils.verifyCredentials({
      username: ENV.PORTAL_USERNAME,
      password: ENV.PORTAL_PASSWORD,
    });

    return EnvironmentUtils.decryptCredentials(
      ENV.PORTAL_USERNAME,
      ENV.PORTAL_PASSWORD,
      EnvironmentUtils.getSecretKeyForCurrentEnvironment(),
    );
  }

  // Database
  /**
   * Get database credentials for specified environment
   * @param environmentForSecretKeyVariable - The environment ('dev', 'uat', or 'prod'). Defaults to 'dev'
   * @param shouldDecrypt - Whether to decrypt the credentials. Defaults to true
   */
  public async getDatabaseCredentials(): Promise<Credentials> {
    EnvironmentUtils.verifyCredentials({
      username: ENV.DB_USERNAME,
      password: ENV.DB_PASSWORD,
    });
    return EnvironmentUtils.decryptCredentials(
      ENV.DB_USERNAME,
      ENV.DB_PASSWORD,
      EnvironmentUtils.getSecretKeyForCurrentEnvironment(),
    );
  }

  public async getDatabaseServer(): Promise<string> {
    return EnvironmentUtils.getEnvironmentVariable<string>(
      () => ENV.DB_SERVER,
      "localDatabaseServer",
      "getDatabaseServer",
      "Failed to get local database server",
    );
  }

  public async getDatabaseName(): Promise<string> {
    return EnvironmentUtils.getEnvironmentVariable<string>(
      () => ENV.DATABASE_NAME,
      "localDatabaseName",
      "getDatabaseName",
      "Failed to get local database name",
    );
  }

  public async getDatabasePort(): Promise<number> {
    return EnvironmentUtils.getEnvironmentVariable<number>(
      () => parseInt(ENV.DB_PORT, 10),
      "localDatabasePort",
      "getDatabasePort",
      "Failed to get local database port",
    );
  }
}
