/**
 * Drehbuch des Erklärfilms „Meldekopf Oldenburg“ – als Datenmodul.
 *
 * Alles, was gesprochen, gezeigt oder gehört wird, steht hier an einer Stelle.
 * Die anderen Skripte lesen dieses Modul:
 *   stimmen.mjs   → erzeugt je Zeile eine Tonspur (ElevenLabs)
 *   klaenge.mjs   → erzeugt Soundeffekte und Musikbetten (ElevenLabs)
 *   zeitplan.mjs  → legt aus den Tonlängen die Zeitachse der Comic-Blöcke fest
 *   comic/        → zeichnet die Comic-Blöcke nach dieser Zeitachse
 *   app/          → nimmt den Assistenten auf und setzt Marken je Sprechzeile
 *   mischen.mjs / schnitt.mjs → Tonmischung und Endschnitt
 *
 * Schreibweise: `text` ist der Untertitel (so, wie man es liest),
 * `tts` ist – falls abweichend – das, was die Stimme vorlesen soll
 * (Funkrufnamen als Zahlwörter, StAN als „Schtan“, PDF als „Pe-De-Eff“ usw.).
 *
 * Fiktive Personen, fiktive Lage. Ortsverbände und Funkrufnamen folgen dem
 * THW-Vokabular (vendor/bos-vokabulare).
 */

export const FPS = 25;
export const BREITE = 1920;
export const HOEHE = 1080;

/** Stimmen (ElevenLabs, deutsch). */
export const SPRECHER = {
  erzaehler: {
    name: "Erzähler",
    voiceId: "FTNCalFNG5bRnkkaP5Ug", // Otto – ruhig, Studio
    settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15, speed: 1.0 },
  },
  sina: {
    name: "Sina Wessels, Meldekopf",
    voiceId: "nF7t9cuYo0u3kuVI9q4B", // Dana – präsent, gesprächig
    settings: { stability: 0.4, similarity_boost: 0.8, style: 0.45, speed: 1.02 },
  },
  hauke: {
    name: "Hauke Tjaden, Gruppenführer Bergungsgruppe Delmenhorst",
    voiceId: "r8MyP4qUsq5WFFSkPdfV", // Johannes – mittelalt, trocken
    settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, speed: 0.98 },
  },
  merle: {
    name: "Merle Janssen, Gruppenführerin FGr WP Oldenburg",
    voiceId: "AnvlJBAqSLDzEevYr9Ap", // Ava – jung, klar
    settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, speed: 1.0 },
  },
  jan: {
    name: "Jan Oltmanns, Leiter Meldekopf / Funkstimmen",
    voiceId: "wGD81UtSGECIRSWQjH8X", // Stefan Rank – Nachrichten, sachlich
    settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3, speed: 1.0 },
  },
};

/**
 * Eine Sprechzeile. `id` ist dateinamen-tauglich und stabil (Cache!).
 * `pauseDavor`/`pauseDanach` in Sekunden, Vorgabe siehe zeitplan.mjs.
 * `funk: true` → Stimme wird in der Mischung wie über Handfunkgerät gefiltert.
 */
function z(id, sprecher, text, extra = {}) {
  return { id, sprecher, text, ...extra };
}

/* ------------------------------------------------------------------------ */
/* Block 1: Comic-Intro – Meldekopf Oldenburg bei Nacht                      */
/* ------------------------------------------------------------------------ */

