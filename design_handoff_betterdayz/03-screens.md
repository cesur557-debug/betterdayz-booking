# 03 — Screens

Zwei Ansichten auf demselben Datenbestand, umschaltbar über den Pillen-Umschalter in der Topbar. Änderungen wirken sofort in beide Richtungen. Beide Ansichten bleiben gemountet (nur ausgeblendet), damit Login und Schrittstand beim Umschalten erhalten bleiben.

## Topbar (global)

Sticky mit Blur (`rgba(20,22,25,0.85)`, `backdrop-filter: blur(16px)`), Schatten statt Trennlinie. Links Wortmarke (Serif, `letter-spacing: 0.26em`) plus Zusatz „Personal Training" in 11px Versalien. Rechts der Ansicht-Umschalter (Kundenansicht / Trainerdashboard) als Pillengruppe, aktiver Eintrag messing-gefüllt. Safe-Area-Inset oben wird addiert.

---

# Kundenansicht

Fünf Schritte: Zugang, Training, Trainer, Termin, Bestätigen. Stepper sichtbar ab Schritt 2. Nach Login zeigt der Kopf „Willkommen zurück, Vorname", den Kontingent-Chip („7 von 10 Sessions übrig", Mono, Akzent) und die Leisen-Links „Meine Termine" und „Neue Buchung".

## 1 — Zugang

- **Hero**: `--radius-xl`-Fläche mit warmen Lichtkegeln (zwei Radial-Gradients in Messing auf dunklem Verlauf) und feinen vertikalen Lichtstreifen (`repeating-linear-gradient`, 140px Raster, 2% Weiß). Kicker in Messing „Geschlossenes Personal-Training-Studio", Headline `Training nach Maß` (nach Maß kursiv), Unterzeile max. 460px zentriert.
- **Codekarte**: max. 440px, überlappt den Hero um −48px. H2 „Zugang zum *Studio*", Erklärtext, Label + Codefeld (Mono, Placeholder Beispielcode), Primär-CTA „Studio betreten". Fehlerfall siehe 04. Darunter Hinweis auf die Testcodes.
- **Über-Sektion**: Kopfzeile zweispaltig ab 1024px — links Über-Headline zweizeilig, rechts Textblock (max. 576px) mit zwei Absätzen und dem Chamfer-Pfeil-Link „Mit deinem Code starten" (scrollt zum Codefeld und fokussiert es). Darunter das Stat-Grid (1 → 2 → 3 Spalten) mit den drei Schrägschnitt-Karten und dem Fade zum Seitenhintergrund am Sektionsende.

## 2 — Training

Kicker „Trainingsart", H2 „Welches Training passt *heute* zu dir". Grid `minmax(290px, 1fr)` aus Arten-Karten: Name (Serif H3) links, Preis rechts (Mono 18px, Akzent), darunter Beschreibung und Mono-Dauer. Hover hebt die Karte. Vier Arten mit eigener Dauer und eigenem Preis.

## 3 — Trainer

Kicker „Deine Trainer", H2 „Wer soll dich *trainieren*". Nur Trainer, die die gewählte Art anbieten und deren Wochenkontingent noch nicht erreicht ist — ausgebuchte Trainer erscheinen nicht. Karte je Trainer: Monogramm + Name + Herkunft/Erfahrung, Philosophie (2–3 Sätze), Schwerpunkt-Tags, Auslastungsbalken mit ehrlicher Zahl, unten Primär-CTA „Verfügbarkeit ansehen" + Sekundärbutton „Profil" (öffnet Modal). Darunter „Zurück zur Trainingswahl" und „Ohne Präferenz fortfahren, wir schlagen dir Trainer vor".

## 4 — Termin (Kalender)

