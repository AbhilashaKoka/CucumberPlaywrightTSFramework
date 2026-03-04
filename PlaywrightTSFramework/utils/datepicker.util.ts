// utils/datepicker.util.ts
import { Page, Locator, expect } from "@playwright/test";

type Target = string | Locator;

export class DatePickerUtil {
  private constructor() {}

  private static loc(page: Page, target: Target): Locator {
    return typeof target === "string" ? page.locator(target) : target;
  }

  // -----------------------------------------
  // Pattern 1: Native input[type="date"]
  // Format required: YYYY-MM-DD
  // -----------------------------------------
  static async setNativeDate(page: Page, input: Target, yyyyMmDd: string) {
    const el = this.loc(page, input);
    await el.waitFor({ state: "visible" });
    await el.fill(yyyyMmDd);
  }

  // -----------------------------------------
  // Pattern 2: Text input date (MM/DD/YYYY etc.)
  // Useful when app supports typing.
  // -----------------------------------------
  static async setTypedDate(page: Page, input: Target, dateText: string) {
    const el = this.loc(page, input);
    await el.waitFor({ state: "visible" });
    await el.click();
    await el.fill("");         // clear
    await el.type(dateText);   // type like a user
  }

  // -----------------------------------------
  // Pattern 3: Calendar widget picker
  // You provide selectors for:
  // - input (opens calendar)
  // - header (shows "February 2026" etc.)
  // - next/prev buttons
  // - day cell locator builder
  //
  // Example dayCell: (day) => `.react-datepicker__day--0${day}`
  // OR more generic: (day) => `role=gridcell[name="${day}"]`
  // -----------------------------------------
  static async pickFromCalendar(params: {
    page: Page;
    input: Target;
    targetMonthYear: string;     // e.g. "February 2026"
    day: number;                 // 1-31
    header: Target;              // element that displays month-year
    nextButton: Target;          // click to go next month
    prevButton?: Target;         // optional: go previous month
    dayCell: (day: number) => Target; // function returning locator/selector for the day cell
    maxNavClicks?: number;       // safety loop
  }) {
    const {
      page,
      input,
      targetMonthYear,
      day,
      header,
      nextButton,
      prevButton,
      dayCell,
      maxNavClicks = 24
    } = params;

    const inputEl = this.loc(page, input);
    await inputEl.waitFor({ state: "visible" });
    await inputEl.click();

    const headerEl = this.loc(page, header);
    await headerEl.waitFor({ state: "visible" });

    // Try navigating forward (common scenario)
    for (let i = 0; i < maxNavClicks; i++) {
      const text = (await headerEl.innerText()).trim();
      if (text === targetMonthYear) break;
      await this.loc(page, nextButton).click();
    }

    // Optional: If still not matching and prevButton exists, try going back
    const finalText = (await headerEl.innerText()).trim();
    if (finalText !== targetMonthYear && prevButton) {
      for (let i = 0; i < maxNavClicks; i++) {
        const text = (await headerEl.innerText()).trim();
        if (text === targetMonthYear) break;
        await this.loc(page, prevButton).click();
      }
    }

    expect((await headerEl.innerText()).trim()).toBe(targetMonthYear);

    const dayEl = this.loc(page, dayCell(day));
    await dayEl.waitFor({ state: "visible" });
    await dayEl.click();
  }
}