# TTRPG Sheet Kit

*[Read in English](README.md)*

Tieni la scheda del tuo personaggio di gioco di ruolo in Obsidian e aggiornala con un clic.

TTRPG Sheet Kit trasforma piccoli blocchi YAML in **contatori con bottoni −/+** e
**tracce di caselle**, e aggiunge un **callout a colonne** per impaginare il resto della scheda.
Ogni clic riscrive il nuovo valore nella nota come testo semplice: la scheda resta
leggibile, ricercabile e sincronizzata come qualsiasi altra nota.

Funziona con qualsiasi sistema: D&D, Fate, Pathfinder, Blades in the Dark o il tuo homebrew.

**[Scaricalo dai plugin della community di Obsidian](https://community.obsidian.md/plugins/ttrpg-sheet-kit)**

<p align="center">
  <img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plugin-00-overview.png" alt="Una scheda con caratteristiche, barra dei punti ferita, tracce di caselle, condizioni ed elenco di incantesimi su colonne" width="560">
</p>

*Più sotto trovi il [confronto prima e dopo](#prima-e-dopo).*

## Funzionalità

- **Contatori** con bottoni −/+, minimo e massimo facoltativi, passo personalizzato (Shift+clic = ×5).
- **Tracce di caselle** per stress, slot incantesimo, usi giornalieri, slot dello zaino.
- **Barre** per punti ferita, esperienza o reputazione, che cambiano colore quando calano.
- **Layout verticale o orizzontale**, con modificatore D&D facoltativo (14 → +2).
- **Gruppi**: più gruppi con titolo nello stesso blocco.
- **Callout a colonne** per mettere elenchi e testo (anche note incorporate) su due o tre colonne.
- **Comandi di inserimento**: scegli un blocco pronto dalla palette dei comandi o dal clic destro, senza ricordare la sintassi.
- Funziona in **modalità Lettura e Live Preview**, su desktop e mobile.
- **Scrivi un valore** direttamente: `25`, `+8` (cura), `-17` (danno).
- **Reset** per riposi, sessioni, scene o qualunque momento usi il tuo gioco, con i nomi che scegli tu: un comando riporta tutti i contatori al punto di partenza.
- **Annulla** l'ultima modifica, anche un intero reset.
- **Condizioni** e altre etichette on/off (Avvelenato, Prono, Concentrazione…) da attivare con un clic.
- Cambia solo il numero modificato: formattazione e commenti dello YAML restano intatti.
- Interfaccia in italiano e inglese (segue la lingua di Obsidian).

## Installazione

**Dai plugin della community** (consigliato): in Obsidian vai in Impostazioni → Plugin della community → Sfoglia,
cerca "TTRPG Sheet Kit", poi clicca Installa e Attiva.
Puoi anche installarlo dalla sua pagina sul [sito della community di Obsidian](https://community.obsidian.md/plugins/ttrpg-sheet-kit).

**Con BRAT** (per provare le versioni in anteprima): aggiungi `progressify/ttrpg-sheet-kit` nel plugin [BRAT](https://github.com/TfTHacker/obsidian42-brat).

**A mano**: scarica `main.js`, `manifest.json` e `styles.css` dall'[ultima release](https://github.com/progressify/ttrpg-sheet-kit/releases)
in `<vault>/.obsidian/plugins/ttrpg-sheet-kit/`, poi attiva il plugin in
Impostazioni → Plugin della community.

## Per iniziare

1. Apri una nota ed esegui **TTRPG Sheet Kit: Inserisci blocco…** dalla palette dei comandi (Cmd/Ctrl+P),
   oppure fai clic destro nell'editor e scegli **Inserisci blocco TTRPG Sheet Kit…**.
2. Scegli un modello, per esempio *Caratteristiche D&D*.
3. Clicca −/+ per cambiare i valori.

Ogni modello ha anche il suo comando (`TTRPG Sheet Kit: Inserisci: …`), a cui puoi assegnare
una scorciatoia in Impostazioni → Tasti di scelta rapida.

## Contatori

### Forma breve

````markdown
```ttrpgsk-counters
oro: 7
frecce: 18
punti_fato: 2/3        # valore/massimo
```
````

### Forma estesa

````markdown
```ttrpgsk-counters
platino_nero: { label: "Platino (impero nero)", value: 6 }
pf:
  label: Punti ferita
  value: 24
  max: 30
stress: { type: track, max: 3, value: 1 }
```
````

| Campo   | Significato                                                | Default   |
| ------- | ---------------------------------------------------------- | --------- |
| `label` | nome mostrato (anche `name`)                               | la chiave |
| `value` | valore attuale, anche nella forma `2/3`                    | 0         |
| `max`   | massimo                                                    | nessuno   |
| `min`   | minimo (`null` = nessun minimo)                            | 0         |
| `step`  | di quanto cambia a ogni clic (Shift+clic = × 5)            | 1         |
| `type`  | `number`, `track` per le caselle (serve `max`), `bar` (vedi [Barre](#barre-bar)) oppure `tags` (vedi [Condizioni](#condizioni-tags)) | `number`  |
| `mod`   | mostra il modificatore D&D, es. 14 → (+2)                  | `false`   |
| `reset` | `{ on: <momento> \| [<momenti>], to: max \| min \| <numero> }`; i momenti sono nomi scelti da te, vedi [Reset](#reset) | nessuno |

In una traccia, cliccare una casella riempie la traccia fino a quella; cliccare l'ultima piena la svuota.

### Barre (bar)

Un contatore `bar` mostra il valore come una barra colorata, con −/+ accanto all'etichetta. Richiede un `max`.

````markdown
```ttrpgsk-counters
pf:
  label: Punti ferita
  type: bar
  value: 24/30
  colors: { 50%: yellow, 25%: red }   # facoltativo: colore in base alla soglia
  reset: { on: long, to: max }
pe: { label: Esperienza, type: bar, value: 300/900, step: 50, color: green }
```
````

- Clicca la barra per scrivere un valore (`25`, `+8`, `-17`), come per gli altri contatori. Reset e annulla funzionano come sempre.
- `color` è il colore di base (predefinito: l'accento del tema).
- `colors` elenca le soglie: la barra prende il colore della **soglia più bassa a cui il valore è pari o inferiore**.
  Qui sopra, 15/30 PF è gialla e 7/30 è rossa. Le soglie sono una percentuale (`25%`) o un numero (`10`).
- Colori: `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink` (seguono il tema) oppure un codice tra virgolette come `"#c33"` (senza virgolette, `#` inizia un commento).

Il modello **Barre (PF, PE)** (**Inserisci blocco…**) aggiunge entrambi gli esempi.

### Condizioni (tags)

Un contatore `tags` è un insieme di etichette da accendere e spegnere con un clic: condizioni, stati,
effetti di incantesimi. `options` elenca le etichette, `value` quelle attive.

````markdown
```ttrpgsk-counters
condizioni:
  label: Condizioni
  type: tags
  options: [Accecato, Affascinato, Spaventato, Avvelenato, Prono, Trattenuto]
  value: [Avvelenato]
  reset: { on: long, to: none }   # facoltativo: le toglie tutte con Reset…
  descriptions:                   # facoltativo: una breve regola per etichetta
    Avvelenato: Svantaggio ai tiri per colpire e alle prove di caratteristica.
    Prono: Può solo strisciare; i suoi attacchi hanno svantaggio.
```
````

<p>
  <img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plugin-05-conditions.png" alt="Condizioni mostrate come etichette, con Concentrating attiva e un bottone +" width="543">
</p>

- Clicca un'etichetta per accenderla (piena) o spegnerla.
- Clicca **＋** per scrivere una nuova etichetta (es. *Velocizzato*): viene aggiunta a `options` e accesa.
- Anche qui funziona `reset`: `to: none` le spegne tutte, `to: [Concentrazione]` lascia accese solo quelle indicate.
- Le modifiche si possono annullare come le altre.
- `descriptions` (facoltativo) dà a un'etichetta un breve testo: **passaci sopra** per leggerlo, oppure su mobile
  **tienila premuta** per mostrarlo sotto le etichette (tocca il testo per nasconderlo). Le etichette con una
  descrizione sono sottolineate a puntini. Scrivi una riga `Etichetta: testo` per ciascuna; metti tra virgolette
  le etichette che contengono `:` (`"Maledizione: Hex": …`).
- Scrivi `options` e `value` **tra parentesi quadre** (`[a, b]`): le liste scritte a righe con `- voce`
  vengono mostrate ma non sono cliccabili, e un avviso spiega perché.

Il modello **Condizioni D&D** (**Inserisci blocco…**) aggiunge le 15 condizioni ufficiali con una breve descrizione di ciascuna, in italiano o in inglese.

### Scrivere un valore

Clicca il numero di un contatore per scrivere un valore, poi premi **Invio** (**Esc** o un clic fuori annulla):

| Scrivi | Risultato |
| ------ | --------- |
| `25`   | il valore diventa 25 |
| `+8`   | aggiunge 8 (cura) |
| `-17`  | toglie 17 (danno) |
| `=-2`  | imposta un valore negativo (serve `min: null`) |

Minimo e massimo sono sempre rispettati. Qualsiasi altra cosa viene rifiutata e il campo diventa rosso.

### Reset

Aggiungi `reset` a un contatore per riportarlo a un punto di partenza alla fine di un riposo, di una sessione, di un giorno…

````markdown
```ttrpgsk-counters
pf:     { value: 37, max: 44, reset: { on: long, to: max } }
slot_1: { type: track, max: 4, value: 3, reset: { on: long, to: min } }
recupero: { type: track, max: 1, value: 1, reset: { on: short, to: min } }
fato:   { value: 1, reset: { on: session, to: 3 } }
grinta: { value: 2, reset: { on: [scena, episodio, stagione], to: 0 } }
```
````

- `on` è il momento, e **il nome lo scegli tu**: non ce ne sono di predefiniti. Usa le parole del tuo gioco,
  anche in italiano: `sessione`, `scena`, `episodio`, `alba`… I nomi in questa pagina sono solo esempi.
  **Reset…** elenca esattamente i nomi usati nella nota aperta.
- Gli unici nomi con un significato speciale sono `short` e `long`, per i riposi in stile D&D:
  **`long` ripristina anche ciò che si ripristina con `short`.** Gli altri nomi non si ripristinano mai a vicenda
  (con `breve` e `lungo` in italiano questa regola non vale).
- Un contatore può rispondere a più momenti: elencali tra parentesi quadre, `on: [scena, episodio, stagione]`.
  Torna allo stesso `to` qualunque di questi tu scelga.
- `to` è il valore a cui tornare: `max`, `min` o un numero. Servono entrambi;
  se ne manca uno, sotto il contatore compare un avviso.
- I contatori con reset mostrano un piccolo **↺** accanto al nome (passaci sopra per vedere quando e dove si ripristinano).

Esegui **TTRPG Sheet Kit: Reset…** dalla palette dei comandi e scegli il momento: tutti i contatori della
nota aperta con quel reset tornano insieme al punto di partenza. Il comando compare solo nelle note che usano
`reset`. Un avviso elenca cosa è cambiato, con il bottone **Annulla**.

### Annulla

**TTRPG Sheet Kit: Annulla ultima modifica** ripristina l'ultima modifica fatta dal plugin nella nota aperta:
un clic, un valore scritto o un intero reset. Puoi assegnargli una scorciatoia. Non sovrascrive i valori che
nel frattempo hai cambiato a mano. La cronologia resta in memoria e si azzera quando chiudi Obsidian.

### Opzioni del blocco

| Opzione  | Valori                                                        |
| -------- | ------------------------------------------------------------- |
| `label`  | titolo del blocco                                             |
| `layout` | `vertical` (default) oppure `horizontal` (anche `verticale`/`orizzontale`) |
| `mod`    | `true` per mostrare il modificatore su tutti i contatori      |

`label`, `name`, `layout` e `mod` sono riservate: non usarle come nomi di contatori.

````markdown
```ttrpgsk-counters
layout: horizontal
mod: true
FOR: 10
DES: 14
COS: 12
INT: 8
SAG: 13
CAR: 16
```
````

Nel layout orizzontale, se la pagina è stretta i contatori vanno a capo.

### Più gruppi in un blocco

Ogni gruppo ha le sue opzioni e i contatori sotto `items:`.

````markdown
```ttrpgsk-counters
soldi:
  label: Soldi
  layout: horizontal
  items:
    platino: 0
    oro: 12
    argento: 30
stats:
  label: Statistiche
  mod: true
  items:
    for: { label: FOR, value: 10 }
    int:
      label: INTELLIGENZA
      value: 13
```
````

## Callout a colonne

Metti qualsiasi Markdown (elenchi, testo, link, blocchi `ttrpgsk-counters`) su più colonne:

```markdown
> [!ttrpgsk-columns] Incantesimi
> - Palla di fuoco
> - Dardo incantato
> - Scudo
> - Invisibilità
```

- `> [!ttrpgsk-columns|3]` tre colonne
- `> [!ttrpgsk-columns|plain]` senza bordo né titolo
- `> [!ttrpgsk-columns|3 plain]` entrambe le cose

Funziona anche con una nota incorporata, il cui contenuto viene diviso tra le colonne:

```markdown
> [!ttrpgsk-columns|plain]
> ![[incantesimi]]
```

Sul telefono il callout torna a una colonna sola.

## Scheda di esempio

La cartella [`examples`](examples) contiene un personaggio completo di D&D 5e,
[Elara Thornwood](examples/Elara%20Thornwood.md) (in inglese), che usa tutte le funzionalità
del plugin: caratteristiche con modificatore, punti ferita con massimo, tiri salvezza contro
la morte e slot incantesimo come tracce, monete e munizioni raggruppate, valori negativi e un
elenco di incantesimi incorporato su colonne. Copiala nel tuo vault insieme a
[Elara Thornwood - Spells](examples/Elara%20Thornwood%20-%20Spells.md) per provarla.

La stessa scheda scritta in Markdown semplice, senza il plugin, è in
[Elara Thornwood (without plugin)](examples/Elara%20Thornwood%20(without%20plugin).md).

### Prima e dopo

Stesso personaggio, stessi dati, stesso tema e stessa larghezza della finestra.

<table>
  <tr>
    <th width="50%">Markdown semplice</th>
    <th width="50%">Con TTRPG Sheet Kit</th>
  </tr>
  <tr>
    <td valign="top"><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plain-01-header-abilities.jpg" alt="Intestazione e caratteristiche in Markdown semplice" width="100%"></td>
    <td valign="top"><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plugin-01-header-abilities.jpg" alt="Intestazione su due colonne e caratteristiche con bottoni −/+" width="100%"></td>
  </tr>
  <tr>
    <td valign="top"><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plain-02-health.jpg" alt="Salute e incantesimi in Markdown semplice" width="100%"><br><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plain-03-inspiration-spellcasting.jpg" alt="Salute e incantesimi in Markdown semplice" width="100%"></td>
    <td valign="top"><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plugin-02-health-spellcasting.jpg" alt="Barra dei punti ferita, tiri salvezza, condizioni, slot e incantesimi con il plugin" width="100%"></td>
  </tr>
  <tr>
    <td valign="top"><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plain-04-features-coins.jpg" alt="Privilegi e monete in Markdown semplice" width="100%"></td>
    <td valign="top"><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plugin-03-features.jpg" alt="Privilegi su due colonne e usi come tracce di caselle" width="100%"></td>
  </tr>
  <tr>
    <td valign="top"><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plain-05-equipment-progress.jpg" alt="Equipaggiamento e progressi in Markdown semplice" width="100%"></td>
    <td valign="top"><img src="https://raw.githubusercontent.com/progressify/ttrpg-sheet-kit/main/assets/plugin-04-equipment-progress.jpg" alt="Monete, munizioni, oggetti su tre colonne e contatori dei progressi" width="100%"></td>
  </tr>
</table>

## Generare schede con l'AI

[`llms.txt`](llms.txt) è un riferimento compatto scritto per gli assistenti AI (ChatGPT, Claude, …).
Incollalo, o incolla il suo link, in una conversazione e chiedi una scheda: l'assistente scriverà
Markdown che funziona con TTRPG Sheet Kit. Puoi chiedere la scheda anche in italiano.

## Buono a sapersi

- I valori stanno dentro il blocco `ttrpgsk-counters` della nota, non in un database: puoi sempre modificarli a mano.
- Per modificare lo YAML di un blocco in Live Preview, passa il mouse sopra il blocco e clicca il bottone `</>` in alto a destra.
- Se due dispositivi modificano lo stesso contatore nello stesso momento, il servizio di sincronizzazione lo gestisce come qualsiasi altra modifica al testo.

## Feedback e nuove funzionalità

Mi farebbe piacere sapere come usi TTRPG Sheet Kit al tuo tavolo.

- **Ti manca una funzionalità?** Qualcosa per il tuo sistema di gioco, un nuovo layout, un nuovo tipo di tracciamento?
  [Apri una richiesta](https://github.com/progressify/ttrpg-sheet-kit/issues/new?template=feature_request.yml).
- **Hai trovato un bug?** [Apri una segnalazione](https://github.com/progressify/ttrpg-sheet-kit/issues/new?template=bug_report.yml)
  con una copia del blocco che non funziona e, se puoi, uno screenshot.
- **Vuoi solo dire cosa ne pensi** delle funzionalità attuali, nel bene o nel male? [Lascia un feedback](https://github.com/progressify/ttrpg-sheet-kit/issues/new?template=feedback.yml):
  ogni commento aiuta a decidere cosa migliorare. Puoi scrivere anche in italiano.

## Sviluppo

Il plugin è JavaScript semplice, senza passaggio di build. Vedi [CONTRIBUTING.md](CONTRIBUTING.md) (in inglese) per configurazione, convenzioni e pull request.

```bash
npm test
```

Per pubblicare una versione: aggiorna `version` in `manifest.json`, `package.json` e `versions.json`,
poi fai il push di un tag con la stessa versione (es. `0.2.0`, senza `v`). Il workflow di GitHub
esegue i test e crea una release in bozza con `main.js`, `manifest.json` e `styles.css`.

## Licenza

[MIT](LICENSE) © Progressify
