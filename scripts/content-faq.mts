/**
 * Erzeugt den FAQ-Bereich der Content-Seiten unter public/ aus **einer** Quelle:
 * die sichtbaren Aufklappblöcke `<details class="frage">` **und** die
 * `mainEntity`-Einträge des `FAQPage`-JSON-LD derselben Seite.
 *
 * Warum ein Generator: Beides wurde bisher von Hand gepflegt, und beides ist
 * auseinandergelaufen.
 *
 * 1. `papier-oder-digital.html` trug ein `FAQPage` mit zwei Fragen und **keinen
 *    einzigen** sichtbaren Aufklapper. Google verlangt für FAQ-Auszeichnung
 *    sichtbaren Inhalt auf der Seite; ein Verstoß trifft nicht die Seite,
 *    sondern als manuelle Maßnahme die ganze Domain. Die beiden Fragen stehen
 *    jetzt sichtbar auf der Seite (Antworttexte wörtlich aus dem Schema
 *    übernommen, in die Absatzform der anderen Seiten gebracht).
 * 2. Von 28 Seiten mit Aufklappern hatten genau zwei (`asb.html`,
 *    `malteser.html`) sichtbaren Fragetext und Schema-Fragetext deckungsgleich;
 *    auf zwölf Seiten war die Schnittmenge leer. Schwerster Fall war
 *    `anleitung.html`: Das Schema meldete an sechster Stelle „Wie sammelt ein
 *    Meldekopf mehrere Einheiten?" — eine Frage, die auf der Seite nirgends
 *    steht, während die dort sichtbare Frage im Schema fehlte.
 * 3. Auf 15 Seiten wich schon die Anzahl ab, jeweils um eins: auf den zwölf
 *    Länderseiten fehlte die von `content-laender.mts` erzeugte Frage „Was ist
 *    mit anderen Bundesländern?", auf `bbk.html` und `bundeswehr.html` die
 *    Frage nach der Zusammenarbeit mit Einheiten anderer Träger.
 *
 * Was das Skript schreibt:
 *
 * - `<!-- FAQ:START -->` … `<!-- FAQ:END -->` — die Überschrift und die
 *   Aufklappblöcke der Seite, im Markup-Muster, das `content-offenlegung.mts`
 *   erzeugt (`<details class="frage">` mit `<summary><h3>…</h3></summary>` und
 *   dem Antwortabsatz). Beide Skripte schreiben damit dieselbe Form; sie
 *   können in beliebiger Reihenfolge laufen, ohne sich gegenseitig umzuschreiben.
 * - Die `mainEntity`-Liste des vorhandenen `FAQPage` im `@graph`. Alles übrige
 *   JSON-LD (WebPage, BreadcrumbList, Organization, SoftwareApplication …)
 *   bleibt unangetastet — ersetzt wird nur, was zwischen `"mainEntity": [` und
 *   der schließenden Klammer steht.
 *
 * **Das Schema wird von der fertigen Seite abgelesen, nicht aus den Daten
 * unten erzeugt.** Der sichtbare Block wird zuerst geschrieben, danach liest
 * das Skript die Datei erneut und leitet die `mainEntity`-Liste aus *allen*
 * `<details class="frage">` in Dokumentreihenfolge ab — den eigenen wie denen
 * fremder Generatoren. Damit gilt „Schema = sichtbarer Inhalt" bauartbedingt,
 * auch für jeden künftigen Generator, der einen weiteren Aufklapper in den
 * Bereich setzt.
 *
 * Anlass war die Frage „Was ist mit anderen Bundesländern?", die
 * `content-laender.mts` auf den zwölf Länderseiten als letzten Aufklapper in
 * den Bereich schrieb. Sie steht dort **nicht mehr**: Der Absprung zu den
 * anderen Ländern ist Navigation, keine Frage, und steht seit dem Umbau als
 * eigener Abschnitt unterhalb des Abschlussknopfes (Begründung im Kopf von
 * `content-laender.mts`). Die Leserichtung bleibt trotzdem, wie sie ist — sie
 * kostet nichts und hält die Zusage auch für den nächsten Fall.
 *
 * **Reihenfolge der Läufe.** `content-faq` liest die fertige Seite, also muss
 * es als letztes laufen, sobald ein anderer Generator im FAQ-Bereich etwas
 * hinzufügt oder wegnimmt:
 *
 *     npm run content-laender && npm run content-laenderkarte \
 *       && npm run content-offenlegung && npm run content-faq
 *
 * Der Test in `scripts/content-seiten.test.ts` schlägt an, wenn der letzte
 * Lauf ausbleibt: Das Schema nennt dann eine Frage mehr oder weniger als die
 * Seite zeigt.
 *
 * **Welcher Fragetext gilt.** Maßgeblich ist ab jetzt der sichtbare Text — er
 * ist das, was ein Mensch liest. Wo die bisherige Schema-Fassung mehr
 * Suchbegriffe trug, ist sie aber nicht verloren: Sie wurde als sichtbarer Text
 * übernommen, wenn sie einen **sachlichen** Bezug ergänzt, den die sichtbare
 * Frage nur aus dem Seitenkontext bezieht (Bundesland, Organisation,
 * Fachbegriff), und dabei ohne Produktnamen auskommt — „Sind die
 * Katastrophenschutz-Vorlagen für Sachsen amtlich?" statt zwölfmal „Sind die
 * Vorlagen amtlich?". Wo die Schema-Fassung dagegen den Produktnamen einsetzt
 * („Braucht der Einheiten-Erfassungsbogen für das THW eine Freigabe?"), verrät
 * sie den Prospekt und der sichtbare Text gewinnt: So fragt niemand.
 *
 * **Welche Frage offen steht.** Vorher war es ausnahmslos die erste — mit dem
 * Ergebnis, dass `drk.html` den Datenschutz aufgeklappt zeigte und
 * `malteser.html` bei gleicher Zielgruppe und gleicher Sorge „Passt das PDF
 * zum gewohnten Papierbogen?". Offen steht ab jetzt die Frage mit dem größten
 * Einwandgewicht: die, an der die Nutzung scheitert, wenn sie niemand
 * beantwortet. Praktisch heißt das:
 *
 * - Auf den Organisationsseiten und den Anwendungsfallseiten der Verbleib der
 *   Personendaten. Kosten sind ein Einwand, der sich in einem Satz erledigt;
 *   Personendaten sind der, wegen dessen ein Wehrführer nein sagt.
 * - Auf allen Katastrophenschutz-Seiten die Verbindlichkeit („Sind die
 *   Vorlagen amtlich?"). Wer eine Vorbelegung für amtlich hält, baut darauf
 *   eine Aufstellung — der Irrtum wiegt dort schwerer als alles andere.
 * - Auf den Seiten, die über eine Fachfrage gefunden werden und diese Frage im
 *   Titel führen (Stärkemeldung 1/8/9, die drei Fachgruppenseiten, „Papier
 *   oder digital?"), die Fachfrage selbst: Steht sie zugeklappt, denkt der
 *   Leser, er sei auf der falschen Seite gelandet.
 *
 * Weil der offene Block der erste sein muss (siehe `FaqFrage.offen`), ist das
 * zugleich eine Aussage über die Reihenfolge.
 *
 * **Jede Frage hat eine Adresse.** Der Bereich trägt auf jeder Seite
 * `id="haeufige-fragen"` an der `<h2>` (bisher hatte das eine einzige Seite,
 * weil ihr Sprungmenü es brauchte), und jedes `<details>` trägt
 * `id="frage-<anker>"`. Der Anker steht als eigenes Datenfeld bei der Frage,
 * nicht als Slug aus ihrem Text — Begründung bei `FaqFrage.anker`.
 *
 * Damit ein geteilter Link etwas nützt, muss die angesprungene Frage
 * **aufgeklappt** ankommen; ein `<details>` öffnet sich bei einem
 * Anker-Treffer nicht von selbst. Gelöst ist das in `content-offenlegung.mts`
 * mit zwei CSS-Regeln auf `.frage:target` — ohne Skript, wie alles auf diesen
 * Seiten, und mit demselben Zwei-Schreibweisen-Kniff wie die vorhandene
 * `@media print`-Regel.
 *
 * **Kanonische Bausteine statt acht Fassungen.** Kosten, Konto und Verbleib
 * der Personendaten waren auf acht Seiten in acht Formulierungen beantwortet.
 * Beides steht jetzt einmal da — `kosten()` und `personendaten()` unten — und
 * wird von jeder Seite wiederverwendet; seitenspezifisch bleibt der
 * Einstiegssatz und die Frage („der Helferinnen und Helfer", „der Soldatinnen
 * und Soldaten"). Zwei Sonderfälle haben eigene Bausteine:
 * `PERSONENDATEN_FREMD` für den Meldekopf, wo **fremde** Personendaten auf ein
 * fremdes Gerät kommen und die Sammlung sich nach 90 Tagen selbst abräumt, und
 * `DATENSCHUTZBEAUFTRAGTER` für die Frage, die Ortsbeauftragte und Wehrführer
 * tatsächlich stellen.
 *
 * **Höchstens sechs Fragen je Seite,** Aufklapper anderer Generatoren
 * mitgezählt (heute setzt keiner mehr einen). `anleitung.html` stand bei acht; drei Fragen sind dort
 * entfallen, deren Antwort im Fließtext derselben Seite schon steht (die
 * Organisationsliste, die eigenen Vorlagen) oder im Kosten-Baustein aufgeht
 * (der Verweis auf den Quellcode).
 *
 * Aufruf (Node ≥ 22): npm run content-faq
 *
 * Idempotent: Vorhandene Blöcke werden ersetzt, nicht verdoppelt; ein zweiter
 * Lauf meldet 0 geänderte Seiten.
 *
 * **Ein Muster für die Überschrift: „Häufige Fragen zu …".** Vorher standen
 * 27 Wortlaute auf 28 Seiten, und dahinter lagen zwei konkurrierende Muster:
 * „Häufige Fragen **aus** dem/der …" auf den sieben Organisationsseiten und
 * „Häufige Fragen **zu**(m/r/ den) …" auf den übrigen 21. Gewonnen hat „zu",
 * aus einem sachlichen Grund: „aus der Feuerwehr" nennt, wer fragt, und das
 * trägt nur, solange der Gegenstand eine Organisation ist — „Häufige Fragen
 * aus der Stärkemeldung" gibt es nicht. „zu" nennt, worum es geht, und das
 * lässt sich auf jeden der 28 Gegenstände anwenden. Nebenbei ist es das
 * Muster der Mehrheit; unverändert bleiben dadurch 19 Überschriften.
 *
 * Die Regel im Ganzen: **„Häufige Fragen zu" + Gegenstand der Seite im Dativ**
 * (Artikel verschmolzen: zum/zur/zu den), und der Gegenstand ist der kürzeste
 * Name, den die Seite selbst für sich benutzt — die Abkürzung, wo die Seite
 * eine führt (ASB, DLRG, DRK, JUH, MHD, THW, FGr R), sonst das ausgeschriebene
 * Wort (Feuerwehr, Stärkemeldung, Meldekopf, Katastrophenschutz Bayern). Kein
 * Zusatz, der nur die Zeile füllt: aus „Häufige Fragen zur FGr R **im
 * Erfassungsbogen**" wird „Häufige Fragen zur FGr R" — dass es um den
 * Erfassungsbogen geht, steht in der `h1` darüber. Der Gegenstand bleibt
 * dagegen stehen, auch wo er lang ist: Er ist es, wonach gesucht wird.
 *
 * Bewusst nicht angefasst: das CSS (es steht in `content-offenlegung.mts`) und
 * alle Seiten ohne `FAQPage`: `uebersicht.html`, `vorlage.html`, die
 * Rechtstexte und `404.html`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

interface FaqFrage {
  /** Der sichtbare Fragetext. Steht im `<summary>` als `<h3>` und im Schema als `name`. */
  frage: string;
  /**
   * Das Sprungziel dieser Frage, ohne Vorsilbe — geschrieben wird daraus
   * `id="frage-<anker>"` am `<details>`.
   *
   * **Warum ein eigenes Feld und kein Slug aus dem Fragetext.** Ein geteilter
   * Link ist ein Versprechen: Wer einem Kameraden
   * `…/thw.html#frage-personendaten` schickt, soll auch in einem Jahr dort
   * landen. Ein aus dem Text erzeugtes Sprungziel bräche bei jeder
   * Umformulierung — und Fragetexte werden umformuliert, Schritt 2 dieses
   * Vorhabens hat es gerade getan. Der Anker steht deshalb hier und wandert
   * nicht mit dem Wortlaut.
   *
   * Kurz und sprechend: `personendaten`, `kosten`, `amtlich` — nicht der
   * halbe Fragesatz. Innerhalb einer Seite muss er eindeutig sein; das prüft
   * `main()` beim Schreiben und der Test in `scripts/content-seiten.test.ts`
   * am Ergebnis. Über Seiten hinweg ist Gleichklang erwünscht: Dieselbe Frage
   * trägt überall denselben Anker, sonst muss man raten, wie er auf der
   * Nachbarseite heißt.
   */
  anker: string;
  /**
   * Die Antwort als HTML-Absatz. Enthält Links, die erhalten bleiben müssen;
   * fürs Schema wird daraus Klartext. Zeilenumbrüche wie im Quelltext, der
   * Einzug wird beim Schreiben gesetzt.
   */
  antwort: string;
  /**
   * Dieser Block steht aufgeklappt. Genau einer je Seite, und er muss der
   * **erste** der Seite sein — der Test in `scripts/content-seiten.test.ts`
   * prüft das, und inhaltlich wäre alles andere seltsam: Ein aufgeklappter
   * Block in der Mitte sieht aus wie ein Versehen.
   *
   * Welcher es ist, steht im Kopf dieser Datei unter „Welche Frage offen
   * steht". Ohne Angabe fällt es auf den ersten zurück.
   */
  offen?: boolean;
}

