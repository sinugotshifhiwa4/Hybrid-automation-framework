import { test } from "../../fixtures/orangeHrm.fixtures";
import logger from "../../src/utils/logging/loggerManager";

test.describe("Side Menu Bar Test Suite @regression", () => {
  test.beforeEach(async ({ environmentResolver, loginPage }) => {
    const resolvedUrl = await environmentResolver.getPortalBaseUrl();
    await loginPage.navigateToUrl(resolvedUrl);
  });

  test("Verify side menus are visible", async ({ sideNavigationMenu }) => {
    await sideNavigationMenu.verifySideMenusAreVisible();
    logger.info("Side menus are visible");
  });
});
