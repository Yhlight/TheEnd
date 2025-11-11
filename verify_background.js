
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

    // Get canvas for clicking
    const canvas = await page.$('canvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    const bb = await canvas.boundingBox();
    const centerX = bb.x + bb.width / 2;
    const centerY = bb.y + bb.height / 2;

    // 1. Click to move from Title to Song Select
    console.log('Clicking to start...');
    await page.mouse.click(centerX, centerY);
    await setTimeout(500); // Wait for transition

    // 2. Click the first song to start the game
    console.log('Selecting the first song...');
    // Assuming the first song box is located at a predictable position
    const firstSongY = 150 + 100 / 2; // Y-center of the first song box
    await page.mouse.click(centerX, firstSongY);
    await setTimeout(2000); // Wait for game to start

    // 3. Simulate a few clicks to trigger background effects
    console.log('Simulating clicks in-game...');
    for (let i = 0; i < 5; i++) {
        await page.mouse.click(centerX, centerY - 100); // Click near the judgement line
        await setTimeout(150);
    }

    // 4. Take a screenshot to verify the effect
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'background_effect_verification.png' });
    console.log('Screenshot saved as background_effect_verification.png');

  } catch (error) {
    console.error('An error occurred during verification:', error);
  } finally {
    await browser.close();
  }
})();
