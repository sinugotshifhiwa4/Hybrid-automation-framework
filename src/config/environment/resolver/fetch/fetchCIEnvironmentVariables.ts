import { CIEnvironmentConfig } from "../../../coreTypes/configTypes/ci-environment.types";
import { EnvironmentUtils } from "../environmentUtils";
import DataSanitizer from "../../../../utils/sanitization/dataSanitizer";
import { Credentials } from "../../../coreTypes/auth/credentials.types";

export class FetchCIEnvironmentVariables {
  /**
   * Stores all CI-specific environment variables used by the test framework.
   *
   * This configuration is loaded once when the class is instantiated and includes:
   * - App metadata like version, platform, and test type.
   * - Service URLs for API and portal endpoints.
   * - User credentials for both admin and portal users.
   * - Database connection details including Azure-specific configurations.
   */
  private readonly ciEnvironmentVariables: CIEnvironmentConfig = {
    urls: {
      apiBaseUrl: process.env.CI_API_BASE_URL!,
      portalBaseUrl: process.env.CI_PORTAL_BASE_URL!,
    },
    users: {
      admin: {
        username: process.env.CI_ADMIN_USERNAME!,
        password: process.env.CI_ADMIN_PASSWORD!,
      },
      portal: {
        username: process.env.CI_PORTAL_USERNAME!,
        password: process.env.CI_PORTAL_PASSWORD!,
      },
      database: {
        username: process.env.CI_DATABASE_USERNAME!,
        password: process.env.CI_DATABASE_PASSWORD!,
      },
    },
    database: {
      server: process.env.CI_DATABASE_SERVER!,
      name: process.env.CI_DATABASE_NAME!,
      port: parseInt(process.env.CI_DATABASE_PORT!, 10),
    },
    azureCredentials: {
      subscriptionId: process.env.CI_AZURE_SUBSCRIPTION_ID!,
      tenantId: process.env.CI_AZURE_TENANT_ID!,
      clientId: process.env.CI_AZURE_CLIENT_ID!,
      clientSecret: process.env.CI_AZURE_CLIENT_SECRET!,
    },
  };

  // URLs

  public async getApiBaseUrl(): Promise<string> {
    const getVariable = EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.urls.apiBaseUrl,
      "ciApiBaseUrl",
      "getApiBaseUrl",
      "Failed to get CI API base URL",
    );

    return getVariable;
  }

  public async getPortalBaseUrl(): Promise<string> {
    const getVariable = EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.urls.portalBaseUrl,
      "ciPortalBaseUrl",
      "getPortalBaseUrl",
      "Failed to get CI portal base URL",
    );

    return getVariable;
  }

  // Users

  public async getAdminCredentials(): Promise<Credentials> {
    EnvironmentUtils.verifyCredentials({
      username: this.ciEnvironmentVariables.users.admin.username,
      password: this.ciEnvironmentVariables.users.admin.password,
    });
    return {
      username: DataSanitizer.sanitizeString(this.ciEnvironmentVariables.users.admin.username),
      password: DataSanitizer.sanitizeString(this.ciEnvironmentVariables.users.admin.password),
    };
  }

  public async getPortalCredentials(): Promise<Credentials> {
    EnvironmentUtils.verifyCredentials({
      username: this.ciEnvironmentVariables.users.portal.username,
      password: this.ciEnvironmentVariables.users.portal.password,
    });
    return {
      username: DataSanitizer.sanitizeString(this.ciEnvironmentVariables.users.portal.username),
      password: DataSanitizer.sanitizeString(this.ciEnvironmentVariables.users.portal.password),
    };
  }

  // Database

  public async getDatabaseCredentials(): Promise<Credentials> {
    EnvironmentUtils.verifyCredentials({
      username: this.ciEnvironmentVariables.users.database.username,
      password: this.ciEnvironmentVariables.users.database.password,
    });
    return {
      username: DataSanitizer.sanitizeString(this.ciEnvironmentVariables.users.database.username),
      password: DataSanitizer.sanitizeString(this.ciEnvironmentVariables.users.database.password),
    };
  }

  public async getDatabaseServer(): Promise<string> {
    const getVariable = EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.database.server,
      "ciDatabaseServer",
      "getDatabaseServer",
      "Failed to get CI database server",
    );

    return getVariable;
  }

  public async getDatabaseName(): Promise<string> {
    const getVariable = EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.database.name,
      "ciDatabaseName",
      "getDatabaseName",
      "Failed to get CI database name",
    );

    return getVariable;
  }

  public async getDatabasePort(): Promise<number> {
    const port = await EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.database.port,
      "ciDatabasePort",
      "getDatabasePort",
      "Failed to get CI database port",
    );

    return port;
  }

  public async getAzureSubscriptionId(): Promise<string> {
    const getVariable = EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.azureCredentials.subscriptionId,
      "ciAzureSubscriptionId",
      "getAzureSubscriptionId",
      "Failed to get CI Azure subscription ID",
    );

    return getVariable;
  }

  public async getAzureTenantId(): Promise<string> {
    const getVariable = EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.azureCredentials.tenantId,
      "ciAzureTenantId",
      "getAzureTenantId",
      "Failed to get CI Azure tenant ID",
    );

    return getVariable;
  }

  public async getAzureClientId(): Promise<string> {
    const getVariable = EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.azureCredentials.clientId,
      "ciAzureClientId",
      "getAzureClientId",
      "Failed to get CI Azure client ID",
    );

    return getVariable;
  }

  public async getAzureClientSecret(): Promise<string> {
    const getVariable = EnvironmentUtils.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.azureCredentials.clientSecret,
      "ciAzureClientSecret",
      "getAzureClientSecret",
      "Failed to get CI Azure client secret",
    );

    return getVariable;
  }
}
