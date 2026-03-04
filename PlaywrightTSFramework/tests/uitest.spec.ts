import { test, expect } from '@playwright/test';
import qaTestData from "../test-data/qa/google.json";
import stageTestData from "../test-data/stage/google.json";
import { LoginPage } from '../pages/loginpage';

let testData: any;

test.beforeAll('Running before all tests', () => {
    if (process.env.ENV == 'qa') {
        testData = qaTestData;
    } else {
        testData = stageTestData;
    }
})

test('Page Object Model in Playwright', async ({ page }) => {
  const loginPage = new LoginPage(page); //variable name matches class
  await loginPage.goto();
  await loginPage.loginToHomePage('Admin', 'admin123');
});
