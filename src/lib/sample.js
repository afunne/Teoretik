// Example theory shown on first launch (about an invented game, "Hollow Signal").
import { newTheory, newBlock, newLink } from './model.js';

const svgData = (svg) => 'data:image/svg+xml,' + encodeURIComponent(svg);

const WAVE = svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
  <rect width="320" height="150" fill="#26296b"/>
  <g stroke="#e7e6d6" stroke-opacity=".18">${Array.from({ length: 15 }, (_, i) => `<line x1="${i * 22 + 6}" y1="0" x2="${i * 22 + 6}" y2="150"/>`).join('')}</g>
  <polyline fill="none" stroke="#e7e6d6" stroke-width="3" points="${Array.from({ length: 64 }, (_, i) => {
    const x = i * 5;
    const amp = i > 24 && i < 40 ? 48 : 10;
    return `${x},${75 + Math.sin(i * 1.3) * amp * (i % 3 ? 1 : 0.4)}`;
  }).join(' ')}"/>
  <text x="12" y="138" font-family="monospace" font-size="13" fill="#e7e6d6">LOG 03 / 02:14</text>
</svg>`);

const CLOCK = svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
  <rect width="320" height="150" fill="#c6c7b8"/>
  <g fill="#1d2038">${Array.from({ length: 10 }, (_, r) => Array.from({ length: 3 }, (_, c) => `<circle cx="${10 + c * 9}" cy="${12 + r * 13}" r="2"/>`).join('')).join('')}</g>
  <circle cx="160" cy="75" r="55" fill="#e7e6d6" stroke="#1d2038" stroke-width="5"/>
  <g stroke="#1d2038" stroke-width="3">${Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<line x1="${160 + Math.sin(a) * 44}" y1="${75 - Math.cos(a) * 44}" x2="${160 + Math.sin(a) * 50}" y2="${75 - Math.cos(a) * 50}"/>`;
  }).join('')}</g>
  <line x1="160" y1="75" x2="${160 + Math.sin(Math.PI / 2 + 0.15) * 26}" y2="${75 - Math.cos(Math.PI / 2 + 0.15) * 26}" stroke="#1d2038" stroke-width="6" stroke-linecap="square"/>
  <line x1="160" y1="75" x2="${160 + Math.sin(17 / 60 * Math.PI * 2) * 40}" y2="${75 - Math.cos(17 / 60 * Math.PI * 2) * 40}" stroke="#b0462a" stroke-width="4" stroke-linecap="square"/>
  <circle cx="160" cy="75" r="5" fill="#1d2038"/>
</svg>`);

export function sampleTheory() {
  const t = newTheory('Hollow Signal: who is the Operator?', ['en', 'et']);

  const main = newBlock(0, 0, 'claim');
  main.content.en = {
    title: 'The Operator is the player',
    summary: 'Every clue points to the radio voice being the player character - from a later loop.',
    body: 'Put the radio logs, the mirror room and the stopped clock side by side and a pattern appears: the Operator knows things that only someone who has already finished the game could know.\n\nIf this is right, the ending is not a twist but the start of the next loop.',
  };
  main.content.et = {
    title: 'Operaator on mängija ise',
    summary: 'Kõik vihjed viitavad sellele, et raadiohääl on mängija tegelaskuju - järgmisest tsüklist.',
    body: 'Kui panna raadiologid, peeglituba ja seisev kell kõrvuti, tekib muster: Operaator teab asju, mida saab teada ainult see, kes on mängu juba läbi mänginud.\n\nKui see on õige, pole lõpp üllatus, vaid järgmise tsükli algus.',
  };

  const logs = newBlock(-470, -230, 'evidence');
  logs.image = WAVE;
  logs.content.en = {
    title: 'Radio logs use your save name',
    summary: 'In chapter 3 the Operator reads out the name you gave your save file.',
    body: 'Log 03 at 02:14. The voice glitches and says the save-file name instead of the character name. Nobody else in the game ever uses it.',
  };
  logs.content.et = {
    title: 'Raadiologid kasutavad sinu salvestuse nime',
    summary: 'Kolmandas peatükis loeb Operaator ette nime, mille mängija salvestusele andis.',
    body: 'Logi 03, kell 02:14. Hääl hakib ja ütleb tegelase nime asemel salvestuse nime. Keegi teine mängus seda nime ei kasuta.',
  };

  const mirror = newBlock(-470, 200, 'evidence');
  mirror.content.en = {
    title: 'Mirror room reflection lags',
    summary: 'Your reflection moves one step behind you - but only while the radio is on.',
    body: '',
  };

  const clock = newBlock(450, -200, 'question');
  clock.image = CLOCK;
  clock.content.en = {
    title: 'Why does every clock stop at 3:17?',
    summary: 'Same time in the lighthouse, the station and the final room. Not explained yet.',
    body: 'Could be the moment the first loop ended. Could also just be a reused asset - needs a second look.',
  };

  const against = newBlock(450, 220, 'evidence');
  against.content.en = {
    title: 'Operator talks during a cutscene',
    summary: 'In the station cutscene the Operator speaks while the player is on screen and silent.',
    body: 'This is the strongest point against the theory. Unless the cutscene is a recording from the future, two versions of the player exist at once.',
  };

  t.blocks.push(main, logs, mirror, clock, against);
  const l1 = newLink(logs.id, main.id, 'supports');
  l1.label = { en: 'only you know it', et: 'teab ainult mängija' };
  const l2 = newLink(mirror.id, main.id, 'supports');
  const l3 = newLink(against.id, main.id, 'contradicts');
  l3.label = { en: 'two players?' };
  const l4 = newLink(clock.id, main.id, 'related');
  t.links.push(l1, l2, l3, l4);
  return t;
}
