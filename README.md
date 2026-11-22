# Expose Designs – redesign webu

Návrh nového webu pro [expose.cz](https://www.expose.cz) (zakázkové lakování helem a racing livery).
Statický web: `index.html` + `css/style.css` + `js/`, bez buildu. three.js je přibalené v `js/vendor` (MIT licence).

**Živá verze:** https://davidsvitil.github.io/Detailing/ (GitHub Pages z větve `gh-pages`).

Lokálně spouštěj přes server (`python3 -m http.server`), ne dvojklikem – 3D modul se přes `file://` nenačte a zobrazí se 2D záloha.

## Proč by měl přivést víc zákazníků

| Problém na současném webu | Řešení v redesignu |
|---|---|
| Tlačítka „Chci originální design“ a „Začít spolupráci“ **nikam nevedou**, odkaz „Kontakt“ vede na `#`. Návštěvník nemá jak poptat. | Poptávkový formulář (výběr služby, styl, nápad, kontakt) + CTA v hlavičce, v hero, u každé služby a lepicí tlačítko na mobilu. |
| Chybí přehled služeb – vypadá to, že se dělají jen helmy. | Sekce Služby: helmy, livery pro tým, kapotáže & nádrže, jen grafický návrh, rámy kol. |
| Galerie nemá žádný text ani filtry. | Filtrovatelná galerie (Helmy / Motorky / V dílně) s lightboxem. |
| Žádná informace o ceně ani FAQ – lidi odchází s nejistotou. | Blok „Kolik to stojí“ (co ovlivňuje cenu) + FAQ. |
| Generická šablona, malý nadpis, málo vidět samotná práce. | Výrazná typografie, velké fotky, příběhy projektů, proces krok za krokem. |
| Nevyužitý potenciál dárků (projekt Eliška). | Blok „Helma jako dárek“. |
| Slabé SEO (title v angličtině, žádný popis). | Český title, meta description, Open Graph, strukturovaná data. |

## Interaktivní prvky

- **Konfigurátor helmy** (`js/configurator.js` + `js/helmet3d.js`): realistická 3D helma (three.js, fyzikální materiály – lesk s čirým lakem, mat, metalíza, duhové iridium plexi), otáčení tažením. Bez WebGL se zobrazí 2D SVG verze. Ovládání – základní barva, barva motivu, 8 motivů, finiš (lesk/mat/metalíza), plexi, číslo. Tlačítko „Překvap mě“, sdílení odkazem (návrh je uložený v URL) a „Poslat tento návrh“ vloží náhled i parametry do poptávky.
- **Proces krok za krokem**: sticky fotka, která se mění podle scrollu.
- **Posuvník výroby**: přetažením se prolínají fáze skořepina → maskování → barva → hotovo.
- **Hero**: nadpis se skládá po písmenech, fotka se 3D naklání za myší.
- Magnetická tlačítka, vlastní kurzor (jen myš), ukazatel scrollu, marquee reaguje na směr a rychlost scrollu, swipe v lightboxu.
- Vše respektuje `prefers-reduced-motion` a funguje i na dotykových zařízeních.

## TODO pro majitele před spuštěním

1. **E-mail pro poptávky** – v `js/main.js` nastavit `CONTACT_EMAIL` (teď placeholder `info@expose.cz`).
   Lepší je napojit formulář na Formspree / Netlify Forms / vlastní backend (mailto vyžaduje poštovního klienta).
2. **Orientační ceny** – v sekci „Kolik to stojí“ doplnit např. „Helma od X Kč“ (místo je označené komentářem v HTML). Výrazně to zvyšuje počet poptávek.
3. **Recenze** – doplnit skutečné recenze zákazníků (Google / Instagram). Žádné nejsou vymyšlené, proto sekce zatím chybí.
4. **FAQ** – zkontrolovat odpovědi, hlavně téma vlastní helmy, homologace a záruky výrobce.
5. **Kontakt/lokalita** – doplnit město, telefon a stránku Ochrana osobních údajů (odkaz v patičce je zatím `#`).
6. **Anglická verze** – odkaz „EN“ zatím vede na současný anglický web.

Fotky v `assets/img` pochází ze současného webu expose.cz (zmenšené a převedené do WebP).
