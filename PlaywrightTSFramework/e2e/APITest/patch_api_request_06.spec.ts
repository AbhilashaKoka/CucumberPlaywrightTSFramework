import { test, expect } from "@playwright/test";
import BookingDynamicAPIRequestBody1 from '../../test-data/api-requests/booking_dynamic_request_body.json';
import { StringFormat } from "../../utils/stringFormat"; 
const tokenRequestBody = require('../../test-data/api-requests/token_request_body.json');
const patchRequestBody = require('../../test-data/api-requests/patch_request_body.json');
test("Create PATCH bookingAPI request in Playwright", async ({ request }) => {
  // 1) Build the dynamic request body string from a template
  const dynamicRequestBodyStr = StringFormat.formatStr(
    JSON.stringify(BookingDynamicAPIRequestBody1),
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

  // 4)get booking Id from the post response
  const postResponseJson = await postAPIResponse.json();
  const bookingId = postResponseJson.bookingid;
  console.log("Created Booking ID:", bookingId);

  // 5) Basic assertions
  expect(postAPIResponse.ok()).toBeTruthy();
  const json = await postAPIResponse.json();
  expect(json).toBeTruthy();

  // 6) Send the GET request to retrieve the booking details
 const getAPIResponse = await request.get(`/booking/${bookingId}`);
 console.log("Get Booking Response:", await getAPIResponse.json());
 console.log("Get Booking Status:", getAPIResponse.status());
 expect(getAPIResponse.ok()).toBeTruthy();
 
 //8) Generate Token
const tokenResponse = await request.post("/auth", {
  headers: { "Content-Type": "application/json" },
  data: tokenRequestBody
});
console.log("Token Response Status:", tokenResponse.status());
expect(tokenResponse.ok()).toBeTruthy();
const tokenResponseJson = await tokenResponse.json();
const token = tokenResponseJson.token;
console.log("Generated Token:", token); 

 // 7) Send the PUT request to update the booking details
 const patchAPIResponse = await request.patch(`/booking/${bookingId}`, {
  headers: { 
    "Content-Type": "application/json",
    "Cookie": `token=${token}`
  },
  data: patchRequestBody
});
console.log("PATCH API Response Status:", patchAPIResponse.status());
console.log("PATCH API Response Body:", await patchAPIResponse.json());
expect(patchAPIResponse.ok()).toBeTruthy();
});