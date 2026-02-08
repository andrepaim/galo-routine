const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERR:', msg.text());
  });
  
  await page.setViewport({ width: 390, height: 844 });
  
  console.log('Loading app...');
  await page.goto('http://localhost:8084/?dev=child', { 
    waitUntil: 'networkidle0',
    timeout: 120000 
  });
  
  console.log('Waiting for render...');
  await new Promise(r => setTimeout(r, 10000));
  
  await page.screenshot({ path: 'test-screenshots/fixed-today.png' });
  console.log('Screenshot saved!');
  
  await browser.close();
})();
