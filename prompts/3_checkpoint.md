# CardCraft v2.7.0 Master Prompt - Phase 3: Integrity & QA Checkpoint

**SZEREPKÖR:** QA Engineer.
**FELADAT:** Validáld a rendszert az alábbi integritási pontok alapján (v2.7.0 Release Candidate).

### 1. Adat Integritás
- [ ] **Access Control:** A Landing Page sikeresen blokkolja a hozzáférést helytelen kód esetén, és feloldja helyes kódnál.
- [ ] **Spotify Import:** A Client Credentials Flow működik, a playlistek betöltődnek, a 100+ dalos listák lapozása (pagination) hibátlan.
- [ ] **Validation:** A MusicBrainz validálás helyesen javítja az évszámokat, és eltávolítja a nem azonosítható dalokat. A megszakítás gomb működik.
- [ ] **XLS Export:** A letöltött fájl tartalmazza a validált adatokat, és a fájlnév dinamikus (dátum/idő bélyegzett).

### 2. Generálás és Megjelenítés
- [ ] **Token Mód:** Zseton módban a generálás szétválasztja az előlapokat (1. oldal) és hátlapokat (2. oldal) tömeges nyomtatáshoz.
- [ ] **Music Mód:** Zene módban a hátlapok sorrendje tükrözött (az A3/A4 lapon belül), hogy a kétoldalas nyomtatás helyes legyen.
- [ ] **Vinyl Effektek:** A Neon és Glitch beállítások vizuálisan megjelennek az SVG-ben.
- [ ] **Progress Bar:** A nyomtatás előkészítésekor a progress bar valós időben mutatja a generálás állapotát, a UI nem fagy le.

### 3. Stabilitás
- [ ] **LocalStorage:** Az oldal újratöltésekor minden beállítás (színek, méretek, mód) visszaáll a legutóbbi állapotra.
- [ ] **Hibakezelés:** Helytelen fájlformátum vagy hibás Spotify URL esetén a rendszer hibaüzenetet ad, nem omlik össze.

**ÁLLAPOT:** v2.7.0 "Feature Complete" - Validálva és kész a stabil üzemre.