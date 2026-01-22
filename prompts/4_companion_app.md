# CardCraft Master Prompt - Phase 4: QR Companion App

**SZEREPKÖR:** Senior Frontend Developer.
**FELADAT:** Hozz létre egy önálló, egycélú webalkalmazást, amely a CardCraft kártyákon lévő QR kódok beolvasására és a mögöttük lévő zenei előnézetek lejátszására szolgál egyedi felhasználói élménnyel.

### 1. Projekt Célja és UX Folyamat

A cél egy minimalista, "short-form" stílusú mobilalkalmazás, amely a következő folyamatot valósítja meg:
1.  **Indítás:** Egyetlen gomb fogadja a felhasználót: "Szkennelés indítása".
2.  **Engedélykérés:** A gombra kattintva az alkalmazás egyszerre kér engedélyt a kamera és a mozgásérzékelők (giroszkóp) használatához. Ez kulcsfontosságú az iOS 13+ kompatibilitás miatt.
3.  **Szkennelés:** Az engedély megadása után elindul a kamera, és a felhasználó ráirányíthatja egy QR kódra.
4.  **Siker:** Sikeres beolvasáskor a kamera leáll, és egyértelmű, animált utasítás jelenik meg: "Fordítsd le a telefont a zene indításához!".
5.  **Interakció (Fordítás):** A giroszkóp figyeli a telefon helyzetét. Amint a felhasználó arccal lefelé fordítja a készüléket (pl. asztalra helyezi), a zene automatikusan elindul.
6.  **Lejátszás:** A zene lejár (kb. 30 mp). A lejátszás végén megjelenik egy "Új kártya szkennelése" gomb.

### 2. Technológiai Stack & Fájlstruktúra

*   **Technológia:** Vanilla JavaScript (ES6), HTML5, CSS3.
*   **Külső Libek (CDN):**
    *   `jsQR` a QR kód olvasáshoz.
    *   `FontAwesome` az ikonokhoz.
*   **Projekt Struktúra (Új, önálló projektként):**
    1.  `index.html`: Az alkalmazás teljes HTML váza, amely tartalmazza az összes "képernyőt" (konténert).
    2.  `style.css`: A teljes dizájn, mobil-első megközelítéssel, sötét módban.
    3.  `main.js`: Az alkalmazás teljes logikája.

---

### Phase 4.1: HTML Struktúra (`index.html`)

Hozd létre a HTML vázat a következő logikai konténerekkel. A láthatóságukat CSS osztály (`.hidden`) fogja vezérelni.

*   **`#start-container`:** Az indítóképernyő a címmel és a `#start-button`-nal.
*   **`#scanner-container`:** Teljes képernyős konténer, benne a `<video id="scanner-video">` elemmel és egy vizuális kerettel (`#scanner-overlay`).
*   **`#instruction-container`:** A sikeres beolvasás utáni képernyő, egy animált ikonnal és a "Fordítsd le!" utasítással.
*   **`#playing-container`:** A lejátszás alatti képernyő, egy "loading" spinnerrel, ami a lejátszás végén pipára vált. Itt kap helyet a `#reset-button`.
*   **Rejtett elemek:**
    *   `<audio id="audio-player">`: A zene lejátszásához.
    *   `<canvas id="canvas">`: A `jsQR` számára, hogy a videó képkockáit elemezni tudja.

---

### Phase 4.2: CSS Dizájn (`style.css`)

Tervezz egy letisztult, modern, sötét témájú felületet.

*   **Színek:** Használj CSS változókat (`:root`). Alap háttér: sötétszürke (`#121212`), kiemelő szín: Spotify-zöld (`#1DB954`).
*   **Tipográfia:** Használj rendszer betűtípust (`-apple-system`, `Roboto`, etc.) a natív érzetért.
*   **Layout:** Minden legyen középre igazítva a flexbox segítségével. Az alkalmazás legyen 100% széles és magas, `overflow: hidden`.
*   **Animációk:**
    *   `@keyframes fadeIn`: Finom beúszás a konténerek váltásakor.
    *   `@keyframes pulse`: Az ikonok (pl. a "fordítsd le" telefon ikon) finoman pulzáljanak, hogy felhívják magukra a figyelmet.
*   **Szkennelés:** A videó töltse ki a teljes képernyőt (`object-fit: cover`). Az overlay adjon egy "célkereszt" érzetet.

---

### Phase 4.3: JavaScript Logika (`main.js`)

Implementáld az alkalmazás logikáját a leírt UX folyamat alapján.

1.  **DOM Elemek Referenciái:** Gyűjtsd ki az összes szükséges HTML elemet változókba.
2.  **Engedélykérés (`requestPermissions`):**
    *   Hozz létre egy aszinkron funkciót.
    *   Ellenőrizd, hogy `DeviceOrientationEvent.requestPermission` létezik-e (ez az iOS 13+ specifikus). Ha igen, hívd meg.
    *   A funkció a `startScan`-ből legyen meghívva a `#start-button` kattintására.
3.  **Szkennelés (`startScan`, `tick`):**
    *   Kérj hozzáférést a hátsó kamerához (`{ video: { facingMode: "environment" } }`).
    *   A videó stream-et add át a `<video>` elemnek.
    *   Indíts egy `requestAnimationFrame` ciklust (`tick` funkció).
    *   A `tick` minden képkockán: rajzold a videó képét a rejtett canvas-re, majd a `jsQR` segítségével elemezd a canvas tartalmát.
    *   Ha a `jsQR` kódot talál, állítsd le a `requestAnimationFrame` ciklust és a videó stream-et, majd hívd meg a `handleQRCode(code.data)` funkciót.
4.  **Állapotváltás & Giroszkóp (`handleQRCode`, `listenForFlip`):**
    *   A `handleQRCode` funkció rejtse el a szkennert és jelenítse meg az "utasítás" konténert.
    *   Mentsd el a beolvasott URL-t egy globális változóba.
    *   Hívd meg a `listenForFlip` funkciót, ami hozzáad egy `deviceorientation` eseményfigyelőt a `window`-hoz.
5.  **A "Fordítás" Érzékelése (`deviceOrientationHandler`):**
    *   Az eseményfigyelő az `event.beta` értéket figyeli (előre-hátra dőlés).
    *   Ha `beta > 160` (vagy egy hasonló, tesztelt küszöbérték), az azt jelenti, hogy a telefon arccal lefelé van.
    *   Ha ez teljesül: **azonnal távolítsd el az eseményfigyelőt**, hogy ne fusson le többször, majd hívd meg a `playMusic()` funkciót.
6.  **Lejátszás és Befejezés (`playMusic`):**
    *   Válts a "lejátszás" képernyőre.
    *   Az `<audio>` elem `src` tulajdonságának add át a mentett URL-t, majd hívd meg a `.play()` metódust.
    *   Figyelj az `audio.onended` eseményre. Amikor a zene véget ér, cseréld le a spinnert egy pipa ikonra, és jelenítsd meg az "Új kártya" gombot.
7.  **Újraindítás (`resetApp`):**
    *   A `#reset-button` kattintására állíts vissza mindent az alaphelyzetbe: rejtsd el az összes konténert, és jelenítsd meg újra az indítóképernyőt (`#start-container`).

**VÉGSŐ CÉL:** Egy letisztult, hibátlanul működő, önálló webalkalmazás, amely a CardCraft kártyákkal való interakciót egy új szintre emeli. A végeredmény három fájl legyen: `index.html`, `style.css`, `main.js`.
