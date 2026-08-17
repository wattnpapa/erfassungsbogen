/**
 * Setzt auf den werbenden Content-Seiten (Organisations- und
 * Anwendungsfall-Seiten unter public/) zwei zusätzliche Handlungsangebote und
 * den Abschnitt zur Datenhoheit.
 *
 * Warum: Bisher trug jede dieser Seiten genau **einen** Knopf `.start`, und der
 * stand im ersten Drittel — auf dem Handy je nach Titellänge unterhalb der
 * Falz. Danach folgten bis zu 5.900 px Text ohne jedes Angebot, und das letzte,
 * was ein Besucher las, war der Markenhinweis, also eine juristische
 * Distanzierung. Wer beim Lesen überzeugt wird, muss an Ort und Stelle handeln
 * können, statt zurückscrollen zu müssen.
 *
 * Was das Skript einfügt (jeweils als markierter, ersetzbarer Block):
 *
 * 1. `<!-- HANDLUNG:MITTE:START -->` … `:END` — direkt vor dem FAQ-Block:
 *    ein h2 zur Datenhoheit plus der zweite Knopf. Die Reihenfolge ist
 *    Absicht: Die Frage „wo bleiben Personennamen und Erreichbarkeiten meiner
 *    Helfer?" ist der letzte Zweifel vor der Entscheidung; sie wird
 *    abgeräumt, unmittelbar bevor gefragt wird.
 * 2. `<!-- HANDLUNG:ABSCHLUSS:START -->` … `:END` — als letztes Element des
 *    `<main>`, also **vor** `<footer>` und damit vor Fußnavigation und
 *    Markenhinweis: der dritte Knopf mit einer Rückversicherungszeile. Die
 *    Seite endet dadurch auf einem Angebot statt auf einem Haftungsausschluss.
 *    Der Markenhinweis bleibt unangetastet, wo er ist.
 * 3. `/* HANDLUNG:CSS:START *\/` … `:END` am Ende des `<style>`: die Maße für
 *    Knopfhöhe und Abschlussblock.
 *
 * Aufruf (Node ≥ 22): npm run content-handlung
 *
 * Idempotent: Vorhandene Blöcke werden ersetzt, nicht verdoppelt; ein zweiter
 * Lauf meldet 0 geänderte Seiten.
 *
 * Bewusst nicht angefasst: `uebersicht.html`, `impressum.html`,
 * `datenschutz.html`, `open-source-datenschutz.html`, `404.html` (siehe
 * `SEITEN` unten für die Begründung je Gruppe).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

interface SeitenPlan {
  /**
   * Beschriftung beider neuer Knöpfe. Abgeleitet aus dem bereits vorhandenen
   * ersten `.start` der Seite: Wo der schon kontextspezifisch war
   * („Einsatz-Sammlung in der App öffnen", „Bogen für die FGr R ausfüllen"),
   * wird er wörtlich übernommen. Wo dort das generische „Bogen jetzt
   * ausfüllen" stand, tritt der Gegenstand der Seite davor — ein Knopf, der
   * benennt, was er tut, wird häufiger gedrückt als einer, der es nicht tut.
   */
  knopf: string;
  /**
   * Datenhoheits-Abschnitt und zweiter Knopf vor dem FAQ-Block. `false` nur
   * dort, wo die Seite die Frage im eigenen Text bereits ausführlich
   * beantwortet (anleitung.html).
   */
  mitte?: boolean;
  /**
   * Überschrift, vor der der Mitte-Block einzusetzen ist. Standard ist die
   * FAQ-Überschrift; die beiden Seiten ohne FAQ benennen ihre eigene.
   */
  anker?: string;
}

/** Standard-Anker: die FAQ-Überschrift, die jede Persuade-Seite außer zweien trägt. */
const ANKER_STANDARD = "Häufige Fragen";

/**
 * Die Persuade-Seiten mit ihrer Knopfbeschriftung.
 *
 * Nicht enthalten und warum:
 * - `uebersicht.html` ist ein Verzeichnis. Ihr Zweck ist das Weiterleiten in
 *   die Themenseiten; ein Abschlussknopf stünde in Konkurrenz zur Linkliste,
 *   die genau dort die richtige Handlung ist.
 * - `impressum.html`, `datenschutz.html` sind Rechtstexte. Wer sie liest,
 *   sucht eine Auskunft, keine Aufforderung.
 * - `open-source-datenschutz.html` ist der Beleg, auf den der neue
 *   Datenhoheits-Abschnitt verweist. Ein Verkaufsknopf mitten im Nachweis
 *   beschädigt genau die Glaubwürdigkeit, wegen der die Seite existiert.
 * - `404.html` hat bereits einen Knopf und sonst nichts.
 */
