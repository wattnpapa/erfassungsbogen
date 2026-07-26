/**
 * Oberfläche für „Meine Vorlagen":
 *  - VorlagenListe: einbettbare Kartenliste der gespeicherten Vorlagen mit
 *    Verwalten (umbenennen, löschen) und Einstieg in die Musterung. Wird direkt
 *    unter den Start-Buttons angezeigt. Geteilt wird erst der fertige Bogen
 *    (nach der Musterung in der Übersicht), nicht die ungemusterte Vorlage.
 *  - Musterung: die anwesende Mannschaft und die ausrückenden Fahrzeuge
 *    zusammenstellen (Variante A) → frischer Arbeitsbogen.
 */

import { useState } from "react";
import { StaerkeRolle, staerke, type Erfassungsbogen } from "../model";
import {
  funktionsText,
  kennzeichenText,
  orgLabel,
  vokabText,
  vokabularFuer,
} from "./hilfen";
import {
  vorlageEndgueltigLoeschen,
  vorlageInstanziieren,
  vorlageLoeschen,
  vorlageUmbenennen,
  vorlageWiederherstellen,
  vorlagenPapierkorb,
  type Vorlage,
} from "./vorlagen";
import { SeitenKopf } from "./seiten-kopf";

function personName(vorname: string, nachname: string): string {
  return `${vorname} ${nachname}`.trim() || "(ohne Name)";
}

function rolleKuerzel(r: StaerkeRolle): string {
  return r === StaerkeRolle.FUEHRER ? "F" : r === StaerkeRolle.UNTERFUEHRER ? "U" : "M";
}

