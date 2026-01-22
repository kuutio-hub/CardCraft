# CardCraft v1.9.0 - Felhasználói Kézikönyv

A CardCraft egy webes alkalmazás egyedi, vinyl-stílusú kártyák és zsetonok tervezésére és nyomtatására.

## 1. Kezelőfelület felépítése

Az alkalmazás bal oldalon egy fix beállításpanelt, jobb oldalon pedig egy élő előnézeti/nyomtatási területet tartalmaz.

### Fő Módok (Sidebar teteje)
*   **Zene Mód (Music):** Adatbázis alapú kártyák (Spotify vagy XLS fájlból). Előadó, Cím, Év, QR kód és egyedi azonosító kódok kezelése.
*   **Zseton Mód (Token):** Egységes design generálása (pl. fesztiválpénz, kupon). Egy oldalra csak előlapokat, a következőre csak hátlapokat generál.

---

## 2. Adatok Betöltése (Csak Zene Mód)

Kétféleképpen tölthetsz be adatokat:

### Spotify Import (Ajánlott)
1.  Kattints a **SPOTIFY** gombra.
2.  Másold be a Spotify lejátszási lista vagy album linkjét a felugró ablakba.
3.  A rendszer automatikusan letölti és feldolgozza az adatokat.

### XLS Import (Haladó)
Kattints az **XLS** gombra egy Excel fájl (.xls, .xlsx) betöltéséhez.
A rendszer automatikusan felismeri a következő oszlopokat (fejléc alapján vagy sorrendben):
1.  **Artist** (Előadó)
2.  **Title** (Cím)
3.  **Year** (Évszám)
4.  **QR Data** (URL vagy szöveg a QR kódhoz)
5.  **Code1** (Bal oldali/felső kód)
6.  **Code2** (Jobb oldali/alsó kód)

---

## 3. Beállítások (Tabok)

### 🎚️ Méretek (General)
Itt állíthatod be a fizikai méreteket, a vágókeretet és az egyedi háttereket.
*   **Papír:** A4 vagy A3. A rendszer automatikusan újraszámolja, hány kártya fér el egy lapon.
*   **Kártya méret:** A kártya vágott mérete mm-ben (Standard: 46mm).
*   **Keret:** Szín, vastagság és opacitás.
    *   *Keret Mód:* Beállíthatod, hogy a vágójel csak az előlapon, csak a hátlapon, vagy mindkettőn látszódjon.
*   **Egyedi háttér:** Lehetőséged van saját képet beállítani a kártyák háttereként.
    *   *Kép feltöltése:* Válassz egy képet a számítógépedről.
    *   *Opacitás:* A háttérkép átlátszósága.
    *   *Keverés (Blend Mode):* Meghatározza, hogyan keveredjen a kép a kártya alapszínével (pl. `Overlay` a leggyakoribb).
    *   *Elmosás (Blur):* A háttérkép elmosásának mértéke.

### 🅰️ Tipográfia
A betűtípusok és szövegeffektek beállítása.
*   **Betűtípus:** Válassz a listából (Montserrat, Poppins, Typewriter, stb.).
*   **Elemek (Év, Előadó, Cím):**
    *   Méret (pt).
    *   **Bold:** Félkövér szedés.
    *   **Glow:** Bekapcsolásával lenyílik a részletes menü, ahol beállíthatod a ragyogás színét és az elmosás mértékét (Blur). Ez segít a sötét vinyl háttéren való olvashatóságban.

### 📐 Elhelyezés (Layout)
*   **Margók (pt):** Az előadó (felső) és cím (alsó) távolsága a kártya szélétől.
*   **Kód Elhelyezés:**
    *   *Pozíció:* Közép (elforgatva 90°-kal) vagy Sarok (vízszintesen).
    *   *Eltolás:* Finomhangolás pt-ban. (Negatív érték befelé, pozitív kifelé mozdít).

### 💿 Vinyl & QR (Backside)
A hátlap dizájnja.
*   **Vinyl (Bakelit):**
    *   Barázdák száma, sűrűsége, vastagsága.
    *   **Glitch:** A "törések" a barázdákban. Beállítható a törések száma és szélessége.
*   **QR Kód:**
    *   Méret: A kártyához viszonyított %-os méret.
    *   Logó: Max 3 karakteres szöveg a QR közepén (pl. "FESZ").
    *   Inverz: Fekete alap, fehér kód (jobban illik a bakelithoz).

---

## 4. Nyomtatás & Nézet

*   **Nézet (Rácsnézet):** Váltás az egyes kártyák előnézete (nagyítható) és a nyomdai ív (fehér hátterű) között.
*   **Nyomtatás:** Generálja a nyomtatási képet.
    *   *Tükrözés:* Zene módban a hátlapok sorrendje automatikusan tükrözve van (jobbról balra), hogy a kétoldalas nyomtatásnál pontosan fedjék egymást az előlapokkal.

## Tippek
*   **Zoom:** Az előnézeti módban kattints egy kártyára a kinagyításhoz.
*   **Zseton gyártás:** Ha kétoldalas zsetont készítesz, használd a Zseton módot. Az 1. oldal tartalmazza az összes előlapot (vágókerettel), a 2. oldal az összes hátlapot (keret nélkül, hogy ne csússzon el a vágás).

---
*CardCraft v1.9.0 (2025)*