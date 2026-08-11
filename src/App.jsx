import { useEffect, useMemo, useState } from 'react'
import { LOGO_DATA_URI } from './logo.js'

/* ============================================================================
   BETTERDAYZ — Buchungsplattform für ein geschlossenes Personal-Training-Studio

   Designsprache nach stoic. (Self-Care-Journaling-App, Mobbin-Referenz):
   monochrom hell, kleingeschriebene fette Headlines mit Punkt, weiße Karten
   ohne Rand und ohne harte Schatten, schwarze Pillen als Aktion, Wochenleiste
   mit Häkchen, Bottom-Navigation mit zentralem Plus-Knopf.

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

/* Exklusivbuchung. Der Kunde kauft die restlichen Plätze der Fläche mit und
   trainiert allein mit seinem Trainer. Der Aufpreis entspricht den drei
   Plätzen, die dem Studio dadurch entgehen. */
const EXKLUSIV_MOEGLICH = true
const EXKLUSIV_AUFPREIS = 120

const STORNO_FRIST_STUNDEN = 24
const TAG_START = 7 // erste buchbare Stunde
const TAG_ENDE = 21 // Ende des Rasters, letzter Slotbeginn ist 20 Uhr
const WOCHEN_TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const STUNDEN = Array.from({ length: TAG_ENDE - TAG_START }, (_, i) => TAG_START + i)

/* ----------------------------------------------------------------------------
   2. STAMMDATEN
---------------------------------------------------------------------------- */

const TRAININGSARTEN = [
  /* Bilder von Unsplash, frei nutzbar, per URL eingebunden */
  {
    id: 'boxing',
    name: 'Boxing',
    dauer: 60,
    preis: 95,
    beschreibung: 'Technik, Pratzenarbeit, Kondition',
    bild: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 'hit',
    name: 'HIT Training',
    dauer: 45,
    preis: 78,
    beschreibung: 'Hochintensive Intervalle, kurze Pausen',
    bild: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 'pump-ok',
    name: 'Pumping Oberkörper',
    dauer: 60,
    preis: 85,
    beschreibung: 'Brust, Rücken, Schulter, Arme',
    bild: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 'pump-uk',
    name: 'Pumping Unterkörper',
    dauer: 60,
    preis: 88,
    beschreibung: 'Beine, Gesäß, Rumpfstabilität',
    bild: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=70',
  },
]

