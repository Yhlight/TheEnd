import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto('http://localhost:5173/', timeout=60000)

            # 1. Capture Title Screen
            await page.wait_for_timeout(2000) # Wait for animations to settle
            await page.screenshot(path='verification/spirit_01_title.png')
            print("Captured title screen.")

            # 2. Enter Song Select
            await page.click('canvas', position={'x': 300, 'y': 300})
            await page.wait_for_timeout(2000) # Wait for song select to load
            await page.screenshot(path='verification/spirit_02_song_select.png')
            print("Captured song select screen.")

            # 3. Start a song and capture gameplay
            # Click the center of the screen to select the default song
            width = page.viewport_size['width']
            height = page.viewport_size['height']
            await page.click('canvas', position={'x': width / 2, 'y': height / 2})

            await page.wait_for_timeout(5000) # Wait for game to start and some notes to appear
            await page.screenshot(path='verification/spirit_03_gameplay.png')
            print("Captured gameplay screen with new spirit visuals.")

        except Exception as e:
            print(f"An error occurred: {e}")

        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
