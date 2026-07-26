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
import {
  KontaktArt,
  PersonalErfassung,
  datumZuIso,
  staerke,
  unterbringungMWD,
  verpflegung,
  zeitpunktZuIso,
  type Erfassungsbogen,
  type Kontakt,
} from "../model";
import {
  datumDeutsch,
  einheitAnzeigename,
  einheitOrt,
  funkrufText,
  funktionsText,
  kennzeichenText,
  orgLabel,
  vokabText,
  vokabularFuer,
} from "./hilfen";
import {
  EinsatzArt,
  MeldeStatus,
  einsatzEndgueltigLoeschen,
  einsatzLoeschen,
  einsatzWiederherstellen,
  einsaetzePapierkorb,
  einheitZugEtikettSetzen,
  meldungEntfernen,
  meldungStatusSetzen,
  neuesteJeEinheit,
  revisionen,
  type Einsatzsammlung,
  type MeldeEintrag,
} from "./einsaetze";
import { aggregiere, aggregiereNachZug, type EinsatzSummen } from "./auswertung";
import { SORTIERUNGEN, einheitenAnsicht, type EinheitenSortierung } from "./einheiten-liste";
import { debugAktiv } from "./debug-plattform";
import { SeitenKopf } from "./seiten-kopf";

export const ART_LABEL: Record<EinsatzArt, string> = {
  [EinsatzArt.EINSATZ]: "Einsatz",
  [EinsatzArt.UEBUNG]: "Übung",
  [EinsatzArt.VERANSTALTUNG]: "Veranstaltung",
};

const QUELLE_LABEL: Record<MeldeEintrag["quelle"], string> = {
  scan: "Scan",
  manuell: "Manuell",
  "pdf-import": "PDF-Import",
};

/** Kurzes Signatur-Etikett für eine Meldung (leer, wenn unsigniert empfangen). */
function signaturBadge(e: MeldeEintrag) {
  if (!e.signatur) return null;
  if (e.signatur.zustand === "gueltig") {
    return (
      <span className="signatur-badge gueltig" title={`Öffentlicher Schlüssel: ${e.signatur.pubkey ?? ""}`}>
        ✓ signiert {e.signatur.kurzform ?? ""}
      </span>
    );
  }
  return <span className="signatur-badge ungueltig" title="Signatur passt nicht zu den Daten">⚠ Signatur ungültig</span>;
}

