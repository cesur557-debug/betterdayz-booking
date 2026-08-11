# 01 — Design-Tokens

Alle Werte sind exakt und in `tokens.css` als CSS-Variablen hinterlegt. In Komponenten immer Tokens referenzieren, keine Rohwerte.

## Farben

| Token | Wert | Verwendung |
|---|---|---|
| `--graphit` | `#141619` | Seitenhintergrund |
| `--flaeche` | `#1d2126` | Karten, Panels, Slot-Kacheln |
| `--flaeche-hell` | `#262b31` | Sekundäre Buttons, Chips, Hover-Stufe |
| `--kreide` | `#ede9e0` | Primärtext |
| `--gedeckt` | `#a6a49c` | Sekundärtext, Labels, inaktive Zustände |
| `--akzent` | `#c99e63` | Messing-Akzent, aktive Elemente |
| `--akzent-hell` | `#dcb277` | Obere Kante des CTA-Verlaufs |
| `--akzent-tief` | `#8f6f41` | Dunkles Ende des Wert-Verlaufs |
| `--akzent-dunkel` | `#322a1e` | Getönte Akzentflächen (Kicker-Pille, Duo-Tag, Meldungen) |
| `--frei` | `#6fbf8f` | Status frei (Text, Grid-Zellen) |
| `--warnung` | `#c98a5e` | Status knapp, volle Auslastungsbalken |
| `--voll` | `#b3595a` | Punkte bei voller Fläche |
| `--cta-text` | `#1c1508` | Schrift auf Messing-Füllungen |

Hintergrund-Glow der Seite: `radial-gradient(1100px 500px at 50% -10%, rgba(201,158,99,0.07), transparent 70%)` auf `--graphit`.

## Verläufe

| Token | Wert | Verwendung |
|---|---|---|
| `--verlauf-cta` | `linear-gradient(180deg, var(--akzent-hell), var(--akzent))` | Primär-CTA, gewählter Tag, gewählter Slot, aktiver Umschalter |
| `--verlauf-wert` | `linear-gradient(294deg, var(--akzent-tief) 20%, var(--akzent-hell))` | Stat-Zahlen der Über-Sektion via `background-clip: text` |
| `--verlauf-karte` | `linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))` | Liegt über `--flaeche` auf allen Karten |
| `--verlauf-eigene` | `linear-gradient(180deg, rgba(201,158,99,0.32), rgba(201,158,99,0.16))` | Eigene Sessions im Wochenraster, aktive Block-Zellen |

## Typografie

| Token | Wert | Verwendung |
|---|---|---|
| `--serif` | `'Fraunces', 'Iowan Old Style', Georgia, serif` | Überschriften, Wortmarke, Monogramme |
| `--grotesk` | `'Inter', 'Helvetica Neue', system-ui, sans-serif` | Fließtext, Buttons, Über-Sektion-Headline |
| `--mono` | `'JetBrains Mono', 'SF Mono', ui-monospace, monospace` | Zeiten, Zahlen, Preise, Codes, Chips |

| Stil | Größe / Gewicht / Besonderheit |
|---|---|
| Hero-Headline | `clamp(38px, 6.5vw, 62px)`, Serif 500, ein Wort kursiv (Italic 400) |
| H2 | 26px (mobil 22px), Serif 500, ein Wort kursiv |
| H3 | 18px, Serif 500 |
| Kicker | 11px, Grotesk 500, Versalien, `letter-spacing: 0.24em`, Farbe `--gedeckt` (im Hero `--akzent`) |
| Fließtext | 15px, Grotesk 400, `line-height: 1.55` |
| Hinweis klein | 13px, `--gedeckt` |
| Button-Label (CTA, Tabs, Umschalter) | 12px, Grotesk 500–600, Versalien, `letter-spacing: 0.12em` |
| Slot-Uhrzeit | 17px Mono |
| KPI-Wert | 27px Mono (mobil 22px) |
| Session-Uhrzeit (Heute-Karte) | 24px Mono, `--akzent` |
| Stat-Wert (Über-Sektion) | 36px / ab 640px 52px, Grotesk 600, Versalien, Verlauf als Textfüllung |
| Über-Headline | 36 / 48 / 54px, Grotesk 600, Versalien, `letter-spacing: -0.02em`, `line-height: 0.95` |
| Wortmarke | 21px Serif 500, `letter-spacing: 0.26em` |

## Radien

| Token | Wert | Verwendung |
|---|---|---|
| `--radius-s` | 12px | Buttons, Eingaben |
| `--radius-m` | 16px | Slot-Kacheln, Grund-Panel, Terminzeilen, Trainer-Chip |
| `--radius-l` | 18px | Karten, KPI, Leerzustände |
| `--radius-xl` | 22px | Hero |
| `--radius-pill` | 999px | CTAs, Chips, Tabs, Umschalter |
| Raster-Zellen | 10px | Wochenraster und Block-Grid |

## Schatten

| Token | Wert | Verwendung |
|---|---|---|
| `--schatten-karte` | `0 18px 44px rgba(0,0,0,0.4)` | Karten |
| `--schatten-kachel` | `0 10px 26px rgba(0,0,0,0.32)` | Slot-Kacheln, Terminzeilen |
| `--schatten-kpi` | `0 12px 30px rgba(0,0,0,0.3)` | KPI, Grund-Panel |
| `--schatten-cta` | `0 4px 14px rgba(201,158,99,0.25)` | Primär-CTA |
| `--schatten-aktiv` | `0 14px 34px rgba(201,158,99,0.35)` | Gewählte Slot-Kachel |
| `--schatten-topbar` | `0 12px 30px rgba(0,0,0,0.35)` | Sticky Topbar |

Gesperrte Slot-Kacheln haben bewusst keinen Schatten, sie liegen visuell im Grund.

## Layout-Grundmaße

| Größe | Wert |
|---|---|
| Inhaltsbreite | `max-width: 1240px`, Padding 24px (mobil 14px) |
| Karten-Padding | 22px |
| Slot-Grid | `repeat(auto-fill, minmax(148px, 1fr))`, Gap 10px (mobil 2 Spalten, Gap 8px) |
| Wochenraster | `56px + 6 × minmax(72px, 1fr)`, Gap 5px, `min-width: 620px` in horizontal scrollendem Container |
| Touch-Ziele | mindestens 44px hoch, Raster-Zellen 46px |
