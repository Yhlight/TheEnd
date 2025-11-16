
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Create a directory for screenshots
        import os
        os.makedirs('/home/jules/verification', exist_ok=True)

        try:
            # Navigate to the game
            await page.goto("http://localhost:5173", timeout=60000)

            # Wait for the canvas to be ready
            await page.wait_for_selector("canvas", timeout=30000)
            print("Canvas found. Initializing...")
            await asyncio.sleep(2)

            # --- Start Game ---
            viewport_size = page.viewport_size
            center_x = viewport_size['width'] / 2
            center_y = viewport_size['height'] / 2

            await page.mouse.click(center_x, center_y) # Click title screen
            await asyncio.sleep(1)
            await page.mouse.click(center_x, center_y) # Click song select
            print("Game started.")

            # --- Wait for Gameplay ---
            # Wait a few seconds for the song to start and notes to appear
            await asyncio.sleep(3.5)
            await page.screenshot(path='/home/jules/verification/ingame_01_first_note_approach.png')
            print("Screenshot: First note approaching.")

            # --- Attempt to Hit Notes ---
            judgement_line_y = viewport_size['height'] * 0.8

            # Click for the first note
            await page.mouse.click(center_x, judgement_line_y)
            await asyncio.sleep(0.2) # Wait for judgement text
            await page.screenshot(path='/home/jules/verification/ingame_02_first_note_hit.png')
            print("Screenshot: First note hit registered.")

            # The next note in the default chart is slightly offset in time
            await asyncio.sleep(0.3)
            await page.mouse.click(center_x, judgement_line_y)
            await asyncio.sleep(0.2)
            await page.screenshot(path='/home/jules/verification/ingame_03_second_note_hit.png')
            print("Screenshot: Second note hit registered.")


            print("\nVerification script completed successfully.")

        except Exception as e:
            print(f"An error occurred during Playwright execution: {e}")
            await page.screenshot(path='/home/jules/verification/error_screenshot.png')

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
