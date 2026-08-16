/**
 * Der erklärende Text der Startseite — die EINE Quelle für beide Pfade.
 *
 * Die Startseite existiert doppelt: als statisches Gerüst in `index.html`
 * (erscheint sofort mit dem HTML, trägt das Largest Contentful Paint) und als
 * React-Ansicht, die das Gerüst beim Mount ersetzt. Ein Text, der nur im
 * Gerüst stünde, wäre nach dem Mount weg — Googlebot rendert JavaScript und
 * sähe den Endzustand; Text, der nur in React stünde, fehlte im ausgelieferten
 * HTML. Er muss also in beiden Pfaden stehen und übereinstimmen.
 *
 * Statt ihn zweimal zu pflegen (und auseinanderlaufen zu lassen), steht er
 * hier einmal als Daten. Daraus entstehen:
 *   - die React-Ansicht (`StartInhalt` in app.tsx),
 *   - der statische Block in index.html, erzeugt von `startInhaltHtml()`
 *     über `node --import tsx scripts/start-inhalt.mts`.
 * `src/test/start-inhalt.test.ts` vergleicht beides und schlägt fehl, sobald
 * der Block in index.html nicht mehr zum Text hier passt.
 *
 * Inhaltliche Regel: Hier steht nur, was die App wirklich kann (siehe
 * PRODUCT.md). Keine Zahlen, Stärken oder Strukturen, die nicht belegt sind.
 */

/** Ein Stück Fließtext: entweder Text oder ein Verweis auf eine andere Seite. */
export type Teil = string | { text: string; ziel: string };

/** Ein Block innerhalb eines Abschnitts. */
export type Block =
  | { art: "absatz"; teile: Teil[] }
  | { art: "liste"; punkte: Teil[][] }
  | { art: "frage"; frage: string; antwort: Teil[] };

/** Ein Abschnitt mit eigener H2. */
export type Abschnitt = { titel: string; bloecke: Block[] };

