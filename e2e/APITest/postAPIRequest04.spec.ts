import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
const {DateTime}= require('luxon');
type BookingResponse = {
  bookingid?: number;
  booking: {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: {
      checkin: string;   // 'yyyy-MM-dd'
      checkout: string;  // 'yyyy-MM-dd'
    };
    additionalneeds?: string;
  };
};

test('Create POST /booking with dynamic request body', async ({ request }) => {
  // Arrange (dynamic test data)
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const totalPrice = faker.number.int({ min: 50, max: 1000 });
  const checkInDate = DateTime.now().toFormat('yyyy-MM-dd');
  const checkOutDate = DateTime.now().plus({ days: 5 }).toFormat('yyyy-MM-dd');

  const payload = {
    firstname: firstName,
    lastname: lastName,
    totalprice: totalPrice,
    depositpaid: true,
    bookingdates: {
      checkin: checkInDate,
      checkout: checkOutDate
    },
    additionalneeds: 'super bowls'
  };

  // Act
  const response = await request.post('/booking', {
    headers: { 'Content-Type': 'application/json' },
    data: payload
  });

// Assert status early
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  // Parse JSON
  const body = (await response.json()) as BookingResponse;
  console.log('POST /booking response:', body);

  // Basic shape checks
  expect(body).toHaveProperty('booking');
  expect(body.booking).toMatchObject({
    firstname: firstName,
    lastname: lastName,
    totalprice: expect.any(Number),
    depositpaid: expect.any(Boolean),
    bookingdates: expect.objectContaining({
      checkin: checkInDate,
      checkout: checkOutDate
    })
  });

  // Optional: bookingid present and numeric (if API returns it)
  if ('bookingid' in body) {
    expect(typeof body.bookingid).toBe('number');
    expect(body.bookingid!).toBeGreaterThan(0);
  }

  // Optional: stronger date validation
  const ci = DateTime.fromFormat(body.booking.bookingdates.checkin, 'yyyy-MM-dd');
  const co = DateTime.fromFormat(body.booking.bookingdates.checkout, 'yyyy-MM-dd');
  expect(ci.isValid).toBeTruthy();
  expect(co.isValid).toBeTruthy();
  expect(co > ci).toBeTruthy(); // checkout after checkin

  // Optional: ensure total price is within expected range
  expect(body.booking.totalprice).toBeGreaterThanOrEqual(50);
  expect(body.booking.totalprice).toBeLessThanOrEqual(1000);
});