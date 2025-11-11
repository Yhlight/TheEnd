const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the game. The initial fadeIn starts automatically.
    await page.goto('http://localhost:5173/');

    // Wait for the fadeIn to be halfway (duration is 0.5s by default, but we'll use a specific fadeIn in the code)
    // Let's assume our fadeIn duration which is 1s for the first time.
    await page.waitForTimeout(500); // Halfway through the initial fade-in
    await page.screenshot({ path: '/home/jules/verification/transition_initial_fadein.png' });

    // Wait for the fadeIn to complete
    await page.waitForTimeout(500);

    // Click to trigger the transition to songSelect
    await page.mouse.click(500, 500);

    // The fadeOut is 0.3s. We'll wait for half of that.
    await page.waitForTimeout(150);
    await page.screenshot({ path: '/home/jules/verification/transition_fadeout.png' });

  } catch (error) {
    console.error('Verification script failed:', error);
  } finally {
    await browser.close();
  }
})();
