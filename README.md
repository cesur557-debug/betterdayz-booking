# BetterDayz Booking

Buchungsplattform für ein geschlossenes Personal-Training-Studio. Fünf feste Trainer, eine bewusst kleine Fläche, Zugang nur mit persönlichem Code. Zwei Ansichten auf demselben Datenbestand — Kundenansicht (fünf Buchungsschritte) und Trainerdashboard (Tablet quer) — mit sofortiger Wirkung in beide Richtungen.

## Starten

```bash
npm install
npm run dev
```

Die App läuft dann auf http://localhost:5173. Testcodes für die Kundenansicht sind GRANIT-24, ANKER-58 und KOMPASS-11.

## Aufbau

Der gesamte Prototyp lebt in einer Datei, `src/App.jsx`, in klar getrennten Abschnitten. Die Regel-Engine (Flächenlimits, Trainerkalender, Kontingente, Sperrgründe, Alternativen) ist eine reine Funktion ohne React- oder DOM-Bezug und wandert im Produktivbetrieb unverändert auf den Server. Alle Grenzwerte und offenen Entscheidungen (Duo-Betreuung, Kontingent als Obergrenze, persönliche Codes) stehen als benannte Konstanten am Dateianfang. Zustand liegt im Speicher, Seed-Daten entstehen deterministisch aus einem festen Seed.

## Design

Das komplette Design-System ist in [`design_handoff_betterdayz`](design_handoff_betterdayz/README.md) dokumentiert — Tokens, Komponenten, Screens, Zustände, Responsive und Barrierefreiheit. Die CSS-Variablen im Code sind deckungsgleich mit [`tokens.css`](design_handoff_betterdayz/tokens.css) aus dem Handoff.