export const START_ABSCHNITTE: Abschnitt[] = [
  {
    titel: "Für Einsatz, Übung und Bereitstellungsraum",
    bloecke: [
      {
        art: "absatz",
        teile: [
          "Der Einheiten-Erfassungsbogen hält fest, wer mit welcher Stärke, welchen Fahrzeugen und welchem Sofortbedarf im Einsatz ist. Diese Web-App bildet genau diesen Bogen digital ab: Ein Assistent führt durch Einheit, Einsatz, Personal, Fahrzeuge und Sofortbedarf, die Gesamtübersicht lässt sich danach jederzeit nachbearbeiten. Am Ende steht ein PDF im gewohnten Papier-Layout — ",
          { text: "Aufbau des Bogens und Blanko-Vorlage", ziel: "./vorlage.html" },
          ".",
        ],
      },
      {
        art: "absatz",
        teile: [
          "Bögen, die zu einer Übung gehören, werden als Übung gekennzeichnet; die Kennzeichnung bleibt bis ins PDF und in den QR-Code erhalten. So wird eine Übungsmeldung am Meldekopf nicht versehentlich zur Lage gezählt.",
        ],
      },
    ],
  },
  {
    titel: "So funktioniert die digitale Stärkemeldung",
    bloecke: [
      {
        art: "liste",
        punkte: [
          [
            "Ausfüllen: Die Stärke wird als Führer, Unterführer, Mannschaft und Gesamtzahl geführt; taktische Zeichen und Funkrufnamen sind hinterlegt und werden vorgeschlagen.",
          ],
          [
            "Ausgeben: Das PDF folgt dem gewohnten Papierbogen — und trägt den kompletten Bogeninhalt zusätzlich als QR-Code auf der letzten Seite.",
          ],
          [
            "Übergeben: Die Gegenstelle liest den QR-Code mit der Kamera oder einem USB-Handscanner ein, oder sie bekommt den Bogen als Datei. Ohne Netz, ohne Server, ohne Kopplung der Geräte.",
          ],
        ],
      },
      {
        art: "absatz",
        teile: [
          "Jeden Schritt erklärt die ",
          { text: "Anleitung zum Erfassungsbogen", ziel: "./anleitung.html" },
          "; wie sich das Verfahren zum Papierbogen verhält, steht in ",
          { text: "Papier oder digital?", ziel: "./papier-oder-digital.html" },
          ".",
        ],
      },
    ],
  },
  {
    titel: "Für welche Organisationen?",
    bloecke: [
      {
        art: "absatz",
        teile: [
          "Der Bogen ist BOS-übergreifend gebaut: Organisation, Einheit und Teileinheit sind Angaben im Bogen, keine feste Struktur. Eigene Seiten mit Beispielen und Hinweisen gibt es für den ",
          { text: "Erfassungsbogen im THW", ziel: "./thw.html" },
          ", die ",
          { text: "Feuerwehr", ziel: "./feuerwehr.html" },
          ", die ",
          { text: "DLRG", ziel: "./dlrg.html" },
          ", das ",
          { text: "DRK", ziel: "./drk.html" },
          ", die ",
          { text: "Johanniter", ziel: "./johanniter.html" },
          ", die ",
          { text: "Malteser", ziel: "./malteser.html" },
          ", den ",
          { text: "ASB", ziel: "./asb.html" },
          " und den ",
          { text: "Katastrophenschutz der Länder", ziel: "./katastrophenschutz.html" },
          ". Für die Feuerwehr ist der Aufbau der ",
          { text: "Stärkemeldung mit Beispiel", ziel: "./staerkemeldung-feuerwehr.html" },
          " gesondert beschrieben.",
        ],
      },
      {
        art: "absatz",
        teile: [
          "Als Vorbelegung liegen Beispielbögen bereit — vom THW-Zug nach StAN über die Einheiten der niedersächsischen Feuerwehrverordnung bis zu den Katastrophenschutzeinheiten der Länder sowie Einheiten von DRK und DLRG. Sie lassen sich anwenden und anpassen; eigene Vorlagen speichert die App auf dem Gerät und gibt sie wie einen Bogen per QR-Code weiter. Wie eine solche Vorbelegung im Einzelnen aussieht, zeigt die Seite zur ",
          { text: "Fachgruppe Räumen", ziel: "./thw-fachgruppe-raeumen-erfassungsbogen.html" },
          ".",
        ],
      },
    ],
  },
  {
    titel: "Offline statt Cloud",
    bloecke: [
      {
        art: "absatz",
        teile: [
          "Alle Daten bleiben auf dem Gerät. Es gibt keinen Server, an den ein Bogen geschickt würde, keine Anmeldung und kein Konto. Nach dem ersten Aufruf läuft die Seite offline und lässt sich auf dem Startbildschirm ablegen; daneben gibt es Fassungen für Windows, macOS, Linux und Android. Wie gezählt wird, wer die Seite aufruft, steht im ",
          { text: "Datenschutzhinweis", ziel: "./datenschutz.html" },
          ".",
        ],
      },
      {
        art: "absatz",
        teile: [
          "Die App ist kostenlos und quelloffen unter der EUPL-1.2. Ein übergebener Bogen trägt ein Echtheits-Siegel des ausstellenden Geräts, das die Gegenstelle beim Einlesen prüft — wer möchte, hinterlegt zusätzlich Name und Rückkanal als Absender.",
        ],
      },
    ],
  },
  {
    titel: "Vom Erfassungsbogen zur Kräfteübersicht",
    bloecke: [
      {
        art: "absatz",
        teile: [
          "Am ",
          { text: "Meldekopf", ziel: "./meldekopf.html" },
          ", im Bereitstellungsraum und beim Zugführer laufen viele Bögen zusammen. Dafür gibt es die Einsatz-Sammlung: Eintreffende Bögen werden gescannt oder als Datei übernommen, die Stärke aller anwesenden Einheiten wird laufend summiert — mit Zwischensummen je Zug. Wer eine Einheit nur durchwinken muss, nimmt die Schnellerfassung mit Stärke, Führungskraft und Fahrzeugen.",
        ],
      },
      {
        art: "absatz",
        teile: [
          "Jede Meldung landet in einer Historie; ein Vergleich zeigt zur Schichtübergabe, was sich seit der letzten Meldung geändert hat. Für die Weitermeldung erzeugt die Sammlung ein Sammel-PDF, eine CSV-Liste je Einsatz und eine Excel-Liste im Format „Oldenburg“.",
        ],
      },
    ],
  },
  {
    titel: "Häufige Fragen",
    bloecke: [
      {
        art: "frage",
        frage: "Was kostet der digitale Erfassungsbogen?",
        antwort: [
          "Nichts. Die App ist kostenlos und als freie Software unter der EUPL-1.2 veröffentlicht — ohne Anmeldung, ohne Konto, ohne Testzeitraum.",
        ],
      },
      {
        art: "frage",
        frage: "Funktioniert die Stärkemeldung ohne Internet?",
        antwort: [
          "Ja. Nach dem ersten Aufruf lädt die Seite aus dem Gerätespeicher, und die Übergabe kommt ohne Netz aus: Ein Gerät zeigt den QR-Code, das andere liest ihn ein. Es wird weder eine Verbindung noch eine Kopplung der Geräte gebraucht.",
        ],
      },
      {
        art: "frage",
        frage: "Wo werden die eingegebenen Daten gespeichert?",
        antwort: [
          "Auf dem Gerät, mit dem der Bogen ausgefüllt wird — im Speicher des Browsers beziehungsweise der App. Sie verlassen das Gerät nur, wenn ein Bogen bewusst als PDF, Datei oder QR-Code weitergegeben wird. Einzelheiten stehen im ",
          { text: "Datenschutzhinweis", ziel: "./datenschutz.html" },
          ".",
        ],
      },
      {
        art: "frage",
        frage: "Wie kommt der ausgefüllte Bogen zum Meldekopf?",
        antwort: [
          "Auf drei Wegen: als QR-Code vom Bildschirm oder vom PDF-Ausdruck, als Datei (etwa über AirDrop, Quick Share oder einen USB-Stick) — oder klassisch als Ausdruck auf Papier. Was am Meldekopf damit passiert, beschreibt die Seite ",
          { text: "Meldekopf digital", ziel: "./meldekopf.html" },
          ".",
        ],
      },
      {
        art: "frage",
        frage: "Passt das PDF zum Erfassungsbogen unserer Organisation?",
        antwort: [
          "Das PDF folgt dem Aufbau des gewohnten Papierbogens, damit der Ausdruck in bestehende Meldewege passt. Welche Felder das sind und wie ein Blanko-Bogen aussieht, zeigt die Seite ",
          { text: "Vorlage und Aufbau des Bogens", ziel: "./vorlage.html" },
          ".",
        ],
      },
    ],
  },
];

