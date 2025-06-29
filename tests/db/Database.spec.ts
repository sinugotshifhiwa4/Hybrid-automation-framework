import { test, expect } from "../../fixtures/orangeHrm.fixtures";
import logger from "../../src/utils/logging/loggerManager";

test.describe("Database -Security Test Suite", () => {
  test(`Verify successful retrieval of admin security info`, async ({ securityService }) => {
    const result = await securityService.getUserSecurityInfo("admin");

    if (!result) throw new Error("Admin security info not found");

    expect(result.FailedLoginCount).toBe(0);
    expect(result.PermittedFailedLoginCount).toBe(5);
    expect(result.IsLockedOut).toBe(false);
    expect(result.IsAdministrativeLockedOut).toBe(false);

    logger.info(`Result: ${JSON.stringify(result)}`);
    logger.info("Admin security info retrieved successfully");
  });
});
