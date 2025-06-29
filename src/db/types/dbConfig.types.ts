
interface BaseDbConfig {
  server: string;
  database: string;
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
    acquireTimeoutMillis: number;
  };
  requestTimeout: number;
  connectionTimeout: number;
}

// Common connection options
interface ConnectionOptions {
  encrypt: boolean;
  trustServerCertificate: boolean;
  enableArithAbort?: boolean;
}

export interface LocalDbConfig extends BaseDbConfig {
  user: string;
  password: string;
  options: ConnectionOptions;
}

export interface AzureDbConfig extends BaseDbConfig {
  port: number;
  options: Required<Pick<ConnectionOptions, "encrypt" | "trustServerCertificate">> & {
    encrypt: true;
    trustServerCertificate: false;
  };
  authentication: {
    type: "azure-active-directory-access-token";
    options: { token: string };
  };
}

export interface CIAzureCredentials {
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

// Union type for all possible database configurations
export type DbConfig = LocalDbConfig | AzureDbConfig;
