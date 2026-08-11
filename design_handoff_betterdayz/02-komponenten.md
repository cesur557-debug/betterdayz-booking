# 02 — Komponenten

Jede Komponente mit Varianten, Zuständen und Maßen. Farben und Schatten siehe `01-design-tokens.md`.

## Buttons

| Variante | Aufbau | Zustände |
|---|---|---|
| Primär-CTA | Pille (`--radius-pill`), `--verlauf-cta`, Text `--cta-text` 12px Versalien 600, Padding 12/22, `--schatten-cta` | Hover hellt den Verlauf, Active `scale(0.985)`, Disabled 40% Deckkraft |
| Sekundär | Fläche `--flaeche-hell`, `--radius-s`, Text `--kreide` 15px | Hover `#2e343b` |
| Leise | Transparent, unterstrichen (`text-underline-offset: 3px`), Text `--gedeckt` | Hover Text `--kreide` |

Kein Button trägt einen Border. Fokus immer `outline: 2px solid var(--akzent)` mit `outline-offset: 2px`.

## Eingaben

Textfeld und Select: Fläche `--graphit` (dunkler als die Karte, wirkt eingelassen), `--radius-s`, Mono 16px, `min-height: 48px`, kein Border, Placeholder in `--gedeckt`. 16px Schriftgröße ist Pflicht (verhindert iOS-Auto-Zoom).

## Kicker

Blockelement über Überschriften. 11px Versalien, `letter-spacing: 0.24em`, `--gedeckt`, Abstand 10px zur Headline. Im Hero in `--akzent`.

## Monogramm-Avatar

Kreis mit Serif-Initialen in `--akzent` auf radialem Messing-Glow `radial-gradient(circle at 32% 28%, rgba(201,158,99,0.32), rgba(201,158,99,0.1))`. Größen 54px (Standard), 84px (Modal), 38px (Chip), 30px (Mini). Vorbereitet für echte Porträtfotos als Ersatz.

## Trainer-Chip (Terminwahl-Kopf)

Fläche `--flaeche`, `--radius-m`, Padding 10/18/10/10. Inhalt: Monogramm 38px, Name fett, darunter Mono-Zeile „X von Y Sessions vergeben", rechts Link-Wort „Profil" in `--akzent` unterstrichen. Hover `--flaeche-hell`. Klick öffnet das Trainerprofil-Modal.

## Slot-Kachel (Kalender)

Grid-Kachel `--radius-m`, `min-height: 96px` (mobil 88px), Padding 14/16, Inhalt vertikal: Uhrzeit 17px Mono, Statuszeile 12px, unten vier Platz-Punkte (7px Kreise, Gap 5px).

| Zustand | Fläche | Statustext | Punkte | Schatten |
|---|---|---|---|---|
| Frei | `--verlauf-karte` auf `--flaeche` | „Frei" in `--frei` (ohne Präferenz „Frei · Vorname") | belegt = `--gedeckt` | `--schatten-kachel` |
| Knapp (ab 3 belegt) | wie frei | „Knapp" in `--warnung` | belegt = `--warnung` | `--schatten-kachel` |
| Gesperrt | `rgba(255,255,255,0.016)`, eingelassen | „Nicht buchbar" in `--gedeckt` | bei voller Fläche = `--voll` | keiner |
| Gewählt | `--verlauf-cta`, Text `--cta-text` | dunkel, 75% Deckkraft | dunkel `#1c1508` | `--schatten-aktiv`, `translateY(-2px)` |
| Hover (buchbar) | grüner bzw. amber Schimmer als Verlaufsfläche | — | — | `translateY(-2px)` |

Duo-Tag: Pille oben rechts, 10px Versalien 600, `--akzent-dunkel`/`--akzent`, auf gewählter Kachel dunkel auf Messing. Erscheint, wenn der Trainer im Slot bereits einen Kunden betreut.

`aria-pressed` für die Auswahl, `aria-expanded` auf gesperrten Kacheln, `aria-label` mit Uhrzeit, Status und Belegung.

## Tages-Tabs

Pillen-Kacheln `--radius-m` auf `--flaeche`, zweizeilig (Wochentag + Mono-Datum), horizontal wischbar. Aktiv = `--verlauf-cta` mit dunkler Schrift, Datum in `rgba(28,21,8,0.72)`, Schatten `0 8px 20px rgba(201,158,99,0.28)`.

## Stepper (Buchungsschritte)

Fünf Text-Pillen 11px Versalien. Aktiv `--akzent` auf `--akzent-dunkel`, erledigt `--kreide`, offen `--gedeckt`. Erscheint erst nach dem Login, nicht auf dem Zugangs-Screen.

## Grund-Panel (Sperrgrund)

Volle Breite unter dem Slot-Grid, `--flaeche`, `--radius-m`, Padding 18/20, `--schatten-kpi`. Inhalt: Mono-Uhrzeit fett, Gedankenstrich, Grund in Kundensprache, darunter bis zu zwei Alternativ-Buttons (sekundär). Nur ein Panel gleichzeitig offen.

## Flächen-Chip („Auf der Fläche")

