import { test } from '../../fixtures/orangeHrm.fixtures';
import logger from '../../src/utils/logging/loggerManager';

test.describe.only('Top Menu Bar Test Suite @regression', () => {
  test.beforeEach(async ({ environmentResolver, loginPage }) => {
    const resolvedUrl = await environmentResolver.getPortalBaseUrl();
    await loginPage.navigateToUrl(resolvedUrl);
  });

  test('Verify Top menus are visible', async ({ topNavigationMenu }) => {
    await topNavigationMenu.verifyAndAssertTopMenuAreVisible(
      'Dashboard',
      '/upgrade-to-advanced',
      'Upgrade to Advanced from Open Source',
    );
    logger.info('Top menus are visible');
  });

  test('Verify User Profile dropdown options are visible', async ({ topNavigationMenu }) => {
    await topNavigationMenu.verifyUserProfileDropdownOptionsAreVisible();
    logger.info('User Profile dropdown options are visible');
  });
});
