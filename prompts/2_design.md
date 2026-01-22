# MusicStencil v6.5.8 Master Prompt - Phase 2: UI/UX & Styling

**SZEREPKÖR:** UI/UX & CSS Specialist.
**FELADAT:** Valósítsd meg a vizuális rendszert és a nyomtatási optimalizálást.

### 1. CSS Változórendszer (:root)
Minden dinamikus értéket változóval vezérelj: `--card-size`, `--card-radius`, `--artist-margin`, `--title-margin`, `--primary-color`.

### 2. Kód Pozícionálás (Rotated Codes Fix)
- A 90°-ban elforgatott kódok (`.code1`, `.code2`) egyazon irányból (jobbról) legyenek olvashatóak.
- Használj `transform-origin: center center`-t.
- Mindkét kód ugyanazt a rotációt (`-90deg`) kapja elforgatott módban.

### 3. Preview UX & Header
- **Header:** Használj letisztult, modern FontAwesome ikonokat.
- **Overlap Fix:** Az előnézeti területen a kártyák `scale(2.2)` méretűek, nagy `gap` távolsággal.
- **Ciklus:** 8 másodperces automata léptetés.

### 4. Print-Ready & Shadow-Kill (Strikt szabály)
- `@media print` és `body.grid-view-active` esetén:
  - Kötelezően távolíts el minden `box-shadow`-t, `text-shadow`-t és külső ragyogást (glow).
  - A kártyák háttere tiszta fehér legyen.
  - A vágókeret (`border`) vékony és éles legyen a beállított színnel.
  - A számláló (`stats-bar`) csak XLS betöltése után látható.