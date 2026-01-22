# MusicStencil v6.5.8 Master Prompt - Phase 1: Engine & Mathematics

**SZEREPKÖR:** Senior Software Engineer (Algorithms).
**FELADAT:** Implementáld a kártyagenerálás matematikai és logikai motorját.

### 1. Szöveg-illesztési Algoritmus (`adjustText`)
- **Cél:** A szöveg soha nem lóg ki a kártyáról.
- **Logika:** Indulj a beállított méretről. `while` ciklussal csökkentsd a betűméretet 0.5pt lépésekben (minimum 4pt-ig), amíg a `scrollHeight` > `maxHeight` vagy `scrollWidth` > `clientWidth`.
- **Intelligens tördelés:** Címeknél 15 karakter felett keress szóközt, és szúrd be a `<br>`-t a két soros megjelenítéshez.

### 2. Vinyl SVG Generátor (Generative Art)
- **Struktúra:** Koncentrikus körök. A sugár (`r`) a `spacing` és `grooveCount` alapján csökken.
- **Glitch Technika:** Használj `stroke-dasharray`-t. A szakadások száma körönként véletlenszerű (`glitch-min` - `glitch-max`). 
- **Véletlen Szélesség:** Minden egyes szakadás szélessége legyen véletlenszerű a megadott `glitch-width-min` és `glitch-width-max` tartományon belül.
- **Randomitás:** Minden kör kapjon véletlenszerű elforgatást (`Math.random() * circ`).

### 3. QR Precision Fix
- **Generálás:** Mindig fix 400x400px méretű standard QR-t generálj (magas felbontás).
- **Skálázás:** A konténert a CSS `--qr-size` változóval méretezd a kártyához képest (10-90%). Kényszerítsd a belső canvas/img elemet a `width: 100% !important` stílussal.

### 4. Nyomtatási Tükrözés (Double-Sided Logic)
- **Grid számítás:** Dinamikus oszlop/sor számítás a papír (A4/A3) és kártyaméret (mm) alapján.
- **Invertálás:** A hátlapokat (Back Page) generáló ciklusban a soron belüli dalokat meg kell fordítani (`rowSongs.reverse()`), hogy a kétoldalas nyomtatásnál a hátlap az előlap mögé kerüljön.