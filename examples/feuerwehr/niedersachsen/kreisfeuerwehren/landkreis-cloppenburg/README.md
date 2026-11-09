# Beispiel-Erfassungsbögen — Kreisfeuerwehr Landkreis Cloppenburg

6 Bögen für Kreiseinheiten der Kreisfeuerwehr Landkreis Cloppenburg. Eine
Einheit aus mehreren Teileinheiten hat einen eigenen Ordner mit einem Bogen je
Teileinheit; eine Einheit, die als Ganzes ausrückt, ist ein einzelner Bogen.

Quellen (abgerufen am 09.11.2026):

- https://www.kreisfeuerwehrverband-cloppenburg.de/kreisbereitschaft/

Die Seite nennt je Fahrzeug Funkrufname, Ortsfeuerwehr und Stärke in der Form „Mannschaft / Führung“ (8 / 1 = Gruppe). Diese Stärken sind übernommen. Zugführung und Stellvertretung kommen aus den Ortsfeuerwehren, die die Seite nennt.

Der 5. Zug (Verpflegung) wird bei Bedarf vom DRK gestellt; die Seite nennt dafür nur Kennzeichen, Funkkennung und Stärke, keinen Fahrzeugtyp und keine Zugführung. Er steht deshalb mit „Fahrzeug DRK“ da, die erste Kraft des ersten Fahrzeugs führt.

Alle Personen sind fiktiv, auch die auf den Seiten namentlich genannten
Führungskräfte; ebenso Kennzeichen und Einsatzaufträge. Jede Person trägt ihre
Ortsfeuerwehr als Dienststelle, die Funktion nennt das Fahrzeug. Gemeinsame
Regeln aller Landkreise: [../README.md](../README.md).

Neu erzeugen mit: `npm run beispiele:kreisfeuerwehr-nds`

## Kreisfeuerwehrbereitschaft Cloppenburg

6 Bögen, zusammen 7/28/124/159.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb/01-fuehrungsstaffel | Führungsstaffel | 2/0/8/10 | ELW 1 Lindern, ELW 2 LK |
| kfb/02-1-zug-wasserfoerderung | 1. Zug Wasserförderung | 1/7/38/46 | ELW 1 Löningen, SW 2000 Löningen, LF 10 Bevern, LF 20/40 Cappeln, MTW Elsten, GW-L2 Essen, LF KatS Schwichteler |
| kfb/03-2-zug-wassertransport | 2. Zug Wassertransport | 1/6/18/25 | ELW 1 Lastrup, TLF 16/25 Lastrup, TLF 20/40 SL Lindern, TLF 16/24 Peheim, TLF 16/25 Molbergen, TLF 16/24 Markhausen |
| kfb/04-3-zug-wald-und-flaechenbrand | 3. Zug Wald und Flächenbrand | 1/8/30/39 | ELW 1 Friesoythe, TLF 4000 Barßel, GW-L2 Ramsloh, MZF Ramsloh, SW 2000 Gehlenberg, TLF 4000 Bösel, LF 8/6 Altenoythe, WLF-K Scharrel |
| kfb/05-4-zug-technische-hilfe | 4. Zug Technische Hilfe | 1/5/28/34 | ELW 1 Cloppenburg, LF 16/12 Emstek, LF 16 Garrel, RW 2 Cloppenburg, LF-L Cloppenburg |
| kfb/06-5-zug-verpflegung | 5. Zug Verpflegung | 1/2/2/5 | Fahrzeug DRK DRK Molbergen, Fahrzeug DRK DRK Bösel |