interface FaqSeite {
  /**
   * Die `<h2>` über dem Bereich. Immer nach demselben Muster — „Häufige Fragen
   * zu" plus Gegenstand der Seite im Dativ, siehe Kopf dieser Datei. Wer hier
   * eine Seite ergänzt, schreibt keinen neuen Satzbau, sondern setzt den
   * Gegenstand ein.
   */
  ueberschrift: string;
  fragen: FaqFrage[];
}

// ---------------------------------------------------------------------------
// Kanonische Bausteine
// ---------------------------------------------------------------------------

const GITHUB = `<a href="https://github.com/wattnpapa/erfassungsbogen">GitHub</a>`;
const DATENSCHUTZ = `<a href="./datenschutz.html">Datenschutzerklärung</a>`;
const TECHNIK = `<a href="./open-source-datenschutz.html">Open Source und Technik</a>`;

/**
 * Kosten, Lizenz, Konto — **ein** Wortlaut für alle Seiten.
 *
 * Vorher stand derselbe Absatz in acht Fassungen da (drk, bbk, bundeswehr,
 * thw, feuerwehr, dlrg, asb, anleitung), jede mit einer anderen Auswahl aus
 * „kostenlos / EUPL-1.2 / Quellcode / keine Werbung / keine Bezahlschranke /
 * kein Konto". Acht Fassungen heißt: Ändert sich die Lizenz, muss man sie
 * achtmal finden. Der Einstiegssatz bleibt seitenspezifisch, weil er die
 * jeweilige Frage beantwortet („Nichts." vs. „Nein und nein.") — die Substanz
 * dahinter ist überall dieselbe.
 */
function kosten(einstieg: string, zusatz = ""): string {
  return `<p>
${einstieg} Die App ist freie Software unter der EUPL-1.2 — kostenlos, ohne
Konto, ohne Bezahlschranke und ohne Werbung; der Quellcode liegt offen auf
${GITHUB}.${zusatz}
</p>`;
}

/**
 * Wo die Personendaten der **eigenen** Einsatzkräfte bleiben — ein Wortlaut
 * für alle Seiten. Die organisationsspezifische Wendung steckt in der Frage
 * („der Helferinnen und Helfer", „der Soldatinnen und Soldaten"), nicht in der
 * Antwort: Was die App tut, ist für alle dasselbe.
 *
 * Der letzte Satz ist kein Schmuck. Er beantwortet die Anschlussfrage, die
 * sonst offen bliebe — ob man für eine Stärkemeldung überhaupt Namen erfassen
 * muss.
 */
function personendaten(zusatz = ""): string {
  return `<p>
Auf deinem Gerät. Es gibt keinen Server, keine Cloud und keine Konten;
weitergegeben wird nur, was du selbst als PDF, Datei, QR-Code oder Link
übergibst — nachzulesen in der ${DATENSCHUTZ}. Namen sind ohnehin optional:
Für die Stärkemeldung genügen die Zahlen.${zusatz}
</p>`;
}

/**
 * Der Meldekopf ist der Sonderfall: Dort liegen **fremde** Personendaten auf
 * einem Gerät, das der Einheit nicht gehört, die sie gemeldet hat. Deshalb
 * eine eigene Antwort — mit der Frist, die das Programm tatsächlich fährt
 * (`AUFRAEUM_FRIST_MS` und `AUFRAEUM_HINWEIS_MS` in src/app/einsaetze.ts,
 * ebenso in der Datenschutzerklärung).
 */
const PERSONENDATEN_FREMD = `<p>
Auf dem Gerät, das du bedienst — es gibt keinen Server und keine Cloud. Weil
eine Einsatz-Sammlung Personendaten fremder Einheiten enthält, räumt die App
sie selbst ab: 90 Tage ohne Änderung, dann ist die Sammlung weg; ab dem
60. Tag kündigt die Liste das an, damit du sie vorher ausgeben kannst. Deine
eigenen Bögen und Vorlagen bleiben liegen (${DATENSCHUTZ}).
</p>`;

