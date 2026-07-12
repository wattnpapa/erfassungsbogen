/**
 * Oberfläche für „Einsatz-Sammlung" (Meldekopf/Zugführer):
 *  - EinsatzListe: Kartenliste der Einsätze auf dem Startbildschirm.
 *  - EinsatzDetail: Summen über die anwesenden Einheiten, Einheitenliste mit
 *    Status (anwesend/abgerückt) und aufklappbarer Revisions-Historie, Bögen
 *    hinzufügen (Scan / manuell), Einsatz löschen.
 *
 * Reine Anzeige + Aufruf der Store-/Auswertungslogik (einsaetze.ts, auswertung.ts).
 */

import { useState } from "react";
import { datumZuIso, staerke, type Erfassungsbogen } from "../model";
import { datumDeutsch, orgLabel, vokabText, vokabularFuer } from "./hilfen";
import {
  EinsatzArt,
  MeldeStatus,
  einsatzLoeschen,
  einheitZugEtikettSetzen,
  meldungEntfernen,
  meldungStatusSetzen,
  neuesteJeEinheit,
  revisionen,
  type Einsatzsammlung,
  type MeldeEintrag,
} from "./einsaetze";
import { aggregiere } from "./auswertung";

const ART_LABEL: Record<EinsatzArt, string> = {
  [EinsatzArt.EINSATZ]: "Einsatz",
  [EinsatzArt.UEBUNG]: "Übung",
  [EinsatzArt.VERANSTALTUNG]: "Veranstaltung",
};

const QUELLE_LABEL: Record<MeldeEintrag["quelle"], string> = {
  scan: "Scan",
  manuell: "Manuell",
  "pdf-import": "PDF-Import",
};