/** Nur das, was in Textinhalten überhaupt gefährlich werden kann. */
function html(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function teileHtml(teile: Teil[]): string {
  return teile
    .map((t) => (typeof t === "string" ? html(t) : `<a href="${t.ziel}">${html(t.text)}</a>`))
    .join("");
}

/**
 * Derselbe Text als statisches HTML — Zeichen für Zeichen das, was in
 * index.html zwischen den Marken stehen muss.
 *
 * `einzug` ist die Einrückung der äußeren `<section>` in index.html; die
 * Kinder rücken jeweils zwei Stellen weiter ein. Ohne das wäre der Vergleich
 * im Test von der Formatierung der Datei abhängig.
 */
export function startInhaltHtml(einzug = "      "): string {
  const e1 = einzug;
  const e2 = `${einzug}  `;
  const e3 = `${einzug}    `;
  const zeilen: string[] = [`${e1}<section class="start-seo" aria-label="Über den digitalen Erfassungsbogen">`];
  for (const abschnitt of START_ABSCHNITTE) {
    zeilen.push(`${e2}<h2>${html(abschnitt.titel)}</h2>`);
    for (const block of abschnitt.bloecke) {
      if (block.art === "absatz") {
        zeilen.push(`${e2}<p>${teileHtml(block.teile)}</p>`);
      } else if (block.art === "liste") {
        zeilen.push(`${e2}<ul>`);
        for (const punkt of block.punkte) zeilen.push(`${e3}<li>${teileHtml(punkt)}</li>`);
        zeilen.push(`${e2}</ul>`);
      } else {
        zeilen.push(`${e2}<h3>${html(block.frage)}</h3>`);
        zeilen.push(`${e2}<p>${teileHtml(block.antwort)}</p>`);
      }
    }
  }
  zeilen.push(`${e1}</section>`);
  return zeilen.join("\n");
}

/** Reiner Text eines Fließtext-Stücks — ohne Auszeichnung, wie ihn das Auge liest. */
function nurText(teile: Teil[]): string {
  return teile.map((t) => (typeof t === "string" ? t : t.text)).join("");
}

/**
 * Die sichtbaren „Häufige Fragen" derselben Quelle als FAQPage-Auszeichnung.
 *
 * Google verlangt für FAQ-Markup, dass Frage und Antwort auf der Seite auch
 * wirklich stehen. Genau deshalb wird es hier aus denselben Daten erzeugt wie
 * der sichtbare Abschnitt: Wer eine Frage umformuliert, ändert automatisch
 * beides, und der Test unten schlägt an, falls index.html nicht nachgezogen
 * wurde. Von Hand gepflegt wäre die Auszeichnung nach der ersten Textänderung
 * eine Falschangabe.
 *
 * Ausgezeichnet werden ausschließlich Blöcke der Art „frage"; enthält der Text
 * keine, entsteht kein Markup.
 */
export function faqJsonLd(einzug = "  "): string {
  const fragen = START_ABSCHNITTE.flatMap((a) => a.bloecke).filter((b) => b.art === "frage");
  if (fragen.length === 0) return "";
  const daten = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://erfassungsbogen.app/#faq",
    mainEntity: fragen.map((f) => ({
      "@type": "Question",
      name: f.frage,
      acceptedAnswer: { "@type": "Answer", text: nurText(f.antwort) },
    })),
  };
  const rumpf = JSON.stringify(daten, null, 2)
    .split("\n")
    .map((z) => `${einzug}${z}`)
    .join("\n");
  return [`${einzug}<script type="application/ld+json">`, rumpf, `${einzug}</script>`].join("\n");
}

/** Marken, zwischen denen der erzeugte Block in index.html steht. */
export const MARKE_ANFANG = "<!-- start-inhalt:anfang (erzeugt aus src/app/start-inhalt.ts — nicht von Hand ändern) -->";
export const MARKE_ENDE = "<!-- start-inhalt:ende -->";

/** Marken um die FAQ-Auszeichnung im <head> von index.html. */
export const MARKE_FAQ_ANFANG = "<!-- start-faq:anfang (erzeugt aus src/app/start-inhalt.ts — nicht von Hand ändern) -->";
export const MARKE_FAQ_ENDE = "<!-- start-faq:ende -->";