/* Arbeitszeiten je Wochentag Mo bis Sa. null bedeutet freier Tag. */
const TRAINER_START = [
  {
    id: 'serdar',
    name: 'Serdar',
    monogramm: 'SE',
    herkunft: 'Studioleitung · Wettkampfboxen',
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
    id: 'chrissi',
    name: 'Chrissi',
    monogramm: 'CH',
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
    id: 'ertan',
    name: 'Ertan',
    monogramm: 'ER',
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
    id: 'cem',
    name: 'Cem',
    monogramm: 'CE',
    herkunft: 'Ausdauer und Kondition',
    philosophie:
      'Kondition ist die Währung, mit der du jedes andere Training bezahlst. Ich arbeite mit klaren Intervallen und ehrlichen Pausen. Du lernst, dein Tempo zu kennen und zu halten.',
    schwerpunkte: ['Intervalltraining', 'Grundlagenausdauer', 'Atemtechnik'],
    arten: ['hit', 'boxing'],
    erfahrung: 9,
    zertifikate: ['Sportwissenschaft M. Sc.', 'Lauftrainer'],
    kontingent: 6,
    arbeitszeiten: [{ von: 7, bis: 15 }, { von: 7, bis: 15 }, { von: 7, bis: 15 }, { von: 7, bis: 15 }, { von: 7, bis: 15 }, { von: 7, bis: 12 }],
    blocks: [],
  },
  {
    id: 'benny',
    name: 'Benny',
    monogramm: 'BE',
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
  { id: 'k1', code: 'GRANIT-24', name: 'Emma Fischer', paket: 10, verbleibend: 7, ziele: 'Kraftaufbau nach Schulter-OP, rechte Seite langsam steigern' },
  { id: 'k2', code: 'ANKER-58', name: 'David Krüger', paket: 20, verbleibend: 9, ziele: 'Vorbereitung auf einen Amateur-Boxkampf im Oktober, Fokus Beinarbeit' },
  { id: 'k3', code: 'KOMPASS-11', name: 'Nina Hartmann', paket: 8, verbleibend: 6, ziele: 'Wieder in Form nach der Elternzeit, Rücken stabilisieren' },
  { id: 'k4', code: null, name: 'Tim Berger', paket: 10, verbleibend: 4, ziele: 'Sprungkraft für Volleyball verbessern, Knie stabil halten' },
  { id: 'k5', code: null, name: 'Leyla Acar', paket: 20, verbleibend: 12, ziele: 'Erster Wettkampf im Kickboxen, Schlagkraft und Deckung' },
  { id: 'k6', code: null, name: 'Marco Steiner', paket: 10, verbleibend: 6, ziele: 'Haltung verbessern, Nacken entlasten, Kraft im Oberkörper' },
  { id: 'k7', code: null, name: 'Julia Brandt', paket: 10, verbleibend: 5, ziele: 'Kreuzheben sauber aufbauen, unterer Rücken braucht Aufmerksamkeit' },
  { id: 'k8', code: null, name: 'Kevin Roth', paket: 20, verbleibend: 14, ziele: 'Nach der Kreuzband-Reha zurück zum alten Niveau' },
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

/* Liegt auf dem Slot eine Exklusivbuchung, ist die Fläche für alle anderen
   zu, unabhängig von Trainer und freien Plätzen. */
function exklusivBuchungImSlot(buchungen, tag, stunde) {
  return buchungenImSlot(buchungen, tag, stunde).find((b) => b.exklusiv) || null
}

/* Exklusiv geht nur, solange niemand sonst gebucht hat. */
function kannExklusivBuchen(buchungen, tag, stunde) {
  return EXKLUSIV_MOEGLICH && buchungenImSlot(buchungen, tag, stunde).length === 0
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

  /* Exklusivbuchung sperrt den Slot vor allen anderen, auch wenn rein
     rechnerisch noch Plätze frei wären. */
  const exklusiv = exklusivBuchungImSlot(buchungen, tag, stunde)
  if (exklusiv && exklusiv.kundeId !== kundeId) {
    return { status: 'gesperrt', grund: 'exklusiv_belegt', duo: false, kunden }
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
    exklusivMoeglich: kannExklusivBuchen(buchungen, tag, stunde),
  }
}

/* Analysiert, wer zu einem Zeitpunkt auf der Fläche steht und was das für
   den buchenden Kunden bedeutet. Kernfrage: trainiere ich allein mit meinem
   Trainer oder teile ich ihn mir, und wie viele Menschen sind sonst da.
   Rein, ohne UI-Bezug — wandert später mit auf den Server. */
function analysiereFlaeche({ buchungen, trainerListe, tag, stunde, eigenerTrainerId = null, exklusivGewaehlt = false }) {
  const slot = buchungenImSlot(buchungen, tag, stunde)
  const proTrainer = trainerListe
    .map((t) => ({ trainer: t, kunden: slot.filter((b) => b.trainerId === t.id).length }))
    .filter((x) => x.kunden > 0)
  const beiMeinemTrainer = eigenerTrainerId ? slot.filter((b) => b.trainerId === eigenerTrainerId).length : 0
  return {
    belegt: slot.length,
    frei: MAX_KUNDEN_PRO_SLOT - slot.length,
    proTrainer,
    beiMeinemTrainer,
    duo: beiMeinemTrainer > 0, // ich wäre der zweite Kunde dieses Trainers
    andereAufFlaeche: slot.length - beiMeinemTrainer,
    trainerAufFlaeche: proTrainer.length,
    exklusivMoeglich: kannExklusivBuchen(buchungen, tag, stunde),
    exklusiv: exklusivGewaehlt,
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
      tagZahl: d.getDate(),
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
  const add = (trainerId, kundeId, artId, tag, stunde, exklusiv = false) => {
    laufnummer += 1
    buchungen.push({
      id: 'seed' + laufnummer,
      trainerId,
      kundeId,
      artId,
      tag,
      stunde,
      status: 'gebucht',
      preis: artPreis(artId) + (exklusiv ? EXKLUSIV_AUFPREIS : 0),
      exklusiv,
    })
  }

  const demoTag = woche.heuteIndex < 0 ? 1 : Math.min(woche.heuteIndex + 1, 5)

  // Szenario volle Fläche um 13 Uhr, vier Kunden bei zwei Trainern
  add('serdar', 'k4', 'boxing', demoTag, 13)
  add('serdar', 'k5', 'hit', demoTag, 13)
  add('ertan', 'k6', 'pump-ok', demoTag, 13)
  add('ertan', 'k7', 'pump-uk', demoTag, 13)

  // Szenario zwei Trainer auf der Fläche um 11 Uhr, Fläche nicht voll
  add('ertan', 'k8', 'pump-uk', demoTag, 11)
  add('cem', 'k4', 'hit', demoTag, 11)

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
  fuelle('serdar', 7)
  fuelle('chrissi', 6)
  fuelle('ertan', 8)
  fuelle('benny', 5)
  fuelle('cem', 6) // Cem erreicht damit sein Kontingent und gilt als ausgebucht

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
  /* Ein anderer Kunde hat die Fläche am Freitagmorgen exklusiv gebucht.
     Der Slot ist damit für alle anderen dicht, unabhängig vom Trainer. */
  add('ertan', 'k8', 'pump-uk', 4, 10, true)

  fuegeZukunft('chrissi', 'k1', 'pump-ok')
  fuegeZukunft('serdar', 'k6', 'boxing')
  fuegeZukunft('serdar', 'k7', 'hit')

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

/* Tageszeiten für die Gruppierung der Slots */
const TAGESZEITEN = [
  { id: 'vormittag', name: 'Vormittag', von: 7, bis: 12, icon: 'sonnenaufgang' },
  { id: 'nachmittag', name: 'Nachmittag', von: 12, bis: 17, icon: 'sonne' },
  { id: 'abend', name: 'Abend', von: 17, bis: 21, icon: 'mond' },
]

/* Die eine Aussage, die der Kunde beim Buchen wissen will */
function flaechenAussage(f, trainerName) {
  const vorname = trainerName ? trainerName.split(' ')[0] : 'deinem Trainer'
  if (f.exklusiv) return 'die fläche ganz für dich.'
  if (f.duo) return `zu zweit bei ${vorname}.`
  if (f.andereAufFlaeche === 0) return 'die fläche gehört dir.'
  return `allein mit ${vorname}.`
}

function flaechenNebentext(f, trainerName) {
  const vorname = trainerName ? trainerName.split(' ')[0] : 'deinem Trainer'
  const andere = f.andereAufFlaeche
  if (f.exklusiv) return `Du buchst alle vier Plätze. Niemand außer dir und ${vorname} betritt in dieser Stunde die Fläche.`
  if (f.duo) {
    const rest = andere > 0 ? ` Dazu ${andere === 1 ? 'trainiert ein weiterer Kunde' : `trainieren ${andere} weitere Kunden`} bei anderen Trainern.` : ''
    return `Ein weiterer Kunde hat ebenfalls bei ${vorname} gebucht, ihr zwei teilt euch die Session.` + rest
  }
  if (andere === 0) return 'Aktuell ist kein anderer Kunde gebucht. Es kann sich aber noch jemand dazubuchen.'
  return `${vorname} betreut nur dich. ${andere === 1 ? 'Ein weiterer Kunde trainiert' : `${andere} weitere Kunden trainieren`} gleichzeitig bei anderen Trainern.`
}

function tageszeitGruss(jetzt) {
  const h = jetzt.getHours()
  if (h < 11) return 'guten morgen.'
  if (h < 17) return 'guten tag.'
  return 'guten abend.'
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
    case 'exklusiv_belegt':
      return 'Ein anderer Kunde hat die Fläche zu dieser Zeit exklusiv gebucht.'
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
   Design-Tokens nach der stoic.-Referenz.
---------------------------------------------------------------------------- */

const CSS = `
:root {
  --grund: #EFF1F2;
  --flaeche: #FFFFFF;
  --flaeche-still: #E6E9EB;
  --tinte: #0F1113;
  --gedeckt: #8A9096;
  --leise: #B4B9BD;
  --akzent: #0F1113;
  --akzent-text: #FFFFFF;
  --daten: #A9C4DC;
  --frei: #3C7A55;
  --frei-flaeche: #E4EFE8;
  --warnung: #9A6A34;
  --warnung-flaeche: #F4EBDF;
  --voll: #9E5757;
  --voll-flaeche: #F3E4E4;
  --grotesk: 'Outfit', 'Inter', 'Helvetica Neue', system-ui, sans-serif;
  --mono: 'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace;
  --radius-s: 14px;
  --radius-m: 18px;
  --radius-l: 24px;
  --radius-pill: 999px;
  --schatten: 0 1px 2px rgba(15, 17, 19, 0.04);
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--grund);
  color: var(--tinte);
  font-family: var(--grotesk);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
h1, h2 {
  font-weight: 700;
  text-transform: lowercase;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0 0 8px;
}
h1 { font-size: 34px; }
h2 { font-size: 27px; }
h3 { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 6px; }
p { margin: 0 0 10px; }
.kicker {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--leise);
  margin-bottom: 10px;
}
.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.gedeckt { color: var(--gedeckt); }
.hinweis-klein { font-size: 13px; color: var(--gedeckt); }
button {
  font-family: var(--grotesk);
  font-size: 15px;
  font-weight: 500;
  color: var(--tinte);
  background: var(--flaeche);
  border: none;
  border-radius: var(--radius-pill);
  padding: 12px 20px;
  min-height: 46px;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease, opacity 0.16s ease;
}
button:hover { background: #F7F8F9; }
button:active { transform: scale(0.98); }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {
  outline: 2px solid var(--tinte);
  outline-offset: 2px;
}
button:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.knopf-primaer {
  background: var(--akzent);
  color: var(--akzent-text);
  font-weight: 600;
  padding: 14px 26px;
  min-height: 50px;
}
.knopf-primaer:hover { background: #24282C; }
.knopf-leise {
  background: transparent; color: var(--gedeckt); padding: 6px 0; min-height: 34px;
  font-weight: 500;
}
.knopf-leise:hover { background: transparent; color: var(--tinte); }
input[type="text"], select {
  font-family: var(--mono);
  font-size: 16px;
  color: var(--tinte);
  background: var(--grund);
  border: none;
  border-radius: var(--radius-s);
  padding: 14px 16px;
  min-height: 50px;
  width: 100%;
}
input::placeholder { color: var(--leise); }
select { font-family: var(--grotesk); }
.app {
  min-height: 100vh; min-height: 100dvh;
  display: flex; flex-direction: column;
  width: 100%; max-width: 430px; margin: 0 auto;
  background: var(--grund);
  position: relative;
}
@media (min-width: 480px) {
  body { background: #DCE0E3; }
  .app { box-shadow: 0 0 50px rgba(15, 17, 19, 0.1); }
}
.topbar {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 12px 20px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background: var(--grund);
}
.marke-name { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; }
.ansicht-schalter { display: flex; gap: 2px; background: var(--flaeche-still); border-radius: var(--radius-pill); padding: 3px; flex: none; }
.ansicht-schalter button {
  background: transparent; min-height: 32px; padding: 4px 14px; border-radius: var(--radius-pill);
  color: var(--gedeckt); font-size: 12px; font-weight: 600;
}
.ansicht-schalter button[aria-pressed="true"] { background: var(--akzent); color: var(--akzent-text); }
.inhalt { flex: 1; width: 100%; padding: 4px 20px 0; padding-bottom: calc(110px + env(safe-area-inset-bottom)); }
.karte {
  background: var(--flaeche);
  border-radius: var(--radius-l);
  padding: 20px;
  box-shadow: var(--schatten);
}
.karte-still { background: var(--flaeche-still); box-shadow: none; }
.schritt-einblendung { animation: einblenden 0.24s ease; }
@keyframes einblenden { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

/* Kopfzeile mit Gruß, Streak und Avatar */
.gruss-zeile { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.streak {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--flaeche); border-radius: var(--radius-pill); padding: 6px 14px;
  font-family: var(--mono); font-size: 13px; font-weight: 500;
}
.gruss { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; text-transform: lowercase; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--flaeche); font-size: 13px; font-weight: 600;
}

/* Wochenleiste im stoic-Stil */
.wochenleiste { display: flex; justify-content: space-between; gap: 4px; margin-bottom: 22px; }
.wochentag {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: transparent; border-radius: var(--radius-s); padding: 8px 2px; min-height: 60px;
}
.wochentag:hover { background: rgba(255, 255, 255, 0.6); }
.wochentag .kuerzel { font-size: 12px; font-weight: 500; color: var(--gedeckt); }
.wochentag .mark { font-size: 13px; font-weight: 600; color: var(--leise); line-height: 1; }
.wochentag .mark.erfuellt { color: var(--tinte); }
.wochentag[aria-selected="true"] { background: var(--flaeche); box-shadow: var(--schatten); }
.wochentag[aria-selected="true"] .kuerzel { color: var(--tinte); font-weight: 600; }
.wochentag-heute .kuerzel::after {
  content: ''; display: block; width: 4px; height: 4px; border-radius: 50%;
  background: var(--tinte); margin: 3px auto 0;
}

/* Karten-Kopf mit Label und Zeitstempel */
.karten-kopf { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.karten-kopf .kicker { margin-bottom: 0; }
.karten-kopf .zeitstempel { font-family: var(--mono); font-size: 12px; color: var(--leise); }

/* Zwei Karten nebeneinander */
.duo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.duo-grid .karte { display: flex; flex-direction: column; justify-content: space-between; min-height: 168px; padding: 18px; }
.duo-grid .gross { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }

/* Chips */
.chip-liste { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  border-radius: var(--radius-pill); padding: 6px 14px;
  font-size: 13px; color: var(--tinte);
  background: var(--flaeche-still);
}
.chip-punkt { width: 8px; height: 8px; border-radius: 50%; background: var(--daten); }
.chip-still { background: var(--grund); color: var(--gedeckt); }

/* Tagesleiste mit Verfügbarkeitspunkt (Preply-Muster) */
.tagesleiste { display: flex; gap: 6px; margin-bottom: 6px; }
.tagesleiste .tag {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: transparent; border-radius: var(--radius-m); padding: 10px 2px 8px; min-height: 74px;
}
.tagesleiste .tag .kuerzel { font-size: 11px; font-weight: 500; color: var(--gedeckt); }
.tagesleiste .tag .zahl { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
.tagesleiste .tag .frei-punkt { width: 5px; height: 5px; border-radius: 50%; background: var(--daten); margin-top: 1px; }
.tagesleiste .tag .frei-punkt.ohne { background: transparent; }
.tagesleiste .tag[aria-selected="true"] { background: var(--akzent); }
.tagesleiste .tag[aria-selected="true"] .kuerzel { color: rgba(255, 255, 255, 0.6); }
.tagesleiste .tag[aria-selected="true"] .zahl { color: var(--akzent-text); }
.tagesleiste .tag[aria-selected="true"] .frei-punkt { background: rgba(255, 255, 255, 0.85); }
.tagesleiste .tag:disabled { opacity: 0.32; }
.tages-zusammenfassung { font-size: 13px; color: var(--gedeckt); margin: 0 0 18px; }

/* Zeitslots nach Tageszeit gruppiert */
.zeitgruppe { margin-bottom: 22px; }
.zeitgruppe-kopf { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.zeitgruppe-kopf svg { width: 17px; height: 17px; color: var(--gedeckt); }
.zeitgruppe-kopf span { font-size: 14px; font-weight: 600; }
.zeitgruppe-kopf .anzahl { margin-left: auto; font-size: 12px; font-weight: 500; color: var(--leise); }
.slot-zeile {
  display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  padding: 14px 18px; min-height: 62px; margin-bottom: 8px;
  border-radius: var(--radius-m); background: var(--flaeche); box-shadow: var(--schatten);
}
.slot-zeile .zeit { font-family: var(--mono); font-size: 17px; font-weight: 500; letter-spacing: -0.02em; width: 62px; flex: none; }
.slot-zeile .lage { flex: 1; min-width: 0; font-size: 13px; color: var(--gedeckt); }
.slot-zeile .lage strong { display: block; font-size: 14px; font-weight: 600; color: var(--tinte); }
.slot-zeile .punkte { display: flex; gap: 4px; flex: none; }
.slot-zeile .punkte i { width: 7px; height: 7px; border-radius: 50%; background: var(--flaeche-still); }
.slot-zeile .punkte i.belegt { background: var(--daten); }
.slot-zeile[data-lage="duo"] .lage strong { color: var(--warnung); }
.slot-zeile[data-status="gesperrt"] { background: transparent; box-shadow: none; }
.slot-zeile[data-status="gesperrt"] .zeit, .slot-zeile[data-status="gesperrt"] .lage strong { color: var(--leise); }
.slot-zeile[data-status="gesperrt"] .punkte i.belegt { background: var(--voll); }
.slot-zeile[data-status="gesperrt"]:hover { background: rgba(255, 255, 255, 0.55); }
.slot-zeile[aria-pressed="true"] { background: var(--akzent); }
.slot-zeile[aria-pressed="true"] .zeit, .slot-zeile[aria-pressed="true"] .lage strong { color: var(--akzent-text); }
.slot-zeile[aria-pressed="true"] .lage { color: rgba(255, 255, 255, 0.62); }
.slot-zeile[aria-pressed="true"] .punkte i { background: rgba(255, 255, 255, 0.28); }
.slot-zeile[aria-pressed="true"] .punkte i.belegt { background: var(--akzent-text); }

/* Flächenkarte — zeigt, mit wem du auf der Fläche stehst */
.flaeche-karte { border-radius: var(--radius-l); padding: 22px 20px; background: var(--flaeche); box-shadow: var(--schatten); margin-top: 14px; }
.flaeche-aussage { font-size: 21px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.2; text-transform: lowercase; margin: 6px 0 4px; }
.flaeche-neben { font-size: 14px; color: var(--gedeckt); margin: 0 0 18px; }
.plaetze-reihe { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
.platz {
  border-radius: var(--radius-s); padding: 12px 6px 10px; text-align: center;
  background: var(--grund); min-height: 78px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
}
.platz .kopf {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600;
  background: var(--flaeche-still); color: var(--gedeckt);
}
.platz .wer { font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--leise); }
.platz-frei { background: transparent; box-shadow: inset 0 0 0 1.5px var(--flaeche-still); }
.platz-frei .kopf { background: transparent; box-shadow: inset 0 0 0 1.5px var(--flaeche-still); color: var(--leise); }
.platz-du { background: var(--akzent); }
.platz-du .kopf { background: rgba(255, 255, 255, 0.16); color: var(--akzent-text); }
.platz-du .wer { color: rgba(255, 255, 255, 0.72); }
.platz-mit .kopf { background: var(--daten); color: #22303C; }
.platz-mit .wer { color: var(--gedeckt); }
.platz .kopf svg { width: 15px; height: 15px; }
.platz-gebucht { background: var(--grund); box-shadow: inset 0 0 0 1.5px var(--tinte); }
.platz-gebucht .kopf { background: var(--tinte); color: var(--flaeche); }
.platz-gebucht .wer { color: var(--tinte); }

/* Exklusivbuchung */
.flaeche-exklusiv { box-shadow: 0 0 0 2px var(--tinte), var(--schatten); }
.exklusiv-schalter {
  display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  margin-top: 16px; padding: 14px 16px; border-radius: var(--radius-m);
  background: var(--grund); min-height: 66px;
}
.exklusiv-schalter:hover { background: var(--flaeche-still); }
.exklusiv-schalter .ex-icon {
  width: 34px; height: 34px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--flaeche-still); color: var(--gedeckt);
}
.exklusiv-schalter .ex-icon svg { width: 17px; height: 17px; }
.exklusiv-schalter .ex-txt { flex: 1; min-width: 0; line-height: 1.35; }
.exklusiv-schalter .ex-txt strong { display: block; font-size: 14px; font-weight: 600; }
.exklusiv-schalter .ex-txt span { font-size: 12px; color: var(--gedeckt); }
.exklusiv-schalter .ex-preis { font-size: 14px; font-weight: 600; flex: none; }
.exklusiv-schalter .ex-box {
  width: 24px; height: 24px; border-radius: 8px; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--flaeche); box-shadow: inset 0 0 0 1.5px var(--flaeche-still);
  font-size: 13px; font-weight: 700;
}
.exklusiv-schalter.an { background: var(--tinte); }
.exklusiv-schalter.an .ex-txt strong, .exklusiv-schalter.an .ex-preis { color: var(--flaeche); }
.exklusiv-schalter.an .ex-txt span { color: rgba(255, 255, 255, 0.66); }
.exklusiv-schalter.an .ex-icon { background: rgba(255, 255, 255, 0.16); color: var(--flaeche); }
.exklusiv-schalter.an .ex-box { background: var(--flaeche); color: var(--tinte); box-shadow: none; }
.exklusiv-plakette {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--tinte); color: var(--flaeche);
  border-radius: var(--radius-pill); padding: 5px 12px;
  font-size: 12px; font-weight: 600;
}
.exklusiv-plakette svg { width: 13px; height: 13px; }
.flaeche-trainerzeile { display: flex; align-items: center; gap: 10px; padding: 10px 0; }
.flaeche-trainerzeile + .flaeche-trainerzeile { border-top: 1px solid var(--flaeche-still); }
.flaeche-trainerzeile .txt { flex: 1; min-width: 0; }
.flaeche-trainerzeile .txt strong { display: block; font-size: 14px; font-weight: 600; }
.flaeche-trainerzeile .txt span { font-size: 12px; color: var(--gedeckt); }

/* Trainingsarten als Bildkacheln */
.arten-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.arten-kachel {
  display: flex; flex-direction: column; align-items: stretch;
  padding: 0; overflow: hidden; text-align: left;
  border-radius: var(--radius-l); background: var(--flaeche); box-shadow: var(--schatten);
}
.arten-kachel img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; background: var(--flaeche-still); }
.arten-kachel .arten-info { padding: 11px 14px 13px; }
.arten-kachel .arten-info strong { display: block; font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
.arten-kachel .arten-info span { font-size: 12px; color: var(--gedeckt); }
.arten-kachel:active { transform: scale(0.97); }

/* Ausgebuchte Trainer bleiben sichtbar, treten aber zurück */
.trainer-ausgebucht { opacity: 0.6; }
.chip-voll { background: var(--voll-flaeche); color: var(--voll); font-weight: 600; font-size: 12px; }

/* Studio-Galerie als Blog */
.blog-galerie { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
.blog-kachel { margin: 0; border-radius: var(--radius-l); overflow: hidden; background: var(--flaeche); box-shadow: var(--schatten); }
.blog-gross { grid-column: 1 / -1; }
.blog-kachel img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; background: var(--flaeche-still); }
.blog-gross img { aspect-ratio: 16 / 10; }
.blog-kachel figcaption { padding: 10px 14px 12px; }
.blog-kachel figcaption strong { display: block; font-size: 13px; font-weight: 600; }
.blog-kachel figcaption span { font-size: 12px; color: var(--gedeckt); line-height: 1.4; }

/* Tagesauslastung als Säulenband */
.flaeche-heute { margin-bottom: 12px; }
.fh-kopfzeile { display: flex; gap: 12px; margin: 4px 0 16px; }
.fh-jetzt, .fh-frei { flex: 1; background: var(--grund); border-radius: var(--radius-s); padding: 11px 13px; }
.fh-jetzt .zahl, .fh-frei .zahl { display: block; font-size: 21px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.15; }
.fh-jetzt .label, .fh-frei .label { font-size: 11px; color: var(--gedeckt); }
.fh-band { display: flex; gap: 3px; align-items: flex-end; }
.fh-saeule { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; }
.fh-stapel { display: flex; flex-direction: column; gap: 2px; width: 100%; }
.fh-stapel i {
  height: 11px; border-radius: 2px;
  background: var(--flaeche-still);
  transition: background 0.2s ease;
}
.fh-stapel i.voll { background: var(--daten); }
.fh-stapel i.voll.stufe-3 { background: var(--warnung); }
.fh-stapel i.voll.stufe-4 { background: var(--voll); }
.fh-stunde { font-size: 10px; color: var(--leise); min-height: 13px; }
.fh-saeule.vorbei { opacity: 0.32; }
.fh-saeule.aktuell .fh-stunde { color: var(--tinte); font-weight: 600; }
.fh-saeule.aktuell .fh-stapel { box-shadow: 0 0 0 2px var(--tinte); border-radius: 4px; padding: 2px; margin: -2px; }
.fh-tipp { font-size: 13px; color: var(--gedeckt); margin: 16px 0 0; line-height: 1.45; }

/* Studio-Infobereich */
.studio-hero { margin: 0 0 18px; border-radius: var(--radius-l); overflow: hidden; box-shadow: var(--schatten); }
.studio-hero img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; background: var(--flaeche-still); }
.stats-reihe { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0 24px; }
.stats-reihe .stat { background: var(--flaeche); border-radius: var(--radius-m); padding: 14px 8px 12px; text-align: center; box-shadow: var(--schatten); }
.stats-reihe .zahl { font-size: 23px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
.stats-reihe .label { font-size: 11px; color: var(--gedeckt); }
.zitat-bubble { background: var(--grund); border-radius: 16px; padding: 14px 16px; font-size: 14px; line-height: 1.5; margin-top: 14px; }
.slider { margin: 0 -20px; }
.slider-spur {
  display: flex; gap: 12px;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  padding: 2px 20px 10px;
  scrollbar-width: none;
}
.slider-spur::-webkit-scrollbar { display: none; }
.slider-spur .blog-kachel { flex: 0 0 82%; scroll-snap-align: center; }
.slider-punkte { display: flex; justify-content: center; gap: 6px; padding-top: 2px; }
.slider-punkte i { width: 6px; height: 6px; border-radius: 50%; background: var(--flaeche-still); transition: background 0.2s ease, width 0.2s ease; }
.slider-punkte i.an { width: 18px; border-radius: 3px; background: var(--tinte); }

/* Buchungsbestätigung mit animiertem Haken */
.erfolg-hintergrund {
  position: fixed; inset: 0; z-index: 90;
  background: rgba(15, 17, 19, 0.34);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: einblenden 0.18s ease;
}
.erfolg-karte {
  width: 100%; max-width: 320px;
  background: var(--flaeche); border-radius: 28px;
  padding: 36px 26px 28px; text-align: center;
  animation: modalauf 0.24s ease;
}
.haken { width: 86px; height: 86px; display: block; margin: 0 auto; }
.haken-kreis {
  fill: var(--frei-flaeche); stroke: var(--frei); stroke-width: 3;
  stroke-dasharray: 195; stroke-dashoffset: 195;
  transform: rotate(-90deg); transform-origin: center;
  animation: kreisZug 0.5s ease-out forwards;
}
.haken-zug {
  fill: none; stroke: var(--frei); stroke-width: 5;
  stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 48; stroke-dashoffset: 48;
  animation: hakenZug 0.35s ease-out 0.45s forwards;
}
@keyframes kreisZug { to { stroke-dashoffset: 0; } }
@keyframes hakenZug { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .haken-kreis, .haken-zug { animation: none; stroke-dashoffset: 0; }
}
.erfolg-details { margin: 6px 0 20px; }
.erfolg-details .zeile { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; font-size: 14px; }
.erfolg-details .zeile + .zeile { border-top: 1px solid var(--flaeche-still); }

/* Host-Passport für Trainerprofile (Airbnb-Muster) */
.passport-karte {
  display: flex; align-items: center; gap: 18px;
  border-radius: var(--radius-l); padding: 22px 20px; margin-bottom: 22px;
  background: var(--flaeche); box-shadow: 0 6px 20px rgba(15, 17, 19, 0.08);
}
.passport-links { flex: 1; min-width: 0; text-align: center; }
.passport-name { font-size: 27px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.05; margin-top: 10px; text-transform: lowercase; }
.passport-rolle { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; margin-top: 4px; }
.passport-rechts { width: 108px; flex: none; }
.passport-wert { text-align: left; padding: 8px 0; }
.passport-wert + .passport-wert { border-top: 1px solid var(--flaeche-still); }
.passport-wert .zahl { font-size: 21px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
.passport-wert .label { font-size: 11px; color: var(--gedeckt); }
.passport-zeile { display: flex; align-items: flex-start; gap: 14px; padding: 11px 0; font-size: 15px; }
.passport-zeile svg { width: 20px; height: 20px; flex: none; margin-top: 1px; color: var(--tinte); }
.passport-zeile .passport-text { flex: 1; min-width: 0; }

/* Slot-Kacheln (weiterhin für kompakte Ansichten) */
.slot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.slot-kachel {
  position: relative;
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  padding: 16px; min-height: 104px;
  border-radius: var(--radius-l); text-align: left;
  background: var(--flaeche);
  box-shadow: var(--schatten);
}
.slot-kachel .zeit { font-family: var(--mono); font-size: 19px; font-weight: 500; letter-spacing: -0.02em; }
.slot-kachel .slot-status { font-size: 13px; color: var(--gedeckt); }
.slot-kachel[data-status="frei"] .slot-status { color: var(--frei); }
.slot-kachel[data-status="knapp"] .slot-status { color: var(--warnung); }
.slot-kachel[data-status="gesperrt"] { background: transparent; box-shadow: none; }
.slot-kachel[data-status="gesperrt"] .zeit,
.slot-kachel[data-status="gesperrt"] .slot-status { color: var(--leise); }
.slot-kachel[data-status="gesperrt"]:hover { background: rgba(255, 255, 255, 0.55); }
.slot-kachel[aria-pressed="true"] {
  background: var(--akzent);
}
.slot-kachel[aria-pressed="true"] .zeit { color: var(--akzent-text); }
.slot-kachel[aria-pressed="true"] .slot-status { color: rgba(255, 255, 255, 0.7); }
.slot-kachel[aria-pressed="true"] .plaetze i { background: rgba(255, 255, 255, 0.28); }
.slot-kachel[aria-pressed="true"] .plaetze i.belegt { background: var(--akzent-text); }
.slot-kachel[aria-pressed="true"] .duo-tag { background: rgba(255, 255, 255, 0.18); color: var(--akzent-text); }
.plaetze { display: flex; gap: 5px; margin-top: auto; padding-top: 10px; }
.plaetze i { width: 7px; height: 7px; border-radius: 50%; background: var(--flaeche-still); }
.plaetze i.belegt { background: var(--daten); }
.slot-kachel[data-status="knapp"] .plaetze i.belegt { background: var(--warnung); }
.slot-kachel[data-voll="true"] .plaetze i.belegt { background: var(--voll); }
.duo-tag {
  position: absolute; top: 14px; right: 14px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 8px; border-radius: var(--radius-pill);
  background: var(--flaeche-still); color: var(--gedeckt);
}
.slot-grund { border-radius: var(--radius-l); padding: 18px 20px; margin-top: 14px; font-size: 14px; background: var(--flaeche); box-shadow: var(--schatten); }
.slot-grund .alternativen { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.slot-grund .alternativen button { background: var(--grund); font-size: 13px; padding: 9px 16px; min-height: 40px; }

/* Trainerkarten */
.trainer-karte { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
.trainer-kopf { display: flex; align-items: center; gap: 12px; }
.monogramm {
  width: 46px; height: 46px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 600; color: var(--tinte);
  background: var(--flaeche-still);
}
.monogramm-gross { width: 72px; height: 72px; font-size: 22px; }
.monogramm-klein { width: 36px; height: 36px; font-size: 13px; }
.monogramm-mini { width: 30px; height: 30px; font-size: 11px; }
.trainer-zeile { display: flex; align-items: center; gap: 12px; text-align: left; width: 100%; padding: 14px 16px; border-radius: var(--radius-l); background: var(--flaeche); min-height: 74px; box-shadow: var(--schatten); margin-bottom: 10px; }
.trainer-zeile .mitte { flex: 1; min-width: 0; }
.trainer-zeile .pfeil { color: var(--leise); font-size: 18px; }

/* Balken — Ampellogik für die Auslastung */
.balken { height: 6px; background: var(--flaeche-still); border-radius: 3px; overflow: hidden; }
.balken > div { height: 100%; background: var(--daten); border-radius: 3px; }
.balken-gruen > div { background: var(--frei); }
.balken-mittel > div { background: var(--warnung); }
.balken-voll > div { background: var(--voll); }

/* Termine */
.termin-zeile { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-radius: var(--radius-l); padding: 18px 20px; flex-wrap: wrap; background: var(--flaeche); box-shadow: var(--schatten); margin-bottom: 10px; }
.leer { border-radius: var(--radius-l); padding: 36px 24px; text-align: center; color: var(--gedeckt); background: var(--flaeche); box-shadow: var(--schatten); }

/* Dashboard */
.kpi-reihe { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.kpi { background: var(--flaeche); border-radius: var(--radius-l); padding: 18px; box-shadow: var(--schatten); }
.kpi .wert { font-family: var(--mono); font-size: 26px; font-weight: 500; letter-spacing: -0.02em; margin: 6px 0 0; }
.kpi .titel { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--leise); }
.session-karte { display: flex; gap: 16px; align-items: flex-start; padding: 20px; margin-bottom: 12px; }
.session-karte .zeit { font-family: var(--mono); font-size: 21px; font-weight: 500; flex: none; width: 74px; letter-spacing: -0.02em; }
.session-karte .name { font-size: 17px; font-weight: 600; }
.anfrage-zeile { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 18px 20px; flex-wrap: wrap; margin-bottom: 12px; }
.anfrage-zeile .aktionen { display: flex; gap: 10px; width: 100%; }
.anfrage-zeile .aktionen button { flex: 1; background: var(--grund); font-size: 14px; }

/* Wochenraster */
.scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -20px; padding: 0 20px; }
.wgrid { display: grid; grid-template-columns: 44px repeat(6, minmax(58px, 1fr)); gap: 4px; min-width: 460px; }
.wgrid .kopf { font-size: 11px; font-weight: 600; color: var(--leise); text-align: center; padding: 4px 0; }
.stunde-label { font-family: var(--mono); font-size: 11px; color: var(--leise); display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; }
.wzelle { position: relative; min-height: 42px; border-radius: 10px; background: var(--flaeche); overflow: hidden; }
.wzelle-ausserhalb { background: rgba(255, 255, 255, 0.4); }
.wzelle-heute { box-shadow: inset 0 0 0 1.5px var(--flaeche-still); }
.wzelle .fuellung { position: absolute; left: 0; right: 0; bottom: 0; background: var(--flaeche-still); }
.wzelle .eigene {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: var(--akzent); font-family: var(--mono); font-size: 11px; font-weight: 500; color: var(--akzent-text);
}
.wzelle .block-schraffur { position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent 0 4px, rgba(15, 17, 19, 0.09) 4px 8px); }
.wzelle .zahl { position: absolute; right: 5px; top: 3px; font-family: var(--mono); font-size: 10px; color: var(--gedeckt); }
.legende { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 16px; font-size: 12px; color: var(--gedeckt); }
.legende span { display: inline-flex; align-items: center; gap: 6px; }
.legende i { width: 12px; height: 12px; border-radius: 4px; background: var(--flaeche); display: inline-block; }

/* Verfügbarkeit */
.verf-grid { display: grid; grid-template-columns: 44px repeat(6, minmax(52px, 1fr)); gap: 4px; min-width: 460px; }
.verf-grid button { min-height: 42px; border-radius: 10px; font-family: var(--mono); font-size: 10px; padding: 2px; background: var(--flaeche); color: var(--gedeckt); }
.verf-grid button:disabled { background: rgba(255, 255, 255, 0.4); opacity: 1; color: var(--leise); }
.verf-grid .zellen-frei { color: var(--frei); background: var(--frei-flaeche); }
.verf-grid .block-an { background: var(--akzent); color: var(--akzent-text); }
.verf-grid .session { background: var(--flaeche-still); color: var(--tinte); }
.verf-zeiten { display: flex; flex-direction: column; gap: 10px; }
.verf-tag { display: flex; align-items: center; gap: 10px; }
.verf-tag .tag-name { width: 30px; font-size: 13px; font-weight: 600; }
.verf-tag select { min-height: 42px; padding: 8px 10px; font-size: 14px; }
.kontingent-stepper { display: flex; align-items: center; gap: 14px; }
.kontingent-stepper button { width: 46px; padding: 0; background: var(--grund); font-size: 20px; }
.kontingent-stepper .wert { font-family: var(--mono); font-size: 24px; font-weight: 500; min-width: 40px; text-align: center; }
.abschnitt { margin-bottom: 14px; }

/* Meldung */
.meldung { display: flex; flex-direction: column; gap: 12px; background: var(--flaeche); border-radius: var(--radius-l); padding: 18px 20px; margin-bottom: 12px; box-shadow: var(--schatten); }
.meldung button { align-self: flex-start; background: var(--grund); font-size: 14px; min-height: 40px; padding: 9px 18px; }
.fehler { color: var(--voll); font-size: 14px; }

/* Über-Sektion */
.stat-karte { border-radius: var(--radius-l); padding: 24px 22px; margin-bottom: 12px; background: var(--flaeche); box-shadow: var(--schatten); }
.stat-wert { font-size: 40px; font-weight: 700; letter-spacing: -0.035em; line-height: 1; text-transform: lowercase; }
.stat-text { margin: 10px 0 0; font-size: 14px; line-height: 1.45; color: var(--gedeckt); }

/* Bottom-Navigation */
.tabbar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; z-index: 60;
  display: flex; align-items: center;
  background: var(--grund);
  padding: 10px 14px calc(12px + env(safe-area-inset-bottom));
}
.tabbar::before { content: ''; position: absolute; top: -24px; left: 0; right: 0; height: 24px; background: linear-gradient(to top, var(--grund), transparent); pointer-events: none; }
.tabbar button {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: transparent; border-radius: var(--radius-s); padding: 4px 2px; min-height: 48px;
  font-size: 10px; font-weight: 500; color: var(--leise);
}
.tabbar button:hover { background: transparent; color: var(--gedeckt); }
.tabbar button[aria-selected="true"] { color: var(--tinte); font-weight: 600; }
.tabbar svg { width: 21px; height: 21px; }
.tabbar .fab {
  flex: none; width: 54px; height: 54px; border-radius: 50%;
  background: var(--akzent); color: var(--akzent-text);
  display: flex; align-items: center; justify-content: center; gap: 0;
  margin: 0 6px; padding: 0; min-height: 54px; font-size: 0;
}
.tabbar .fab:hover { background: #24282C; }
.tabbar .fab svg { width: 24px; height: 24px; }

/* Modal */
.modal-hintergrund {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(15, 17, 19, 0.32);
  display: flex; align-items: flex-end; justify-content: center;
  animation: einblenden 0.18s ease;
}
.modal {
  width: 100%; max-width: 430px; max-height: 88vh; overflow-y: auto;
  position: relative;
  border-radius: 28px 28px 0 0;
  padding: 26px 22px calc(26px + env(safe-area-inset-bottom));
  animation: modalauf 0.22s ease;
}
@keyframes modalauf { from { transform: translateY(24px); opacity: 0.6; } to { transform: none; opacity: 1; } }
.modal-griff { width: 38px; height: 4px; border-radius: 2px; background: var(--flaeche-still); margin: 0 auto 18px; }
.modal-kopf { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.modal-schliessen { position: absolute; top: 20px; right: 20px; width: 34px; height: 34px; padding: 0; border-radius: 50%; background: var(--grund); display: flex; align-items: center; justify-content: center; font-size: 15px; min-height: 34px; }

/* Splashscreen — dunkler Aurora-Verlauf, Logo steigt sanft auf.
   Orientiert an Opal: Vollbild, ein zentriertes Zeichen, sonst nichts. */
.splash {
  position: fixed; top: 0; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  background: #07080A;
  overflow: hidden;
}
/* Während des Ausblendens sollen Tipps schon die App erreichen */
.splash-aus { animation: splashRaus 0.62s cubic-bezier(0.4, 0, 0.2, 1) forwards; pointer-events: none; }
@keyframes splashRaus { to { opacity: 0; visibility: hidden; } }
.splash-aurora {
  position: absolute; inset: -25%;
  background:
    radial-gradient(40% 42% at 26% 30%, rgba(96, 148, 255, 0.95), transparent 64%),
    radial-gradient(36% 38% at 74% 64%, rgba(214, 118, 236, 0.85), transparent 64%),
    radial-gradient(48% 50% at 66% 20%, rgba(64, 216, 208, 0.7), transparent 66%),
    radial-gradient(42% 44% at 30% 76%, rgba(255, 156, 112, 0.62), transparent 64%);
  filter: blur(58px) saturate(1.25);
  animation: auroraWabern 13s ease-in-out infinite;
}
@keyframes auroraWabern {
  0%   { transform: scale(1) rotate(0deg) translate3d(0, 0, 0); opacity: 0.85; }
  33%  { transform: scale(1.18) rotate(42deg) translate3d(3%, -4%, 0); opacity: 1; }
  66%  { transform: scale(1.08) rotate(-28deg) translate3d(-4%, 3%, 0); opacity: 0.92; }
  100% { transform: scale(1) rotate(0deg) translate3d(0, 0, 0); opacity: 0.85; }
}
/* Vignette legt sich über die Aurora, damit das Logo klar steht */
.splash-vignette {
  position: absolute; inset: 0;
  background:
    radial-gradient(56% 44% at 50% 50%, rgba(7, 8, 10, 0.5) 0%, rgba(7, 8, 10, 0.3) 42%, rgba(7, 8, 10, 0.1) 72%, transparent 100%),
    radial-gradient(80% 64% at 50% 50%, transparent 40%, rgba(7, 8, 10, 0.42) 78%, rgba(7, 8, 10, 0.86) 100%);
}
.splash-mitte { position: relative; display: flex; flex-direction: column; align-items: center; }
.splash-logo {
  width: 116px; height: 116px;
  /* Das Logo ist schwarz auf weiß. Invertiert plus screen blendet das
     Weiß zu Schwarz und lässt den Untergrund durch, das Zeichen bleibt hell. */
  filter: invert(1);
  mix-blend-mode: screen;
  animation: logoAuf 1.15s cubic-bezier(0.16, 1, 0.3, 1) both, logoAtmen 3.4s ease-in-out 1.15s infinite;
}
@keyframes logoAuf {
  0%   { opacity: 0; transform: scale(0.82); filter: invert(1) blur(9px); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: scale(1); filter: invert(1) blur(0); }
}
@keyframes logoAtmen {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.035); }
}
/* Weicher Lichtschein hinter dem Logo */
.splash-schein {
  position: absolute; top: 50%; left: 50%; width: 250px; height: 250px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.08) 42%, transparent 68%);
  animation: scheinPuls 3.4s ease-in-out infinite;
  pointer-events: none;
}
@keyframes scheinPuls {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 0.9; transform: translate(-50%, -50%) scale(1.14); }
}
.splash-ladebalken {
  position: absolute; bottom: calc(56px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%);
  width: 116px; height: 2px; border-radius: 1px;
  background: rgba(255, 255, 255, 0.14);
  overflow: hidden;
}
.splash-ladebalken i {
  display: block; height: 100%; width: 100%; border-radius: 1px;
  background: rgba(255, 255, 255, 0.85);
  transform-origin: left center;
  animation: ladeZug 2.05s cubic-bezier(0.5, 0, 0.2, 1) forwards;
}
@keyframes ladeZug { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) {
  .splash-aurora, .splash-schein { animation: none; }
  .splash-logo { animation: none; opacity: 1; }
  .splash-ladebalken i { animation: none; transform: scaleX(1); }
}

/* Zugang */
.zugang-hero { padding: 40px 0 30px; text-align: center; }
.zugang-hero h1 { font-size: 40px; margin-bottom: 10px; }
.zugang-hero .unterzeile { color: var(--gedeckt); font-size: 15px; max-width: 280px; margin: 0 auto; }
.schritt-kopf { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.zurueck-knopf { width: 38px; height: 38px; min-height: 38px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 17px; flex: none; }
.fortschritt { display: flex; gap: 5px; margin-bottom: 20px; }
.fortschritt i { flex: 1; height: 3px; border-radius: 2px; background: var(--flaeche-still); }
.fortschritt i.aktiv { background: var(--tinte); }
`

/* ----------------------------------------------------------------------------
   7. REACT-KOMPONENTEN
---------------------------------------------------------------------------- */

/* Splashscreen. Läuft einmal beim Start, blendet sich selbst aus und meldet
   das Ende über onFertig. Reagiert auf reduzierte Bewegung, dann verkürzt. */
function Splash({ onFertig }) {
  const [geht, setGeht] = useState(false)

  useEffect(() => {
    const knapp = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const halten = knapp ? 700 : 2150
    const raus = setTimeout(() => setGeht(true), halten)
    const weg = setTimeout(() => onFertig(), halten + 620)
    return () => {
      clearTimeout(raus)
      clearTimeout(weg)
    }
  }, [onFertig])

  return (
    <div className={'splash' + (geht ? ' splash-aus' : '')} role="status" aria-label="BetterDayz wird geladen">
      <div className="splash-aurora" aria-hidden="true" />
      <div className="splash-vignette" aria-hidden="true" />
      <div className="splash-mitte">
        <div className="splash-schein" aria-hidden="true" />
        <img className="splash-logo" src={LOGO_DATA_URI} alt="BetterDayz" width="116" height="116" />
      </div>
      <div className="splash-ladebalken" aria-hidden="true">
        <i />
      </div>
    </div>
  )
}

/* Dünne Strich-Icons im stoic-Stil */
function Icon({ name }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true }
  if (name === 'start')
    return (
      <svg {...p}>
        <path d="M4 11 12 4l8 7" />
        <path d="M6 10v9h12v-9" />
      </svg>
    )
  if (name === 'termine')
    return (
      <svg {...p}>
        <rect x="4" y="5" width="16" height="16" rx="4" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    )
  if (name === 'trainer')
    return (
      <svg {...p}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
      </svg>
    )
  if (name === 'studio')
    return (
      <svg {...p}>
        <path d="M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10" />
      </svg>
    )
  if (name === 'plus')
    return (
      <svg {...p} strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  if (name === 'heute')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="3.6" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
    )
  if (name === 'woche')
    return (
      <svg {...p}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </svg>
    )
  if (name === 'sessions')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2.5" />
      </svg>
    )
  if (name === 'zeiten')
    return (
      <svg {...p}>
        <path d="M4 7h16M4 12h16M4 17h16" />
        <circle cx="9" cy="7" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="7" cy="17" r="1.8" fill="currentColor" stroke="none" />
      </svg>
    )
  if (name === 'sonnenaufgang')
    return (
      <svg {...p}>
        <path d="M12 4v3M5.6 7.6l2.1 2.1M2.5 14h2M19.5 14h2M16.3 9.7l2.1-2.1" />
        <path d="M7.5 14a4.5 4.5 0 0 1 9 0" />
        <path d="M2.5 18h19" />
      </svg>
    )
  if (name === 'sonne')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
    )
  if (name === 'mond')
    return (
      <svg {...p}>
        <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2Z" />
      </svg>
    )
  if (name === 'medaille')
    return (
      <svg {...p}>
        <circle cx="12" cy="14.5" r="5.5" />
        <path d="M8.5 9 6 2.5h12L15.5 9" />
      </svg>
    )
  if (name === 'ziel')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    )
  if (name === 'urkunde')
    return (
      <svg {...p}>
        <path d="M6 3h12v13l-6 3-6-3V3Z" />
        <path d="M9.5 9.5 11 11l3.5-3.5" />
      </svg>
    )
  if (name === 'hantel')
    return (
      <svg {...p}>
        <path d="M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10" />
      </svg>
    )
  if (name === 'schloss')
    return (
      <svg {...p}>
        <rect x="5" y="10.5" width="14" height="10" rx="3" />
        <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
      </svg>
    )
  if (name === 'zitat')
    return (
      <svg {...p}>
        <path d="M9.5 6.5C7 7.6 5.5 10 5.5 12.8c0 2.2 1.3 3.7 3.1 3.7 1.6 0 2.8-1.2 2.8-2.8 0-1.5-1.1-2.7-2.6-2.7-.3 0-.6 0-.8.1.3-1.4 1.3-2.6 2.6-3.3l-1.1-1.3Z" />
        <path d="M18 6.5c-2.5 1.1-4 3.5-4 6.3 0 2.2 1.3 3.7 3.1 3.7 1.6 0 2.8-1.2 2.8-2.8 0-1.5-1.1-2.7-2.6-2.7-.3 0-.6 0-.8.1.3-1.4 1.3-2.6 2.6-3.3L18 6.5Z" />
      </svg>
    )
  return null
}

/* Auslastung mit Ampelfarbe. Grün heißt viel frei, Amber wird eng,
   Rot ist voll — die Farbe sagt es schneller als jede Zahl. */
function Auslastungsbalken({ wert, maximum }) {
  const anteil = maximum > 0 ? Math.min(1, wert / maximum) : 0
  const stufe = anteil >= 1 ? 'voll' : anteil >= 0.6 ? 'mittel' : 'gruen'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="hinweis-klein">Auslastung diese Woche</span>
        <span className="mono hinweis-klein">
          {wert}/{maximum} · {Math.round(anteil * 100)}%
        </span>
      </div>
      <div className={'balken balken-' + stufe} role="img" aria-label={`Auslastung ${wert} von ${maximum} Sessions, ${Math.round(anteil * 100)} Prozent`}>
        <div style={{ width: anteil * 100 + '%' }} />
      </div>
    </div>
  )
}