export const COMIC_INTRO = {
  id: "intro",
  musik: "nacht", // Schlüssel in MUSIK
  szenen: [
    {
      id: "titel",
      bild:
        "Schwarz. Regenstriche. Titel in Comic-Lettering: „MELDEKOPF OLDENBURG“. Darunter klein: „Ein Erklärfilm zum digitalen Einheiten-Erfassungsbogen“. Eine gelbe Textbox (Caption) blendet den Ort ein.",
      caption: "Oldenburg (Oldb), Bereitstellungsraum Weser-Ems-Hallen · 22:40 Uhr · Sturmtief über Niedersachsen, die Hunte steigt.",
      sfx: [{ key: "regen", at: 0, dauer: "szene" }, { key: "donner", at: 0.8 }],
      zeilen: [
        z("i01", "erzaehler", "Oldenburg, Bereitstellungsraum an den Weser-Ems-Hallen, 22:40 Uhr. Ein Sturmtief liegt über Niedersachsen, die Hunte steigt.", {
          tts: "Oldenburg, Bereitstellungsraum an den Weser-Ems-Hallen, zweiundzwanzig Uhr vierzig. Ein Sturmtief liegt über Niedersachsen, die Hunte steigt.",
          pauseDavor: 1.2,
        }),
      ],
    },
    {
      id: "zelt",
      bild:
        "Panel: Meldekopf-Zelt (Faltpavillon) im Regen, Lampe innen, Schild „MELDEKOPF“. Sina steht mit Klemmbrett und Stift am Tisch, Funkgerät an der Brust. Regen trommelt aufs Dach.",
      sfx: [{ key: "regen", at: 0, dauer: "szene" }, { key: "zelt-plane", at: 0.3 }],
      zeilen: [
        z("i02", "erzaehler", "Hier laufen in dieser Nacht alle Einheiten auf. Jede meldet sich an – mit dem Einheiten-Erfassungsbogen.", { pauseDavor: 0.6 }),
      ],
    },
    {
      id: "gkw",
      bild:
        "Panel: Ein GKW (THW-blau, Blaulicht aus, Scheinwerfer an) rollt von links ins Bild, Spritzwasser. Sprechblase mit Funk-Zacken aus dem Fahrerhaus.",
      sfx: [{ key: "regen", at: 0, dauer: "szene" }, { key: "lkw-anfahrt", at: 0 }, { key: "funk-klick", at: 1.6 }, { key: "funk-klick", at: "nach:i03" }],
      zeilen: [
        z("i03", "hauke", "Heros Delmenhorst 22/51 an Meldekopf Oldenburg: Bergungsgruppe eingetroffen, kommen.", {
          tts: "Heros Delmenhorst zweiundzwanzig einundfünfzig an Meldekopf Oldenburg: Bergungsgruppe eingetroffen, kommen.",
          funk: true,
          pauseDavor: 1.8,
        }),
        z("i04", "sina", "Hier Meldekopf, verstanden. Kommt bitte mit eurem Bogen zum Zelt, kommen.", { funk: true, pauseDavor: 0.5 }),
      ],
    },
    {
      id: "papier",
      bild:
        "Panel: Nahaufnahme am Tisch. Hauke (Helm, nasser Einsatzanzug) reicht einen durchweichten Papierbogen, Tinte verlaufen. Sina hält ihn gegen die Lampe. Schweißtropfen-Zeichen. Kleines Inset: der Bogen mit unleserlichen Zahlen „0/2/7//9?“.",
      sfx: [{ key: "regen", at: 0, dauer: "szene" }, { key: "papier-nass", at: 0.4 }],
      zeilen: [
        z("i05", "hauke", "Moin. Unser Bogen. Ist unterwegs ein bisschen nass geworden.", { pauseDavor: 0.8 }),
        z("i06", "sina", "Stärke … null, zwei, sieben … oder ist das eine Eins? Und die Fahrzeuge stehen wo?", {
          tts: "Stärke … null, zwei, sieben … oder ist das eine Eins? Und die Fahrzeuge stehen wo?",
          pauseDavor: 0.6,
        }),
        z("i07", "hauke", "Neun Leute. Äh, acht. Der Jannik ist noch beim Tanken. Fahrzeuge hab ich auf die Rückseite geschrieben.", { pauseDavor: 0.4 }),
        z("i08", "erzaehler", "Melden auf Papier heißt: schreiben, entziffern, nachfragen – und später alles noch einmal abtippen.", { pauseDavor: 0.7 }),
      ],
    },
    {
      id: "stau",
      bild:
        "Panel breit: Fahrzeugschlange im Regen (MzGW, MTW, LKW, Anhänger), Scheinwerferkegel. Am Zelt stapeln sich drei Bögen, ein Taschenrechner, ein Stift. Funkgerät mit Zacken „KRRZT“. Jan (Leiter Meldekopf) kommt mit Lageblatt ins Bild.",
      sfx: [{ key: "regen", at: 0, dauer: "szene" }, { key: "funk-klick", at: 0.2 }, { key: "funk-klick", at: "nach:i10" }, { key: "taschenrechner", at: "bei:i12" }, { key: "stift", at: "bei:i12" }],
      zeilen: [
        z("i09", "jan", "Heros Cloppenburg 24/55, Fachgruppe Notversorgung, zwei Minuten vor Ort.", {
          tts: "Heros Cloppenburg vierundzwanzig fünfundfünfzig, Fachgruppe Notversorgung, zwei Minuten vor Ort.",
          funk: true,
          pauseDavor: 0.6,
        }),
        z("i10", "hauke", "Heros Westerstede 21/10, Zugtrupp. Wir stehen an der Einfahrt. Wo sollen wir hin?", {
          tts: "Heros Westerstede einundzwanzig zehn, Zugtrupp. Wir stehen an der Einfahrt. Wo sollen wir hin?",
          funk: true,
          pauseDavor: 0.4,
        }),
        z("i11", "jan", "Sina, wie viele Kräfte haben wir jetzt insgesamt? Die Einsatzleitung fragt nach.", { pauseDavor: 0.8 }),
        z("i12", "sina", "Moment … ich rechne noch. Drei Bögen, drei Handschriften, und einer hat den Sofortbedarf auf die Rückseite geschrieben.", { pauseDavor: 0.5 }),
      ],
    },
    {
      id: "qr",
      bild:
        "Panel: Merle tritt ans Zelt, Regenjacke, hält ein Handy hoch – auf dem Display ein großer QR-Code. Sina hebt ihr Tablet. Onomatopoesie „PIEP“. Dann Inset: das Tablet zeigt „THW Oldenburg · FGr WP (B) · Stärke 1/2/9//12 · 4 Fahrzeuge · Sofortbedarf: 300 l Diesel“.",
      sfx: [{ key: "regen", at: 0, dauer: "szene" }, { key: "scan-piep", at: "nach:i13" }],
      zeilen: [
        z("i13", "merle", "Heros Oldenburg 48/43, Fachgruppe Wasserschaden Pumpen. Hier ist unser Bogen – einmal scannen, bitte.", {
          tts: "Heros Oldenburg achtundvierzig dreiundvierzig, Fachgruppe Wasserschaden Pumpen. Hier ist unser Bogen – einmal scannen, bitte.",
          pauseDavor: 0.8,
        }),
        z("i14", "sina", "Das … war’s?", { pauseDavor: 1.3 }),
        z("i15", "merle", "Das war’s. Stärke, Fahrzeuge, Funkrufnamen, Sofortbedarf – steht alles drin.", { pauseDavor: 0.4 }),
        z("i16", "jan", "Und die Gesamtstärke?", { pauseDavor: 0.6 }),
        z("i17", "sina", "Rechnet die App. Alle Einheiten zusammen, auf einen Blick. Nächste bitte!", { pauseDavor: 0.4 }),
      ],
    },
    {
      id: "uebergang",
      bild:
        "Panel: Das Tablet füllt das Bild, der Rahmen wird zum Browserfenster – Übergang in die echte App.",
      sfx: [{ key: "regen", at: 0, dauer: 2.5, ausblenden: true }, { key: "wusch", at: "nach:i18" }],
      zeilen: [
        z("i18", "erzaehler", "Wie kommt der Bogen aufs Handy? Schauen wir es uns an – Seite für Seite.", { pauseDavor: 0.8, pauseDanach: 1.0 }),
      ],
    },
  ],
};

