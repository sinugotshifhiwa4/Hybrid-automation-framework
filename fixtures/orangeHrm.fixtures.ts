import { test as baseTest } from "@playwright/test";
import AuthStorageManager from "../src/utils/auth/storage/authStorageManager";
import AsyncFileManager from "../src/utils/fileSystem/fileSystemManager";
import AuthenticationFilter from "../src/utils/auth/authenticationFilter";
import { FetchCIEnvironmentVariables } from "../src/config/environment/resolver/fetch/fetchCIEnvironmentVariables";
import { FetchLocalEnvironmentVariables } from "../src/config/environment/resolver/fetch/fetchLocalEnvironmentVariables";
import { EnvironmentResolver } from "../src/config/environment/resolver/environmentResolver";
import { BrowserSessionManager } from "../src/utils/auth/state/browserSessionManager";
import { TopNavigationMenu } from "../src/ui/pages/topNavigationMenu";
import { SideNavigationMenu } from "../src/ui/pages/sideNavigationMenu";
import { LoginPage } from "../src/ui/pages/loginPage";
import logger from "../src/utils/logging/loggerManager";

import { DatabaseConfiguration } from "../src/db/config/databaseConfiguration";
import { DatabaseConnection } from "../src/db/connection/databaseConnection";
import { QueryExecutor } from "../src/db/query/queryExecutor";
import { SecurityQueries } from "../src/db/query/securityQueries";
import { SecurityService } from "../src/db/service/securityService";

type customFixtures = {
  shouldSaveAuthState: boolean;
  fetchCIEnvironmentVariables: FetchCIEnvironmentVariables;
  fetchLocalEnvironmentVariables: FetchLocalEnvironmentVariables;
  environmentResolver: EnvironmentResolver;
  loginPage: LoginPage;
  browserSessionManager: BrowserSessionManager;
  topNavigationMenu: TopNavigationMenu;
  sideNavigationMenu: SideNavigationMenu;

  databaseConfiguration: DatabaseConfiguration;
  databaseConnection: DatabaseConnection;
  queryExecutor: QueryExecutor;
  securityQueries: SecurityQueries;
  securityService: SecurityService;
};

export const orangeHrmFixtures = baseTest.extend<customFixtures>({
  shouldSaveAuthState: [true, { option: true }],
  fetchCIEnvironmentVariables: async ({}, use) => {
    await use(new FetchCIEnvironmentVariables());
  },
  fetchLocalEnvironmentVariables: async ({}, use) => {
    await use(new FetchLocalEnvironmentVariables());
  },

  environmentResolver: async (
    { fetchCIEnvironmentVariables, fetchLocalEnvironmentVariables },
    use,
  ) => {
    await use(new EnvironmentResolver(fetchCIEnvironmentVariables, fetchLocalEnvironmentVariables));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  browserSessionManager: async ({ page, environmentResolver, loginPage }, use) => {
    await use(new BrowserSessionManager(page, environmentResolver, loginPage));
  },
  topNavigationMenu: async ({ page }, use) => {
    await use(new TopNavigationMenu(page));
  },
  sideNavigationMenu: async ({ page }, use) => {
    await use(new SideNavigationMenu(page));
  },

  databaseConfiguration: async ({ environmentResolver }, use) => {
    await use(new DatabaseConfiguration(environmentResolver));
  },
  databaseConnection: async ({ databaseConfiguration }, use) => {
    await use(new DatabaseConnection(databaseConfiguration));
  },
  queryExecutor: async ({}, use) => {
    await use(new QueryExecutor());
  },

  securityQueries: async ({}, use) => {
    await use(new SecurityQueries());
  },
  securityService: async ({ queryExecutor, databaseConnection, securityQueries }, use) => {
    await use(new SecurityService(queryExecutor, databaseConnection, securityQueries));
  },

  context: async ({ browser, shouldSaveAuthState }, use, testInfo) => {
    let storageState: string | undefined;

    // Use AuthenticationFilter to determine if auth should be skipped
    const shouldSkipAuth = AuthenticationFilter.shouldSkipAuthSetup(testInfo, [
      "verify URL and title",
      "Invalid Credentials",
      "login footer details",
      "reset password",
      "forgot password",
    ]);

    if (shouldSaveAuthState && !shouldSkipAuth) {
      const storagePath = await AuthStorageManager.resolveAuthStateFilePath();
      const fileExists = await AsyncFileManager.doesFileExist(storagePath);

      if (fileExists) {
        storageState = storagePath;
        logger.info(`Using auth state from: ${storagePath}`);
      } else {
        logger.warn(
          `Auth state file not found at: ${storagePath}. Please run the authentication setup first.`,
        );
        storageState = undefined;
      }
    } else {
      logger.info(`Skipping auth state for test: ${testInfo.title}`);
      storageState = undefined;
    }

    const context = await browser.newContext({ storageState });
    await use(context);
    await context.close();
  },
});

export const test = orangeHrmFixtures;
export const expect = baseTest.expect;
