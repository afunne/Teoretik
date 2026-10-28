// Example theory shown on first launch: Deltarune's Forgotten Man (facts as of Chapter 5).
import { newTheory, newBlock, newLink } from './model.js';

/** Bump this when the example changes, so existing users get the new one once. */
export const SAMPLE_VERSION = 'forgotten-man-1';

const svgData = (svg) => 'data:image/svg+xml,' + encodeURIComponent(svg);

// Simple original illustrations in the app's palette (not game art).
const TREE = svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
  <rect width="320" height="150" fill="#c6c7b8"/>
  <g fill="#1d2038">${Array.from({ length: 10 }, (_, r) => Array.from({ length: 3 }, (_, c) => `<circle cx="${292 + c * 9}" cy="${12 + r * 13}" r="2"/>`).join('')).join('')}</g>
  <rect x="0" y="128" width="320" height="22" fill="#e7e6d6" stroke="#1d2038" stroke-width="3"/>
  <rect x="148" y="86" width="24" height="44" fill="#1d2038"/>
  <g fill="#b0462a" stroke="#1d2038" stroke-width="4">
    <rect x="112" y="58" width="96" height="34"/>
    <rect x="124" y="32" width="72" height="30"/>
    <rect x="140" y="12" width="40" height="24"/>
  </g>
  <rect x="172" y="104" width="10" height="20" fill="#1d2038" opacity=".55"/>
  <text x="12" y="22" font-family="monospace" font-size="13" font-weight="700" fill="#1d2038">? BEHIND</text>
</svg>`);

const EGG = svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
  <rect width="320" height="150" fill="#26296b"/>
  <g fill="#e7e6d6" opacity=".25">${Array.from({ length: 9 }, (_, r) => Array.from({ length: 34 }, (_, c) => `<circle cx="${6 + c * 9.4}" cy="${8 + r * 17}" r="1.4"/>`).join('')).join('')}</g>
  <ellipse cx="160" cy="80" rx="34" ry="44" fill="#e7e6d6" stroke="#1d2038" stroke-width="5"/>
  <path d="M142 62 q8 -14 18 -16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <text x="12" y="138" font-family="monospace" font-size="13" fill="#e7e6d6">EGG 1 / 5</text>
</svg>`);

const block = (x, y, kind, content, image = null) => {
  const b = newBlock(x, y, kind);
  b.content = content;
  b.image = image;
  return b;
};