/* ------------------------------------------------------------------------ */
/* Block 2: App – der Assistent, Seite für Seite (visuell geführt)           */
/* Jede Szene ist ein Kapitel der Aufnahme; die Zeilen werden an Marken      */
/* gelegt, die app/aufnahme.mjs beim Aufnehmen setzt.                        */
/* ------------------------------------------------------------------------ */

/** Daten der Einheit, die im Film ausgefüllt wird (FGr WP (B), OV Oldenburg). */
export const EINHEIT = {
  ortSuche: "Olden",
  ortVorschlag: "Oldenburg (NI)",
  einheitstypSuche: "Wasserschaden",
  einheitstypVorschlag: "FGr WP (B)",
  einsatzOrt: "Hochwasser Hunte – Bereitstellungsraum Weser-Ems-Hallen",
  /** Namensliste für „Namen einfügen…“ – Reihenfolge = StAN-Plätze (GrFü, TrFü, TrFü, 9× He). */
  namen: [
    "Merle Janssen",
    "Okko Behrens",
    "Fenna Lübben",
    "Tammo Eilers",
    "Keno Harms",
    "Wiebke Schröder",
    "Jannes Meyer",
    "Hilke Cordes",
    "Leif Ahlers",
    "Enno Gerdes",
    "Thade Peters",
    "Imke Wilken",
  ],
  /** Zeilen (0-basiert) mit Geschlecht „W“. */
  weiblich: [0, 2, 5, 7, 11],
  telefonGrFue: "0170 5558821",
  kennzeichen: ["THW-86421", "THW-86422", "THW-86423", "THW-86424"],
  dieselLiter: "300",
};