const SEITEN: Record<string, SeitenPlan> = {
  "thw.html": { knopf: "THW-Bogen jetzt ausfüllen" },
  "feuerwehr.html": { knopf: "Feuerwehr-Bogen jetzt ausfüllen" },
  "drk.html": { knopf: "DRK-Bogen jetzt ausfüllen" },
  "johanniter.html": { knopf: "Johanniter-Bogen jetzt ausfüllen" },
  "malteser.html": { knopf: "Malteser-Bogen jetzt ausfüllen" },
  "asb.html": { knopf: "ASB-Bogen jetzt ausfüllen" },
  "dlrg.html": { knopf: "DLRG-Bogen jetzt ausfüllen" },
  "bbk.html": { knopf: "BBK-Bogen jetzt ausfüllen" },
  "bundeswehr.html": { knopf: "Bundeswehr-Bogen jetzt ausfüllen" },
  "meldekopf.html": { knopf: "Einsatz-Sammlung in der App öffnen" },
  "vorlage.html": { knopf: "Bogen digital ausfüllen", anker: "Weitergabe ohne Internet" },
  "papier-oder-digital.html": { knopf: "Bogen digital ausfüllen", anker: "Ausprobieren kostet nichts" },
  "staerkemeldung-feuerwehr.html": { knopf: "Stärkemeldung direkt erfassen" },
  "thw-fachgruppe-notversorgung-erfassungsbogen.html": { knopf: "Bogen für die FGr N ausfüllen" },
  "thw-fachgruppe-raeumen-erfassungsbogen.html": { knopf: "Bogen für die FGr R ausfüllen" },
  "thw-fachgruppe-wasserschaden-pumpen-erfassungsbogen.html": { knopf: "Bogen für die FGr WP ausfüllen" },
  "katastrophenschutz.html": { knopf: "Katastrophenschutz-Bogen ausfüllen" },
  // anleitung.html ist eine Erklärseite, keine Werbeseite: Wer sie zu Ende
  // liest, hat die App verstanden und braucht nur noch den Weg hinein. Deshalb
  // nur der Abschlussknopf — der Datenhoheits-Abschnitt stünde neben der
  // eigenen FAQ, die dieselbe Frage bereits ausführlich beantwortet.
  "anleitung.html": { knopf: "Bogen jetzt ausfüllen", mitte: false },
};

/** Die zwölf Länderseiten: „Bogen für <Land> starten". */
const LAENDER: Record<string, string> = {
  "baden-wuerttemberg": "Baden-Württemberg",
  bayern: "Bayern",
  berlin: "Berlin",
  brandenburg: "Brandenburg",
  hessen: "Hessen",
  "mecklenburg-vorpommern": "Mecklenburg-Vorpommern",
  niedersachsen: "Niedersachsen",
  "nordrhein-westfalen": "Nordrhein-Westfalen",
  "rheinland-pfalz": "Rheinland-Pfalz",
  saarland: "Saarland",
  sachsen: "Sachsen",
  thueringen: "Thüringen",
};
for (const [schluessel, land] of Object.entries(LAENDER)) {
  SEITEN[`katastrophenschutz-${schluessel}.html`] = { knopf: `Bogen für ${land} starten` };
}

/**
 * Der Datenhoheits-Abschnitt. Jede Aussage steht so in PRODUCT.md
 * („keine Anmeldung, keine Cloud — alle Daten bleiben auf dem Gerät") oder in
 * open-source-datenschutz.html (lokaler Speicher; Bogeninhalte verlassen das
 * Gerät nur bei Weitergabe als PDF, Datei, QR-Code oder Link). Keine Zahlen,
 * keine Zertifizierungen, keine Zusagen, die die App nicht hält — der letzte
 * Satz verweist deshalb auf die vollständige Aufstellung statt zu behaupten,
 * es gebe überhaupt keine Verbindung.
 */
const DATENHOHEIT = `    <h2>Wo Namen und Erreichbarkeiten bleiben</h2>
    <p>
      Die Personendaten deiner Einsatzkräfte stehen im lokalen Speicher deines
      Geräts: kein Server, kein Konto, keine Cloud. Ein Bogen verlässt das Gerät
      nur, wenn du ihn selbst weitergibst — als PDF, als Datei, als QR-Code oder
      als Link. Welche Einträge gespeichert werden und welche Verbindungen die
      Anwendung von sich aus aufbaut, ist unter
      <a href="./open-source-datenschutz.html">Open Source und Datenschutz</a>
      vollständig aufgeführt.
    </p>`;

