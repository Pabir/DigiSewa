const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ 
            headless: 'new',
            executablePath: 'C:\\Users\\drskp\\.cache\\puppeteer\\chrome\\win64-152.0.7977.75\\chrome-win64\\chrome.exe',
            args: ['--disable-web-security']
        });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        page.on('requestfailed', request => {
            console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
        });
        
        await page.goto('https://digisewa-ac3c4.web.app/', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 5000));
        
        const html = await page.$eval('#root', el => el.innerHTML);
        console.log('ROOT CONTENT LENGTH:', html.length);
        
        await browser.close();
    } catch (e) {
        console.error('Puppeteer script failed:', e);
    }
})();
