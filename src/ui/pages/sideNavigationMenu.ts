import { Locator, Page } from '@playwright/test';
import BasePage from '../base/basePage';

export class SideNavigationMenu extends BasePage {
  readonly page: Page;
  private readonly collapseSidebarToggle: Locator;
  private readonly expandSidebarToggle: Locator;
  private readonly companyLogo: Locator;
  private readonly searchInput: Locator;
  private readonly adminMenu: Locator;
  private readonly pimMenu: Locator;
  private readonly leaveMenu: Locator;
  private readonly timeMenu: Locator;
  private readonly recruitmentMenu: Locator;
  private readonly myInfoMenu: Locator;
  private readonly performanceMenu: Locator;
  private readonly dashboardMenu: Locator;
  private readonly directoryMenu: Locator;
  private readonly maintenanceMenu: Locator;
  private readonly claimsMenu: Locator;
  private readonly buzzMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.collapseSidebarToggle = page.locator(`button:has(i.bi-chevron-left)`);
    this.expandSidebarToggle = page.locator(`button:has(i.bi-chevron-right)`);
    this.companyLogo = page.getByRole('link', { name: 'client brand banner' });
    this.searchInput = page.getByPlaceholder('Search');
    this.adminMenu = page.getByRole('link', { name: 'Admin' });
    this.pimMenu = page.getByRole('link', { name: 'PIM' });
    this.leaveMenu = page.getByRole('link', { name: 'Leave' });
    this.timeMenu = page.getByRole('link', { name: 'Time' });
    this.recruitmentMenu = page.getByRole('link', { name: 'Recruitment' });
    this.myInfoMenu = page.getByRole('link', { name: 'My Info' });
    this.performanceMenu = page.getByRole('link', { name: 'Performance' });
    this.dashboardMenu = page.getByRole('link', { name: 'Dashboard' });
    this.directoryMenu = page.getByRole('link', { name: 'Directory' });
    this.maintenanceMenu = page.getByRole('link', { name: 'Maintenance' });
    this.claimsMenu = page.getByRole('link', { name: 'Claim' });
    this.buzzMenu = page.getByRole('link', { name: 'Buzz' });
  }

  async verifyCollapseSidebarToggleIsVisible() {
    await this.assertElementState(this.collapseSidebarToggle, 'visible', 'Collapse sidebar toggle');
  }

  async verifyCollapseSidebarToggleHidden() {
    await this.assertElementState(this.collapseSidebarToggle, 'hidden', 'Collapse sidebar toggle');
  }

  async clickCollapseSidebarToggle() {
    await this.performAction(
      () => this.collapseSidebarToggle.click(),
      'Collapsed sidebar',
      'Failed to collapse sidebar',
    );
  }

  async verifyExpandSidebarToggleIsVisible() {
    await this.assertElementState(this.expandSidebarToggle, 'visible', 'Expand sidebar toggle');
  }

  async verifyExpandSidebarToggleIsHidden() {
    await this.assertElementState(this.expandSidebarToggle, 'hidden', 'Expand sidebar toggle');
  }

  async clickExpandSidebarToggle() {
    await this.performAction(
      () => this.expandSidebarToggle.click(),
      'Expanded sidebar',
      'Failed to expand sidebar',
    );
  }

  async verifyCompanyLogoIsVisible() {
    await this.assertElementState(this.companyLogo, 'visible', 'Company Logo');
  }

  async fillSearchInput(searchTerm: string) {
    await this.fillElement(this.searchInput, searchTerm, 'Search input');
  }

  async verifyAdminMenuIsVisible() {
    await this.assertElementState(this.adminMenu, 'visible', 'Admin menu');
  }

  async verifyPimMenuIsVisible() {
    await this.assertElementState(this.pimMenu, 'visible', 'PIM menu');
  }

  async verifyLeaveMenuIsVisible() {
    await this.assertElementState(this.leaveMenu, 'visible', 'Leave menu');
  }

  async verifyTimeMenuIsVisible() {
    await this.assertElementState(this.timeMenu, 'visible', 'Time menu');
  }

  async verifyRecruitmentMenuIsVisible() {
    await this.assertElementState(this.recruitmentMenu, 'visible', 'Recruitment menu');
  }

  async verifyMyInfoMenuIsVisible() {
    await this.assertElementState(this.myInfoMenu, 'visible', 'My info menu');
  }

  async verifyPerformanceMenuIsVisible() {
    await this.assertElementState(this.performanceMenu, 'visible', 'Performance menu');
  }

  async verifyDashboardMenuIsVisible() {
    await this.assertElementState(this.dashboardMenu, 'visible', 'Dashboard menu');
  }

  async isDashboardMenuVisible() {
    return await this.isElementVisible(this.dashboardMenu);
  }

  async verifyDirectoryMenuIsVisible() {
    await this.assertElementState(this.directoryMenu, 'visible', 'Directory menu');
  }

  async verifyMaintenanceMenuIsVisible() {
    await this.assertElementState(this.maintenanceMenu, 'visible', 'Maintenance menu');
  }

  async verifyClaimsMenuIsVisible() {
    await this.assertElementState(this.claimsMenu, 'visible', 'Claims menu');
  }

  async verifyBuzzMenuIsVisible() {
    await this.assertElementState(this.buzzMenu, 'visible', 'Buzz menu');
  }

  async verifySideMenusAreVisible() {
    await this.verifyCompanyLogoIsVisible();
    await this.verifyAdminMenuIsVisible();
    await this.verifyPimMenuIsVisible();
    await this.verifyLeaveMenuIsVisible();
    await this.verifyTimeMenuIsVisible();
    await this.verifyRecruitmentMenuIsVisible();
    await this.verifyMyInfoMenuIsVisible();
    await this.verifyPerformanceMenuIsVisible();
    await this.verifyDashboardMenuIsVisible();
    await this.verifyDirectoryMenuIsVisible();
    await this.verifyMaintenanceMenuIsVisible();
    await this.verifyClaimsMenuIsVisible();
    await this.verifyBuzzMenuIsVisible();
  }
}
