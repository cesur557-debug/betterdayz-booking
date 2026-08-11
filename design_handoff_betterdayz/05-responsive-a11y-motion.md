# 05 — Responsive, Barrierefreiheit, Motion

## Breakpoints

| Breakpoint | Änderungen |
|---|---|
| Desktop (> 1024px) | Standardlayout. Über-Sektion 3 Spalten mit versetzter Mittelkarte, Kopfzeile zweispaltig. Dashboard-Ziellayout (Tablet quer) |
| 768–1024px | Über-Stats 2 Spalten. Raster weiter im Scroll-Container |
| Mobil (< 760px) | Inhalt-Padding 14px. Slot-Grid fest 2 Spalten (Gap 8px, Kacheln min. 88px). KPI-Reihe 2 Spalten, Werte 22px. Session-Karten gestapelt. Terminwahl-Kopf untereinander. Aktions-Buttons in Zeilen volle Breite. H1 25px, H2 22px |

Wochenraster und Block-Grid behalten `min-width: 620px` und scrollen horizontal im eigenen `.scroll-x`-Container (`-webkit-overflow-scrolling: touch`) — die Seite selbst scrollt nie horizontal. Tages-Tabs sind wischbar.

## iOS und Geräte

- `viewport-fit=cover`, Safe-Area-Insets oben (Topbar) und unten (Body-Padding)
- `theme-color #141619`, `apple-mobile-web-app-capable`, Status-Bar `black-translucent`
- Eingaben 16px Schrift gegen Auto-Zoom, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`
- Alle interaktiven Ziele mindestens 44px (Raster-Zellen 46px)
- `min-height: 100dvh` für die App-Hülle

## Barrierefreiheit

- **Fokus**: sichtbar auf allen Elementen via `:focus-visible` mit `outline: 2px solid var(--akzent)` und 2px Offset — nie unterdrückt
- **Rollen**: Tages-Tabs und Dashboard-Tabs als `tablist`/`tab` mit `aria-selected`. Slot-Grid als `listbox` mit Kachel-`aria-label` (Uhrzeit, Status, Belegung). Modal als `role="dialog"` mit `aria-modal` und Label. Meldungen `role="status"`, Codefehler `role="alert"`. Umschalter als `group` mit `aria-pressed`
- **Zustände**: `aria-pressed` auf Slot-Kacheln und Block-Zellen, `aria-expanded` auf gesperrten Kacheln (Grund-Panel), `aria-invalid` + `aria-describedby` am Codefeld, `aria-haspopup="dialog"` an allen Profil-Triggern
- **Dekoration**: Monogramme, Platz-Punkte und SVG-Pfeile tragen `aria-hidden`, Balken tragen `role="img"` mit Klartext-Label („Auslastung 9 von 18 Sessions")
- **Kontrast**: Kreide auf Graphit ≈ 12:1, gedeckter Text ≈ 6:1, CTA-Dunkeltext auf Messing ≈ 7:1

## Motion

| Element | Auslöser | Animation | Dauer | Easing |
|---|---|---|---|---|
| Schrittwechsel | Schritt erscheint | Einblenden + 8px von unten | 280ms | ease |
| Modal | Öffnen | Einblenden + 14px von unten, Scale 0.98 → 1 | 220ms | ease |
| Buttons, Kacheln, Chips | Hover/Active | Farb-/Transformwechsel, Lift −2px, Active `scale(0.985)` | 180ms | ease |
| Chamfer-Pfeilbutton | Hover auf Link | Lift −2px | 180ms | ease |

`prefers-reduced-motion: reduce` schaltet global alle Animationen und Transitions ab (`* { animation: none; transition: none }`). Mehr Bewegung ist bewusst nicht vorgesehen — ruhige Übergänge statt Effekt-Feuerwerk.

## Offene Punkte für die Umsetzung

1. **Wortmarke** — Prototyp zeigt „GUSSWERK", Produktname ist BetterDayz. Nur die Topbar-Wortmarke und der Über-Text sind betroffen.
2. **Fotografie** — Monogramm-Avatare und die CSS-Hintergründe der Stat-Karten sind als Platzhalter für echte Porträts und Studiofotos gebaut (`background-image`, eine Zeile pro Karte).
3. **Serverseite** — die Regel-Engine (`pruefeSlot`, `bewerteSlotOhnePraeferenz`, `findeAlternativen`) ist eine reine Funktion und muss im Produktivbetrieb serverseitig laufen, damit zwei Kunden nicht denselben letzten Platz buchen.
