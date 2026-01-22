# CardCraft v1.9.3 - Felhasználói Kézikönyv

Üdvözlünk a CardCraft alkalmazásban! Ez az útmutató segít megismerni és teljes mértékben kihasználni az alkalmazás funkcióit, amellyel egyedi, vinyl-stílusú kártyákat és zsetonokat tervezhetsz és nyomtathatsz.

## 1. Első Lépések
Az alkalmazás egy belépési képernyővel indul. A folytatáshoz add meg a kapott belépési kódot.

---

## 2. A Kezelőfelület Áttekintése

A felület két fő részre oszlik:
1.  **Beállítások Panel (balra):** Itt található minden vezérlő és beállítási lehetőség.
2.  **Munkaterület (jobbra):** Itt jelenik meg a kártyák élő előnézete vagy a nyomtatásra kész rácsnézet.

### Fő Műveleti Gombok (a panel tetején)
*   **SPOTIFY / XLS:** Adatok betöltése Zene módban.
*   **VALIDÁL:** A betöltött dalok évszámainak ellenőrzése és javítása.
*   **LETÖLTÉS:** Az aktuális (validált) adatlista lementése `.xlsx` fájlba.
*   **NÉZET:** Váltás az interaktív előnézet és a nyomtatási rácsnézet között.
*   **NYOMTAT:** A teljes nyomtatási folyamat indítása.

---

## 3. Üzemmódok

Az alkalmazás két fő üzemmódban használható, amelyeket a panel tetején válthatsz.

### 🎵 Zene Mód
Ez az alapértelmezett mód, amely egyedi zeneszámokból álló kártyák létrehozására szolgál. Minden kártya egyedi adatokat tartalmaz (előadó, cím, év, QR-kód).

#### Adatkezelés Zene Módban

1.  **Adatbetöltés:**
    *   **Spotify Import (Ajánlott):** Kattints a **SPOTIFY** gombra, és másold be a Spotify lejátszási lista vagy album URL-jét. Az alkalmazás automatikusan beolvassa a dalokat.
    *   **XLS Import:** Kattints az **XLS** gombra egy `.xls` vagy `.xlsx` fájl feltöltéséhez. A rendszer intelligensen felismeri a fejléceket, de a javasolt oszlopsorrend: `Artist`, `Title`, `Year`, `QR Data`, `Code1`, `Code2`.

2.  **Évszámok Validálása:**
    *   A Spotify vagy a feltöltött XLS fájlok esetenként pontatlan megjelenési éveket tartalmazhatnak. Adatbetöltés után a **VALIDÁL** gomb aktívvá válik.
    *   **Folyamat:** Kattintásra egy felugró ablak jelenik meg. Az alkalmazás a **MusicBrainz** nyílt zenei adatbázisában, egyenként ellenőrzi a dalokat (előadó és cím alapján), és ha pontosabb évszámot talál, frissíti azt.
    *   **Interaktivitás:** A felugró ablakban egy folyamatjelző sáv és egy számláló mutatja, hol tart a folyamat.
    *   **Megszakítás:** Ha a folyamat túl sokáig tart, a **Megszakítás** gombbal bármikor leállíthatod. Az addig elvégzett frissítések megmaradnak.

3.  **Adatok Letöltése:**
    *   Adatbetöltés után a **LETÖLTÉS** gombra kattintva lementheted az aktuális (akár már validált) adatlistát.
    *   A fájl `cardcraft_data.xlsx` néven töltődik le, rendezett oszlopokkal, ami kiválóan alkalmas archiválásra vagy további feldolgozásra.

### 🪙 Zseton Mód
Ez a mód egységes kinézetű kártyák (zsetonok, kuponok) tömeges generálására szolgál.
*   **Működése:** A beállítások alapján egyetlen előlap- és egy hátlap-dizájnt hoz létre.
*   **Nyomtatás:** A nyomtatási nézetben az első oldalra csak előlapokat, a másodikra pedig csak hátlapokat generál. Ez megkönnyíti a kétoldalas nyomtatást nagy mennyiségben.

---

## 4. Részletes Beállítások (Tabok)

