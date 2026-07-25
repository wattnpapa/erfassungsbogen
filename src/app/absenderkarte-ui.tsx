/**
 * Bedienoberfläche der Absenderkarte (Name/E-Mail/Telefon zur Signatur).
 *
 * Eigenes Modul, weil zwei Stellen dieselbe Eingabe brauchen: die Startseite
 * (einmal einrichten, bevor der erste Bogen entsteht) und der QR-Kasten der
 * Übersicht (dort sieht man direkt, was mit dem Bogen mitgeht). Beide
 * schreiben in denselben Gerätespeicher — siehe absenderkarte.ts.
 */

import { useState, type ReactNode } from "react";
import { absenderLabel } from "../signatur";
import {
  ABSENDER_MAX,
  absenderHinweis,
  absenderkarteGefuellt,
  absenderkarteSpeichern,
  type Absenderkarte,
} from "./absenderkarte";

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

  function speichern() {
    props.onGespeichert(absenderkarteSpeichern(entwurf));
    setOffen(false);
  }

  function entfernen() {
    props.onGespeichert(absenderkarteSpeichern({}));
    setEntwurf({});
    setOffen(false);
  }

  const hinweis = absenderHinweis(entwurf);

  if (!offen) {
    return (
      <p className="hinweis">
        Absender:{" "}
        {absenderkarteGefuellt(karte) ? <strong>{absenderLabel(karte)}</strong> : "keine Angabe"}
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
        <button type="button" onClick={() => setOffen(false)}>Abbrechen</button>{" "}
        {absenderkarteGefuellt(karte) && (
          <button type="button" onClick={entfernen}>Angaben entfernen</button>
        )}
      </div>
    </div>
  );
}
