import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    # Ensure verification directory exists
    os.makedirs('verification', exist_ok=True)

    console_messages = []
    def handle_console(msg):
        print(f"BROWSER LOG: {msg.text}")
        console_messages.append(msg.text)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.on('console', handle_console)

        try:
            await page.goto('http://localhost:5173/', timeout=60000)
            print("Page loaded.")

            # 1. Click title screen to enter song select
            await asyncio.sleep(2) # Wait for animations to settle
            await page.click('canvas', position={'x': 300, 'y': 300}, timeout=5000)
            print("Clicked title screen.")

            # 2. Screenshot song select to verify UI clipping
            await asyncio.sleep(1) # Wait for song select to appear
            await page.screenshot(path='verification/01_song_select_fixed.png')
            print("Took song select screenshot.")

            # 3. Start the first song
            width = page.viewport_size['width']
            height = page.viewport_size['height']
            await page.click('canvas', position={'x': width / 2, 'y': height / 2}, timeout=5000)
            print("Started first song.")

            # 4. Wait for the second note and attempt to hit it
            # The note is at time: 1500, x: 0.8
            await asyncio.sleep(1.4) # Wait until just before the note should be hit

            # The note appears at x: 0.8, so we click at 80% of the screen width
            click_x = width * 0.8
            # The judgement line is roughly at 80% of the screen height
            click_y = height * 0.8

            print(f"Attempting to click note at ({click_x}, {click_y})...")
            await page.click('canvas', position={'x': click_x, 'y': click_y}, timeout=1000)

            # 5. Wait for hit effect and take screenshot
            await asyncio.sleep(1.0) # Wait a bit longer for the effect to be clear
            await page.screenshot(path='verification/02_gameplay_hit_test_v2.png')
            print("Took gameplay screenshot.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

    # 6. Analyze results
    print("\n--- Verification Analysis ---")
    if any("error" in msg.lower() for msg in console_messages):
        print("FAIL: Errors were found in the browser console.")
    else:
        print("PASS: No critical errors in browser console.")

    print("Please visually inspect the screenshots:")
    print("- 'verification/01_song_select_fixed.png': Check for any UI clipping on the right side.")
    print("- 'verification/02_gameplay_hit_test_v2.png': Check if the note was hit (look for a 'Perfect' or 'Good' judgement text and particle effects).")
    print("---------------------------\n")


if __name__ == '__main__':
    asyncio.run(main())