/**
 * Die Frage, die Ortsbeauftragte und Wehrführer wirklich stellen. „Brauche ich
 * eine Freigabe?" mit „Nein" zu beantworten ist technisch richtig und
 * dienstrechtlich zu kurz: Gefragt ist, was man dem Datenschutzbeauftragten
 * der eigenen Organisation vorlegt.
 *
 * Bewusst keine Rechtsauskunft — die Antwort nennt die beiden Seiten, die das
 * Material tragen, und die eine Aussage, die dort ausdrücklich steht: Für die
 * Geräte ist die einsetzende Stelle verantwortlich (datenschutz.html, Punkt 5).
 */
const DATENSCHUTZBEAUFTRAGTER = `<p>
Am besten die beiden Seiten, die er ohnehin sehen will: Die ${DATENSCHUTZ}
nennt Verantwortlichen, Rechtsgrundlagen und Betroffenenrechte,
${TECHNIK} führt jeden Speicherort und jede Verbindung der Anwendung einzeln
auf. Kurzfassung: Bogendaten bleiben im lokalen Speicher des Geräts; für die
Geräte selbst und die dort gespeicherten Daten ist die einsetzende Stelle
verantwortlich.
</p>`;

const SEITEN: Record<string, FaqSeite> = {
  "anleitung.html": {
    ueberschrift: "Häufige Fragen zur App",
    fragen: [
      {
        frage: "Wo bleiben die eingegebenen Daten?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
      {
        frage: "Brauche ich eine Anmeldung oder eine Internetverbindung?",
        anker: "anmeldung",
        antwort: `<p>
Nein. Es gibt keine Registrierung. Du musst die Seite einmal laden;
danach arbeitet sie offline weiter, weil sie sich als Web-App in deinem
Gerät ablegt. Die installierten Apps brauchen von vornherein kein Netz.
</p>`,
      },
      {
        frage: "Wie kommt ein Bogen ohne Netz auf ein anderes Gerät?",
        anker: "qr-uebergabe",
        antwort: `<p>
Über den QR-Code auf der letzten PDF-Seite oder auf dem Bildschirm: Er
trägt den kompletten Bogen in sich. Das empfangende Gerät scannt ihn und
hat den Bogen — ganz ohne Verbindung zwischen den Geräten. Alternativ
sicherst du den Bogen als Datei und überträgst ihn so.
</p>`,
      },
      {
        frage: "Wie sammelt ein Meldekopf mehrere Einheiten?",
        anker: "meldekopf",
        antwort: `<p>
Eintreffende Einheiten erfasst du per QR-Scan, aus Datei oder am Tablet
von Hand und sammelst sie unter einem Einsatz. Die App zählt Stärke und
Bedarf über alle anwesenden Einheiten laufend zusammen, bildet
Zwischensummen je Zug und gibt alles als Sammel-PDF oder Datei an die
nächste Führungsstelle weiter — mehr dazu auf der Seite
<a href="./meldekopf.html">Meldekopf digital</a>.
</p>`,
      },
      {
        frage: "Passt der Ausdruck zum gewohnten Papierformular?",
        anker: "papierformular",
        antwort: `<p>
Ja, das PDF folgt dem bekannten Papier-Layout des Einheiten-Erfassungsbogens,
du kannst es unverändert in den Papierlauf geben. Fahrzeuge erscheinen
mit ihrem taktischen Zeichen nach DV 102.
</p>`,
      },
    ],
  },
  "autor.html": {
    ueberschrift: "Häufige Fragen zum Autor",
    fragen: [
      {
        frage: "Welche Qualifikation steht hinter den Inhalten?",
        anker: "qualifikation",
        antwort: `<p>
Johannes Rudolph ist seit 2007 beim Technischen Hilfswerk, seit 2011 im
Fachzug Führung und Kommunikation: Gruppenführer der Fachgruppe Kommunikation,
ausgebildeter Zugführer und Sachgebietsleiter, Bereichsausbilder für
Sprechfunk. Beruflich arbeitet er an der Digitalisierung von Abläufen und
Prozessen.
</p>`,
        offen: true,
      },
      {
        frage: "Ist der Einheiten-Erfassungsbogen ein offizielles Angebot des THW?",
        anker: "kein-amtliches-angebot",
        antwort: `<p>
Nein. Es ist ein privates, ehrenamtliches Projekt ohne amtlichen Charakter —
weder vom THW noch von einer Feuerwehr, einer Hilfsorganisation oder einer
Behörde. Maßgeblich sind die geltenden Dienstvorschriften und die
Festlegungen der eigenen Organisation.
</p>`,
      },
      {
        frage: "Woher stammen die Beispielbögen?",
        anker: "beispielboegen",
        antwort: `<p>
Aus der Auswertung veröffentlichter Vorschriften: Katastrophenschutz- und
Feuerwehrverordnungen der Länder, Stärke- und Ausstattungsnachweisungen und
veröffentlichte Gliederungen der Hilfsorganisationen. Sie geben wieder, was in
der Vorschrift steht — nicht den Bestand vor Ort. Welche Vorschrift hinter
einem Satz Bögen steht, nennt die jeweilige Seite.
</p>`,
      },
      {
        frage: "Ersetzt die App das Papier?",
        anker: "papier",
        antwort: `<p>
Nein — sie erzeugt es. Die App druckt den gewohnten Vordruck als PDF; der
QR-Code auf dem Blatt macht dasselbe Blatt zusätzlich maschinenlesbar. Fällt
Strom, Netz oder Gerät aus, wird auf Papier weitergearbeitet. Der Vergleich
der Wege steht unter <a href="./papier-oder-digital.html">Papier oder digital?</a>
</p>`,
      },
      {
        frage: "Was kostet die App und wer pflegt sie?",
        anker: "kosten",
        antwort: kosten("Nichts.", " Entwickelt wird sie ehrenamtlich, neben dem eigenen Dienst."),
      },
    ],
  },
  "asb.html": {
    ueberschrift: "Häufige Fragen zum ASB",
    fragen: [
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Wie schnell ist eine Einheit erfasst?",
        anker: "tempo",
        antwort: `<p>
Mit gespeicherter Vorlage: unter einer Minute — laden, mustern, fertig.
Ohne Vorlage führt dich der Assistent in fünf Schritten durch Einheit,
Einsatz, Personal, Fahrzeuge und Sofortbedarf; am Meldekopf reicht dir
die Schnellerfassung mit Stärke und Fahrzeugen.
</p>`,
      },
      {
        frage: "Lassen sich die Daten in andere Systeme übernehmen?",
        anker: "export",
        antwort: `<p>
Ja — als CSV-Export der Einsatz-Sammlung für Tabellen und Stabsarbeit,
als Datei zum Wiedereinlesen in die App und als PDF für den Papierlauf.
Einen Server, an den deine Daten fließen, gibt es bewusst nicht.
</p>`,
      },
      {
        frage: "Was kostet die App und wer pflegt sie?",
        anker: "kosten",
        antwort: kosten("Nichts.", " Entwickelt wird sie ehrenamtlich, neben dem eigenen Dienst."),
      },
    ],
  },
  "bbk.html": {
    ueberschrift: "Häufige Fragen zu den Bundeseinheiten",
    fragen: [
      {
        frage: "Wo bleiben die Daten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Welche Organisation wähle ich für die MTF?",
        anker: "mtf-organisation",
        antwort: `<p>
Die MTF-Fahrzeuge sind Bundeseigentum, werden aber von einem örtlichen
Träger besetzt — je nach Standort eine Feuerwehr oder eine
Hilfsorganisation. Wähle im Bogen die Organisation deines Trägers; die
Teileinheit trägst du als Einheitstyp frei ein (z. B. „Behandlungsbereitschaft
(MTF)").
</p>`,
      },
      {
        frage: "Funktioniert das mit Einheiten anderer Träger zusammen?",
        anker: "traegeruebergreifend",
        antwort: `<p>
Ja. Ein Meldekopf sammelt Feuerwehr-, DRK-, THW- und weitere
Hilfsorganisations-Einheiten in derselben Übersicht — der Bogen ist für
alle BOS und Hilfsorganisationen derselbe, nur Begriffe und taktische
Zeichen passen sich an.
</p>`,
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "bundeswehr.html": {
    ueberschrift: "Häufige Fragen zur Bundeswehr-Amtshilfe",
    fragen: [
      {
        frage: "Wo bleiben die Daten der Soldatinnen und Soldaten?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Welche Organisation wähle ich für Bundeswehr-Einheiten?",
        anker: "organisation",
        antwort: `<p>
Wähle im Bogen die Organisation „Bundeswehr"; die Einheit trägst du als
Einheitstyp frei ein (z. B. „Kreisverbindungskommando" oder
„SAR-Kommando Nörvenich"). Ein fest hinterlegtes Bundeswehr-Vokabular
für Funktionen und Fahrzeugtypen gibt es bislang nicht — Freitext
genügt.
</p>`,
      },
      {
        frage: "Funktioniert das mit zivilen Einheiten zusammen?",
        anker: "zivile-einheiten",
        antwort: `<p>
Ja. Ein Meldekopf sammelt Feuerwehr-, DRK-, THW- und weitere
Hilfsorganisations-Einheiten in derselben Übersicht wie
Bundeswehr-Kräfte — der Bogen ist für alle Organisationen derselbe,
nur Begriffe passen sich an.
</p>`,
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "dlrg.html": {
    ueberschrift: "Häufige Fragen zur DLRG",
    fragen: [
      {
        frage: "Wo bleiben die Daten der Helferinnen und Helfer?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Kostet die App etwas oder braucht sie ein Konto?",
        anker: "kosten",
        antwort: kosten("Nein und nein."),
      },
      {
        frage: "Funktioniert die Übergabe auch an andere Organisationen?",
        anker: "uebergabe-fremd",
        antwort: `<p>
Ja. Der Bogen ist BOS-übergreifend — ein Meldekopf der Feuerwehr oder des
THW liest den QR-Code einer DLRG-Einheit genauso ein wie den der eigenen
Organisation. Genau dafür ist das Werkzeug gemacht.
</p>`,
      },
    ],
  },
  "drk.html": {
    ueberschrift: "Häufige Fragen zum DRK",
    fragen: [
      {
        frage: "Wo bleiben die Daten der Helferinnen und Helfer?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Funktioniert der Bogen mit Einheiten anderer Träger zusammen?",
        anker: "traegeruebergreifend",
        antwort: `<p>
Ja. Ein Meldekopf sammelt DRK-, Feuerwehr-, THW- und
Johanniter-Einheiten in derselben Übersicht — der Bogen ist für alle
BOS und Hilfsorganisationen derselbe, nur Begriffe und Zeichen passen
sich an.
</p>`,
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "feuerwehr.html": {
    ueberschrift: "Häufige Fragen zur Feuerwehr",
    fragen: [
      {
        frage: "Wo landen die Daten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Was sage ich unserem Datenschutzbeauftragten?",
        anker: "datenschutzbeauftragter",
        antwort: DATENSCHUTZBEAUFTRAGTER,
      },
      {
        frage: "Was kostet die App — und wer steckt dahinter?",
        anker: "kosten",
        antwort: kosten("Nichts.", " Geschrieben hat sie ein ehrenamtlicher Helfer für die eigene Einheit."),
      },
      {
        frage: "Ersetzt das unser Papierformular?",
        anker: "papierformular",
        antwort: `<p>
Es erzeugt das Papierformular: Das PDF folgt dem gewohnten Layout des
Einheiten-Erfassungsbogens, du kannst es unverändert in den Papierlauf
geben. Der QR-Code macht dasselbe Blatt zusätzlich maschinenlesbar —
mehr dazu im Vergleich <a href="./papier-oder-digital.html">Papier oder digital?</a>
</p>`,
      },
    ],
  },
  "johanniter.html": {
    ueberschrift: "Häufige Fragen zur JUH",
    fragen: [
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Können mehrere SEGs unter einem Einsatz geführt werden?",
        anker: "mehrere-segs",
        antwort: `<p>
Ja. Die Einsatz-Sammlung bündelt beliebig viele Einheiten unter einem
Einsatz oder einer Übung, summiert Stärke und Bedarf laufend und gibt
alles als Sammel-PDF oder Datei an die nächste Führungsstelle weiter.
</p>`,
      },
      {
        frage: "Auf welchen Geräten läuft die App?",
        anker: "geraete",
        antwort: `<p>
Im Browser auf allen Systemen — nach dem ersten Aufruf auch offline.
Für Windows, macOS, Linux und Android gibt es installierbare Apps; auf
iPhone und iPad fügst du die Web-App über Safari zum Home-Bildschirm
hinzu.
</p>`,
      },
      {
        frage: "Braucht es eine Anmeldung oder eine Freigabe der IT?",
        anker: "kosten",
        antwort: kosten("Nein, weder noch: Es gibt keine Konten und keinen Server, den jemand freischalten müsste."),
      },
    ],
  },
  "katastrophenschutz-baden-wuerttemberg.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Baden-Württemberg",
    fragen: [
      {
        frage: "Sind die Baden-Württemberg-Vorlagen amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus der öffentlich zugänglichen VwV KatSD abgeleitet
und sorgfältig geprüft, aber kein amtliches Dokument. Maßgeblich bleibt
die Verwaltungsvorschrift selbst; deshalb kannst du jede Vorbelegung
frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Stimmt die Zuordnung zu Landkreisen genau mit der Verordnung überein?",
        anker: "landkreise",
        antwort: `<p>
Bei den meisten Einheiten ist der Standort beispielhaft gewählt — real
und plausibel über alle vier Regierungsbezirke gestreut, aber nicht
Zeile für Zeile der Verordnungstabelle entnommen. Personalstärke und
Fahrzeuge dagegen sind verordnungsgenau und werden beim Erzeugen der
Bögen automatisch geprüft.
</p>`,
      },
      {
        frage: "Welche Organisationen deckt der Bogen ab?",
        anker: "organisationen",
        antwort: `<p>
Alle BOS und Hilfsorganisationen: Feuerwehr, THW, DRK (inklusive
Bergwacht), Johanniter, Malteser, ASB, DLRG, Rettungsdienst, Polizei
und Bundeswehr. Eigene Einstiege gibt es für das
<a href="./thw.html">THW</a>, die <a href="./feuerwehr.html">Feuerwehr</a>,
die <a href="./dlrg.html">DLRG</a>, das <a href="./drk.html">DRK</a>,
die <a href="./johanniter.html">Johanniter</a>, die
<a href="./malteser.html">Malteser</a> und den
<a href="./asb.html">ASB</a>. Weitere Bundesländer und ihre
Katastrophenschutz-Vorlagen findest du auf der
<a href="./katastrophenschutz.html">Katastrophenschutz-Übersicht</a>.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-bayern.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Bayern",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für Bayern amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus öffentlich zugänglichen, bayernweit
standardisierten Konzepten abgeleitet, aber kein amtliches Dokument und
keine Landesverordnung. Maßgeblich bleiben die Vorgaben der jeweils
zuständigen Landkreise und kreisfreien Städte; deshalb kannst du jede
Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum sind es für Bayern nur 12 Bögen, viel weniger als in anderen Ländern?",
        anker: "anzahl-boegen",
        antwort: `<p>
Weil es in Bayern — anders als in den anderen acht Ländern dieser
Übersicht — keine landesweite Verordnung mit Teileinheiten-Gliederung
gibt. Die 12 Bögen bilden die real dokumentierten Komponenten der
Feuerwehr-Hilfeleistungskontingente und der BRK-Schnell-Einsatz-Gruppen
ab, mehr Struktur ist auf Landesebene nicht öffentlich belegt.
</p>`,
      },
      {
        frage: "Woher kommen die Funkrufnamen der Bayern-Vorlagen?",
        anker: "funkrufnamen",
        antwort: `<p>
Ein bayerisches Funkrufnamenverzeichnis mit amtlichen
Fahrzeug-Kennzahlen war nicht auffindbar. Wie bei Thüringen wird deshalb
die bundesweite OPTA-Systematik der BDBOS analog angewendet; die
Kennzahlen sind plausibel, aber nicht amtlich belegt.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-berlin.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Berlin",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für Berlin amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus der öffentlich zugänglichen KatSD-VO abgeleitet und
sorgfältig geprüft, aber kein amtliches Dokument. Maßgeblich bleibt die
Landesregelung; deshalb kannst du jede Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum unterscheiden sich die Berliner Bögen von anderen Ländern?",
        anker: "besonderheit",
        antwort: `<p>
Berlin ist kreisfrei und kennt keine Landkreis-Stückzahlen. Die
KatSD-VO-Anlage nennt stattdessen eine landesweite Gesamtzahl je
Fahrzeugtyp — gebündelt in Behandlungsplätzen 25, Patiententransport­zügen
10 und Betreuungsplätzen 500. Jeder Bogen bildet trotzdem nur eine
einzelne Teileinheit mit ihrer einfachen Besetzung ab, wie in den
übrigen Bundesländern auch.
</p>`,
      },
      {
        frage: "Warum tragen die Fahrzeuge keine Berliner OPTA-Kennzahl?",
        anker: "funkrufnamen",
        antwort: `<p>
Berlin führt tatsächlich keine numerischen Funkkennziffern, sondern die
Klartextbezeichnung des Fahrzeugs plus eine Wachennummer. Das
Datenmodell des Bogens verlangt für den Funkrufnamen ein Kennwort und
numerische Teilkennzahlen; angenähert wird das mit Kennwort der
Trägerorganisation, Bezirk und Wachennummer — der Fahrzeugtyp steht
ohnehin im Klartext auf dem Bogen.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-brandenburg.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Brandenburg",
    fragen: [
      {
        frage: "Sind die Fahrzeugtypen der Brandenburg-Vorlagen verbindlich?",
        anker: "fahrzeugtypen",
        antwort: `<p>
Nein. Verbindlich ist nach § 8 KatSV die Technikausstattung der
Ausführungsvorschriften, nicht Teil der Verordnung selbst. Die in den
Vorlagen hinterlegten Fahrzeugtypen sind beispielhaft und frei
anpassbar.
</p>`,
        offen: true,
      },
      {
        frage: "Warum gibt es für Brandenburg nur 8 Bögen statt Dutzender wie in anderen Ländern?",
        anker: "anzahl-boegen",
        antwort: `<p>
Weil die Brandenburger KatSV selbst keine Teileinheiten vorschreibt —
nur eine Mindeststärke und eine Mindestzahl an Einsatz-Kfz je Einheit.
Eine feinere Gliederung wäre frei erfunden; die Bögen bilden deshalb
genau ab, was die Verordnung tatsächlich regelt.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-hessen.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Hessen",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für Hessen amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus dem öffentlich zugänglichen Konzept „Katastrophenschutz
in Hessen" abgeleitet und sorgfältig geprüft, aber kein amtliches
Dokument. Maßgeblich bleibt das Konzept selbst; deshalb kannst du jede
Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum fehlt die Medizinische Task Force in den Hessen-Vorlagen?",
        anker: "mtf-fehlt",
        antwort: `<p>
Weil sie als bundeseinheitlich ausgestatteter Großverband (111 Personen
laut Anlage 2.1) und der KatS-Stab als reine Personaleinheit ohne
Fahrzeug nicht zum Bogenformat „Einheit mit Fahrzeugen" passen.
</p>`,
      },
      {
        frage: "Warum weichen manche Bildtabellen der Hessen-Vorlagen von der Sollstärke ab?",
        anker: "sollstaerke",
        antwort: `<p>
Bei mehreren Aufgabenbereichen (Löschzug, Sanitätszug, Betreuungszug
u. a.) summieren sich die abgebildeten Rollen der Anlage 2 nicht exakt
zur geprüften Sollstärke der Übersichtstabelle — ein Befund der
Quelle selbst. Bindend ist hier durchgehend die Übersichtstabelle
Anlage 2.1, die auch gegen die landesweite Personen-Gesamtkraft
geprüft ist.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-mecklenburg-vorpommern.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Mecklenburg-Vorpommern",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für Mecklenburg-Vorpommern amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus dem öffentlich zugänglichen Erlass abgeleitet und
sorgfältig geprüft, aber kein amtliches Dokument. Maßgeblich bleibt die
Landesregelung; deshalb kannst du jede Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum fehlt die Medical Task Force?",
        anker: "mtf-fehlt",
        antwort: `<p>
Weil der Erlass für ihre Teileinheiten keine Personalstärken nennt —
nur die Verbandsgröße. Das bundeseinheitliche Ausstattungskonzept der
MTF liegt beim Bund; eine erfundene Stärke wäre keine belastbare
Beispielangabe gewesen.
</p>`,
      },
      {
        frage: "Sind die Funkrufnamen der Mecklenburg-Vorpommern-Vorlagen amtlich?",
        anker: "funkrufnamen",
        antwort: `<p>
Die Kennwörter je Trägerorganisation (Florian, Rotkreuz, Akkon,
Johannes, Sama, Pelikan) sind bundesweit einheitlich. Für M-V konnte
trotz Suche kein öffentlicher landeseigener Kennzahlenkatalog
verifiziert werden — die Fahrzeug-Ordnungsnummern in den Beispielen sind
deshalb ausdrücklich fiktiv und frei anpassbar.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-niedersachsen.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Niedersachsen",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für Niedersachsen amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus den öffentlich zugänglichen KatS-StAN NDS
abgeleitet und sorgfältig geprüft, aber kein amtliches Dokument.
Maßgeblich bleibt die jeweilige Landesregelung; deshalb kannst du jede
Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Passt die Niedersachsen-Vorlage auch, wenn meine Einheit anders besetzt ist?",
        anker: "abweichende-besetzung",
        antwort: `<p>
Ja. Die KatS-StAN-Vorbelegung ist ein Startpunkt, kein Zwang: Du kannst
jedes Feld ändern, Fahrzeuge streichen oder ergänzen, und den
angepassten Bogen als eigene Vorlage speichern.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-nordrhein-westfalen.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Nordrhein-Westfalen",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für NRW amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus dem öffentlich zugänglichen Konzept VüH-SanBt NRW
abgeleitet und sorgfältig geprüft, aber kein amtliches Dokument.
Maßgeblich bleibt die jeweilige Landesregelung; deshalb kannst du jede
Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum unterscheiden sich die NRW-Bögen von anderen Ländern?",
        anker: "besonderheit",
        antwort: `<p>
NRW kennt keine Katastrophenschutz-Verordnung mit Anlage wie Thüringen
oder Sachsen. Stattdessen gelten seit 2013 eigene Konzepte des
Innenministeriums, die ebenso verbindlich sind und ebenso Personal- und
Fahrzeugzahlen je Teileinheit festlegen. Abgebildet sind zwei davon:
Einsatzeinheit NRW und Behandlungsplatz 50 NRW. Weitere Konzepte des
Landes — Betreuungsplatz 500, Patiententransport-Zug 10, ABC-Schutz,
Wasserrettungszug — fehlen bislang.
</p>`,
      },
      {
        frage: "Warum tragen die Fahrzeuge keine amtliche NRW-Kennzahl?",
        anker: "funkrufnamen",
        antwort: `<p>
Für NRW ist kein landeseigener, öffentlich zugänglicher
Fahrzeugkennzahlen-Katalog auffindbar. Angenähert wird das im Bogen
mit der bundesweiten OPTA-Systematik: Kennwort der Trägerorganisation,
Kreis bzw. kreisfreie Stadt, Wachennummer und eine plausible
Fahrzeugkennzahl — keine amtliche NRW-Vorgabe.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-rheinland-pfalz.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Rheinland-Pfalz",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für Rheinland-Pfalz amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus der öffentlich zugänglichen KatS-LVO und der
verbindlichen Handlungsanweisung des LfBK abgeleitet und sorgfältig
geprüft, aber kein amtliches Dokument. Maßgeblich bleibt die
Landesregelung; deshalb kannst du jede Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum stehen bei manchen rheinland-pfälzischen Fähigkeitsmodulen Stellen ohne besondere Qualifikation?",
        anker: "qualifikationen",
        antwort: `<p>
Die Handlungsanweisung nennt in der Spalte „Besondere Qualifikation" nur
die Rollen, die eine Sonderausbildung brauchen (z. B. „8 AGT"). Reicht
deren Zahl nicht bis zur amtlichen Mannschaftsstärke, füllen generisch
benannte Stellen ohne Sonderqualifikation auf — ein Hinweis dazu steht
im Feld „Sonstiges" jedes betroffenen Bogens.
</p>`,
      },
      {
        frage: "Warum fehlt das Fähigkeitsmodul „Logistik — Instandsetzung stationär\" (LOG-01)?",
        anker: "log-01-fehlt",
        antwort: `<p>
Für dieses Fähigkeitsmodul weist die Handlungsanweisung ausdrücklich
keine Personal- oder Fahrzeug-Umsetzung aus: Es wird zentral durch das
LfBK am Standort Koblenz abgebildet und ist keine von Landkreisen oder
kreisfreien Städten vorzuhaltende Einheit.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-saarland.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Saarland",
    fragen: [
      {
        frage: "Sind die Vorlagen für den Katastrophenschutz Saarland amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — die Stärke- und Fahrzeugangaben stammen aus öffentlich
zugänglichen, vom Landesausschuss der Bereitschaften des DRK Saarland
beschlossenen Konzeptionen, sind aber kein amtliches Dokument und keine
Landesverordnung. Nur die Funkrufnamen-Systematik selbst ist amtlich
(Verwaltungsvorschrift des Ministeriums für Inneres und Sport).
Maßgeblich bleiben die Vorgaben der zuständigen Katastrophenschutz-
behörden; deshalb kannst du jede Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum sind es nur 13 Bögen, viel weniger als in anderen Ländern?",
        anker: "anzahl-boegen",
        antwort: `<p>
Weil das Saarland — anders als z. B. Berlin, Thüringen oder
Baden-Württemberg — keine landesweite Verordnung mit
Teileinheiten-Gliederung kennt. Die 13 Bögen bilden die real
dokumentierten Konzeptionen des DRK Landesverbandes Saarland für
Sanitäts- und Betreuungsdienst ab, mehr Struktur ist auf Landesebene
nicht öffentlich belegt.
</p>`,
      },
      {
        frage: "Warum sind bei manchen Bögen keine Fahrzeuge quellenbelegt?",
        anker: "fahrzeuge-quellen",
        antwort: `<p>
Die DRK-Konzeptionen für Sanitätsstaffel, BHP 10, Betreuungsstaffel/
-gruppe, BTP 200/500 und die DRK-Einsatzeinheit nennen zwar die
Personalstärke, aber keine Fahrzeuge. Nur bei BHP 25 und den vier
Patiententransportkomponenten sind Fahrzeugtyp und -zahl wörtlich
belegt. Bei den übrigen Bögen sind die Fahrzeugtypen plausibel nach
den generischen Ausstattungslisten der KatOrgVO gewählt — im Feld
„Sonstiges" jedes Bogens klar gekennzeichnet.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-sachsen.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Sachsen",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für Sachsen amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus der öffentlich zugänglichen SächsKatSVO abgeleitet
und sorgfältig geprüft, aber kein amtliches Dokument. Maßgeblich bleibt
die Landesregelung; deshalb kannst du jede Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum weicht die Stärke bei der Medizinischen Task Force ab?",
        anker: "mtf-staerke",
        antwort: `<p>
Die SächsKatSVO selbst nennt in der Kopfzeile der Anlage 3 eine andere
Verteilung zwischen Gruppenführern und Mannschaft als die
Tabellenzeilen darunter — Gesamtstärke und Führungsebene stimmen
überein. Die Bögen folgen den Tabellenzeilen, weil nur sie Personal und
Fahrzeug einander zuordnen.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz-thueringen.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz Thüringen",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen für Thüringen amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus der öffentlich zugänglichen ThürKatSVO und der
Schaubilder-Broschüre des TMIK abgeleitet und sorgfältig geprüft, aber
kein amtliches Dokument. Maßgeblich bleibt die Landesregelung; deshalb
kannst du jede Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Warum führt die Thüringer Führungsstaffel keine Fahrzeuge?",
        anker: "fuehrungsstaffel",
        antwort: `<p>
Das Schaubild der KatS-Führungsstaffel (Anlage 1) weist als einziges
keine Fahrzeuge aus — die beiden zugehörigen Bögen bilden das korrekt
ab, das ist kein Fehler.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "katastrophenschutz.html": {
    ueberschrift: "Häufige Fragen zum Katastrophenschutz",
    fragen: [
      {
        frage: "Sind die Katastrophenschutz-Vorlagen amtlich?",
        anker: "amtlich",
        antwort: `<p>
Nein — sie sind aus den öffentlich zugänglichen Verordnungen und
Erlassen der Länder abgeleitet und sorgfältig geprüft, aber kein
amtliches Dokument. Maßgeblich bleibt die jeweilige Landesregelung;
deshalb kannst du jede Vorbelegung frei anpassen.
</p>`,
        offen: true,
      },
      {
        frage: "Mein Bundesland fehlt — kann ich die App trotzdem nutzen?",
        anker: "land-fehlt",
        antwort: `<p>
Ja. Du kannst jeden Bogen frei ausfüllen und als eigene Vorlage
speichern; die Landesvorlagen sind Komfort, keine Voraussetzung. Und wenn
du die Aufstellung deines Landes beisteuern möchtest: Der Generator dafür
ist Open Source.
</p>`,
      },
      {
        frage: "Welche Organisationen deckt der Bogen ab?",
        anker: "organisationen",
        antwort: `<p>
Alle BOS und Hilfsorganisationen: Feuerwehr, THW, DRK, Johanniter,
Malteser, ASB, DLRG, Rettungsdienst, Polizei und Bundeswehr. Eigene
Einstiege gibt es für das <a href="./thw.html">THW</a>, die
<a href="./feuerwehr.html">Feuerwehr</a>, die
<a href="./dlrg.html">DLRG</a>, das <a href="./drk.html">DRK</a>, die
<a href="./johanniter.html">Johanniter</a>, die
<a href="./malteser.html">Malteser</a> und den
<a href="./asb.html">ASB</a>.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "malteser.html": {
    ueberschrift: "Häufige Fragen zum MHD",
    fragen: [
      {
        frage: "Wo bleiben die eingetragenen Daten?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Passt das PDF zum gewohnten Papierbogen?",
        anker: "papierformular",
        antwort: `<p>
Ja. Das PDF folgt dem bekannten Papier-Layout des
Einheiten-Erfassungsbogens, du kannst es unverändert in den Papierlauf
geben — welche Felder es enthält, zeigt die
<a href="./vorlage.html">Übersicht über Vorlage und Aufbau</a>. Der
QR-Code auf der letzten Seite macht dasselbe Blatt maschinenlesbar.
</p>`,
      },
      {
        frage: "Kann ich einen Bogen für wiederkehrende Dienste wiederverwenden?",
        anker: "vorlagen",
        antwort: `<p>
Ja — genau dafür gibt es „Meine Vorlagen": Den Bogen der Einsatzeinheit
oder des Sanitätsdienstes pflegst du einmal und passt ihn vor jedem
Dienst nur an. Deinen laufenden Entwurf sichert die App dabei automatisch
auf dem Gerät.
</p>`,
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "meldekopf.html": {
    ueberschrift: "Häufige Fragen zum Meldekopf",
    fragen: [
      {
        frage: "Wo bleiben die Personendaten der gemeldeten Einheiten?",
        anker: "personendaten",
        antwort: PERSONENDATEN_FREMD,
        offen: true,
      },
      {
        frage: "Taugt die App für die Kräfteerfassung im Bereitstellungsraum?",
        anker: "bereitstellungsraum",
        antwort: `<p>
Dafür ist es gebaut. Der Bereitstellungsraum ist die Stelle, an der
Einheiten warten, bis sie eingeteilt werden — und genau dort brauchst du
eine belastbare Übersicht über Kräfte und Mittel: welche Einheiten da
sind, mit welcher Stärke, mit welchen Einsatzmitteln und wie lange sie
noch ohne Ablösung durchhalten. Ob du am Meldekopf, im
Bereitstellungsraum oder als Zugführer die Einheiten deines Abschnitts
führst, ändert am Ablauf nichts.
</p>`,
      },
      {
        frage: "Braucht der Meldekopf dafür Internet?",
        anker: "offline",
        antwort: `<p>
Nein. Die Übernahme per QR-Code funktioniert vollständig offline, und
die App selbst arbeitet nach dem ersten Aufruf ohne Netz weiter. Es gibt
keinen Server, auf dem dein Einsatz liegt — alles bleibt auf dem Tablet.
</p>`,
      },
      {
        frage: "Was passiert, wenn ich dieselbe Einheit zweimal scanne?",
        anker: "doppelscan",
        antwort: `<p>
Die App erkennt die Einheit wieder und behandelt deinen Scan als neue
Meldung derselben Einheit: Die Historie wächst, die Summen stimmen —
es entstehen keine Doppelzählungen.
</p>`,
      },
      {
        frage: "Kann ich mehrere Einsätze gleichzeitig führen?",
        anker: "mehrere-einsaetze",
        antwort: `<p>
Ja. Einsätze und Übungen führst du getrennt; jede Sammlung hat ihre
eigenen Einheiten, Summen und Historien und lässt sich einzeln als PDF
oder Datei weitergeben.
</p>`,
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "papier-oder-digital.html": {
    ueberschrift: "Häufige Fragen zum Vergleich",
    fragen: [
      {
        frage: "Ersetzt der digitale Erfassungsbogen das Papier?",
        anker: "papier-ersetzt",
        antwort: `<p>
Nein — er erzeugt es. Die App druckt das gewohnte Papierformular als PDF;
der QR-Code auf der letzten Seite macht dasselbe Blatt zusätzlich
maschinenlesbar. Fällt die Technik aus, funktioniert das Blatt wie eh und je.
</p>`,
        offen: true,
      },
      {
        frage: "Ist eine Excel-Tabelle nicht genauso gut?",
        anker: "excel",
        antwort: `<p>
Im Einsatz selten: Die Datei lebt auf einem Rechner, die Übergabe braucht
USB-Stick oder Netz, das Layout entspricht keinem Vordruck und taktische
Zeichen fehlen. Der digitale Erfassungsbogen bietet festes Formular-Layout
und QR-Übergabe von Gerät zu Gerät — und exportiert bei Bedarf CSV.
</p>`,
      },
      {
        frage: "Was kostet die digitale Fassung?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "staerkemeldung-feuerwehr.html": {
    ueberschrift: "Häufige Fragen zur Stärkemeldung",
    fragen: [
      {
        frage: "Was bedeuten die Zahlen 1/8/9 bei einer Stärkemeldung?",
        anker: "zahlen-1-8-9",
        antwort: `<p>
Die erste Zahl nennt die Führungskräfte, die zweite die übrigen
Einsatzkräfte, die dritte die Gesamtstärke. 1/8/9 ist damit eine
Einheit mit einem Führer und acht weiteren Kräften — die übliche Stärke
einer Gruppe. In der vierteiligen Schreibweise werden die Unterführer
eigens ausgewiesen; die Gesamtzahl bleibt dieselbe.
</p>`,
        offen: true,
      },
      {
        frage: "Zählt der Fahrzeugführer als Führer oder als Unterführer?",
        anker: "fahrzeugfuehrer",
        antwort: `<p>
Das hängt davon ab, was gemeldet wird. Meldet sich eine Gruppe allein,
ist ihre Gruppenführerin die Führerin der gemeldeten Einheit. Rückt
dieselbe Gruppe als Teil eines Zuges ein, führt der Zugführer die
Einheit — die Gruppenführerin zählt dann als Unterführerin. Maßgeblich
ist die Stellung in der gemeldeten Einheit, nicht die Ausbildung.
</p>`,
      },
      {
        frage: "Muss ich für die Stärkemeldung alle Namen erfassen?",
        anker: "namen",
        antwort: `<p>
Für die Meldung selbst nicht — dafür genügen die Zahlen und eine
erreichbare Führungskraft. Namen, Funktionen und Qualifikationen sind
für die eigene Einheit und für längere Einsätze nützlich, in dieser App
aber optional.
</p>`,
      },
      {
        frage: "Gilt die Stärkemeldung der Feuerwehr bundesweit gleich?",
        anker: "bundesweit",
        antwort: `<p>
Das Feuerwehrrecht ist Landesrecht: Sollstärken, Bezeichnungen der
Einheiten und die vorgeschriebene Form der Meldung können sich von Land
zu Land unterscheiden. Der Aufbau — Führung, Unterführung, Mannschaft,
Gesamtstärke — ist dagegen überall derselbe, und genau diese Struktur
bildet der Erfassungsbogen ab.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
    ],
  },
  "thw-fachgruppe-notversorgung-erfassungsbogen.html": {
    ueberschrift: "Häufige Fragen zur FGr N",
    fragen: [
      {
        frage: "Welche Stärke hat die Fachgruppe Notversorgung und Notinstandsetzung?",
        anker: "staerke",
        antwort: `<p>
Neun Einsatzkräfte: eine Gruppenführung, eine Truppführung und sieben
Fachhelferinnen und Fachhelfer, in der Stärkenotation
<strong>-/2/7/9</strong>. Die Reserve zählt nicht dazu — sie rückt nicht
mit aus, und dem Meldekopf Kräfte zu melden, die nicht am
Bereitstellungsraum stehen, wäre falsch. Die App legt deshalb neun
Personalplätze an; wer die Reserve im eigenen Bogen führen will, ergänzt
sie von Hand.
</p>`,
        offen: true,
      },
      {
        frage: "Welche Kennzahl trägt die FGr N im Funkrufnamen?",
        anker: "kennzahl",
        antwort: `<p>
Im ersten Technischen Zug die 24, im zweiten die 28. Die Vorbelegung
setzt die 24, weil die App beim Wählen des Einheitstyps den Zug nicht
kennt. Steht deine Fachgruppe im zweiten Zug, änderst du im Funkrufnamen
die erste Zahl von 24 auf 28 — ein Feld, ein Handgriff.
</p>`,
      },
      {
        frage: "Hat die Fachgruppe N die Typen A, B und C?",
        anker: "typen",
        antwort: `<p>
Nein. Anders als die Fachgruppen
<a href="./thw-fachgruppe-raeumen-erfassungsbogen.html">Räumen</a> oder
<a href="./thw-fachgruppe-wasserschaden-pumpen-erfassungsbogen.html">Wasserschaden/Pumpen</a>
gibt es die FGr N nur in einer Ausführung — ein Einheitstyp, die
StAN-Nummer 02-09, ein taktisches Zeichen.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
      {
        frage: "Kann ich den ausgefüllten Bogen wiederverwenden?",
        anker: "wiederverwenden",
        antwort: `<p>
Ja. Ein einmal ausgefüllter Bogen lässt sich als eigene Vorlage
speichern; beim nächsten Einsatz musterst du nur noch, wer nicht dabei
ist. Wie der Bogen aufgebaut ist, zeigt die Seite
<a href="./vorlage.html">Vorlage und Aufbau</a>.
</p>`,
      },
    ],
  },
  "thw-fachgruppe-raeumen-erfassungsbogen.html": {
    ueberschrift: "Häufige Fragen zur FGr R",
    fragen: [
      {
        frage: "Welche Stärke hat die Fachgruppe Räumen im Erfassungsbogen?",
        anker: "staerke",
        antwort: `<p>
Bei allen drei Typen <strong>-/2/7/9</strong>: kein Zugführer, zwei
Unterführer (Gruppen- und Truppführung), sieben Fachhelferinnen und
Fachhelfer. Die App legt neun Personalkarten an und belegt nur die
beiden Führungsfunktionen vor — welche Qualifikation auf welchem
Fachhelferplatz sitzt, entscheidet der Ortsverband. Grundlage sind die
StAN-Einzeldokumente mit Stand 01.07.2026.
</p>`,
        offen: true,
      },
      {
        frage: "Worin unterscheiden sich FGr R Typ A, B und C?",
        anker: "typen",
        antwort: `<p>
Im Bergungsräumgerät: Typ A hat einen Bagger, Typ B einen Radlader,
Typ C einen Teleskoplader. Stärke und übrige Einsatzmittel sind gleich.
Die Kennzahl der Teileinheit im Funkrufnamen läuft dabei nicht
alphabetisch — B ist 41, A ist 42, C ist 43. Die App nimmt sie aus dem
gewählten Einheitstyp und macht den Fehler deshalb gar nicht erst.
</p>`,
      },
      {
        frage: "Mein Ortsverband hat ein anderes Bergungsräumgerät als in der StAN. Was trage ich ein?",
        anker: "abweichendes-geraet",
        antwort: `<p>
Das tatsächlich vorhandene Gerät. Die StAN-Vorbelegung ist ein
Startpunkt: Du kannst jedes Fahrzeug streichen, ersetzen oder ergänzen.
Der Einheitstyp — und damit die Kennzahl im Funkrufnamen — bleibt davon
unberührt und richtet sich weiter nach der Aufstellung des Ortsverbands.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
      {
        frage: "Gibt es auch Bögen für andere Fachgruppen?",
        anker: "andere-fachgruppen",
        antwort: `<p>
Ja — im Vokabular stehen alle THW-Einheitstypen vom Zugtrupp bis zu den
Fachgruppen der Fachzüge. Eigene Seiten gibt es bisher für die
<a href="./thw-fachgruppe-notversorgung-erfassungsbogen.html">Fachgruppe
Notversorgung/Notinstandsetzung</a> und die
<a href="./thw-fachgruppe-wasserschaden-pumpen-erfassungsbogen.html">Fachgruppe
Wasserschaden/Pumpen</a>.
</p>`,
      },
    ],
  },
  "thw-fachgruppe-wasserschaden-pumpen-erfassungsbogen.html": {
    ueberschrift: "Häufige Fragen zur FGr WP",
    fragen: [
      {
        frage: "Welche Stärke hat die FGr WP im Erfassungsbogen?",
        anker: "staerke",
        antwort: `<p>
Zwölf Einsatzkräfte bei allen drei Typen: eine Gruppenführung, zwei
Truppführungen und neun Fachhelferinnen und Fachhelfer, in der
Stärkenotation <strong>-/3/9/12</strong>. Die zweite Truppführung ist
der sichtbarste Unterschied zu den kleineren Fachgruppen. Die Reserve
gleicher Stärke rückt nicht mit aus und steht deshalb nicht in der
Vorbelegung.
</p>`,
        offen: true,
      },
      {
        frage: "Welchen Typ trage ich ein, wenn ich die Förderleistung nicht sicher weiß?",
        anker: "typwahl",
        antwort: `<p>
Der Anhänger gibt sie vor: Anh SwPu klein steht für 5.000 l/min (Typ A),
mittel für 15.000 l/min (Typ B), groß für 25.000 l/min (Typ C). Steht auf
dem Gerät eine andere Leistung, ist das kein Grund, den Typ zu wechseln —
im Bogen lässt sich das Einsatzmittel frei benennen.
</p>`,
      },
      {
        frage: "Welche Einsatzmittel legt die App für die FGr WP an?",
        anker: "einsatzmittel",
        antwort: `<p>
Vier: einen Lastkraftwagen mit Ladebordwand, einen Mannschaftslastwagen IV,
den Anhänger Schmutzwasserpumpe passend zum Typ und einen Anhänger
Plane/Spriegel. Die beiden Fahrzeuge bekommen automatisch einen
Funkrufnamen, die Anhänger nicht. Das MLW IV führen ältere Übersichten
teils nicht auf — fehlt es bei deiner Einheit, streichst du es.
</p>`,
      },
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
      },
      {
        frage: "Was kostet die App?",
        anker: "kosten",
        antwort: kosten("Nichts."),
      },
      {
        frage: "Wo finde ich die Vorlage des Bogens?",
        anker: "vorlage",
        antwort: `<p>
Aufbau und Felder des Einheiten-Erfassungsbogens beschreibt die Seite
<a href="./vorlage.html">Vorlage und Aufbau</a>. Eine weitere Fachgruppe
desselben Ortsverbands füllst du genauso aus — etwa die
<a href="./thw-fachgruppe-notversorgung-erfassungsbogen.html">Fachgruppe
Notversorgung/Notinstandsetzung</a>, die in vielen Technischen Zügen
neben der FGr WP steht.
</p>`,
      },
    ],
  },
  "thw.html": {
    ueberschrift: "Häufige Fragen zum THW",
    fragen: [
      {
        frage: "Wo bleiben die Personendaten der Einsatzkräfte?",
        anker: "personendaten",
        antwort: personendaten(),
        offen: true,
      },
      {
        frage: "Was sage ich unserem Datenschutzbeauftragten?",
        anker: "datenschutzbeauftragter",
        antwort: DATENSCHUTZBEAUFTRAGTER,
      },
      {
        frage: "Was ist, wenn meine Einheit von der StAN abweicht?",
        anker: "stan-abweichung",
        antwort: `<p>
Die Vorbelegung ist ein Startpunkt, kein Zwang: Du kannst jedes Feld
ändern, Fahrzeuge streichen oder ergänzen — und den angepassten Bogen als
eigene Vorlage speichern.
</p>`,
      },
      {
        frage: "Funktioniert das auch im Funkloch?",
        anker: "funkloch",
        antwort: `<p>
Ja. Nach dem ersten Aufruf arbeitet die Web-App offline weiter; die
Übergabe per QR-Code braucht ohnehin keine Verbindung. Für Windows,
macOS, Linux und Android gibt es zusätzlich installierbare Apps.
</p>`,
      },
      {
        frage: "Was kostet die App und braucht sie ein Konto?",
        anker: "kosten",
        antwort: kosten("Nichts, und nein."),
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Sichtbarer Block
// ---------------------------------------------------------------------------

/** Einzug der Blockelemente im `<main>` aller Content-Seiten. */
const EINZUG = "    ";

const BLOCK_MUSTER = /[ \t]*<!-- FAQ:START -->[\s\S]*?<!-- FAQ:END -->/;

/**
 * Der handgeschriebene Vorgänger: die Überschrift und die unmittelbar darauf
 * folgende Kette von Aufklappblöcken. Die Kette endet von selbst am ersten
 * Kommentar-Marker, also vor allem, was ein anderer Generator dahinter setzt.
 */
function altMuster(ueberschrift: string): RegExp {
  const roh = ueberschrift.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `[ \\t]*<h2[^>]*>\\s*${roh}\\s*</h2>(?:\\s*<details class="frage"[^>]*>[\\s\\S]*?</details>)*`,
  );
}

/**
 * Die Kennung der FAQ-Überschrift — auf **jeder** Seite dieselbe.
 *
 * `anleitung.html` trug sie als einzige, weil ihr Sprungmenü sie brauchte. Für
 * die 27 anderen war der FAQ-Bereich damit unerreichbar: Diese Seiten sind
 * Sucheinstiege, und wer über eine Frage kommt, soll sie nicht durch mehrere
 * hundert Zeilen suchen müssen. Ein Wert für alle, damit ein Verweis auf den
 * Bereich seitenunabhängig geschrieben werden kann.
 */
const H2_KENNUNG = "haeufige-fragen";

/**
 * Was an der `<h2>` sonst noch steht, bleibt stehen — die Kennung setzt aber
 * dieses Skript, nicht der Bestand.
 *
 * Vorher stammte sie aus `content-offenlegung.mts`, das sie auf
 * `anleitung.html` aus dem Überschriftentext ableitete. Seit der Wortlaut hier
 * gepflegt wird, ginge das nicht mehr auf: Aus „Häufige Fragen zur App" würde
 * dort `haeufige-fragen-zur-app`, aus dem nächsten Wortlaut wieder etwas
 * anderes — und ein geteilter Link zeigte ins Leere. `content-offenlegung.mts`
 * übernimmt eine vorhandene Kennung deshalb unverändert und leitet nur noch
 * dort eine ab, wo keine steht.
 */
function h2Attribute(bereich: string): string {
  const vorhanden = bereich.match(/<h2([^>]*)>/)?.[1] ?? "";
  return ` id="${H2_KENNUNG}"${vorhanden.replace(/\s*\bid="[^"]*"/, "")}`;
}

function blockHtml(seite: FaqSeite, attribute: string): string {
  const markiert = seite.fragen.findIndex((f) => f.offen);
  const offenBei = markiert === -1 ? 0 : markiert;
  const bloecke = seite.fragen.map((f, i) => {
    const antwort = f.antwort
      .split("\n")
      .map((zeile) => `${EINZUG}  ${zeile}`)
      .join("\n");
    return (
      `${EINZUG}<details class="frage" id="frage-${f.anker}"${i === offenBei ? " open" : ""}>\n` +
      `${EINZUG}  <summary><h3>${f.frage}</h3></summary>\n` +
      `${antwort}\n` +
      `${EINZUG}</details>`
    );
  });
  return (
    `${EINZUG}<!-- FAQ:START -->\n` +
    `${EINZUG}<h2${attribute}>${seite.ueberschrift}</h2>\n\n` +
    `${bloecke.join("\n\n")}\n` +
    `${EINZUG}<!-- FAQ:END -->`
  );
}

/**
 * Seiten ohne Vorgänger bekommen den Bereich als letzten Textblock vor dem
 * Abschlussknopf — dort, wo er auf allen anderen Seiten auch endet.
 */
const EINFUEGE_ANKER = /([ \t]*)<!-- HANDLUNG:ABSCHLUSS:START -->/;

function blockSetzen(html: string, datei: string, seite: FaqSeite): string {
  const vorhanden = html.match(BLOCK_MUSTER);
  if (vorhanden) return html.replace(BLOCK_MUSTER, blockHtml(seite, h2Attribute(vorhanden[0])));
  const alt = altMuster(seite.ueberschrift);
  const vorgaenger = html.match(alt);
  if (vorgaenger) return html.replace(alt, blockHtml(seite, h2Attribute(vorgaenger[0])));
  if (EINFUEGE_ANKER.test(html)) {
    return html.replace(EINFUEGE_ANKER, `${blockHtml(seite, "")}\n\n$1<!-- HANDLUNG:ABSCHLUSS:START -->`);
  }
  console.warn(`FAQ-Block übersprungen (weder Marker noch Anker gefunden): ${datei}`);
  return html;
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

/**
 * Jeder sichtbare Aufklapper der fertigen Seite — die eigenen wie die fremder
 * Generatoren, in Dokumentreihenfolge. Diese Liste **ist** die Quelle des
 * Schemas; ein Auseinanderlaufen ist damit nicht mehr möglich.
 */
const AUFKLAPPER_MUSTER =
  /<details class="frage"[^>]*>\s*<summary>\s*<h3[^>]*>([\s\S]*?)<\/h3>\s*<\/summary>\s*([\s\S]*?)\s*<\/details>/g;

/**
 * Klartext aus Auszeichnung: Tags fallen ersatzlos weg (Links behalten ihre
 * Beschriftung als Text, „(<a>Datenschutzerklärung</a>)" wird zu
 * „(Datenschutzerklärung)"), Entities werden aufgelöst, Zeilenumbrüche des
 * Quelltexts zu einfachen Leerzeichen.
 */
function reintext(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&shy;/g, "")
    .replace(/&(?:quot|#34);/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Die Einträge stehen im Quelltext auf zehn Leerzeichen Einzug, ihre Felder auf zwölf. */
function mainEntityHtml(html: string): string {
  const eintraege = [...html.matchAll(AUFKLAPPER_MUSTER)].map(([, frage, antwort]) => {
    const name = JSON.stringify(reintext(frage ?? ""));
    const text = JSON.stringify(reintext(antwort ?? ""));
    return (
      `          {\n` +
      `            "@type": "Question",\n` +
      `            "name": ${name},\n` +
      `            "acceptedAnswer": { "@type": "Answer", "text": ${text} }\n` +
      `          }`
    );
  });
  return eintraege.join(",\n");
}

/**
 * Nur die Liste innerhalb des vorhandenen `FAQPage` wird ersetzt. Die erste
 * Zeile, die im JSON-LD allein aus einer schließenden eckigen Klammer besteht,
 * ist das Ende von `mainEntity` — die Einträge selbst enden auf geschweifte
 * Klammern.
 */
const MAIN_ENTITY_MUSTER = /("@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*\[)[\s\S]*?(\n[ \t]*\])/;

function schemaSetzen(html: string, datei: string): string {
  if (!MAIN_ENTITY_MUSTER.test(html)) {
    console.warn(`FAQPage-Schema übersprungen (kein mainEntity gefunden): ${datei}`);
    return html;
  }
  const eintraege = mainEntityHtml(html);
  return html.replace(MAIN_ENTITY_MUSTER, (_ganz, kopf: string, schluss: string) => `${kopf}\n${eintraege}${schluss}`);
}

// ---------------------------------------------------------------------------

/**
 * Zwei Fragen mit demselben Anker ergäben zwei gleiche `id` auf einer Seite —
 * der Browser springt dann zur ersten, und der Link auf die zweite ist still
 * kaputt. Das fällt niemandem auf, deshalb bricht der Lauf hier ab, statt eine
 * Warnung zu drucken.
 */
function ankerPruefen(datei: string, seite: FaqSeite): void {
  const gesehen = new Set<string>();
  for (const f of seite.fragen) {
    if (!/^[a-z0-9-]+$/.test(f.anker)) {
      throw new Error(`${datei}: Anker „${f.anker}" darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.`);
    }
    if (gesehen.has(f.anker)) throw new Error(`${datei}: Anker „${f.anker}" ist zweimal vergeben.`);
    gesehen.add(f.anker);
  }
}

function main(): void {
  const dateien = Object.keys(SEITEN);
  let geaendert = 0;
  let fragen = 0;

  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    const seite = SEITEN[datei]!;
    ankerPruefen(datei, seite);

    let neu = blockSetzen(vorher, datei, seite);
    neu = schemaSetzen(neu, datei);
    fragen += (neu.match(/<details class="frage"/g) ?? []).length;

    if (neu !== vorher) {
      writeFileSync(pfad, neu, "utf8");
      geaendert++;
    }
  }

  console.log(`FAQ-Blöcke aktualisiert: ${geaendert}/${dateien.length} Seiten, ${fragen} Fragen sichtbar und ausgezeichnet.`);
}

main();
