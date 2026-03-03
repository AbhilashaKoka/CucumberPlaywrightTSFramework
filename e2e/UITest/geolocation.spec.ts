import test from '@playwright/test';
import{chromium} from 'playwright';

test('built in geolocation support',async()=>{
    const browser = await chromium.launch({headless:false});

    //create a new browser context with geolocation permissions
    const context = await browser.newContext({
        permissions:['geolocation'],
        geolocation:{latitude:40.7128,longitude:-74.0060}//new york
    });
    const page = await context.newPage();

    await page.goto('https://www.google.com/maps');
    //verify that the geolocation is working by checking if the map centers on the specified location
        const center = await page.evaluate(() => {
        const map = document.querySelector('div[aria-label="Map"]');
        const center = map?.getAttribute('aria-label')?.match(/center: \(([^)]+)\)/)?.[1];
        return center;
    });    
    await page.waitForTimeout(5000);
    await browser.close();
}
),
test('multi Region geolocation',async()=>{
    const browser = await chromium.launch({headless:false});

    //define multiple geolocations for testing
    const locations = [
        {name :'new york',latitude:40.7128,longitude:-74.0060},//new york
        {name :'los angeles',latitude:34.0522,longitude:-118.2437},//los angeles
        {name :'london',latitude:51.5074,longitude:-0.1278}//london
    ];


//SPIN UP A BROWSER CONTEXT FOR EACH LOCATION
    for(const location of locations){
        const context = await browser.newContext({
            permissions:['geolocation'],
            geolocation:{latitude:location.latitude,longitude:location.longitude}
        });
        const page = await context.newPage();

        await page.goto('https://www.google.com/maps');

        //verify that the geolocation is working by checking if the map centers on the specified location
        const center = await page.evaluate(() => {
            const map = document.querySelector('div[aria-label="Map"]');
            const center = map?.getAttribute('aria-label')?.match(/center: \(([^)]+)\)/)?.[1];
            return center;
        });
        console.log(`Testing location: ${location.name}, Center: ${center}`);
        await page.waitForTimeout(5000);
        await context.close();
    }
    await browser.close();
}
),
test('multi region language testing',async()=>{
    const browser = await chromium.launch({headless:false});
    //defining locale to test
    const locales = ['en-US','fr-FR','es-ES'];//english, french, spanish
   
    //run tests in parallel for each locale
    await Promise.all(
        locales.map(async region =>{
            const context = await browser.newContext({
                locale:region
            });
            const page = await context.newPage();
            await page.goto('https://www.google.com/maps'); 
        })
    );
    await browser.close();
})      
