import { test, expect } from "@playwright/test";
import { Actions } from "../../utils/actions";
import { DropdownUtil } from "../../utils/dropdown.util";
import {FrameUtil} from "../../utils/frames.util";
import {DatePickerUtil} from "../../utils/datepicker.util";
import {NavigateUtil} from "../../utils/navigate.util";
import { AssertUtil } from "../../utils/assert.util";
test("mouse + keyboard + drag-drop", async ({ page }) => {
   
await NavigateUtil.goto(page, "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
//assert URL
await expect(page).toHaveURL('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
await Actions.type(page,"input[placeholder='Username']","Admin");
await Actions.type(page,"input[placeholder='Password']","admin123");  
await Actions.click(page,"button[type='submit']");
 
// await NavigateUtil.goto(page, "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
//   await Actions.click(page, "#login");
//   await Actions.type(page, "#username", "abhilasha");
//   await Actions.type(page, "#password", "secret");
//   await Actions.press(page, "#password", "Enter");
//   await Actions.hover(page, ".menu");
//   await Actions.rightClick(page, ".row-item");
//   await Actions.dragAndDrop(page, "#card-1", "#lane-done");
//   // Native <select>
// await DropdownUtil.selectByLabel(page, "#country", "India");
// await DropdownUtil.selectByValue(page, "#country", "IN");
// // Custom dropdown
// await DropdownUtil.selectCustomOption(page, "#cityDropdown", "Pune");
// // Custom dropdown with search
// await DropdownUtil.selectCustomOptionWithSearch(
//   page,
//   "#assigneeDropdown",
//   "input[placeholder='Search']",
//   "Abhilasha"
// );
// const paymentFrame = FrameUtil.frame(page, "iframe#paymentFrame");
// await paymentFrame.locator("#cardNumber").fill("4111111111111111");
// await paymentFrame.locator("#pay").click();
// // Or with helpers:
// await FrameUtil.fillInFrame(page, "iframe#paymentFrame", "#cardNumber", "4111111111111111");
// await FrameUtil.clickInFrame(page, "iframe#paymentFrame", "#pay");
// await DatePickerUtil.setNativeDate(page, "#dob", "2026-02-18");
// await DatePickerUtil.setTypedDate(page, "#startDate", "18/02/2026");
// await DatePickerUtil.pickFromCalendar({
//   page,
//   input: "#dateField",
//   targetMonthYear: "February 2026",
//   day: 18,
//   header: ".calendar-header",
//   nextButton: ".calendar-next",
//   dayCell: (d) => page.getByRole("gridcell", { name: String(d) })
// });
// await NavigateUtil.goto(page, "https://example.com/login", { retries: 2, waitUntil: "domcontentloaded" });
// await NavigateUtil.back(page);
// await NavigateUtil.forward(page);
// await NavigateUtil.reload(page, { waitUntil: "networkidle" });
// const popup = await NavigateUtil.waitForPopup(page, async () => {
//   await page.getByRole("link", { name: "Open Report" }).click();
// });
// const heading = page.getByRole('heading', { name: /welcome/i });
// await AssertUtil.toBeVisible(heading);
// await AssertUtil.toHaveText(heading, /welcome/i); // regex, case-insensitive
// const items = page.locator('.todo .item');
// await AssertUtil.toHaveText(items, ['First', 'Second', /Third/i], { timeout: 15000 });
});