/* Wochenleiste im stoic-Stil. Häkchen steht für einen Tag mit Termin. */
function Wochenleiste({ woche, aktiv, onWahl, markierteTage }) {
  return (
    <div className="wochenleiste" role="tablist" aria-label="Wochentag wählen">
      {woche.tage.map((t) => (
        <button
          key={t.index}
          role="tab"
          className={'wochentag' + (t.index === woche.heuteIndex ? ' wochentag-heute' : '')}
          aria-selected={aktiv === t.index}
          onClick={() => onWahl(t.index)}
        >
          <span className="kuerzel">{t.label}</span>
          <span className={'mark' + (markierteTage.includes(t.index) ? ' erfuellt' : '')}>{markierteTage.includes(t.index) ? '✓' : t.tagZahl}</span>
        </button>
      ))}
    </div>
  )
}

/* Studiofotos als Blog-Galerie. Fehlende Dateien blenden ihre Kachel aus,
   sobald ein Foto in public/studio/ liegt, erscheint es automatisch. */
/* Studiofotos. Liegt die Datei in public/studio, wird sie gezeigt, sonst
   springt ein Platzhalter ein — so ist der Slider immer vollständig. */
const STUDIO_BILDER = [
  {
    datei: 'kraftbereich.png',
    titel: 'Kraftbereich',
    text: 'Langhanteln, Racks und Platz zum schweren Heben.',
    ersatz: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=70',
  },
  {
    datei: 'flaeche.jpg',
    titel: 'Die Fläche',
    text: 'Kunstrasen, Tageslicht und Platz für höchstens vier Kunden gleichzeitig.',
    ersatz: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=700&q=70',
  },
  {
    datei: 'boxing.jpg',
    titel: 'Boxing-Ecke',
    text: 'Am schweren Sack arbeiten wir an Technik, Timing und Schlagkraft.',
    ersatz: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=700&q=70',
  },
  {
    datei: 'airbike.jpg',
    titel: 'Airbike',
    text: 'Das ehrlichste Konditionsgerät im Haus, jede Sekunde zählt.',
    ersatz: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=700&q=70',
  },
  {
    datei: 'rack.jpg',
    titel: 'Functional Rack',
    text: 'Züge, Klimmzüge und Kabelarbeit für sauberen Kraftaufbau.',
    ersatz: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=700&q=70',
  },
  {
    datei: 'athletik.jpg',
    titel: 'Athletikfläche',
    text: 'Medizinbälle, Balance und Stabilität für dein Fundament.',
    ersatz: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=700&q=70',
  },
]

