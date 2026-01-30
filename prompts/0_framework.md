# CardCraft v2.7.0 Master Prompt - Phase 0: Framework & Architecture

**SZEREPKÖR:** Senior Frontend Architect.
**FELADAT:** Hozd létre az alkalmazás alapstruktúráját, a biztonsági beléptetést és a moduláris fájlrendszert.

### 1. Technológiai Stack & Függőségek
- **Alap:** Vanilla JS (ES6 Modulok), HTML5, CSS3.
- **Külső Libek (CDN):** 
  - `xlsx.full.min.js` (SheetJS) az Excel kezeléshez és exportáláshoz.
  - `qrcode.min.js` (1.0.0) a QR kódok generálásához.
  - `FontAwesome 6.4` az ikonokhoz.
- **Google Fonts:** Montserrat, Poppins, Bebas Neue, Syncopate, Special Elite.

### 2. Alkalmazás Szerkezete
- **Landing Page (`#landing-page`):** Teljes képernyős beléptető felület jelszóvédelemmel (`checkAccessCode`), amely elrejti a fő alkalmazást a helyes kód megadásáig.
- **Sidebar (`#settings-panel`):** 
  - **Header:** Logó, Üzemmód váltó (Zene/Zseton), Statisztika sáv, Reset gomb.
  - **Actions:** Adatkezelés (Spotify, Upload, Validate, Download) és Műveletek (Nézet váltás, Nyomtatás).
  - **Navigation:** 5-elemű tab-rendszer (Általános, Tipográfia, Elrendezés, Hátlap, Súgó).
  - **Scroll Container:** A beállítások részletes vezérlői.
  - **Footer:** Verziószám és mentés visszajelző.
- **Main Content (`#main-content`):**
  - `#preview-area`: Interaktív, sötét hátterű előnézet, amely automatikusan lapozza a kártyákat.
  - `#print-area`: Rejtett, fehér hátterű terület a nyomtatási rács generálásához.
- **Modals:**
  - `#progress-modal`: Validálási folyamatjelző.
  - `#print-progress-modal`: Nyomtatási generálás folyamatjelző.
  - `#help-modal`: Dinamikus súgó.

### 3. Fájlrendszer Követelmény
A kódot az alábbi moduláris felépítésben kell megvalósítani:
1.  `index.html`: A HTML váz, beleértve a Landing Page-et és a Modális ablakokat.
2.  `style.css`: A teljes design, CSS változók (`:root`), animációk és print-specifikus szabályok.
3.  `main.js`: Alkalmazás belépési pont, `App` objektum, eseménykezelők, Preview ciklus.
4.  `modules/ui-controller.js`: UI események kezelése, LocalStorage mentés/betöltés, CSS változók frissítése.
5.  `modules/data-handler.js`: Fájl (CSV/XLS) parse-olás, oszlopfelismerés.
6.  `modules/card-generator.js`: A kártyák (Music és Token mód) DOM generálása, SVG Vinyl logika, QR generálás.
7.  `modules/spotify-handler.js`: Spotify API integráció (Client Credentials Flow) és MusicBrainz keresés.

**CÉL:** Egy biztonságos, moduláris váz, amely képes kezelni a komplex adatfolyamokat (Spotify, XLS) és a vizuális generálást.