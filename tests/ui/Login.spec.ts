import { test } from "../../fixtures/orangeHrm.fixtures";
import logger from "../../src/utils/logging/loggerManager";

test.describe("Login Page Validation", () => {
  test.beforeEach(async ({ environmentResolver, loginPage }) => {
    const resolvedUrl = await environmentResolver.getPortalBaseUrl();
    await loginPage.navigateToUrl(resolvedUrl);
  });

  test("Verify navigation to login page and verify URL and title", async ({
    loginPage,
    environmentResolver,
  }) => {
    const resolvedUrl = await environmentResolver.getPortalBaseUrl();

    await loginPage.verifyPageUrl(resolvedUrl, { exact: true });
    await loginPage.verifyPageTitle("OrangeHRM", { exact: true });

    logger.info("Login page successfully loaded and validated");
  });
});

test.describe("Login - Login Flow @regression", () => {
  test.beforeEach(async ({ environmentResolver, loginPage }) => {
    const resolvedUrl = await environmentResolver.getPortalBaseUrl();
    await loginPage.navigateToUrl(resolvedUrl);
  });

  test("Verify user can login successfully with valid credentials @sanity", async ({
    loginPage,
    sideNavigationMenu,
  }) => {
    await loginPage.verifyLoginErrorIsNotDisplayed();
    await sideNavigationMenu.verifyDashboardMenuIsVisible();

    logger.info("Login successful");
  });

  test("Verify user with invalid credentials cannot login @sanity", async ({
    loginPage,
    environmentResolver,
    browserSessionManager,
  }) => {
    const { username } = await environmentResolver.getPortalCredentials();

    await browserSessionManager.performLogin(username, "invalidPassword", false);
    await loginPage.verifyLoginErrorIsDisplayed();
    logger.info("Login failed");
  });
});

test.describe("Login - Forgot Password Flow", () => {
  test.beforeEach(async ({ environmentResolver, loginPage }) => {
    const resolvedUrl = await environmentResolver.getPortalBaseUrl();
    await loginPage.navigateToUrl(resolvedUrl);
  });

  test("Verify user can reset password successfully", async ({ loginPage }) => {
    await loginPage.verifyResetPasswordFlow("Admin", "Reset Password link sent successfully");
    logger.info("Password reset successful");
  });
});

test.describe("Login - Footer Elements", () => {
  test.beforeEach(async ({ environmentResolver, loginPage }) => {
    const resolvedUrl = await environmentResolver.getPortalBaseUrl();
    await loginPage.navigateToUrl(resolvedUrl);
  });

  test("Verify login footer details", async ({ loginPage }) => {
    await loginPage.verifyFooterDetails(
      "OrangeHRM OS 5.7",
      "© 2005 - 2025 OrangeHRM, Inc. All rights reserved.",
      "http://www.orangehrm.com",
    );
    logger.info("Footer elements are visible");
  });
});
