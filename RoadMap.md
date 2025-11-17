# TheEnd - Development Roadmap

This document outlines the development plan for "TheEnd", a rhythm game inspired by Phigros. The development is divided into distinct phases to ensure a structured and incremental workflow.

## Phase 1: Core Engine & Rendering Foundation

*Goal: Establish the technical foundation and render basic visual elements according to the game's art style.*

1.  **Project Setup:**
    *   Initialize a Vue.js project (`@vue/cli`).
    *   Set up a version control system (Git) and configure `.gitignore`.
    *   Establish a clear file structure for components, assets, and game logic.
2.  **Rendering Engine:**
    *   Choose a rendering technology: HTML5 Canvas for simplicity and broad compatibility, or WebGL (via a library like PixiJS or Three.js) for high performance and advanced visual effects.
    *   Create a core rendering loop.
3.  **Geometric Primitives:**
    *   Implement functions to draw the core visual elements: squares, lines, and rhombuses.
4.  **Effects & Shaders:**
    *   Develop a basic shader or filter system for glow and bloom effects ("辉光").
    *   Implement particle effects for taps and other interactions, using the geometric primitives.

## Phase 2: Core Gameplay Logic

*Goal: Implement the fundamental rhythm game mechanics.*

1.  **Chart Data Structure:**
    *   Define a format (e.g., JSON) to store chart data, including note timings, types, and positions.
2.  **Music & Synchronization:**
    *   Implement audio playback and synchronize game events accurately with the music's timeline.
    *   Handle audio latency and provide calibration options in the settings.
3.  **Note Types & Logic:**
    *   Implement the four basic note types: Tap, Drag, Hold, and Flick (黄条).
4.  **Input & Judgment:**
    *   Capture player input (touch/mouse).
    *   Implement the timing judgment logic (e.g., Perfect, Good, Miss).
5.  **Scoring System:**
    *   Develop a scoring and combo system.

## Phase 3: UI/UX & Menus

*Goal: Build the user interface and menus that allow players to navigate the game.*

1.  **Main Menu:**
    *   Design and implement the main menu screen with a minimalist, geometric aesthetic.
    *   Incorporate subtle animations and floating crystal/rhombus elements as described in `TheEnd.md`.
2.  **Song Selection Screen:**
    *   Create a grid-based layout for displaying song charts.
    *   Show chart information (difficulty, artist, etc.).
3.  **In-Game HUD:**
    *   Design and implement the Heads-Up Display: score, combo, progress bar, and a pause button. All elements should be square-based.
4.  **Settings Menu:**
    *   Implement options to adjust: audio volume, note speed, background brightness, and audio latency offset.

## Phase 4: Advanced Gameplay & Visual Polish

*Goal: Implement the signature dynamic features and enhance the visual experience.*

1.  **Dynamic Judgment Line:**
    *   Implement the logic for the judgment line to move, rotate, and change opacity based on the chart data.
2.  **Advanced Note Events:**
    *   Add support for more complex chart events that control the judgment line and other visual effects.
3.  **Visual Effects Polish:**
    *   Refine all visual effects, ensuring they are impactful and synchronized with the music.
    *   Enhance the "light pollution" and background effects to create a more immersive atmosphere.

## Phase 5: Chart Editor ("Workshop")

*Goal: Create a user-friendly tool for creating and sharing custom charts.*

1.  **Editor UI:**
    *   Design an intuitive interface for the chart editor, likely for the PC version.
2.  **Chart Creation Tools:**
    *   Implement tools for placing and editing notes on a timeline.
    *   Add functionality to script judgment line movements and other events.
3.  **Import/Export:**
    *   Allow users to import their own music and cover art.
    *   Provide a way to export the final chart file in the game's format.

## Phase 6: Platform Specifics & Polishing

*Goal: Optimize the game for the primary target platform and perform final testing.*

1.  **Android Build:**
    *   Package the Vue.js application as an Android app (e.g., using Capacitor or a similar tool).
    *   Adapt controls and UI for touchscreens.
2.  **Performance Optimization:**
    *   Profile the game to identify and fix performance bottlenecks, especially on mobile devices.
    *   Optimize rendering and game logic.
3.  **Final Bug Squashing:**
    *   Conduct thorough testing to find and fix remaining bugs.
    *   Gather player feedback for final tweaks.
