# Beispiel-Erfassungsbögen — Katastrophenschutz Mecklenburg-Vorpommern

28 generierte Beispiel-Teileinheiten nach den **„Festlegungen zu den
Grundstrukturen im Katastrophenschutz Mecklenburg-Vorpommern"** — Erlass des
Landesamtes für zentrale Aufgaben und Technik der Polizei, Brand- und
Katastrophenschutz Mecklenburg-Vorpommern (LPBK M-V, Az. 300 - 233.0) vom
15. März 2020, ergangen nach § 5 Absatz 4 LKatSG M-V.

Alle Personen, Orte-Zuordnungen und Kennzeichen sind **fiktiv**.

## Warum ein Bogen je Teileinheit — wie Niedersachsen, anders als Brandenburg

Der Erlass beschreibt für jede der elf Katastrophenschutzeinheiten (KSE) eine
taktische Gliederung mit **Personalstärke UND Fahrzeugtyp je kleinster
Teileinheit** (Trupp/Gruppe/Staffel) — anders als die Brandenburger KatSV, die
nur eine Mindeststärke und eine Kfz-Anzahl je GANZER Einheit nennt (siehe
`examples/katastrophenschutz/brandenburg/`), aber wie die KatS-StAN
Niedersachsen. Deshalb ist hier — wie bei Niedersachsen — je kleinster
selbstständiger Teileinheit ein Bogen erzeugt, nicht ein Bogen je Zug/Gruppe
insgesamt.

Enthält ein Zug mehrere **baugleiche** Teileinheiten (z. B. LGr1/LGr2 des
Erweiterten Löschzugs, SanGr1/SanGr2 des Sanitätszugs, die beiden
Betreuungstrupps der zwei Betreuungsgruppen, WGfGr1/WGfGr2 des
Wassergefahrenzugs), steht hier nur EIN repräsentativer Bogen statt mehrerer
inhaltsgleicher. Der Zugtrupp (ZTr) ist dagegen je Zug ein eigener Bogen, weil
er dort jeweils die Führung genau dieses Zuges stellt.

