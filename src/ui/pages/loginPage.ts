import { Page, Locator, expect } from '@playwright/test';
import BasePage from '../base/basePage';

export class LoginPage extends BasePage {
  public readonly page: Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly companyLogo: Locator;
  private readonly loginError: Locator;

  // Forget Password
  private readonly forgotPasswordLink: Locator;
  private readonly resetPasswordContainerHeader: Locator;
  private readonly forgotPasswordCancelButton: Locator;
  private readonly forgotPasswordResetButton: Locator;
  private readonly resetPasswordSuccessMessage: Locator;

  // Footer
  private readonly footerVersionInfo: Locator;
  private readonly footerCopyrightDetails: Locator;
  private readonly footerCompanyLinkText: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.companyLogo = page.getByRole('img', { name: 'company-branding' });
    this.loginError = page.locator('p', { hasText: 'Invalid credentials' });
    this.forgotPasswordLink = page.getByText('Forgot your password?');
    this.resetPasswordContainerHeader = page.getByRole('heading', {
      name: 'Reset Password',
      level: 6,
    });
    this.forgotPasswordCancelButton = page.getByRole('button', { name: 'Cancel' });
    this.forgotPasswordResetButton = page.getByRole('button', { name: 'Reset Password' });
    this.resetPasswordSuccessMessage = page.getByRole('heading', {
      name: 'Reset Password link sent successfully',
      level: 6,
    });
    this.footerVersionInfo = page.locator('p', { hasText: 'OrangeHRM OS 5.7' });
    this.footerCopyrightDetails = page.locator('p', { hasText: 'All rights reserved.' });
    this.footerCompanyLinkText = page.getByRole('link', { name: 'OrangeHRM, Inc' });
  }

  public async fillUsernameInput(username: string): Promise<void> {
    await this.fillElement(this.usernameInput, username, 'Username');
  }

  public async fillPasswordInput(password: string): Promise<void> {
    await this.fillElement(this.passwordInput, password, 'Password');
  }

  public async clickLoginButton(): Promise<void> {
    await this.clickElement(this.loginButton, 'Login button');
  }

  public async verifyCompanyLogoIsDisplayed(): Promise<void> {
    await this.verifyElementState(this.companyLogo, 'visible', 'Company logo');
  }

  public async verifyLoginErrorIsDisplayed(): Promise<void> {
    await this.verifyElementState(this.loginError, 'visible', 'Login error');
  }

  public async verifyLoginErrorIsNotDisplayed(): Promise<void> {
    await this.verifyElementState(this.loginError, 'hidden', 'Login error');
  }

  public async clickForgotPasswordLink(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink, 'Forgot password link');
  }

  public async verifyFooterDetails(
    expectedFooterVersionInfo: string,
    expectedFooterDetails: string,
    expectedFooterCompanyLinkHref: string,
  ): Promise<void> {
    const actualFooterVersionInfo = await this.getFooterVersionInfo();
    const actualFooterCopyrightDate = await this.getFooterCopyrightDetails();
    const actualFooterCompanyLinkHref = await this.getFooterCompanyLinkHref();

    expect(actualFooterVersionInfo).toBe(expectedFooterVersionInfo);
    expect(actualFooterCopyrightDate).toBe(expectedFooterDetails);
    expect(actualFooterCompanyLinkHref).toBe(expectedFooterCompanyLinkHref);
  }

  private async getFooterVersionInfo(): Promise<string> {
    const versionInfo = await this.getElementProperty<string>(
      this.footerVersionInfo,
      'textContent',
      undefined,
      'Footer version info',
    );

    return versionInfo;
  }

  private async getFooterCopyrightDetails(): Promise<string> {
    const copyrightDate = await this.getElementProperty<string>(
      this.footerCopyrightDetails,
      'textContent',
      undefined,
      'Footer copyright details',
    );

    return copyrightDate;
  }

  private async getFooterCompanyLinkHref(): Promise<string> {
    const href = await this.footerCompanyLinkText.getAttribute('href');
    return href || '';
  }

  public async verifyResetPasswordContainerHeaderIsDisplayed(): Promise<void> {
    await this.verifyElementState(
      this.resetPasswordContainerHeader,
      'visible',
      'Reset password container header',
    );
  }

  public async clickResetPasswordCancelButton(): Promise<void> {
    await this.clickElement(this.forgotPasswordCancelButton, 'Reset password cancel button');
  }

  public async clickResetPasswordResetButton(): Promise<void> {
    await this.clickElement(this.forgotPasswordResetButton, 'Reset password reset button');
  }

  public async verifyResetPasswordSuccessMessageIsDisplayed(): Promise<void> {
    await this.verifyElementState(
      this.resetPasswordSuccessMessage,
      'visible',
      'Reset password success message',
    );
  }

  public async verifyCorrectResetPasswordSuccessMessage(
    expectedSuccessMessage: string,
  ): Promise<void> {
    const actualSuccessMessage = await this.getResetPasswordSuccessMessage();
    expect(actualSuccessMessage).toBe(expectedSuccessMessage);
  }

  private async getResetPasswordSuccessMessage(): Promise<string> {
    const successMessage = await this.getElementProperty<string>(
      this.resetPasswordSuccessMessage,
      'textContent',
      undefined,
      'Reset password success message',
    );
    return successMessage;
  }

  public async verifyResetPasswordFlow(
    username: string,
    expectedSuccessMessage: string,
  ): Promise<void> {
    await this.clickForgotPasswordLink();
    await this.verifyResetPasswordContainerHeaderIsDisplayed();
    await this.fillUsernameInput(username);
    await this.clickResetPasswordResetButton();
    await this.verifyResetPasswordSuccessMessageIsDisplayed();
    await this.verifyCorrectResetPasswordSuccessMessage(expectedSuccessMessage);
  }
}