/** Rückversicherung unter dem Abschlussknopf — dieselbe Aussage, in einer Zeile. */
const ZUSICHERUNG = "Kostenlos, ohne Anmeldung, alle Daten bleiben auf deinem Gerät.";

function mitteHtml(plan: SeitenPlan): string {
  return `<!-- HANDLUNG:MITTE:START -->
${DATENHOHEIT}

    <p><a class="start" href="./">${plan.knopf}</a></p>
    <!-- HANDLUNG:MITTE:END -->`;
}

function abschlussHtml(plan: SeitenPlan): string {
  return `<!-- HANDLUNG:ABSCHLUSS:START -->
    <div class="abschluss">
      <a class="start" href="./">${plan.knopf}</a>
      <p class="zusicherung">${ZUSICHERUNG}</p>
    </div>
    <!-- HANDLUNG:ABSCHLUSS:END -->`;
}

/**
 * Die Trefferfläche kommt aus dem Maß, nicht aus Polster plus Zeilenhöhe: Mit
 * `0.6rem` Polster und `line-height: 1.5` war der Knopf 43 px hoch und verfehlte
 * die 44 px (`--ziel-basis: 2.75rem`) aus DESIGN.md um einen Pixel — ein Wert,
 * den niemand nachrechnet und den jede Änderung an der Schriftgröße erneut
 * verschiebt. `min-height` plus `inline-flex` hält die Höhe unabhängig davon.
 *
 * Der Abschlussblock steht als eigener Absatz mit Abstand nach oben; die
 * Rückversicherung darunter läuft im Nebentext-Grad der Leiter (0.875rem).
 */
const CSS = `/* HANDLUNG:CSS:START */
    .start { display: inline-flex; align-items: center; min-height: 2.75rem; }
    .abschluss { margin-top: 2.5rem; }
    .abschluss .zusicherung { margin: 0.4rem 0 0; font-size: 0.875rem; color: #5c6478; }
    /* HANDLUNG:CSS:END */`;

const MITTE_MUSTER = /[ \t]*<!-- HANDLUNG:MITTE:START -->[\s\S]*?<!-- HANDLUNG:MITTE:END -->/;
const ABSCHLUSS_MUSTER = /[ \t]*<!-- HANDLUNG:ABSCHLUSS:START -->[\s\S]*?<!-- HANDLUNG:ABSCHLUSS:END -->\n*/;
const CSS_MUSTER = /\/\* HANDLUNG:CSS:START \*\/[\s\S]*?\/\* HANDLUNG:CSS:END \*\//;

function einbauen(inhalt: string, datei: string, plan: SeitenPlan): string {
  let neu = inhalt;

  if (plan.mitte !== false) {
    const anker = plan.anker ?? ANKER_STANDARD;
    const block = mitteHtml(plan);
    if (MITTE_MUSTER.test(neu)) {
      neu = neu.replace(MITTE_MUSTER, `    ${block}`);
    } else {
      const ankerRoh = anker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const ankerMuster = new RegExp(`([ \\t]*)(<h2[^>]*>\\s*${ankerRoh})`);
      if (!ankerMuster.test(neu)) {
        console.warn(`Mitte-Block übersprungen (Anker „${anker}" nicht gefunden): ${datei}`);
      } else {
        neu = neu.replace(ankerMuster, (_ganz, einzug: string, h2: string) => `${einzug}${block}\n\n${einzug}${h2}`);
      }
    }
  }

  const abschluss = abschlussHtml(plan);
  if (ABSCHLUSS_MUSTER.test(neu)) {
    neu = neu.replace(ABSCHLUSS_MUSTER, `    ${abschluss}\n\n`);
  } else {
    const fussMuster = /([ \t]*)(<footer[^>]*>)/;
    if (!fussMuster.test(neu)) {
      console.warn(`Abschlussblock übersprungen (kein <footer>): ${datei}`);
    } else {
      neu = neu.replace(fussMuster, (_ganz, einzug: string, fuss: string) => `${einzug}${abschluss}\n\n${einzug}${fuss}`);
    }
  }

  if (CSS_MUSTER.test(neu)) {
    neu = neu.replace(CSS_MUSTER, CSS);
  } else {
    neu = neu.replace("  </style>", `${CSS}\n  </style>`);
  }

  return neu;
}

function main(): void {
  let geaendert = 0;
  const dateien = Object.keys(SEITEN);
  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    const nachher = einbauen(vorher, datei, SEITEN[datei]!);
    if (nachher !== vorher) {
      writeFileSync(pfad, nachher, "utf8");
      geaendert++;
    }
  }
  console.log(`Handlungsangebote aktualisiert: ${geaendert}/${dateien.length} Seiten.`);
}

main();
