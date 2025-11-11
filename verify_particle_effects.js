
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
    await setTimeout(500);

    // 2. Click the first song to start the game
    console.log('Selecting the first song...');
    const firstSongY = 150 + 100 / 2;
    await page.mouse.click(centerX, firstSongY);
    await setTimeout(1500); // Wait for notes to appear

    // 3. Simulate a click on a note to create an explosion
    console.log('Simulating a note hit...');
    // Aim for a position just above the judgment line to hit a note
    await page.mouse.click(centerX, bb.height * 0.8);
    await setTimeout(100); // Allow effect to animate slightly

    // 4. Take a screenshot to verify the new particle effect
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'particle_effect_verification.png' });
    console.log('Screenshot saved as particle_effect_verification.png');

  } catch (error) {
    console.error('An error occurred during verification:', error);
  } finally {
    await browser.close();
  }
})();
