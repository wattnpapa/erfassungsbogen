/**
 * Inhalte der beiden Fenster zum lokalen Personalstamm (personalstamm.ts):
 *  - EinlesenInhalt: Helferliste aus CSV oder Excel wählen, Spalten zuordnen, Vorschau, ablegen.
 *  - AuswahlInhalt: „Wer ist dabei?" — Suche, Filter nach Teileinheit und Qualifikation, antippen, laufende Stärke.
 *
 * Eigene Datei, die die Startseite und Schritt 3 per `React.lazy` nachladen (personalstamm-fenster.tsx): Dateileser,
 * Spaltenzuordnung und Auswahl gehören nur zu diesen Fenstern und bleiben aus dem Startbündel (ADR-003,
 * Aufnahmeregel 5). Rahmen, Titel und Schließen stehen im Fenster selbst, damit es sofort da ist.
 */
import { useMemo, useState, type ChangeEvent } from "react";
import { OrganisationsTyp, staerke, type Person } from "@bos/eeb-format/model";
import { ORG_OPTIONEN, blobAlsDownload, personUnbenannt, textAlsDatei } from "./hilfen";
import { fehlerText } from "./nachladen";
import { binaerTeilen, istNativ } from "./nativ";
import { namenEinsetzen } from "./personal-schnell";
import { datumZweistellig } from "./papierkorb-frist";
import {
  STAMM_MAX_PERSONEN,
  stammAlterTage,
  stammAnzahlText,
  stammIstAlt,
  stammSpeichern,
  type Personalstamm,
  type StammPerson,
} from "./personalstamm";
import {
  namensSchluessel,
  stammName,
  stammPasst,
  stammPersonAlsPerson,
  stammQualifikationen,
  stammSortiert,
  stammTeileinheiten,
  stammZusatz,
} from "./personalstamm-auswahl";
import {
  MAX_STAMM_DATEI,
  MUSTER_CSV_NAME,
  MUSTER_XLSX_NAME,
  STAMM_DATEI_ARTEN,
  STAMM_FELDER,
  StammImportFehler,
  csvLesen,
  istExcelDatei,
  musterCsv,
  musterXlsx,
  personenAusTabelle,
  stammAbgleich,
  xlsxBlaetter,
  xlsxBlattLesen,
  zuordnungReicht,
  zuordnungVorschlagen,
  type StammFeld,
  type Tabelle,
  type XlsxBlatt,
  type Zuordnung,
} from "./personalstamm-import";
import { NamenText, PersonName, useNamenVerbergen } from "./personen-name";
import { namenMerken } from "./namen-verbergen";

const ROLLE_KURZ = ["H", "UF", "F"] as const; // Index = StaerkeRolle
const ROLLE_KLASSE = ["m", "u", "f"] as const; // Farben der Rollenmarke wie in „Einsatz vorbereiten"

function staerkeText(personal: readonly Pick<Person, "staerkeRolle">[]): string {
  const s = staerke({ personal: personal as Person[] });
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} // ${s.gesamt}`;
}

/** Name aus dem Personalstamm; mit Sichtschutz als Balken, „(ohne Name)“ bleibt lesbar. */
function StammName({ p, className }: { p: StammPerson; className?: string }) {
  const text = stammName(p);
  if (!`${p.vorname}${p.nachname}`.trim()) return <span className={className}>{text}</span>;
  return <PersonName className={className}>{text}</PersonName>;
}

function namenAufzaehlung(personen: readonly StammPerson[], hoechstens = 12): string {
  namenMerken(personen);
  const namen = personen.slice(0, hoechstens).map(stammName).join("; ");
  return personen.length > hoechstens ? `${namen}; … und ${personen.length - hoechstens} weitere` : namen;
}

// ------------------------------------------------------------ Personal einlesen

/** Die gewählte Datei, gelesen: bei Excel mit ihren Tabellenblättern. */
interface Geladen {
  name: string;
  bytes: Uint8Array;
  blaetter: XlsxBlatt[];
}

