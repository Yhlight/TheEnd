import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    os.makedirs('verification', exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto('http://localhost:5173/', timeout=60000)
            print("Page loaded directly into gameplay.")

            # The first tappable note is at time: 1500, x: 0.8
            await asyncio.sleep(1.4)

            width = page.viewport_size['width']
            height = page.viewport_size['height']

            click_x = width * 0.8
            click_y = height * 0.8

            print(f"Attempting to click note at ({click_x}, {click_y})...")
            await page.click('canvas', position={'x': click_x, 'y': click_y}, timeout=1000)

            await asyncio.sleep(1.0)
            await page.screenshot(path='verification/isolated_hit_test.png')
            print("Took isolated gameplay screenshot.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

    print("\n--- Verification Analysis ---")
    print("Please visually inspect 'verification/isolated_hit_test.png' to see if the note was hit.")
    print("---------------------------\n")

if __name__ == '__main__':
    asyncio.run(main())
