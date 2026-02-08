const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  console.log('Navigating to app...');
  
  // Go to child view with dev mode
  await page.goto('http://localhost:8081/?dev=child', { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });
  
  console.log('Page loaded, waiting for React to render...');
  
  // Wait for React app to mount - look for specific elements
  try {
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('Root element found');
    
    // Wait a bit more for React to hydrate
    await new Promise(r => setTimeout(r, 8000));
    
    // Check what's on the page
    const bodyContent = await page.evaluate(() => {
      return {
        rootHTML: document.getElementById('root')?.innerHTML?.substring(0, 500),
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        hasContent: document.body.innerText.length > 0
      };
    });
    
    console.log('Page state:', JSON.stringify(bodyContent, null, 2));
    
  } catch (e) {
    console.log('Error waiting for content:', e.message);
  }
  
  await page.screenshot({ 
    path: 'test-screenshots/debug-screenshot.png',
    fullPage: false 
  });
  
  console.log('Screenshot saved: debug-screenshot.png');
  
  await browser.close();
})();