### 🎚️ Méretek (General)
Itt állíthatod be a fizikai méreteket.
*   **Papír:** Válaszd ki a nyomtatáshoz használt papírméretet (A4/A3).
*   **Oldal Padding:** A lap széle és a kártyák közötti margó (mm).
*   **Kártya:** A kártya végső, vágott mérete (mm).
*   **Sarok:** A kártya sarkainak lekerekítése (mm).
*   **Keret:** A vágást segítő keret tulajdonságai.
    *   *Szín, Vastagság, Opacitás:* A keret kinézete.
    *   *Mód:* Válaszd ki, hogy a keret csak az előlapon, csak a hátlapon, mindkettőn, vagy egyiken se jelenjen meg.

### 🅰️ Tipográfia (Typography)
A szövegek kinézetének testreszabása.
*   **Betűtípus:** Globális betűtípus az összes szövegelemhez.
*   **Év / Fő (Token):** Az évszám (Zene mód) vagy a fő szöveg (Zseton mód) beállításai.
*   **Előadó / Al (Token):** Az előadó (Zene mód) vagy az alcím (Zseton mód) beállításai.
*   **Cím (csak Zene mód):** A dalcím beállításai.
*   **Opciók elemenként:**
    *   *Méret (pt), Bold (félkövér).*
    *   *Glow:* Bepipálva egy "ragyogás" effektet ad a szövegnek. A lenyíló menüben állítható a színe és az elmosás mértéke.
    *   *Aa/AA (Text Transform):* Kis- vagy nagybetűs megjelenítés.
    *   *Max sorok (Címnél):* Meghatározza, hány sorba tördelje a hosszú címeket, mielőtt csökkentené a betűméretet.

### 📐 Elhelyezés (Layout)
A szövegelemek pozicionálása Zene módban.
*   **Margók (pt):** Az előadó (felső) és a cím (alsó) távolsága a kártya szélétől.
*   **Kód Elhelyezés:** Az XLS-ből betöltött egyedi kódok (`Code1`, `Code2`) pozíciója.
    *   *Pozíció:* Középen (90 fokban elforgatva) vagy a kártya alsó sarkában.
    *   *Eltolás:* A kódok finomhangolása a kártya széle felé (pozitív érték) vagy belseje felé (negatív érték).

### 💿 Vinyl & QR (Backside)
A kártya hátlapjának dizájnja.
*   **Vinyl (Bakelit) Effekt:**
    *   *Barázdák, Köz, Vastagság, Szín, Opacitás:* A bakelitlemez-illúzió alapbeállításai.
    *   *Neon Mód:* Bepipálva a barázdák véletlenszerű neon színekben fognak ragyogni. A lenyíló menüben állítható a ragyogás erőssége.
    *   *Vastagság variálás:* A barázdák vastagsága kissé eltérő lesz a természetesebb hatásért.
*   **Glitch Effekt:** A barázdákon véletlenszerű "kihagyások" jelennek meg.
    *   *Glitch / kör (db):* Hány kihagyás legyen egy barázdán.
    *   *Szélesség % (tól-ig):* A kihagyások méretének minimum-maximum értéke.
*   **QR Kód (csak Zene mód):**
    *   *QR kód látható:* Ki/be kapcsolja a QR kódot.
    *   *Méret, Keret, Keret Szín, Glow:* A QR kód vizuális beállításai.
    *   *Logó:* Maximum 3 karakteres szöveg, ami a QR kód közepén jelenik meg.
    *   *Kerek, Inverz:* Stílusbeállítások a logó hátteréhez.

---

## 5. Előnézet és Nyomtatás

*   **NÉZET Gomb:** Ezzel tudsz váltani a két nézet között:
    1.  **Előnézet:** Egy kártyapárt (elő- és hátlap) mutat nagy méretben. A kártyára kattintva tovább nagyíthatod. Az előnézet 8 másodpercenként automatikusan a következő dalra vált.
    2.  **Rácsnézet:** A nyomtatásra előkészített teljes íveket mutatja.
*   **NYOMTAT Gomb:**
    1.  Automatikusan átvált Rácsnézetbe.
    2.  Felkészíti az oldalt a nyomtatásra (eltávolít minden felesleges vizuális effektet).
    3.  Megnyitja a böngésző nyomtatási ablakát.
    *   **Fontos:** A kétoldalas nyomtatás pontosságáért az alkalmazás a hátlapok sorrendjét automatikusan tükrözi. Nyomtatáskor válassz kétoldalas (short-edge binding) opciót!

## Tippek
*   **Mentés:** A beállításaidat a böngésző automatikusan elmenti (LocalStorage), így az oldal újratöltésekor nem vesznek el.
*   **Reset:** Ha vissza szeretnél térni az alapbeállításokhoz, használd a fejlécben található visszaállítás ikont.