# Beispiel-Erfassungsbögen — Katastrophenschutz Niedersachsen

33 generierte Beispiel-Einheiten nach den KatS-StAN NDS (Kommunale
Einheiten des Katastrophenschutzes Niedersachsen, Fassung 2023/2025). Abgebildet
ist je kleinster selbstständiger Teileinheit (Gruppe/Trupp/Staffel/Geräteeinheit)
ein Bogen; Fachzüge und der Sanitäts- und Betreuungszug sind in ihre Teileinheiten
zerlegt.

Alle Personen, Orte und Kennzeichen sind **fiktiv**. Die Funkrufnamen folgen dem
OPTA-Schema Niedersachsen (RdErl. MI v. 01.03.2024, Nds. MBl. 2024 Nr. 125):
„<Rufname> <Landkreis> <örtl./Org.-Kennung>/<Fahrzeugkennung (Anlage 2)>/
<Ordnungskennung>". Die örtlichen Kennungen (Gemeindekennziffern) sind fiktiv,
Fahrzeug- und Organisationskennungen entsprechen dem Erlass. Die Träger (und damit
Organisation und Rufname) sind je Fachdienst realistisch gestreut: Feuerwehr
(Florian), DRK (Rotkreuz), JUH (Akkon), MHD (Johannes), ASB (Sama), DLRG (Pelikan).

Neu erzeugen mit: `npm run beispiele:kats` (deterministisch, fester Zufalls-Seed).