Pille `min-height: 46px`, `rgba(255,255,255,0.05)`, Inhalt Mini-Monogramm 30px + zweizeilig Name (mit Zusatz „· dein Trainer") und „betreut einen Kunden / 2 Kunden". Eigener Trainer auf `--akzent-dunkel`. Klick öffnet das Profil-Modal des jeweiligen Trainers.

## KPI-Karte (Dashboard)

`--radius-l`, Titelzeile 11px Versalien `--gedeckt`, Wert 27px Mono. Die Auslastungs-KPI trägt zusätzlich den Auslastungsbalken.

## Auslastungsbalken

6px Track `rgba(0,0,0,0.45)`, Füllung `linear-gradient(90deg, --akzent-tief, --akzent)`, bei erreichtem Kontingent `--warnung`. Immer mit Mono-Beschriftung „X von Y".

## Session-Karte (Heute)

Karte mit 24px-Mono-Uhrzeit in `--akzent` links (92px Spalte), rechts Kundenname in Serif 19px, Meta-Zeile, darunter die Ziele des Kunden als Volltext. Mobil gestapelt.

## Wochenraster-Zelle

46px hoch, Radius 10px, Grundton `rgba(255,255,255,0.045)`.

| Zustand | Darstellung |
|---|---|
| Außerhalb der Arbeitszeit | Ton auf `rgba(255,255,255,0.012)` abgesenkt |
| Fremdbelegung | Füllstand von unten in `#434a54`, Höhe = Kunden/4, Mono-Zähler „n/4" oben rechts |
| Eigene Session | `--verlauf-eigene`, zentrierte Mono-Initialen in `--akzent-hell` |
| Geblockt | Schraffur `repeating-linear-gradient(45deg, transparent 0 5px, rgba(237,233,224,0.09) 5px 10px)` |
| Heute-Spalte | Overlay `rgba(201,158,99,0.05)` |

## Verfügbarkeits-Grid (Blocken)

Gleiche Geometrie wie das Wochenraster, aber Buttons. Frei = grüner Ton `rgba(111,191,143,0.08)` mit Text `--frei`, Geblockt = `--verlauf-eigene` mit `--akzent-hell`, eigene Session = Messing-Ton (deaktiviert), außerhalb = fast unsichtbar (deaktiviert). `aria-pressed` für den Blockzustand.

## Modal (Trainerprofil)

Hintergrund `rgba(10,11,13,0.6)` mit `backdrop-filter: blur(6px)`. Panel = Karte, `min(560px, 94vw)`, `max-height: 84vh` scrollbar. Kopf mit 84px-Monogramm, Name H2, Meta-Zeile. Abschnitte Schwerpunkte, Zertifikate, Trainingsarten (mit Dauer und Preis), Auslastungsbalken. Schließen über 44px-Kreisbutton oben rechts oder Klick auf den Hintergrund. `role="dialog"` mit `aria-modal`.

## Meldung (Benachrichtigung)

Zeile auf `--akzent-dunkel`, `--radius-m`, links Text, rechts Button „Verstanden". `role="status"`.

## Leerzustand

`--radius-l`, Ton `rgba(255,255,255,0.02)`, zentriert, Text in `--gedeckt`, immer mit Handlungsangebot (Button oder Hinweis auf den nächsten Ort).

## Stat-Karte (Über-Sektion)

Höhe 280px (ab 640px 340px). Äußerer Wrapper `padding: 1.5px` auf `rgba(237,233,224,0.22)` — ergibt den hellen Innenrand. Derselbe Clip-Path liegt auf Wrapper und Innenfläche:

```
Karte 1: polygon(64px 0, calc(100% - 14px) 0, calc(100% - 4px) 4px, 100% 14px, 100% calc(100% - 14px), calc(100% - 4px) calc(100% - 4px), calc(100% - 14px) 100%, 14px 100%, 4px calc(100% - 4px), 0 calc(100% - 14px), 0 64px)
Karte 2: polygon(0 14px, 4px 4px, 14px 0, calc(100% - 64px) 0, 100% 64px, 100% calc(100% - 14px), calc(100% - 4px) calc(100% - 4px), calc(100% - 14px) 100%, 64px 100%, 0 calc(100% - 64px))
Karte 3: polygon(0 14px, 4px 4px, 14px 0, calc(100% - 64px) 0, 100% 64px, 100% calc(100% - 64px), calc(100% - 64px) 100%, 14px 100%, 4px calc(100% - 4px), 0 calc(100% - 14px))
```

Innenfläche `background-size: cover` (aktuell CSS-Verläufe mit Messing-Glow, vorbereitet für Studiofotos). Text-Overlay absolut, `max-width: 66%`, Positionen je Karte: 1 unten links/rechts 24px, 2 links 24px / unten 80px, 3 links 24px / rechts 112px / unten 24px. Wert mit `--verlauf-wert` als Textfüllung. Karte 2 steht ab 1024px um 96px nach unten versetzt.

## Chamfer-Pfeilbutton (Über-Sektion)

32px-Quadrat, 1px Rand `rgba(237,233,224,0.55)` (bewusste Ausnahme der Linienregel), `clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)`, Pfeil ↗ als 14px-SVG. Hover hebt den Button um 2px.
