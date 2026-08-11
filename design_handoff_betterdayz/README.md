# Design-Handoff — BetterDayz Booking

Entwickler-Handoff für die Buchungsplattform eines geschlossenen Personal-Training-Studios (fünf feste Trainer, kleine Fläche, Zugang nur per Code). Quelle ist der lauffähige React-Prototyp `src/App.jsx`.

> **Stand v3 — Mobile App nach der stoic.-Referenz** (Self-Care-Journaling-App, gefunden über Mobbin). Verbindlich für Farben und Typografie ist `tokens.css` in diesem Ordner.
>
> Die sechs Merkmale dieser Designsprache:
> 1. **Monochrom hell.** Hintergrund `#EFF1F2`, Karten reinweiß, Text `#0F1113`. Einziger Farbton ist ein gedämpftes Blau `#A9C4DC` für Belegung und Balken — sonst nur Grauwerte.
> 2. **Kleingeschriebene Headlines mit Punkt.** „deine termine.", „wann passt es dir.", „das studio." — fett, eng gesetzt (`letter-spacing: -0.03em`), immer lowercase.
> 3. **Karten ohne Rand und ohne harten Schatten.** Radius 24px, Schatten nur `0 1px 2px`. Struktur entsteht aus Ton und Abstand.
> 4. **Schwarze Pillen als Aktion.** Primärbutton, gewählter Slot und der zentrale Plus-Knopf sind vollflächig `#0F1113` mit weißer Schrift.
> 5. **App-Shell mit Bottom-Navigation.** Maximal 430px breit, fixierte Tab-Leiste unten mit zentralem runden Plus-Knopf (Kunde: Start, Termine, [+], Trainer, Studio — Trainer: Heute, Woche, Sessions, Zeiten).
> 6. **Wochenleiste mit Häkchen** oben auf Start- und Terminwahl-Screen, aktiver Tag als weiße Kachel, heutiger Tag mit Punkt.
>
> Die Struktur der Dokumente 01 bis 05 (Komponentenaufbau, Screens, Zustände, Regeln, Responsive, A11y) gilt inhaltlich weiter, alle dort genannten Farbwerte und Schriftangaben sind durch `tokens.css` ersetzt.

## Dateien

| Datei | Inhalt |
|---|---|
| `01-design-tokens.md` | Farben, Typografie, Radien, Schatten, Abstände als Token-Tabellen |
| `02-komponenten.md` | Alle Komponenten mit Varianten, Zuständen und Maßen |
| `03-screens.md` | Screen-für-Screen-Spezifikation beider Ansichten |
| `04-interaktion-zustaende.md` | Slot-Statusmatrix, Sperrgründe, Regeln, Textbausteine |
| `05-responsive-a11y-motion.md` | Breakpoints, iOS-Details, Barrierefreiheit, Animationstabelle |
| `tokens.css` | Fertige CSS-Variablen zum direkten Import |

## Die fünf Leitplanken des Designs

1. **Keine 1px-Linien.** Struktur entsteht ausschließlich über Tonflächen, Abstand und weiche Schatten. Kein Element trägt einen Border als Layoutmittel (einzige bewusste Ausnahme ist der abgeschrägte Pfeilbutton in der Über-Sektion).
2. **Aktive Zustände sind voll gefüllt.** Gewählter Tag, gewählter Slot, aktiver Umschalter — immer Messing-Verlauf mit dunkler Schrift `#1c1508`, nie Outline.
3. **Serif mit kursivem Akzentwort.** Jede Überschrift setzt genau ein Wort kursiv („Wann willst du *trainieren*"). Darüber ein Kicker in Versalien mit weiter Laufweite.
4. **Zahlen sind Monospace.** Zeiten, Preise, Kontingente, KPI-Werte — immer JetBrains Mono, damit Spalten sauber stehen.
5. **Kapazität als Punkte.** Vier Punkte je Slot (gefüllt = belegt, rot bei voller Fläche), nie als Zahl im Rähmchen.

## Sprache

Alle Oberflächentexte Deutsch, Du-Form, sachlich, ohne Werbesprache. In Fließtexten keine Doppelpunkte und keine Semikolons. Aktionen sind nach ihrer Wirkung benannt („Termin verbindlich buchen"). Fehlermeldungen nennen den Grund und den nächsten Schritt.

## Schriften

```
https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap
```
