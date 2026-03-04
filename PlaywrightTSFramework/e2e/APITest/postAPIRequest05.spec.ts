import { test, expect } from "@playwright/test";
import BookingDynamicAPIRequestBody from '../../test-data/api-requests/booking_dynamic_request_body.json';
import { StringFormat } from "../../utils/stringFormat";


test("POST booking with dynamic body", async ({ request }) => {
  // 1) Build the dynamic request body string from a template
  const dynamicRequestBodyStr = StringFormat.formatStr(
    JSON.stringify(BookingDynamicAPIRequestBody),
    "sita",           // {0}
    "Kumari",         // {1}
    "Apple Mobile"   // {2}
  );

  // 2) Parse the string back to an object (if your endpoint expects JSON)
  const dynamicRequestBody = JSON.parse(dynamicRequestBodyStr);

  // 3) Send the POST request
  const postAPIResponse = await request.post("/booking", {
    headers: { "Content-Type": "application/json" },
    data: dynamicRequestBody
  });

  // 4) Basic assertions
  expect(postAPIResponse.ok()).toBeTruthy();
  const json = await postAPIResponse.json();
  expect(json).toBeTruthy();
});