function BlogBild({ datei, titel, text, ersatz }) {
  const [quelle, setQuelle] = useState('/studio/' + datei)
  return (
    <figure className="blog-kachel">
      <img src={quelle} alt={titel} loading="lazy" onError={() => quelle !== ersatz && setQuelle(ersatz)} />
      <figcaption>
        <strong>{titel}</strong>
        <span>{text}</span>
      </figcaption>
    </figure>
  )
}

/* Wischbarer Bilderstreifen mit Fangpunkten und Positionsanzeige */
function StudioSlider({ bilder }) {
  const [aktiv, setAktiv] = useState(0)
  const beimScrollen = (e) => {
    const spur = e.currentTarget
    const kind = spur.firstElementChild
    if (!kind) return
    const schritt = kind.getBoundingClientRect().width + 12
    setAktiv(Math.min(bilder.length - 1, Math.max(0, Math.round(spur.scrollLeft / schritt))))
  }
  return (
    <div className="slider">
      <div className="slider-spur" onScroll={beimScrollen}>
        {bilder.map((b) => (
          <BlogBild key={b.datei} {...b} />
        ))}
      </div>
      <div className="slider-punkte" aria-hidden="true">
        {bilder.map((b, i) => (
          <i key={b.datei} className={i === aktiv ? 'an' : ''} />
        ))}
      </div>
    </div>
  )
}

