import { useMemo, useState } from 'react'

/* ============================================================================
   BETTERDAYZ — Buchungsplattform für ein geschlossenes Personal-Training-Studio

   Designsprache nach der MotionSite-Referenz: helle Fläche #F0F5F7, Petrol
   #154359 als Tinte, Cyan-Verlauf #185B7B zu #4BBDF0 als Akzent, TT Firs Neue
   mit Inter-Fallback für Versal-Headlines, Schrägschnitt-Kanten als Signatur.

   Aufbau der Datei
   1. Konstanten und offene Entscheidungen
   2. Stammdaten (Trainingsarten, Trainer, Kunden)
   3. Regel-Engine (rein, kennt weder React noch DOM)
   4. Seed-Daten (deterministisch aus einem Seed)
   5. Hilfsfunktionen für Darstellung
   6. CSS
   7. React-Komponenten (Kundenansicht, Trainerdashboard)
   ========================================================================== */

/* ----------------------------------------------------------------------------
   1. KONSTANTEN
   Harte Kapazitätsregeln als benannte Grenzwerte.
---------------------------------------------------------------------------- */

const MAX_KUNDEN_PRO_SLOT = 4 // Flächenlimit Kunden
const KNAPP_AB_KUNDEN = 3 // ab so vielen parallelen Buchungen gilt ein Slot als knapp
const MAX_TRAINER_PRO_SLOT = 2 // Flächenlimit Trainer

/* Offene Entscheidungen — jeweils als eine Zeile umstellbar.

   Duo oder Einzel. true bedeutet, ein Trainer darf zwei Kunden gleichzeitig
   betreuen und der Kunde sieht das vor der Buchung. false begrenzt jeden
   Trainer auf einen Kunden pro Slot. */
const DUO_BETREUUNG_ERLAUBT = true
const MAX_KUNDEN_PRO_TRAINER_IM_SLOT = DUO_BETREUUNG_ERLAUBT ? 2 : 1

/* Wochenkontingent. true bedeutet, das Kontingent ist eine Obergrenze und
   sperrt den Trainer bei Erreichen. false wäre eine Untergrenze mit aktiver
   Auslastungszuweisung, die hier noch nicht umgesetzt ist. */
const KONTINGENT_IST_OBERGRENZE = true

/* Zugangscode. true bedeutet, jeder Kunde hat einen persönlichen Code samt
   Sessionkontingent. false wäre ein gemeinsamer Studiocode ohne Zuordnung. */
const PERSOENLICHE_ZUGANGSCODES = true
const GEMEINSAMER_STUDIOCODE = 'BETTERDAYZ-STUDIO'

const STORNO_FRIST_STUNDEN = 24
const TAG_START = 7 // erste buchbare Stunde
const TAG_ENDE = 21 // Ende des Rasters, letzter Slotbeginn ist 20 Uhr
const WOCHEN_TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const STUNDEN = Array.from({ length: TAG_ENDE - TAG_START }, (_, i) => TAG_START + i)

/* ----------------------------------------------------------------------------
   2. STAMMDATEN
---------------------------------------------------------------------------- */

const TRAININGSARTEN = [
  { id: 'boxing', name: 'Boxing', dauer: 60, preis: 95, beschreibung: 'Technik, Pratzenarbeit, Kondition' },
  { id: 'hit', name: 'HIT Training', dauer: 45, preis: 78, beschreibung: 'Hochintensive Intervalle, kurze Pausen' },
  { id: 'pump-ok', name: 'Pumping Oberkörper', dauer: 60, preis: 85, beschreibung: 'Brust, Rücken, Schulter, Arme' },
  { id: 'pump-uk', name: 'Pumping Unterkörper', dauer: 60, preis: 88, beschreibung: 'Beine, Gesäß, Rumpfstabilität' },
]

/* Arbeitszeiten je Wochentag Mo bis Sa. null bedeutet freier Tag. */
const TRAINER_START = [
  {
    id: 'deniz',
    name: 'Deniz Aydın',
    monogramm: 'DA',
    herkunft: 'Wettkampfboxen',
    philosophie:
      'Boxen ist Handwerk. Ich bringe dir saubere Technik bei, bevor wir über Härte reden. Wer die Grundlagen beherrscht, wird von allein schneller und ruhiger.',
    schwerpunkte: ['Schlagtechnik', 'Pratzenarbeit', 'Wettkampfvorbereitung'],
    arten: ['boxing', 'hit'],
    erfahrung: 14,
    zertifikate: ['Trainer B Leistungssport Boxen', 'Erste Hilfe im Sport'],
    kontingent: 18,
    arbeitszeiten: [{ von: 12, bis: 20 }, { von: 12, bis: 20 }, { von: 12, bis: 20 }, { von: 12, bis: 20 }, { von: 12, bis: 20 }, { von: 9, bis: 14 }],
    blocks: [],
  },
  {
    id: 'miriam',
    name: 'Miriam Stein',
    monogramm: 'MS',
    herkunft: 'Rehabilitation nach Verletzungen',
    philosophie:
      'Nach einer Verletzung entscheidet nicht der Ehrgeiz, sondern der Aufbau. Ich steigere Belastung so, dass dein Körper mitkommt. Schmerzfrei trainieren ist das Ziel, nicht die Ausnahme.',
    schwerpunkte: ['Aufbautraining', 'Gelenkstabilität', 'Rückenkraft'],
    arten: ['pump-ok', 'pump-uk'],
    erfahrung: 11,
    zertifikate: ['Physiotherapeutin', 'Medizinische Trainingstherapie'],
    kontingent: 14,
    arbeitszeiten: [{ von: 8, bis: 16 }, { von: 8, bis: 16 }, { von: 8, bis: 16 }, { von: 8, bis: 16 }, { von: 8, bis: 16 }, null],
    blocks: ['4-8', '4-9'],
  },
  {
    id: 'torben',
    name: 'Torben Vogt',
    monogramm: 'TV',
    herkunft: 'Kraftdreikampf',
    philosophie:
      'Kniebeuge, Bankdrücken, Kreuzheben. Drei Übungen erzählen alles, was man über deinen Körper wissen muss. Ich mache dich stark, der Rest kommt von allein.',
    schwerpunkte: ['Maximalkraft', 'Langhanteltechnik', 'Trainingsplanung'],
    arten: ['pump-ok', 'pump-uk'],
    erfahrung: 16,
    zertifikate: ['Trainer A Kraftdreikampf', 'Lizenz Gewichtheben'],
    kontingent: 16,
    arbeitszeiten: [{ von: 10, bis: 20 }, { von: 10, bis: 20 }, { von: 10, bis: 20 }, { von: 10, bis: 20 }, { von: 10, bis: 20 }, { von: 10, bis: 15 }],
    blocks: [],
  },
  {
    id: 'sofia',
    name: 'Sofia Marques',
    monogramm: 'SM',
    herkunft: 'Ausdauer und Kondition',
    philosophie:
      'Kondition ist die Währung, mit der du jedes andere Training bezahlst. Ich arbeite mit klaren Intervallen und ehrlichen Pausen. Du lernst, dein Tempo zu kennen und zu halten.',
    schwerpunkte: ['Intervalltraining', 'Grundlagenausdauer', 'Atemtechnik'],
    arten: ['hit', 'boxing'],
    erfahrung: 9,
    zertifikate: ['Sportwissenschaft M. Sc.', 'Lauftrainerin'],
    kontingent: 6,
    arbeitszeiten: [{ von: 7, bis: 15 }, { von: 7, bis: 15 }, { von: 7, bis: 15 }, { von: 7, bis: 15 }, { von: 7, bis: 15 }, { von: 7, bis: 12 }],
    blocks: [],
  },
  {
    id: 'jonas',
    name: 'Jonas Keller',
    monogramm: 'JK',
    herkunft: 'Athletikbetreuung',
    philosophie:
      'Ich betreue dich so, wie ein guter Mechaniker eine gute Maschine pflegt. Wir testen, wir messen, wir verbessern gezielt. Sprungkraft, Schnelligkeit und Stabilität sind kein Zufall.',
    schwerpunkte: ['Explosivkraft', 'Beweglichkeit', 'Leistungsdiagnostik'],
    arten: ['hit', 'pump-uk'],
    erfahrung: 12,
    zertifikate: ['Athletiktrainer', 'CSCS'],
    kontingent: 15,
    arbeitszeiten: [{ von: 9, bis: 18 }, { von: 9, bis: 18 }, { von: 9, bis: 18 }, { von: 9, bis: 18 }, { von: 9, bis: 18 }, null],
    blocks: [],
  },
]

/* Kunden mit Code können sich anmelden. Kunden ohne Code sind Bestandskunden,
   die nur in den Seed-Buchungen auftauchen. */
const KUNDEN_START = [
  { id: 'k1', code: 'GRANIT-24', name: 'Selin Kaya', paket: 10, verbleibend: 7, ziele: 'Kraftaufbau nach Schulter-OP, rechte Seite langsam steigern' },
  { id: 'k2', code: 'ANKER-58', name: 'Robert Weiler', paket: 20, verbleibend: 9, ziele: 'Vorbereitung auf einen Amateur-Boxkampf im Oktober, Fokus Beinarbeit' },
  { id: 'k3', code: 'KOMPASS-11', name: 'Mara Lindqvist', paket: 8, verbleibend: 6, ziele: 'Wieder in Form nach der Elternzeit, Rücken stabilisieren' },
  { id: 'k4', code: null, name: 'Jan Hoffmann', paket: 10, verbleibend: 4, ziele: 'Sprungkraft für Volleyball verbessern, Knie stabil halten' },
  { id: 'k5', code: null, name: 'Aylin Demir', paket: 20, verbleibend: 12, ziele: 'Erster Wettkampf im Kickboxen, Schlagkraft und Deckung' },
  { id: 'k6', code: null, name: 'Katrin Sost', paket: 10, verbleibend: 6, ziele: 'Haltung verbessern, Nacken entlasten, Kraft im Oberkörper' },
  { id: 'k7', code: null, name: 'Pavel Novak', paket: 10, verbleibend: 5, ziele: 'Kreuzheben sauber aufbauen, unterer Rücken braucht Aufmerksamkeit' },
  { id: 'k8', code: null, name: 'Lena Wirth', paket: 20, verbleibend: 14, ziele: 'Nach der Kreuzband-Reha zurück zum alten Niveau' },
]

/* ============================================================================
   3. REGEL-ENGINE
   Dieser Abschnitt ist rein. Er kennt weder React noch DOM und lässt sich
   unverändert in eine Postgres-Funktion oder einen API-Endpunkt heben.
   Eingaben sind einfache Objekte, Ausgaben sind einfache Objekte.

   Ein Trainer-Objekt braucht: id, arten, kontingent, arbeitszeiten, blocks.
   Eine Buchung braucht: kundeId, trainerId, tag, stunde, status.
   Aktiv zählen Buchungen mit Status gebucht.
   jetztTag unter 0 bedeutet, es gibt keinen Vergangenheitscheck.
   ========================================================================== */

function slotSchluessel(tag, stunde) {
  return tag + '-' + stunde
}

function istAktiveBuchung(b) {
  return b.status === 'gebucht'
}

function buchungenImSlot(buchungen, tag, stunde) {
  return buchungen.filter((b) => istAktiveBuchung(b) && b.tag === tag && b.stunde === stunde)
}

function wochenSessions(buchungen, trainerId) {
  return buchungen.filter((b) => istAktiveBuchung(b) && b.trainerId === trainerId).length
}

function istVergangen(tag, stunde, jetztTag, jetztStunde) {
  if (jetztTag < 0) return false
  return tag < jetztTag || (tag === jetztTag && stunde <= jetztStunde)
}

/* Bewertet einen Slot für einen konkreten Trainer.
   Ergebnis: { status: frei | knapp | gesperrt, grund, duo, kunden }
   grund ist ein Code, die Übersetzung in Kundensprache passiert in der UI. */