export const APP = {
  id: "app",
  musik: "werkstatt",
  szenen: [
    {
      id: "start",
      bild: "Startseite der App im Browser. Cursor fährt zu „Neuen Bogen erstellen“.",
      zeilen: [
        z("a01", "erzaehler", "erfassungsbogen.app läuft im Browser, als App auf dem Handy oder am Rechner. Keine Anmeldung, kein Konto – alle Daten bleiben auf dem Gerät.", {
          tts: "erfassungsbogen punkt app läuft im Browser, als App auf dem Handy oder am Rechner. Keine Anmeldung, kein Konto – alle Daten bleiben auf dem Gerät.",
        }),
        z("a02", "erzaehler", "Wir klicken auf „Neuen Bogen erstellen“."),
      ],
    },
    {
      id: "einheit",
      bild: "Seite 1 „Einheit“: Organisation THW, Ort tippen → Vorschlag Oldenburg (NI), Einheitstyp aus Liste → StAN-Vorbelegung, Regionalstelle und Landesverband per Knopf.",
      zeilen: [
        z("a03", "erzaehler", "Seite eins: die Einheit. Organisation THW ist schon ausgewählt. Beim Ort tippen wir nur „Olden“ – die App kennt alle Ortsverbände und schlägt Oldenburg vor, mit Dienststellen-Kürzel, Telefon und E-Mail."),
        z("a04", "erzaehler", "Als Einheitstyp wählen wir die Fachgruppe Wasserschaden/Pumpen B aus der Liste. Damit kommt die Vorbelegung nach StAN: zwölf Personen und vier Fahrzeuge sind bereits angelegt.", {
          tts: "Als Einheitstyp wählen wir die Fachgruppe Wasserschaden Pumpen B aus der Liste. Damit kommt die Vorbelegung nach Schtan: zwölf Personen und vier Fahrzeuge sind bereits angelegt.",
        }),
        z("a05", "erzaehler", "Ein Klick legt Regionalstelle und Landesverband an: Oldenburg und Bremen, Niedersachsen. Weiter."),
      ],
    },
    {
      id: "einsatz",
      bild: "Seite 2 „Einsatz“: Zeitraum heute bis morgen, Ort/Auftrag tippen, „Einsatzbeginn eintragen“, Haken „Übung“ kurz gezeigt.",
      zeilen: [
        z("a06", "erzaehler", "Seite zwei: der Einsatz. Zeitraum von heute bis morgen; als Ort und Auftrag tragen wir „Hochwasser Hunte, Bereitstellungsraum Weser-Ems-Hallen“ ein."),
        z("a07", "erzaehler", "Den Einsatzbeginn setzt ein Klick auf die aktuelle Uhrzeit. Wäre es eine Übung, käme hier der Haken – die Kennzeichnung bleibt bis in PDF und QR-Code erhalten, damit am Meldekopf niemand eine Übung zur Lage zählt.", {
          tts: "Den Einsatzbeginn setzt ein Klick auf die aktuelle Uhrzeit. Wäre es eine Übung, käme hier der Haken – die Kennzeichnung bleibt bis in Pe-De-Eff und QR-Code erhalten, damit am Meldekopf niemand eine Übung zur Lage zählt.",
        }),
      ],
    },
    {
      id: "personal",
      bild: "Seite 3 „Personal“: zwölf vorbelegte Karten, „Namen einfügen…“ mit Liste, Stärke zählt sich hoch, Geschlecht setzen, Telefon beim Gruppenführer.",
      zeilen: [
        z("a08", "erzaehler", "Seite drei: das Personal. Die zwölf Plätze aus der StAN stehen schon da – Gruppenführerin, zwei Truppführer, neun Helferinnen und Helfer.", {
          tts: "Seite drei: das Personal. Die zwölf Plätze aus der Schtan stehen schon da – Gruppenführerin, zwei Truppführer, neun Helferinnen und Helfer.",
        }),
        z("a09", "erzaehler", "Statt jeden Namen einzeln zu tippen, fügen wir die Liste aus dem Ortsverband ein. Die App verteilt sie auf die Karten."),
        z("a10", "erzaehler", "Die Stärke rechnet sie dabei selbst: eins, zwei, neun – Gesamt zwölf. Geschlecht und Verpflegung zählen später für Unterbringung und Küche. Und für Rückfragen trägt die Gruppenführerin ihre Handynummer ein.", {
          tts: "Die Stärke rechnet sie dabei selbst: eins, zwei, neun – Gesamt zwölf. Geschlecht und Verpflegung zählen später für Unterbringung und Küche. Und für Rückfragen trägt die Gruppenführerin ihre Handynummer ein.",
        }),
      ],
    },
    {
      id: "fahrzeuge",
      bild: "Seite 4 „Fahrzeuge“: vier vorbelegte Fahrzeuge mit taktischem Zeichen und Funkrufname; Kennzeichen eintippen; Hinweise verschwinden.",
      zeilen: [
        z("a11", "erzaehler", "Seite vier: die Fahrzeuge. Auch sie kommen aus der StAN – mit taktischem Zeichen und fertigem Funkrufnamen: Heros Oldenburg 48/43 für den LKW, 48/34 für den Mannschaftslastwagen.", {
          tts: "Seite vier: die Fahrzeuge. Auch sie kommen aus der Schtan – mit taktischem Zeichen und fertigem Funkrufnamen: Heros Oldenburg achtundvierzig dreiundvierzig für den LKW, achtundvierzig vierunddreißig für den Mannschaftslastwagen.",
        }),
        z("a12", "erzaehler", "Wir ergänzen nur die Kennzeichen. Fehlt etwas, sagt es die App sofort – und rechnet nebenbei, ob die Sitzplätze für die Mannschaft reichen."),
      ],
    },
    {
      id: "sofortbedarf",
      bild: "Seite 5 „Sofortbedarf“: Haken, Verpflegung für zwölf, 300 l Diesel.",
      zeilen: [
        z("a13", "erzaehler", "Seite fünf: der Sofortbedarf. Verpflegung für zwölf Personen, dreihundert Liter Diesel für die Pumpen. Nur anhaken, was die Einheit wirklich braucht – der Meldekopf zählt es über alle Einheiten zusammen."),
      ],
    },
    {
      id: "uebersicht",
      bild: "Seite 6 „Gesamtübersicht“: Stärke, Prüfhinweis grün, Abschnitte mit „Bearbeiten“, PDF-Vorschau, QR-Code.",
      zeilen: [
        z("a14", "erzaehler", "Die Gesamtübersicht zeigt den ganzen Bogen auf einer Seite – und prüft ihn: alle Angaben vollständig und plausibel. Jeder Abschnitt lässt sich hier noch nachbearbeiten."),
        z("a15", "erzaehler", "Die PDF-Vorschau zeigt den Bogen im gewohnten Papier-Layout. Wer drucken will, druckt. Am Ende der PDF steht der QR-Code.", {
          tts: "Die Pe-De-Eff-Vorschau zeigt den Bogen im gewohnten Papier-Layout. Wer drucken will, druckt. Am Ende der Pe-De-Eff steht der QR-Code.",
        }),
      ],
    },
    {
      id: "uebergabe",
      bild: "„Bogen übergeben…“ → QR-Code im Vollbild.",
      zeilen: [
        z("a16", "erzaehler", "Der komplette Bogen steckt in diesem Code. Kein Server, kein Netz, keine Kopplung – die Gegenstelle scannt ihn vom Display oder vom Papier."),
      ],
    },
    {
      id: "meldekopf",
      bild: "Startseite → „Neue Einsatz-Sammlung…“ → „Hochwasser Hunte“ → Sammlung mit drei Einheiten; der Oldenburger Bogen kommt dazu; Summen springen hoch.",
      zeilen: [
        z("a17", "erzaehler", "Zurück am Meldekopf. Dort läuft dieselbe App – mit einer Einsatz-Sammlung: „Hochwasser Hunte“."),
        z("a18", "erzaehler", "Delmenhorst, Cloppenburg und Westerstede sind schon drin. Jetzt kommt der Oldenburger Bogen dazu – und die Stärke aller anwesenden Einheiten wird sofort neu gerechnet, der Sofortbedarf gleich mit."),
        z("a19", "erzaehler", "Für die Weitermeldung an die Einsatzleitung gibt es das Sammel-PDF und CSV-Listen. Und wer eine Einheit nur im Stehen aufnimmt, nutzt die Schnellerfassung: nur Stärke, Führungskraft, Fahrzeuge.", {
          tts: "Für die Weitermeldung an die Einsatzleitung gibt es das Sammel-Pe-De-Eff und C-S-V-Listen. Und wer eine Einheit nur im Stehen aufnimmt, nutzt die Schnellerfassung: nur Stärke, Führungskraft, Fahrzeuge.",
        }),
      ],
    },
  ],
};