function staerkeText(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

function summenStaerkeText(sum: EinsatzSummen): string {
  const s = sum.staerke;
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
  const [zeigePapierkorb, setZeigePapierkorb] = useState(false);
  const papierkorb = einsaetzePapierkorb();

  // Kein confirm: Löschen ist nur der Weg in den Papierkorb (30 Tage
  // wiederherstellbar) — ein Fehltipp lässt sich rückgängig machen.
  function loeschen(s: Einsatzsammlung) {
    einsatzLoeschen(s.id);
    onGeaendert();
  }

  function endgueltigLoeschen(s: Einsatzsammlung) {
    if (
      window.confirm(
        `Einsatz „${s.name}" mit ${s.eintraege.length} Meldung(en) endgültig löschen? Enthält fremde Personendaten; das lässt sich nicht rückgängig machen.`,
      )
    ) {
      einsatzEndgueltigLoeschen(s.id);
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
      {papierkorb.length > 0 && (
        <p>
          <button type="button" className="link" onClick={() => setZeigePapierkorb(!zeigePapierkorb)}>
            {zeigePapierkorb ? "Papierkorb ausblenden" : `Papierkorb (${papierkorb.length})`}
          </button>
        </p>
      )}
      {zeigePapierkorb &&
        papierkorb.map((s) => (
          <section className="karte papierkorb" key={s.id}>
            <div className="kopfzeile">
              <h2>{s.name}</h2>
              <span>
                <button type="button" onClick={() => { einsatzWiederherstellen(s.id); onGeaendert(); }}>
                  Wiederherstellen
                </button>{" "}
                <button type="button" className="entfernen" onClick={() => endgueltigLoeschen(s)}>
                  Endgültig löschen
                </button>
              </span>
            </div>
            <p className="hinweis">
              {s.eintraege.length} Meldung(en) · gelöscht am {new Date(s.geloeschtAm!).toLocaleDateString("de-DE")} —
              wird nach 30 Tagen automatisch endgültig entfernt.
            </p>
          </section>
        ))}
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
  onCsvExport: () => void;
  onSammelPdf: () => void;
  onGeloescht: () => void;
}) {
  const { einsatz, onZurueck, onGeaendert, onScannen, onManuell, onDateiImport, onExport, onCsvExport, onSammelPdf, onGeloescht } = props;
  const [suche, setSuche] = useState("");
  const [sortierung, setSortierung] = useState<EinheitenSortierung>("name");
  const sum = aggregiere(einsatz.eintraege);
  const zugGruppen = aggregiereNachZug(einsatz.eintraege);
  // Alle gemeldeten Einheiten (neueste Revision je Einheit) — Grundlage für die
  // Gesamtzahl; `kopf` ist davon nur der gerade angezeigte Ausschnitt. Suche und
  // Sortierung ändern die Summen oben bewusst nicht.
  const alleEinheiten = neuesteJeEinheit(einsatz.eintraege);
  const kopf = einheitenAnsicht(alleEinheiten, suche, sortierung);
  const gefiltert = kopf.length !== alleEinheiten.length;

  // Verschiebt nur in den Papierkorb (30 Tage wiederherstellbar über die
  // Einsatzliste) — daher kein confirm.
  function loeschen() {
    einsatzLoeschen(einsatz.id);
    onGeloescht();
  }

  return (
    <>
    <SeitenKopf>
      <button type="button" className="zur-start" onClick={onZurueck}>‹ Einsätze</button>
      <div className="titelzeile">
        <h1>{einsatz.name}</h1>
      </div>
      <p className="hinweis">
        {ART_LABEL[einsatz.art]}{einsatz.ort ? ` · ${einsatz.ort}` : ""}
      </p>
    </SeitenKopf>
    <main id="inhalt" tabIndex={-1} className="einsatz-detail">
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

      {zugGruppen.length > 1 && (
        <section className="karte">
          <h2>Zwischensummen nach Zug</h2>
          {zugGruppen.map((g) => (
            <div className="zug-summe" key={g.zugEtikett ?? " ohne"}>
              <p>
                <strong>{g.zugEtikett ?? "Ohne Zug"}</strong>
                {" · "}{g.summen.einheiten} Einheit(en){" · "}Stärke {summenStaerkeText(g.summen)}
              </p>
              <p className="hinweis">
                Verpflegung {g.summen.verpflegung.gesamt}
                {" · "}Unterbringung M {g.summen.unterbringung.m} / W {g.summen.unterbringung.w} / D {g.summen.unterbringung.d}
                {" · "}Fahrzeuge {g.summen.fahrzeuge}
              </p>
            </div>
          ))}
        </section>
      )}

      <div className="aktionen">
        <button type="button" className="primaer" onClick={onScannen}>Bogen scannen…</button>
        <button type="button" onClick={onManuell}>Einheit manuell erfassen…</button>
        <label className="datei-knopf">
          Aus Datei/PDF…
          <input
            type="file"
            accept=".json,application/json,.pdf,application/pdf"
            className="nur-sr"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onDateiImport(f);
            }}
          />
        </label>
      </div>

      <div className="vorlage-aktionen" style={{ marginBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={onSammelPdf}
          title="Alle Bögen als eine PDF — mit eingebetteter kompletter Sammlung (Züge, Status, Historie). Auf dem Zielgerät über „Einsatz importieren…“ einlesbar."
        >
          Sammel-PDF (alle Bögen)
        </button>{" "}
        <button type="button" onClick={onCsvExport}>Als CSV</button>{" "}
        {/* Roh-JSON nur im Debug-Modus: fürs Publikum trägt die Sammel-PDF die
            Bögen als eingebettetes JSON — ein separater Export verwirrt nur. */}
        {debugAktiv() && (
          <button type="button" onClick={onExport}>Als Datei exportieren (Debug)</button>
        )}
      </div>

      <section className="karte">
        <h2>Einheiten ({gefiltert ? `${kopf.length} von ${alleEinheiten.length}` : alleEinheiten.length})</h2>
        {/* Ab einer Handvoll Meldungen trägt die Liste allein nicht mehr — bei
            einer Großlage stehen hier 30–50 Einheiten. Bei ein, zwei Meldungen
            wäre die Leiste nur Beiwerk, daher erst ab drei. */}
        {alleEinheiten.length > 2 && (
          <div className="zeile einheiten-filter">
            <label className="feld">
              Suche
              <input
                type="search"
                value={suche}
                placeholder="Einheit, Organisation, Ort, Zug, Kennzeichen…"
                onChange={(e) => setSuche(e.target.value)}
              />
            </label>
            <label className="feld sortierung">
              Sortierung
              <select
                value={sortierung}
                onChange={(e) => setSortierung(e.target.value as EinheitenSortierung)}
              >
                {SORTIERUNGEN.map((s) => (
                  <option key={s.wert} value={s.wert}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        {alleEinheiten.length === 0 && <p className="hinweis">Noch keine Meldung. Bogen scannen oder manuell erfassen.</p>}
        {alleEinheiten.length > 0 && kopf.length === 0 && (
          <p className="hinweis">
            Keine Einheit passt zu „{suche.trim()}“.{" "}
            <button type="button" className="link" onClick={() => setSuche("")}>Suche löschen</button>
          </p>
        )}
        {kopf.map((e) => (
          <EinheitKarte key={e.einheitSchluessel} einsatzId={einsatz.id} kopf={e} alle={einsatz.eintraege} onGeaendert={onGeaendert} />
        ))}
      </section>

      <footer className="nav">
        <button type="button" className="entfernen" onClick={loeschen}>Einsatz löschen</button>
      </footer>
    </main>
    </>
  );
}

/** Erreichbarkeit einer Person wie im Bogenkopf/PDF ("Mobil: … (D)"). */
function kontaktText(k: Kontakt): string {
  if (k.emailTemplate === 1) return "eMail: Standard (D)";
  const art = k.art === KontaktArt.EMAIL ? "eMail" : k.art === KontaktArt.MOBIL ? "Mobil" : "Tel";
  return `${art}: ${k.wert ?? ""} (${k.dienstlich ? "D" : "P"})`;
}

/**
 * Read-only Vollansicht eines gemeldeten Bogens (Zugehörigkeit, Einsatz,
 * Personal, Fahrzeuge, Sofortbedarf) — spiegelt die Erfassungs-Übersicht bzw.
 * das PDF, aber ohne Bearbeiten-Aktionen: fremde Bögen werden hier nur gelesen.
 */
function BogenDetails({ bogen }: { bogen: Erfassungsbogen }) {
  const org = bogen.einheit.organisation;
  const standort = einheitOrt(bogen.einheit);
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);
  const vp = verpflegung(bogen);
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const sb = bogen.sofortbedarf;

  return (
    <div className="bogen-details">
      <h4>Zugehörigkeit</h4>
      <dl className="paare">
        <dt>Organisation</dt>
        <dd>{orgLabel(org)}{bogen.einheit.organisationName ? ` — ${bogen.einheit.organisationName}` : ""}</dd>
        <dt>Einheitstyp</dt>
        <dd>{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "—"}</dd>
        {bogen.einheit.hierarchie.map((h, i) => (
          <span key={i} style={{ display: "contents" }}>
            <dt>{vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene"}</dt>
            <dd>{h.name}{h.kurz ? ` (${h.kurz})` : ""}{h.telefon ? ` · ${h.telefon}` : ""}{h.email ? ` · ${h.email}` : ""}</dd>
          </span>
        ))}
      </dl>

      <h4>Einsatz / Auftrag</h4>
      <dl className="paare">
        <dt>Zeitraum</dt>
        <dd>{datumDeutsch(datumZuIso(bogen.einsatz.zeitraumVon))} – {datumDeutsch(datumZuIso(bogen.einsatz.zeitraumBis))}</dd>
        <dt>Ort / Auftrag</dt><dd>{bogen.einsatz.ortAuftrag || "—"}</dd>
        <dt>Beginn / Ende</dt>
        <dd>
          {bogen.einsatz.einsatzbeginn != null ? zeitpunktZuIso(bogen.einsatz.einsatzbeginn).replace("T", " ") : "—"}
          {" / "}
          {bogen.einsatz.einsatzende != null ? zeitpunktZuIso(bogen.einsatz.einsatzende).replace("T", " ") : "—"}
        </dd>
      </dl>

      <h4>Personal ({s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt})</h4>
      {nurStaerke && (
        <p className="hinweis">
          Meldekopf-Modus: nur Stärke gemeldet{bogen.personal.length > 0 ? " — unten die Ansprechpartner:innen" : ""}.
        </p>
      )}
      {bogen.personal.length > 0 ? (
        <div className="tabellen-scroll">
          <table className="uebersicht">
            <thead>
              <tr><th>Funktion / Zusatzfunktion</th><th>Name, Vorname</th><th>Erreichbarkeit</th></tr>
            </thead>
            <tbody>
              {bogen.personal.map((p, i) => (
                <tr key={i}>
                  <td>{funktionsText(p, org) || "—"}</td>
                  <td>{p.nachname}{p.nachname && p.vorname ? ", " : ""}{p.vorname}</td>
                  <td>{p.kontakte.map(kontaktText).join(" · ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !nurStaerke && <p className="hinweis">Kein Personal erfasst.</p>
      )}
      <p className="hinweis">Unterbringung: M {mwd.m} / W {mwd.w} / D {mwd.d}</p>

      <h4>Fahrzeuge ({bogen.fahrzeuge.length})</h4>
      {bogen.fahrzeuge.length > 0 ? (
        <div className="tabellen-scroll">
          <table className="uebersicht">
            <thead>
              <tr><th>Typ</th><th>Kennzeichen</th><th>Funkrufname</th><th>StAN</th><th>Änderungen</th></tr>
            </thead>
            <tbody>
              {bogen.fahrzeuge.map((f, i) => (
                <tr key={i}>
                  <td>{vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "—"}</td>
                  <td>{kennzeichenText(f) || "—"}</td>
                  <td>{funkrufText(f, standort) || "—"}</td>
                  <td>{f.stanKonform == null ? "—" : f.stanKonform ? "ja" : "nein"}</td>
                  <td>{f.aenderungen ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="hinweis">Keine Fahrzeuge erfasst.</p>
      )}

      <h4>Sofortbedarf &amp; Sonstiges</h4>
      <dl className="paare">
        <dt>Verpflegung</dt>
        <dd>{sb ? `${sb.verpflegungPersonen} Personen, davon ${vp.vegetarisch} vegetarisch, ${vp.vegan} vegan` : "—"}</dd>
        <dt>Betriebsstoff</dt>
        <dd>{sb ? `${sb.dieselLiter} l Diesel / ${sb.benzinLiter} l Benzin / ${sb.gemischLiter} l Gemisch` : "—"}</dd>
        <dt>Unterbringung / Ruhezeit</dt>
        <dd>{sb ? `${sb.unterbringung ? "Unterbringung" : "keine Unterbringung"} · ${sb.ruhezeitErforderlich ? "Ruhezeit erforderlich" : "keine Ruhezeit"}` : "—"}</dd>
        <dt>Sonstiges</dt><dd>{bogen.sonstiges || "—"}</dd>
      </dl>
    </div>
  );
}

function EinheitKarte(props: {
  einsatzId: string;
  kopf: MeldeEintrag;
  alle: MeldeEintrag[];
  onGeaendert: () => void;
}) {
  const { einsatzId, kopf, alle, onGeaendert } = props;
  const [details, setDetails] = useState(false);
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
    if (window.confirm(`Meldung von „${einheitAnzeigename(kopf.bogen.einheit)}" (Stand ${standText(kopf.bogen)}) entfernen?`)) {
      meldungEntfernen(einsatzId, kopf.id);
      onGeaendert();
    }
  }

  return (
    <div className={`einheit-zeile${abgerueckt ? " gestrichen" : ""}`}>
      <div className="kopfzeile">
        <span className="muster-text">
          <span className="muster-name">
            {einheitAnzeigename(kopf.bogen.einheit)}
            {kopf.zugEtikett ? <span className="zug-badge"> {kopf.zugEtikett}</span> : null}
          </span>
          <span className="muster-sub">
            {orgLabel(kopf.bogen.einheit.organisation)} · Stärke {staerkeText(kopf.bogen)} · Stand {standText(kopf.bogen)} · {QUELLE_LABEL[kopf.quelle]}
            {abgerueckt ? " · abgerückt" : ""}
            {kopf.signatur ? <> · {signaturBadge(kopf)}</> : null}
          </span>
        </span>
      </div>
      <div className="vorlage-aktionen">
        <button type="button" onClick={() => setDetails(!details)}>
          {details ? "Details schließen" : "Details"}
        </button>{" "}
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
      {details && <BogenDetails bogen={kopf.bogen} />}
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