function staerkeText(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

// ------------------------------------------------------------ Vorlagenliste

export function VorlagenListe(props: {
  vorlagen: Vorlage[];
  onMustern: (v: Vorlage) => void;
  onGeaendert: () => void;
}) {
  const { vorlagen, onMustern, onGeaendert } = props;
  const [zeigePapierkorb, setZeigePapierkorb] = useState(false);
  const papierkorb = vorlagenPapierkorb();

  function umbenennen(v: Vorlage) {
    const name = window.prompt("Vorlage umbenennen:", v.name);
    if (name != null) {
      vorlageUmbenennen(v.id, name);
      onGeaendert();
    }
  }

  // Kein confirm: Löschen ist nur der Weg in den Papierkorb (30 Tage
  // wiederherstellbar) — ein Fehltipp lässt sich rückgängig machen.
  function loeschen(v: Vorlage) {
    vorlageLoeschen(v.id);
    onGeaendert();
  }

  function endgueltigLoeschen(v: Vorlage) {
    if (window.confirm(`Vorlage „${v.name}" endgültig löschen? Das lässt sich nicht rückgängig machen.`)) {
      vorlageEndgueltigLoeschen(v.id);
      onGeaendert();
    }
  }

  return (
    <>
      {vorlagen.map((v) => (
        <section className="karte" key={v.id}>
          <div className="kopfzeile">
            <h2>{v.name}</h2>
            <button type="button" className="primaer" onClick={() => onMustern(v)}>
              Einsatz vorbereiten
            </button>
          </div>
          <p>
            <strong>{orgLabel(v.bogen.einheit.organisation)}</strong>
            {" · "}
            {vokabText(v.bogen.einheit.einheitsTyp, vokabularFuer(v.bogen.einheit.organisation, "einheitstyp"), "name") ||
              "(Einheit offen)"}
          </p>
          <p className="hinweis">
            Stärke {staerkeText(v.bogen)} · {v.bogen.personal.length} Personen · {v.bogen.fahrzeuge.length} Fahrzeuge
          </p>
          <div className="vorlage-aktionen">
            <button type="button" onClick={() => umbenennen(v)}>Umbenennen</button>{" "}
            <button type="button" className="entfernen" onClick={() => loeschen(v)}>Löschen</button>
          </div>
        </section>
      ))}
      {papierkorb.length > 0 && (
        <p>
          <button type="button" className="link" onClick={() => setZeigePapierkorb(!zeigePapierkorb)}>
            {zeigePapierkorb ? "Papierkorb ausblenden" : `Papierkorb (${papierkorb.length})`}
          </button>
        </p>
      )}
      {zeigePapierkorb &&
        papierkorb.map((v) => (
          <section className="karte papierkorb" key={v.id}>
            <div className="kopfzeile">
              <h2>{v.name}</h2>
              <span>
                <button type="button" onClick={() => { vorlageWiederherstellen(v.id); onGeaendert(); }}>
                  Wiederherstellen
                </button>{" "}
                <button type="button" className="entfernen" onClick={() => endgueltigLoeschen(v)}>
                  Endgültig löschen
                </button>
              </span>
            </div>
            <p className="hinweis">
              Gelöscht am {new Date(v.geloeschtAm!).toLocaleDateString("de-DE")} — wird nach 30 Tagen
              automatisch endgültig entfernt.
            </p>
          </section>
        ))}
    </>
  );
}

// --------------------------------------------------------------- Musterung

export function Musterung(props: {
  vorlage: Vorlage;
  onStart: (bogen: Erfassungsbogen) => void;
  onAbbrechen: () => void;
}) {
  const { vorlage, onStart, onAbbrechen } = props;
  const b = vorlage.bogen;
  const org = b.einheit.organisation;
  const [pAn, setPAn] = useState<boolean[]>(() => b.personal.map(() => true));
  const [vAn, setVAn] = useState<boolean[]>(() => b.fahrzeuge.map(() => true));

  const anwesendePersonen = b.personal.filter((_, i) => pAn[i]);
  const s = staerke({ personal: anwesendePersonen, staerkeManuell: b.staerkeManuell });
  const anzahlFz = vAn.filter(Boolean).length;

  const toggleP = (i: number) => setPAn(pAn.map((x, j) => (j === i ? !x : x)));
  const toggleV = (i: number) => setVAn(vAn.map((x, j) => (j === i ? !x : x)));

  function starten() {
    onStart(vorlageInstanziieren(b, { personal: pAn, fahrzeuge: vAn }));
  }

  return (
    <>
    <SeitenKopf>
      <button type="button" className="zur-start" onClick={onAbbrechen}>‹ Abbrechen</button>
      <div className="titelzeile">
        <h1>{vorlage.name}</h1>
      </div>
      <p className="hinweis">Anwesende abhaken lassen — die Vorlage bleibt unverändert.</p>
    </SeitenKopf>
    <main id="inhalt" tabIndex={-1} className="musterung">
      <section className="karte staerke-leiste">
        <div><strong>{s.fuehrer}</strong><span>Führer</span></div>
        <div><strong>{s.unterfuehrer}</strong><span>Unterf.</span></div>
        <div><strong>{s.mannschaft}</strong><span>Mannsch.</span></div>
        <div className="gesamt"><strong>{s.gesamt}</strong><span>Gesamt</span></div>
      </section>

      <section className="karte">
        <div className="kopfzeile">
          <h2>Personal ({anwesendePersonen.length}/{b.personal.length})</h2>
          <button type="button" onClick={() => setPAn(b.personal.map(() => true))}>Alle</button>
        </div>
        {b.personal.length === 0 && <p className="hinweis">Kein Personal in der Vorlage.</p>}
        {b.personal.map((p, i) => (
          <label key={i} className={`muster-zeile${pAn[i] ? "" : " gestrichen"}`}>
            <input type="checkbox" checked={pAn[i]} onChange={() => toggleP(i)} />
            <span className={`rolle-badge rolle-${rolleKuerzel(p.staerkeRolle).toLowerCase()}`}>
              {rolleKuerzel(p.staerkeRolle)}
            </span>
            <span className="muster-text">
              <span className="muster-name">{personName(p.vorname, p.nachname)}</span>
              <span className="muster-sub">{funktionsText(p, org) || "—"}</span>
            </span>
          </label>
        ))}
      </section>

      <section className="karte">
        <div className="kopfzeile">
          <h2>Fahrzeuge ({anzahlFz}/{b.fahrzeuge.length})</h2>
          <button type="button" onClick={() => setVAn(b.fahrzeuge.map(() => true))}>Alle</button>
        </div>
        {b.fahrzeuge.length === 0 && <p className="hinweis">Keine Fahrzeuge in der Vorlage.</p>}
        {b.fahrzeuge.map((f, i) => (
          <label key={i} className={`muster-zeile${vAn[i] ? "" : " gestrichen"}`}>
            <input type="checkbox" checked={vAn[i]} onChange={() => toggleV(i)} />
            <span className="muster-text">
              <span className="muster-name">
                {vokabText(f.typ, vokabularFuer(org, "fahrzeug"), "name") || "Fahrzeug"}
              </span>
              <span className="muster-sub">{kennzeichenText(f) || "—"}</span>
            </span>
          </label>
        ))}
      </section>

      <footer className="nav">
        <button type="button" className="primaer muster-start" onClick={starten}>
          Einsatz starten · {s.gesamt} Pers · {anzahlFz} Fz
        </button>
      </footer>
    </main>
    </>
  );
}