function einheitAnzeige(b: Erfassungsbogen): string {
  const org = b.einheit.organisation;
  return b.einheit.name || vokabText(b.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || orgLabel(org);
}

function staerkeText(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

function standText(b: Erfassungsbogen): string {
  return datumDeutsch(datumZuIso(b.stand));
}

// ---------------------------------------------------------------- Einsatzliste

export function EinsatzListe(props: {
  einsaetze: Einsatzsammlung[];
  onOeffnen: (s: Einsatzsammlung) => void;
  onGeaendert: () => void;
}) {
  const { einsaetze, onOeffnen, onGeaendert } = props;

  function loeschen(s: Einsatzsammlung) {
    if (window.confirm(`Einsatz „${s.name}" mit ${s.eintraege.length} Meldung(en) löschen? Enthält fremde Personendaten.`)) {
      einsatzLoeschen(s.id);
      onGeaendert();
    }
  }

  return (
    <>
      {einsaetze.map((s) => {
        const sum = aggregiere(s.eintraege);
        return (
          <section className="karte" key={s.id}>
            <div className="kopfzeile">
              <h2>{s.name}</h2>
              <button type="button" className="primaer" onClick={() => onOeffnen(s)}>Öffnen</button>
            </div>
            <p>
              <strong>{ART_LABEL[s.art]}</strong>
              {s.ort ? ` · ${s.ort}` : ""}
            </p>
            <p className="hinweis">
              {sum.einheiten} Einheit(en) anwesend · Stärke {sum.staerke.fuehrer} / {sum.staerke.unterfuehrer} / {sum.staerke.mannschaft} / {sum.staerke.gesamt}
            </p>
            <div className="vorlage-aktionen">
              <button type="button" className="entfernen" onClick={() => loeschen(s)}>Löschen</button>
            </div>
          </section>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- Einsatzdetail

export function EinsatzDetail(props: {
  einsatz: Einsatzsammlung;
  onZurueck: () => void;
  onGeaendert: () => void;
  onScannen: () => void;
  onManuell: () => void;
  onDateiImport: (datei: File) => void;
  onExport: () => void;
  onSammelPdf: () => void;
  onGeloescht: () => void;
}) {
  const { einsatz, onZurueck, onGeaendert, onScannen, onManuell, onDateiImport, onExport, onSammelPdf, onGeloescht } = props;
  const sum = aggregiere(einsatz.eintraege);
  const kopf = neuesteJeEinheit(einsatz.eintraege).sort((a, b) =>
    einheitAnzeige(a.bogen).localeCompare(einheitAnzeige(b.bogen), "de"),
  );

  function loeschen() {
    if (window.confirm(`Einsatz „${einsatz.name}" komplett löschen? Enthält fremde Personendaten.`)) {
      einsatzLoeschen(einsatz.id);
      onGeloescht();
    }
  }

  return (
    <main className="einsatz-detail">
      <header>
        <button type="button" className="zur-start" onClick={onZurueck}>‹ Einsätze</button>
        <h1>{einsatz.name}</h1>
        <p className="hinweis">
          {ART_LABEL[einsatz.art]}{einsatz.ort ? ` · ${einsatz.ort}` : ""}
        </p>
      </header>

      <section className="karte staerke-leiste">
        <div><strong>{sum.einheiten}</strong><span>Einheiten</span></div>
        <div><strong>{sum.staerke.fuehrer}</strong><span>Führer</span></div>
        <div><strong>{sum.staerke.unterfuehrer}</strong><span>Unterf.</span></div>
        <div><strong>{sum.staerke.mannschaft}</strong><span>Mannsch.</span></div>
        <div className="gesamt"><strong>{sum.staerke.gesamt}</strong><span>Gesamt</span></div>
      </section>

      <section className="karte">
        <h2>Bedarf (anwesende Einheiten)</h2>
        <p>
          Verpflegung: <strong>{sum.verpflegung.gesamt}</strong>
          {" "}({sum.verpflegung.vegetarisch} vegetarisch / {sum.verpflegung.vegan} vegan)
          {" · "}Unterbringung: M {sum.unterbringung.m} / W {sum.unterbringung.w} / D {sum.unterbringung.d}
          {sum.unterbringungBenoetigt > 0 ? ` · ${sum.unterbringungBenoetigt}× angefordert` : ""}
        </p>
        <p>
          Kraftstoff: Diesel {sum.kraftstoff.dieselLiter} l · Benzin {sum.kraftstoff.benzinLiter} l
          {sum.kraftstoff.gemischLiter > 0 ? ` · Gemisch ${sum.kraftstoff.gemischLiter} l` : ""}
          {" · "}Fahrzeuge: {sum.fahrzeuge}
          {sum.ruhezeitErforderlich > 0 ? ` · Ruhezeit: ${sum.ruhezeitErforderlich}×` : ""}
        </p>
      </section>

      <div className="aktionen">
        <button type="button" className="primaer" onClick={onScannen}>Bogen scannen…</button>
        <button type="button" onClick={onManuell}>Einheit manuell erfassen…</button>
        <label className="datei-knopf">
          Aus Datei/PDF…
          <input
            type="file"
            accept=".json,application/json,.pdf,application/pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onDateiImport(f);
            }}
          />
        </label>
      </div>

      <div className="vorlage-aktionen" style={{ marginBottom: "0.5rem" }}>
        <button type="button" onClick={onSammelPdf}>Sammel-PDF (alle Bögen)</button>{" "}
        <button type="button" onClick={onExport}>Als Datei exportieren</button>
      </div>

      <section className="karte">
        <h2>Einheiten ({kopf.length})</h2>
        {kopf.length === 0 && <p className="hinweis">Noch keine Meldung. Bogen scannen oder manuell erfassen.</p>}
        {kopf.map((e) => (
          <EinheitKarte key={e.einheitSchluessel} einsatzId={einsatz.id} kopf={e} alle={einsatz.eintraege} onGeaendert={onGeaendert} />
        ))}
      </section>

      <footer className="nav">
        <button type="button" className="entfernen" onClick={loeschen}>Einsatz löschen</button>
      </footer>
    </main>
  );
}

function EinheitKarte(props: {
  einsatzId: string;
  kopf: MeldeEintrag;
  alle: MeldeEintrag[];
  onGeaendert: () => void;
}) {
  const { einsatzId, kopf, alle, onGeaendert } = props;
  const [historie, setHistorie] = useState(false);
  // null = nicht in Bearbeitung; String = Entwurf des Zug-Etiketts.
  const [zugEntwurf, setZugEntwurf] = useState<string | null>(null);
  const revs = revisionen(alle, kopf.einheitSchluessel);
  const abgerueckt = kopf.status === MeldeStatus.ABGERUECKT;

  function statusUmschalten() {
    meldungStatusSetzen(einsatzId, kopf.id, abgerueckt ? MeldeStatus.ANWESEND : MeldeStatus.ABGERUECKT);
    onGeaendert();
  }

  function zugSpeichern() {
    einheitZugEtikettSetzen(einsatzId, kopf.einheitSchluessel, zugEntwurf ?? "");
    setZugEntwurf(null);
    onGeaendert();
  }

  function entfernen() {
    if (window.confirm(`Meldung von „${einheitAnzeige(kopf.bogen)}" (Stand ${standText(kopf.bogen)}) entfernen?`)) {
      meldungEntfernen(einsatzId, kopf.id);
      onGeaendert();
    }
  }

  return (
    <div className={`einheit-zeile${abgerueckt ? " gestrichen" : ""}`}>
      <div className="kopfzeile">
        <span className="muster-text">
          <span className="muster-name">
            {einheitAnzeige(kopf.bogen)}
            {kopf.zugEtikett ? <span className="zug-badge"> {kopf.zugEtikett}</span> : null}
          </span>
          <span className="muster-sub">
            {orgLabel(kopf.bogen.einheit.organisation)} · Stärke {staerkeText(kopf.bogen)} · Stand {standText(kopf.bogen)} · {QUELLE_LABEL[kopf.quelle]}
            {abgerueckt ? " · abgerückt" : ""}
          </span>
        </span>
      </div>
      <div className="vorlage-aktionen">
        <button type="button" onClick={statusUmschalten}>{abgerueckt ? "Als anwesend" : "Abrücken"}</button>{" "}
        <button type="button" onClick={() => setZugEntwurf(kopf.zugEtikett ?? "")}>
          {kopf.zugEtikett ? "Zug ändern" : "Zug zuordnen"}
        </button>{" "}
        {revs.length > 1 && (
          <button type="button" onClick={() => setHistorie(!historie)}>
            {historie ? "Historie schließen" : `Historie (${revs.length})`}
          </button>
        )}{" "}
        <button type="button" className="entfernen" onClick={entfernen}>Entfernen</button>
      </div>
      {zugEntwurf !== null && (
        <div className="zug-bearbeiten">
          <input
            type="text"
            value={zugEntwurf}
            placeholder="z. B. 2. Zug"
            autoFocus
            onChange={(e) => setZugEntwurf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") zugSpeichern();
              if (e.key === "Escape") setZugEntwurf(null);
            }}
          />{" "}
          <button type="button" className="primaer" onClick={zugSpeichern}>Speichern</button>{" "}
          <button type="button" onClick={() => setZugEntwurf(null)}>Abbrechen</button>
        </div>
      )}
      {historie && revs.length > 1 && (
        <ul className="historie">
          {revs.map((r, i) => (
            <li key={r.id}>
              Stand {standText(r.bogen)} · Stärke {staerkeText(r.bogen)} · {QUELLE_LABEL[r.quelle]}
              {i === 0 ? " (aktuell)" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