/* ------------------------------------------------------------------------ */
/* Block 3: Comic-Abspann                                                    */
/* ------------------------------------------------------------------------ */

export const COMIC_ABSPANN = {
  id: "abspann",
  musik: "nacht-ende",
  szenen: [
    {
      id: "schluss",
      bild:
        "Panel: Zurück am Zelt, Regen lässt nach. Sina grinst mit Tablet, Merle daneben, im Hintergrund die Fahrzeugreihe. Hauke hält seinen nassen Zettel hoch und schaut aufs Handy. Sprechblasen.",
      sfx: [{ key: "regen-leise", at: 0, dauer: "szene" }, { key: "scan-piep", at: "nach:i19" }],
      zeilen: [
        z("i19", "hauke", "Und das geht auch mit unserem alten Handy?", { pauseDavor: 1.0 }),
        z("i20", "merle", "Browser auf, Bogen ausfüllen, QR-Code zeigen. Beim nächsten Einsatz änderst du nur noch, was anders ist.", { pauseDavor: 0.4 }),
        z("i21", "sina", "Nächste Einheit bitte – gern mit QR-Code!", { pauseDavor: 0.6 }),
      ],
    },
    {
      id: "endkarte",
      bild:
        "Endkarte: Logo-Kachel, groß „erfassungsbogen.app“, darunter drei Stempel: „kostenlos“, „offline“, „ohne Anmeldung“. Klein: „Freie Software (EUPL-1.2) · Fiktive Lage, fiktive Personen“.",
      sfx: [{ key: "stempel", at: "bei:i22", mehrfach: 3 }],
      zeilen: [
        z("i22", "erzaehler", "erfassungsbogen.app – kostenlos, offline, ohne Anmeldung. Freie Software für alle Einheiten im Bevölkerungsschutz.", {
          tts: "erfassungsbogen punkt app – kostenlos, offline, ohne Anmeldung. Freie Software für alle Einheiten im Bevölkerungsschutz.",
          pauseDavor: 0.8,
          pauseDanach: 3.0,
        }),
      ],
    },
  ],
};

