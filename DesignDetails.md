# TheEnd Design Details

This document provides a more detailed breakdown of the visual, interactive, and mechanical aspects of TheEnd, expanding on the concepts from `TheEnd.md` and `RoadMap.md`.

## 1. Visual Style

The visual identity of TheEnd is built on a minimalist, high-contrast, geometric aesthetic.

*   **Core Primitives:** The entire visual language will be constructed from basic shapes:
    *   **Squares:** Used for tap notes, UI buttons, and particle effects.
    *   **Rectangles:** Used for hold notes and UI elements like sliders or progress bars.
    *   **Lines:** Used for the judgment line, background grids, and connecting UI elements.
    *   **Rhombuses/Diamonds:** Used for swipe notes to give them a clear directional feel.

*   **Color Palette:** A high-contrast, dark-themed palette will be used to create a striking and focused experience.
    *   **Background:** Deep blue or purple (e.g., `#1A1A2E`).
    *   **Primary Elements (Notes, Judgment Line):** Bright, glowing, neon-like colors like cyan (`#00FFFF`), magenta (`#FF00FF`), and electric blue (`#00BFFF`).
    *   **Accent Color (Catch Notes):** A distinct gold or bright yellow (`#FFD700`).
    *   **UI Text & Icons:** A clean, simple white or light gray.

*   **User Interface (UI):**
    *   **Menus:** Will be minimalist and clean, using wireframe-style boxes and lines.
    *   **Buttons:** Simple squares or rectangles that highlight or animate on hover/press.
    *   **Typography:** A clean, sans-serif typeface will be used for all text to maintain the modern, geometric feel.

## 2. In-Game Effects & Feedback

Visual feedback is crucial for a satisfying rhythm game experience.

*   **Note Hit Animations:**
    *   **Perfect:** The note shatters into a burst of small, brightly colored particles (squares/triangles) that quickly fade out. The judgment line flashes brightly.
    *   **Good:** A less dramatic shatter effect with fewer particles. The judgment line gives a softer glow.
    *   **Miss:** The note simply fades or falls past the screen without any effect.

*   **Hold Note Feedback:** As a hold note is successfully held, the rectangular bar will fill up with a bright color. A continuous, subtle particle stream could also emit from the point of contact on the judgment line.

*   **Background:** The background will feature subtle, non-distracting animations, such as a slowly shifting grid of lines or gently floating, semi-transparent geometric shapes.

## 3. Gameplay Mechanics

*   **Judgment Line:** The judgment line is the core of the game's dynamic presentation. Its movement will be defined in the chart data.
    *   **Movement:** Can move vertically and horizontally across the screen.
    *   **Rotation:** Can rotate up to 360 degrees.
    *   **Chart Commands:** The chart format will include commands to control the line's state, e.g., `move(time, x, y, duration, easing_function)` and `rotate(time, angle, duration, easing_function)`.

*   **Note Types:**
    *   **Tap (短键):** A square note. Requires a single tap when its center aligns with the judgment line.
    *   **Hold (长键):** A long rectangle. Requires the player to press down when the start of the note aligns with the judgment line and release when the end aligns.
    *   **Swipe (滑键):** A rhombus or a square with an arrow. Requires a directional swipe as it crosses the judgment line. The direction will be indicated by the note's orientation or an icon.
    *   **Catch (黄条):** A golden-yellow rectangle. This note does not require any input. The player gets points simply for having the judgment line positioned correctly to "catch" the note as it falls.

*   **Scoring System:**
    *   **Judgment Windows:**
        *   **Perfect:** The tightest timing window.
        *   **Good:** A more lenient timing window.
        *   **Miss:** Any tap outside the "Good" window or no tap at all.
    *   **Score:**
        *   Each note has a base score value.
        *   Accuracy determines the points awarded (e.g., Perfect = 100% of base score, Good = 50%).
    *   **Combo:**
        *   Increments for every "Perfect" or "Good".
        *   A "Miss" resets the combo to zero.
        *   The combo acts as a multiplier for the score awarded for each note.
    *   **Final Grade:** A final letter grade (e.g., S, A, B, C) will be awarded based on the total score achieved out of the maximum possible score.
