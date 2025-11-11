
import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the game
    await page.goto('http://localhost:5174/');
    // Wait for the canvas to be present and rendered
    await page.waitForSelector('canvas', { state: 'visible' });
    console.log('Canvas is visible.');

    // Get canvas for clicking
    const canvas = await page.$('canvas');
    if (!canvas) {
      throw new Error('Canvas element not found after waiting');
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
    await setTimeout(2000);

    // 2. Click the pause button (top-left corner)
    console.log('Opening settings menu...');
    const pauseButtonX = 20 + 20;
    const pauseButtonY = 20 + 20;
    await page.mouse.click(pauseButtonX, pauseButtonY);
    await setTimeout(500);

    // 3. Take a screenshot of the settings menu
    console.log('Taking screenshot of settings menu...');
    await page.screenshot({ path: 'settings_menu_verification.png' });
    console.log('Screenshot saved as settings_menu_verification.png');

    // 4. Click the "Resume" button
    console.log('Clicking Resume button...');
    const resumeButtonY = centerY + 150 + 30; // y + height/2
    await page.mouse.click(centerX, resumeButtonY);
    await setTimeout(500);

    // 5. Take a screenshot of the resumed state
    console.log('Taking screenshot of resumed screen...');
    await page.screenshot({ path: 'resume_from_settings_verification.png' });
    console.log('Screenshot saved as resume_from_settings_verification.png');

  } catch (error) {
    console.error('An error occurred during verification:', error);
  } finally {
    await browser.close();
  }
})();
