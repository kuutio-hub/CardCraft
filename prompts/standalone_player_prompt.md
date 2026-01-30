# Master Prompt: CardCraft Player (Standalone Web App)
**ROLE:** Senior Frontend Architect & Mobile UX Specialist.
**TASK:** Create a production-ready, single-file HTML web application hosted on GitHub Pages. The app is a companion player for a music quiz game (Hitster style).

## 1. Project & Architecture
- **Goal:** Scan QR codes -> Prompt user to flip phone -> Play music when face down -> Reveal song when face up.
- **Hosting:** GitHub Pages compatible (Static HTML/JS, no backend, no build step).
- **Structure:** Single file (`index.html`) but **strictly modular internal architecture**.
  - Use ES6 Classes or Objects to separate logic (e.g., `class App`, `class AudioManager`, `class SensorManager`, `class UIManager`).
  - Prepare for future splitting: Logic should not be tightly coupled to the global scope.
- **Language:** **Hungarian (HU)** default, but **i18n ready**.
  - Use a `translations` object (e.g., `const i18n = { hu: {...}, en: {...} }`) so adding languages later is easy.

## 2. Design & Responsiveness
- **Style:** "Neon Noir" / Spotify Aesthetic. Dark background (`#121212`), Green accents (`#1DB954`), White text.
- **Mobile First:** The UI is designed for touch interactions on phones.
- **Desktop Friendly:** Since the user might edit/test on desktop:
  - Wrap the main app content in a container with a `max-width: 480px`.
  - On Desktop: Center this container on the screen with a subtle shadow/border (simulating a phone screen).
  - On Mobile: The container takes 100% width/height.

## 3. Functional Requirements

### A. States (UI Screens)
Implement a State Machine to manage these views:
1.  **Home / Permissions:**
    - Logo & Title.
    - Button: "JÁTÉK INDÍTÁSA" (Triggers Camera & Gyroscope permissions).
    - Footer: Version info.
2.  **Scanner:**
    - Full-screen video feed (using `jsQR`).
    - Overlay frame.
    - Text: "Olvass be egy kártyát".
3.  **Pre-Play (Wait for Flip):**
    - Camera stops.
    - **NO METADATA** shown yet (Spoiler protection).
    - Animation: Phone flipping icon.
    - Text: "Fordítsd le a telefont a lejátszáshoz!"
4.  **Playing (Face Down):**
    - Screen goes dark/black (Battery saver & Light leak prevention).
    - Audio playing.
5.  **Reveal (Result):**
    - Triggered when phone is picked up (Face Up) OR audio ends.
    - Audio stops/pauses.
    - Display: Artist, Title, Year (parsed from QR).
    - Button: "KÖVETKEZŐ KÁRTYA" (Resets to Scanner).

### B. Hardware Logic
- **Camera:** Use `navigator.mediaDevices.getUserMedia` with `facingMode: "environment"`. Handle iOS `playsinline`.
- **Gyroscope (The "Flip"):**
  - Use `DeviceOrientationEvent`.
  - **iOS 13+ Requirement:** You MUST implement the permission request logic (`DeviceOrientationEvent.requestPermission()`) triggered by the "Start" button click.
  - **Logic:**
    - *Face Down:* `beta > 150` or `beta < -150`.
    - *Face Up:* `beta < 90` and `beta > -90`.
    - Implement a small "debounce" (delay) to prevent accidental triggers while handling the phone.

### C. Audio & Data Handling
- **QR Data Format:** Expect a JSON string: `{"artist":"...","title":"...","year":"...","preview":"url..."}` OR a raw URL.
- **Playback:**
  - Use standard HTML5 `<audio>`.
  - If the URL is a direct MP3: It works perfectly.
  - If it's a generic link (e.g., YouTube/Spotify Web), show a "Link megnyitása" button in the Reveal state instead of auto-playing (due to browser autoplay restrictions).

## 4. Output Deliverable
Provide the **full content of `index.html`**.
- Include CSS in `<style>` tags.
- Include JS in `<script>` tags.
- Load `jsQR` from CDN: `https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js`
- Ensure the code is robust, error-handled (e.g., if camera is denied), and aesthetically pleasing.

**IMPORTANT:** Do not explain the code. Just output the code block.