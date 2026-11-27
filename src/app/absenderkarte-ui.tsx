/**
 * Bedienoberfläche der Absenderkarte (Name/E-Mail/Telefon zur Signatur).
 *
 * Eigenes Modul, weil zwei Stellen dieselbe Eingabe brauchen: die Startseite
 * (einmal einrichten, bevor der erste Bogen entsteht) und der QR-Kasten der
 * Übersicht (dort sieht man direkt, was mit dem Bogen mitgeht). Beide
 * schreiben in denselben Gerätespeicher — siehe absenderkarte.ts.
 */

import { useState, type ReactNode } from "react";
import { absenderLabel } from "@bos/eeb-format/signatur";
import {
  ABSENDER_MAX,
  absenderHinweis,
  absenderkarteGefuellt,
  absenderkarteSpeichern,
  telefonProblem,
  type Absenderkarte,
} from "./absenderkarte";
import { frageJaNein } from "./dialoge";
import { emailProblem } from "./email-pruefung";
import { PersonName, namensFeld } from "./personen-name";

/** Beschriftetes Eingabefeld — gleiche Auszeichnung wie in schritte.tsx. */
function Feld(props: { titel: string; children: ReactNode }) {
  return (
    <label className="feld">
      {props.titel}
      {props.children}
    </label>
  );
}

/**
 * Freiwillige Absenderangaben zur Signatur. Der Schlüssel-Fingerabdruck allein
 * sagt nur „derselbe Absender wie zuletzt" — Name und Rückkanal machen daraus
 * jemanden, den der Meldekopf auch anrufen kann. Einmal einstellen, danach
 * reist die Karte mitsigniert in jedem QR/Link/PDF mit.
 *
 * `startOffen` klappt die Felder sofort auf (Startseite ohne hinterlegte Karte:
 * ein Link allein würde die Funktion dort verstecken).
 */
