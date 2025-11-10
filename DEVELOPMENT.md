# Development Guide for TheEnd

This document provides instructions for setting up the development environment, building the project, and running tests.

## 1. Environment Setup

### Prerequisites
- **Node.js**: This project is built with Node.js. It is recommended to use the latest LTS version. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: npm (Node Package Manager) is included with Node.js and is used to manage project dependencies.

### Dependency Installation
Once you have Node.js and npm installed, navigate to the project's root directory and run the following command to install all necessary dependencies:

```bash
npm install
```

This will download all the packages listed in `package.json` into the `node_modules` directory.

## 2. Running the Project

### Local Development Server
To run the project in a local development environment with hot-reloading, use the following command:

```bash
npm run dev
```

This will start a Vite development server, typically available at `http://localhost:5173/`. Any changes you make to the source code will be reflected in the browser almost instantly.

### Production Build
To create an optimized, production-ready build of the application, run:

```bash
npm run build
```

This command will compile and minify the project's assets into the `dist/` directory. You can then serve the contents of this directory with any static file server.

## 3. Testing and Verification

### Unit & Integration Tests
Currently, this project does not have a formal unit or integration testing suite. This is a known area for future improvement.

### Visual Verification with Playwright
Due to the highly visual nature of this project, all frontend changes are verified using temporary [Playwright](https://playwright.dev/) scripts. This allows for automated browser interaction and screenshot generation to ensure that new features and bug fixes are rendered correctly.

The typical workflow for this is:
1.  Start the local development server (`npm run dev`).
2.  Write a temporary Python script (e.g., in `/home/jules/verification/`) that uses Playwright to navigate to the game.
3.  The script interacts with the game (e.g., selects a song, starts playing) to reach the state that needs to be verified.
4.  The script takes a screenshot of the canvas.
5.  The developer visually inspects the screenshot to confirm the changes are correct.

This process is a mandatory step before any code with visual impact is submitted.