Die **Medical Task Force** (Erlass Nr. 4.11) ist absichtlich **nicht**
abgebildet: Der Erlass nennt für ihre Teileinheiten keine Personalstärken
(nur „Verband der Größe II"), das bundeseinheitliche Ausstattungskonzept liegt
beim Bund. Eine erfundene Stärke wäre hier keine belastbare Beispielangabe.

## Funkrufnamen

Für Mecklenburg-Vorpommern konnte trotz gezielter Suche **kein öffentlich
zugänglicher landeseigener OPTA-/Funkrufnamen-Kennzahlenkatalog** (Fahrzeug-
oder Ortskennziffern, wie ihn Niedersachsen mit der OPTA-RdErl. oder
Brandenburg mit dem Katalog „Funkkennziffern Feuerwehr & Rettungsdienst" hat)
verifiziert werden. Verwendet werden deshalb nur die **bundesweit
einheitlichen Kennwörter** je Trägerorganisation (Florian, Rotkreuz, Akkon,
Johannes, Sama, Pelikan — Vokabular `FUNKRUF_KENNWOERTER`, bereits im
Projekt vorhanden). Die numerische Kennzahl jedes Fahrzeugs ist eine rein
**fortlaufende, ausdrücklich fiktive Ordnungsnummer je Landkreis** — keine
amtliche Fahrzeug- oder Ortskennung. Derselbe Hinweis steht im Feld
„Sonstiges" jedes einzelnen Bogens. Der PSNV-Trupp Einsatzkräfte (PSNV-E-Tr)
führt laut Erlass kein eigenes Fahrzeug (er nutzt im Einsatzfall den
MTW-PSNV des PSNV-Trupp Betroffene) und hat deshalb keinen Funkrufnamen.

## Träger

Getragen werden die KSE laut Erlass Nr. 2 von den öffentlichen Feuerwehren,
ASB, DLRG, DRK, JUH und MHD. Der Erlass regelt keine feste Zuordnung Fachdienst
→ Organisation; die Verteilung hier ist beispielhaft gewählt und über die acht
unteren Katastrophenschutzbehörden (HRO, LRO, LUP, MSE, NWM, SN, VG, VR aus
Tabelle 1 des Erlasses) gestreut.

Neu erzeugen mit: `npm run beispiele:kats-mv` (deterministisch, fester
Zufalls-Seed).

| Datei | KSE | Teileinheit | Ort | Untere KatS-Behörde | Stärke | Fahrzeuge | Quelle |
|---|---|---|---|---|---|---|---|
| fuehrungstrupp-fuetr-rostock | Führungsunterstützungsgruppe (FüUstgGr) — 4/1/2/7 | Führungstrupp (FüTr) | Rostock | Hanse- und Universitätsstadt Rostock | 4/0/0/4 | 1 | Erlass Nr. 4.2.1, Abb. 1 |
| fuehrungsunterstuetzungstrupp-fueustgtr-bad-doberan | Führungsunterstützungsgruppe (FüUstgGr) — 4/1/2/7 | Führungsunterstützungstrupp (FüUstgTr) | Bad Doberan | Landkreis Rostock | 0/1/2/3 | 1 | Erlass Nr. 4.2.1, Abb. 1 |
| erkundungstrupp-luft-erktr-l-guestrow | Erkundungstrupp Luft (ErkTr-L) — 0/1/2/3 | Erkundungstrupp Luft (ErkTr-L) | Güstrow | Landkreis Rostock | 0/1/2/3 | 1 | Erlass Nr. 4.2.2, Abb. 2 |
| zugtrupp-ztr-ludwigslust | Erweiterter Löschzug (ELZ) — 1/4/20/25 | Zugtrupp (ZTr) | Ludwigslust | Landkreis Ludwigslust-Parchim | 1/1/2/4 | 1 | Erlass Nr. 4.3, Abb. 3 |
| loeschgruppe-lgr1-lgr2-parchim | Erweiterter Löschzug (ELZ) — 1/4/20/25 | Löschgruppe (LGr1/LGr2) | Parchim | Landkreis Ludwigslust-Parchim | 0/1/8/9 | 1 | Erlass Nr. 4.3, Abb. 3 |
| wasserfoerdertrupp-wftr-hagenow | Erweiterter Löschzug (ELZ) — 1/4/20/25 | Wasserfördertrupp (WfTr) | Hagenow | Landkreis Ludwigslust-Parchim | 0/1/2/3 | 1 | Erlass Nr. 4.3, Abb. 3 |
| zugtrupp-ztr-neubrandenburg | Sanitätszug (SanZ) — 3/4/19/26 | Zugtrupp (ZTr) | Neubrandenburg | Landkreis Mecklenburgische Seenplatte | 1/1/2/4 | 1 | Erlass Nr. 4.4, Abb. 4 |
| sanitaetsgruppe-sangr1-sangr2-waren-mueritz | Sanitätszug (SanZ) — 3/4/19/26 | Sanitätsgruppe (SanGr1/SanGr2) | Waren (Müritz) | Landkreis Mecklenburgische Seenplatte | 1/1/4/6 | 1 | Erlass Nr. 4.4, Abb. 4 |
| patiententransportgruppe-ptgr-5-patiententransporttrupps-neustrelitz | Sanitätszug (SanZ) — 3/4/19/26 | Patiententransportgruppe (PtGr, 5 Patiententransporttrupps) | Neustrelitz | Landkreis Mecklenburgische Seenplatte | 0/1/9/10 | 5 | Erlass Nr. 4.4, Abb. 4 |
| logistiktrupp-1-logtr1-grevesmuehlen | Logistikgruppe (LogGr) — 0/2/4/6 | Logistiktrupp 1 (LogTr1) | Grevesmühlen | Landkreis Nordwestmecklenburg | 0/1/2/3 | 2 | Erlass Nr. 4.5, Abb. 5 |
| logistiktrupp-2-logtr2-wismar | Logistikgruppe (LogGr) — 0/2/4/6 | Logistiktrupp 2 (LogTr2) | Wismar | Landkreis Nordwestmecklenburg | 0/1/2/3 | 4 | Erlass Nr. 4.5, Abb. 5 |
| psnv-trupp-betroffene-psnv-b-tr-schwerin | PSNV-Trupp Betroffene (PSNV-B-Tr) — 0/1/3/4 | PSNV-Trupp Betroffene (PSNV-B-Tr) | Schwerin | Landeshauptstadt Schwerin | 0/1/3/4 | 1 | Erlass Nr. 4.6.1, Abb. 6 |
| psnv-trupp-einsatzkraefte-psnv-e-tr-greifswald | PSNV-Trupp Einsatzkräfte (PSNV-E-Tr) — 0/1/3/4 | PSNV-Trupp Einsatzkräfte (PSNV-E-Tr) | Greifswald | Landkreis Vorpommern-Greifswald | 0/1/3/4 | 0 | Erlass Nr. 4.6.2, Abb. 7 |
| zugtrupp-ztr-anklam | Betreuungszug (BtZ) — 1/7/23/31 | Zugtrupp (ZTr) | Anklam | Landkreis Vorpommern-Greifswald | 1/1/2/4 | 1 | Erlass Nr. 4.7, Abb. 8 |
| betreuungstrupp-bttr-je-betreuungsgruppe-ueckermuende | Betreuungszug (BtZ) — 1/7/23/31 | Betreuungstrupp (BtTr, je Betreuungsgruppe) | Ueckermünde | Landkreis Vorpommern-Greifswald | 0/1/5/6 | 1 | Erlass Nr. 4.7, Abb. 8 |
| betreuungstrupp-100-bttr100-in-btgr1-stralsund | Betreuungszug (BtZ) — 1/7/23/31 | Betreuungstrupp 100 (BtTr100, in BtGr1) | Stralsund | Landkreis Vorpommern-Rügen | 0/1/3/4 | 1 | Erlass Nr. 4.7, Abb. 8 |
| betreuungstrupp-30-bttr30-in-btgr2-ribnitz-damgarten | Betreuungszug (BtZ) — 1/7/23/31 | Betreuungstrupp 30 (BtTr30, in BtGr2) | Ribnitz-Damgarten | Landkreis Vorpommern-Rügen | 0/1/3/4 | 2 | Erlass Nr. 4.7, Abb. 8 |
| verpflegungstrupp-vtr-bergen-auf-ruegen | Betreuungszug (BtZ) — 1/7/23/31 | Verpflegungstrupp (VTr) | Bergen auf Rügen | Landkreis Vorpommern-Rügen | 0/1/2/3 | 2 | Erlass Nr. 4.7, Abb. 8 |
| verpflegungstransporttrupp-vttr-rostock | Betreuungszug (BtZ) — 1/7/23/31 | Verpflegungstransporttrupp (VtTr) | Rostock | Hanse- und Universitätsstadt Rostock | 0/1/3/4 | 2 | Erlass Nr. 4.7, Abb. 8 |
| zugtrupp-ztr-bad-doberan | CBRN-Zug (CBRN-Z) — 1/5/18/24 | Zugtrupp (ZTr) | Bad Doberan | Landkreis Rostock | 1/1/2/4 | 1 | Erlass Nr. 4.8, Abb. 9 |
| cbrn-unterstuetzungsgruppe-cbrn-ustggr-guestrow | CBRN-Zug (CBRN-Z) — 1/5/18/24 | CBRN-Unterstützungsgruppe (CBRN-UstgGr) | Güstrow | Landkreis Rostock | 0/1/7/8 | 1 | Erlass Nr. 4.8, Abb. 9 |
| dekontaminationsstaffel-dekonst-ludwigslust | CBRN-Zug (CBRN-Z) — 1/5/18/24 | Dekontaminationsstaffel (DekonSt) | Ludwigslust | Landkreis Ludwigslust-Parchim | 0/1/5/6 | 2 | Erlass Nr. 4.8, Abb. 9 |
| gefahrguttrupp-gfgtr-parchim | CBRN-Zug (CBRN-Z) — 1/5/18/24 | Gefahrguttrupp (GfGTr) | Parchim | Landkreis Ludwigslust-Parchim | 0/1/1/2 | 1 | Erlass Nr. 4.8, Abb. 9 |
| messtrupp-mtr-hagenow | CBRN-Zug (CBRN-Z) — 1/5/18/24 | Messtrupp (MTr) | Hagenow | Landkreis Ludwigslust-Parchim | 0/1/3/4 | 1 | Erlass Nr. 4.8, Abb. 9 |
| zugtrupp-ztr-neubrandenburg | Wassergefahrenzug (WGfZ) — 1/4/14/19 | Zugtrupp (ZTr) | Neubrandenburg | Landkreis Mecklenburgische Seenplatte | 1/1/2/4 | 1 | Erlass Nr. 4.9, Abb. 10 |
| wassergefahrengruppe-wgfgr1-wgfgr2-waren-mueritz | Wassergefahrenzug (WGfZ) — 1/4/14/19 | Wassergefahrengruppe (WGfGr1/WGfGr2) | Waren (Müritz) | Landkreis Mecklenburgische Seenplatte | 0/1/4/5 | 2 | Erlass Nr. 4.9, Abb. 10 |
| wassergefahrengruppe-schwer-wgfgr3-s-neustrelitz | Wassergefahrenzug (WGfZ) — 1/4/14/19 | Wassergefahrengruppe schwer (WGfGr3(s)) | Neustrelitz | Landkreis Mecklenburgische Seenplatte | 0/1/4/5 | 2 | Erlass Nr. 4.9, Abb. 10 |
| registrierungseinheit-rege-grevesmuehlen | Registrierungseinheit (RegE) — 0/1/5/6 | Registrierungseinheit (RegE) | Grevesmühlen | Landkreis Nordwestmecklenburg | 0/1/5/6 | 1 | Erlass Nr. 4.10, Abb. 11 |
