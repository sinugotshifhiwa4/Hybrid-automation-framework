import EnvironmentDetector from "../detector/detector";
import { FetchCIEnvironmentVariables } from "./fetch/fetchCIEnvironmentVariables";
import { FetchLocalEnvironmentVariables } from "./fetch/fetchLocalEnvironmentVariables";
import { EnvironmentUtils } from "./environmentUtils";
import { Credentials } from "../../coreTypes/auth/credentials.types";

export class EnvironmentResolver {
  private fetchCIEnvironmentVariables: FetchCIEnvironmentVariables;
  private FetchLocalEnvironmentVariables: FetchLocalEnvironmentVariables;

  private isCI = EnvironmentDetector.isCI();

  constructor(
    fetchCIEnvironmentVariables: FetchCIEnvironmentVariables,
    fetchLocalEnvironmentVariables: FetchLocalEnvironmentVariables,
  ) {
    this.fetchCIEnvironmentVariables = fetchCIEnvironmentVariables;
    this.FetchLocalEnvironmentVariables = fetchLocalEnvironmentVariables;
  }

  // Urls

  public async getApiBaseUrl(): Promise<string> {
    return EnvironmentUtils.getEnvironmentValue(
      () => this.fetchCIEnvironmentVariables.getApiBaseUrl(),
      () => this.FetchLocalEnvironmentVariables.getApiBaseUrl(),
      "getApiBaseUrl",
      "Failed to get API base URL",
    );
  }

  public async getPortalBaseUrl(): Promise<string> {
    return EnvironmentUtils.getEnvironmentValue(
      () => this.fetchCIEnvironmentVariables.getPortalBaseUrl(),
      () => this.FetchLocalEnvironmentVariables.getPortalBaseUrl(),
      "getPortalBaseUrl",
      "Failed to get portal base URL",
    );
  }

  public async getAdminCredentials(): Promise<Credentials> {
    return EnvironmentUtils.getEnvironmentValue(
      () => this.fetchCIEnvironmentVariables.getAdminCredentials(),
      () => this.FetchLocalEnvironmentVariables.getAdminCredentials(),
      "getAdminCredentials",
      "Failed to get admin credentials",
    );
  }

  public async getPortalCredentials(): Promise<Credentials> {
    return EnvironmentUtils.getEnvironmentValue(
      () => this.fetchCIEnvironmentVariables.getPortalCredentials(),
      () => this.FetchLocalEnvironmentVariables.getPortalCredentials(),
      "getPortalCredentials",
      "Failed to get portal credentials",
    );
  }

  // Database

  public async getDatabaseCredentials(): Promise<Credentials> {
    return EnvironmentUtils.getEnvironmentValue(
      () => this.fetchCIEnvironmentVariables.getDatabaseCredentials(),
      () => this.FetchLocalEnvironmentVariables.getDatabaseCredentials(),
      "getDatabaseCredentials",
      "Failed to get database credentials",
    );
  }

  public async getDatabaseServer(): Promise<string> {
    return EnvironmentUtils.getEnvironmentValue(
      () => this.fetchCIEnvironmentVariables.getDatabaseServer(),
      () => this.FetchLocalEnvironmentVariables.getDatabaseServer(),
      "getDatabaseServer",
      "Failed to get database server",
    );
  }

  public async getDatabaseName(): Promise<string> {
    return EnvironmentUtils.getEnvironmentValue(
      () => this.fetchCIEnvironmentVariables.getDatabaseName(),
      () => this.FetchLocalEnvironmentVariables.getDatabaseName(),
      "getDatabaseName",
      "Failed to get database name",
    );
  }

  public async getDatabasePort(): Promise<number> {
    return EnvironmentUtils.getEnvironmentValue(
      () => this.fetchCIEnvironmentVariables.getDatabasePort(),
      () => this.FetchLocalEnvironmentVariables.getDatabasePort(),
      "getDatabasePort",
      "Failed to get database port",
    );
  }

  // Azure methods - CI only, returns null for local environments
  public async getAzureSubscriptionId(): Promise<string | null> {
    // Check if running in CI environment
    if (this.isCI) {
      return this.fetchCIEnvironmentVariables.getAzureSubscriptionId();
    }
    return null; // Azure not needed for local development
  }

  public async getAzureTenantId(): Promise<string | null> {
    if (this.isCI) {
      return this.fetchCIEnvironmentVariables.getAzureTenantId();
    }
    return null;
  }

  public async getAzureClientId(): Promise<string | null> {
    if (this.isCI) {
      return this.fetchCIEnvironmentVariables.getAzureClientId();
    }
    return null;
  }

  public async getAzureClientSecret(): Promise<string | null> {
    if (this.isCI) {
      return this.fetchCIEnvironmentVariables.getAzureClientSecret();
    }
    return null;
  }
}