- Kopfzeile: links Kicker „Terminwahl" + H2, rechts der Trainer-Chip (entfällt ohne Präferenz).
- Tages-Tabs Mo–Sa mit Datum, wischbar. Tageswechsel verwirft Auswahl und offenes Grund-Panel.
- Hinweiszeile „Die Punkte zeigen die belegten Plätze auf der Fläche, vier gibt es je Slot."
- Slot-Grid 07:00–20:00 als Kacheln (Zustände siehe 02/04). Ohne Präferenz zeigt jede freie Kachel den vorgeschlagenen Trainer („Frei · Jonas"), Vorschlag = geringste Auslastung, Nicht-Duo bevorzugt.
- Klick auf gesperrte Kachel öffnet das Grund-Panel unter dem Grid mit Grund und bis zu zwei Alternativen (gleiche Zeit bei anderem Trainer, dann naher Slot beim Wunschtrainer). Alternative übernimmt Tag, Zeit und Trainer direkt in die Auswahl.
- Auswahlkarte (erscheint nach Slot-Wahl): Termin fett, Trainername als leiser Link (öffnet Modal), Mono-Zeile „X von 4 Plätzen auf der Fläche belegt", bei Duo der Hinweis „… betreut zu dieser Zeit bereits einen weiteren Kunden. Ihr trainiert im Duo.", darunter der Block „Auf der Fläche um HH:00" mit Flächen-Chips je aktivem Trainer (mit Kundenzahl, eigener Trainer markiert). Rechts Primär-CTA „Weiter zur Bestätigung".

## 5 — Bestätigen

Zentrierte Karte max. 520px. Kicker „Übersicht", H2 „Bestätige deine *Buchung*". Zeilenpaare Training, Trainer (Link → Modal), Termin (Mono), Dauer, Auf der Fläche, Preis. Duo-Hinweis falls zutreffend, Flächen-Chips, Hinweis „Dein Termin ist mit der Buchung fest eingetragen. Stornieren kannst du bis 24 Stunden vor dem Termin." Buttons „Zurück" + Primär-CTA „Termin verbindlich buchen". Bei aufgebrauchtem Kontingent ersetzt eine Fehlerzeile den CTA.

## Meine Termine

Kicker „Dein Plan", H2 „Deine *Termine*". Terminzeilen mit Mono-Datum/Zeit, Art und Trainer, Statuszeile (Gebucht / Vom Trainer abgesagt / Storniert). Aktive Termine mit Storno-Button, sofern mehr als 24 Stunden Vorlauf, sonst Hinweistext. Leerzustand mit CTA „Erste Session buchen". Unten „Weitere Session buchen".

Meldungen (Absagen durch Trainer) erscheinen als Meldungszeilen über dem Inhalt und lassen sich mit „Verstanden" schließen.

---

# Trainerdashboard

Zielgerät Tablet quer, optimiert ab 1024px, alle Ziele mindestens 44px, keine Hover-Pflicht.

## Profilwahl

Kicker „Trainerbereich", H2 „Wähle dein *Profil*", Grid aus klickbaren Trainerkarten (Monogramm, Name, Herkunft).

## Dashboard-Rahmen

Kopf mit Monogramm, Name (H2), Herkunft, rechts „Profil wechseln" (leise). KPI-Reihe mit vier Karten: Sessions heute, Auslastung Woche (Wert `X/Y` + Balken), Kunden diese Woche, Geplanter Umsatz (Mono, €). Darunter vier Uppercase-Pillen-Tabs: Heute, Wochenraster, Sessions, Verfügbarkeit.

## Heute

Session-Karten des Tages, sortiert nach Uhrzeit, mit Kundennamen, Art, Dauer und den Zielen des Kunden — lesbar im Vorbeigehen. Leerzustand verweist auf das Wochenraster. Ohne Studio-Tag (Sonntag) steht der KPI-Wert auf „—".

## Wochenraster

Matrix Mo–Sa × 07–20 im horizontal scrollenden Container. Zellzustände siehe 02. Legende darunter (Eigene Session, Belegung durch Kollegen, Geblockte Zeit, Freie Kapazität) plus Satz zur Füllhöhe. Tooltip je Zelle mit Belegung und eigenen Kunden.

## Sessions

Kommende eigene Sessions als Zeilen mit Kundenname, Art, Mono-Termin, Preis und Kundenzielen, rechts „Session absagen". Eine Absage gibt den Slot sofort frei, schreibt dem Kunden die Session gut und erzeugt seine Meldung. Leerzustand „Keine kommenden Sessions."

## Verfügbarkeit

Drei Karten untereinander — die wichtigste Funktion des Dashboards, Änderungen wirken sofort auf die Kundenansicht.

1. **Wochenkontingent**: Stepper − / Wert (24px Mono) / + mit Erklärsatz. Beim Erreichen verschwindet der Trainer aus der Kundenauswahl.
2. **Arbeitszeiten**: je Wochentag zwei Selects „von" / „bis", Option „frei" für ganze Tage. „bis" ist ohne Arbeitszeit deaktiviert.
3. **Zeiten blocken**: Block-Grid (siehe 02). Zellen mit eigener Session sind gesperrt, der Erklärtext nennt den Weg (erst Session absagen).
