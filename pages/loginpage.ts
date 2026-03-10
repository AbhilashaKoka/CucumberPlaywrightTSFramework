// Pages/loginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  private page: Page;

  // Declare types, don't initialize yet
  private usernameInput: Locator;
  private passwordInput: Locator;
  private loginButton: Locator;
    /**
     * 
     * @param {import {'@playwright/test'}.Page} page 
     */
   constructor(page: Page) {
    this.page = page;
    // Initialize AFTER this.page is assigned
    this.usernameInput = this.page.locator('input[placeholder="Username"]')
    this.passwordInput = this.page.locator('input[placeholder="Password"]')
    this.loginButton = this.page.locator('button[type="submit"]')
  }
  async goto() {
    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  }
  async loginToHomePage(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
}}
