const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  // Go to child view with dev mode (port 8081)
  await page.goto('http://localhost:8081/?dev=child', { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  
  // Wait for page to load
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ 
    path: 'test-screenshots/championship-today-v1.png',
    fullPage: false 
  });
  
  console.log('Screenshot saved: championship-today-v1.png');
  
  await browser.close();
})();