| Datei | Fachdienst | Einheit | Ort | Untere KatS-Behörde | Stärke | Fz | Quelle |
|---|---|---|---|---|---|---|---|
| fuehrungsgruppe-fuegr-winsen-luhe | Führungsdienst | Führungsgruppe (FüGr) | Winsen (Luhe) | Landkreis Harburg | 5/2/2/9 | 3 | KatS-StAN NDS 110/1 |
| zugtrupp-wasserrettung-ztr-wr-nienburg-weser | Führungsdienst | Zugtrupp Wasserrettung (ZTr WR) | Nienburg (Weser) | Landkreis Nienburg | 1/1/2/4 | 1 | KatS-StAN NDS 110/2 |
| melde-und-lotsentrupp-aurich | Führungsdienst | Melde- und Lotsentrupp | Aurich | Landkreis Aurich | 0/0/3/3 | 3 | KatS-StAN NDS 110/3 |
| aufklaerungstrupp-luft-westerstede | Führungsdienst | Aufklärungstrupp Luft | Westerstede | Landkreis Ammerland | 0/1/2/3 | 1 | KatS-StAN NDS 110/4 |
| fachmodul-vegetationsbrandbekaempfung-peine | Brandschutzdienst | Fachmodul Vegetationsbrandbekämpfung | Peine | Landkreis Peine | 0/1/8/9 | 3 | KatS-StAN NDS 010/2 |
| fachmodul-hochleistungsfoerderpumpensystem-hfs-wolfenbuettel | Brandschutzdienst | Fachmodul Hochleistungsförderpumpensystem (HFS) | Wolfenbüttel | Landkreis Wolfenbüttel | 0/1/8/9 | 4 | KatS-StAN NDS 010/3 |
| fachgruppe-versorgung-und-eigenschutz-lueneburg | Feuerwehrbereitschaft | Fachgruppe Versorgung und Eigenschutz | Lüneburg | Landkreis Lüneburg | 0/1/10/11 | 6 | KatS-StAN NDS 011/2 |
| zugtrupp-fachzug-diepholz | Feuerwehrbereitschaft | Zugtrupp (Fachzug) | Diepholz | Landkreis Diepholz | 1/1/2/4 | 1 | KatS-StAN NDS 011/3 |
| loeschgruppe-katastrophenschutz-lg-kats-emden | Feuerwehrbereitschaft | Löschgruppe Katastrophenschutz (LG KatS) | Emden | Stadt Emden | 0/1/8/9 | 1 | KatS-StAN NDS 011/3 |
| staffel-logistik-schlauch-oldenburg-oldb | Feuerwehrbereitschaft | Staffel Logistik Schlauch | Oldenburg (Oldb) | Stadt Oldenburg | 0/1/5/6 | 1 | KatS-StAN NDS 011/3 |
| trupp-technische-hilfe-hildesheim | Feuerwehrbereitschaft | Trupp Technische Hilfe | Hildesheim | Landkreis Hildesheim | 0/1/2/3 | 1 | KatS-StAN NDS 011/4 |
| trupp-vegetationsbrandbekaempfung-hannover | Feuerwehrbereitschaft | Trupp Vegetationsbrandbekämpfung | Hannover | Region Hannover | 0/1/2/3 | 1 | KatS-StAN NDS 011/5 |
| staffel-logistik-wasserentnahme-uelzen | Feuerwehrbereitschaft | Staffel Logistik Wasserentnahme | Uelzen | Landkreis Uelzen | 0/1/5/6 | 1 | KatS-StAN NDS 011/5 |
| trupp-wassertransport-osnabrueck | Feuerwehrbereitschaft | Trupp Wassertransport | Osnabrück | Landkreis Osnabrück | 0/1/2/3 | 1 | KatS-StAN NDS 011/6 |
| zugtrupp-gfff-v-leer | GFFF-V | Zugtrupp GFFF-V | Leer | Landkreis Leer | 1/1/2/4 | 1 | KatS-StAN NDS 012/2 |
| erweiterter-trupp-vegetationsbrandbekaempfung-gfff-v-delmenhorst | GFFF-V | Erweiterter Trupp Vegetationsbrandbekämpfung (GFFF-V) | Delmenhorst | Stadt Delmenhorst | 0/1/3/4 | 1 | KatS-StAN NDS 012/2 |
| staffel-logistik-wasserentnahme-gfff-v-hameln | GFFF-V | Staffel Logistik Wasserentnahme (GFFF-V) | Hameln | Landkreis Hameln-Pyrmont | 0/1/5/6 | 1 | KatS-StAN NDS 012/2 |
| staffel-wasserrettung-wrst-langenhagen | Wasserrettung | Staffel Wasserrettung (WRSt) | Langenhagen | Region Hannover | 0/1/5/6 | 2 | KatS-StAN NDS 025/1 |
| staffel-stroemungsrettung-strrst-celle | Wasserrettung | Staffel Strömungsrettung (StrRSt) | Celle | Landkreis Celle | 0/1/5/6 | 3 | KatS-StAN NDS 025/1 |
| patiententransportstaffel-lingen-ems | Sanitätsdienst | Patiententransportstaffel | Lingen (Ems) | Landkreis Emsland | 0/1/5/6 | 3 | KatS-StAN NDS 040/1 |
| zugtrupp-sanitaets-und-betreuungszug-ztr-sbz-wittmund | Sanitätsdienst | Zugtrupp Sanitäts- und Betreuungszug (ZTr SBZ) | Wittmund | Landkreis Wittmund | 2/0/2/4 | 1 | KatS-StAN NDS 041 |
| sanitaetsgruppe-sangr-cloppenburg | Sanitätsdienst | Sanitätsgruppe (SanGr) | Cloppenburg | Landkreis Cloppenburg | 1/1/7/9 | 2 | KatS-StAN NDS 041 |
| betreuungsgruppe-btgr-holzminden | Sanitätsdienst | Betreuungsgruppe (BTGr) | Holzminden | Landkreis Holzminden | 0/1/8/9 | 3 | KatS-StAN NDS 041 |
| staffel-psychosoziale-notfallversorgung-psnv-cuxhaven | Sanitätsdienst | Staffel Psychosoziale Notfallversorgung (PSNV) | Cuxhaven | Landkreis Cuxhaven | 0/1/4/5 | 1 | KatS-StAN NDS 049/1 |
| verpflegungsgruppe-soltau | Betreuungsdienst | Verpflegungsgruppe | Soltau | Heidekreis | 0/1/8/9 | 4 | KatS-StAN NDS 060/1 |
| registrierungsstaffel-meppen | Betreuungsdienst | Registrierungsstaffel | Meppen | Landkreis Emsland | 0/1/5/6 | 1 | KatS-StAN NDS 060/2 |
| betreuungstransport-und-leitstaffel-jever | Betreuungsdienst | Betreuungstransport- und -leitstaffel | Jever | Landkreis Friesland | 0/1/5/6 | 2 | KatS-StAN NDS 060/3 |
| transporttrupp-bus-50-vechta | Betreuungsdienst | Transporttrupp Bus 50 | Vechta | Landkreis Vechta | 0/0/3/3 | 2 | KatS-StAN NDS 060/4 |
| logistik-und-technikgruppe-northeim | Logistik- und Versorgungsdienst | Logistik- und Technikgruppe | Northeim | Landkreis Northeim | 0/1/8/9 | 6 | KatS-StAN NDS 090/1 |
| energieversorgungsgruppe-stade | Logistik- und Versorgungsdienst | Energieversorgungsgruppe | Stade | Landkreis Stade | 0/1/8/9 | 2 | KatS-StAN NDS 090/2 |
| logistiktrupp-schwer-verden-aller | Logistik- und Versorgungsdienst | Logistiktrupp schwer | Verden (Aller) | Landkreis Verden | 0/1/2/3 | 5 | KatS-StAN NDS 090/3 |
| geraeteeinheit-sandsackfuellmaschine-papenburg | Geräteeinheiten Hochwasserschutz | Geräteeinheit Sandsackfüllmaschine | Papenburg | Landkreis Emsland | 0/1/8/9 | 3 | KatS-StAN NDS 120/1 |
| geraeteeinheit-mobiles-hochwasserschutzsystem-wilhelmshaven | Geräteeinheiten Hochwasserschutz | Geräteeinheit mobiles Hochwasserschutzsystem | Wilhelmshaven | Stadt Wilhelmshaven | 0/1/2/3 | 2 | KatS-StAN NDS 120/2 |
