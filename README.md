# Teoretik

A retro theory board for game theorists. Write a theory as blocks, add pictures and explanations,
connect the dots, and translate every block into several languages.

Frontend only for now (React + Vite). Theories are saved in the browser (localStorage).

## Run

Needs Node 18+.

```
npm install
npm run dev
```

Vite opens http://localhost:5173. `npm run build` makes a production build in `dist/`.

## How to use

| Action | How |
| --- | --- |
| New block | Double-click the paper, press **+ Block**, or press `N` |
| Edit a block | Click it - the editor opens on the right |
| Move a block | Drag it (snaps to 8px, hold `Alt` for free move) |
| Connect two blocks | Drag the round handle on a block's right edge onto another block |
| Change a connection | Click the line or its little tag: Supports / Contradicts / Related + label |
| Picture | **+ Add picture** in the editor, or drop an image file onto a block |
| Pan / zoom | Drag empty paper (or hold `Space`), mouse wheel to zoom, `0` = fit all |
| Delete | Select + `Delete`, or the button in the editor |
| Duplicate block | `Ctrl+D` |
| Languages | Language tabs in the top bar; `±` to add or remove a language |
| Saves | **Saves** - open, copy, export / import `.json`, delete |

Blocks that are not translated yet show their original text faded, with a small language tag
(e.g. `EN`), so the board never has empty holes.

## Structure

```
index.html
vite.config.js
src/
  main.jsx                 React entry
  App.jsx                  app state, actions, autosave, keyboard shortcuts
  styles.css               retro paper theme
  components/
    TopBar.jsx             logo, theory title, language switch, buttons
    Board.jsx              canvas: pan, zoom, drag, connect, connection lines
    Block.jsx              one card on the board
    Panel.jsx              right-side editor (block / connection)
    Library.jsx            saves screen, export / import
  hooks/
    useConfirm.jsx         retro confirm dialog
    useToast.jsx           little status messages
  lib/
    model.js               data model + helpers
    storage.js             localStorage persistence
    image.js               shrinks uploaded pictures
    sample.js              example theory shown on first launch
```

## Data format

```js
Theory { id, title, languages: ['en','et'], blocks: [], links: [], view: {x, y, zoom} }
Block  { id, x, y, kind: 'claim'|'evidence'|'question'|'note', image, expanded,
         content: { en: { title, summary, body }, et: {...} } }
Link   { id, from, to, type: 'supports'|'contradicts'|'related', label: { en: '...' } }
```

This is the same shape a future backend can store as-is.
