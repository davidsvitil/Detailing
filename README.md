# Expose Designs – redesign webu

Návrh nového webu pro [expose.cz](https://www.expose.cz) (zakázkové lakování helem a racing livery).
Statický web: `index.html` + `css/style.css` + `js/main.js`, bez frameworku, bez buildu. Stačí otevřít `index.html`.

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

## TODO pro majitele před spuštěním

1. **E-mail pro poptávky** – v `js/main.js` nastavit `CONTACT_EMAIL` (teď placeholder `info@expose.cz`).
   Lepší je napojit formulář na Formspree / Netlify Forms / vlastní backend (mailto vyžaduje poštovního klienta).
2. **Orientační ceny** – v sekci „Kolik to stojí“ doplnit např. „Helma od X Kč“ (místo je označené komentářem v HTML). Výrazně to zvyšuje počet poptávek.
3. **Recenze** – doplnit skutečné recenze zákazníků (Google / Instagram). Žádné nejsou vymyšlené, proto sekce zatím chybí.
4. **FAQ** – zkontrolovat odpovědi, hlavně téma vlastní helmy, homologace a záruky výrobce.
5. **Kontakt/lokalita** – doplnit město, telefon a stránku Ochrana osobních údajů (odkaz v patičce je zatím `#`).
6. **Anglická verze** – odkaz „EN“ zatím vede na současný anglický web.

Fotky v `assets/img` pochází ze současného webu expose.cz (zmenšené a převedené do WebP).
