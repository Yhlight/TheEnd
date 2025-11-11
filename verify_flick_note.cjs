// verify_flick_note.cjs
const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:5173/');

    // Start the game
    await page.locator('.start-overlay').click();

    // Wait for the autoplay to hit the first flick note
    await page.waitForTimeout(2100);

    // Take the screenshot
    await page.screenshot({ path: 'flick_note_verification.png' });

    console.log('Screenshot of flick note verification saved to flick_note_verification.png');
  } catch (error) {
    console.error('Error during Playwright verification:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
