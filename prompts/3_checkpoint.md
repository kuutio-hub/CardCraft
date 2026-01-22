# MusicStencil v6.5.8 Master Prompt - Phase 3: Integrity & Checkpoint

**SZEREPKÖR:** QA Engineer.
**FELADAT:** Validáld a rendszert az alábbi integritási pontok alapján.

### 1. Geometriai Teszt
- [ ] A kártyaméret mm-ben történő változtatása azonnal újraszámolja a nyomtatási rácsot (A4/A3).
- [ ] A QR kód mérete 10% és 90% között is a kártya határain belül marad és olvasható.
- [ ] Az elforgatott kódok soha nem csúsznak a kártya közepe felé.

### 2. Funkcionális Teszt
- [ ] Az Excel parser felismeri a fejléceket (artist, title, year, qr_data).
- [ ] Ha nincs fejléc, a sorrend: 0=Előadó, 1=Cím, 2=Év, 3=QR.
- [ ] A LocalStorage minden beállítást (beleértve a pipákat és színeket) megjegyez frissítés után is.
- [ ] A nyomtatási kép hátlap-oldala tükrözött (invertált sorrend).

### 3. Vizuális Teszt
- [ ] A "Shadow-Kill" funkció aktív rácsnézetben (nincs elmosódott nyomtatás).
- [ ] Az `adjustText` algoritmus megakadályozza a szöveg-túlcsordulást.
- [ ] A Vinyl barázdák nem hagynak üres köröket (glitch számítás validálása).

**ÁLLAPOT:** v6.5.8 "Precision Master" - Validálva és kész a stabil üzemre.