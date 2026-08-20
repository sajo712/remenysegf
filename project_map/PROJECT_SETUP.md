Projekt megnevezése: Reménység foglyai weboldal újraírása és headless CMS migrációja
Technológiai stack: Next.js (App Router), React, Sanity CMS, Tailwind CSS (a meglévő színvilág adaptálásával), Node.js (a migrációs szkripthez).

1. A projekt célja és a dizájn irányelvek
A jelenlegi WordPress alapú https://remenysegf.hu/ weboldalt egy modern, gyors és letisztult Next.js + Sanity architektúrára kell átültetni.

Vizuális stílus: A weboldal jelenlegi, eredeti színvilágát (arculati színeit) szigorúan meg kell tartani.

Kezdőlap (Hero szekció): Letisztult, dinamikus "Hero" rész: egy rövid küldetésnyilatkozat, alatta a legújabb lapszám (Issue Card modul) és a legnépszerűbb témakörök (címkék). Az eredeti oldalon lévő hosszú köszöntő szöveg megmarad, de vizuálisan tagoltabban.

Cikkolvasó nézet (UI): A régi, oldalsávos (sidebar) elrendezést el kell hagyni. Helyette egy modern, egyoszlopos, zavartalan olvasási élményt nyújtó nézetet (Medium.com stílus) kell kialakítani.

Szerzők oldala: A szerzőknek nem készül külön dedikált oldal, nevük csak metaadatként jelenik meg a cikkeknél és a kereső/szűrő funkcióban.

2. Sanity CMS Adatstruktúra (Schema)
Az alábbi dokumentumtípusokat (Document Types) kell létrehozni a Sanity Studióban:

author: name (String).

tag: title (String), slug (Slug).

article: title (String), author (Reference -> author), language (String: 'hu' | 'en' - routinghoz), tags (Array of References -> tag), content (PortableText). Nincs közvetlen visszamutató hivatkozás a lapszámra.

issue (Lapszám): title (String), issueNumber (Number), coverImage (Image), youtubeUrl (URL), pdfFile (File), publishedAt (Date), articles (Array of References -> article). Fontos: Az articles tömb biztosítja a cikkek manuális sorrendezhetőségét a szerkesztőben.

standaloneBook (Önálló füzet): title (String), coverImage (Image), content (PortableText), pdfFile (File). Folyóiraton kívüli, angol/magyar kiadványokhoz.

3. Az adatmigrációs és feldolgozó szkript (Node.js)
A meglévő cikkek migrációja nem a WordPress adatbázisból, hanem tiszta .docx fájlokból történik. Készíts egy Node.js szkriptet, amely a következő folyamatot hajtja végre fájlonként:

A dokumentum HTML-lé alakítása (pl. mammoth.js használatával).

Szemantikai tisztítás: Keresse meg azokat a <p> bekezdéseket, amelyek kizárólag egy <strong> vagy <b> taget tartalmaznak (pl. <p><strong>Szöveg</strong></p>), és alakítsa át őket <h2>Szöveg</h2> tagekké.

Cikkek darabolása: A HTML-t a <h1> tagek (Címsor 1) mentén vágja szét különálló cikkekre. (A <h1> a cikk címe).

Szerző kinyerése: A <h1> tag után következő legelső testvér-elemet (next sibling) olvassa ki, ez a szerző neve. Tisztítsa meg a stringet, keresse meg a Sanity author adatbázisban (ha nincs, hozza létre), és mentse el a referenciáját.

Konverzió: A maradék HTML-t alakítsa Sanity Portable Text formátummá (a @sanity/block-tools vagy @portabletext/html-to-portabletext segítségével).

Feltöltés: Hozza létre a cikkeket a Sanity-ben, majd hozza létre a hozzájuk tartozó issue dokumentumot, és fűzze be a cikkeket az articles tömbbe.

4. A "Pro" AI Címkéző (Sanity Studio Custom Input)
A Sanity Studióban a cikkek tags mezőjéhez egy egyedi React beviteli komponenst (Custom Input Component) kell fejleszteni, amely a Gemini API-t használja.

Működés: A komponens tartalmaz egy "AI Címkejavaslatok" gombot. Kattintáskor a kliens összegyűjti az aktuális cikk szövegét és a Sanity-ben létező összes címkét. Ezt elküldi egy egyedi Next.js API végpontnak (/api/suggest-tags).

Next.js API Route: Fogadja a kérést, és meghívja a Gemini API-t (Flash modell). A prompt utasítja az AI-t, hogy adjon vissza 3-5 releváns címkét. A meglévő listából válasszon, de ha szükséges, generáljon teljesen újat.

Visszacsatolás a Studióba: A komponens megjeleníti az AI által javasolt címkéket gombokként. Ha a szerkesztő rákattint egyre, a rendszer azonnal hozzáadja a cikkhez (ha új a címke, a háttérben létre is hozza a tag dokumentumot a Sanity Client API-val).

5. Frontend komponensek és funkciók (Next.js)

Issue Card (Lapszám Modul): Újrahasználható komponens. Tartalmazza: borítókép, dátum, lapszám, a cikkek listája (kattintható linkekkel), letölthető PDF link, és a beágyazott YouTube hangoskönyv lejátszó. Megjelenik a Főoldalon (csak a legújabb) és az Archívumban is.

Archívum oldal: Mivel 50+ lapszám van, szerveroldali (React Server Components) paginációt vagy kliensoldali "Továbbiak betöltése" (Infinite Scroll / Lazy Load) megoldást kell alkalmazni a performancia érdekében.

Tartalmi Kereső: Egy Sanity GROQ alapú intelligens keresőmotor. Képes teljes szöveges keresésre (content), valamint szűrésre: Szerző alapján (legördülő menü), és Év/Lapszám alapján (a szülő issue dokumentum publishedAt mezeje alapján szűrve a cikkeket). Szinkronizáld az URL query paramétereket a szűrési állapottal.