export const BLOECKE = [COMIC_INTRO, APP, COMIC_ABSPANN];

/* ------------------------------------------------------------------------ */
/* Soundeffekte (ElevenLabs Sound Generation) – key → Prompt, Dauer          */
/* ------------------------------------------------------------------------ */

export const SFX = {
  regen: { prompt: "steady heavy rain falling on a tent canvas at night, distant wind, looping ambience, no music", dauer: 22, loop: true },
  "regen-leise": { prompt: "light rain tapering off on tent canvas, calm night ambience, distant dripping, no music", dauer: 18, loop: true },
  donner: { prompt: "distant rolling thunder, soft, far away, no rain", dauer: 4 },
  "zelt-plane": { prompt: "tent tarp flapping once in wind gust, rustle of fabric", dauer: 2 },
  "lkw-anfahrt": { prompt: "heavy diesel truck slowly pulling up and stopping, air brakes hiss, engine idle, wet asphalt", dauer: 5 },
  "funk-klick": { prompt: "handheld two-way radio push-to-talk click with short static squelch burst", dauer: 0.8 },
  "papier-nass": { prompt: "wet paper sheet being handed over and unfolded, soft soggy rustle", dauer: 1.8 },
  taschenrechner: { prompt: "pocket calculator keys being pressed quickly, several clicks", dauer: 2 },
  stift: { prompt: "ballpoint pen scribbling hastily on paper on a clipboard", dauer: 2 },
  "scan-piep": { prompt: "short friendly barcode scanner confirmation beep, single clean electronic chirp", dauer: 0.8 },
  wusch: { prompt: "smooth cinematic whoosh transition, short, airy", dauer: 1.5 },
  stempel: { prompt: "single rubber stamp thump on paper, dry and short", dauer: 0.8 },
  // App-Teil
  klick: { prompt: "single soft mouse click, very short, clean UI click", dauer: 0.4 },
  tippen: { prompt: "quick laptop keyboard typing, soft keys, short burst", dauer: 3, loop: true },
  bestaetigt: { prompt: "soft positive UI confirmation chime, two gentle notes, short", dauer: 1.2 },
  blaettern: { prompt: "soft page turn swipe, light paper whoosh, short", dauer: 0.8 },
};

