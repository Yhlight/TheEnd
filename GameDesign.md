# TheEnd Game Design Document

This document outlines the comprehensive design of TheEnd, a web-based, falling-note rhythm game. It covers the core design philosophy, visual aesthetics, gameplay mechanics, and technical specifications.

## 1. Core Philosophy

TheEnd aims to deliver a deeply immersive and aesthetically unique rhythm game experience. The core philosophy is centered around "geometric beauty," where gameplay and visuals merge into a cohesive, artistic expression. The game will be challenging yet fair, with a high skill ceiling that rewards precision and mastery.

## 2. Visual Aesthetics

The visual identity of TheEnd is minimalist, high-contrast, and abstract, built on a foundation of geometric primitives and dynamic light/glow effects.

*   **Color Palette:** The palette will be strictly limited and used to create a powerful, atmospheric mood. Two primary themes will be explored:
    *   **Pale Theme:** A light gray or off-white background (e.g., `#EAEAEA`) with darker, contrasting geometric shapes in shades of gray and black. Glow effects will be a soft, ethereal white or a single, pale accent color.
    *   **Dark Theme:** A deep, dark background, potentially deep red or near-black (e.g., `#1A0000` or `#050505`). Geometric elements will be rendered in stark, bright, glowing colors like electric blue, magenta, or a fiery orange.

*   **Geometric Primitives:** All visual elements will be constructed from basic shapes.
    *   **Notes:** Tap (Square), Hold (Rectangle), Swipe (Rhombus), Catch (Line Segment).
    *   **UI:** Buttons, sliders, and menus will be constructed from simple lines and rectangles, adopting a wireframe-like appearance.
    *   **Effects:** Hit animations will be a "shatter" effect, breaking the note's shape into smaller fragments. Glow effects will be used extensively on notes, the judgment line, and hit effects to provide strong visual feedback.

*   **Typography:** A clean, modern, sans-serif typeface will be used for all text to complement the minimalist aesthetic.

## 3. Gameplay Mechanics

The gameplay is designed to be intuitive for rhythm game veterans while offering unique challenges through its dynamic judgment line.

*   **Judgment Line:** The judgment line is a central actor in the gameplay. Its movement, rotation, and color can change dynamically based on commands in the chart file.

*   **Note Types:**
    *   **Tap:** A single square. Requires a precise tap.
    *   **Hold:** A rectangle with a defined start and end. Requires the player to press, hold, and release.
    *   **Swipe:** A rhombus. Requires a directional flick.
    *   **Catch:** A line segment. Requires no input but awards points if the judgment line is positioned to intercept it.

*   **Scoring System:**
    *   **Judgment:** "Perfect," "Good," and "Miss" windows, based on timing accuracy.
    *   **Score:** A point-based system with bonuses for high combos.
    *   **Grading:** A final letter grade (e.g., S, A, B, C, F) based on overall performance.

## 4. Audio and Music

The game will feature a diverse soundtrack, with a focus on electronic music genres that complement the futuristic, geometric aesthetic. Hit sounds will be sharp, clear, and satisfying.

## 5. Chart Editor

A key feature of TheEnd will be a powerful, user-friendly chart editor for desktop platforms. This will allow the community to create and share their own charts, fostering a vibrant ecosystem of user-generated content.

## 6. Technical Implementation

*   **Frontend:** Vue.js
*   **Rendering:** HTML/CSS, with potential for Canvas or WebGL for more complex background effects.
*   **Performance:** C++ and WebAssembly may be used for performance-critical components.
*   **Platform:** The primary target for the game is Android (packaged with Capacitor), while the chart editor will be designed for desktop.
