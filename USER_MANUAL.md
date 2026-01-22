# CardCraft v1.9.1 - Felhasználói Kézikönyv

A CardCraft egy webes alkalmazás egyedi, vinyl-stílusú kártyák és zsetonok tervezésére és nyomtatására.

## 1. Kezelőfelület felépítése

Az alkalmazás bal oldalon egy fix beállításpanelt, jobb oldalon pedig egy élő előnézeti/nyomtatási területet tartalmaz.

### Fő Módok (Sidebar teteje)
*   **Zene Mód (Music):** Adatbázis alapú kártyák (Spotify vagy XLS fájlból). Előadó, Cím, Év, QR kód és egyedi azonosító kódok kezelése.
*   **Zseton Mód (Token):** Egységes design generálása (pl. fesztiválpénz, kupon). Egy oldalra csak előlapokat, a következőre csak hátlapokat generál.

---

## 2. Adatok Kezelése (Csak Zene Mód)

### Adatbetöltés
Kétféleképpen tölthetsz be adatokat:
*   **Spotify Import (Ajánlott):** Kattints a **SPOTIFY** gombra, majd másold be a lejátszási lista vagy album linkjét.
*   **XLS Import:** Kattints az **XLS** gombra egy Excel fájl (.xls, .xlsx) betöltéséhez. A rendszer felismeri az `Artist`, `Title`, `Year`, `QR Data`, `Code1`, `Code2` oszlopokat.

### Évszámok Validálása
A Spotify vagy a feltöltött XLS fájlok esetenként pontatlan megjelenési éveket tartalmazhatnak.
1.  Miután betöltötted az adatokat, megjelenik a **VALIDÁL** gomb.
2.  Kattints rá, hogy az alkalmazás a **MusicBrainz** nyílt adatbázisában ellenőrizze és javítsa az évszámokat.
3.  A folyamat szándékosan lassú, hogy ne terhelje túl az adatbázist. A gomb animációval jelzi a működést.
4.  A végén egy felugró ablak értesít a frissített dalok számáról.

---

## 3. Beállítások (Tabok)

### 🎚️ Méretek (General)
Itt állíthatod be a fizikai méreteket és a vágókeretet.
*   **Papír:** A4 vagy A3.
*   **Kártya méret:** A kártya vágott mérete mm-ben (Standard: 46mm).
*   **Keret:** Szín, vastagság és opacitás.
    *   *Keret Mód:* Beállíthatod, hogy a vágójel csak az előlapon, csak a hátlapon, vagy mindkettőn látszódjon.

### 🅰️ Tipográfia
A betűtípusok és szövegeffektek beállítása.
*   **Betűtípus:** Válassz a listából.
*   **Elemek (Év, Előadó, Cím):**
    *   Méret (pt), Félkövér (Bold).
    *   **Glow:** Bekapcsolásával lenyílik a részletes menü, ahol beállíthatod a ragyogás színét és az elmosás mértékét (Blur).
    *   **Max sorok (Címnél):** Meghatározza, hány sorba tördelje a hosszú címeket, mielőtt csökkentené a betűméretet.

### 📐 Elhelyezés (Layout)
*   **Margók (pt):** Az előadó (felső) és cím (alsó) távolsága a kártya szélétől.
*   **Kód Elhelyezés:**
    *   *Pozíció:* Közép (elforgatva 90°-kal) vagy Sarok (vízszintesen).
    *   *Eltolás:* Finomhangolás pt-ban. (Negatív érték befelé, pozitív kifelé mozdít).

### 💿 Vinyl & QR (Backside)
A hátlap dizájnja.
*   **Vinyl (Bakelit):** Barázdák száma, sűrűsége, vastagsága, és a "glitch" effekt beállításai.
*   **QR Kód:** Méret, logó (max 3 karakter), és stílus (kerek, inverz).

---

## 4. Nyomtatás & Nézet

*   **Nézet (Rácsnézet):** Váltás az egyes kártyák előnézete (nagyítható) és a nyomdai ív között.
*   **Nyomtatás:** Generálja a nyomtatási képet. Zene módban a hátlapok sorrendje automatikusan tükrözve van a pontos kétoldalas nyomtatáshoz.

## Tippek
*   **Zoom:** Az előnézeti módban kattints egy kártyára a kinagyításhoz.
*   **Zseton gyártás:** Ha kétoldalas zsetont készítesz, használd a Zseton módot. Az 1. oldal tartalmazza az összes előlapot (vágókerettel), a 2. oldal az összes hátlapot (keret nélkül, hogy ne csússzon el a vágás).

---
*CardCraft v1.9.1 (2025)*