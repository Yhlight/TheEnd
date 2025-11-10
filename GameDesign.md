# GameDesign.md

## 1. Core Philosophy: Geometric Abstraction & Atmospheric Immersion

TheEnd is a rhythm game centered on the concept of "geometric beauty." It seeks to create a unique, hard-to-describe feeling by merging abstract geometric visuals with an extreme color palette and atmospheric glow effects. The experience is designed to be immersive and captivating, with a high skill ceiling that rewards precision and deep engagement with the music and visuals.

## 2. Visual Aesthetics: An Extreme & Deliberate Style

The visual identity of TheEnd is its most defining feature. It is minimalist yet powerful, abstract yet deliberate, and built upon a strict set of rules to ensure a cohesive and impactful aesthetic.

### 2.1. The Color Palette: A Study in Extremes

The game will avoid mid-tones entirely, opting for one of two distinct, high-contrast themes. This extreme choice is crucial for establishing the game's unique mood and ensuring that the geometric elements and glow effects have maximum visual impact.

*   **Pale Theme (The Void):**
    *   **Background:** Pale, near-white, or light gray tones (e.g., `#EAEAEA`, `#DCDCDC`). This creates a sense of vast, sterile, and serene space.
    *   **Elements:** Geometric shapes will be rendered in dark grays, deep reds, or black (e.g., `#1A1A1A`, `#4B0000`).
    *   **Glow:** The glow will be a soft, ethereal white or a very light, desaturated color, providing a subtle, haunting bloom around the stark geometric forms.

*   **Dark Theme (The Deep):**
    *   **Background:** Deep, dark, and desaturated colors, such as deep red or near-black (e.g., `#1A0000`, `#050505`). This theme evokes a sense of mystery, intensity, and focus.
    *   **Elements:** Geometric shapes will be rendered in bright, stark, glowing colors like electric blue, magenta, or a fiery orange (`#00FFFF`, `#FF00FF`, `#FF4500`).
    *   **Glow:** The glow is a core component here, creating a vibrant, energetic, and almost pulsating aura around the notes and UI elements.

### 2.2. Geometric Primitives: The Building Blocks of the World

All visual elements in TheEnd will be constructed from a limited set of geometric primitives. The game will **strictly avoid** the use of external image assets or complex sprites. The beauty emerges from the composition, animation, and interaction of these simple forms.

*   **Notes:**
    *   **Tap:** A simple square.
    *   **Hold:** A rectangle with a filled, glowing track.
    *   **Swipe:** A rhombus, with its orientation indicating the swipe direction.
    *   **Catch:** A simple, glowing line segment that the judgment line must pass through.
*   **UI Elements:** Buttons, menus, and progress bars will be constructed from lines and rectangles, adopting a clean, wireframe-like aesthetic that complements the gameplay visuals.
*   **Effects & Feedback:**
    *   **Hit Animation:** On a successful hit, the note's geometric shape will shatter into smaller, glowing fragments or lines that animate outwards. The intensity and color of the shatter effect will correspond to the judgment accuracy (e.g., a brighter, more explosive effect for "Perfect").
    *   **Judgment Line:** The judgment line itself is a key visual element. It will pulse with light on successful hits and can change its color and intensity as part of the chart's choreography.

### 2.3. The Role of Glow & Light

Glow is not merely a decorative effect; it is a fundamental part of the game's visual language. It provides feedback, creates atmosphere, and highlights the stark beauty of the geometric shapes.

*   **Atmosphere:** Subtle, persistent glows on background elements and the judgment line create a sense of depth and energy.
*   -**Feedback:** Hit effects, note appearances, and combo milestones will all be accompanied by distinct glow animations.
*   **Emphasis:** Glow will draw the player's eye to important elements, guiding them through the gameplay experience.

## 3. Gameplay Mechanics

The gameplay mechanics are designed to be intuitive for rhythm game veterans but will be enhanced by the dynamic and expressive nature of the visuals.

*   **Dynamic Judgment Line:** The judgment line is not static. Its movement, rotation, and visual properties (color, glow intensity) are part of the chart itself, creating a dynamic and engaging playfield.
*   **Note Types & Judgment:** The four core note types (Tap, Hold, Swipe, Catch) will be judged based on timing and, for swipes, directional input. The judgment system will be clear and responsive, with visual feedback (shatter effects) and audio cues reinforcing player performance.
*   **Scoring System:** The scoring will be based on accuracy ("Perfect," "Good," "Miss") and combo. A final letter grade will be awarded based on overall performance.

## 4. Audio Design

The audio will be tightly integrated with the visuals.

*   **Music:** The soundtrack will focus on electronic genres that align with the game's futuristic and abstract aesthetic.
*   **Sound Effects:** Hit sounds will be crisp, clear, and satisfying, designed to complement the geometric shatter effects. UI sounds will be minimalist and clean.

## 5. Chart Editor & Community

A powerful, desktop-based chart editor is a core part of the long-term vision. It will empower the community to create and share their own charts, leveraging all the dynamic visual and mechanical features of the game engine.

## 6. Technical Direction

*   **Framework:** Vue.js
*   **Rendering:** HTML/CSS will be the primary rendering technology. The focus will be on leveraging CSS animations and properties (like `box-shadow` and `filter: blur()`) to achieve the desired geometric and glow effects efficiently. Canvas or WebGL may be considered for complex background visuals if needed.
*   **Platform:** The game is primarily targeted for Android (packaged with Capacitor), with the chart editor designed for desktop use.