export function sampleTheory() {
  const t = newTheory('Deltarune: who is the Forgotten Man?', ['en', 'et']);

  const question = block(0, -60, 'question', {
    en: {
      title: 'Who is the Forgotten Man?',
      summary: 'A man who always hides behind a tree, gives Kris an Egg in every chapter, and then stops existing.',
      body: 'He has appeared in all five chapters so far, always in a secret room, always hidden behind the same kind of red-leaved tree as the Chapter 1 forest. Kris always meets him alone.\n\nNobody has seen his face, and the game only ever calls him "the man" or the Forgotten Man. The three blocks around this one are the main answers people give.',
    },
    et: {
      title: 'Kes on Unustatud Mees?',
      summary: 'Mees, kes peidab end alati puu taha, annab Krisile igas peatükis Muna ja lakkab siis olemast.',
      body: 'Ta on ilmunud kõigis viies peatükis, alati salajases ruumis ja alati sama tüüpi punaste lehtedega puu taga nagu 1. peatüki metsas. Kris kohtub temaga alati üksi.\n\nKeegi pole tema nägu näinud ja mäng nimetab teda ainult "meheks" või Unustatud Meheks. Selle ploki ümber on kolm peamist vastust.',
    },
  }, TREE);

  const kris = block(-440, -60, 'claim', {
    en: {
      title: 'He is a memory Kris keeps burying',
      summary: 'Kris has met him before, forgot him, and keeps covering him up. The eggs are reminders.',
      body: 'He knows Kris, and Kris has apparently forgotten him more than once. In Chapter 4 Kris literally paints a tree over what they saw behind the tree. He asks Kris not to forget him, and only keeps existing when Kris promises.\n\nIf this is right, the Forgotten Man is tied to something from Kris\'s past that Kris would rather not remember - and collecting the eggs is the player slowly digging it back up.',
    },
    et: {
      title: 'Ta on mälestus, mida Kris pidevalt maha matab',
      summary: 'Kris on teda varem kohanud, ta unustanud ja katab teda ikka uuesti kinni. Munad on meeldetuletused.',
      body: 'Ta tunneb Krisi ja Kris on ta ilmselt mitu korda unustanud. 4. peatükis maalib Kris sõna otseses mõttes puu selle peale, mida ta puu taga nägi. Mees palub Krisil teda mitte unustada ja jääb alles ainult siis, kui Kris seda lubab.\n\nKui see on õige, on Unustatud Mees seotud millegagi Krisi minevikust, mida Kris eelistaks mitte mäletada - ja munade kogumine on see, kuidas mängija seda aeglaselt välja kaevab.',
    },
  });

  const gaster = block(440, -380, 'claim', {
    en: {
      title: 'He is W.D. Gaster',
      summary: 'A man erased from time, only half-remembered, hiding in rooms between rooms.',
      body: 'In Undertale, Gaster is a scientist who fell out of existence and is only known through hidden, random-chance encounters - including a "mystery man" in a secret room who vanishes once you leave. The Forgotten Man fits that pattern: secret rooms between screens, a hazy memory, and worrying that he could forget himself.\n\nWeak point: the evidence is all circumstantial.',
    },
    et: {
      title: 'Ta on W.D. Gaster',
      summary: 'Ajast kustutatud mees, keda mäletatakse vaid poolikult ja kes peidab end ruumides ruumide vahel.',
      body: 'Undertale\'is on Gaster teadlane, kes kadus olemasolust ja keda tuntakse ainult peidetud, juhuslike kohtumiste kaudu - sealhulgas "salapärane mees" salajases ruumis, kes kaob, kui lahkud. Unustatud Mees sobib selle mustriga: salajased ruumid ekraanide vahel, udune mälu ja hirm iseennast unustada.\n\nNõrk koht: kõik tõendid on kaudsed.',
    },
  });

  const meta = block(440, 240, 'claim', {
    en: {
      title: 'He is the easter egg itself',
      summary: 'The eggs are literal easter eggs - a joke about players hunting secrets, maybe even the author waving at us.',
      body: 'Every encounter is the classic easter egg recipe: a hidden path, some busywork, a useless reward and a few lines of dialogue. Some players read the Chapter 5 goodbye as the author telling completionists they can stop looking.\n\nToby Fox has also compared him to the Forgotten Man in EarthBound, so he is at least partly a nod to another game.',
    },
    et: {
      title: 'Ta ongi see easter egg',
      summary: 'Munad on sõna otseses mõttes easter egg\'id - nali saladusi jahtivate mängijate üle, võib-olla lehvitab meile autor ise.',
      body: 'Iga kohtumine on klassikaline easter egg\'i retsept: peidetud tee, natuke tüütut tööd, kasutu auhind ja paar rida dialoogi. Mõned mängijad loevad 5. peatüki hüvastijättu nii, et autor ütleb kõike koguvatele mängijatele, et nad võivad otsimise lõpetada.\n\nToby Fox on teda võrrelnud ka EarthBoundi Unustatud Mehega, nii et ta on vähemalt osaliselt viide teisele mängule.',
    },
  });

  const ch1 = block(880, -620, 'evidence', {
    en: {
      title: 'Ch. 1 - The forest tree',
      summary: 'A 2% chance room between two screens. Kris enters alone and gets the first Egg.',
      body: 'Walking back and forth between two rooms of the Scarlet Forest sometimes drops Kris onto a hidden path with one tree and a strange piano track. Behind the tree a man offers something: the Egg.\n\nAfterwards the spot is empty and the room can never be entered again.',
    },
  }, EGG);

  const noName = block(880, -170, 'evidence', {
    en: {
      title: 'Gaster is never named',
      summary: 'As of Chapter 5, Deltarune does not mention Gaster by name outside two name-entry easter eggs.',
      body: '',
    },
  });

  const ch2 = block(-900, -640, 'evidence', {
    en: {
      title: 'Ch. 2 - He waves from a car',
      summary: 'In the Light World a man in traffic waves happily at Kris - then he is gone. Later, a second Egg.',
      body: 'Only if Kris met him in Chapter 1: on the way to the library, a man in a passing car waves at Kris. Checking again shows nothing. In Cyber City he hands over another Egg, and afterwards the game says there was not a man here.\n\nThis is the clearest sign he exists in the real (Light) world too, not only in Dark Worlds.',
    },
  });

  const ch3 = block(-900, -230, 'evidence', {
    en: {
      title: 'Ch. 3 - Mancountry',
      summary: 'He finally talks. If Kris says they will forget him, he stops existing on the spot.',
      body: 'Kris arrives alone, in their normal Light World clothes. He introduces himself as the man who is always forgotten, and recognizes Kris as someone who forgot him before. He describes how the world once looked like his little island, before everything changed.\n\nHis weekly routine secretly points to where the next eggs are hidden. He says they will meet again, whether in 11 hours or 11 years.',
    },
  });

  const ch4 = block(-900, 190, 'evidence', {
    en: {
      title: 'Ch. 4 - The art club',
      summary: 'Kris tries to draw what they saw behind the tree, keeps failing, then paints a tree over it.',
      body: 'Behind the 100th window of the 2nd Sanctuary is a hospital-like place with a receptionist, a sink and an art club. Kris keeps trying to sketch what was behind the tree, then covers the sketch with a painted tree and takes the Egg.\n\nWashing hands at the sink shows a faint grey crease between Kris\'s fingers that never fully washes off.',
    },
    et: {
      title: '4. ptk - Kunstiring',
      summary: 'Kris proovib joonistada seda, mida ta puu taga nägi, ebaõnnestub ja maalib selle peale puu.',
      body: '2. pühamu 100. akna taga on haiglataoline koht vastuvõtulaua, kraanikausi ja kunstiringiga. Kris proovib korduvalt visandada seda, mis puu taga oli, katab siis visandi maalitud puuga ja võtab Muna.\n\nKraanikausi juures käsi pestes on Krisi sõrmede vahel nõrk hall korts, mis ei tule kunagi päris maha.',
    },
  });

  const ch5 = block(0, 460, 'evidence', {
    en: {
      title: 'Ch. 5 - The empty palm',
      summary: 'Kris drops to LV 1. Ask for more: with every egg found, he shows an empty hand and says goodbye.',
      body: 'The room looks exactly like Chapter 1\'s. If Kris has all the eggs, he shows an empty palm and waves goodbye, and Kris feels they should stop looking for him - even though they never were. If eggs are missing, he points at more trees in the distance.\n\nComing back afterwards, Kris feels a weight on their shoulder.',
    },
  });

  const eggNote = block(880, 300, 'note', {
    en: {
      title: 'Eggs = easter eggs',
      summary: 'The trick never changes: a secret path, one man, one useless reward. That is the oldest easter egg formula in games.',
      body: '',
    },
  });

  t.blocks.push(question, kris, gaster, meta, ch1, noName, ch2, ch3, ch4, ch5, eggNote);

  const link = (from, to, type, label) => {
    const l = newLink(from.id, to.id, type);
    if (label) l.label = label;
    t.links.push(l);
  };
  link(kris, question, 'related', { en: 'answer?', et: 'vastus?' });
  link(gaster, question, 'related', { en: 'answer?', et: 'vastus?' });
  link(meta, question, 'related', { en: 'answer?', et: 'vastus?' });
  link(ch2, kris, 'supports', { en: 'he knows Kris', et: 'ta tunneb Krisi' });
  link(ch3, kris, 'supports', { en: 'forgot him before', et: 'unustas ta varem' });
  link(ch4, kris, 'supports', { en: 'painted over', et: 'üle maalitud' });
  link(ch5, kris, 'supports', { en: 'weight on shoulder', et: 'raskus õlal' });
  link(ch1, gaster, 'supports', { en: 'secret room by chance', et: 'juhuslik salaruum' });
  link(noName, gaster, 'contradicts', { en: 'no proof', et: 'tõestus puudub' });
  link(eggNote, meta, 'supports');
  link(ch5, meta, 'supports', { en: 'you have everything', et: 'sul on kõik' });
  return t;
}