function pruefeSlot({ trainer, tag, stunde, buchungen, kundeId = null, jetztTag = -1, jetztStunde = 0 }) {
  const slot = buchungenImSlot(buchungen, tag, stunde)
  const kunden = slot.length

  if (istVergangen(tag, stunde, jetztTag, jetztStunde)) {
    return { status: 'gesperrt', grund: 'vergangen', duo: false, kunden }
  }

  const az = trainer.arbeitszeiten[tag]
  if (!az || stunde < az.von || stunde >= az.bis) {
    return { status: 'gesperrt', grund: 'arbeitszeit', duo: false, kunden }
  }

  if (trainer.blocks.includes(slotSchluessel(tag, stunde))) {
    return { status: 'gesperrt', grund: 'geblockt', duo: false, kunden }
  }

  if (KONTINGENT_IST_OBERGRENZE && wochenSessions(buchungen, trainer.id) >= trainer.kontingent) {
    return { status: 'gesperrt', grund: 'kontingent', duo: false, kunden }
  }

  if (kundeId && slot.some((b) => b.kundeId === kundeId)) {
    return { status: 'gesperrt', grund: 'eigene_buchung', duo: false, kunden }
  }

  if (kunden >= MAX_KUNDEN_PRO_SLOT) {
    return { status: 'gesperrt', grund: 'flaeche_voll', duo: false, kunden }
  }

  const trainerIds = [...new Set(slot.map((b) => b.trainerId))]
  const eigeneImSlot = slot.filter((b) => b.trainerId === trainer.id).length

  if (!trainerIds.includes(trainer.id) && trainerIds.length >= MAX_TRAINER_PRO_SLOT) {
    return { status: 'gesperrt', grund: 'trainer_limit', duo: false, kunden }
  }

  if (eigeneImSlot >= MAX_KUNDEN_PRO_TRAINER_IM_SLOT) {
    return { status: 'gesperrt', grund: 'trainer_voll', duo: false, kunden }
  }

  return {
    status: kunden >= KNAPP_AB_KUNDEN ? 'knapp' : 'frei',
    grund: null,
    duo: eigeneImSlot > 0,
    kunden,
  }
}

/* Trainer, die eine Trainingsart anbieten und diese Woche noch buchbar sind. */
function buchbareTrainer({ trainerListe, artId, buchungen }) {
  return trainerListe.filter((t) => {
    if (!t.arten.includes(artId)) return false
    if (KONTINGENT_IST_OBERGRENZE && wochenSessions(buchungen, t.id) >= t.kontingent) return false
    return true
  })
}

/* Bewertet einen Slot ohne Trainerpräferenz und schlägt den passendsten
   verfügbaren Trainer vor. Bevorzugt wird, wer noch keinen Kunden im Slot hat
   und die geringste Wochenauslastung mitbringt. */
function bewerteSlotOhnePraeferenz({ trainerListe, artId, tag, stunde, buchungen, kundeId = null, jetztTag = -1, jetztStunde = 0 }) {
  const slot = buchungenImSlot(buchungen, tag, stunde)
  const kandidaten = trainerListe.filter((t) => t.arten.includes(artId))
  const verfuegbar = []
  for (const t of kandidaten) {
    const p = pruefeSlot({ trainer: t, tag, stunde, buchungen, kundeId, jetztTag, jetztStunde })
    if (p.status === 'frei' || p.status === 'knapp') {
      verfuegbar.push({ trainerId: t.id, pruefung: p, auslastung: wochenSessions(buchungen, t.id) / Math.max(1, t.kontingent) })
    }
  }
  verfuegbar.sort((a, b) => (a.pruefung.duo ? 1 : 0) - (b.pruefung.duo ? 1 : 0) || a.auslastung - b.auslastung)

  if (verfuegbar.length > 0) {
    const beste = verfuegbar[0]
    return { status: beste.pruefung.status, grund: null, duo: beste.pruefung.duo, kunden: slot.length, trainerId: beste.trainerId }
  }

  let grund = 'kein_trainer'
  if (istVergangen(tag, stunde, jetztTag, jetztStunde)) grund = 'vergangen'
  else if (slot.length >= MAX_KUNDEN_PRO_SLOT) grund = 'flaeche_voll'
  else if (kundeId && slot.some((b) => b.kundeId === kundeId)) grund = 'eigene_buchung'
  return { status: 'gesperrt', grund, duo: false, kunden: slot.length, trainerId: null }
}

/* Sucht konkrete Alternativen zu einem gesperrten Wunsch.
   Erst ein anderer Trainer im selben Slot, dann derselbe Trainer in einem
   nahen Slot. Liefert höchstens zwei Vorschläge. */
function findeAlternativen({ trainerListe, buchungen, artId, tag, stunde, kundeId = null, wunschTrainerId = null, jetztTag = -1, jetztStunde = 0 }) {
  const alternativen = []

  for (const t of trainerListe) {
    if (t.id === wunschTrainerId) continue
    if (!t.arten.includes(artId)) continue
    const p = pruefeSlot({ trainer: t, tag, stunde, buchungen, kundeId, jetztTag, jetztStunde })
    if (p.status === 'frei' || p.status === 'knapp') {
      alternativen.push({ typ: 'trainer', trainerId: t.id, tag, stunde, duo: p.duo })
      break
    }
  }

  const wunsch = trainerListe.find((t) => t.id === wunschTrainerId)
  if (wunsch) {
    const versuche = []
    for (const delta of [1, -1, 2, -2, 3, -3]) {
      const s = stunde + delta
      if (s >= TAG_START && s < TAG_ENDE) versuche.push({ tag, stunde: s })
    }
    for (const dTag of [1, 2, 3]) {
      if (tag + dTag <= 5) versuche.push({ tag: tag + dTag, stunde })
    }
    for (const v of versuche) {
      const p = pruefeSlot({ trainer: wunsch, tag: v.tag, stunde: v.stunde, buchungen, kundeId, jetztTag, jetztStunde })
      if (p.status === 'frei' || p.status === 'knapp') {
        alternativen.push({ typ: 'zeit', trainerId: wunsch.id, tag: v.tag, stunde: v.stunde, duo: p.duo })
        break
      }
    }
  }

  return alternativen.slice(0, 2)
}

/* ----------------------------------------------------------------------------
   4. SEED-DATEN
   Deterministisch aus einem festen Seed, damit sich die Belegung beim
   Neurendern nicht verändert.
---------------------------------------------------------------------------- */