/** Base64 der Mustervorlage für das Share-Sheet der App (dort gibt es keinen Browser-Download). */
function base64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function EinlesenInhalt({ vorhanden, onFertig }: {
  /** Der abgelegte Stamm, falls es einen gibt — dann zeigt die Vorschau „neu / geändert / entfällt". */
  vorhanden: Personalstamm | null;
  /** Der Stamm ist abgelegt: neuer Stand und ein Satz für die Startseite. */
  onFertig: (stamm: Personalstamm, text: string) => void;
}) {
  const [geladen, setGeladen] = useState<Geladen | null>(null);
  const [blatt, setBlatt] = useState("");
  const [tabelle, setTabelle] = useState<Tabelle | null>(null);
  const [zuordnung, setZuordnung] = useState<Zuordnung>({});
  const [telefon, setTelefon] = useState(true);
  // Geschlecht und Ernährung stehen für Unterbringung und Verpflegung im Bogen, sind im Stamm aber Angaben über
  // Personen, die gar nicht im Einsatz sind. Sie kommen nur auf ausdrücklichen Wunsch mit.
  const [persoenlich, setPersoenlich] = useState(false);
  const [fehler, setFehler] = useState("");

  function tabelleSetzen(t: Tabelle) {
    setTabelle(t);
    setZuordnung(zuordnungVorschlagen(t[0] ?? []));
  }

  async function dateiGewaehlt(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = ""; // dieselbe Datei lässt sich nach einer Korrektur erneut wählen
    if (!datei) return;
    setFehler("");
    setGeladen(null);
    setTabelle(null);
    try {
      if (datei.size > MAX_STAMM_DATEI) {
        throw new StammImportFehler(`Die Datei ist größer als ${MAX_STAMM_DATEI / 1024 / 1024} MB. Eine Helferliste ist deutlich kleiner — bitte nur das Blatt mit der Liste als eigene Datei speichern.`);
      }
      const bytes = new Uint8Array(await datei.arrayBuffer());
      // Excel-Mappe an Endung, Typ oder ZIP-Anfang („PK") erkannt; alles andere wird als CSV gelesen.
      const excel = istExcelDatei(datei) || (bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf);
      if (!excel) {
        const t = csvLesen(bytes);
        if (t.length < 2) throw new StammImportFehler("Die Datei enthält keine Zeilen unter der Kopfzeile. Erwartet wird eine Tabelle: erste Zeile Überschriften, darunter eine Person je Zeile.");
        setGeladen({ name: datei.name, bytes, blaetter: [] });
        tabelleSetzen(t);
        return;
      }
      const blaetter = xlsxBlaetter(bytes);
      // Vorgabe: das erste Blatt, dessen Kopfzeile nach einer Helferliste aussieht (Mappen beginnen gern mit „Hinweise").
      let wahl = blaetter[0]!;
      let wahlTabelle = xlsxBlattLesen(bytes, wahl.pfad);
      if (blaetter.length > 1 && !zuordnungReicht(zuordnungVorschlagen(wahlTabelle[0] ?? []))) {
        for (const b of blaetter.slice(1)) {
          const t = xlsxBlattLesen(bytes, b.pfad);
          if (zuordnungReicht(zuordnungVorschlagen(t[0] ?? []))) {
            wahl = b;
            wahlTabelle = t;
            break;
          }
        }
      }
      setGeladen({ name: datei.name, bytes, blaetter });
      setBlatt(wahl.pfad);
      tabelleSetzen(wahlTabelle);
    } catch (f) {
      setFehler(f instanceof StammImportFehler ? f.message : `Die Datei ließ sich nicht lesen. ${fehlerText(f)}`);
    }
  }

  function blattWechseln(pfad: string) {
    if (!geladen) return;
    setBlatt(pfad);
    setFehler("");
    try {
      tabelleSetzen(xlsxBlattLesen(geladen.bytes, pfad));
    } catch (f) {
      setTabelle(null);
      setFehler(f instanceof StammImportFehler ? f.message : fehlerText(f));
    }
  }

  function feldSetzen(feld: StammFeld, wert: string) {
    setZuordnung((alt) => {
      const neu = { ...alt };
      if (wert === "") delete neu[feld];
      else neu[feld] = Number(wert);
      return neu;
    });
  }

  const kopf = tabelle?.[0] ?? [];
  const spalten = tabelle ? Math.max(...tabelle.slice(0, 50).map((z) => z.length)) : 0;
  const verbergen = useNamenVerbergen();
  const beispiel = (i: number) => tabelle?.slice(1).find((z) => (z[i] ?? "") !== "")?.[i] ?? "";
  const reicht = zuordnungReicht(zuordnung);
  const ergebnis = useMemo(
    () => (tabelle && reicht ? personenAusTabelle(tabelle, zuordnung, { telefon, persoenlich }) : null),
    [tabelle, zuordnung, telefon, persoenlich, reicht],
  );
  const abgleich = useMemo(() => (ergebnis && vorhanden ? stammAbgleich(vorhanden.personen, ergebnis.personen) : null), [ergebnis, vorhanden]);
  const hatPersoenliches = zuordnung.geschlecht != null || zuordnung.ernaehrung != null;

  function uebernehmen() {
    if (!ergebnis || !geladen || ergebnis.personen.length === 0) return;
    const stamm: Personalstamm = { version: 1, importiert: Date.now(), quelle: geladen.name, personen: ergebnis.personen };
    try {
      stammSpeichern(stamm);
    } catch (f) {
      setFehler(`Der Personalstamm ließ sich nicht ablegen. ${fehlerText(f)}`);
      return;
    }
    onFertig(
      stamm,
      abgleich
        ? `Personalstamm neu eingelesen: ${stammAnzahlText(stamm.personen.length)} (${abgleich.neu.length} neu, ${abgleich.geaendert.length} geändert, ${abgleich.entfaellt.length} entfallen).`
        : `Personalstamm eingelesen: ${stammAnzahlText(stamm.personen.length)}. Beim nächsten neuen Bogen fragt die App „Wer ist dabei?“.`,
    );
  }

  async function musterLaden(art: "xlsx" | "csv") {
    setFehler("");
    try {
      if (art === "csv") {
        await textAlsDatei(MUSTER_CSV_NAME, musterCsv(), "text/csv;charset=utf-8");
        return;
      }
      const bytes = musterXlsx();
      if (istNativ()) await binaerTeilen(MUSTER_XLSX_NAME, base64(bytes));
      else blobAlsDownload(MUSTER_XLSX_NAME, new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    } catch (f) {
      setFehler(`Die Mustervorlage ließ sich nicht erzeugen. ${fehlerText(f)}`);
    }
  }

  return (
    <>
      <p className="hinweis">
        Eine Tabelle mit Überschriften in der ersten Zeile und einer Person je Zeile, als Excel-Mappe (.xlsx) oder CSV.
        Pflicht ist nur der Name. Die Liste wird auf diesem Gerät abgelegt und verlässt es nicht: In einen Bogen oder
        QR-Code kommen nur die Personen, die du später auswählst.
      </p>
      <p className="stamm-knoepfe">
        <label className="datei-knopf primaer">
          {geladen ? "Andere Datei wählen…" : "Datei wählen…"}
          <input type="file" accept={STAMM_DATEI_ARTEN} onChange={(e) => void dateiGewaehlt(e)} className="nur-sr" />
        </label>
      </p>
      {!geladen && (
        <p className="hinweis">
          Noch keine passende Liste?{" "}
          <button type="button" className="link" onClick={() => void musterLaden("xlsx")}>Mustervorlage als Excel-Mappe</button>
          {" "}(mit Auswahllisten für Rolle, Fahrerlaubnis, Geschlecht und Ernährung) oder{" "}
          <button type="button" className="link" onClick={() => void musterLaden("csv")}>als CSV</button>. Spalten mit
          anderen Überschriften ordnest du nach dem Wählen der Datei zu.
        </p>
      )}
      {fehler && <p className="warnung" role="alert">{fehler}</p>}

      {geladen && tabelle && (
        <>
          <p role="status">
            <strong>{geladen.name}</strong> — {tabelle.length - 1} {tabelle.length - 1 === 1 ? "Zeile" : "Zeilen"} unter der Kopfzeile.
          </p>
          {geladen.blaetter.length > 1 && (
            <label className="feld">
              Tabellenblatt
              <select value={blatt} onChange={(e) => blattWechseln(e.target.value)}>
                {geladen.blaetter.map((b) => (
                  <option key={b.pfad} value={b.pfad}>{b.name}</option>
                ))}
              </select>
            </label>
          )}

          <h3>Spalten zuordnen</h3>
          <p className="hinweis">
            Vorgeschlagen nach den Überschriften der Datei. Was nicht stimmt, hier ändern; was nicht gebraucht wird, auf
            „nicht einlesen“ stellen.
          </p>
          <div className="stamm-zuordnung">
            {STAMM_FELDER.map(({ feld, titel, hilfe }) => (
              <label className="feld" key={feld}>
                {titel}
                <select value={zuordnung[feld] ?? ""} onChange={(e) => feldSetzen(feld, e.target.value)}>
                  <option value="">— nicht einlesen —</option>
                  {Array.from({ length: spalten }, (_, i) => (
                    <option key={i} value={i}>
                      {kopf[i]?.trim() || `Spalte ${i + 1}`}
                      {/* Die Beispielwerte sind oft Namen; eine Auswahlliste lässt sich nicht verdecken. */}
                      {beispiel(i) && !verbergen ? ` (z. B. ${beispiel(i).slice(0, 24)})` : ""}
                    </option>
                  ))}
                </select>
                {hilfe && <span className="hinweis">{hilfe}</span>}
              </label>
            ))}
          </div>
          {!reicht && (
            <p className="warnung" role="status">
              Noch keine Spalte für den Namen gewählt. Bitte „Nachname“ zuordnen — oder „Name in einer Spalte“, wenn Vor-
              und Nachname zusammenstehen.
            </p>
          )}

          <h3>Was mit eingelesen wird</h3>
          <label className="inline">
            <input type="checkbox" checked={telefon} disabled={zuordnung.mobil == null} onChange={(e) => setTelefon(e.target.checked)} />
            Rufnummern einlesen{zuordnung.mobil == null ? " (keine Spalte zugeordnet)" : ""}
          </label>
          <label className="inline">
            <input type="checkbox" checked={persoenlich && hatPersoenliches} disabled={!hatPersoenliches} onChange={(e) => setPersoenlich(e.target.checked)} />
            Geschlecht und Ernährung einlesen{hatPersoenliches ? "" : " (keine Spalte zugeordnet)"}
          </label>
          <p className="hinweis">
            Geschlecht und Ernährung braucht der Bogen für Unterbringung und Verpflegung. Ohne Haken bleiben sie aus dem
            Stamm und werden wie bisher im Bogen je Person angegeben.
          </p>

          {ergebnis && (
            <>
              <h3>Vorschau</h3>
              <p role="status">
                <strong>{stammAnzahlText(ergebnis.personen.length)}</strong>, Stärke {staerkeText(ergebnis.personen.map((p) => ({ staerkeRolle: p.rolle })))}
                {abgleich && (
                  <>
                    {" "}— gegenüber dem bisherigen Stand: {abgleich.neu.length} neu, {abgleich.geaendert.length} geändert,{" "}
                    {abgleich.entfaellt.length} {abgleich.entfaellt.length === 1 ? "entfällt" : "entfallen"}, {abgleich.unveraendert} unverändert.
                  </>
                )}
              </p>
              {abgleich && abgleich.neu.length > 0 && <p className="hinweis"><strong>Neu:</strong> <NamenText>{namenAufzaehlung(abgleich.neu)}</NamenText></p>}
              {abgleich && abgleich.geaendert.length > 0 && <p className="hinweis"><strong>Geändert:</strong> <NamenText>{namenAufzaehlung(abgleich.geaendert)}</NamenText></p>}
              {abgleich && abgleich.entfaellt.length > 0 && <p className="hinweis"><strong>Entfällt:</strong> <NamenText>{namenAufzaehlung(abgleich.entfaellt)}</NamenText></p>}
              <ul className="namen-vorschau">
                {ergebnis.personen.slice(0, 5).map((p, i) => (
                  <li key={i}>
                    <StammName p={p} /> · <strong>{ROLLE_KURZ[p.rolle]}</strong>
                    {stammZusatz(p) ? ` · ${stammZusatz(p)}` : ""}
                    {p.mobil ? ` · Tel. ${p.mobil}` : ""}
                  </li>
                ))}
                {ergebnis.personen.length > 5 && <li>… und {ergebnis.personen.length - 5} weitere</li>}
              </ul>
              {ergebnis.ohneName > 0 && (
                <p className="hinweis">
                  {ergebnis.ohneName === 1 ? "Eine Zeile ohne Namen wird" : `${ergebnis.ohneName} Zeilen ohne Namen werden`} nicht eingelesen.
                </p>
              )}
              {ergebnis.zuViele > 0 && (
                <p className="warnung" role="status">
                  Die Liste ist länger als {STAMM_MAX_PERSONEN} Personen; {ergebnis.zuViele} weitere Zeilen werden nicht eingelesen.
                </p>
              )}
              {ergebnis.unbekannteKlassen.length > 0 && (
                <p className="warnung" role="status">
                  Diese Angaben zur Fahrerlaubnis sind keine heutige Klasse und werden nicht eingelesen:{" "}
                  {ergebnis.unbekannteKlassen.slice(0, 8).join("; ")}
                  {ergebnis.unbekannteKlassen.length > 8 ? ` … und ${ergebnis.unbekannteKlassen.length - 8} weitere` : ""}. Gelesen werden
                  die Klassen AM bis DE (etwa B, BE, C1, C, CE).
                </p>
              )}
              {ergebnis.personen.length === 0 && <p className="warnung" role="status">Mit dieser Zuordnung ergibt die Datei keine Person.</p>}
              <p className="stamm-knoepfe">
                <button type="button" className="primaer" disabled={ergebnis.personen.length === 0} onClick={uebernehmen}>
                  {vorhanden ? "Stamm ersetzen" : "Als Personalstamm ablegen"} · {stammAnzahlText(ergebnis.personen.length)}
                </button>
              </p>
              {vorhanden && (
                <p className="hinweis">
                  Der bisherige Stand ({stammAnzahlText(vorhanden.personen.length)}, eingelesen am {datumZweistellig(vorhanden.importiert)}) wird
                  durch diese Datei ersetzt. Schon erstellte Bögen und Vorlagen ändern sich dadurch nicht.
                </p>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------ Wer ist dabei?

export function AuswahlInhalt({ stamm, organisation, organisationWaehlbar = false, bestand, okText, onUebernehmen, onOhne }: {
  stamm: Personalstamm;
  /** Organisation des Bogens — bestimmt, wie Funktionen übersetzt werden. */
  organisation: OrganisationsTyp;
  /** Neuer Bogen: Die Organisation steht noch nicht fest und wird hier gewählt (Schritt 1 kann sie weiter ändern). */
  organisationWaehlbar?: boolean;
  /** Die Personen, die schon im Bogen stehen: Sie sind in der Liste als „schon im Bogen" markiert. */
  bestand: Person[];
  /** Beschriftung des Knopfs zur Anzahl der Gewählten und ihrer Stärke. */
  okText: (anzahl: number, staerke: string) => string;
  /** Neue Personenliste des Bogens (Gewählte in freie Sollplätze, sonst angehängt), Quittungstext, Organisation. */
  onUebernehmen: (personal: Person[], text: string, organisation: OrganisationsTyp) => void;
  /** Neuer Bogen: ohne Auswahl weiter. Fehlt = kein solcher Knopf. */
  onOhne?: (organisation: OrganisationsTyp) => void;
}) {
  const personen = useMemo(() => stammSortiert(stamm.personen), [stamm]);
  const teileinheiten = useMemo(() => stammTeileinheiten(personen), [personen]);
  const qualifikationen = useMemo(() => stammQualifikationen(personen), [personen]);
  const [org, setOrg] = useState(organisation);
  const [suche, setSuche] = useState("");
  const [teileinheit, setTeileinheit] = useState("");
  const [qualifikation, setQualifikation] = useState("");
  const [gewaehlt, setGewaehlt] = useState<ReadonlySet<number>>(() => new Set());

  const schonDa = useMemo(() => new Set(bestand.filter((p) => !personUnbenannt(p)).map(namensSchluessel)), [bestand]);
  const imBogen = (p: StammPerson) => schonDa.has(namensSchluessel(p));
  const sichtbar = personen.map((p, i) => ({ p, i })).filter(({ p }) => stammPasst(p, { suche, teileinheit, qualifikation }));
  const waehlbar = sichtbar.filter(({ p }) => !imBogen(p));
  const alleSichtbarenGewaehlt = waehlbar.length > 0 && waehlbar.every(({ i }) => gewaehlt.has(i));
  const gefiltert = suche.trim() !== "" || teileinheit !== "" || qualifikation !== "";
  const auswahl = personen.filter((_, i) => gewaehlt.has(i));
  const staerkeGewaehlt = staerkeText(auswahl.map((p) => ({ staerkeRolle: p.rolle })));

  function umschalten(i: number) {
    setGewaehlt((alt) => {
      const neu = new Set(alt);
      if (neu.has(i)) neu.delete(i);
      else neu.add(i);
      return neu;
    });
  }

  function sichtbareUmschalten() {
    setGewaehlt((alt) => {
      const neu = new Set(alt);
      for (const { i } of waehlbar) {
        if (alleSichtbarenGewaehlt) neu.delete(i);
        else neu.add(i);
      }
      return neu;
    });
  }

  function uebernehmen() {
    if (auswahl.length === 0) return;
    const neue = auswahl.map((p) => stammPersonAlsPerson(p, org));
    const { personal, plaetze } = namenEinsetzen(bestand, neue, personUnbenannt);
    const eingesetzt = plaetze.filter((x) => x != null).length;
    onUebernehmen(
      personal,
      `${stammAnzahlText(neue.length)} aus dem Personalstamm übernommen` + (eingesetzt > 0 ? ` — ${eingesetzt} davon in freie Sollplätze.` : "."),
      org,
    );
  }

  return (
    <>
      {/* Zwei Bereiche: Filter und Liste rollen gemeinsam, Stärke und Knöpfe stehen fest am Fuß. */}
      <div className="stamm-rollt">
      {stammIstAlt(stamm) && (
        <p className="hinweis">
          Der Personalstamm ist {stammAlterTage(stamm)} Tage alt (eingelesen am {datumZweistellig(stamm.importiert)}). Fehlt jemand oder
          stimmt eine Angabe nicht mehr, auf der Startseite neu einlesen.
        </p>
      )}
      {organisationWaehlbar && (
        <label className="feld">
          Organisation des Bogens
          <select value={org} onChange={(e) => setOrg(Number(e.target.value) as OrganisationsTyp)}>
            {ORG_OPTIONEN.map((o) => (
              <option key={o.wert} value={o.wert}>{o.label}</option>
            ))}
          </select>
        </label>
      )}
      <div className="stamm-filter">
        <label className="feld">
          Suche
          <input
            type="search"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Name, Funktion, Qualifikation"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        {teileinheiten.length > 0 && (
          <label className="feld">
            Teileinheit
            <select value={teileinheit} onChange={(e) => setTeileinheit(e.target.value)}>
              <option value="">alle</option>
              {teileinheiten.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}
        {qualifikationen.length > 0 && (
          <label className="feld">
            Qualifikation
            <select value={qualifikation} onChange={(e) => setQualifikation(e.target.value)}>
              <option value="">alle</option>
              {qualifikationen.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="stamm-knoepfe">
        <button type="button" className="muster-umschalter" disabled={waehlbar.length === 0} onClick={sichtbareUmschalten}>
          {alleSichtbarenGewaehlt ? "Angezeigte abwählen" : gefiltert ? `Alle ${waehlbar.length} angezeigten wählen` : "Alle wählen"}
        </button>
      </p>
      <div className="stamm-liste">
        {sichtbar.length === 0 && <p className="hinweis">Niemand im Personalstamm passt zu Suche und Filter.</p>}
        {sichtbar.map(({ p, i }) => {
          const da = imBogen(p);
          return (
            <label key={i} className={`muster-zeile${da ? " stamm-im-bogen" : ""}`}>
              <input type="checkbox" checked={da || gewaehlt.has(i)} disabled={da} onChange={() => umschalten(i)} />
              <span className={`rolle-badge rolle-${ROLLE_KLASSE[p.rolle]}`}>{ROLLE_KURZ[p.rolle]}</span>
              <span className="muster-text">
                <StammName p={p} className="muster-name" />
                <span className="muster-sub">{da ? "schon im Bogen" : stammZusatz(p) || "—"}</span>
              </span>
            </label>
          );
        })}
      </div>
      </div>
      {/* Laufende Stärke der Gewählten, in der Schreibweise des Bogens (F / UF / M // Gesamt). */}
      <p className="stamm-stand" role="status" aria-live="polite">
        <strong>{auswahl.length}</strong> gewählt · Stärke <strong>{staerkeGewaehlt}</strong>
        {gefiltert ? ` · ${sichtbar.length} von ${personen.length} angezeigt` : ""}
      </p>
      <div className="abfrage-aktionen stamm-fuss">
        <button type="button" className="primaer" disabled={auswahl.length === 0} onClick={uebernehmen}>
          {okText(auswahl.length, staerkeGewaehlt)}
        </button>
        {onOhne && (
          <button type="button" onClick={() => onOhne(org)}>
            Ohne Auswahl weiter
          </button>
        )}
      </div>
    </>
  );
}
