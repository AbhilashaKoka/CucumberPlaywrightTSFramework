import { test, expect} from '@playwright/test';
import BookingAPIRequestBody from '../../test-data/api-requests/booking_request_body.json';
test('Create Post api request using static json file', async({request})=>{
  
  //Create POST API Request 
  const postAPIResponse=await request.post('/booking',{
   data:BookingAPIRequestBody
    })

     //Validate status code 
       expect(postAPIResponse.ok()).toBeTruthy();
       expect(postAPIResponse.status()).toBe(200);

       const postAPIResponseBody =await postAPIResponse.json();
       console.log(postAPIResponseBody);

       //Validate status code 
       expect(postAPIResponse.ok()).toBeTruthy();


       //validate JSON API Response 
       expect(postAPIResponseBody.booking).toHaveProperty("firstname", "sita")
       expect(postAPIResponseBody.booking).toHaveProperty("lastname", "kumari")
       
       
       //validate Nested JSON Object 
        expect(postAPIResponseBody.booking.bookingdates).toHaveProperty("checkin", "2018-01-01")
        expect(postAPIResponseBody.booking.bookingdates).toHaveProperty("checkout", "2019-01-01")
}
)