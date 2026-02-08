const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.setViewport({ width: 390, height: 844 });
  
  console.log('Navigating...');
  await page.goto('http://localhost:8081/?dev=child', { 
    waitUntil: 'networkidle0',
    timeout: 90000 
  });
  
  console.log('Waiting 15 seconds for full render...');
  await new Promise(r => setTimeout(r, 15000));
  
  const content = await page.evaluate(() => document.body.innerText);
  console.log('Body text:', content.substring(0, 200));
  
  await page.screenshot({ path: 'test-screenshots/debug2.png' });
  console.log('Done!');
  
  await browser.close();
})();
