/**
 * Oberfläche für „Meine Vorlagen":
 *  - VorlagenListe: einbettbare Kartenliste der gespeicherten Vorlagen mit
 *    Verwalten (umbenennen, löschen), Teilen per QR und Einstieg in die
 *    Musterung. Wird direkt unter den Start-Buttons angezeigt.
 *  - Musterung: die anwesende Mannschaft und die ausrückenden Fahrzeuge
 *    zusammenstellen (Variante A) → frischer Arbeitsbogen.
 */

import { useEffect, useState } from "react";
import { StaerkeRolle, staerke, type Erfassungsbogen } from "../model";
import {
  funktionsText,
  kennzeichenText,
  orgLabel,
  qrVorlageErzeugen,
  vokabText,
  vokabularFuer,
  type QrInfo,
} from "./hilfen";
import {
  vorlageInstanziieren,
  vorlageLoeschen,
  vorlageUmbenennen,
  type Vorlage,
} from "./vorlagen";

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
  const [qrFuer, setQrFuer] = useState<Vorlage | null>(null);

  function umbenennen(v: Vorlage) {
    const name = window.prompt("Vorlage umbenennen:", v.name);
    if (name != null) {
      vorlageUmbenennen(v.id, name);
      onGeaendert();
    }
  }

  function loeschen(v: Vorlage) {
    if (window.confirm(`Vorlage „${v.name}" löschen?`)) {
      vorlageLoeschen(v.id);
      if (qrFuer?.id === v.id) setQrFuer(null);
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
              v.bogen.einheit.name ||
              "(Einheit offen)"}
          </p>
          <p className="hinweis">
            Stärke {staerkeText(v.bogen)} · {v.bogen.personal.length} Personen · {v.bogen.fahrzeuge.length} Fahrzeuge
          </p>
          <div className="vorlage-aktionen">
            <button type="button" onClick={() => setQrFuer(qrFuer?.id === v.id ? null : v)}>
              {qrFuer?.id === v.id ? "QR schließen" : "Per QR teilen"}
            </button>{" "}
            <button type="button" onClick={() => umbenennen(v)}>Umbenennen</button>{" "}
            <button type="button" className="entfernen" onClick={() => loeschen(v)}>Löschen</button>
          </div>
          {qrFuer?.id === v.id && <VorlageQr vorlage={v} />}
        </section>
      ))}
    </>
  );
}

function VorlageQr({ vorlage }: { vorlage: Vorlage }) {
  const [qr, setQr] = useState<QrInfo | null>(null);
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    let aktiv = true;
    setQr(null);
    setFehler("");
    qrVorlageErzeugen(vorlage.bogen)
      .then((q) => aktiv && setQr(q))
      .catch((e) => aktiv && setFehler(`QR-Code: ${e instanceof Error ? e.message : e}`));
    return () => {
      aktiv = false;
    };
  }, [vorlage]);

  return (
    <div className="qr-box">
      <p className="hinweis">
        Von einem Kameraden scannen lassen — der QR importiert die Vorlage in seine App,
        ohne einen Einsatzbogen zu öffnen.
      </p>
      {fehler && <p className="fehler">{fehler}</p>}
      {qr && <img src={qr.datenUrl} alt={`QR-Code der Vorlage ${vorlage.name}`} />}
    </div>
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
    <main className="musterung">
      <header>
        <button type="button" className="zur-start" onClick={onAbbrechen}>‹ Abbrechen</button>
        <h1>{vorlage.name}</h1>
        <p className="hinweis">Anwesende abhaken lassen — die Vorlage bleibt unverändert.</p>
      </header>

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
  );
}
