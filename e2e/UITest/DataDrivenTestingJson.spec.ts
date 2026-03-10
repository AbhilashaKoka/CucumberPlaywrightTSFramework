import { test, expect } from '@playwright/test';
import{QATestData} from '../../test-data/qa/google.json'
import{StageTestData} from '../../test-data/stage/google.json'


test.describe('Module1 Test',()=>{

    let testData=null;

    test.beforeAll('running before all test',()=>{
        if(process.env.ENV=='qa'){
            testData=QATestData;
        }
        else{
            testData=StageTestData;
        }

 })
 test('Data Driven testing Using QA JSON File File in Playwright', async ({ page }) => {
await page.goto(process.env.URL);
await page.getByRole('textbox', { name: 'Username' }).click();
await page.getByRole('textbox', { name: 'Username' }).fill(testData.username);
await page.getByRole('textbox', { name: 'Password' }).fill(testData.password);
await page.getByRole('button', { name: 'Login' }).click();
})

})




