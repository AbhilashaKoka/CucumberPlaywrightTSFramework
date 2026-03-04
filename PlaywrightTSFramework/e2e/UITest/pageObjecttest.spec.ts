// tests/login.spec.ts
import { test } from '@playwright/test';
import { LoginPage } from '../../pages/loginpage';

test('Page Object Model in Playwright', async ({ page }) => {
  const loginPage = new LoginPage(page); //variable name matches class
  await loginPage.goto();
  await loginPage.loginToHomePage('Admin', 'admin123');
});