/* Tagesauslastung des Studios als Säulenband. Jede Stunde eine Säule aus
   vier Segmenten, ein Segment ist ein Platz. Die aktuelle Stunde ist
   markiert, darunter der ruhigste Zeitraum als Empfehlung. */
function FlaecheHeute({ woche, buchungen, jetztStunde }) {
  const heute = woche.heuteIndex
  const werte = STUNDEN.map((h) => ({
    stunde: h,
    belegt: heute < 0 ? 0 : buchungenImSlot(buchungen, heute, h).length,
    vorbei: heute >= 0 && h <= jetztStunde,
  }))
  const kommend = werte.filter((w) => !w.vorbei)
  const gesamtFrei = kommend.reduce((s, w) => s + (MAX_KUNDEN_PRO_SLOT - w.belegt), 0)
  const ruhigste = kommend.filter((w) => w.belegt === 0).map((w) => w.stunde)
  const jetzt = werte.find((w) => w.stunde === jetztStunde)

  return (
    <div className="karte flaeche-heute">
      <div className="karten-kopf">
        <span className="kicker">Fläche heute</span>
        <span className="zeitstempel">max {MAX_KUNDEN_PRO_SLOT} gleichzeitig</span>
      </div>

      <div className="fh-kopfzeile">
        <div className="fh-jetzt">
          <span className="zahl mono">{heute < 0 ? '—' : `${jetzt ? jetzt.belegt : 0}/${MAX_KUNDEN_PRO_SLOT}`}</span>
          <span className="label">gerade auf der Fläche</span>
        </div>
        <div className="fh-frei">
          <span className="zahl mono">{gesamtFrei}</span>
          <span className="label">freie Plätze heute</span>
        </div>
      </div>

      <div className="fh-band" role="img" aria-label={`Auslastung heute, ${gesamtFrei} freie Plätze in den kommenden Stunden`}>
        {werte.map((w) => (
          <div key={w.stunde} className={'fh-saeule' + (w.vorbei ? ' vorbei' : '') + (w.stunde === jetztStunde ? ' aktuell' : '')} title={`${stundeLabel(w.stunde)} · ${w.belegt} von ${MAX_KUNDEN_PRO_SLOT}`}>
            <span className="fh-stapel">
              {[3, 2, 1, 0].map((i) => (
                <i key={i} className={i < w.belegt ? 'voll stufe-' + w.belegt : ''} />
              ))}
            </span>
            <span className="fh-stunde mono">{w.stunde % 3 === 1 || w.stunde === jetztStunde ? String(w.stunde).padStart(2, '0') : ''}</span>
          </div>
        ))}
      </div>

      <p className="fh-tipp">
        {heute < 0
          ? 'Heute hat das Studio geschlossen.'
          : ruhigste.length > 0
            ? `Am ruhigsten wird es um ${stundeLabel(ruhigste[0])} — da hast du die Fläche noch für dich.`
            : 'Heute ist überall etwas los. Schau auf morgen für ruhigere Zeiten.'}
      </p>
    </div>
  )
}

/* Flächenkarte — das Kernstück beim Buchen.
   Beantwortet in einem Blick: trainiere ich allein mit meinem Trainer oder
   zu zweit, wer steht sonst auf der Fläche und wie viel Platz bleibt.
   Die vier Plätze des Studios sind einzeln sichtbar, jeder mit dem Trainer,
   zu dem er gehört. Der eigene Platz ist hervorgehoben. */
function FlaechenKarte({ buchungen, trainerListe, tag, stunde, eigenerTrainerId, kundeKuerzel, onProfil, exklusiv = false, onExklusiv = null }) {
  const f = analysiereFlaeche({ buchungen, trainerListe, tag, stunde, eigenerTrainerId, exklusivGewaehlt: exklusiv })
  const meinTrainer = trainerListe.find((t) => t.id === eigenerTrainerId) || null

  const plaetze = [{ art: 'du', trainer: meinTrainer }]
  f.proTrainer.forEach(({ trainer, kunden }) => {
    for (let i = 0; i < kunden; i += 1) plaetze.push({ art: 'mit', trainer })
  })
  while (plaetze.length < MAX_KUNDEN_PRO_SLOT) plaetze.push({ art: exklusiv ? 'gebucht' : 'frei', trainer: null })

  return (
    <div className={'flaeche-karte' + (exklusiv ? ' flaeche-exklusiv' : '')}>
      <span className="kicker">Deine Fläche um {stundeLabel(stunde)}</span>
      <h3 className="flaeche-aussage">{flaechenAussage(f, meinTrainer && meinTrainer.name)}</h3>
      <p className="flaeche-neben">{flaechenNebentext(f, meinTrainer && meinTrainer.name)}</p>

      <div className="plaetze-reihe" role="img" aria-label={`${f.belegt + 1} von ${MAX_KUNDEN_PRO_SLOT} Plätzen belegt, ${f.frei - 1} bleiben frei`}>
        {plaetze.slice(0, MAX_KUNDEN_PRO_SLOT).map((p, i) => (
          <div key={i} className={'platz platz-' + p.art}>
            <span className="kopf" aria-hidden="true">
              {p.art === 'du' ? kundeKuerzel : p.art === 'mit' ? <Icon name="trainer" /> : p.art === 'gebucht' ? <Icon name="schloss" /> : '·'}
            </span>
            <span className="wer">
              {p.art === 'du' ? 'du' : p.art === 'mit' ? 'bei ' + p.trainer.name.split(' ')[0] : p.art === 'gebucht' ? 'gebucht' : 'frei'}
            </span>
          </div>
        ))}
      </div>

      <span className="kicker">Trainer auf der Fläche</span>
      {meinTrainer && (
        <button className="flaeche-trainerzeile" onClick={() => onProfil(meinTrainer.id)} aria-haspopup="dialog" style={{ background: 'transparent', width: '100%', padding: '10px 0', minHeight: 0, borderRadius: 0 }}>
          <span className="monogramm monogramm-mini" aria-hidden="true">
            {meinTrainer.monogramm}
          </span>
          <span className="txt" style={{ textAlign: 'left' }}>
            <strong>{meinTrainer.name}</strong>
            <span>{f.duo ? 'betreut dich und einen weiteren Kunden' : 'betreut nur dich'}</span>
          </span>
          <span className="pfeil" style={{ color: 'var(--leise)' }}>
            ›
          </span>
        </button>
      )}
      {f.proTrainer
        .filter((x) => x.trainer.id !== eigenerTrainerId)
        .map(({ trainer, kunden }) => (
          <button
            key={trainer.id}
            className="flaeche-trainerzeile"
            onClick={() => onProfil(trainer.id)}
            aria-haspopup="dialog"
            style={{ background: 'transparent', width: '100%', padding: '10px 0', minHeight: 0, borderRadius: 0 }}
          >
            <span className="monogramm monogramm-mini" aria-hidden="true">
              {trainer.monogramm}
            </span>
            <span className="txt" style={{ textAlign: 'left' }}>
              <strong>{trainer.name}</strong>
              <span>{kunden === 1 ? 'betreut einen Kunden' : `betreut ${kunden} Kunden`}</span>
            </span>
            <span className="pfeil" style={{ color: 'var(--leise)' }}>
              ›
            </span>
          </button>
        ))}
      {f.proTrainer.filter((x) => x.trainer.id !== eigenerTrainerId).length === 0 && !meinTrainer && (
        <p className="hinweis-klein" style={{ margin: 0 }}>
          Noch niemand gebucht.
        </p>
      )}
      {f.belegt > 0 && (
        <p className="hinweis-klein" style={{ margin: '12px 0 0' }}>
          Andere Kunden siehst du anonym, ihre Namen bleiben privat.
        </p>
      )}

      {/* Exklusiv steht nur zur Wahl, solange der Slot leer ist */}
      {onExklusiv && f.exklusivMoeglich && (
        <button className={'exklusiv-schalter' + (exklusiv ? ' an' : '')} onClick={() => onExklusiv(!exklusiv)} aria-pressed={exklusiv}>
          <span className="ex-icon" aria-hidden="true">
            <Icon name="schloss" />
          </span>
          <span className="ex-txt">
            <strong>Fläche nur für dich</strong>
            <span>Die drei anderen Plätze bleiben leer, niemand kann dazubuchen.</span>
          </span>
          <span className="ex-preis mono">+{EXKLUSIV_AUFPREIS} €</span>
          <span className="ex-box" aria-hidden="true">
            {exklusiv ? '✓' : ''}
          </span>
        </button>
      )}
    </div>
  )
}

/* Trainerprofil als Passport-Bottom-Sheet (Airbnb-Muster).
   Kopfkarte mit Monogramm, Name und drei Kennzahlen, darunter das Profil
   als Zeilen mit Icon — so lässt es sich zeilenweise überfliegen. */
function TrainerModal({ trainer, buchungen, onClose }) {
  if (!trainer) return null
  const sessions = wochenSessions(buchungen, trainer.id)
  const arten = TRAININGSARTEN.filter((a) => trainer.arten.includes(a.id))
  const auslastung = Math.round((sessions / Math.max(1, trainer.kontingent)) * 100)
  const zeilen = [
    { icon: 'ziel', inhalt: <>Schwerpunkte: {trainer.schwerpunkte.join(', ')}</> },
    { icon: 'hantel', inhalt: <>Bietet an: {arten.map((a) => `${a.name} (${euro(a.preis)})`).join(', ')}</> },
    { icon: 'urkunde', inhalt: <>Zertifikate: {trainer.zertifikate.join(', ')}</> },
    { icon: 'sessions', inhalt: <>Diese Woche: {sessions} von {trainer.kontingent} Sessions vergeben</> },
    { icon: 'zitat', inhalt: trainer.philosophie },
  ]
  return (
    <div className="modal-hintergrund" onClick={onClose} role="presentation">
      <div className="modal karte" role="dialog" aria-modal="true" aria-label={'Profil von ' + trainer.name} onClick={(e) => e.stopPropagation()}>
        <div className="modal-griff" />
        <button className="modal-schliessen" onClick={onClose} aria-label="Profil schließen">
          ✕
        </button>

        <div className="passport-karte">
          <div className="passport-links">
            <span className="monogramm monogramm-gross" aria-hidden="true" style={{ margin: '0 auto' }}>
              {trainer.monogramm}
            </span>
            <div className="passport-name">{trainer.name.split(' ')[0].toLowerCase()}</div>
            <div className="passport-rolle">
              <Icon name="medaille" />
              {trainer.herkunft}
            </div>
          </div>
          <div className="passport-rechts">
            <div className="passport-wert">
              <div className="zahl">{trainer.erfahrung}</div>
              <div className="label">Jahre Erfahrung</div>
            </div>
            <div className="passport-wert">
              <div className="zahl">{auslastung}%</div>
              <div className="label">Auslastung</div>
            </div>
            <div className="passport-wert">
              <div className="zahl">{Math.max(0, trainer.kontingent - sessions)}</div>
              <div className="label">Slots frei</div>
            </div>
          </div>
        </div>

        {zeilen.map((z, i) => (
          <div className="passport-zeile" key={i}>
            <Icon name={z.icon} />
            <span className="passport-text">{z.inhalt}</span>
          </div>
        ))}

        <div style={{ marginTop: 18 }}>
          <Auslastungsbalken wert={sessions} maximum={trainer.kontingent} />
        </div>
      </div>
    </div>
  )
}