export function AbsenderkarteFeld(props: {
  karte: Absenderkarte;
  onGespeichert: (k: Absenderkarte) => void;
  startOffen?: boolean;
}) {
  const { karte } = props;
  const [offen, setOffen] = useState(props.startOffen ?? false);
  const [entwurf, setEntwurf] = useState<Absenderkarte>(karte);

  function oeffnen() {
    setEntwurf(karte); // immer vom gespeicherten Stand aus bearbeiten
    setOffen(true);
  }

  async function speichern() {
    // R13-D2: „Übernehmen" mit lauter leeren Feldern ist „Angaben entfernen" und fragt genauso nach.
    if (!absenderkarteGefuellt(entwurf)) {
      if (absenderkarteGefuellt(karte)) await entfernen();
      else setOffen(false);
      return;
    }
    // R12-E2: Eine Adresse, die die App selbst „unvollständig" nennt, reist mitsigniert in jedem QR-Code mit.
    if (emailProblem(entwurf.email)) {
      const trotzdem = await frageJaNein({
        titel: "E-Mail-Adresse übernehmen?",
        text: `Die Adresse „${(entwurf.email ?? "").trim()}" sieht unvollständig aus. Sie reist in jedem übergebenen Bogen mit; die Gegenstelle erreicht dich darüber vielleicht nicht.`,
        ok: "Trotzdem übernehmen",
        abbruch: "Adresse prüfen",
        fokus: "abbruch",
      });
      if (!trotzdem) return;
    }
    // R14-E5: Dieselbe Prüfung und dieselbe Rückfrage für die Rückrufnummer wie im Assistenten — sie reist ebenfalls
    // mit Siegel in jedem übergebenen Bogen. Übernommen wird die bereinigte Nummer (nur Ziffern, ein „+" vorn).
    let zuSpeichern = entwurf;
    const telefon = telefonProblem(entwurf.telefon);
    if (telefon) {
      const trotzdem = await frageJaNein({
        titel: "Telefonnummer übernehmen?",
        text: `${telefon.text} Gespeichert würde: ${telefon.wert ? `„${telefon.wert}"` : "keine Nummer"}. Sie reist in jedem Bogen mit.`,
        ok: "Trotzdem übernehmen",
        abbruch: "Nummer prüfen",
        fokus: "abbruch",
      });
      if (!trotzdem) return;
      zuSpeichern = { ...entwurf, telefon: telefon.wert };
    }
    props.onGespeichert(absenderkarteSpeichern(zuSpeichern));
    setOffen(false);
  }

  /**
   * Der Knopf stand unmittelbar neben „Abbrechen" und löschte die Angaben ohne
   * Rückfrage — zwei Nachbarn mit gegensätzlicher Wirkung. Jetzt steht er
   * abgesetzt und fragt nach.
   */
  async function entfernen() {
    const sicher = await frageJaNein({
      titel: "Absenderangaben entfernen?",
      text: "Name, Rückrufnummer und E-Mail werden von diesem Gerät gelöscht. Künftig übergebene Bögen tragen dann keine Absenderangaben mehr.",
      ok: "Angaben entfernen",
      gefahr: true,
    });
    if (!sicher) return;
    props.onGespeichert(absenderkarteSpeichern({}));
    setEntwurf({});
    setOffen(false);
  }

  const hinweis = absenderHinweis(entwurf);

  if (!offen) {
    return (
      <p className="hinweis">
        Absender:{" "}
        {absenderkarteGefuellt(karte) ? <strong><PersonName>{absenderLabel(karte)}</PersonName></strong> : "keine Angabe"}
        {" · "}
        <button type="button" className="link" onClick={oeffnen}>
          {absenderkarteGefuellt(karte) ? "ändern" : "Name/Kontakt hinterlegen…"}
        </button>
        <br />
        Freiwillig. Hinterlegte Angaben reisen mitsigniert in jedem QR-Code, Link und PDF mit,
        damit die Gegenstelle bei Rückfragen weiß, wen sie erreicht.
      </p>
    );
  }

  return (
    <div className="absenderkarte">
      <div className="zeile">
        <Feld titel="Name">
          <input
            {...namensFeld(entwurf.name)}
            value={entwurf.name ?? ""}
            maxLength={ABSENDER_MAX.name}
            autoComplete="name"
            placeholder="z. B. Max Mustermann"
            onChange={(e) => setEntwurf({ ...entwurf, name: e.target.value })}
          />
        </Feld>
        <Feld titel="E-Mail">
          <input
            type="email"
            {...namensFeld(entwurf.email)}
            value={entwurf.email ?? ""}
            maxLength={ABSENDER_MAX.email}
            autoComplete="email"
            placeholder="z. B. max.mustermann@thw.de"
            onChange={(e) => setEntwurf({ ...entwurf, email: e.target.value })}
          />
        </Feld>
        <Feld titel="Telefon">
          <input
            type="tel"
            value={entwurf.telefon ?? ""}
            maxLength={ABSENDER_MAX.telefon}
            autoComplete="tel"
            placeholder="z. B. 0170 1234567"
            onChange={(e) => setEntwurf({ ...entwurf, telefon: e.target.value })}
          />
        </Feld>
      </div>
      {hinweis && <p className="hinweis">{hinweis}</p>}
      <p className="hinweis">
        Alle Felder sind freiwillig und bleiben auf diesem Gerät gespeichert, bis du sie änderst.
        Sie stehen dann in jedem übergebenen Bogen — sparsam ausfüllen, es sind Personendaten.
      </p>
      <div className="aktionen">
        <button type="button" className="primaer" onClick={speichern}>Übernehmen</button>{" "}
        <button type="button" onClick={() => setOffen(false)}>Abbrechen</button>
      </div>
      {absenderkarteGefuellt(karte) && (
        <div className="aktionen abgesetzt">
          <button type="button" className="entfernen" onClick={entfernen}>Angaben entfernen…</button>
        </div>
      )}
    </div>
  );
}
