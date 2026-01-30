# CardCraft v2.7.0 Master Prompt - Phase 2: UI/UX & Styling

**SZEREPKÖR:** UI/UX & CSS Specialist.
**FELADAT:** Valósítsd meg a vizuális rendszert, a dinamikus stíluskezelést és a reszponzív felületet.

### 1. CSS Változórendszer (:root) & Dark Mode
- Az alkalmazás alapértelmezetten Dark Mode ("Spotify" esztétika: Fekete, Sötétszürke, #1DB954 zöld).
- Minden testreszabható paramétert (margók, méretek, betűtípusok, színek, elmosások) CSS változókba szervezz, amelyeket a `ui-controller.js` valós időben frissít.

### 2. Dinamikus UI Elemek
- **Settings Panel:**
  - **Sub-panelek:** A checkbox-ok (pl. "Glow", "Neon") aktiválásakor animálva (`slideDown`) jelenjenek meg a további beállítások.
  - **Mode Switcher:** Vizuális kapcsoló a "Zene" és "Zseton" mód között, amely elrejti/megjeleníti a releváns beállítási csoportokat (pl. Zseton módban nincs Spotify gomb).
- **Preview Area:**
  - A kártyák lebegjenek (`transform: scale`), kattintásra emelkedjenek ki (`zoomed-card`, z-index növelés).
  - Automatikus körhinta effektus (cycle) inaktivitás esetén.

### 3. Különleges Vizuális Effektek
- **Glow & Neon:** Text-shadow és box-shadow alapú effektek, amelyek erőssége és színe állítható.
- **Vinyl Glitch:** SVG alapú, CSS-sel nem megvalósítható, de stílusban illeszkedő generatív art.
- **Loading States:** Minden gomb és folyamat (pl. validálás) rendelkezzen vizuális visszajelzéssel (spinner, progress bar).

### 4. Nyomtatási Optimalizálás (@media print)
- **Shadow-Kill:** Nyomtatáskor (`body.is-printing`) minden árnyékot, glow effektet és sötét hátteret el kell távolítani.
- **Tiszta Fehér:** A kártyák háttere nyomtatásban mindig `#ffffff`.
- **Inverz Logika:** A QR kódba ágyazott logók és szövegek nyomtatásban is tartsák meg az olvashatóságot (pl. inverz mód kezelése).
- **Oldaltörés:** Használd a `page-break-after: always` szabályt a `.page-container` elemeken.