import asyncio
import subprocess
import time
from playwright.async_api import async_playwright

async def main():
    # Start the dev server in the background
    server_process = subprocess.Popen(['npm', 'run', 'dev'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print("Starting dev server...")
    time.sleep(10) # Give it ample time to start up

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            print("Navigating to page...")
            await page.goto('http://localhost:5173/', timeout=60000)

            # Wait for the title screen animations
            await page.wait_for_timeout(2000)

            print("Taking screenshot...")
            await page.screenshot(path='verification/canvas_alignment_verification.png')
            print("Screenshot saved to verification/canvas_alignment_verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")

        finally:
            await browser.close()
            # Stop the dev server
            server_process.terminate()
            server_process.wait()
            print("Dev server stopped.")

if __name__ == '__main__':
    asyncio.run(main())
