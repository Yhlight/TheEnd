# TheEnd Development Roadmap

This document outlines the planned development phases for TheEnd, a web-based rhythm game. The development will be incremental, with a strong initial focus on establishing the core visual style and rendering engine before implementing complex gameplay mechanics.

## Phase 1: Project Scaffolding and Core Structure

*   **Objective:** Set up a robust and scalable foundation for the project.
*   **Tasks:**
    1.  Initialize a standard Vue.js project using Vue CLI or Vite.
    2.  Establish the project structure:
        *   `src/components/`: For reusable Vue components.
        *   `src/views/`: For top-level screen components (e.g., MainMenu, GameScreen).
        *   `src/assets/`: For static assets like fonts or sound effects.
        *   `public/charts/`: To store game chart data (JSON files).
    3.  Create a comprehensive `.gitignore` file to exclude `node_modules`, build outputs (`dist`), and environment files.
    4.  Set up basic routing for different game screens.

## Phase 2: Visual Prototyping and Rendering Engine

*   **Objective:** Implement the core visual elements and aesthetic described in `TheEnd.md` before tackling gameplay logic.
*   **Tasks:**
    1.  **Visual Sandbox:** Create a dedicated `VisualPrototype.vue` component to develop and test visual elements in isolation.
    2.  **Dynamic Background:** Implement the shifting grid of faint, glowing lines for the game background.
    3.  **Geometric Note Components:** Create a `GeometricNote.vue` component capable of rendering all note types as distinct shapes (square, rectangle, rhombus, line segment) based on props.
    4.  **Judgment Line:** Develop the dynamic judgment line component, allowing its position and rotation to be animated over time.
    5.  **Effects & Shaders:** Implement the core "glow" and "bloom" effects.
    6.  **Hit Effects:** Design and implement the "shatter" animation for note hits, composed of smaller geometric particles.

## Phase 3: Core Gameplay Mechanics

*   **Objective:** Build the fundamental gameplay loop and systems.
*   **Tasks:**
    1.  **Game Loop:** Implement a time-based game loop using `requestAnimationFrame`.
    2.  **Audio Synchronization:** Integrate the HTML5 `<audio>` element and ensure the game loop's master clock is tightly synchronized with `audio.currentTime`.
    3.  **Chart Loading:** Implement logic to fetch and parse chart data from JSON files.
    4.  **Note Spawning & Logic:** Create the system that spawns and updates the positions of notes based on the loaded chart data and current song time.
    5.  **Input Handling:** Implement input detection for tap, hold, and swipe gestures.
    6.  **Judgment System:** Develop the core logic for judging note hits based on timing windows (e.g., Perfect, Good).
    7.  **Scoring:** Implement a basic scoring and combo tracking system.

## Phase 4: UI/UX and Game Screens

*   **Objective:** Develop the user interface and connect the different parts of the game.
*   **Tasks:**
    1.  **Main Menu / Song Select:** Create the screen where users can browse and select charts to play.
    2.  **In-Game HUD:** Implement the heads-up display showing the score, combo, and song progress bar.
    3.  **Settings Menu:** Build the settings screen with controls for volume, note speed, and other options.
    4.  **Results Screen:** Design the screen that displays the final score and performance metrics after a song is completed.
    5.  **Pause Functionality:** Implement a pause menu.

## Phase 5: Chart Editor ("Workshop")

*   **Objective:** Create a tool for users to create and share their own charts. This will likely be a desktop-focused web application.
*   **Tasks:**
    1.  **Editor UI:** Design an intuitive interface for chart creation, including a visual timeline, audio waveform display, and a toolbox for notes and events.
    2.  **Chart Creation Logic:** Implement functionality to place, edit, and delete notes.
    3.  **Event System:** Build the system for defining the judgment line's movements and other scripted events.
    4.  **Chart Import/Export:** Allow users to import audio, define metadata (title, artist), and export the final chart as a JSON file.

## Phase 6: Polishing and Deployment

*   **Objective:** Refine the game, optimize performance, and prepare for release.
*   **Tasks:**
    1.  **Sound Design:** Add sound effects for UI interactions and gameplay events.
    2.  **Performance Optimization:** Profile and optimize rendering and game logic, especially for mobile devices.
    3.  **Packaging for Android:** Use a framework like Capacitor to wrap the web application into an Android-native APK.
    4.  **Final Testing:** Conduct thorough testing and bug fixing.
