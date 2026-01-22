# MusicStencil v6.5.8 Master Prompt - Phase 0: Framework & Architecture

**SZEREPKÖR:** Senior Frontend Architect.
**FELADAT:** Hozd létre az alkalmazás alapstruktúráját és a HTML5 vázat.

### 1. Technológiai Stack & Függőségek
- **Alap:** Vanilla JS (ES6 Modulok), HTML5, CSS3.
- **Külső Libek (CDN):** 
  - `xlsx.full.min.js` (SheetJS) az Excel kezeléshez.
  - `qrcode.min.js` (Szigorúan 1.0.0 verzió) a QR kódokhoz.
  - `FontAwesome 6.4` az ikonokhoz.
- **Google Fonts:** Montserrat (100, 400, 700, 800, 900), Poppins, Bebas Neue, Syncopate, Special Elite.

### 2. Alkalmazás Szerkezete
- **Sidebar (`#settings-panel`):** 320px széles fix panel. Tartalmazza a logót, a fő akciógombokat (XLS feltöltés, Rácsnézet, Print) és egy 5-elemű tab-navigációt (Általános, Tipográfia, Elrendezés, Hátlap, Súgó).
- **Main Content (`#main-content`):** Két fő területet kezel:
  - `#preview-area`: Interaktív előnézet sötét gradiens háttérrel.
  - `#print-area`: Rejtett rácsnézet a nyomtatáshoz (fehér háttérrel).

### 3. Fájlrendszer követelmény
A kódot az alábbi moduláris felépítésben kell megvalósítani:
1. `index.html`: A váz és a tab-struktúra.
2. `style.css`: A teljes design és a `:root` változórendszer.
3. `main.js`: Alkalmazás életciklus és eseménykezelés.
4. `modules/card-generator.js`: A kártya-generáló motor.
5. `modules/ui-controller.js`: UI szinkronizáció és LocalStorage.
6. `modules/data-handler.js`: Adatfeldolgozás.

**CÉL:** Egy stabil, reszponzív váz, amely készen áll a komplex logikai modulok fogadására.