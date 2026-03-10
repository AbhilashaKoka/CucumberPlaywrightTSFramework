// utils/dropdown.util.ts
import { Page, Locator, expect } from "@playwright/test";

type Target = string | Locator;

export class DropdownUtil {
  private constructor() {}

  private static loc(page: Page, target: Target): Locator {
    return typeof target === "string" ? page.locator(target) : target;
  }

  // ---------------------------
  // Native <select> dropdowns
  // ---------------------------

  static async selectByLabel(page: Page, select: Target, label: string) {
    const sel = this.loc(page, select);
    await sel.waitFor({ state: "visible" });
    await sel.selectOption({ label });
  }

  static async selectByValue(page: Page, select: Target, value: string) {
    const sel = this.loc(page, select);
    await sel.waitFor({ state: "visible" });
    await sel.selectOption({ value });
  }

  static async selectByIndex(page: Page, select: Target, index: number) {
    const sel = this.loc(page, select);
    await sel.waitFor({ state: "visible" });
    await sel.selectOption({ index });
  }

  static async getSelectedText(page: Page, select: Target) {
    const sel = this.loc(page, select);
    await sel.waitFor({ state: "visible" });
    return await sel.locator("option:checked").innerText();
  }

  // ---------------------------
  // Custom dropdowns (click to open, then click option)
  // ---------------------------
  // Works for many UI libraries when options are visible in DOM after opening.

  static async selectCustomOption(
    page: Page,
    dropdownTrigger: Target,       // element you click to open dropdown
    optionText: string,            // visible option text
    optionsContainer?: Target      // optional: restrict search for options
  ) {
    const trigger = this.loc(page, dropdownTrigger);
    await trigger.waitFor({ state: "visible" });
    await trigger.click();

    const scope = optionsContainer ? this.loc(page, optionsContainer) : page.locator("body");
    const option = scope.getByRole("option", { name: optionText }).first();

    // Fallback when roles aren't present:
    const fallback = scope.locator(`text=${optionText}`).first();

    if (await option.count()) {
      await option.click();
    } else {
      await fallback.click();
    }
  }

  // Custom dropdown with search input inside the popup
  static async selectCustomOptionWithSearch(
    page: Page,
    dropdownTrigger: Target,
    searchBox: Target,
    optionText: string,
    optionsContainer?: Target
  ) {
    const trigger = this.loc(page, dropdownTrigger);
    await trigger.waitFor({ state: "visible" });
    await trigger.click();

    const search = this.loc(page, searchBox);
    await search.waitFor({ state: "visible" });
    await search.fill(optionText);

    const scope = optionsContainer ? this.loc(page, optionsContainer) : page.locator("body");
    const option = scope.getByRole("option", { name: optionText }).first();
    const fallback = scope.locator(`text=${optionText}`).first();

    if (await option.count()) {
      await option.click();
    } else {
      await fallback.click();
    }
  }

  // Optional assertion helper
  static async expectSelectedText(page: Page, select: Target, expected: string) {
    const actual = (await this.getSelectedText(page, select)).trim();
    expect(actual).toBe(expected);
  }
}
