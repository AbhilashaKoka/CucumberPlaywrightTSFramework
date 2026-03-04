import { test, expect } from '@playwright/test';

import fs from 'fs';
import path from 'path';
import {parse} from 'csv-parse/sync'
const records= parse (
    fs.readFileSync(path.join(__dirname,"../../test-data/qa/google.csv")),
    {
        columns:true,
        skip_empty_lines:true
    }
);


for(const record of records){

test('Data Driven testing Using CSV File File in Playwright ${record.TestCaseId}', async ({ page }) => 
    {
await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
await page.getByRole('textbox', { name: 'Username' }).click();
await page.getByRole('textbox', { name: 'Username' }).fill(record.UserName);
await page.getByRole('textbox', { name: 'Password' }).fill(record.Password);
await page.getByRole('button', { name: 'Login' }).click();
})

}
