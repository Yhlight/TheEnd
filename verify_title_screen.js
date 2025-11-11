
import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the game
    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');

    // Wait for the title screen animations to run for a bit
    console.log('Waiting for title screen animation...');
    await setTimeout(2000);

    // Take a screenshot to verify the new title screen
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'title_screen_verification.png' });
    console.log('Screenshot saved as title_screen_verification.png');

  } catch (error) {
    console.error('An error occurred during verification:', error);
  } finally {
    await browser.close();
  }
})();