/* ————— Kundenansicht ————— */

function KundenAnsicht(props) {
  const { woche, jetzt, trainerListe, buchungen, kunden, meldungen, aktionen } = props
  const [tab, setTab] = useState('start') // start | termine | trainer | studio
  const [flow, setFlow] = useState(null) // null | training | trainer | termin | checkout
  const [codeEingabe, setCodeEingabe] = useState('')
  const [codeFehler, setCodeFehler] = useState(false)
  const [kundeId, setKundeId] = useState(null)
  const [artId, setArtId] = useState(null)
  const [praeferenzTrainerId, setPraeferenzTrainerId] = useState(null)
  const [ohnePraeferenz, setOhnePraeferenz] = useState(false)
  const [selTag, setSelTag] = useState(Math.max(0, woche.heuteIndex))
  const [auswahl, setAuswahl] = useState(null)
  const [offenerGrund, setOffenerGrund] = useState(null)
  const [modalTrainerId, setModalTrainerId] = useState(null)
  const [erfolg, setErfolg] = useState(null) // Daten der eben bestätigten Buchung
  const [exklusiv, setExklusiv] = useState(false) // Fläche allein gebucht

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
      setTab('start')
    } else {
      setCodeFehler(true)
    }
  }

  const starteFlow = () => {
    setArtId(null)
    setPraeferenzTrainerId(null)
    setOhnePraeferenz(false)
    setAuswahl(null)
    setOffenerGrund(null)
    setFlow('training')
  }

  const waehleArt = (id) => {
    setArtId(id)
    setPraeferenzTrainerId(null)
    setOhnePraeferenz(false)
    setAuswahl(null)
    setOffenerGrund(null)
    setFlow('trainer')
  }

  const waehleTrainer = (id) => {
    setPraeferenzTrainerId(id)
    setOhnePraeferenz(id === null)
    setAuswahl(null)
    setOffenerGrund(null)
    setFlow('termin')
  }

  const buchen = () => {
    const exklusivJetzt = exklusiv && kannExklusivBuchen(buchungen, auswahl.tag, auswahl.stunde)
    const preis = art.preis + (exklusivJetzt ? EXKLUSIV_AUFPREIS : 0)
    aktionen.buche({
      kundeId,
      trainerId: auswahl.trainerId,
      artId,
      tag: auswahl.tag,
      stunde: auswahl.stunde,
      preis,
      exklusiv: exklusivJetzt,
    })
    setErfolg({ tag: auswahl.tag, stunde: auswahl.stunde, trainerId: auswahl.trainerId, artId, exklusiv: exklusivJetzt, preis })
    setAuswahl(null)
    setExklusiv(false)
    setFlow(null)
  }

  const engineKontext = { trainerListe, buchungen, kundeId, jetztTag: woche.jetztTag, jetztStunde: woche.jetztStunde }

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

  /* Freie Zeiten je Wochentag, für die Punkte in der Tagesleiste */
  const freiProTag = useMemo(() => {
    if (!art) return woche.tage.map(() => 0)
    if (!ohnePraeferenz && !praeferenzTrainerId) return woche.tage.map(() => 0)
    return woche.tage.map((t) =>
      STUNDEN.reduce((summe, stunde) => {
        const r = ohnePraeferenz
          ? bewerteSlotOhnePraeferenz({ ...engineKontext, artId, tag: t.index, stunde })
          : pruefeSlot({
              trainer: trainerById(praeferenzTrainerId),
              tag: t.index,
              stunde,
              buchungen,
              kundeId,
              jetztTag: woche.jetztTag,
              jetztStunde: woche.jetztStunde,
            })
        return summe + (r.status === 'frei' || r.status === 'knapp' ? 1 : 0)
      }, 0),
    )
  }, [art, artId, ohnePraeferenz, praeferenzTrainerId, buchungen, kundeId, trainerListe, woche])

  const meineTermine = buchungen
    .filter((b) => b.kundeId === kundeId && b.status !== 'storniert')
    .sort((a, b) => a.tag - b.tag || a.stunde - b.stunde)
  const meineAktiven = meineTermine.filter(istAktiveBuchung)
  const naechster = meineAktiven.find((b) => woche.jetztTag < 0 || b.tag > woche.jetztTag || (b.tag === woche.jetztTag && b.stunde > woche.jetztStunde)) || null
  const markierteTage = [...new Set(meineAktiven.map((b) => b.tag))]

  const belegungAuswahl = auswahl ? buchungenImSlot(buchungen, auswahl.tag, auswahl.stunde).length : 0
  const wunschTrainer = !ohnePraeferenz && praeferenzTrainerId ? trainerById(praeferenzTrainerId) : null

  /* ————— Zugang ————— */
  if (!kunde) {
    return (
      <div className="schritt-einblendung">
        <div className="zugang-hero">
          <h1>betterdayz.</h1>
          <p className="unterzeile">Fünf Trainer, eine kleine Fläche und Termine, die wirklich dir gehören.</p>
        </div>
        <div className="karte">
          <span className="kicker">Zugang</span>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>dein code.</h2>
          <p className="gedeckt" style={{ fontSize: 14 }}>
            BetterDayz ist ein geschlossenes Studio. Gib den Code ein, den du von uns persönlich erhalten hast.
          </p>
          <form onSubmit={anmelden} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <input
              id="zugangscode"
              type="text"
              value={codeEingabe}
              onChange={(e) => setCodeEingabe(e.target.value)}
              placeholder="GRANIT-24"
              autoComplete="off"
              aria-label="Dein Zugangscode"
              aria-invalid={codeFehler}
              aria-describedby={codeFehler ? 'code-fehler' : undefined}
            />
            {codeFehler && (
              <p className="fehler" id="code-fehler" role="alert" style={{ margin: 0 }}>
                Dieser Code ist nicht gültig. Prüfe die Schreibweise oder melde dich im Studio, dort bekommst du deinen persönlichen Zugang.
              </p>
            )}
            <button type="submit" className="knopf-primaer">
              Studio betreten
            </button>
          </form>
        </div>
        <p className="hinweis-klein" style={{ textAlign: 'center', marginTop: 18 }}>
          Testcodes GRANIT-24, ANKER-58 und KOMPASS-11
        </p>
      </div>
    )
  }

  /* ————— Buchungsflow als Vollbild über den Tabs ————— */
  if (flow) {
    const stufe = { training: 0, trainer: 1, termin: 2, checkout: 3 }[flow]
    const zurueck = () => {
      if (flow === 'training') setFlow(null)
      if (flow === 'trainer') setFlow('training')
      if (flow === 'termin') setFlow('trainer')
      if (flow === 'checkout') setFlow('termin')
    }
    return (
      <div className="schritt-einblendung">
        <div className="schritt-kopf">
          <button className="zurueck-knopf" onClick={zurueck} aria-label="Zurück">
            ‹
          </button>
          <span className="hinweis-klein">Schritt {stufe + 1} von 4</span>
        </div>
        <div className="fortschritt" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i <= stufe ? 'aktiv' : ''} />
          ))}
        </div>

        {flow === 'training' && (
          <div className="schritt-einblendung">
            <span className="kicker">Trainingsart</span>
            <h2>was trainierst du.</h2>
            <p className="gedeckt" style={{ marginBottom: 18 }}>
              Dauer und Preis unterscheiden sich je nach Art.
            </p>
            <div className="arten-grid">
              {TRAININGSARTEN.map((a) => (
                <button key={a.id} className="arten-kachel" onClick={() => waehleArt(a.id)} aria-label={`${a.name}, ${a.dauer} Minuten, ${euro(a.preis)}`}>
                  <img src={a.bild} alt="" loading="lazy" />
                  <span className="arten-info">
                    <strong>{a.name}</strong>
                    <span className="mono">
                      {a.dauer} Min · {euro(a.preis)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {flow === 'trainer' && art && (
          <div className="schritt-einblendung">
            <span className="kicker">{art.name}</span>
            <h2>wer trainiert dich.</h2>
            <p className="gedeckt" style={{ marginBottom: 18 }}>
              Diese Trainer bieten {art.name} an und haben diese Woche noch Kapazität.
            </p>
            {trainerListe
              .filter((t) => t.arten.includes(art.id))
              .map((t) => {
                const sessions = wochenSessions(buchungen, t.id)
                const voll = KONTINGENT_IST_OBERGRENZE && sessions >= t.kontingent
                return (
                  <div className={'karte trainer-karte' + (voll ? ' trainer-ausgebucht' : '')} key={t.id}>
                    <div className="trainer-kopf">
                      <span className="monogramm" aria-hidden="true">
                        {t.monogramm}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{t.name}</div>
                        <div className="hinweis-klein">
                          {t.herkunft} · {t.erfahrung} Jahre
                        </div>
                      </div>
                      {voll && <span className="chip chip-voll">Ausgebucht</span>}
                    </div>
                    <p className="gedeckt" style={{ margin: 0, fontSize: 14 }}>
                      {t.philosophie}
                    </p>
                    <Auslastungsbalken wert={sessions} maximum={t.kontingent} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      {voll ? (
                        <button disabled style={{ flex: 1 }}>
                          Diese Woche ausgebucht
                        </button>
                      ) : (
                        <button className="knopf-primaer" style={{ flex: 1 }} onClick={() => waehleTrainer(t.id)}>
                          Zeiten ansehen
                        </button>
                      )}
                      <button style={{ background: 'var(--grund)' }} onClick={() => setModalTrainerId(t.id)} aria-haspopup="dialog">
                        Profil
                      </button>
                    </div>
                  </div>
                )
              })}
            {buchbareTrainer({ trainerListe, artId: art.id, buchungen }).length === 0 ? (
              <div className="leer">
                <p>Für {art.name} ist diese Woche kein Trainer mehr frei.</p>
                <p className="hinweis-klein" style={{ margin: 0 }}>
                  Nächste Woche öffnen sich neue Zeiten.
                </p>
              </div>
            ) : (
              <button style={{ width: '100%', marginTop: 4 }} onClick={() => waehleTrainer(null)}>
                Ohne Präferenz, schlagt mir Trainer vor
              </button>
            )}
          </div>
        )}

        {flow === 'termin' && art && (
          <div className="schritt-einblendung">
            <span className="kicker">{ohnePraeferenz ? art.name : art.name + ' · ' + wunschTrainer.name}</span>
            <h2>wann passt es dir.</h2>

            <div className="tagesleiste" role="tablist" aria-label="Tag wählen">
              {woche.tage.map((t) => {
                const frei = freiProTag[t.index]
                return (
                  <button
                    key={t.index}
                    role="tab"
                    className="tag"
                    aria-selected={selTag === t.index}
                    disabled={frei === 0}
                    aria-label={`${t.label} ${t.datumLabel}, ${frei === 0 ? 'keine freie Zeit' : frei === 1 ? 'eine freie Zeit' : frei + ' freie Zeiten'}`}
                    onClick={() => {
                      setSelTag(t.index)
                      setAuswahl(null)
                      setExklusiv(false)
                      setOffenerGrund(null)
                    }}
                  >
                    <span className="kuerzel">{t.label}</span>
                    <span className="zahl">{t.tagZahl}</span>
                    <span className={'frei-punkt' + (frei === 0 ? ' ohne' : '')} />
                  </button>
                )
              })}
            </div>
            <p className="tages-zusammenfassung">
              {freiProTag[selTag] === 0
                ? 'An diesem Tag ist nichts mehr frei. Wähle einen anderen Tag.'
                : `${freiProTag[selTag]} ${freiProTag[selTag] === 1 ? 'freie Zeit' : 'freie Zeiten'} am ${woche.tage[selTag].label}, ${woche.tage[selTag].datumLabel}`}
            </p>

            {TAGESZEITEN.map((tz) => {
              /* Vergangene Zeiten blenden wir aus, sie helfen niemandem mehr.
                 Belegte bleiben sichtbar, damit der Grund abrufbar bleibt. */
              const slots = slotBewertungen.filter((s) => s.stunde >= tz.von && s.stunde < tz.bis && s.grund !== 'vergangen')
              if (slots.length === 0) return null
              const freieHier = slots.filter((s) => s.status === 'frei' || s.status === 'knapp').length
              return (
                <div className="zeitgruppe" key={tz.id}>
                  <div className="zeitgruppe-kopf">
                    <Icon name={tz.icon} />
                    <span>{tz.name}</span>
                    <span className="anzahl">{freieHier === 0 ? 'nichts frei' : `${freieHier} frei`}</span>
                  </div>
                  {slots.map((s) => {
                    const buchbar = s.status === 'frei' || s.status === 'knapp'
                    const gewaehlt = auswahl && auswahl.tag === selTag && auswahl.stunde === s.stunde
                    const trainerName = s.trainerId ? trainerById(s.trainerId).name.split(' ')[0] : null
                    let titel = ''
                    let unter = ''
                    if (buchbar) {
                      titel = s.duo ? `Zu zweit bei ${trainerName}` : ohnePraeferenz ? `Einzel bei ${trainerName}` : 'Einzeltraining'
                      unter = s.duo
                        ? 'ein weiterer Kunde ist dabei'
                        : s.kunden === 0
                          ? 'Fläche ist leer'
                          : `${s.kunden} von ${MAX_KUNDEN_PRO_SLOT} Plätzen belegt`
                    } else {
                      if (s.grund === 'vergangen') titel = 'Vorbei'
                      else if (s.grund === 'arbeitszeit') titel = ohnePraeferenz ? 'Kein Trainer da' : `${wunschTrainer.name.split(' ')[0]} arbeitet nicht`
                      else if (s.grund === 'exklusiv_belegt') titel = 'Exklusiv vergeben'
                      else if (s.grund === 'flaeche_voll') titel = 'Fläche voll'
                      else if (s.grund === 'geblockt') titel = 'Geblockt'
                      else if (s.grund === 'eigene_buchung') titel = 'Dein Termin'
                      else if (s.grund === 'trainer_limit') titel = 'Zwei Trainer belegt'
                      else if (s.grund === 'trainer_voll') titel = 'Trainer ausgelastet'
                      else if (s.grund === 'kontingent') titel = 'Diese Woche ausgebucht'
                      else titel = 'Nicht buchbar'
                      unter = s.grund === 'vergangen' ? '' : 'Tippe für den Grund'
                    }
                    return (
                      <button
                        key={s.stunde}
                        className="slot-zeile"
                        data-status={buchbar ? s.status : 'gesperrt'}
                        data-lage={s.duo ? 'duo' : 'einzel'}
                        aria-pressed={!!gewaehlt}
                        aria-label={`${stundeLabel(s.stunde)} Uhr, ${titel}, ${s.kunden} von ${MAX_KUNDEN_PRO_SLOT} Plätzen belegt`}
                        onClick={() => {
                          if (buchbar) {
                            setAuswahl({ tag: selTag, stunde: s.stunde, trainerId: s.trainerId, duo: s.duo })
                            setExklusiv(false)
                            setOffenerGrund(null)
                          } else {
                            setOffenerGrund(offenerGrund === s.stunde ? null : s.stunde)
                          }
                        }}
                        aria-expanded={!buchbar ? offenerGrund === s.stunde : undefined}
                      >
                        <span className="zeit">{stundeLabel(s.stunde)}</span>
                        <span className="lage">
                          <strong>{titel}</strong>
                          {unter}
                        </span>
                        <span className="punkte" aria-hidden="true">
                          {[0, 1, 2, 3].map((i) => (
                            <i key={i} className={i < s.kunden ? 'belegt' : ''} />
                          ))}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}

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
                      setExklusiv(false)
                      setOffenerGrund(null)
                    }}
                  />
                )
              })()}

            {auswahl && (
              <>
                <FlaechenKarte
                  buchungen={buchungen}
                  trainerListe={trainerListe}
                  tag={auswahl.tag}
                  stunde={auswahl.stunde}
                  eigenerTrainerId={auswahl.trainerId}
                  kundeKuerzel={kunde.name.split(' ').map((n) => n[0]).join('')}
                  onProfil={setModalTrainerId}
                  exklusiv={exklusiv}
                  onExklusiv={setExklusiv}
                />
                <button className="knopf-primaer" style={{ width: '100%', marginTop: 14 }} onClick={() => setFlow('checkout')}>
                  {woche.tage[auswahl.tag].label} {stundeLabel(auswahl.stunde)} · Weiter
                </button>
              </>
            )}
          </div>
        )}

        {flow === 'checkout' && art && auswahl && (
          <div className="schritt-einblendung">
            <span className="kicker">Übersicht</span>
            <h2>alles richtig.</h2>
            <div className="karte" style={{ marginTop: 16 }}>
              {[
                ['Training', art.name],
                ['Trainer', trainerById(auswahl.trainerId).name],
                ['Termin', `${woche.tage[auswahl.tag].label} ${woche.tage[auswahl.tag].datumLabel} ${stundeLabel(auswahl.stunde)}`],
                ['Dauer', `${art.dauer} Minuten`],
                ['Auf der Fläche', exklusiv ? 'nur du, exklusiv' : `${belegungAuswahl} von ${MAX_KUNDEN_PRO_SLOT} belegt`],
                ...(exklusiv ? [['Exklusiv-Aufpreis', euro(EXKLUSIV_AUFPREIS)]] : []),
                ['Preis', euro(art.preis + (exklusiv ? EXKLUSIV_AUFPREIS : 0))],
              ].map(([label, wert], i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: i === 0 ? 0 : 12 }}>
                  <span className="gedeckt">{label}</span>
                  <span className={i >= 2 ? 'mono' : ''} style={{ fontWeight: 500, textAlign: 'right' }}>
                    {wert}
                  </span>
                </div>
              ))}
            </div>
            <FlaechenKarte
              buchungen={buchungen}
              trainerListe={trainerListe}
              tag={auswahl.tag}
              stunde={auswahl.stunde}
              eigenerTrainerId={auswahl.trainerId}
              kundeKuerzel={kunde.name.split(' ').map((n) => n[0]).join('')}
              onProfil={setModalTrainerId}
              exklusiv={exklusiv}
              onExklusiv={setExklusiv}
            />
            <p className="hinweis-klein" style={{ marginTop: 14 }}>
              Dein Termin ist mit der Buchung fest eingetragen. Stornieren kannst du bis {STORNO_FRIST_STUNDEN} Stunden vorher.
            </p>
            {kunde.verbleibend <= 0 ? (
              <p className="fehler">Dein Sessionkontingent ist aufgebraucht. Melde dich im Studio für ein neues Paket.</p>
            ) : (
              <button className="knopf-primaer" style={{ width: '100%', marginTop: 8 }} onClick={buchen}>
                Verbindlich buchen
              </button>
            )}
          </div>
        )}

        <TrainerModal trainer={trainerListe.find((t) => t.id === modalTrainerId) || null} buchungen={buchungen} onClose={() => setModalTrainerId(null)} />
      </div>
    )
  }

  /* ————— Tabs ————— */
  return (
    <div className="schritt-einblendung">
      <div className="gruss-zeile">
        <span className="streak">
          {kunde.verbleibend}
          <span className="gedeckt" style={{ fontFamily: 'var(--grotesk)' }}>
            übrig
          </span>
        </span>
        <span className="gruss">{tageszeitGruss(jetzt)}</span>
        <span className="avatar" aria-hidden="true">
          {kunde.name.split(' ').map((n) => n[0]).join('')}
        </span>
      </div>

      {meineMeldungen.map((m) => (
        <div className="meldung" role="status" key={m.id}>
          <span style={{ fontSize: 14 }}>{m.text}</span>
          <button onClick={() => aktionen.meldungGelesen(m.id)}>Verstanden</button>
        </div>
      ))}

      {tab === 'start' && (
        <div className="schritt-einblendung">
          <Wochenleiste woche={woche} aktiv={-1} markierteTage={markierteTage} onWahl={() => setTab('termine')} />

          <div className="duo-grid">
            <div className="karte">
              <span className="kicker">Nächste Session</span>
              {naechster ? (
                <>
                  <div className="gross">
                    {woche.tage[naechster.tag].label} {stundeLabel(naechster.stunde)}
                  </div>
                  <div className="hinweis-klein" style={{ marginTop: 6 }}>
                    {TRAININGSARTEN.find((a) => a.id === naechster.artId).name}
                    <br />
                    {trainerById(naechster.trainerId).name}
                  </div>
                </>
              ) : (
                <>
                  <div className="gross">Nichts geplant.</div>
                  <button className="knopf-primaer" style={{ marginTop: 12, alignSelf: 'flex-start' }} onClick={starteFlow}>
                    Buchen
                  </button>
                </>
              )}
            </div>
            <div className="karte karte-still">
              <span className="kicker">Dein Paket</span>
              <div className="gross">
                {kunde.verbleibend} von {kunde.paket}
              </div>
              <div className="hinweis-klein" style={{ marginTop: 6 }}>
                Sessions übrig
              </div>
              <div className="balken" style={{ marginTop: 10 }}>
                <div style={{ width: (kunde.verbleibend / kunde.paket) * 100 + '%' }} />
              </div>
            </div>
          </div>

          <FlaecheHeute woche={woche} buchungen={buchungen} jetztStunde={woche.jetztStunde} />

          <span className="kicker" style={{ marginTop: 22, textAlign: 'center' }}>
            Bereit für mehr
          </span>
          <button className="knopf-primaer" style={{ width: '100%' }} onClick={starteFlow}>
            Neue Session buchen
          </button>
        </div>
      )}

      {tab === 'termine' && (
        <div className="schritt-einblendung">
          <span className="kicker">Dein Plan</span>
          <h2>deine termine.</h2>
          {meineTermine.length === 0 ? (
            <div className="leer" style={{ marginTop: 16 }}>
              <p>Du hast noch keine Termine.</p>
              <button className="knopf-primaer" style={{ marginTop: 10 }} onClick={starteFlow}>
                Erste Session buchen
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              {meineTermine.map((b) => {
                const t = trainerById(b.trainerId)
                const a = TRAININGSARTEN.find((x) => x.id === b.artId)
                const stornierbar = istAktiveBuchung(b) && istStornierbar(woche, jetzt, b)
                return (
                  <div className="karte" key={b.id} style={{ marginBottom: 10 }}>
                    <div className="karten-kopf">
                      <span className="kicker">{a.name}</span>
                      <span className="zeitstempel">
                        {woche.tage[b.tag].label} {stundeLabel(b.stunde)}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{t.name}</div>
                    <div className="hinweis-klein">
                      {woche.tage[b.tag].datumLabel} · {STATUS_LABEL[b.status]}
                    </div>
                    {b.exklusiv && (
                      <span className="exklusiv-plakette" style={{ marginTop: 8 }}>
                        <Icon name="schloss" />
                        Fläche exklusiv
                      </span>
                    )}
                    {istAktiveBuchung(b) &&
                      (stornierbar ? (
                        <button style={{ marginTop: 12, background: 'var(--grund)', fontSize: 14 }} onClick={() => aktionen.storniere(b)}>
                          Termin stornieren
                        </button>
                      ) : (
                        <p className="hinweis-klein" style={{ marginTop: 10, marginBottom: 0 }}>
                          Stornierung war bis {STORNO_FRIST_STUNDEN} Stunden vorher möglich
                        </p>
                      ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'trainer' && (
        <div className="schritt-einblendung">
          <span className="kicker">Das Team</span>
          <h2>deine trainer.</h2>
          <p className="gedeckt" style={{ marginBottom: 18 }}>
            Fünf Menschen, fünf Handschriften. Tippe für das ganze Profil.
          </p>
          {trainerListe.map((t) => {
            const s = wochenSessions(buchungen, t.id)
            const voll = KONTINGENT_IST_OBERGRENZE && s >= t.kontingent
            return (
              <button key={t.id} className="trainer-zeile" onClick={() => setModalTrainerId(t.id)} aria-haspopup="dialog">
                <span className="monogramm monogramm-klein" aria-hidden="true">
                  {t.monogramm}
                </span>
                <div className="mitte">
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                  <div className="hinweis-klein">{voll ? 'Diese Woche ausgebucht' : t.herkunft}</div>
                </div>
                <span className="pfeil">›</span>
              </button>
            )
          })}
        </div>
      )}

      {tab === 'studio' && (
        <div className="schritt-einblendung">
          <div className="studio-hero">
            <img src="/studio/kraftbereich.png" alt="Der Kraftbereich des Studios" />
          </div>

          <span className="kicker">Über uns</span>
          <h2>das studio.</h2>
          <p className="gedeckt">
            BetterDayz ist ein geschlossenes Personal-Training-Studio. Kein Laufkundengeschäft, keine vollen Geräteparks — wer hier trainiert, hat einen Code und einen festen Platz.
          </p>
          <p className="gedeckt">
            Die Fläche ist bewusst klein gehalten. Höchstens vier Kunden trainieren gleichzeitig, jeder mit seinem Trainer. Das prägt alles, vom Termin bis zur Atmosphäre.
          </p>

          <div className="stats-reihe">
            <div className="stat">
              <div className="zahl">5</div>
              <div className="label">Trainer</div>
            </div>
            <div className="stat">
              <div className="zahl">4</div>
              <div className="label">Plätze</div>
            </div>
            <div className="stat">
              <div className="zahl">62+</div>
              <div className="label">Jahre Erfahrung</div>
            </div>
          </div>

          <span className="kicker">Studioleitung</span>
          <h2 style={{ fontSize: 24 }}>ein wort von serdar.</h2>
          <div className="karte" style={{ marginBottom: 22 }}>
            <button
              className="flaeche-trainerzeile"
              onClick={() => setModalTrainerId('serdar')}
              aria-haspopup="dialog"
              style={{ background: 'transparent', width: '100%', padding: 0, minHeight: 0, borderRadius: 0 }}
            >
              <span className="monogramm" aria-hidden="true">
                SE
              </span>
              <span className="txt" style={{ textAlign: 'left' }}>
                <strong>Serdar</strong>
                <span>Studioleitung · Wettkampfboxen</span>
              </span>
              <span className="pfeil" style={{ color: 'var(--leise)' }}>
                ›
              </span>
            </button>
            <div className="zitat-bubble">
              „Ich habe BetterDayz gegründet, weil gutes Training Aufmerksamkeit braucht. Vier Plätze, fünf Trainer, keine Anonymität. Wer hierher kommt, wird gesehen — an guten wie an zähen Tagen."
            </div>
          </div>

          <span className="kicker">Einblicke</span>
          <h2 style={{ fontSize: 24 }}>unser raum.</h2>
          <p className="gedeckt" style={{ marginBottom: 12 }}>
            Kunstrasen, Tageslicht und Geräte, die wir wirklich benutzen.
          </p>
          <StudioSlider bilder={STUDIO_BILDER} />
        </div>
      )}

      <nav className="tabbar" role="tablist" aria-label="App-Navigation">
        <button role="tab" aria-selected={tab === 'start'} onClick={() => setTab('start')}>
          <Icon name="start" />
          Start
        </button>
        <button role="tab" aria-selected={tab === 'termine'} onClick={() => setTab('termine')}>
          <Icon name="termine" />
          Termine
        </button>
        <button className="fab" onClick={starteFlow} aria-label="Neue Session buchen">
          <Icon name="plus" />
        </button>
        <button role="tab" aria-selected={tab === 'trainer'} onClick={() => setTab('trainer')}>
          <Icon name="trainer" />
          Trainer
        </button>
        <button role="tab" aria-selected={tab === 'studio'} onClick={() => setTab('studio')}>
          <Icon name="studio" />
          Studio
        </button>
      </nav>

      {erfolg &&
        (() => {
          const t = trainerById(erfolg.trainerId)
          const a = TRAININGSARTEN.find((x) => x.id === erfolg.artId)
          return (
            <div className="erfolg-hintergrund" role="dialog" aria-modal="true" aria-label="Buchung bestätigt">
              <div className="erfolg-karte">
                <svg className="haken" viewBox="0 0 72 72" aria-hidden="true">
                  <circle className="haken-kreis" cx="36" cy="36" r="31" />
                  <path className="haken-zug" d="M22 37.5 32 47l18-20" />
                </svg>
                <h2 style={{ marginTop: 16 }}>gebucht.</h2>
                <div className="erfolg-details">
                  <div className="zeile">
                    <span className="gedeckt">Training</span>
                    <span style={{ fontWeight: 500 }}>{a.name}</span>
                  </div>
                  <div className="zeile">
                    <span className="gedeckt">Trainer</span>
                    <span style={{ fontWeight: 500 }}>{t.name}</span>
                  </div>
                  <div className="zeile">
                    <span className="gedeckt">Termin</span>
                    <span className="mono" style={{ fontWeight: 500 }}>
                      {woche.tage[erfolg.tag].label} {woche.tage[erfolg.tag].datumLabel} {stundeLabel(erfolg.stunde)}
                    </span>
                  </div>
                  {erfolg.exklusiv && (
                    <div className="zeile">
                      <span className="gedeckt">Fläche</span>
                      <span className="exklusiv-plakette">
                        <Icon name="schloss" />
                        Exklusiv
                      </span>
                    </div>
                  )}
                </div>
                <button
                  className="knopf-primaer"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setErfolg(null)
                    setTab('termine')
                  }}
                >
                  Zu deinen Terminen
                </button>
              </div>
            </div>
          )
        })()}

      <TrainerModal trainer={trainerListe.find((t) => t.id === modalTrainerId) || null} buchungen={buchungen} onClose={() => setModalTrainerId(null)} />
    </div>
  )
}

function SperrGrund({ grund, art, tag, stunde, wunschTrainerId, engineKontext, woche, trainerById, onUebernehmen }) {
  const wunschName = wunschTrainerId ? trainerById(wunschTrainerId).name : null
  const alternativen = findeAlternativen({ ...engineKontext, artId: art.id, tag, stunde, wunschTrainerId })
  return (
    <div className="slot-grund" role="note">
      <div className="karten-kopf">
        <span className="kicker">Nicht buchbar</span>
        <span className="zeitstempel">{stundeLabel(stunde)}</span>
      </div>
      <span style={{ fontSize: 14 }}>{grundText(grund, wunschName)}</span>
      {alternativen.length > 0 ? (
        <div className="alternativen">
          {alternativen.map((alt, i) => {
            const t = trainerById(alt.trainerId)
            const label =
              alt.typ === 'trainer' ? `Gleiche Zeit bei ${t.name.split(' ')[0]}` : `${t.name.split(' ')[0]} am ${woche.tage[alt.tag].label} um ${stundeLabel(alt.stunde)}`
            return (
              <button key={i} onClick={() => onUebernehmen(alt)}>
                {label}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="hinweis-klein" style={{ marginTop: 10, marginBottom: 0 }}>
          Gerade gibt es keine nahe Alternative. Schau bei einem anderen Tag vorbei.
        </p>
      )}
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
        <h2>wer bist du.</h2>
        <p className="gedeckt" style={{ marginBottom: 18 }}>
          Dein Dashboard öffnet sich direkt nach der Auswahl.
        </p>
        {trainerListe.map((t) => (
          <button key={t.id} className="trainer-zeile" onClick={() => setTrainerId(t.id)}>
            <span className="monogramm monogramm-klein" aria-hidden="true">
              {t.monogramm}
            </span>
            <div className="mitte">
              <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
              <div className="hinweis-klein">{t.herkunft}</div>
            </div>
            <span className="pfeil">›</span>
          </button>
        ))}
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
      <div className="gruss-zeile">
        <span className="streak">
          {sessions}
          <span className="gedeckt" style={{ fontFamily: 'var(--grotesk)' }}>
            Sessions
          </span>
        </span>
        <span className="gruss">{trainer.name.split(' ')[0].toLowerCase()}.</span>
        <button className="avatar" onClick={() => setTrainerId(null)} aria-label="Profil wechseln">
          {trainer.monogramm}
        </button>
      </div>

      {tab === 'heute' && (
        <div className="schritt-einblendung">
          <div className="kpi-reihe">
            <div className="kpi">
              <div className="titel">Heute</div>
              <div className="wert">{woche.heuteIndex < 0 ? '—' : heutige.length}</div>
            </div>
            <div className="kpi">
              <div className="titel">Auslastung</div>
              <div className="wert">
                {sessions}/{trainer.kontingent}
              </div>
              <div className={'balken' + (sessions >= trainer.kontingent ? ' balken-voll' : '')} style={{ marginTop: 8 }}>
                <div style={{ width: Math.min(100, (sessions / Math.max(1, trainer.kontingent)) * 100) + '%' }} />
              </div>
            </div>
            <div className="kpi">
              <div className="titel">Kunden</div>
              <div className="wert">{kundenWoche}</div>
            </div>
            <div className="kpi">
              <div className="titel">Umsatz</div>
              <div className="wert">{umsatz} €</div>
            </div>
          </div>

          <span className="kicker" style={{ marginTop: 22 }}>
            Dein Tag
          </span>
          {woche.heuteIndex < 0 || heutige.length === 0 ? (
            <div className="leer">
              <p>Heute stehen keine Sessions an.</p>
              <p className="hinweis-klein" style={{ margin: 0 }}>
                Deine nächsten Termine findest du unter Woche.
              </p>
            </div>
          ) : (
            heutige.map((b) => {
              const k = kundeById(b.kundeId)
              const a = artById(b.artId)
              return (
                <div className="karte session-karte" key={b.id}>
                  <span className="zeit">{stundeLabel(b.stunde)}</span>
                  <div>
                    <div className="name">{k.name}</div>
                    <div className="hinweis-klein">
                      {a.name} · {a.dauer} Min
                    </div>
                    {b.exklusiv && (
                      <span className="exklusiv-plakette" style={{ marginTop: 8 }}>
                        <Icon name="schloss" />
                        Fläche exklusiv
                      </span>
                    )}
                    <p style={{ margin: '8px 0 0', fontSize: 14 }}>{k.ziele}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'woche' && (
        <div className="schritt-einblendung">
          <span className="kicker">Die Fläche</span>
          <h2>deine woche.</h2>
          <div style={{ marginTop: 16 }}>
            <WochenRaster woche={woche} trainer={trainer} buchungen={buchungen} kundeById={kundeById} />
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="schritt-einblendung">
          <span className="kicker">Kommend</span>
          <h2>deine sessions.</h2>
          <div style={{ marginTop: 16 }}>
            {kommende.length === 0 ? (
              <div className="leer">
                <p>Keine kommenden Sessions.</p>
                <p className="hinweis-klein" style={{ margin: 0 }}>
                  Neue Buchungen deiner Kunden erscheinen hier sofort.
                </p>
              </div>
            ) : (
              kommende.map((b) => {
                const k = kundeById(b.kundeId)
                const a = artById(b.artId)
                return (
                  <div className="karte anfrage-zeile" key={b.id}>
                    <div style={{ width: '100%' }}>
                      <div className="karten-kopf">
                        <span className="kicker">{a.name}</span>
                        <span className="zeitstempel">
                          {woche.tage[b.tag].label} {stundeLabel(b.stunde)}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{k.name}</div>
                      <div className="hinweis-klein">{k.ziele}</div>
                    </div>
                    <div className="aktionen">
                      <button onClick={() => aktionen.sageAb(b)}>Session absagen</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {tab === 'verfuegbarkeit' && (
        <div className="schritt-einblendung">
          <span className="kicker">Steuerung</span>
          <h2>deine zeiten.</h2>
          <div style={{ marginTop: 16 }}>
            <Verfuegbarkeit woche={woche} trainer={trainer} buchungen={buchungen} aktionen={aktionen} />
          </div>
        </div>
      )}

      <nav className="tabbar" role="tablist" aria-label="Dashboard-Navigation">
        <button role="tab" aria-selected={tab === 'heute'} onClick={() => setTab('heute')}>
          <Icon name="heute" />
          Heute
        </button>
        <button role="tab" aria-selected={tab === 'woche'} onClick={() => setTab('woche')}>
          <Icon name="woche" />
          Woche
        </button>
        <button role="tab" aria-selected={tab === 'sessions'} onClick={() => setTab('sessions')}>
          <Icon name="sessions" />
          Sessions
        </button>
        <button role="tab" aria-selected={tab === 'verfuegbarkeit'} onClick={() => setTab('verfuegbarkeit')}>
          <Icon name="zeiten" />
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
              {t.label}
            </div>
          ))}
          {STUNDEN.map((stunde) => (
            <RasterZeile key={stunde} stunde={stunde} woche={woche} trainer={trainer} buchungen={buchungen} kundeById={kundeById} />
          ))}
        </div>
      </div>
      <div className="legende">
        <span>
          <i style={{ background: 'var(--akzent)' }} /> Eigene Session
        </span>
        <span>
          <i style={{ background: 'var(--flaeche-still)' }} /> Kollegen
        </span>
        <span>
          <i style={{ background: 'repeating-linear-gradient(45deg, transparent 0 3px, rgba(15,17,19,0.14) 3px 6px)' }} /> Geblockt
        </span>
      </div>
      <p className="hinweis-klein" style={{ marginTop: 12 }}>
        Die Füllhöhe einer Zelle zeigt, wie voll die Fläche ist. Vier Kunden bedeuten voll.
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
              <div className="eigene">{eigene.map((b) => kundeById(b.kundeId).name.split(' ').map((n) => n[0]).join('')).join(' ')}</div>
            )}
            {slot.length > 0 && eigene.length === 0 && <span className="zahl">{slot.length}</span>}
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
        <span className="kicker">Wochenkontingent</span>
        <p className="gedeckt" style={{ fontSize: 14 }}>
          So viele Sessions gibst du diese Woche höchstens. Beim Erreichen verschwindest du aus der Kundenauswahl.
        </p>
        <div className="kontingent-stepper">
          <button aria-label="Kontingent verringern" onClick={() => aktionen.setKontingent(trainer.id, Math.max(0, trainer.kontingent - 1))}>
            −
          </button>
          <span className="wert">{trainer.kontingent}</span>
          <button aria-label="Kontingent erhöhen" onClick={() => aktionen.setKontingent(trainer.id, trainer.kontingent + 1)}>
            +
          </button>
        </div>
      </div>

      <div className="abschnitt karte">
        <span className="kicker">Arbeitszeiten</span>
        <p className="gedeckt" style={{ fontSize: 14 }}>
          Deine Zeiten wirken sofort auf die Kundenansicht.
        </p>
        <div className="verf-zeiten">
          {woche.tage.map((t) => {
            const az = trainer.arbeitszeiten[t.index]
            return (
              <div className="verf-tag" key={t.index}>
                <span className="tag-name">{t.label}</span>
                <select
                  aria-label={`Arbeitsbeginn ${t.label}`}
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
                <span className="hinweis-klein">bis</span>
                <select
                  aria-label={`Arbeitsende ${t.label}`}
                  value={az ? az.bis : 'frei'}
                  disabled={!az}
                  onChange={(e) => aktionen.setArbeitszeit(trainer.id, t.index, { von: az.von, bis: Number(e.target.value) })}
                >
                  {!az && <option value="frei">—</option>}
                  {stundenOptionen
                    .filter((s) => !az || s > az.von)
                    .map((s) => (
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
        <span className="kicker">Zeiten blocken</span>
        <p className="gedeckt" style={{ fontSize: 14 }}>
          Tippe auf einen Slot, um ihn zu blocken oder wieder freizugeben. Slots mit eigener Session lassen sich nicht blocken, sage die Session zuerst ab.
        </p>
        <div className="scroll-x" style={{ margin: '0 -20px', padding: '0 20px' }}>
          <div className="verf-grid">
            <div className="kopf"></div>
            {woche.tage.map((t) => (
              <div className="kopf" key={t.index} style={{ fontSize: 11, fontWeight: 600, color: 'var(--leise)', textAlign: 'center', padding: '4px 0' }}>
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
          label = '●'
          klasse = 'session'
        } else if (geblockt) {
          label = '✕'
          klasse = 'block-an'
        } else if (!ausserhalb) {
          label = 'frei'
          klasse = 'zellen-frei'
        }
        return (
          <button
            key={t.index}
            className={klasse}
            disabled={eigene || ausserhalb}
            aria-pressed={geblockt}
            aria-label={`${t.label} ${stundeLabel(stunde)} ${eigene ? 'Session' : geblockt ? 'Geblockt' : ausserhalb ? 'außerhalb der Arbeitszeit' : 'Frei'}`}
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
  const [splashLaeuft, setSplashLaeuft] = useState(true)
  const splashFertig = useMemo(() => () => setSplashLaeuft(false), [])

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
            t.id === trainerId ? { ...t, blocks: t.blocks.includes(schluessel) ? t.blocks.filter((b) => b !== schluessel) : [...t.blocks, schluessel] } : t,
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
      {splashLaeuft && <Splash onFertig={splashFertig} />}
      <header className="topbar">
        <span className="marke-name">betterdayz.</span>
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
