# 04 — Interaktion, Zustände, Regeln

## Harte Kapazitätsregeln (bestimmen jede Slot-Darstellung)

| Konstante | Wert | Wirkung |
|---|---|---|
| `MAX_KUNDEN_PRO_SLOT` | 4 | Flächenlimit Kunden, ab 4 ist der Slot gesperrt |
| `KNAPP_AB_KUNDEN` | 3 | ab 3 parallelen Buchungen Status „knapp" |
| `MAX_TRAINER_PRO_SLOT` | 2 | dritter Trainer ist im Slot nicht buchbar |
| `DUO_BETREUUNG_ERLAUBT` | true | ein Trainer darf 2 Kunden gleichzeitig betreuen, offen angezeigt |
| `KONTINGENT_IST_OBERGRENZE` | true | erreichtes Wochenkontingent blendet den Trainer aus |
| `PERSOENLICHE_ZUGANGSCODES` | true | Code je Kunde samt Sessionkontingent |
| `STORNO_FRIST_STUNDEN` | 24 | Stornieren nur mit mehr Vorlauf |

Die Regel-Engine ist eine reine Funktion (`pruefeSlot`) ohne React- oder DOM-Bezug und wandert später unverändert auf den Server.

## Slot-Statusmatrix (Prüfreihenfolge)

| Reihenfolge | Grund-Code | Kundentext |
|---|---|---|
| 1 | `vergangen` | Dieser Zeitpunkt liegt bereits hinter uns. |
| 2 | `arbeitszeit` | {Name} arbeitet zu dieser Zeit nicht. |
| 3 | `geblockt` | {Name} hat sich diese Zeit freigehalten. |
| 4 | `kontingent` | {Name} ist diese Woche ausgebucht. |
| 5 | `eigene_buchung` | Du hast zu dieser Zeit bereits einen Termin bei uns. |
| 6 | `flaeche_voll` | Die Fläche ist zu dieser Zeit voll. Es trainieren bereits vier Kunden gleichzeitig. |
| 7 | `trainer_limit` | Auf der Fläche arbeiten zu dieser Zeit bereits zwei Trainer. Mehr lässt der Platz nicht zu. |
| 8 | `trainer_voll` | {Name} betreut zu dieser Zeit schon die maximale Zahl an Kunden. |
| — | `kein_trainer` (ohne Präferenz) | Zu dieser Zeit ist kein passender Trainer verfügbar. |

Besteht keiner der Gründe, ist der Slot „frei" oder „knapp" (ab 3 Kunden), plus Duo-Flag, wenn der Trainer im Slot bereits einen Kunden hat.

## Alternativen bei gesperrten Slots

Immer mindestens ein konkreter Vorschlag, höchstens zwei Buttons:
1. **Anderer Trainer, gleiche Zeit** — erster verfügbarer Trainer derselben Trainingsart („Gleiche Zeit bei Sofia Marques").
2. **Gleicher Trainer, nahe Zeit** — Suche ±1 bis ±3 Stunden am selben Tag, dann gleiche Stunde an den Folgetagen („Deniz am Di um 14:00").

Klick übernimmt Tag, Zeit und Trainer direkt in die Auswahl und schließt das Panel. Ohne Treffer steht dort „Gerade gibt es keine nahe Alternative. Schau bei einem anderen Tag vorbei."

## Buchungs-Lebenszyklus

| Aktion | Auslöser | Wirkung |
|---|---|---|
| Buchen | Kunde, CTA im Checkout | Status `gebucht` sofort fest (keine Trainer-Bestätigung), Kundenkontingent −1, erscheint sofort im Dashboard |
| Stornieren | Kunde, nur bei > 24h Vorlauf | Status `storniert`, Slot sofort frei, Kundenkontingent +1, Trainerauslastung sinkt |
| Absagen | Trainer, Tab Sessions | Status `abgesagt`, Slot frei, Kundenkontingent +1, Meldung an den Kunden |

Meldungstext bei Absage: „{Trainer} hat deinen Termin am {Tag} {Datum} um {Zeit} abgesagt. Der Slot ist wieder frei und die Session deinem Kontingent gutgeschrieben."

## Zustände und Interaktionen (Auszug)

| Element | Zustand | Verhalten |
|---|---|---|
| Codefeld | Fehler | `role="alert"`-Zeile in `--warnung` „Dieser Code ist nicht gültig. Prüfe die Schreibweise oder melde dich im Studio, dort bekommst du deinen persönlichen Zugang." Feld mit `aria-invalid` |
| Codefeld | Erfolg | Begrüßung mit Vornamen + Kontingent-Chip, Sprung zu Schritt 2. Eingabe case-insensitiv, Leerzeichen werden getrimmt |
| Checkout-CTA | Kontingent 0 | CTA ersetzt durch „Dein Sessionkontingent ist aufgebraucht. Melde dich im Studio für ein neues Paket." |
| Termin-Zeile | < 24h Vorlauf | statt Button der Text „Stornierung war bis 24 Stunden vorher möglich" |
| Trainerwahl | Art ohne freie Trainer | Leerzustand „Für {Art} ist diese Woche kein Trainer mehr frei. Nächste Woche öffnen sich neue Zeiten." |
| Flächen-Detail | Slot leer | „Noch niemand. Du hast die Fläche zu dieser Zeit bisher für dich." |
| Kontingent-Stepper | Wert erreicht Sessions | Balken wechselt auf `--warnung`, Trainer verschwindet aus der Kundenauswahl |
| Block-Zelle | eigene Session | deaktiviert, Erklärtext verweist auf „Session absagen" |

## Wochenlogik

Woche = Mo–Sa der laufenden Woche. Sonntags zeigt die App die Folgewoche (kein „Heute" im Dashboard, KPI „—"). Vergangene Slots des Tages sind gesperrt (`vergangen`), die aktuelle Stunde zählt als vergangen. Seed-Daten entstehen deterministisch aus einem festen Seed, damit die Belegung bei jedem Rendern identisch bleibt.