function mulberry32(seed) {
  let a = seed
  return function () {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function berechneWoche(jetzt) {
  const wochentag = jetzt.getDay() // 0 ist Sonntag
  const montag = new Date(jetzt)
  if (wochentag === 0) montag.setDate(jetzt.getDate() + 1)
  else montag.setDate(jetzt.getDate() - (wochentag - 1))
  montag.setHours(0, 0, 0, 0)
  const tage = WOCHEN_TAGE.map((label, i) => {
    const d = new Date(montag)
    d.setDate(montag.getDate() + i)
    return {
      index: i,
      label,
      datum: d,
      datumLabel: String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.',
    }
  })
  const heuteIndex = wochentag === 0 ? -1 : wochentag - 1
  return {
    montag,
    tage,
    heuteIndex,
    jetztTag: heuteIndex,
    jetztStunde: heuteIndex === -1 ? 0 : jetzt.getHours(),
  }
}

function artPreis(artId) {
  return TRAININGSARTEN.find((a) => a.id === artId).preis
}

function erzeugeSeedBuchungen(trainerListe, woche) {
  const rng = mulberry32(20260810)
  const buchungen = []
  let laufnummer = 0
  const add = (trainerId, kundeId, artId, tag, stunde) => {
    laufnummer += 1
    buchungen.push({ id: 'seed' + laufnummer, trainerId, kundeId, artId, tag, stunde, status: 'gebucht', preis: artPreis(artId) })
  }

  const demoTag = woche.heuteIndex < 0 ? 1 : Math.min(woche.heuteIndex + 1, 5)

  // Szenario volle Fläche um 13 Uhr, vier Kunden bei zwei Trainern
  add('deniz', 'k4', 'boxing', demoTag, 13)
  add('deniz', 'k5', 'hit', demoTag, 13)
  add('torben', 'k6', 'pump-ok', demoTag, 13)
  add('torben', 'k7', 'pump-uk', demoTag, 13)

  // Szenario zwei Trainer auf der Fläche um 11 Uhr, Fläche nicht voll
  add('torben', 'k8', 'pump-uk', demoTag, 11)
  add('sofia', 'k4', 'hit', demoTag, 11)

  // Restliche Belegung zufällig, aber regelkonform über die Engine geprüft
  const seedKunden = ['k4', 'k5', 'k6', 'k7', 'k8']
  const fuelle = (trainerId, ziel) => {
    const t = trainerListe.find((x) => x.id === trainerId)
    let versuche = 0
    while (wochenSessions(buchungen, trainerId) < ziel && versuche < 400) {
      versuche += 1
      const tag = Math.floor(rng() * 6)
      const stunde = TAG_START + Math.floor(rng() * (TAG_ENDE - TAG_START))
      const kundeId = seedKunden[Math.floor(rng() * seedKunden.length)]
      const artId = t.arten[Math.floor(rng() * t.arten.length)]
      const p = pruefeSlot({ trainer: t, tag, stunde, buchungen, kundeId })
      if (p.status === 'frei' && !p.duo) add(trainerId, kundeId, artId, tag, stunde)
    }
  }
  fuelle('deniz', 7)
  fuelle('miriam', 6)
  fuelle('torben', 8)
  fuelle('jonas', 5)
  fuelle('sofia', 6) // Sofia erreicht damit ihr Kontingent und verschwindet aus der Auswahl

  // Buchungen in der Zukunft, unter anderem für die Anmeldung mit GRANIT-24
  const fuegeZukunft = (trainerId, kundeId, artId) => {
    const t = trainerListe.find((x) => x.id === trainerId)
    for (let tag = 0; tag < 6; tag += 1) {
      for (let stunde = TAG_START; stunde < TAG_ENDE; stunde += 1) {
        const p = pruefeSlot({ trainer: t, tag, stunde, buchungen, kundeId, jetztTag: woche.jetztTag, jetztStunde: woche.jetztStunde })
        if (p.status === 'frei' && !p.duo) {
          add(trainerId, kundeId, artId, tag, stunde)
          return
        }
      }
    }
  }
  fuegeZukunft('miriam', 'k1', 'pump-ok')
  fuegeZukunft('deniz', 'k6', 'boxing')
  fuegeZukunft('deniz', 'k7', 'hit')

  return buchungen
}

function erzeugeStartdaten() {
  const jetzt = new Date()
  const woche = berechneWoche(jetzt)
  const trainerListe = TRAINER_START.map((t) => ({ ...t, blocks: [...t.blocks], arbeitszeiten: t.arbeitszeiten.map((a) => (a ? { ...a } : null)) }))
  const kunden = KUNDEN_START.map((k) => ({ ...k }))
  const buchungen = erzeugeSeedBuchungen(trainerListe, woche)
  return { jetzt, woche, trainerListe, kunden, buchungen }
}

/* ----------------------------------------------------------------------------
   5. DARSTELLUNGS-HELFER
---------------------------------------------------------------------------- */

function stundeLabel(stunde) {
  return String(stunde).padStart(2, '0') + ':00'
}

function euro(betrag) {
  return betrag + ' €'
}

function slotDatum(woche, tag, stunde) {
  const d = new Date(woche.montag)
  d.setDate(woche.montag.getDate() + tag)
  d.setHours(stunde, 0, 0, 0)
  return d
}

function istStornierbar(woche, jetzt, buchung) {
  const start = slotDatum(woche, buchung.tag, buchung.stunde)
  return start.getTime() - jetzt.getTime() > STORNO_FRIST_STUNDEN * 3600 * 1000
}

/* Übersetzt Sperrgründe der Engine in Kundensprache. */
function grundText(grund, trainerName) {
  const name = trainerName || 'Der Trainer'
  switch (grund) {
    case 'vergangen':
      return 'Dieser Zeitpunkt liegt bereits hinter uns.'
    case 'arbeitszeit':
      return name + ' arbeitet zu dieser Zeit nicht.'
    case 'geblockt':
      return name + ' hat sich diese Zeit freigehalten.'
    case 'kontingent':
      return name + ' ist diese Woche ausgebucht.'
    case 'eigene_buchung':
      return 'Du hast zu dieser Zeit bereits einen Termin bei uns.'
    case 'flaeche_voll':
      return 'Die Fläche ist zu dieser Zeit voll. Es trainieren bereits vier Kunden gleichzeitig.'
    case 'trainer_limit':
      return 'Auf der Fläche arbeiten zu dieser Zeit bereits zwei Trainer. Mehr lässt der Platz nicht zu.'
    case 'trainer_voll':
      return name + ' betreut zu dieser Zeit schon die maximale Zahl an Kunden.'
    case 'kein_trainer':
      return 'Zu dieser Zeit ist kein passender Trainer verfügbar.'
    default:
      return 'Dieser Slot ist nicht buchbar.'
  }
}

const STATUS_LABEL = {
  gebucht: 'Gebucht',
  abgesagt: 'Vom Trainer abgesagt',
  storniert: 'Storniert',
}

/* ----------------------------------------------------------------------------
   6. CSS
   Design-Tokens nach der MotionSite-Referenz, deckungsgleich mit
   design_handoff_betterdayz/tokens.css
---------------------------------------------------------------------------- */

const CSS = `
:root {
  --grund: #F0F5F7;
  --flaeche: #FFFFFF;
  --flaeche-hell: #E4EBEF;
  --tinte: #154359;
  --gedeckt: #5D7A8A;
  --petrol: #185B7B;
  --cyan: #4BBDF0;
  --cta: #154359;
  --cta-hover: #1B5B7A;
  --cta-text: #FFFFFF;
  --frei: #2F8F5B;
  --frei-dunkel: rgba(47, 143, 91, 0.09);
  --warnung: #B36A24;
  --warnung-dunkel: rgba(179, 106, 36, 0.1);
  --voll: #C05252;
  --verlauf-wert: linear-gradient(294deg, #185B7B 20%, #4BBDF0);
  --verlauf-balken: linear-gradient(90deg, #185B7B, #4BBDF0);
  --verlauf-eigene: linear-gradient(180deg, rgba(24, 91, 123, 0.2), rgba(75, 189, 240, 0.16));
  --glow-seite: radial-gradient(1100px 500px at 50% -10%, rgba(75, 189, 240, 0.14), transparent 70%);
  --cyan-ton: rgba(75, 189, 240, 0.14);
  --grotesk: 'TT Firs Neue', 'Inter', 'Helvetica Neue', system-ui, sans-serif;
  --mono: 'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace;
  --radius-s: 10px;
  --radius-m: 12px;
  --radius-l: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;
  --radius-zelle: 8px;
  --linie: rgba(21, 67, 89, 0.14);
  --schatten-karte: 0 12px 32px rgba(21, 67, 89, 0.1);
  --schatten-kachel: 0 8px 22px rgba(21, 67, 89, 0.08);
  --schatten-kpi: 0 10px 26px rgba(21, 67, 89, 0.09);
  --schatten-aktiv: 0 14px 30px rgba(21, 67, 89, 0.28);
  --schatten-topbar: 0 8px 24px rgba(21, 67, 89, 0.08);
  --zelle-grund: rgba(21, 67, 89, 0.05);
  --zelle-ausserhalb: rgba(21, 67, 89, 0.015);
  --zelle-fremd: #AFC6D1;
  --zelle-heute: rgba(75, 189, 240, 0.1);
  --schraffur-block: repeating-linear-gradient(45deg, transparent 0 5px, rgba(21, 67, 89, 0.1) 5px 10px);
  --stat-rand: rgba(255, 255, 255, 0.8);
  --chamfer-knopf: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--grund);
  background-image: var(--glow-seite);
  background-repeat: no-repeat;
  color: var(--tinte);
  font-family: var(--grotesk);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  padding-bottom: env(safe-area-inset-bottom);
}
h1, h2 {
  font-family: var(--grotesk);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.98;
  margin: 0 0 10px;
}
h1 { font-size: 34px; }
h2 { font-size: 27px; }
h3 { font-family: var(--grotesk); font-weight: 600; font-size: 17px; letter-spacing: -0.01em; margin: 0 0 8px; }
h1 em, h2 em, h3 em { font-style: normal; }
.kicker {
  display: block;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--gedeckt);
  margin-bottom: 10px;
}
p { margin: 0 0 10px; }
.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.gedeckt { color: var(--gedeckt); }
button {
  font-family: var(--grotesk);
  font-size: 15px;
  color: var(--tinte);
  background: var(--flaeche-hell);
  border: none;
  border-radius: var(--radius-s);
  padding: 10px 16px;
  min-height: 44px;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}
button:hover { background: #D7E1E7; }
button:active { transform: scale(0.985); }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {
  outline: 2px solid var(--petrol);
  outline-offset: 2px;
}
button:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.knopf-primaer {
  background: var(--cta);
  color: var(--cta-text);
  clip-path: var(--chamfer-knopf);
  border-radius: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 13px 24px;
}
.knopf-primaer:hover { background: var(--cta-hover); }
.knopf-leise { background: transparent; color: var(--gedeckt); text-decoration: underline; text-underline-offset: 3px; }
.knopf-leise:hover { color: var(--tinte); background: transparent; }
input[type="text"], select {
  font-family: var(--mono);
  font-size: 16px;
  color: var(--tinte);
  background: var(--flaeche);
  border: 1px solid var(--linie);
  border-radius: var(--radius-s);
  padding: 12px 14px;
  min-height: 48px;
}
input::placeholder { color: var(--gedeckt); }
.app {
  min-height: 100vh; min-height: 100dvh;
  display: flex; flex-direction: column;
  width: 100%; max-width: 430px; margin: 0 auto;
  background: var(--grund);
  position: relative;
}
@media (min-width: 480px) {
  body { background: #E3EBEF; }
  .app { box-shadow: 0 0 60px rgba(21, 67, 89, 0.14); }
}
.tabbar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; z-index: 60;
  display: flex; gap: 4px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 -8px 24px rgba(21, 67, 89, 0.1);
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
}
.tabbar button {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: transparent; border-radius: var(--radius-m); padding: 6px 4px; min-height: 52px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gedeckt);
}
.tabbar button:hover { background: var(--flaeche-hell); }
.tabbar button[aria-selected="true"] { color: var(--petrol); background: var(--cyan-ton); }
.tabbar svg { width: 22px; height: 22px; }
.topbar {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 16px;
  padding-top: calc(10px + env(safe-area-inset-top));
  background: rgba(240, 245, 247, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--schatten-topbar);
}
.marke { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.marke-name { font-weight: 700; font-size: 16px; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
.marke-zusatz { display: none; }
.ansicht-schalter { display: flex; gap: 3px; background: var(--flaeche); border-radius: var(--radius-pill); padding: 3px; box-shadow: var(--schatten-topbar); flex: none; }
.ansicht-schalter button {
  background: transparent; min-height: 34px; padding: 5px 12px; border-radius: var(--radius-pill);
  color: var(--gedeckt); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
}
.ansicht-schalter button[aria-pressed="true"] { background: var(--cta); color: var(--cta-text); }
.inhalt { flex: 1; width: 100%; padding: 16px; padding-bottom: calc(100px + env(safe-area-inset-bottom)); }
.karte {
  background: var(--flaeche);
  border-radius: var(--radius-l);
  padding: 22px;
  box-shadow: var(--schatten-karte);
}
.schritt-einblendung { animation: einblenden 0.28s ease; }
@keyframes einblenden { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  border-radius: var(--radius-pill); padding: 7px 16px;
  font-family: var(--mono); font-size: 13px; color: var(--gedeckt);
  background: var(--flaeche-hell);
}
.chip-akzent { background: var(--cyan-ton); color: var(--petrol); }
.stepper { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 24px; padding: 0; list-style: none; }
.stepper li {
  font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--gedeckt); padding: 7px 14px; border-radius: var(--radius-pill);
}
.stepper li[aria-current="step"] { color: var(--petrol); background: var(--cyan-ton); }
.stepper li.erledigt { color: var(--tinte); }
.meldung {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  background: var(--cyan-ton);
  border-radius: var(--radius-m); padding: 14px 18px; margin-bottom: 16px;
}
.hero {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  padding: 48px 20px 68px;
  text-align: center;
  background:
    radial-gradient(520px 300px at 24% 0%, rgba(75, 189, 240, 0.22), transparent 70%),
    radial-gradient(640px 340px at 78% 8%, rgba(24, 91, 123, 0.1), transparent 70%),
    linear-gradient(180deg, #FFFFFF, #E7EFF3);
  box-shadow: var(--schatten-karte);
}
.hero::after {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0 140px, rgba(21, 67, 89, 0.02) 140px 141px);
  pointer-events: none;
}
.hero .kicker { color: var(--petrol); margin-bottom: 14px; }
.hero h1 { font-size: clamp(32px, 9vw, 40px); margin-bottom: 12px; }
.hero .unterzeile { color: var(--gedeckt); max-width: 300px; margin: 0 auto; font-size: 15px; }
.hero-karte { margin: -36px 4px 0; position: relative; z-index: 2; }
.ueber { position: relative; padding: 8px 0 48px; }
.ueber-kopfzeile { display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 40px; }
.ueber-heading {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.95;
  font-size: 36px;
  margin: 0;
}
.ueber-textblock { display: flex; flex-direction: column; max-width: 576px; }
.ueber-textblock p { font-size: 17px; line-height: 1.5; color: var(--tinte); }
.ueber-link {
  display: inline-flex; align-items: center; gap: 16px; margin-top: 24px;
  font-size: 14px; font-weight: 500; color: var(--tinte);
  background: transparent; border: none; padding: 0; min-height: 0; border-radius: 0;
  cursor: pointer;
}
.ueber-link:hover { background: transparent; }
.ueber-link-knopf {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border: 1px solid var(--tinte);
  clip-path: var(--chamfer-knopf);
  transition: transform 0.18s ease;
}
.ueber-link:hover .ueber-link-knopf { transform: translateY(-2px); }
.ueber-grid { margin-top: 56px; display: grid; grid-template-columns: 1fr; gap: 20px; }
.stat-karte { position: relative; width: 100%; height: 280px; padding: 1.5px; background: var(--stat-rand); }
.stat-karte-innen { position: relative; width: 100%; height: 100%; overflow: hidden; background-size: cover; background-position: center; }
.stat-text-lage { position: absolute; max-width: 66%; }
.stat-wert {
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1;
  font-size: 36px;
  letter-spacing: -0.01em;
  background: var(--verlauf-wert);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.stat-text { margin: 12px 0 0; font-size: 14px; line-height: 1.4; color: var(--tinte); }
.ueber-fade {
  pointer-events: none; position: absolute; left: 0; right: 0; bottom: 0; height: 160px; z-index: 10;
  background: linear-gradient(to bottom, rgba(240, 245, 247, 0) 0%, rgba(240, 245, 247, 0.7) 60%, var(--grund) 100%);
}
@media (min-width: 640px) {
  .ueber-heading { font-size: 48px; }
  .ueber-textblock p { font-size: 18px; }
  .stat-karte { height: 340px; }
  .stat-wert { font-size: 52px; }
  .ueber-fade { height: 224px; }
}
@media (min-width: 768px) {
  .ueber-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .ueber-kopfzeile { flex-direction: row; gap: 80px; }
  .ueber-heading { font-size: 54px; }
  .ueber-grid { grid-template-columns: repeat(3, 1fr); }
  .stat-versatz { margin-top: 96px; }
}
.raster { display: grid; gap: 16px; }
.raster-2 { grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); }
.arten-karte { text-align: left; display: flex; flex-direction: column; gap: 6px; padding: 22px; }
.arten-karte:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(21, 67, 89, 0.14); background: var(--flaeche); }
.arten-karte .zeile { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.arten-karte .preis { font-family: var(--mono); font-size: 18px; color: var(--petrol); }
.trainer-karte { display: flex; flex-direction: column; gap: 12px; }
.trainer-karte-klickbar:hover { transform: translateY(-2px); }
.trainer-kopf { display: flex; align-items: center; gap: 14px; }
.monogramm {
  width: 54px; height: 54px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 19px; color: var(--petrol);
  background: radial-gradient(circle at 32% 28%, rgba(75, 189, 240, 0.32), rgba(75, 189, 240, 0.1));
}
.monogramm-gross { width: 84px; height: 84px; font-size: 29px; }
.monogramm-klein { width: 38px; height: 38px; font-size: 14px; }
.monogramm-mini { width: 30px; height: 30px; font-size: 12px; }
.flaechen-detail { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.flaechen-titel { font-size: 12px; letter-spacing: 0.07em; text-transform: uppercase; color: var(--gedeckt); margin-top: 14px; }
.flaechen-chip {
  display: inline-flex; align-items: center; gap: 10px; text-align: left;
  padding: 6px 16px 6px 8px; border-radius: var(--radius-pill); min-height: 46px;
  background: var(--flaeche-hell);
}
.flaechen-chip:hover { background: #D7E1E7; }
.flaechen-chip .wer { line-height: 1.3; display: flex; flex-direction: column; }
.flaechen-chip .wer strong { font-weight: 600; }
.flaechen-eigener { background: var(--cyan-ton); }
.flaechen-eigener:hover { background: rgba(75, 189, 240, 0.24); }
.tag-liste { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-liste span { font-size: 12px; border-radius: var(--radius-zelle); padding: 5px 11px; color: var(--petrol); background: var(--cyan-ton); }
.balken { height: 6px; background: rgba(21, 67, 89, 0.12); border-radius: 3px; overflow: hidden; }
.balken > div { height: 100%; background: var(--verlauf-balken); }
.balken-voll > div { background: var(--warnung); }
.tage-tabs { display: flex; gap: 8px; margin-bottom: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; padding: 4px 0 8px; }
.tage-tabs button { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 10px 18px; line-height: 1.3; flex: none; border-radius: var(--radius-m); background: var(--flaeche); box-shadow: var(--schatten-kachel); }
.tage-tabs button:hover { background: var(--flaeche-hell); }
.tage-tabs .datum { font-family: var(--mono); font-size: 12px; color: var(--gedeckt); }
.tage-tabs button[aria-selected="true"] { background: var(--cta); color: var(--cta-text); font-weight: 600; box-shadow: var(--schatten-aktiv); }
.tage-tabs button[aria-selected="true"] .datum { color: rgba(255, 255, 255, 0.72); }
.termin-kopf { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.trainer-chip {
  display: flex; align-items: center; gap: 12px; text-align: left;
  padding: 10px 18px 10px 10px; border-radius: var(--radius-l); background: var(--flaeche);
  box-shadow: var(--schatten-kachel);
}
.trainer-chip:hover { background: var(--flaeche); box-shadow: var(--schatten-karte); }
.trainer-chip .chip-text { display: flex; flex-direction: column; line-height: 1.35; }
.trainer-chip .profil-link { color: var(--petrol); font-size: 13px; text-decoration: underline; text-underline-offset: 3px; }
.slot-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.slot-kachel {
  position: relative;
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
  padding: 14px 16px; min-height: 96px;
  border-radius: var(--radius-m); text-align: left;
  background: var(--flaeche);
  box-shadow: var(--schatten-kachel);
}
.slot-kachel .zeit { font-family: var(--mono); font-size: 17px; letter-spacing: 0.02em; }
.slot-kachel .slot-status { font-size: 12px; color: var(--gedeckt); }
.slot-kachel[data-status="frei"] .slot-status { color: var(--frei); }
.slot-kachel[data-status="frei"]:hover { transform: translateY(-2px); background: linear-gradient(180deg, var(--frei-dunkel), rgba(47, 143, 91, 0.02)), var(--flaeche); }
.slot-kachel[data-status="knapp"] .slot-status { color: var(--warnung); }
.slot-kachel[data-status="knapp"]:hover { transform: translateY(-2px); background: linear-gradient(180deg, var(--warnung-dunkel), rgba(179, 106, 36, 0.02)), var(--flaeche); }
.slot-kachel[data-status="gesperrt"] {
  background: rgba(21, 67, 89, 0.04);
  box-shadow: none;
  color: var(--gedeckt);
}
.slot-kachel[data-status="gesperrt"] .zeit { color: var(--gedeckt); }
.slot-kachel[data-status="gesperrt"]:hover { background: rgba(21, 67, 89, 0.07); }
.slot-kachel[aria-pressed="true"] {
  background: var(--cta);
  color: var(--cta-text);
  box-shadow: var(--schatten-aktiv);
  transform: translateY(-2px);
}
.slot-kachel[aria-pressed="true"] .zeit { color: var(--cta-text); }
.slot-kachel[aria-pressed="true"] .slot-status { color: rgba(255, 255, 255, 0.78); }
.slot-kachel[aria-pressed="true"] .plaetze i { background: rgba(255, 255, 255, 0.3); }
.slot-kachel[aria-pressed="true"] .plaetze i.belegt { background: var(--cta-text); }
.plaetze { display: flex; gap: 5px; margin-top: auto; }
.plaetze i {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(21, 67, 89, 0.14);
}
.plaetze i.belegt { background: #8FA6B2; }
.slot-kachel[data-status="knapp"] .plaetze i.belegt { background: var(--warnung); }
.slot-kachel[data-status="gesperrt"][data-voll="true"] .plaetze i.belegt { background: var(--voll); }
.duo-tag {
  position: absolute; top: 12px; right: 12px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 3px 8px; border-radius: var(--radius-pill);
  background: var(--cyan-ton); color: var(--petrol);
}
.slot-kachel[aria-pressed="true"] .duo-tag { background: rgba(255, 255, 255, 0.22); color: var(--cta-text); }
.slot-grund {
  border-radius: var(--radius-l);
  padding: 18px 20px; margin-top: 14px; font-size: 14px;
  background: var(--flaeche);
  box-shadow: var(--schatten-kpi);
}
.slot-grund .alternativen { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.duo-hinweis { font-size: 13px; color: var(--petrol); }
.termin-zeile {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  border-radius: var(--radius-l); padding: 16px 20px; flex-wrap: wrap;
  background: var(--flaeche);
  box-shadow: var(--schatten-kachel);
}
.leer {
  border-radius: var(--radius-l);
  padding: 36px; text-align: center; color: var(--gedeckt);
  background: rgba(21, 67, 89, 0.04);
}
.kpi-reihe { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
.kpi { background: var(--flaeche); border-radius: var(--radius-l); padding: 16px 20px; box-shadow: var(--schatten-kpi); }
.kpi .wert { font-family: var(--mono); font-size: 27px; margin: 4px 0; color: var(--petrol); }
.kpi .titel { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gedeckt); }
.dash-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.dash-tabs button { font-size: 12px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; border-radius: var(--radius-pill); padding: 10px 18px; background: var(--flaeche); box-shadow: var(--schatten-kachel); color: var(--gedeckt); }
.dash-tabs button[aria-selected="true"] { background: var(--cta); color: var(--cta-text); }
.session-karte { display: flex; gap: 18px; align-items: flex-start; padding: 18px 20px; }
.session-karte .zeit { font-family: var(--mono); font-size: 24px; color: var(--petrol); flex: none; width: 92px; }
.session-karte .name { font-weight: 600; font-size: 19px; }
.scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.wgrid { display: grid; grid-template-columns: 56px repeat(6, minmax(72px, 1fr)); gap: 5px; min-width: 620px; }
.wgrid .kopf { font-family: var(--mono); font-size: 12px; color: var(--gedeckt); text-align: center; padding: 6px 0; }
.stunde-label { font-family: var(--mono); font-size: 12px; color: var(--gedeckt); display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; }
.wzelle { position: relative; min-height: 46px; border-radius: var(--radius-zelle); background: var(--zelle-grund); overflow: hidden; }
.wzelle-ausserhalb { background: var(--zelle-ausserhalb); }
.wzelle-heute::after { content: ''; position: absolute; inset: 0; background: var(--zelle-heute); pointer-events: none; }
.wzelle .fuellung { position: absolute; left: 0; right: 0; bottom: 0; background: var(--zelle-fremd); }
.wzelle .eigene {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 4px;
  background: var(--verlauf-eigene);
  font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--petrol);
}
.wzelle .block-schraffur {
  position: absolute; inset: 0;
  background: var(--schraffur-block);
}
.wzelle .zahl { position: absolute; right: 5px; top: 3px; font-family: var(--mono); font-size: 11px; color: var(--gedeckt); }
.legende { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 16px; font-size: 13px; color: var(--gedeckt); }
.legende span { display: inline-flex; align-items: center; gap: 7px; }
.legende i { width: 14px; height: 14px; border-radius: 5px; background: var(--zelle-grund); display: inline-block; }
.anfrage-zeile { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 20px; flex-wrap: wrap; }
.anfrage-zeile .aktionen { display: flex; gap: 10px; }
.verf-grid { display: grid; grid-template-columns: 56px repeat(6, minmax(64px, 1fr)); gap: 5px; min-width: 620px; }
.verf-grid button { min-height: 46px; border-radius: var(--radius-zelle); font-family: var(--mono); font-size: 11px; padding: 2px; background: var(--zelle-grund); }
.verf-grid button:disabled { background: var(--zelle-ausserhalb); opacity: 1; color: var(--gedeckt); }
.verf-grid .zellen-frei { color: var(--frei); background: rgba(47, 143, 91, 0.1); }
.verf-grid .zellen-frei:hover { background: rgba(47, 143, 91, 0.18); }
.verf-grid .block-an { background: var(--verlauf-eigene); color: var(--petrol); font-weight: 600; }
.verf-grid .session { color: var(--petrol); background: var(--cyan-ton); }
.verf-zeiten { display: flex; flex-direction: column; gap: 10px; }
.verf-tag { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.verf-tag .tag-name { width: 36px; font-family: var(--mono); }
.kontingent-stepper { display: flex; align-items: center; gap: 14px; }
.kontingent-stepper .wert { font-family: var(--mono); font-size: 24px; min-width: 44px; text-align: center; color: var(--petrol); }
.profil-wahl { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.abschnitt { margin-bottom: 28px; }
.hinweis-klein { font-size: 13px; color: var(--gedeckt); }
.fehler { color: #B04A4A; }
.modal-hintergrund {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(21, 67, 89, 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: einblenden 0.2s ease;
}
.modal {
  width: min(560px, 94vw); max-height: 84vh; overflow-y: auto;
  position: relative;
  animation: modalauf 0.22s ease;
}
@keyframes modalauf { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: none; } }
.modal-kopf { display: flex; align-items: center; gap: 18px; margin-bottom: 14px; padding-right: 44px; }
.modal-schliessen {
  position: absolute; top: 14px; right: 14px;
  width: 44px; height: 44px; padding: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 17px;
}
@media (max-width: 760px) {
  .inhalt { padding: 14px; }
  h1 { font-size: 27px; }
  h2 { font-size: 23px; }
  .topbar { padding-left: 14px; padding-right: 14px; }
  .kpi-reihe { grid-template-columns: repeat(2, 1fr); }
  .kpi .wert { font-size: 22px; }
  .slot-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .slot-kachel { min-height: 88px; padding: 12px 14px; }
  .session-karte { flex-direction: column; gap: 8px; }
  .session-karte .zeit { width: auto; }
  .termin-kopf { flex-direction: column; align-items: stretch; }
  .anfrage-zeile .aktionen { width: 100%; }
  .anfrage-zeile .aktionen button { flex: 1; }
}
`

/* ----------------------------------------------------------------------------
   7. REACT-KOMPONENTEN
---------------------------------------------------------------------------- */

function Auslastungsbalken({ wert, maximum }) {
  const anteil = maximum > 0 ? Math.min(1, wert / maximum) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="hinweis-klein">Auslastung diese Woche</span>
        <span className="mono hinweis-klein">
          {wert} von {maximum}
        </span>
      </div>
      <div className={'balken' + (anteil >= 1 ? ' balken-voll' : '')} role="img" aria-label={`Auslastung ${wert} von ${maximum} Sessions`}>
        <div style={{ width: anteil * 100 + '%' }} />
      </div>
    </div>
  )
}

/* „Über das Studio" nach der MotionSite-Referenz. Die drei Karten nutzen
   Clip-Path-Polygone mit abgeschrägten Ecken, die mittlere Karte steht auf
   großen Bildschirmen versetzt. Hintergründe sind CSS-Flächen und lassen sich
   später gegen echte Studiofotos tauschen. */
const STUDIO_FAKTEN = [
  {
    wert: '5 Trainer',
    text: 'aus Wettkampfboxen, Reha, Kraftdreikampf, Ausdauer und Athletik betreuen dich persönlich',
    clip: 'polygon(64px 0, calc(100% - 14px) 0, calc(100% - 4px) 4px, 100% 14px, 100% calc(100% - 14px), calc(100% - 4px) calc(100% - 4px), calc(100% - 14px) 100%, 14px 100%, 4px calc(100% - 4px), 0 calc(100% - 14px), 0 64px)',
    hintergrund: 'radial-gradient(420px 320px at 20% 15%, rgba(75, 189, 240, 0.35), transparent 70%), linear-gradient(160deg, #DCE7ED, #C7D6DE)',
    lage: { left: 24, right: 24, bottom: 24 },
    versatz: false,
  },
  {
    wert: '4 Plätze',
    text: 'mehr Kunden trainieren nie gleichzeitig auf der Fläche, dafür steht das Studio',
    clip: 'polygon(0 14px, 4px 4px, 14px 0, calc(100% - 64px) 0, 100% 64px, 100% calc(100% - 14px), calc(100% - 4px) calc(100% - 4px), calc(100% - 14px) 100%, 64px 100%, 0 calc(100% - 64px))',
    hintergrund: 'radial-gradient(420px 320px at 85% 20%, rgba(24, 91, 123, 0.22), transparent 70%), linear-gradient(200deg, #E3EDF2, #CBD9E0)',
    lage: { left: 24, bottom: 80 },
    versatz: true,
  },
  {
    wert: '62+ Jahre',
    text: 'gebündelte Trainingserfahrung stehen hinter jedem Termin bei uns',
    clip: 'polygon(0 14px, 4px 4px, 14px 0, calc(100% - 64px) 0, 100% 64px, 100% calc(100% - 64px), calc(100% - 64px) 100%, 14px 100%, 4px calc(100% - 4px), 0 calc(100% - 14px))',
    hintergrund: 'radial-gradient(460px 340px at 70% 85%, rgba(75, 189, 240, 0.3), transparent 70%), linear-gradient(180deg, #D8E4EA, #C2D2DA)',
    lage: { left: 24, right: 112, bottom: 24 },
    versatz: false,
  },
]

function UeberStudio({ aktionLabel = 'Mit deinem Code starten', onAktion = null }) {
  const zumCode = () => {
    const feld = document.getElementById('zugangscode')
    if (feld) {
      feld.scrollIntoView({ behavior: 'smooth', block: 'center' })
      feld.focus({ preventScroll: true })
    }
  }
  return (
    <section id="ueber" className="ueber" aria-label="Über das Studio">
      <div className="ueber-kopfzeile">
        <h2 className="ueber-heading">
          Über
          <br />
          das Studio
        </h2>
        <div className="ueber-textblock">
          <p>BetterDayz ist ein geschlossenes Personal-Training-Studio mit fünf festen Trainern und einer bewusst kleinen Fläche.</p>
          <p style={{ marginTop: 16 }}>
            Wenige Menschen gleichzeitig, volle Aufmerksamkeit und Termine, die wirklich dir gehören. Dafür ist hier jeder Ablauf gebaut.
          </p>
          <button className="ueber-link" onClick={onAktion || zumCode}>
            <span>{aktionLabel}</span>
            <span className="ueber-link-knopf" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </span>
          </button>
        </div>
      </div>
      <div className="ueber-grid">
        {STUDIO_FAKTEN.map((fakt) => (
          <div key={fakt.wert} className={'stat-karte' + (fakt.versatz ? ' stat-versatz' : '')} style={{ clipPath: fakt.clip }}>
            <div className="stat-karte-innen" style={{ clipPath: fakt.clip, backgroundImage: fakt.hintergrund }}>
              <div className="stat-text-lage" style={fakt.lage}>
                <div className="stat-wert">{fakt.wert}</div>
                <p className="stat-text">{fakt.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="ueber-fade" />
    </section>
  )
}

/* Zeigt für einen Slot, welche Trainer auf der Fläche stehen und wie viele
   Kunden jeder gerade betreut. Ein Tipp auf einen Trainer öffnet sein Profil. */
function FlaechenBelegung({ buchungen, trainerListe, tag, stunde, eigenerTrainerId, onProfil }) {
  const slot = buchungenImSlot(buchungen, tag, stunde)
  const proTrainer = trainerListe
    .map((t) => ({ t, anzahl: slot.filter((b) => b.trainerId === t.id).length }))
    .filter((x) => x.anzahl > 0)
  return (
    <div>
      <div className="flaechen-titel">Auf der Fläche um {stundeLabel(stunde)}</div>
      {proTrainer.length === 0 ? (
        <p className="hinweis-klein" style={{ marginTop: 6 }}>
          Noch niemand. Du hast die Fläche zu dieser Zeit bisher für dich.
        </p>
      ) : (
        <div className="flaechen-detail">
          {proTrainer.map(({ t, anzahl }) => (
            <button
              key={t.id}
              className={'flaechen-chip' + (t.id === eigenerTrainerId ? ' flaechen-eigener' : '')}
              onClick={() => onProfil(t.id)}
              aria-haspopup="dialog"
            >
              <span className="monogramm monogramm-mini" aria-hidden="true">
                {t.monogramm}
              </span>
              <span className="wer">
                <strong>
                  {t.name}
                  {t.id === eigenerTrainerId ? ' · dein Trainer' : ''}
                </strong>
                <span className="hinweis-klein">betreut {anzahl === 1 ? 'einen Kunden' : anzahl + ' Kunden'}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* Popup mit dem vollständigen Trainerprofil. Schließt über den Knopf oder
   einen Tipp auf den Hintergrund. */
function TrainerModal({ trainer, buchungen, onClose }) {
  if (!trainer) return null
  const sessions = wochenSessions(buchungen, trainer.id)
  const arten = TRAININGSARTEN.filter((a) => trainer.arten.includes(a.id))
  return (
    <div className="modal-hintergrund" onClick={onClose} role="presentation">
      <div className="modal karte" role="dialog" aria-modal="true" aria-label={'Profil von ' + trainer.name} onClick={(e) => e.stopPropagation()}>
        <button className="modal-schliessen" onClick={onClose} aria-label="Profil schließen">
          ✕
        </button>
        <div className="modal-kopf">
          <span className="monogramm monogramm-gross" aria-hidden="true">
            {trainer.monogramm}
          </span>
          <div>
            <h2 style={{ margin: 0 }}>{trainer.name}</h2>
            <span className="hinweis-klein">
              {trainer.herkunft} · {trainer.erfahrung} Jahre Erfahrung
            </span>
          </div>
        </div>
        <p className="gedeckt">{trainer.philosophie}</p>
        <h3 style={{ marginTop: 18 }}>Schwerpunkte</h3>
        <div className="tag-liste">
          {trainer.schwerpunkte.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <h3 style={{ marginTop: 18 }}>Zertifikate</h3>
        <div className="tag-liste">
          {trainer.zertifikate.map((z) => (
            <span key={z}>{z}</span>
          ))}
        </div>
        <h3 style={{ marginTop: 18 }}>Trainingsarten</h3>
        <div className="tag-liste">
          {arten.map((a) => (
            <span key={a.id}>
              {a.name} · {a.dauer} Min · {euro(a.preis)}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <Auslastungsbalken wert={sessions} maximum={trainer.kontingent} />
        </div>
      </div>
    </div>
  )
}

/* Kleine Strich-Icons für die App-Navigation unten */
function TabIcon({ name }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true }
  if (name === 'buchen')
    return (
      <svg {...p}>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 9h18M12 13v6M9 16h6" />
      </svg>
    )
  if (name === 'termine')
    return (
      <svg {...p}>
        <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
      </svg>
    )
  if (name === 'studio')
    return (
      <svg {...p}>
        <path d="M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10" />
      </svg>
    )
  if (name === 'heute')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  if (name === 'woche')
    return (
      <svg {...p}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  if (name === 'sessions')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    )
  if (name === 'zeiten')
    return (
      <svg {...p}>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="9" cy="6" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="7" cy="18" r="2" />
      </svg>
    )
  return null
}

/* ————— Kundenansicht ————— */

function KundenAnsicht(props) {
  const { woche, jetzt, trainerListe, buchungen, kunden, meldungen, aktionen } = props
  const [schritt, setSchritt] = useState('zugang')
  const [codeEingabe, setCodeEingabe] = useState('')
  const [codeFehler, setCodeFehler] = useState(false)
  const [kundeId, setKundeId] = useState(null)
  const [artId, setArtId] = useState(null)
  const [praeferenzTrainerId, setPraeferenzTrainerId] = useState(null)
  const [ohnePraeferenz, setOhnePraeferenz] = useState(false)
  const [selTag, setSelTag] = useState(Math.max(0, woche.heuteIndex))
  const [auswahl, setAuswahl] = useState(null) // { tag, stunde, trainerId, duo }
  const [offenerGrund, setOffenerGrund] = useState(null) // Stunde, deren Sperrgrund aufgeklappt ist
  const [modalTrainerId, setModalTrainerId] = useState(null)

  const kunde = kunden.find((k) => k.id === kundeId) || null
  const art = TRAININGSARTEN.find((a) => a.id === artId) || null
  const trainerById = (id) => trainerListe.find((t) => t.id === id)
  const meineMeldungen = meldungen.filter((m) => m.kundeId === kundeId)

  const anmelden = (e) => {
    e.preventDefault()
    const code = codeEingabe.trim().toUpperCase()
    const treffer = PERSOENLICHE_ZUGANGSCODES
      ? kunden.find((k) => k.code && k.code.toUpperCase() === code)
      : code === GEMEINSAMER_STUDIOCODE
        ? kunden[0]
        : null
    if (treffer) {
      setKundeId(treffer.id)
      setCodeFehler(false)
      setSchritt('training')
    } else {
      setCodeFehler(true)
    }
  }

  const waehleArt = (id) => {
    setArtId(id)
    setPraeferenzTrainerId(null)
    setOhnePraeferenz(false)
    setAuswahl(null)
    setOffenerGrund(null)
    setSchritt('trainer')
  }

  const waehleTrainer = (id) => {
    setPraeferenzTrainerId(id)
    setOhnePraeferenz(id === null)
    setAuswahl(null)
    setOffenerGrund(null)
    setSchritt('termin')
  }

  const buchen = () => {
    aktionen.buche({ kundeId, trainerId: auswahl.trainerId, artId, tag: auswahl.tag, stunde: auswahl.stunde, preis: art.preis })
    setAuswahl(null)
    setSchritt('fertig')
  }

  const schritte = [
    { id: 'zugang', label: 'Zugang' },
    { id: 'training', label: 'Training' },
    { id: 'trainer', label: 'Trainer' },
    { id: 'termin', label: 'Termin' },
    { id: 'checkout', label: 'Bestätigen' },
  ]
  const schrittIndex = schritte.findIndex((s) => s.id === schritt)

  const engineKontext = {
    trainerListe,
    buchungen,
    kundeId,
    jetztTag: woche.jetztTag,
    jetztStunde: woche.jetztStunde,
  }

  /* Bewertung aller Stunden des gewählten Tags */
  const slotBewertungen = useMemo(() => {
    if (!art) return []
    if (!ohnePraeferenz && !praeferenzTrainerId) return []
    return STUNDEN.map((stunde) => {
      if (ohnePraeferenz) {
        const r = bewerteSlotOhnePraeferenz({ ...engineKontext, artId, tag: selTag, stunde })
        return { stunde, ...r }
      }
      const trainer = trainerById(praeferenzTrainerId)
      const p = pruefeSlot({ trainer, tag: selTag, stunde, buchungen, kundeId, jetztTag: woche.jetztTag, jetztStunde: woche.jetztStunde })
      return { stunde, ...p, trainerId: praeferenzTrainerId }
    })
  }, [art, artId, ohnePraeferenz, praeferenzTrainerId, selTag, buchungen, kundeId, trainerListe, woche])

  const meineTermine = buchungen
    .filter((b) => b.kundeId === kundeId && b.status !== 'storniert')
    .sort((a, b) => a.tag - b.tag || a.stunde - b.stunde)

  const belegungAuswahl = auswahl ? buchungenImSlot(buchungen, auswahl.tag, auswahl.stunde).length : 0
  const wunschTrainer = !ohnePraeferenz && praeferenzTrainerId ? trainerById(praeferenzTrainerId) : null

  return (
    <div className="schritt-einblendung">
      {kunde && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <div>
            <span>Willkommen zurück, {kunde.name.split(' ')[0]}</span>
          </div>
          <span className="chip chip-akzent">{kunde.verbleibend} von {kunde.paket} Sessions übrig</span>
        </div>
      )}

      {kunde &&
        meineMeldungen.map((m) => (
          <div className="meldung" role="status" key={m.id}>
            <span>{m.text}</span>
            <button onClick={() => aktionen.meldungGelesen(m.id)}>Verstanden</button>
          </div>
        ))}

      {schritt !== 'fertig' && schritt !== 'zugang' && (
        <ol className="stepper" aria-label="Buchungsschritte">
          {schritte.map((s, i) => (
            <li key={s.id} aria-current={s.id === schritt ? 'step' : undefined} className={i < schrittIndex ? 'erledigt' : ''}>
              {i + 1} {s.label}
            </li>
          ))}
        </ol>
      )}

      {schritt === 'zugang' && (
        <div className="schritt-einblendung">
          <div className="hero">
            <span className="kicker">Geschlossenes Personal-Training-Studio</span>
            <h1>
              Training <em>nach Maß</em>
            </h1>
            <p className="unterzeile">Fünf Trainer, eine kleine Fläche und Termine, die wirklich dir gehören.</p>
          </div>
          <div className="karte hero-karte">
            <h2>
              Zugang zum <em>Studio</em>
            </h2>
            <p className="gedeckt">
              BetterDayz ist ein geschlossenes Studio. Gib den Zugangscode ein, den du von uns persönlich erhalten hast.
            </p>
            <form onSubmit={anmelden} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label htmlFor="zugangscode" className="hinweis-klein">
                Dein Zugangscode
              </label>
              <input
                id="zugangscode"
                type="text"
                value={codeEingabe}
                onChange={(e) => setCodeEingabe(e.target.value)}
                placeholder="GRANIT-24"
                autoComplete="off"
                aria-invalid={codeFehler}
                aria-describedby={codeFehler ? 'code-fehler' : undefined}
              />
              {codeFehler && (
                <p className="fehler" id="code-fehler" role="alert">
                  Dieser Code ist nicht gültig. Prüfe die Schreibweise oder melde dich im Studio, dort bekommst du deinen persönlichen Zugang.
                </p>
              )}
              <button type="submit" className="knopf-primaer">
                Studio betreten
              </button>
            </form>
            <p className="hinweis-klein" style={{ marginTop: 16 }}>
              Für diesen Prototyp funktionieren die Codes GRANIT-24, ANKER-58 und KOMPASS-11.
            </p>
          </div>
        </div>
      )}

      {schritt === 'training' && kunde && (
        <div className="schritt-einblendung">
          <span className="kicker">Trainingsart</span>
          <h2>
            Welches Training passt <em>heute</em> zu dir
          </h2>
          <p className="gedeckt">Dauer und Preis unterscheiden sich je nach Trainingsart.</p>
          <div className="raster raster-2" style={{ marginTop: 16 }}>
            {TRAININGSARTEN.map((a) => (
              <button key={a.id} className="karte arten-karte" onClick={() => waehleArt(a.id)} aria-pressed={artId === a.id}>
                <div className="zeile">
                  <h3>{a.name}</h3>
                  <span className="preis">{euro(a.preis)}</span>
                </div>
                <span className="gedeckt">{a.beschreibung}</span>
                <span className="mono hinweis-klein">{a.dauer} Minuten</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {schritt === 'trainer' && kunde && art && (
        <TrainerWahl
          art={art}
          trainerListe={trainerListe}
          buchungen={buchungen}
          onWahl={waehleTrainer}
          onProfil={setModalTrainerId}
          onZurueck={() => setSchritt('training')}
        />
      )}

      {schritt === 'termin' && kunde && art && (
        <div className="schritt-einblendung">
          <div className="termin-kopf">
            <div>
              <button className="knopf-leise" style={{ padding: 0, minHeight: 0, marginBottom: 6 }} onClick={() => setSchritt('trainer')}>
                ‹ Trainer wechseln
              </button>
              <span className="kicker">Terminwahl</span>
              <h2>
                Wann willst du <em>trainieren</em>
              </h2>
              <p className="gedeckt" style={{ margin: 0 }}>
                {ohnePraeferenz ? `${art.name}, wir schlagen dir für jeden Termin einen passenden Trainer vor` : art.name}
              </p>
            </div>
            {wunschTrainer && (
              <button className="trainer-chip" onClick={() => setModalTrainerId(wunschTrainer.id)} aria-haspopup="dialog">
                <span className="monogramm monogramm-klein" aria-hidden="true">
                  {wunschTrainer.monogramm}
                </span>
                <span className="chip-text">
                  <strong>{wunschTrainer.name}</strong>
                  <span className="mono hinweis-klein">
                    {wochenSessions(buchungen, wunschTrainer.id)} von {wunschTrainer.kontingent} Sessions vergeben
                  </span>
                </span>
                <span className="profil-link">Profil</span>
              </button>
            )}
          </div>

          <div className="tage-tabs" role="tablist" aria-label="Wochentag wählen">
            {woche.tage.map((t) => (
              <button
                key={t.index}
                role="tab"
                aria-selected={selTag === t.index}
                onClick={() => {
                  setSelTag(t.index)
                  setAuswahl(null)
                  setOffenerGrund(null)
                }}
              >
                <span>{t.label}</span>
                <span className="datum">{t.datumLabel}</span>
              </button>
            ))}
          </div>
          <p className="hinweis-klein" style={{ marginBottom: 12 }}>
            Die Punkte zeigen die belegten Plätze auf der Fläche, vier gibt es je Slot.
          </p>

          <div className="slot-grid" role="listbox" aria-label="Zeitslots des Tages">
            {slotBewertungen.map((s) => {
              const buchbar = s.status === 'frei' || s.status === 'knapp'
              const gewaehlt = auswahl && auswahl.tag === selTag && auswahl.stunde === s.stunde
              const trainerName = s.trainerId ? trainerById(s.trainerId).name : null
              let statusText = ''
              if (s.status === 'frei') statusText = ohnePraeferenz && trainerName ? `Frei · ${trainerName.split(' ')[0]}` : 'Frei'
              if (s.status === 'knapp') statusText = 'Knapp'
              if (s.status === 'gesperrt') statusText = 'Nicht buchbar'
              return (
                <button
                  key={s.stunde}
                  className="slot-kachel"
                  data-status={buchbar ? s.status : 'gesperrt'}
                  data-voll={s.kunden >= MAX_KUNDEN_PRO_SLOT ? 'true' : 'false'}
                  aria-pressed={!!gewaehlt}
                  aria-label={`${stundeLabel(s.stunde)} Uhr, ${statusText}, ${s.kunden} von ${MAX_KUNDEN_PRO_SLOT} Plätzen belegt`}
                  onClick={() => {
                    if (buchbar) {
                      setAuswahl({ tag: selTag, stunde: s.stunde, trainerId: s.trainerId, duo: s.duo })
                      setOffenerGrund(null)
                    } else {
                      setOffenerGrund(offenerGrund === s.stunde ? null : s.stunde)
                    }
                  }}
                  aria-expanded={!buchbar ? offenerGrund === s.stunde : undefined}
                >
                  <span className="zeit">{stundeLabel(s.stunde)}</span>
                  <span className="slot-status">{statusText}</span>
                  <span className="plaetze" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <i key={i} className={i < s.kunden ? 'belegt' : ''} />
                    ))}
                  </span>
                  {s.duo && buchbar && <span className="duo-tag">Duo</span>}
                </button>
              )
            })}
          </div>

          {offenerGrund !== null &&
            (() => {
              const s = slotBewertungen.find((x) => x.stunde === offenerGrund)
              if (!s || s.status === 'frei' || s.status === 'knapp') return null
              return (
                <SperrGrund
                  grund={s.grund}
                  art={art}
                  tag={selTag}
                  stunde={s.stunde}
                  wunschTrainerId={ohnePraeferenz ? null : praeferenzTrainerId}
                  engineKontext={engineKontext}
                  woche={woche}
                  trainerById={trainerById}
                  onUebernehmen={(alt) => {
                    setSelTag(alt.tag)
                    setAuswahl({ tag: alt.tag, stunde: alt.stunde, trainerId: alt.trainerId, duo: alt.duo })
                    setOffenerGrund(null)
                  }}
                />
              )
            })()}

          {auswahl && (
            <div className="karte" style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <strong>
                  {woche.tage[auswahl.tag].label} {woche.tage[auswahl.tag].datumLabel} um {stundeLabel(auswahl.stunde)}
                </strong>
                <span className="gedeckt"> bei </span>
                <button className="knopf-leise" style={{ padding: 0, minHeight: 0 }} onClick={() => setModalTrainerId(auswahl.trainerId)} aria-haspopup="dialog">
                  {trainerById(auswahl.trainerId).name}
                </button>
                <div className="mono hinweis-klein" style={{ marginTop: 4 }}>
                  {belegungAuswahl} von {MAX_KUNDEN_PRO_SLOT} Plätzen auf der Fläche belegt
                </div>
                {auswahl.duo && (
                  <p className="duo-hinweis" style={{ margin: '6px 0 0' }}>
                    {trainerById(auswahl.trainerId).name.split(' ')[0]} betreut zu dieser Zeit bereits einen weiteren Kunden. Ihr trainiert im Duo.
                  </p>
                )}
                <FlaechenBelegung
                  buchungen={buchungen}
                  trainerListe={trainerListe}
                  tag={auswahl.tag}
                  stunde={auswahl.stunde}
                  eigenerTrainerId={auswahl.trainerId}
                  onProfil={setModalTrainerId}
                />
              </div>
              <button className="knopf-primaer" onClick={() => setSchritt('checkout')}>
                Weiter zur Bestätigung
              </button>
            </div>
          )}
        </div>
      )}

      {schritt === 'checkout' && kunde && art && auswahl && (
        <div className="karte schritt-einblendung" style={{ maxWidth: 520, margin: '20px auto' }}>
          <span className="kicker">Übersicht</span>
          <h2>
            Bestätige deine <em>Buchung</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="gedeckt">Training</span>
              <span>{art.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="gedeckt">Trainer</span>
              <button className="knopf-leise" style={{ padding: 0, minHeight: 0 }} onClick={() => setModalTrainerId(auswahl.trainerId)} aria-haspopup="dialog">
                {trainerById(auswahl.trainerId).name}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="gedeckt">Termin</span>
              <span className="mono">
                {woche.tage[auswahl.tag].label} {woche.tage[auswahl.tag].datumLabel} {stundeLabel(auswahl.stunde)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="gedeckt">Dauer</span>
              <span className="mono">{art.dauer} Minuten</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="gedeckt">Auf der Fläche</span>
              <span className="mono">{belegungAuswahl} von {MAX_KUNDEN_PRO_SLOT} Plätzen belegt</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="gedeckt">Preis</span>
              <span className="mono">{euro(art.preis)}</span>
            </div>
          </div>
          {auswahl.duo && (
            <p className="duo-hinweis">Dein Trainer betreut zu dieser Zeit einen weiteren Kunden. Ihr trainiert im Duo.</p>
          )}
          <FlaechenBelegung
            buchungen={buchungen}
            trainerListe={trainerListe}
            tag={auswahl.tag}
            stunde={auswahl.stunde}
            eigenerTrainerId={auswahl.trainerId}
            onProfil={setModalTrainerId}
          />
          <p className="hinweis-klein" style={{ marginTop: 14 }}>
            Dein Termin ist mit der Buchung fest eingetragen. Stornieren kannst du bis {STORNO_FRIST_STUNDEN} Stunden vor dem Termin.
          </p>
          {kunde.verbleibend <= 0 ? (
            <p className="fehler">Dein Sessionkontingent ist aufgebraucht. Melde dich im Studio für ein neues Paket.</p>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setSchritt('termin')}>Zurück</button>
              <button className="knopf-primaer" onClick={buchen} style={{ flex: 1 }}>
                Termin verbindlich buchen
              </button>
            </div>
          )}
        </div>
      )}

      {schritt === 'fertig' && kunde && (
        <div className="schritt-einblendung">
          <span className="kicker">Dein Plan</span>
          <h2>
            Deine <em>Termine</em>
          </h2>
          {meineTermine.length === 0 ? (
            <div className="leer">
              <p>Du hast noch keine Termine.</p>
              <button className="knopf-primaer" onClick={() => setSchritt('training')}>
                Erste Session buchen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meineTermine.map((b) => {
                const t = trainerById(b.trainerId)
                const a = TRAININGSARTEN.find((x) => x.id === b.artId)
                const stornierbar = istAktiveBuchung(b) && istStornierbar(woche, jetzt, b)
                return (
                  <div className="termin-zeile" key={b.id}>
                    <div>
                      <span className="mono">
                        {woche.tage[b.tag].label} {woche.tage[b.tag].datumLabel} {stundeLabel(b.stunde)}
                      </span>
                      <span> · {a.name} bei {t.name}</span>
                      <div className="hinweis-klein">{STATUS_LABEL[b.status]}</div>
                    </div>
                    {istAktiveBuchung(b) &&
                      (stornierbar ? (
                        <button onClick={() => aktionen.storniere(b)}>Termin stornieren</button>
                      ) : (
                        <span className="hinweis-klein">Stornierung war bis {STORNO_FRIST_STUNDEN} Stunden vorher möglich</span>
                      ))}
                  </div>
                )
              })}
              <button className="knopf-primaer" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => setSchritt('training')}>
                Weitere Session buchen
              </button>
            </div>
          )}
        </div>
      )}

      {schritt === 'studio' && kunde && (
        <div className="schritt-einblendung">
          <UeberStudio aktionLabel="Zur Buchung" onAktion={() => setSchritt('training')} />
        </div>
      )}

      {kunde && (
        <nav className="tabbar" role="tablist" aria-label="App-Navigation">
          <button role="tab" aria-selected={['training', 'trainer', 'termin', 'checkout'].includes(schritt)} onClick={() => setSchritt('training')}>
            <TabIcon name="buchen" />
            Buchen
          </button>
          <button role="tab" aria-selected={schritt === 'fertig'} onClick={() => setSchritt('fertig')}>
            <TabIcon name="termine" />
            Termine
          </button>
          <button role="tab" aria-selected={schritt === 'studio'} onClick={() => setSchritt('studio')}>
            <TabIcon name="studio" />
            Studio
          </button>
        </nav>
      )}

      <TrainerModal trainer={trainerListe.find((t) => t.id === modalTrainerId) || null} buchungen={buchungen} onClose={() => setModalTrainerId(null)} />
    </div>
  )
}

function SperrGrund({ grund, art, tag, stunde, wunschTrainerId, engineKontext, woche, trainerById, onUebernehmen }) {
  const wunschName = wunschTrainerId ? trainerById(wunschTrainerId).name : null
  const alternativen = findeAlternativen({
    ...engineKontext,
    artId: art.id,
    tag,
    stunde,
    wunschTrainerId,
  })
  return (
    <div className="slot-grund" role="note">
      <span>
        <strong className="mono">{stundeLabel(stunde)}</strong>
        <span> — {grundText(grund, wunschName)}</span>
      </span>
      {alternativen.length > 0 ? (
        <div className="alternativen">
          {alternativen.map((alt, i) => {
            const t = trainerById(alt.trainerId)
            const label =
              alt.typ === 'trainer'
                ? `Gleiche Zeit bei ${t.name}`
                : `${t.name.split(' ')[0]} am ${woche.tage[alt.tag].label} um ${stundeLabel(alt.stunde)}`
            return (
              <button key={i} onClick={() => onUebernehmen(alt)}>
                {label}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="hinweis-klein" style={{ marginTop: 8 }}>
          Gerade gibt es keine nahe Alternative. Schau bei einem anderen Tag vorbei.
        </p>
      )}
    </div>
  )
}

function TrainerWahl({ art, trainerListe, buchungen, onWahl, onProfil, onZurueck }) {
  const verfuegbar = buchbareTrainer({ trainerListe, artId: art.id, buchungen })
  return (
    <div className="schritt-einblendung">
      <span className="kicker">Deine Trainer</span>
      <h2>
        Wer soll dich <em>trainieren</em>
      </h2>
      <p className="gedeckt">Diese Trainer bieten {art.name} an und haben diese Woche noch Kapazität.</p>
      <div className="raster raster-2" style={{ margin: '16px 0' }}>
        {verfuegbar.map((t) => {
          const sessions = wochenSessions(buchungen, t.id)
          return (
            <div className="karte trainer-karte" key={t.id}>
              <div className="trainer-kopf">
                <span className="monogramm" aria-hidden="true">
                  {t.monogramm}
                </span>
                <div>
                  <h3 style={{ margin: 0 }}>{t.name}</h3>
                  <span className="hinweis-klein">
                    {t.herkunft} · {t.erfahrung} Jahre Erfahrung
                  </span>
                </div>
              </div>
              <p className="gedeckt" style={{ margin: 0 }}>
                {t.philosophie}
              </p>
              <div className="tag-liste" aria-label="Schwerpunkte">
                {t.schwerpunkte.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <Auslastungsbalken wert={sessions} maximum={t.kontingent} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="knopf-primaer" style={{ flex: 1 }} onClick={() => onWahl(t.id)}>
                  Verfügbarkeit ansehen
                </button>
                <button onClick={() => onProfil(t.id)} aria-haspopup="dialog">
                  Profil
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {verfuegbar.length === 0 && (
        <div className="leer">
          <p>Für {art.name} ist diese Woche kein Trainer mehr frei. Nächste Woche öffnen sich neue Zeiten.</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onZurueck}>Zurück zur Trainingswahl</button>
        {verfuegbar.length > 0 && (
          <button onClick={() => onWahl(null)}>Ohne Präferenz fortfahren, wir schlagen dir Trainer vor</button>
        )}
      </div>
    </div>
  )
}

/* ————— Trainerdashboard ————— */

function TrainerAnsicht(props) {
  const { woche, trainerListe, buchungen, kunden, aktionen } = props
  const [trainerId, setTrainerId] = useState(null)
  const [tab, setTab] = useState('heute')

  const trainer = trainerListe.find((t) => t.id === trainerId) || null
  const kundeById = (id) => kunden.find((k) => k.id === id)
  const artById = (id) => TRAININGSARTEN.find((a) => a.id === id)

  if (!trainer) {
    return (
      <div className="schritt-einblendung">
        <span className="kicker">Trainerbereich</span>
        <h2>
          Wähle dein <em>Profil</em>
        </h2>
        <p className="gedeckt">Dein Dashboard öffnet sich direkt nach der Auswahl.</p>
        <div className="profil-wahl" style={{ marginTop: 16 }}>
          {trainerListe.map((t) => (
            <button key={t.id} className="karte trainer-karte trainer-karte-klickbar" onClick={() => setTrainerId(t.id)} style={{ textAlign: 'left' }}>
              <div className="trainer-kopf">
                <span className="monogramm" aria-hidden="true">
                  {t.monogramm}
                </span>
                <div>
                  <h3 style={{ margin: 0 }}>{t.name}</h3>
                  <span className="hinweis-klein">{t.herkunft}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const eigene = buchungen.filter((b) => b.trainerId === trainer.id && istAktiveBuchung(b))
  const heutige = eigene.filter((b) => b.tag === woche.heuteIndex).sort((a, b) => a.stunde - b.stunde)
  const kommende = eigene
    .filter((b) => woche.jetztTag < 0 || b.tag > woche.jetztTag || (b.tag === woche.jetztTag && b.stunde > woche.jetztStunde))
    .sort((a, b) => a.tag - b.tag || a.stunde - b.stunde)
  const sessions = wochenSessions(buchungen, trainer.id)
  const umsatz = eigene.reduce((summe, b) => summe + b.preis, 0)
  const kundenWoche = new Set(eigene.map((b) => b.kundeId)).size

  return (
    <div className="schritt-einblendung">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <div className="trainer-kopf">
          <span className="monogramm" aria-hidden="true">
            {trainer.monogramm}
          </span>
          <div>
            <h2 style={{ margin: 0 }}>{trainer.name}</h2>
            <span className="hinweis-klein">{trainer.herkunft}</span>
          </div>
        </div>
        <button className="knopf-leise" onClick={() => setTrainerId(null)}>
          Profil wechseln
        </button>
      </div>

      <div className="kpi-reihe">
        <div className="kpi">
          <div className="titel">Sessions heute</div>
          <div className="wert">{woche.heuteIndex < 0 ? '—' : heutige.length}</div>
        </div>
        <div className="kpi">
          <div className="titel">Auslastung Woche</div>
          <div className="wert">
            {sessions}/{trainer.kontingent}
          </div>
          <div className={'balken' + (sessions >= trainer.kontingent ? ' balken-voll' : '')}>
            <div style={{ width: Math.min(100, (sessions / Math.max(1, trainer.kontingent)) * 100) + '%' }} />
          </div>
        </div>
        <div className="kpi">
          <div className="titel">Kunden diese Woche</div>
          <div className="wert">{kundenWoche}</div>
        </div>
        <div className="kpi">
          <div className="titel">Geplanter Umsatz</div>
          <div className="wert">{umsatz} €</div>
        </div>
      </div>

      {tab === 'heute' && (
        <div role="tabpanel" className="schritt-einblendung">
          {woche.heuteIndex < 0 || heutige.length === 0 ? (
            <div className="leer">
              <p>Heute stehen keine Sessions an.</p>
              <p className="hinweis-klein">Deine nächsten Termine findest du im Wochenraster.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {heutige.map((b) => {
                const k = kundeById(b.kundeId)
                const a = artById(b.artId)
                return (
                  <div className="karte session-karte" key={b.id}>
                    <span className="zeit">{stundeLabel(b.stunde)}</span>
                    <div>
                      <div className="name">{k.name}</div>
                      <div className="gedeckt">
                        {a.name} · {a.dauer} Minuten
                      </div>
                      <p style={{ margin: '6px 0 0' }}>{k.ziele}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'woche' && (
        <div role="tabpanel" className="schritt-einblendung">
          <WochenRaster woche={woche} trainer={trainer} buchungen={buchungen} kundeById={kundeById} />
        </div>
      )}

      {tab === 'sessions' && (
        <div role="tabpanel" className="schritt-einblendung">
          {kommende.length === 0 ? (
            <div className="leer">
              <p>Keine kommenden Sessions.</p>
              <p className="hinweis-klein">Neue Buchungen deiner Kunden erscheinen hier sofort.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {kommende.map((b) => {
                const k = kundeById(b.kundeId)
                const a = artById(b.artId)
                return (
                  <div className="karte anfrage-zeile" key={b.id}>
                    <div>
                      <strong>{k.name}</strong>
                      <span className="gedeckt"> · {a.name}</span>
                      <div className="mono hinweis-klein">
                        {woche.tage[b.tag].label} {woche.tage[b.tag].datumLabel} {stundeLabel(b.stunde)} · {euro(b.preis)}
                      </div>
                      <div className="hinweis-klein">{k.ziele}</div>
                    </div>
                    <div className="aktionen">
                      <button onClick={() => aktionen.sageAb(b)}>Session absagen</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'verfuegbarkeit' && (
        <div role="tabpanel" className="schritt-einblendung">
          <Verfuegbarkeit woche={woche} trainer={trainer} buchungen={buchungen} aktionen={aktionen} />
        </div>
      )}

      <nav className="tabbar" role="tablist" aria-label="Dashboard-Navigation">
        <button role="tab" aria-selected={tab === 'heute'} onClick={() => setTab('heute')}>
          <TabIcon name="heute" />
          Heute
        </button>
        <button role="tab" aria-selected={tab === 'woche'} onClick={() => setTab('woche')}>
          <TabIcon name="woche" />
          Woche
        </button>
        <button role="tab" aria-selected={tab === 'sessions'} onClick={() => setTab('sessions')}>
          <TabIcon name="sessions" />
          Sessions
        </button>
        <button role="tab" aria-selected={tab === 'verfuegbarkeit'} onClick={() => setTab('verfuegbarkeit')}>
          <TabIcon name="zeiten" />
          Zeiten
        </button>
      </nav>
    </div>
  )
}

function WochenRaster({ woche, trainer, buchungen, kundeById }) {
  return (
    <div>
      <div className="scroll-x">
        <div className="wgrid" role="table" aria-label="Wochenraster der Fläche">
          <div className="kopf" role="columnheader"></div>
          {woche.tage.map((t) => (
            <div className="kopf" role="columnheader" key={t.index}>
              {t.label} {t.datumLabel}
            </div>
          ))}
          {STUNDEN.map((stunde) => (
            <RasterZeile key={stunde} stunde={stunde} woche={woche} trainer={trainer} buchungen={buchungen} kundeById={kundeById} />
          ))}
        </div>
      </div>
      <div className="legende">
        <span>
          <i style={{ background: 'var(--verlauf-eigene)' }} /> Eigene Session
        </span>
        <span>
          <i style={{ background: 'var(--zelle-fremd)' }} /> Belegung der Fläche durch Kollegen
        </span>
        <span>
          <i style={{ background: 'var(--schraffur-block)' }} /> Geblockte Zeit
        </span>
        <span>
          <i /> Freie Kapazität
        </span>
      </div>
      <p className="hinweis-klein" style={{ marginTop: 10 }}>
        Die Füllhöhe einer Zelle zeigt, wie voll die Fläche in diesem Slot ist. Vier Kunden bedeuten voll.
      </p>
    </div>
  )
}

function RasterZeile({ stunde, woche, trainer, buchungen, kundeById }) {
  return (
    <>
      <div className="stunde-label">{stundeLabel(stunde)}</div>
      {woche.tage.map((t) => {
        const slot = buchungenImSlot(buchungen, t.index, stunde)
        const eigene = slot.filter((b) => b.trainerId === trainer.id)
        const geblockt = trainer.blocks.includes(slotSchluessel(t.index, stunde))
        const az = trainer.arbeitszeiten[t.index]
        const ausserhalb = !az || stunde < az.von || stunde >= az.bis
        const fuellung = (slot.length / MAX_KUNDEN_PRO_SLOT) * 100
        const titel =
          `${t.label} ${stundeLabel(stunde)}, ${slot.length} von ${MAX_KUNDEN_PRO_SLOT} Kunden` +
          (eigene.length > 0 ? `, eigene Session ${eigene.map((b) => kundeById(b.kundeId).name).join(' und ')}` : '') +
          (geblockt ? ', geblockt' : '')
        return (
          <div
            className={'wzelle' + (t.index === woche.heuteIndex ? ' wzelle-heute' : '') + (ausserhalb && !geblockt ? ' wzelle-ausserhalb' : '')}
            role="cell"
            key={t.index}
            title={titel}
          >
            {slot.length > 0 && <div className="fuellung" style={{ height: fuellung + '%' }} />}
            {geblockt && <div className="block-schraffur" />}
            {eigene.length > 0 && (
              <div className="eigene">
                {eigene.map((b) => kundeById(b.kundeId).name.split(' ').map((n) => n[0]).join('')).join(' · ')}
              </div>
            )}
            {slot.length > 0 && eigene.length === 0 && (
              <span className="zahl">
                {slot.length}/{MAX_KUNDEN_PRO_SLOT}
              </span>
            )}
          </div>
        )
      })}
    </>
  )
}

function Verfuegbarkeit({ woche, trainer, buchungen, aktionen }) {
  const stundenOptionen = Array.from({ length: TAG_ENDE - TAG_START + 1 }, (_, i) => TAG_START + i)
  return (
    <div>
      <div className="abschnitt karte">
        <h3>Wochenkontingent</h3>
        <p className="gedeckt">So viele Sessions gibst du diese Woche höchstens. Beim Erreichen verschwindest du aus der Kundenauswahl.</p>
        <div className="kontingent-stepper">
          <button aria-label="Kontingent verringern" onClick={() => aktionen.setKontingent(trainer.id, Math.max(0, trainer.kontingent - 1))}>
            −
          </button>
          <span className="wert">{trainer.kontingent}</span>
          <button aria-label="Kontingent erhöhen" onClick={() => aktionen.setKontingent(trainer.id, trainer.kontingent + 1)}>
            +
          </button>
          <span className="hinweis-klein">Sessions pro Woche</span>
        </div>
      </div>

      <div className="abschnitt karte">
        <h3>Arbeitszeiten</h3>
        <p className="gedeckt">Deine Zeiten wirken sofort auf die Kundenansicht.</p>
        <div className="verf-zeiten">
          {woche.tage.map((t) => {
            const az = trainer.arbeitszeiten[t.index]
            return (
              <div className="verf-tag" key={t.index}>
                <span className="tag-name">{t.label}</span>
                <label className="hinweis-klein" htmlFor={`von-${t.index}`}>
                  von
                </label>
                <select
                  id={`von-${t.index}`}
                  value={az ? az.von : 'frei'}
                  onChange={(e) => {
                    const wert = e.target.value
                    if (wert === 'frei') aktionen.setArbeitszeit(trainer.id, t.index, null)
                    else aktionen.setArbeitszeit(trainer.id, t.index, { von: Number(wert), bis: az ? Math.max(Number(wert) + 1, az.bis) : Number(wert) + 4 })
                  }}
                >
                  <option value="frei">frei</option>
                  {stundenOptionen.slice(0, -1).map((s) => (
                    <option key={s} value={s}>
                      {stundeLabel(s)}
                    </option>
                  ))}
                </select>
                <label className="hinweis-klein" htmlFor={`bis-${t.index}`}>
                  bis
                </label>
                <select
                  id={`bis-${t.index}`}
                  value={az ? az.bis : 'frei'}
                  disabled={!az}
                  onChange={(e) => aktionen.setArbeitszeit(trainer.id, t.index, { von: az.von, bis: Number(e.target.value) })}
                >
                  {!az && <option value="frei">—</option>}
                  {stundenOptionen.filter((s) => !az || s > az.von).map((s) => (
                    <option key={s} value={s}>
                      {stundeLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>

      <div className="abschnitt karte">
        <h3>Zeiten blocken</h3>
        <p className="gedeckt">
          Tippe auf einen Slot, um ihn zu blocken oder wieder freizugeben. Slots mit eigener Session lassen sich nicht blocken, sage die Session zuerst ab.
        </p>
        <div className="scroll-x">
          <div className="verf-grid">
            <div className="kopf"></div>
            {woche.tage.map((t) => (
              <div className="kopf" key={t.index} style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--gedeckt)', textAlign: 'center', padding: '6px 0' }}>
                {t.label}
              </div>
            ))}
            {STUNDEN.map((stunde) => (
              <BlockZeile key={stunde} stunde={stunde} woche={woche} trainer={trainer} buchungen={buchungen} aktionen={aktionen} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function BlockZeile({ stunde, woche, trainer, buchungen, aktionen }) {
  return (
    <>
      <div className="stunde-label">{stundeLabel(stunde)}</div>
      {woche.tage.map((t) => {
        const schluessel = slotSchluessel(t.index, stunde)
        const geblockt = trainer.blocks.includes(schluessel)
        const eigene = buchungenImSlot(buchungen, t.index, stunde).some((b) => b.trainerId === trainer.id)
        const az = trainer.arbeitszeiten[t.index]
        const ausserhalb = !az || stunde < az.von || stunde >= az.bis
        let label = ''
        let klasse = ''
        if (eigene) {
          label = 'Session'
          klasse = 'session'
        } else if (geblockt) {
          label = 'Geblockt'
          klasse = 'block-an'
        } else if (!ausserhalb) {
          label = 'Frei'
          klasse = 'zellen-frei'
        }
        return (
          <button
            key={t.index}
            className={klasse}
            disabled={eigene || ausserhalb}
            aria-pressed={geblockt}
            aria-label={`${t.label} ${stundeLabel(stunde)} ${label || 'außerhalb der Arbeitszeit'}`}
            onClick={() => aktionen.toggleBlock(trainer.id, t.index, stunde)}
          >
            {label}
          </button>
        )
      })}
    </>
  )
}

/* ————— Wurzelkomponente ————— */

export default function App() {
  const [start] = useState(erzeugeStartdaten)
  const { jetzt, woche } = start
  const [trainerListe, setTrainerListe] = useState(start.trainerListe)
  const [buchungen, setBuchungen] = useState(start.buchungen)
  const [kunden, setKunden] = useState(start.kunden)
  const [meldungen, setMeldungen] = useState([])
  const [ansicht, setAnsicht] = useState('kunde')

  const aktionen = useMemo(
    () => ({
      buche: (b) => {
        setBuchungen((bs) => [...bs, { ...b, id: 'b' + (bs.length + 1), status: 'gebucht' }])
        setKunden((ks) => ks.map((k) => (k.id === b.kundeId ? { ...k, verbleibend: k.verbleibend - 1 } : k)))
      },
      storniere: (b) => {
        setBuchungen((bs) => bs.map((x) => (x.id === b.id ? { ...x, status: 'storniert' } : x)))
        setKunden((ks) => ks.map((k) => (k.id === b.kundeId ? { ...k, verbleibend: k.verbleibend + 1 } : k)))
      },
      sageAb: (b) => {
        const trainerName = TRAINER_START.find((t) => t.id === b.trainerId).name
        const w = berechneWoche(jetzt)
        setBuchungen((bs) => bs.map((x) => (x.id === b.id ? { ...x, status: 'abgesagt' } : x)))
        setKunden((ks) => ks.map((k) => (k.id === b.kundeId ? { ...k, verbleibend: k.verbleibend + 1 } : k)))
        setMeldungen((ms) => [
          ...ms,
          {
            id: 'm' + (ms.length + 1),
            kundeId: b.kundeId,
            text: `${trainerName} hat deinen Termin am ${w.tage[b.tag].label} ${w.tage[b.tag].datumLabel} um ${stundeLabel(b.stunde)} abgesagt. Der Slot ist wieder frei und die Session deinem Kontingent gutgeschrieben.`,
          },
        ])
      },
      meldungGelesen: (id) => setMeldungen((ms) => ms.filter((m) => m.id !== id)),
      toggleBlock: (trainerId, tag, stunde) => {
        const schluessel = slotSchluessel(tag, stunde)
        setTrainerListe((ts) =>
          ts.map((t) =>
            t.id === trainerId
              ? { ...t, blocks: t.blocks.includes(schluessel) ? t.blocks.filter((b) => b !== schluessel) : [...t.blocks, schluessel] }
              : t,
          ),
        )
      },
      setArbeitszeit: (trainerId, tag, az) => {
        setTrainerListe((ts) => ts.map((t) => (t.id === trainerId ? { ...t, arbeitszeiten: t.arbeitszeiten.map((a, i) => (i === tag ? az : a)) } : t)))
      },
      setKontingent: (trainerId, wert) => {
        setTrainerListe((ts) => ts.map((t) => (t.id === trainerId ? { ...t, kontingent: wert } : t)))
      },
    }),
    [jetzt],
  )

  return (
    <div className="app">
      <style>{CSS}</style>
      <header className="topbar">
        <div className="marke">
          <span className="marke-name">BetterDayz</span>
          <span className="marke-zusatz">Personal Training</span>
        </div>
        <div className="ansicht-schalter" role="group" aria-label="Ansicht wechseln">
          <button aria-pressed={ansicht === 'kunde'} onClick={() => setAnsicht('kunde')}>
            Kunde
          </button>
          <button aria-pressed={ansicht === 'trainer'} onClick={() => setAnsicht('trainer')}>
            Trainer
          </button>
        </div>
      </header>
      <main className="inhalt">
        <div style={{ display: ansicht === 'kunde' ? 'block' : 'none' }}>
          <KundenAnsicht woche={woche} jetzt={jetzt} trainerListe={trainerListe} buchungen={buchungen} kunden={kunden} meldungen={meldungen} aktionen={aktionen} />
        </div>
        <div style={{ display: ansicht === 'trainer' ? 'block' : 'none' }}>
          <TrainerAnsicht woche={woche} trainerListe={trainerListe} buchungen={buchungen} kunden={kunden} aktionen={aktionen} />
        </div>
      </main>
    </div>
  )
}
