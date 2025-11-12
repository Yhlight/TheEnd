
import subprocess
import os
import re
import webbrowser
import sys
import threading
from queue import Queue, Empty

def check_command(command, success_message, failure_message):
    """Checks if a command exists and can be executed."""
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"✅ {success_message}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"❌ {failure_message}")
        return False

def run_npm_install():
    """Runs npm install, handling potential Windows-specifics."""
    print("\n📦 'node_modules' directory not found. Installing dependencies...")
    try:
        # Using 'npm.cmd' is more robust on Windows
        subprocess.run(['npm.cmd', 'install'], check=True, shell=True, stdout=sys.stdout, stderr=sys.stderr)
        print("✅ Dependencies installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during 'npm install': {e}")
        sys.exit(1)

def enqueue_output(stream, queue):
    """Reads output from a stream and puts it into a queue line by line."""
    for line in iter(stream.readline, ''):
        queue.put(line)
    stream.close()

def start_server_and_open_browser():
    """Starts the dev server, finds the URL, and opens it in a browser."""
    print("\n🚀 Starting the development server...")

    # Use 'npm.cmd' for Windows compatibility. DETACHED_PROCESS might be needed
    # for some environments to let the script exit while server runs, but
    # we need the process handle to read its output.
    process = subprocess.Popen(
        ['npm.cmd', 'run', 'dev'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        shell=True,
        encoding='utf-8',
        errors='replace'
    )

    # Use threads to read stdout and stderr without blocking
    q_stdout = Queue()
    q_stderr = Queue()

    t_stdout = threading.Thread(target=enqueue_output, args=(process.stdout, q_stdout))
    t_stderr = threading.Thread(target=enqueue_output, args=(process.stderr, q_stderr))
    t_stdout.daemon = True
    t_stderr.daemon = True
    t_stdout.start()
    t_stderr.start()

    url_found = False
    url_pattern = re.compile(r'Local:\s+(http://localhost:\d+/)')

    try:
        while True:
            # Check for server process exit
            if process.poll() is not None:
                print("❌ Server process terminated unexpectedly.")
                break

            try:
                line = q_stdout.get_nowait()
                print(line, end='') # Print server output in real-time
                if not url_found:
                    match = url_pattern.search(line)
                    if match:
                        url = match.group(1)
                        print(f"\n🌐 Server is running at {url}")
                        print("Opening in your default browser...")
                        webbrowser.open(url)
                        url_found = True
            except Empty:
                pass # No output from stdout

            try:
                err_line = q_stderr.get_nowait()
                print(err_line, end='', file=sys.stderr) # Print errors
            except Empty:
                pass # No output from stderr

            # If we've found the URL, we can just print the rest of the output
            if url_found:
                break

    except KeyboardInterrupt:
        print("\n🛑 Shutting down the server.")
        process.terminate()

    # Continue to print any remaining output
    while t_stdout.is_alive() or not q_stdout.empty() or t_stderr.is_alive() or not q_stderr.empty():
        try:
            line = q_stdout.get(timeout=0.1)
            print(line, end='')
        except Empty:
            pass
        try:
            err_line = q_stderr.get(timeout=0.1)
            print(err_line, end='', file=sys.stderr)
        except Empty:
            pass

    process.wait()


if __name__ == "__main__":
    print("--- TheEnd Project Launcher for Windows ---")

    # 1. Check for Node.js and npm
    print("\nChecking environment...")
    if not check_command(['node', '-v'], "Node.js is installed.", "Node.js not found. Please install it from https://nodejs.org/"):
        sys.exit(1)
    if not check_command(['npm.cmd', '-v'], "npm is installed.", "npm not found. It should be included with Node.js."):
        sys.exit(1)

    # 2. Check for dependencies
    if not os.path.exists('node_modules'):
        run_npm_install()
    else:
        print("✅ 'node_modules' directory found. Skipping dependency installation.")

    # 3. Start the server and open in browser
    start_server_and_open_browser()

    print("\n👋 Launcher script finished. The server may still be running.")
