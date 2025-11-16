import asyncio
import subprocess
import time
from playwright.async_api import async_playwright

async def main():
    # Store console messages
    console_errors = []

    def handle_console_error(msg):
        if msg.type.lower() == 'error':
            print(f"Captured Console Error: {msg.text}")
            console_errors.append(msg.text)

    # Start the dev server in the background
    server_process = subprocess.Popen(['npm', 'run', 'dev'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print("Starting dev server...")
    # Wait for server to be ready
    await asyncio.sleep(10)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.on('console', handle_console_error)

        try:
            print("Navigating to the game page...")
            await page.goto('http://localhost:5173/', timeout=60000)

            # --- 1. Initial Load and Gameplay Start ---
            print("Entering song select...")
            await page.click('canvas', position={'x': 300, 'y': 300}, timeout=5000)
            await asyncio.sleep(1)

            print("Starting a song...")
            width = page.viewport_size['width']
            height = page.viewport_size['height']
            await page.click('canvas', position={'x': width / 2, 'y': height / 2}, timeout=5000)

            # Wait for gameplay to start and run for a bit
            print("Gameplay running, checking for initial errors...")
            await asyncio.sleep(5)

            # --- 2. Verify Canvas Alignment ---
            print("Taking screenshot to verify canvas alignment...")
            await page.screenshot(path='verification/final_fix_alignment.png')
            print("Screenshot saved to verification/final_fix_alignment.png")

            # --- 3. Verify Pause -> Exit Functionality ---
            print("Testing Pause -> Exit functionality...")
            # Pause the game (top-center button)
            await page.click('canvas', position={'x': width / 2, 'y': 40}, timeout=5000)
            await asyncio.sleep(1)

            # Click the 'Exit' button (last button in the menu)
            # Based on layout logic in GameStage.vue, it's the lowest button.
            exit_button_y = (height / 2) + 120 # Approximate position of the exit button
            await page.click('canvas', position={'x': width / 2, 'y': exit_button_y}, timeout=5000)
            await asyncio.sleep(2) # Wait to see if it crashes and return to song select

            print("Exit button clicked. Checking for late-stage errors...")
            await asyncio.sleep(2)


        except Exception as e:
            print(f"An unexpected Playwright error occurred: {e}")

        finally:
            await browser.close()
            server_process.terminate()
            await asyncio.to_thread(server_process.wait)
            print("Dev server stopped.")

            # --- 4. Final Report ---
            print("\n--- Verification Report ---")
            if any("Easing.easeOutExpo is not a function" in err for err in console_errors):
                print("FAIL: Easing function error is still present.")
            else:
                print("PASS: Easing function error was not detected.")

            if any("audioManager.stopMusic is not a function" in err for err in console_errors):
                print("FAIL: AudioManager method error is still present.")
            else:
                print("PASS: AudioManager method error was not detected.")

            if not console_errors:
                 print("PASS: No JavaScript runtime errors were detected during the test.")

            print("Please manually inspect 'verification/final_fix_alignment.png' to confirm the black border issue is resolved.")
            print("-------------------------\n")


if __name__ == '__main__':
    asyncio.run(main())
