# CardCraft v2.7.0 Master Prompt - Phase 1: Engine & Mathematics

**SZEREPKÖR:** Senior Software Engineer (Algorithms & Data).
**FELADAT:** Implementáld a kártyagenerálás, adatkezelés és a külső API integrációk logikáját.

### 1. Adatkezelés és Validálás
- **Spotify Integráció (`SpotifyHandler`):** 
  - OAuth Client Credentials Flow implementálása.
  - Playlist és Album URL-ek feldolgozása, lapozható (`next`) lekérdezések kezelése.
- **MusicBrainz Validálás:**
  - Aszinkron folyamat (`validateYearsWithMusicBrainz`) progress bar-ral.
  - `artist` és `title` alapján keresés a MusicBrainz API-n.
  - Évszámok intelligens javítása és a nem validálható dalok szűrése.
- **XLS Export (`downloadDataAsXLS`):**
  - A jelenlegi adatállomány (validált adatok) exportálása `.xlsx` formátumba dinamikus fájlnévvel (`CardCraft_data_YYMMDD_HHMM.xlsx`).

### 2. Kártya Generálás Motor (`card-generator.js`)
- **Szöveg-illesztés (`adjustText`):** Rekurzív font-méret csökkentés, amíg a tartalom belefér a konténerbe. Címeknél intelligens sortörés.
- **Vinyl SVG Generátor (`generateVinyl`):**
  - Koncentrikus körök generálása paraméterezhető sűrűséggel és vastagsággal.
  - **Glitch logika:** Véletlenszerű szakadások (`stroke-dasharray`) generálása a köríveken. Támogatni kell a 'random' és 'degree' (fokozatos eltolás) módokat.
  - **Neon mód:** SVG filterek (drop-shadow) dinamikus alkalmazása véletlenszerű színekkel.
- **Üzemmódok:**
  - **Music Mode:** Egyedi adatok (Artist, Title, Year, QR) megjelenítése. Előlap + Hátlap (tükrözött sorrendben).
  - **Token Mode:** Egységes szöveg (Main + Sub) minden kártyán. Külön generál egy teljes ív előlapot és egy teljes ív hátlapot a tömeges gyártáshoz.

### 3. Aszinkron Nyomtatás (`renderAllPagesWithProgress`)
- A nyomtatási DOM generálása nagy adatmennyiség esetén blokkolhatja a UI-t.
- Implementálj egy `chunk` alapú generálást `setTimeout(..., 0)` megszakításokkal, hogy a UI (és a progress bar) frissülni tudjon a generálás közben.
- A böngésző `window.print()` hívását csak a DOM teljes felépülése után hívd meg.

### 4. Biztonság
- **Access Code:** A `main.js` induláskor ellenőrizze a felhasználói kódot egy Base64 kódolt kulccsal szemben. Helytelen kód esetén tiltsa a hozzáférést.