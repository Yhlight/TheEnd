
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

    // 1. Start the game and a song
    console.log('Starting game...');
    await page.mouse.click(centerX, centerY); // Click title
    await setTimeout(500);
    const firstSongY = 150 + 100 / 2;
    await page.mouse.click(centerX, firstSongY); // Click first song
    await setTimeout(2000); // Wait for game to load

    // 2. Click the pause button (top-left corner)
    console.log('Pausing the game...');
    const pauseButtonX = 20 + 20; // x + width/2
    const pauseButtonY = 20 + 20; // y + height/2
    await page.mouse.click(pauseButtonX, pauseButtonY);
    await setTimeout(500); // Wait for pause screen to render

    // 3. Take a screenshot of the paused state
    console.log('Taking screenshot of paused screen...');
    await page.screenshot({ path: 'pause_screen_verification.png' });
    console.log('Screenshot saved as pause_screen_verification.png');

    // 4. Click anywhere to unpause
    console.log('Resuming the game...');
    await page.mouse.click(centerX, centerY);
    await setTimeout(500); // Wait for game to resume

    // 5. Take a screenshot of the resumed state
    console.log('Taking screenshot of resumed screen...');
    await page.screenshot({ path: 'resume_screen_verification.png' });
    console.log('Screenshot saved as resume_screen_verification.png');

  } catch (error) {
    console.error('An error occurred during verification:', error);
  } finally {
    await browser.close();
  }
})();