/* ------------------------------------------------------------------------ */
/* Musikbetten (ElevenLabs Music) – key → Prompt, Länge                      */
/* ------------------------------------------------------------------------ */

export const MUSIK = {
  nacht: {
    prompt:
      "Instrumental, cinematic but understated: slow pulsing synth bass, sparse electric piano notes, light rain-like percussion texture, tense yet warm, suitable as low background under dialogue, no vocals, no drums drop, 85 bpm, minor key",
    laengeMs: 120000,
    pegelDb: -21,
  },
  werkstatt: {
    prompt:
      "Instrumental corporate explainer background: light acoustic guitar plucks, soft marimba, gentle upbeat rhythm with brushed percussion, friendly and focused, steady and unobtrusive under narration, no vocals, 100 bpm, major key",
    laengeMs: 240000,
    pegelDb: -23,
  },
  "nacht-ende": {
    prompt:
      "Instrumental warm resolution: the tension releases, soft piano chords over a gentle synth pad, hopeful and calm, slow, ends with a clear final chord, no vocals, 70 bpm, major key",
    laengeMs: 40000,
    pegelDb: -19,
  },
};

/** Alle Sprechzeilen in Filmreihenfolge. */
export function alleZeilen() {
  return BLOECKE.flatMap((b) => b.szenen.flatMap((s) => s.zeilen));
}
