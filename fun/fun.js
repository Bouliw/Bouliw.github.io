/* Bouliw · Fun mode.
   On by default. The Fun switch in the header brings back the plain site, and a dock
   picks the style: Overdrive (default), Y2K, Phantom, Alert, Neon, 8-bit or Mix.
   Choices (mode, style, sound, music, typing, achievements, XP, bugs caught) live in localStorage.
   Everything heavy pauses off screen, in background tabs, and drops to a lighter
   version if the frame rate falls. */
(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.fun-toggle');
  if (!toggle) return;
  const SCRIPT = document.currentScript ? document.currentScript.src : location.href;

  const KEY = 'bouliw-fun';
  const STYLE_KEY = 'bouliw-fun-style';
  const SOUND_KEY = 'bouliw-fun-sound';
  const MUSIC_KEY = 'bouliw-fun-music';
  const TYPING_KEY = 'bouliw-fun-typing';
  const TROPHY_KEY = 'bouliw-fun-trophies';
  const TRIED_KEY = 'bouliw-fun-tried';
  const XP_KEY = 'bouliw-fun-xp';
  const HI_KEY = 'bouliw-fun-hiscore';
  const BUG_KEY = 'bouliw-fun-bugs';
  const BUG_SAID_KEY = 'bouliw-fun-bug-lines';
  const BUG_BEST_KEY = 'bouliw-fun-bug-best';
  const BUG_TIME_KEY = 'bouliw-fun-bug-time';
  const SAID_KEY = 'bouliw-fun-comments';
  const QUIP_KEY = 'bouliw-fun-quips';
  const SITE = 'https://bouliw.github.io/';
  // Seasonal event picked in the dock: 'auto' follows the date.
  const EVENT_KEY = 'bouliw-fun-event';
  const EVENTS = ['auto', 'none', 'winter', 'christmas', 'newyear', 'halloween', 'april', 'birthday'];
  const WINTRY = ['winter', 'christmas', 'newyear'];
  const eventPref = () => { const v = store.get(EVENT_KEY); return EVENTS.includes(v) ? v : 'auto'; };
  // A challenge link carries a bug run time in ms: ?dare=102300 is 1:42.3 to beat.
  const DARE = (() => { const v = parseInt(new URLSearchParams(location.search).get('dare') || '', 10); return v >= 1000 && v <= 3600000 ? v : 0; })();
  const DEFAULT_SKIN = 'overdrive';
  const SKINS = [['overdrive', 'Overdrive'], ['y2k', 'Y2K'], ['phantom', 'Phantom'], ['alert', 'Alert'], ['neon', 'Neon'], ['pixel', '8-bit'], ['mix', 'Mix']];
  // In Mix, each section wears one style (keep in sync with build_css.py).
  const MIX = { takeline: 'phantom', roughcut: 'neon', 'mac-toolkit': 'neon', earshot: 'y2k', trackmend: 'y2k', vigie: 'alert', 'doc-indexer': 'alert', boulito: 'pixel', upstream: 'pixel', lantern: 'phantom', foothold: 'phantom' };
  const EPISODES = ['第壱話', '第弐話', '第参話', '第四話', '第伍話', '第六話', '第七話', '第八話', '第九話', '第拾話', '第拾壱話'];
  const SPARKS = ['#ff6bd5', '#b49cff', '#22d3ee', '#b6ff3b', '#6b2bff'];
  const COLORS = ['#b6ff3b', '#6b2bff', '#ff2e88', '#22d3ee', '#ffffff'];
  const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // Sprite atlas (fun/sprites/buddy.png): rows are outfits, then a row of extras.
  // Columns: 0-3 walk right, 4-7 walk left, 8 idle, 9 wave, 10 thumbs up, 11 arms crossed.
  const OUTFIT = { overdrive: 0, y2k: 1, phantom: 2, alert: 3, neon: 4, pixel: 0, mix: 0 };
  const MENU_POSES = [[0, 8], [5, 4], [3, 11], [2, 9], [5, 1], [5, 5], [2, 11], [1, 10], [4, 10]];
  // What a bug says when it is caught: a different line each time, never twice until all have been said.
  const BUG_LINES = [
    "You found me! For the record, I'm a feature.",
    'Busted. Works on my machine, though.',
    "Got me! Please don't tell QA.",
    'Found! Close the ticket, I surrender.',
    'Sharp eyes. Ever thought about pentesting?',
    'You found me! My CVE number is on its way.',
    "Relax, I'm only a warning.",
    'Shh… I shipped on a Friday at 5 pm.',
    'Found me. Now try to reproduce me.',
    'Fine, you win. Back to node_modules I go.',
    "Found! I'm blaming the cache.",
    'Fix me and two more will show up.',
    'Argh! I was one step away from a segfault.',
    'A semicolon has been looking for me all day.',
    'I should have hidden in the CSS. Nobody goes there.',
    'Found me. Status: WONTFIX.',
    'Noooo, three days before I retired.',
    'Congrats, you won… nothing. Well, some XP.',
    'Usually I only come out during live demos.',
    'This stays between us. And the logs.',
    'I was hiding behind a missing bracket.',
    "I'm not a memory leak. I'm a memory.",
    'Of course you check the corners.',
    "I'm not lost, I'm undocumented.",
    'Caught! Can I at least keep my stack trace?',
    'Wow. Even the unit tests never found me.',
    'You found me! I was in staging, I swear.',
    "Fine. But I'm back in the next update.",
    "I'm not hiding, I'm deprecated.",
    'Found me! Quick, act like this was planned.',
  ];
  const BUG_LAST = "That was the last one. Zero bugs left… until the next commit.";
  // What the buddy says about each project, once only (kept until the progress is reset): [pose, English, French].
  const COMMENTS = {
    roughcut: [10, 'I hate editing my vlogs. So the Mac does it.', 'Je déteste monter mes vlogs. Alors le Mac s\'en charge.'],
    earshot: [10, 'No bot joins the call. I checked.', 'Aucun bot ne rejoint l\'appel. J\'ai vérifié.'],
    vigie: [11, 'Blue team mode: on. 53 rules, zero coffee.', 'Mode blue team activé. 53 règles, zéro café.'],
    boulito: [9, 'Say “Skip the ad”. Go on, it works.', 'Dis « passe la pub ». Vas-y, ça marche.'],
    takeline: [8, 'Read your script, it follows. Retake a line, it goes back.', 'Lis ton texte, il suit. Reprends une phrase, il revient.'],
    trackmend: [10, 'My music library was a mess. Was.', 'Ma bibliothèque musicale était un chantier. Était.'],
    'doc-indexer': [10, 'Your paperwork, searchable. Nothing leaves the Mac.', 'Tes papiers, cherchables. Rien ne quitte le Mac.'],
    'mac-toolkit': [8, 'The first things I reinstall on a new Mac.', 'Ce que je réinstalle en premier sur un nouveau Mac.'],
    lantern: [9, 'Popcorn not included.', 'Pop-corn non fourni.'],
    foothold: [11, 'No quote, no claim. The model hates it.', 'Pas de citation, pas d\'affirmation. Le modèle déteste.'],
    upstream: [10, 'One line, merged into Homebrew. Proud of it.', 'Une ligne, mergée dans Homebrew. J\'en suis fier.'],
  };
  // Lines he drops now and then, never twice until all have been said: [English, French].
  const QUIPS = [
    ["I'm 32 pixels wide and still no desk.", '32 pixels de large et toujours pas de bureau.'],
    ['My salary? Paid in XP.', 'Mon salaire ? Payé en XP.'],
    ["Stand-up meeting. I'm the only one standing.", 'Réunion debout. Je suis le seul debout.'],
    ['I asked for a raise. I got one more pixel.', "J'ai demandé une augmentation. On m'a donné un pixel de plus."],
    ["Don't scroll so fast, I get seasick.", "Scrolle pas si vite, j'ai le mal de mer."],
    ['Somewhere, a semicolon is missing. I can feel it.', 'Quelque part, il manque un point-virgule. Je le sens.'],
    ["Ctrl+Z doesn't work in real life. I tried.", "Ctrl+Z ne marche pas dans la vraie vie. J'ai testé."],
    ["I'm not slacking, I'm in power-saving mode.", 'Je ne glande pas, je suis en mode économie d’énergie.'],
    ['It works on my machine. And now I live on yours.', "Chez moi, ça marche. Et là, j'habite chez toi."],
    ['Have you tried turning it off and on again?', "T'as essayé d'éteindre et de rallumer ?"],
    ["I'd offer you a coffee, but I'm a PNG.", 'Je t’offrirais bien un café, mais je suis un PNG.'],
    ['Need me? I’ll be in the footer.', 'Si tu me cherches, je serai dans le footer.'],
    ['This site has no cookies. I ate them.', "Ce site n'a pas de cookies. Je les ai mangés."],
    ['Left, right, left, right. That’s my cardio.', "Gauche, droite, gauche, droite. C'est mon cardio."],
    ["My only bug: I'm too charming.", "Mon seul bug, c'est que je suis trop charmant."],
    ['Git blame says it was me. Git is lying.', 'Git blame dit que c’est moi. Git ment.'],
    ['I tried dark mode once. Lost myself.', "J'ai testé le mode sombre. Je me suis perdu."],
    ['Achievement idea: reading everything. Nobody has it.', "Idée de succès : tout lire. Personne ne l'a."],
    ["I'm the senior pixel around here.", 'Ici, je suis le pixel senior.'],
    ["Reloading won't get rid of me.", 'Recharger la page ne te débarrassera pas de moi.'],
    ["Zero trust. I don't even trust myself.", 'Zero trust. Même moi, je ne me fais pas confiance.'],
    ['Sometimes I just stand here and think about recursion.', 'Des fois, je reste là à penser à la récursivité.'],
    ["Tabs or spaces? I'm a sprite, I don't care.", 'Tabs ou espaces ? Je suis un sprite, je m’en fiche.'],
    ["I'd do a backflip, but it's not on my sprite sheet.", "Je ferais bien un salto, mais il n'est pas sur ma planche de sprites."],
    ['Loading a joke… 99%.', 'Chargement d’une blague… 99 %.'],
    ["I've read the whole site. Twice. It's good.", "J'ai lu tout le site. Deux fois. C'est bien."],
    ['Pro tip: you can grab me. Not that I enjoy it.', "Astuce : on peut m'attraper. Pas que j'aime ça."],
    ['Hobbies: walking, standing, judging your scroll speed.', 'Mes hobbies : marcher, rester debout, juger ta vitesse de scroll.'],
    ['The bugs owe me money.', 'Les bugs me doivent de l’argent.'],
    ['I push straight to main. I live dangerously.', 'Je push direct sur main. Je vis dangereusement.'],
    ['404: motivation not found. Kidding, I love it here.', "404 : motivation introuvable. Je rigole, j'adore être ici."],
    ['Fun mode is on. Fun is mandatory.', 'Le mode fun est activé. Le fun est obligatoire.'],
    ["I don't have a backend. I have a back, and it hurts.", "Je n'ai pas de backend. J'ai un dos, et il me fait mal."],
    ['My cache is full of memories.', 'Mon cache est plein de souvenirs.'],
    ['Still here. Still a pixel. Still cute.', 'Toujours là. Toujours en pixels. Toujours mignon.'],
    ['If you click me enough, nothing happens. Trust me.', 'Si tu cliques assez sur moi, il ne se passe rien. Fais-moi confiance.'],
  ];
  const OUCH = [['Ouch.', 'Aïe.'], ['Was that necessary?', 'C\'était nécessaire ?'], ["I'm filing a bug report.", 'Je vais ouvrir un ticket.'], ['My pixels!', 'Mes pixels !'], ['Again? No.', 'Encore ? Non.'], ['I had a meeting.', 'J\'avais une réunion.']];
  const LINES = ['Hi there!', 'Pick a style below!', 'Click a window to see the code.', 'Try the Konami code!', 'Insert coin at the bottom!', 'New outfit?', 'Turn the sound on!'];
  const TROPHIES = {
    start: ["It's dangerous to go alone", 'Opened the portfolio in fun mode'],
    costume: ['Outfit check', 'Switched to another style'],
    hopper: ["Gotta try 'em all", 'Tried all seven styles'],
    tour: ['Around the world in eleven stages', 'Visited all eleven projects'],
    source: ['Use the source, Luke', 'Opened a project'],
    konami: ['Thirty extra lives', 'Entered the code from old games'],
    sticker: ['Sticky fingers', 'Moved a sticker'],
    sound: ['Is this thing on?', 'Turned the sound on'],
    music: ['When the music is good', 'Turned the music on'],
    clicks: ['Carpal tunnel any%', 'Clicked 30 times'],
    arcade: ['Arcade rat', 'Found the hidden game'],
    ace: ['All your base are belong to us', 'Scored 3,000 points'],
    bug: ['Works on my machine', 'Caught a hidden bug'],
    bugs: ['Bug bounty', 'Caught all twelve hidden bugs'],
    speedrun: ['Speedrunner', 'Caught all twelve bugs in under 3 minutes'],
    yeet: ['Yeet', 'Threw the buddy across the screen'],
    dare: ['Challenge accepted', "Beat the time in a friend's challenge link"],
  };

  // What to do for each achievement still locked; a counter where there is one.
  const HINTS = {
    start: 'Open the portfolio in fun mode',
    costume: 'Pick another style in the dock',
    hopper: 'Try all seven styles',
    tour: 'Scroll through all eleven projects in one visit',
    source: 'Click a project window or one of its links',
    konami: 'Type the code shown in the footer',
    sticker: 'Drag a sticker around the Overdrive headline',
    sound: 'Turn the sound on in the dock',
    music: 'Turn the sound on, then the music',
    clicks: 'Click 30 times in one visit',
    arcade: 'Find the coin slot at the bottom of the page',
    ace: 'Score 3,000 in the hidden game',
    bug: 'Something is peeking out from an edge of the page. Click it',
    bugs: 'Catch the twelve bugs hiding around the page',
    speedrun: 'Catch all twelve hidden bugs within 3 minutes of the first one (hide the bugs again to retry)',
    yeet: 'Grab the buddy and throw him',
    dare: "Open a friend's challenge link, then beat their time",
  };
  const EARN = [
    ['Unlock an achievement', '+50'],
    ['Type the cheat code', '+100'],
    ['Open a project on GitHub', '+25'],
    ['Try a style for the first time', '+20'],
    ['Catch a hidden bug', '+15'],
    ['Reach a project you have not seen this visit', '+15'],
    ['Switch back to a style', '+10'],
    ['Press CONTINUE? in the footer', '+10'],
    ['Scroll further down the page', '+3'],
    ['Click around (40 per visit) or poke the buddy', '+1 / +2'],
    ['Play the hidden game', 'score ÷ 50'],
  ];

  // French, when the page language is French (lang.js sets <html lang>).
  const FR = {
    trophies: {
      start: ["Dangereux d'y aller seul", 'Portfolio ouvert en mode fun'],
      costume: ['Relooking extrême', 'Un autre style essayé'],
      hopper: ['Attrapez-les tous', 'Les sept styles essayés'],
      tour: ['Le tour du monde en onze étapes', 'Les onze projets visités'],
      source: ['Utilise la source, Luke', 'Un projet ouvert'],
      konami: ['Trente vies en rab', 'Le code des vieux jeux tapé'],
      sticker: ['Ça colle !', 'Un autocollant déplacé'],
      sound: ['Un, deux, un, deux', 'Son activé'],
      music: ['Quand la musique est bonne', 'Musique activée'],
      clicks: ['Tendinite any%', '30 clics'],
      arcade: ["Rat d'arcade", 'Jeu caché trouvé'],
      ace: ['All your base are belong to us', '3 000 points marqués'],
      bug: ['Chez moi, ça marche', 'Un bug caché attrapé'],
      bugs: ['Bug bounty', 'Les douze bugs cachés attrapés'],
      speedrun: ['Speedrunner', 'Les douze bugs en moins de 3 minutes'],
      yeet: ['Yeet', 'Le perso lancé à travers l\'écran'],
      dare: ['Défi relevé', "Le temps d'un lien de défi battu"],
    },
    hints: {
      start: 'Ouvrir le portfolio en mode fun',
      costume: 'Choisir un autre style dans le dock',
      hopper: 'Essayer les sept styles',
      tour: 'Faire défiler les onze projets en une visite',
      source: "Cliquer sur la fenêtre d'un projet ou sur un de ses liens",
      konami: 'Taper le code affiché en bas de page',
      sticker: 'Déplacer un autocollant du titre Overdrive',
      sound: 'Activer le son dans le dock',
      music: 'Activer le son, puis la musique',
      clicks: 'Cliquer 30 fois en une visite',
      arcade: 'Trouver la fente à pièces en bas de page',
      ace: 'Faire 3 000 points au jeu caché',
      bug: "Quelque chose dépasse d'un bord de la page. Clique dessus",
      bugs: 'Attraper les douze bugs cachés sur la page',
      speedrun: 'Attraper les douze bugs cachés en moins de 3 minutes à partir du premier (recacher les bugs pour réessayer)',
      yeet: 'Attraper le perso et le lancer',
      dare: "Ouvrir le lien de défi d'un ami, puis battre son temps",
    },
    earn: [
      ['Débloquer un succès', '+50'],
      ['Taper le code de triche', '+100'],
      ['Ouvrir un projet sur GitHub', '+25'],
      ['Essayer un style pour la première fois', '+20'],
      ['Attraper un bug caché', '+15'],
      ['Arriver sur un projet pas encore vu pendant la visite', '+15'],
      ['Revenir à un style', '+10'],
      ['Appuyer sur CONTINUE? en bas de page', '+10'],
      ['Descendre plus loin dans la page', '+3'],
      ['Cliquer partout (40 par visite) ou embêter le perso', '+1 / +2'],
      ['Jouer au jeu caché', 'score ÷ 50'],
    ],
    bugLines: [
      "Tu m'as trouvé ! Pour info, je suis une fonctionnalité.",
      'Grillé. Pourtant, chez moi ça marche.',
      "Tu m'as eu ! Ne dis rien à la QA.",
      'Trouvé ! Ferme le ticket, je me rends.',
      "T'as l'œil. Tu as déjà pensé au pentest ?",
      "Tu m'as trouvé ! Mon numéro de CVE arrive.",
      "Pas de panique, je ne suis qu'un warning.",
      "Chut… on m'a mis en prod un vendredi à 17 h.",
      'Trouvé. Maintenant, essaie de me reproduire.',
      "Bon, t'as gagné. Je retourne dans node_modules.",
      "Trouvé ! Je dirai que c'est la faute du cache.",
      'Corrige-moi et deux autres vont apparaître.',
      "Argh ! J'étais à deux doigts du segfault.",
      'Un point-virgule me cherche depuis ce matin.',
      "J'aurais dû me cacher dans le CSS. Personne n'y va.",
      'Trouvé. Statut : WONTFIX.',
      'Noooon, à trois jours de la retraite…',
      "Bravo, tu as gagné… rien. Enfin, de l'XP.",
      "D'habitude, je ne sors que pendant les démos.",
      'Ça reste entre nous. Et les logs.',
      'Je me cachais derrière une accolade oubliée.',
      'Je ne suis pas une fuite de mémoire, je suis un souvenir.',
      'Évidemment, tu regardes dans les coins.',
      'Je ne suis pas perdu, je suis non documenté.',
      'Pris ! Je peux au moins garder ma stack trace ?',
      "Même les tests unitaires ne m'avaient pas trouvé.",
      "Tu m'as trouvé ! J'étais en préprod, je te jure.",
      "D'accord. Mais je reviens à la prochaine mise à jour.",
      'Je ne me cache pas, je suis déprécié.',
      "Trouvé ! Vite, fais comme si c'était prévu.",
    ],
    bugLast: "C'était le dernier. Zéro bug… jusqu'au prochain commit.",
    lines: ['Salut !', 'Choisis un style en bas !', 'Clique sur une fenêtre pour voir le code.', 'Essaie le code Konami !', 'Une pièce en bas de page !', 'Nouvelle tenue ?', 'Active le son !'],
  };
  const UI = {
    en: {
      unlockedToast: 'Achievement unlocked', progress: 'Progress', close: 'Close', todo: 'Still to unlock', earn: 'How to earn XP', done: 'Unlocked',
      next: (n, L, t) => `${n} XP to level ${L} · ${t} XP in total`, all: 'Every achievement unlocked. Well played.', hi: n => `Hidden game high score: ${n}`,
      ok: 'Done', best: n => `best ${n}`, chip: (L, a, b) => `Level ${L}, ${a} of ${b} XP. Show achievements and how to level up`,
      sound: 'Sound', music: 'Music', typing: 'Typing', typingAria: 'Typing sounds', dock: 'Fun mode style', fun: 'Fun mode',
      game: 'Hidden game', screen: 'Game screen. Move with the arrow keys or the pointer, fire with space or a tap.', cont: 'Continue: back to the top',
      reset: 'Reset progress', resetSure: 'Sure? Click again', resetNote: 'Your style, sound, event and language stay as they are.', newGame: 'New game!', run: 'BUG RUN', record: 'NEW RECORD', whoa: 'Whoa!',
      hello: 'Hi there!', thanks: 'Thanks for playing!', round: 'Round 2!', outfit: 'New outfit!', cheat: 'Cheat code!', level: L => `LEVEL ${L}!`,
      dare: 'Challenge someone', copied: 'Link copied!', copyThis: 'Copy this link', dareBest: t => `Your bug run record: ${t}`, dareChip: t => `DARE ${t}`,
      dareText: t => `I caught the 12 hidden bugs on bouliw.github.io in ${t}. Can you beat that?`,
      dareIn: t => `Challenge: beat ${t}. Catch all 12 bugs!`, dareReset: t => `Challenge: ${t}. Hide the bugs again (LV badge) to take it on.`,
      rebug: 'Hide the bugs again', bugsBack: 'The bugs are back. Catch them all!',
      dareGo: t => `Challenge: ${t}. Go!`, dareWon: 'CHALLENGE WON', dareWin: d => `Challenge won, ${d} ahead! Send them your link.`, dareLose: d => `Missed by ${d}. Hide the bugs again and retry.`,
      sec: ms => (ms < 60000 ? `${(ms / 1000).toFixed(1)} s` : clock(ms)),
      event: 'Event', eventAria: 'Seasonal event',
      events: { auto: "Auto (today's date)", none: 'None', winter: 'Winter', christmas: 'Christmas', newyear: 'New year', halloween: 'Halloween', april: 'April fools', birthday: "The site's birthday" },
    },
    fr: {
      unlockedToast: 'Succès débloqué', progress: 'Progression', close: 'Fermer', todo: 'Encore à débloquer', earn: "Comment gagner de l'XP", done: 'Débloqués',
      next: (n, L, t) => `${n} XP avant le niveau ${L} · ${t} XP au total`, all: 'Tous les succès sont débloqués. Bien joué.', hi: n => `Meilleur score au jeu caché : ${n}`,
      ok: 'Fait', best: n => `record ${n}`, chip: (L, a, b) => `Niveau ${L}, ${a} XP sur ${b}. Voir les succès et comment monter de niveau`,
      sound: 'Son', music: 'Musique', typing: 'Frappe', typingAria: 'Sons de frappe', dock: 'Style du mode fun', fun: 'Mode fun',
      game: 'Jeu caché', screen: 'Écran du jeu. Déplacement avec les flèches ou la souris, tir avec espace ou un toucher.', cont: 'Continuer : retour en haut',
      reset: 'Remettre à zéro', resetSure: 'Sûr ? Reclique', resetNote: "Ton style, le son, l'événement et la langue restent comme ils sont.", newGame: 'Nouvelle partie !', run: 'BUG RUN', record: 'NOUVEAU RECORD', whoa: 'Hé !',
      hello: 'Salut !', thanks: "Merci d'avoir joué !", round: 'Round 2 !', outfit: 'Nouvelle tenue !', cheat: 'Code de triche !', level: L => `NIVEAU ${L} !`,
      dare: "Défier quelqu'un", copied: 'Lien copié !', copyThis: 'Copie ce lien', dareBest: t => `Ton record au bug run : ${t}`, dareChip: t => `DÉFI ${t}`,
      dareText: t => `J'ai attrapé les 12 bugs cachés de bouliw.github.io en ${t}. Tu fais mieux ?`,
      dareIn: t => `Défi reçu : ${t} à battre. Attrape les 12 bugs !`, dareReset: t => `Défi : ${t}. Recache les bugs (badge LV) pour le relever.`,
      rebug: 'Recacher les bugs', bugsBack: 'Les bugs sont de retour. Attrape-les tous !',
      dareGo: t => `Défi : ${t}. C'est parti !`, dareWon: 'DÉFI RELEVÉ', dareWin: d => `Défi relevé, avec ${d} d'avance ! Envoie-lui ton lien.`, dareLose: d => `Raté de ${d}. Recache les bugs et retente.`,
      sec: ms => (ms < 60000 ? `${(ms / 1000).toFixed(1).replace('.', ',')} s` : clock(ms)),
      event: 'Événement', eventAria: 'Événement saisonnier',
      events: { auto: 'Auto (date du jour)', none: 'Aucun', winter: 'Hiver', christmas: 'Noël', newyear: 'Nouvel an', halloween: 'Halloween', april: "Poisson d'avril", birthday: 'Anniversaire du site' },
    },
  };
  const isFr = () => root.lang === 'fr';
  const u = k => UI[isFr() ? 'fr' : 'en'][k];
  const trophyText = id => (isFr() ? FR.trophies : TROPHIES)[id];
  const hintText = id => (isFr() ? FR.hints : HINTS)[id];
  const earnList = () => (isFr() ? FR.earn : EARN);
  const lineList = () => (isFr() ? FR.lines : LINES);
  const bugLines = () => (isFr() ? FR.bugLines : BUG_LINES);

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: the choice just isn't kept */ } },
    list(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } },
  };
  const motion = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = () => matchMedia('(pointer: fine)').matches;
  const isSkin = k => SKINS.some(([s]) => s === k);
  const isOn = () => root.hasAttribute('data-fun');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.random() * a.length | 0];
  const skinNow = () => root.dataset.skin || DEFAULT_SKIN;

  const hidden = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    n.setAttribute('aria-hidden', 'true');
    return n;
  };
  // A small bag of things to undo: injected nodes, listeners, timers, restorers.
  const bag = () => {
    const added = [];
    const undo = [];
    return {
      add(node, parent, before) { parent.insertBefore(node, before || null); added.push(node); return node; },
      on(target, type, fn, opts) { target.addEventListener(type, fn, opts); undo.push(() => target.removeEventListener(type, fn, opts)); },
      later(fn) { undo.push(fn); },
      clear() { undo.splice(0).reverse().forEach(fn => fn()); added.splice(0).forEach(n => n.remove()); },
    };
  };

  let dock = null;
  let core = null;
  let od = null;
  let current = -1;
  let busy = false;
  let lite = false;
  let game = null;
  const visit = { seen: new Set(), clicks: 0, stages: 9 };

  /* ================= Sound ================= */
  // Every sound is made in the browser: no files. Off by default.
  const audio = {
    ctx: null, out: null, noise: null, last: {},
    fx: store.get(SOUND_KEY) !== 'off',
    music: store.get(MUSIC_KEY) !== 'off',
    typing: store.get(TYPING_KEY) !== 'off',
    ready() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return null;
        const c = this.ctx = new AC();
        // Sounds are written quiet; the master gain brings them up and the compressor keeps peaks in check.
        this.out = c.createGain();
        this.out.gain.value = 7;
        const comp = c.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.knee.value = 6;
        comp.ratio.value = 8;
        comp.attack.value = .002;
        comp.release.value = .12;
        this.out.connect(comp).connect(c.destination);
        const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noise = buf;
      }
      if (this.ctx.state !== 'running' && this.ctx.state !== 'closed' && !document.hidden) {
        this.ctx.resume().catch(() => {});
        // Safari only opens the output for sound started inside the click itself: a silent blip does it.
        try { const b = this.ctx.createBufferSource(); b.buffer = this.ctx.createBuffer(1, 1, 22050); b.connect(this.ctx.destination); b.start(0); } catch (e) { /* not needed elsewhere */ }
      }
      return this.ctx;
    },
    live() { return this.fx && isOn() && this.ctx && this.ctx.state === 'running'; },
    // An inaudible hiss (about -84 dB) keeps the audio output open. Without it, the browser pauses a
    // silent output and the first sounds after a pause get lost while Bluetooth headphones wake up.
    awake: null,
    keepAwake(on) {
      const c = this.ctx;
      if (on && c && !this.awake) {
        const src = c.createBufferSource(), g = c.createGain();
        src.buffer = this.noise; src.loop = true; g.gain.value = .00006;
        src.connect(g).connect(c.destination); src.start();
        this.awake = src;
      } else if (!on && this.awake) {
        try { this.awake.stop(); } catch (e) { /* already stopped */ }
        this.awake = null;
      }
    },
    every(key, ms) { const n = performance.now(); if (n - (this.last[key] || 0) < ms) return false; this.last[key] = n; return true; },
    tone(f, t, dur, type = 'square', vol = .03, f2 = 0, lp = 0, dest) {
      const c = this.ctx;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + .004);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      let node = o;
      if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); node = f; }
      node.connect(g).connect(dest || this.out);
      o.start(t);
      o.stop(t + dur + .03);
    },
    hiss(t, dur, vol = .03, freq = 3000, type = 'bandpass', dest) {
      const c = this.ctx;
      const s = c.createBufferSource();
      s.buffer = this.noise;
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(f).connect(g).connect(dest || this.out);
      s.start(t, Math.random() * .5, dur + .02);
    },
    // kind is the click flavour of the place it happens: pixels (Overdrive), sparks (Y2K),
    // stars (Phantom), hex (Alert), neon, coins (8-bit).
    play(name, kind) {
      if (!this.live()) return;
      const t = this.ctx.currentTime + .005;
      const k = kind || getComputedStyle(root).getPropertyValue('--fx-click').trim() || 'pixels';
      const T = this.tone.bind(this);
      switch (name) {
        case 'hover':
          if (!this.every('hover', 70)) return;
          if (k === 'sparks') T(1800, t, .03, 'sine', .02, 2300);
          else if (k === 'stars') { this.hiss(t, .012, .025, 5000, 'highpass'); T(2093, t, .018, 'triangle', .012); }
          else if (k === 'hex') T(523, t, .025, 'sine', .014);
          else if (k === 'neon') T(660, t, .04, 'sine', .016, 720);
          else if (k === 'coins') T(1760, t, .018, 'square', .01);
          else T(2400, t, .014, 'square', .008);
          break;
        case 'click':
          if (!this.every('click', 40)) return;
          if (k === 'sparks') { T(300, t, .07, 'sine', .07, 1400); this.hiss(t, .03, .015, 6000, 'highpass'); }
          else if (k === 'stars') { this.hiss(t, .04, .05, 3500); T(1568, t, .05, 'triangle', .04); T(2093, t + .045, .08, 'triangle', .035); }
          else if (k === 'hex') { T(880, t, .06, 'sine', .03); T(660, t + .07, .08, 'sine', .025); }
          else if (k === 'neon') T(1400, t, .1, 'sawtooth', .025, 200, 2600);
          else if (k === 'coins') { T(988, t, .06, 'square', .03); T(1319, t + .06, .24, 'square', .03); }
          else { T(1500, t, .035, 'square', .02); T(750, t + .04, .04, 'square', .018); }
          break;
        case 'tick':
          if (!this.every('tick', 120)) return;
          T(k === 'hex' ? 440 : k === 'sparks' ? 1046 : k === 'neon' ? 880 : k === 'coins' ? 523 : 1200, t, .03, k === 'sparks' || k === 'hex' ? 'sine' : 'square', .02, 0, k === 'neon' ? 2000 : 0);
          break;
        case 'seg': if (this.every('seg', 60)) T(3000, t, .01, 'square', .006); break;
        case 'type': if (this.typing && this.every('type', 32)) this.hiss(t, .012, .018, rand(2200, 4500)); break;
        case 'clear': [523, 659, 784, 1047].forEach((f, i) => T(f, t + i * .1, .22, 'triangle', .011)); break;
        case 'switch': [523, 659, 784, 1047].forEach((f, i) => T(f, t + i * .05, .08, 'square', .008, 0, 1800)); break;
        case 'trophy': [784, 988, 1175, 1568].forEach((f, i) => T(f, t + i * .08, .16, 'triangle', .014)); break;
        case 'level': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => T(f, t + i * .07, .12, 'triangle', .013)); break;
        case 'whoosh': T(180, t, .28, 'sawtooth', .02, 1600, 3000); this.hiss(t, .25, .02, 1200); break;
        case 'off': T(880, t, .34, 'square', .012, 55, 2000); break;
        case 'boot': [262, 330, 392, 523, 659, 784].forEach((f, i) => T(f, t + i * .07, .1, 'square', .009, 0, 1800)); break;
        case 'jump': T(330, t, .14, 'square', .012, 880, 2000); break;
        case 'shoot': T(880, t, .08, 'square', .02, 300); break;
        case 'boom': this.hiss(t, .22, .06, 600, 'lowpass'); T(140, t, .2, 'square', .02, 40); break;
        case 'hurt': T(200, t, .3, 'sawtooth', .03, 60, 1200); break;
        case 'wave': [659, 784, 988, 1319].forEach((f, i) => T(f, t + i * .06, .1, 'triangle', .012)); break;
        case 'bug': T(620, t, .07, 'square', .01, 1500, 2400); [1047, 1319, 1760].forEach((f, i) => T(f, t + .08 + i * .06, .14, 'triangle', .012)); break;
        case 'coin': T(988, t, .07, 'square', .01, 0, 2400); T(1319, t + .07, .3, 'square', .01, 0, 2400); break;
        default:
      }
    },
  };

  /* ================= Music ================= */
  // A 32-bar song (intro, verse, chorus, break, verse) with soft drums, bass, pads and a lead.
  // The melody is rewritten every time the song comes round, so it never loops the same way.
  // Each style has its own band: lo-fi (Overdrive), glassy (Y2K), jazzy keys (Phantom),
  // ambient (Alert), synthwave (Neon), soft chiptune (8-bit). Mix plays the Overdrive band.
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  const CHORDS = {
    Fmaj7: { pad: [53, 57, 60, 64], bass: 41 }, Em7: { pad: [52, 55, 59, 62], bass: 40 },
    Dm7: { pad: [53, 57, 60, 62], bass: 38 }, Cmaj7: { pad: [52, 55, 59, 60], bass: 36 },
    Am7: { pad: [52, 55, 57, 60], bass: 45 }, G6: { pad: [55, 59, 62, 64], bass: 43 },
    Dm9: { pad: [53, 57, 60, 64], bass: 38 }, Gsus4: { pad: [55, 60, 62, 67], bass: 43 },
  };
  const SECTIONS = [
    { bars: ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7'], drums: 0, bass: 0, lead: '' },
    { bars: ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7', 'Fmaj7', 'Em7', 'Dm7', 'G6'], drums: 1, bass: 1, lead: 'a' },
    { bars: ['Am7', 'Fmaj7', 'Cmaj7', 'G6', 'Am7', 'Fmaj7', 'Dm9', 'Gsus4'], drums: 2, bass: 1, lead: 'b' },
    { bars: ['Dm9', 'Cmaj7', 'Fmaj7', 'Gsus4'], drums: 0, bass: 0, lead: 'c' },
    { bars: ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7', 'Fmaj7', 'Em7', 'G6', 'Cmaj7'], drums: 2, bass: 1, lead: 'a' },
  ];
  const BARS = SECTIONS.flatMap((sec, si) => sec.bars.map((ch, bi) => ({ ch, sec, si, bi })));
  const SONG_STEPS = BARS.length * 16;
  const SCALE = [64, 67, 69, 72, 74, 76, 79, 81, 84];
  // Two-bar rhythms for the lead: [start, length] in sixteenths.
  const RHYTHMS = [
    [[0, 3], [4, 2], [6, 2], [8, 6], [16, 2], [18, 2], [20, 4], [26, 6]],
    [[2, 2], [4, 4], [10, 2], [12, 4], [18, 3], [22, 2], [24, 8]],
    [[0, 6], [6, 2], [8, 4], [14, 2], [16, 4], [20, 2], [22, 2], [24, 6]],
    [[0, 8], [12, 4], [16, 12]],
  ];
  const BANDS = {
    overdrive: { bpm: 88, swing: .17, pad: 'saw', lp: 1100, lead: 'soft', kit: 'lofi', verb: .3 },
    y2k: { bpm: 82, swing: .1, pad: 'glass', lp: 2800, lead: 'bell', kit: 'shaker', verb: .45 },
    phantom: { bpm: 96, swing: .3, pad: 'keys', lp: 3000, lead: 'vibes', kit: 'jazz', verb: .25 },
    alert: { bpm: 64, swing: 0, pad: 'drone', lp: 900, lead: 'bell', kit: 'pulse', verb: .6 },
    neon: { bpm: 100, swing: 0, pad: 'saw', lp: 1500, lead: 'saw', kit: 'synth', verb: .35 },
    pixel: { bpm: 104, swing: 0, pad: 'square', lp: 1600, lead: 'square', kit: 'chip', verb: .15 },
  };
  const rng32 = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const clampI = (v, a, b) => Math.max(a, Math.min(b, v));

  const music = {
    timer: 0, step: 0, next: 0, bus: null, fx: null, lines: null, cycle: 0,
    wanted() { return audio.fx && audio.music && isOn(); },
    sync() {
      if (this.wanted() && audio.ready()) this.start(); else this.stop();
      audio.keepAwake(audio.fx && isOn());
    },
    // Reverb, echo and a warm low-pass, built once per audio context.
    chain() {
      const c = audio.ctx;
      if (this.fx && this.fx.c === c) return this.fx;
      const len = Math.floor(c.sampleRate * 2.4);
      const ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3.2; }
      const tone = c.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 5200; tone.Q.value = .3;
      const dry = c.createGain(); dry.connect(tone);
      const verb = c.createConvolver(); verb.buffer = ir;
      const verbIn = c.createGain(); verbIn.gain.value = .3; verbIn.connect(verb).connect(tone);
      const echo = c.createDelay(1.5), fb = c.createGain(), echoLp = c.createBiquadFilter(), echoIn = c.createGain();
      fb.gain.value = .3; echoLp.type = 'lowpass'; echoLp.frequency.value = 2200; echoIn.gain.value = .22;
      echoIn.connect(echo); echo.connect(echoLp).connect(fb).connect(echo); echoLp.connect(tone);
      this.fx = { c, tone, dry, verbIn, echo, echoIn };
      return this.fx;
    },
    start() {
      if (this.timer || !audio.ctx) return;
      trophy('music');
      const c = audio.ctx, fx = this.chain();
      this.bus = c.createGain();
      this.bus.gain.setValueAtTime(.0001, c.currentTime);
      this.bus.gain.exponentialRampToValueAtTime(.055, c.currentTime + 2);
      try { fx.tone.disconnect(); } catch (e) { /* not connected yet */ }
      fx.tone.connect(this.bus);
      this.bus.connect(audio.out);
      if (!this.lines) this.write();
      this.next = c.currentTime + .1;
      this.timer = setInterval(() => this.schedule(), 50);
    },
    stop() {
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = 0;
      const bus = this.bus;
      if (bus && audio.ctx) {
        bus.gain.setTargetAtTime(.0001, audio.ctx.currentTime, .2);
        setTimeout(() => bus.disconnect(), 1200);
      }
      this.bus = null;
    },
    // New melodies for this time round: a motif per part, answered with a different ending.
    write() {
      const rnd = rng32((Date.now() & 0xffff) + this.cycle * 7919);
      const motifs = {};
      ['a', 'b', 'c'].forEach(id => {
        const R = id === 'c' ? RHYTHMS[3] : RHYTHMS[Math.floor(rnd() * 3)];
        let idx = (id === 'b' ? 3 : 1) + Math.floor(rnd() * 3);
        const notes = R.map(() => { const n = idx; idx = clampI(idx + [-2, -1, -1, 0, 1, 1, 2][Math.floor(rnd() * 7)], 0, SCALE.length - 1); return n; });
        motifs[id] = { R, notes };
      });
      this.lines = SECTIONS.map(sec => {
        const ev = new Map();
        if (!sec.lead) return ev;
        const { R, notes } = motifs[sec.lead];
        const phrases = sec.bars.length / 2;
        for (let k = 0; k < phrases; k++) {
          if (sec.lead === 'c' && k > 1) break;
          R.forEach(([st, dur], i) => {
            let p = notes[i];
            const last = i === R.length - 1;
            if (k % 2 && i >= R.length - 3) p = clampI(p + (last ? -1 - Math.floor(rnd() * 2) : Math.floor(rnd() * 3) - 1), 0, SCALE.length - 1);
            if (k === phrases - 1 && last) p = sec.lead === 'b' ? 5 : 3;
            const abs = k * 32 + st;
            const chord = CHORDS[sec.bars[abs >> 4]].pad.map(m => m % 12);
            let m = SCALE[p];
            // Strong beats land on a note of the chord when one is close.
            if (st % 8 === 0 || last) {
              const near = SCALE.filter(n => chord.includes(n % 12)).sort((x, y) => Math.abs(x - m) - Math.abs(y - m))[0];
              if (near != null && Math.abs(near - m) <= 3) m = near;
            }
            ev.set(abs, [m, dur]);
          });
        }
        return ev;
      });
    },
    schedule() {
      const c = audio.ctx;
      if (!c || c.state !== 'running' || !this.bus) return;
      const skin = skinNow() === 'mix' ? 'overdrive' : skinNow();
      const band = BANDS[skin] || BANDS.overdrive;
      const six = 60 / band.bpm / 4;
      this.fx.verbIn.gain.setTargetAtTime(band.verb, c.currentTime, .5);
      this.fx.echo.delayTime.setTargetAtTime(six * 3, c.currentTime, .1);
      // Background tabs run timers about once a second, so notes are queued further ahead there.
      const ahead = document.hidden ? 3 : .25;
      while (this.next < c.currentTime + ahead) {
        this.play(band, this.step, this.next, six);
        this.next += six;
        this.step = (this.step + 1) % SONG_STEPS;
        if (this.step === 0) { this.cycle++; this.write(); }
      }
    },
    // One voice: oscillators into an envelope, sent to the dry mix, reverb and optionally the echo.
    voice(t, { f, type = 'sine', vol, a = .01, d = 0, s = 1, hold, r = .3, lp = 0, detune = 0, verb = 1, echo = 0, vib = 0, fm = 0 }) {
      const c = audio.ctx, fx = this.fx;
      const g = c.createGain();
      const end = t + hold + r;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + a);
      if (d) g.gain.exponentialRampToValueAtTime(Math.max(vol * s, .0001), t + a + d);
      g.gain.setValueAtTime(Math.max(vol * (d ? s : 1), .0001), t + Math.max(hold, a + d));
      g.gain.exponentialRampToValueAtTime(.0001, end);
      let out = g;
      if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; fl.Q.value = .6; g.connect(fl); out = fl; }
      out.connect(fx.dry);
      if (verb) out.connect(fx.verbIn);
      if (echo) { const e = c.createGain(); e.gain.value = echo; out.connect(e).connect(fx.echoIn); }
      const oscs = (detune ? [-detune, detune] : [0]).map(dt => {
        const o = c.createOscillator();
        o.type = type; o.frequency.value = f; o.detune.value = dt;
        o.connect(g); o.start(t); o.stop(end + .05);
        return o;
      });
      if (vib) {
        const l = c.createOscillator(), lg = c.createGain();
        l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * vib, t + .25);
        l.connect(lg); oscs.forEach(o => lg.connect(o.frequency)); l.start(t); l.stop(end + .05);
      }
      if (fm) { // bell: a modulator whose depth fades
        const m = c.createOscillator(), mg = c.createGain();
        m.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * fm, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.2);
        m.connect(mg); oscs.forEach(o => mg.connect(o.frequency)); m.start(t); m.stop(end + .05);
      }
    },
    drum(kind, t, v = 1) {
      const c = audio.ctx, fx = this.fx;
      if (kind === 'kick' || kind === 'beat') {
        const o = c.createOscillator(), g = c.createGain();
        o.frequency.setValueAtTime(kind === 'beat' ? 70 : 120, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.42 * v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .3);
        o.connect(g).connect(fx.dry); o.start(t); o.stop(t + .35);
        return;
      }
      const src = c.createBufferSource(); src.buffer = audio.noise;
      const f = c.createBiquadFilter(), g = c.createGain();
      const spec = { snare: ['bandpass', 1900, .14, .18], rim: ['bandpass', 2600, .05, .1], hat: ['highpass', 7500, .045, .06], open: ['highpass', 6500, .2, .05], shaker: ['highpass', 5500, .05, .035], brush: ['bandpass', 3200, .22, .05], ride: ['highpass', 5000, .35, .035] }[kind];
      f.type = spec[0]; f.frequency.value = spec[1];
      g.gain.setValueAtTime(spec[3] * v, t); g.gain.exponentialRampToValueAtTime(.0001, t + spec[2]);
      src.connect(f).connect(g).connect(fx.dry);
      if (kind === 'snare' || kind === 'brush') g.connect(fx.verbIn);
      src.start(t, Math.random() * .6, spec[2] + .02);
      if (kind === 'snare') this.voice(t, { f: 185, type: 'triangle', vol: .06 * v, a: .002, hold: .02, r: .08, verb: 0 });
    },
    play(band, step, t, six) {
      const bar = BARS[step >> 4], s = step & 15, sec = bar.sec, ch = CHORDS[bar.ch];
      const swing = s % 2 ? band.swing * six : 0, tt = t + swing, barDur = six * 16;
      const lvl = sec.drums, fill = lvl && bar.bi === sec.bars.length - 1;
      // Chords
      if (band.pad === 'keys') {
        if ([0, 6, 10].includes(s) && (sec.drums || s === 0)) ch.pad.forEach(m => {
          this.voice(tt, { f: hz(m), vol: s ? .02 : .028, a: .004, d: 1.4, s: .05, hold: 1.4, r: .3 });
          this.voice(tt, { f: hz(m) * 2, vol: .006, a: .002, d: .4, s: .05, hold: .4, r: .2, verb: 0 });
        });
      } else if (s === 0) {
        const p = { saw: { type: 'sawtooth', vol: .016, a: .35, detune: 7, lp: band.lp }, glass: { type: 'triangle', vol: .026, a: .5, detune: 4 }, drone: { type: 'sine', vol: .03, a: 1.4 }, square: { type: 'square', vol: .009, a: .03, d: .3, s: .7, lp: band.lp } }[band.pad];
        ch.pad.forEach(m => this.voice(t, { ...p, f: hz(m), hold: barDur, r: band.pad === 'drone' ? 1.8 : 1 }));
        if (band.pad === 'glass') this.voice(t, { f: hz(ch.pad[3] + 12), vol: .01, a: .6, hold: barDur, r: 1.2 });
        if (band.pad === 'drone') this.voice(t, { f: hz(ch.bass), type: 'triangle', vol: .05, a: 1.5, hold: barDur, r: 2, lp: 500 });
      }
      // Synthwave arpeggio, quiet and filtered, only in the chorus
      if (band.kit === 'synth' && sec.drums === 2 && s % 2 === 0) this.voice(t, { f: hz(ch.pad[(s / 2) % 4] + 12), type: 'sawtooth', vol: .012, a: .005, d: .12, s: .2, hold: six * 1.5, r: .1, lp: 1300, echo: .6 });
      // Bass
      if (sec.bass) {
        const B = (m, len, v = 1) => this.voice(tt, { f: hz(m), type: 'triangle', vol: .17 * v, a: .008, d: .25, s: .55, hold: six * len, r: .12, lp: 700, verb: 0 });
        const root = ch.bass, next = CHORDS[BARS[((step >> 4) + 1) % BARS.length].ch].bass;
        if (band.kit === 'jazz') { if (s % 4 === 0) { const third = /sus/.test(bar.ch) ? 5 : /m(?!aj)/.test(bar.ch) ? 3 : 4; const walk = [root, root + third, root + 7, next + (next > root ? -1 : 1)]; B(walk[s / 4], 3, .9); } }
        else if (band.kit === 'synth') { if (s % 2 === 0) B(s % 4 ? root + 12 : root, 1.6, .75); }
        else if (band.kit === 'chip') { if (s % 4 === 0) B(s % 8 ? root + 12 : root, 3, .8); }
        else if (band.kit === 'shaker') { if (s === 0 || s === 8) B(root, 7, .8); }
        else if (band.kit !== 'pulse') { if (s === 0) B(root, 6); if (s === 10) B(root, 4, .8); if (s === 14 && fill) B(root + 7, 2, .6); }
      }
      // Drums
      if (band.kit === 'pulse') { if (lvl && (s === 0 || s === 3)) this.drum('beat', t, s ? .45 : .7); }
      else if (lvl) {
        const k = band.kit;
        if (k === 'lofi') {
          if (s === 0 || s === 10 || (lvl === 2 && s === 7 && bar.bi % 2)) this.drum('kick', tt, s ? .8 : 1);
          if (s === 4 || s === 12) this.drum(lvl === 2 ? 'snare' : 'rim', tt, lvl === 2 ? .9 : .8);
          if (s % 2 === 0) this.drum('hat', tt, s % 4 ? .55 : .9);
          if (lvl === 2 && s === 15) this.drum('hat', tt, .3);
        } else if (k === 'shaker') {
          if (s === 0 || s === 8) this.drum('kick', tt, .7);
          if (lvl === 2 && s === 12) this.drum('rim', tt, .8);
          this.drum('shaker', tt, s % 2 ? .45 : .9);
        } else if (k === 'jazz') {
          if (s % 4 === 0 || s === 7 || s === 15) this.drum('ride', tt, s % 4 ? .6 : 1);
          if (s === 4 || s === 12) this.drum('brush', tt, lvl === 2 ? 1 : .7);
          if (s === 0 && lvl === 2) this.drum('kick', tt, .5);
        } else if (k === 'synth') {
          if (s % 4 === 0) this.drum('kick', tt, .9);
          if (s === 4 || s === 12) this.drum('snare', tt, .8);
          if (s % 4 === 2) this.drum(lvl === 2 ? 'open' : 'hat', tt, .8);
        } else if (k === 'chip') {
          if (s === 0 || s === 8 || (lvl === 2 && s === 6)) this.drum('kick', tt, .7);
          if (s === 4 || s === 12) this.drum('rim', tt, 1);
          if (s % 4 === 2) this.drum('hat', tt, .7);
        }
        if (fill && s >= 13) this.drum(k === 'jazz' ? 'brush' : 'rim', tt, .4 + (s - 13) * .2);
      }
      // Lead
      const ev = this.lines && this.lines[bar.si].get(bar.bi * 16 + s);
      if (ev) {
        const [m, len] = ev;
        const f = hz(m);
        const hold = six * len * .9;
        const L = {
          soft: { type: 'triangle', vol: .07, a: .02, d: .3, s: .6, r: .35, vib: .004, echo: .5 },
          bell: { type: 'sine', vol: .05, a: .005, d: 1.2, s: .08, r: .6, fm: 2.2, echo: .7 },
          vibes: { type: 'sine', vol: .07, a: .005, d: .9, s: .25, r: .5, vib: .003, echo: .3 },
          saw: { type: 'sawtooth', vol: .03, a: .03, d: .3, s: .7, r: .3, lp: 2000, vib: .005, echo: .6 },
          square: { type: 'square', vol: .022, a: .005, d: .2, s: .6, r: .12, lp: 3000, vib: .004, echo: .3 },
        }[band.lead];
        this.voice(tt, { ...L, f, hold });
      }
    },
  };
  // The music goes on when the tab is in the background; coming back just makes sure it is running.
  document.addEventListener('visibilitychange', () => {
    if (!audio.ctx || document.hidden || !audio.fx || !isOn()) return;
    if (audio.ctx.state !== 'running') audio.ctx.resume().catch(() => {});
    music.sync();
  });

  /* ================= XP and levels ================= */
  const xp = {
    total: Math.max(0, parseInt(store.get(XP_KEY) || '0', 10) || 0),
    session: { clicks: 0, depth: 0 },
    pending: 0, timer: 0,
    level(t = this.total) { let L = 1; while (t >= 50 * L * (L + 1)) L++; return L; },
    add(n) {
      if (!isOn() || n <= 0) return;
      const before = this.level();
      this.total += n;
      store.set(XP_KEY, String(this.total));
      this.render();
      this.pending += n;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { if (this.pending >= 5) this.popup(this.pending); this.pending = 0; }, 350);
      const after = this.level();
      if (after > before) levelUp(after);
    },
    render() {
      const chip = dock && dock.querySelector('.fx-xp');
      if (!chip) return;
      const L = this.level(), lo = 50 * (L - 1) * L, hi = 50 * L * (L + 1);
      chip.querySelector('b').textContent = `LV ${L}`;
      chip.querySelector('i').style.setProperty('--p', ((this.total - lo) / (hi - lo)).toFixed(3));
      chip.setAttribute('aria-label', u('chip')(L, this.total - lo, hi - lo));
      if (panel) renderPanel();
    },
    popup(n) {
      if (!motion() || !dock) return;
      const p = hidden('div', 'fx-xpgain');
      p.textContent = `+${n} XP`;
      document.body.append(p);
      setTimeout(() => p.remove(), 1150);
    },
  };
  function cheatBanner() {
    audio.play('level');
    if (!motion()) return;
    const o = hidden('div', 'fx-levelup fx-cheat', '<b></b><span></span>');
    o.querySelector('b').textContent = isFr() ? '30 VIES !' : '30 LIVES!';
    o.querySelector('span').textContent = isFr() ? 'CODE DE TRICHE · +100 XP' : 'CHEAT CODE · +100 XP';
    document.body.append(o);
    setTimeout(() => o.remove(), 1900);
  }
  function levelUp(L) {
    audio.play('level');
    buddy.react(9, u('level')(L));
    if (!motion()) return;
    const o = hidden('div', 'fx-levelup', '<b>LEVEL UP!</b><span></span>');
    o.querySelector('span').textContent = `LV ${L}`;
    document.body.append(o);
    setTimeout(() => o.remove(), 1900);
  }

  /* ================= Progress panel: level, achievements left, ways to earn XP ================= */
  let panel = null;
  let resetArmed = 0;
  // 83 512 ms → 1:23.5
  const clock = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${Math.floor(ms / 100) % 10}`;
  let panelOff = null;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ICON_CUP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v3H8v-3h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1.2 1.8A5 5 0 0 1 7 8zm10 0v1q0 .9-.2 1.8A2 2 0 0 0 18 8V7z"/></svg>';
  const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3z"/></svg>';
  function counter(id) {
    if (id === 'hopper') return `${Math.min(store.list(TRIED_KEY).length, SKINS.length)}/${SKINS.length}`;
    if (id === 'tour') return `${visit.seen.size}/${visit.stages}`;
    if (id === 'clicks') return `${Math.min(visit.clicks, 30)}/30`;
    if (id === 'bugs') return `${bugs.caught().length}/${BUG_SPOTS.length}`;
    if (id === 'speedrun') { const b = parseInt(store.get(BUG_BEST_KEY) || '0', 10) || 0; return b ? u('best')(clock(b)) : ''; }
    if (id === 'ace') { const hi = parseInt(store.get(HI_KEY) || '0', 10) || 0; return hi ? u('best')(hi) : ''; }
    return '';
  }
  function renderPanel() {
    const L = xp.level(), lo = 50 * (L - 1) * L, hi = 50 * L * (L + 1);
    const ids = Object.keys(TROPHIES);
    const todo = ids.filter(id => !unlocked.has(id)), done = ids.filter(id => unlocked.has(id));
    const best = parseInt(store.get(HI_KEY) || '0', 10) || 0;
    const runBest = parseInt(store.get(BUG_BEST_KEY) || '0', 10) || 0;
    const item = (id, ok) => {
      const [name, desc] = trophyText(id);
      const c = ok ? '' : counter(id);
      return `<li class="${ok ? 'ok' : 'todo'}"><span class="ico">${ok ? ICON_CUP : ICON_LOCK}</span><span class="txt"><b>${esc(name)}</b><span>${esc(ok ? desc : hintText(id))}</span></span>` +
        `<em>${c ? `<i>${esc(c)}</i>` : ''}${ok ? u('ok') : '+50 XP'}</em></li>`;
    };
    // The bug run record, with a button to send it as a challenge. It sits outside the body,
    // which is redrawn on every XP change: a redraw between pointerdown and pointerup eats the click.
    const slot = panel.querySelector('.fx-dare-row');
    if (slot.dataset.best !== String(runBest)) {
      slot.dataset.best = String(runBest);
      slot.hidden = !runBest;
      slot.innerHTML = runBest ? `<span>${esc(u('dareBest')(clock(runBest)))}</span><button type="button" class="fx-dare-btn">${esc(u('dare'))}</button>` : '';
    }
    // Only once at least one bug has been caught.
    panel.querySelector('.fx-rebug').hidden = !bugs.caught().length;
    panel.querySelector('.fx-panel-body').innerHTML =
      `<div class="lv"><b>LV ${L}</b><span>${xp.total - lo} / ${hi - lo} XP</span></div>` +
      `<div class="bar"><i style="--p:${((xp.total - lo) / (hi - lo)).toFixed(3)}"></i></div>` +
      `<p class="next">${u('next')(hi - xp.total, L + 1, xp.total)}</p>` +
      (todo.length ? `<div class="fx-sec">${u('todo')} · ${todo.length}</div><ul class="ach">${todo.map(id => item(id, false)).join('')}</ul>` : `<p class="all">${u('all')}</p>`) +
      `<div class="fx-sec">${u('earn')}</div><ul class="earn">${earnList().map(([what, n]) => `<li><span>${esc(what)}</span><b>${esc(n)}</b></li>`).join('')}</ul>` +
      (done.length ? `<div class="fx-sec">${u('done')} · ${done.length}/${ids.length}</div><ul class="ach">${done.map(id => item(id, true)).join('')}</ul>` : '') +
      (best ? `<p class="next">${u('hi')(best)}</p>` : '');
  }
  function openPanel() {
    if (panel) { closePanel(); return; }
    const chip = dock && dock.querySelector('.fx-xp');
    panel = document.createElement('div');
    panel.className = 'fx-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'fx-panel-title');
    panel.innerHTML = `<div class="fx-panel-top"><div class="fx-panel-title" id="fx-panel-title">${u('progress')}</div><button type="button" class="close" aria-label="${u('close')}">×</button></div><div class="fx-dare-row" hidden></div><div class="fx-panel-body" tabindex="0"></div><div class="fx-reset-row"><button type="button" class="fx-rebug">${u('rebug')}</button><button type="button" class="fx-reset">${u('reset')}</button><small>${esc(u('resetNote'))}</small></div>`;
    renderPanel();
    document.body.append(panel);
    if (chip) chip.setAttribute('aria-expanded', 'true');
    audio.play('switch');
    const close = panel.querySelector('.close');
    close.addEventListener('click', () => closePanel());
    // Reset: a first click arms it for three seconds, a second one does it.
    panel.addEventListener('click', e => {
      const d = e.target.closest('.fx-dare-btn');
      if (d) { shareDare(parseInt(store.get(BUG_BEST_KEY) || '0', 10) || 0, d); return; }
      if (e.target.closest('.fx-rebug')) { rebugs(); return; }
      const b = e.target.closest('.fx-reset');
      if (!b) return;
      if (performance.now() < resetArmed) { resetArmed = 0; resetProgress(); return; }
      resetArmed = performance.now() + 3000;
      b.textContent = u('resetSure');
      setTimeout(() => { if (b.isConnected && performance.now() >= resetArmed) b.textContent = u('reset'); }, 3050);
    });
    close.focus();
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
      if (e.key === 'Tab') {
        const f = [close, panel.querySelector('.fx-dare-btn'), panel.querySelector('.fx-panel-body'), panel.querySelector('.fx-rebug:not([hidden])'), panel.querySelector('.fx-reset')].filter(Boolean);
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    };
    const onDown = e => { if (!panel.contains(e.target) && !(chip && chip.contains(e.target))) closePanel(false); };
    addEventListener('keydown', onKey, true);
    addEventListener('pointerdown', onDown, true);
    panelOff = () => { removeEventListener('keydown', onKey, true); removeEventListener('pointerdown', onDown, true); };
  }
  function closePanel(refocus = true) {
    if (!panel) return;
    panelOff();
    panel.remove();
    panel = null;
    const chip = dock && dock.querySelector('.fx-xp');
    if (chip) { chip.setAttribute('aria-expanded', 'false'); if (refocus) chip.focus(); }
  }

  /* ================= Achievements ================= */
  let toasts = null;
  const unlocked = new Set(store.list(TROPHY_KEY));
  // Back to level 1: XP, achievements, styles tried, high score and bugs. Settings stay.
  function resetProgress() {
    [XP_KEY, TROPHY_KEY, TRIED_KEY, HI_KEY, BUG_KEY, BUG_SAID_KEY, BUG_BEST_KEY, SAID_KEY].forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } });
    store.set(TRIED_KEY, JSON.stringify([skinNow()]));
    unlocked.clear();
    queue.length = 0;
    xp.total = 0;
    xp.session.clicks = 0;
    visit.clicks = 0;
    xp.render();
    closePanel();
    bugs.destroy();
    try { localStorage.removeItem(BUG_TIME_KEY); } catch (e) { /* storage blocked */ }
    bugs.create();
    buddy.said = new Set();
    audio.play('boot');
    buddy.react(9, DARE ? u('dareGo')(clock(DARE)) : u('newGame'), 2600);
    setTimeout(() => trophy('start'), 1500);
  }
  // Puts the twelve bugs back without touching XP, achievements or records: a fresh bug run.
  function rebugs() {
    closePanel();
    bugs.destroy();
    [BUG_KEY, BUG_TIME_KEY].forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } });
    bugs.create();
    audio.play('boot');
    buddy.react(9, DARE ? u('dareGo')(clock(DARE)) : u('bugsBack'), 2600);
  }
  const queue = [];
  let showing = false;
  function trophy(id) {
    if (!TROPHIES[id] || unlocked.has(id) || !isOn()) return;
    unlocked.add(id);
    store.set(TROPHY_KEY, JSON.stringify([...unlocked]));
    if (panel) renderPanel();
    queue.push(id);
    nextToast();
    xp.add(50);
    buddy.react(10, 'GG!');
  }
  function nextToast() {
    if (showing || !queue.length || !toasts) return;
    showing = true;
    const id = queue.shift();
    const [name, desc] = trophyText(id);
    const t = document.createElement('div');
    t.className = 'fx-toast';
    t.innerHTML = '<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v3H8v-3h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1.2 1.8A5 5 0 0 1 7 8zm10 0v1q0 .9-.2 1.8A2 2 0 0 0 18 8V7z"/></svg></span>' +
      `<span><small>${u('unlockedToast')} · ${unlocked.size}/${Object.keys(TROPHIES).length} · +50 XP</small><b></b><span></span></span>`;
    t.querySelector('b').textContent = name;
    t.querySelector('b + span').textContent = desc;
    toasts.append(t);
    audio.play('trophy');
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => { t.remove(); showing = false; nextToast(); }, motion() ? 360 : 0);
    }, 3300);
  }

  /* ================= Text decode (reveals only) ================= */
  function scramble(el, final, frames = 20, done) {
    if (!motion()) { if (done) done(); return; }
    let f = 0;
    const chars = [...final];
    const step = () => {
      if (!isOn()) { el.textContent = final; if (done) done(); return; }
      f++;
      const solved = Math.floor(chars.length * f / frames);
      el.textContent = chars.map((c, i) => (c === ' ' || c === ' ' || i < solved) ? c : GLYPHS[Math.random() * GLYPHS.length | 0]).join('');
      audio.play('type');
      if (f < frames) requestAnimationFrame(step);
      else { el.textContent = final; if (done) done(); }
    };
    step();
  }

  /* ================= Covers: full-screen transitions ================= */
  const TIMES = { slash: [330, 400], glitch: [320, 360], bars: [340, 420], alarm: [440, 320], iris: [370, 420], win: [560, 300] };
  function overlay(type, kind, title, small) {
    let el;
    if (type === 'slash') {
      el = hidden('div', 'fx-slash', '<i></i><i></i><i></i><div class="t"><small></small><b></b></div>');
      el.dataset.k = kind;
      el.querySelector('small').textContent = small;
      el.querySelector('b').textContent = title;
    } else if (type === 'glitch') {
      el = hidden('div', 'fx-glitch', Array.from({ length: 8 }, (_, n) => `<i style="--n:${n};--o:${n % 2 ? '' : '-'}101%"></i>`).join('') + '<span class="t"></span>');
      el.querySelector('.t').textContent = title;
    } else if (type === 'bars') {
      el = hidden('div', 'fx-bars', Array.from({ length: 7 }, (_, n) => `<i style="--n:${n}"></i>`).join('') + '<span class="t"></span>');
      el.querySelector('.t').textContent = title;
    } else if (type === 'alarm') {
      el = hidden('div', 'fx-alarm', '<small>PATTERN ORANGE // 警告</small><b>警告</b><span></span>');
      el.querySelector('span').textContent = `${title} · ACTIVE`;
    } else if (type === 'iris') {
      el = hidden('div', 'fx-iris', '<i></i><b>LOADING…</b>');
    } else {
      el = hidden('div', 'fx-win', `<div class="w"><div class="bar"><span></span><span>_ □ ×</span></div><div class="body">Applying desktop theme…<div class="seg">${Array.from({ length: 16 }, (_, n) => `<i style="--n:${n}"></i>`).join('')}</div></div></div>`);
      el.querySelector('.bar span').textContent = `${title.toLowerCase()}.thm`;
    }
    return el;
  }
  // Covers the screen, runs `mid` once it's hidden, then reveals the result.
  async function cover(type, kind, title, small, mid) {
    if (!motion() || busy) { mid(); return; }
    busy = true;
    const [tin, tout] = TIMES[type];
    const el = overlay(type, kind, title, small);
    document.body.append(el);
    try {
      await wait(tin);
      mid();
      el.classList.add('out');
      await wait(tout);
    } finally {
      el.remove();
      busy = false;
    }
  }
  const SKIN_COVER = { overdrive: 'slash', phantom: 'slash', neon: 'glitch', mix: 'bars', alert: 'alarm', pixel: 'iris', y2k: 'win' };
  const label = k => (SKINS.find(([s]) => s === k) || [k, k])[1];
  const skinOf = sec => (root.dataset.skin === 'mix' ? (MIX[sec.id] || 'phantom') : root.dataset.skin) || DEFAULT_SKIN;
  const clickKind = el => (el instanceof Element ? getComputedStyle(el).getPropertyValue('--fx-click').trim() : '') || 'pixels';

  /* ================= Winter: snow and a beanie, 1 December to 6 January ================= */
  // ?winter shows it on any date, ?winter=0 hides it.
  const winter = () => {
    const q = new URLSearchParams(location.search);
    if (q.has('winter')) return q.get('winter') !== '0';
    const ev = eventPref();
    if (ev !== 'auto') return WINTRY.includes(ev);
    const d = whenNow(), m = d.getMonth(), day = d.getDate();
    return m === 11 || (m === 0 && day <= 6);
  };
  // 32 wide, drawn over the top of the buddy's head: k outline, r red, d shade, w white, g grey.
  const HAT = (() => {
    const rows = ['.............kkkkkk.............', '............kwwwwwgk............', '............kwwwwggk............', '..........kkkkggggkkkk..........'];
    [12, 15, 17, 19, 21, 22].forEach(w => {
      const l = 16 - Math.ceil(w / 2);
      rows.push('.'.repeat(l - 1) + 'k' + 'r'.repeat(w - 2) + 'dd' + 'k' + '.'.repeat(32 - l - w - 1));
    });
    rows.push('...' + 'k'.repeat(26) + '...', '...k' + 'w'.repeat(24) + 'k...', '...k' + 'wgww'.repeat(6) + 'k...', '...' + 'k'.repeat(26) + '...');
    const fill = { k: '#1a1216', r: '#e0283c', d: '#a3162a', w: '#f6f6f6', g: '#cfcfd8' };
    let out = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const c = row[x];
        let w = 1;
        while (row[x + w] === c) w++;
        if (c !== '.') out += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${fill[c]}"/>`;
        x += w;
      }
    });
    return `<svg class="fx-hat" viewBox="0 0 32 14" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
  })();
  function snowOn(add) {
    if (!motion()) return;
    const n = lite || innerWidth < 760 ? 18 : 36;
    add(hidden('div', 'fx-snow', Array.from({ length: n }, () =>
      `<i class="${pick(['a', 'b'])}" style="--x:${rand(0, 100).toFixed(1)}vw;--z:${pick([4, 5, 5, 6, 7])}px;--t:${rand(9, 18).toFixed(1)}s;--d:-${rand(0, 18).toFixed(1)}s;--o:${rand(.55, 1).toFixed(2)}"></i>`).join('')), document.body);
  }

  /* ================= The buddy's clock and calendar ================= */
  // The visitor's own time. ?when=2027-04-01T09:30 pretends it is that moment (local time).
  const whenNow = () => {
    const q = new URLSearchParams(location.search).get('when');
    const d = q ? new Date(q) : null;
    return d && !isNaN(d) ? d : new Date();
  };
  // The site went live on 31 October 2026.
  const BORN = 2026;
  // [English, French]: what he says on arrival, then a few lines he slips in later.
  const MOMENTS = {
    birthday: { pose: 10, item: 'cake', hat: 'witch', hi: n => [`The site turns ${n} today!`, `Le site a ${n} an${n > 1 ? 's' : ''} aujourd'hui !`],
      more: [['Cake, anyone?', 'Qui veut du gâteau ?'], ['No candles for the bugs.', 'Pas de bougie pour les bugs.'], ['Also, happy Halloween.', 'Et joyeux Halloween, au passage.']] },
    april: { pose: 9, hi: () => ['April fools!', "Poisson d'avril !"],
      more: [['Everything is fine. Nothing is upside down.', "Tout est normal. Rien n'est à l'envers."], ['Check your back. Just saying.', 'Regarde dans ton dos. Je dis ça…']] },
    halloween: { pose: 9, hat: 'witch', hi: () => ['Boo! Happy Halloween.', 'Bouh ! Joyeux Halloween.'],
      more: [['The real monsters are the bugs.', 'Les vrais monstres, ce sont les bugs.'], ['Trick or commit?', 'Un bonbon ou un commit ?']] },
    christmas: { pose: 9, hi: () => ['Merry Christmas!', 'Joyeux Noël !'],
      more: [['Santa ships to prod once a year.', 'Le père Noël met en prod une fois par an.'], ['I asked for fewer bugs.', "J'ai commandé moins de bugs."]] },
    nye: { pose: 10, hi: () => ['Last commit of the year?', "Dernier commit de l'année ?"],
      more: [['See you next year, bugs.', "À l'année prochaine, les bugs."]] },
    newyear: { pose: 9, hi: () => ['Happy new year! New year, new bugs.', 'Bonne année ! Nouvelle année, nouveaux bugs.'],
      more: [['Resolution: fewer bugs. Probably.', 'Résolution : moins de bugs. Sûrement.']] },
    night: { pose: 11, sleepy: true, hi: h => [h ? `It's past ${h} am… shouldn't we be asleep?` : 'Past midnight… shouldn\'t we be asleep?', h ? `Il est ${h} h passées… On devrait dormir, non ?` : 'Minuit passé… On devrait dormir, non ?'],
      more: [['*yawns*', '*bâille*'], ["Zzz… huh? I'm awake.", 'Zzz… hein ? Je dors pas.'], ['Five more minutes.', 'Encore cinq minutes.']] },
    friday: { pose: 11, hi: () => ['Friday, past 5 pm. No deploys.', 'Vendredi, 17 h passées. Pas de mise en prod.'],
      more: [['Nobody touches prod.', 'Personne ne touche à la prod.'], ['We merge on Monday. Promise.', 'On merge lundi. Promis.']] },
    morning: { pose: 10, item: 'mug', hi: () => ['Coffee first. Projects later.', "Café d'abord. Les projets ensuite."],
      more: [['Second coffee.', 'Deuxième café.'], ['Not before my coffee.', 'Pas avant mon café.']] },
    weekend: { pose: 10, hi: () => ['Browsing portfolios on a weekend? Respect.', 'Un portfolio le week-end ? Respect.'],
      more: [['Even the bugs sleep in on weekends.', 'Même les bugs font la grasse mat.']] },
    lunch: { pose: 8, hi: () => ["Lunch break? I'll watch the bugs.", 'Pause déj ? Je surveille les bugs.'],
      more: [["I'll eat later. Maybe.", 'Je mange plus tard. Peut-être.']] },
  };
  // Special days first, then the time of day.
  function momentNow() {
    const d = whenNow(), m = d.getMonth() + 1, day = d.getDate(), h = d.getHours(), wd = d.getDay(), age = d.getFullYear() - BORN;
    const at = (id, arg) => Object.assign({ id, arg }, MOMENTS[id]);
    const ev = eventPref();
    if (MOMENTS[ev]) return at(ev, ev === 'birthday' ? Math.max(1, age) : undefined);
    if (ev === 'auto') {
      if (m === 10 && day === 31 && age >= 1) return at('birthday', age);
      if (m === 4 && day === 1) return at('april');
      if (m === 10 && day >= 25) return at('halloween');
      if (m === 12 && (day === 24 || day === 25)) return at('christmas');
      if (m === 12 && day === 31) return at('nye');
      if (m === 1 && day === 1) return at('newyear');
    }
    if (h < 5) return at('night', h);
    if (wd === 5 && h >= 17) return at('friday');
    if (h >= 6 && h < 10) return at('morning');
    if (wd === 0 || wd === 6) return at('weekend');
    if (h >= 12 && h < 14) return at('lunch');
    return null;
  }
  const say2 = pair => pair[isFr() ? 1 : 0];
  // Pixel art drawn in the sprite's own 32×52 grid (y may go above the head), one string per row.
  const pixelSvg = (cls, top, rows, fill, extra = '') => {
    let out = '';
    rows.forEach((row, i) => {
      for (let x = 0; x < row.length;) {
        const c = row[x];
        let w = 1;
        while (row[x + w] === c) w++;
        if (c !== '.' && fill[c]) out += `<rect x="${x}" y="${top + i}" width="${w}" height="1" fill="${fill[c]}"/>`;
        x += w;
      }
    });
    return `<svg class="${cls}" viewBox="0 -16 32 68" shape-rendering="crispEdges" aria-hidden="true">${out}${extra}</svg>`;
  };
  // Held in the thumbs-up pose (column 10), where his hand sits in front of his chest.
  const ITEMS = {
    mug: pixelSvg('fx-item mug', 22, [
      '......s.s.......',
      '.....s.s........',
      '......s.s.......',
      '.....s.s........',
      '................',
      '....kkkkkkk.....',
      '....kcccccck....',
      '....kwwwwwgk....',
      '....kwwwwwgk....',
      '....kwrrwwgk....',
      '....kwwwwwgk....',
      '.....kkkkkk.....',
    ], { k: '#1a1216', c: '#5a3520', w: '#f6f6f6', g: '#cfcfd8', r: '#e0283c', s: '#b4b4c4' }),
    cake: pixelSvg('fx-item cake', 20, [
      '.......f........',
      '......fy........',
      '.......k........',
      '......kck.......',
      '......kck.......',
      '..kkkkkkkkkkk...',
      '.kpppwppwpppk...',
      '.kpwpppppwppk...',
      '.kbbbbbbbbbbk...',
      '.kbbbbbbbbbbk...',
      '.kppppppppppk...',
      '.kbbbbbbbbbbk...',
      'kggggggggggggk..',
      '.kkkkkkkkkkkk...',
    ], { k: '#1a1216', f: '#ff7a1a', y: '#ffd23f', c: '#7cc4ff', p: '#ff8fc7', w: '#fff3f8', b: '#8a4b2a', g: '#d8d8e0' }),
  };
  // A witch's hat for Halloween, over the top of his hair.
  const WITCH = pixelSvg('fx-hat witch', -14, [
    '......................kk........',
    '....................kkpk........',
    '..................kkppk.........',
    '................kkpppk..........',
    '...............kppppk...........',
    '..............kpppppk...........',
    '.............kppppppk...........',
    '.............kpppppppk..........',
    '............kppppppppk..........',
    '............kpppppppppk.........',
    '...........koooooooooook........',
    '...........koooooooooook........',
    '..........kppppppppppppk........',
    '..........kpppppppppppppk.......',
    '...kkkkkkkkpppppppppppppkkkkkk..',
    '..kppppppppppppppppppppppppppk..',
    '...kkkkkkkkkkkkkkkkkkkkkkkkkk...',
  ], { k: '#1a1216', p: '#3b2559', o: '#ff7a1a' });
  // April fools: the page turns upside down for a moment, the buddy stays on his feet.
  let aprilDone = false;
  function aprilFlip(then) {
    const page = document.querySelector('body > .wrap') || document.querySelector('main');
    if (aprilDone || !motion() || !page) { then(); return; }
    aprilDone = true;
    page.style.transformOrigin = `50% ${(scrollY + innerHeight / 2 - page.getBoundingClientRect().top - scrollY).toFixed(0)}px`;
    page.classList.add('fx-april');
    setTimeout(then, 1300);
    setTimeout(() => { page.classList.remove('fx-april'); page.style.transformOrigin = ''; }, 3400);
  }

  /* ================= The pixel buddy ================= */
  const spr = (c, r, extra = '') => `<span class="fx-spr${extra}" style="--c:${c};--r:${r}"></span>`;
  const buddy = {
    el: null, s: null, say: null, x: -90, timer: 0, talkTimer: 0, idleTimer: 0, until: 0, asleep: false, dir: 0, walkEnd: 0,
    arrived: false, lastComment: 0, said: new Set(), waiting: new Set(), held: false, flying: false, noClick: false, raf: 0, fx: 0, fy: 0, mo: null, gen: 0, lastTalk: 0, chat: 0,
    row() { return OUTFIT[skinNow()] || 0; },
    frame(c, walk = false, c0 = 0) {
      if (!this.s) return;
      // The mug or the cake only shows in the thumbs-up pose, where his hand holds it.
      this.el.classList.toggle('c10', c === 10 && !walk);
      this.s.style.setProperty('--c', c);
      this.s.style.setProperty('--r', this.row());
      this.s.classList.toggle('l', c0 === 4);
      this.s.classList.toggle('walk', walk && motion());
    },
    create() {
      if (this.el || !isOn()) return;
      this.gen++;
      this.mo = momentNow();
      const mo = this.mo;
      this.el = hidden('div', 'fx-buddy', `<div class="hop">${spr(8, 0)}${winter() ? HAT : ''}${mo && mo.hat === 'witch' ? WITCH : ''}${mo && mo.item ? ITEMS[mo.item] : ''}<span class="say"></span></div>`);
      this.s = this.el.querySelector('.fx-spr');
      this.say = this.el.querySelector('.say');
      // The poof class must not outlive its animation, or it keeps the walk cycle from playing.
      this.s.addEventListener('animationend', e => { if (e.animationName === 'fx-poof' && this.el) this.el.classList.remove('poof'); });
      this.el.addEventListener('pointerdown', e => this.grab(e));
      this.el.addEventListener('click', e => {
        e.stopPropagation();
        if (this.noClick) return; // the end of a throw, not a click
        this.wake();
        this.jump();
        if (Math.random() < .6) this.quip(true); else this.talk(pick(lineList()), 2200);
        if (xp.session.clicks < 40) xp.add(2);
      });
      document.body.append(this.el);
      this.arrived = false;
      this.said = new Set(store.list(SAID_KEY));
      this.waiting = new Set();
      this.x = -90;
      this.el.style.setProperty('--x', `${this.x}px`);
      this.frame(8);
      // Walk in once the boot screen (if any) is gone.
      const arrive = () => {
        if (!this.el) return;
        if (document.querySelector('.od-boot')) { setTimeout(arrive, 300); return; }
        this.walkTo(rand(40, Math.min(innerWidth * .4, 420)), () => { this.arrived = true; this.greet(); });
      };
      if (motion()) setTimeout(arrive, 900);
      else { this.x = 16; this.el.style.setProperty('--x', '16px'); this.arrived = true; const g = this.gen; setTimeout(() => this.greet(0, g), 900); }
      this.schedule();
      this.poke();
      clearInterval(this.chat);
      this.chat = setInterval(() => this.chatter(), 1000);
    },
    // A line as soon as he has said nothing for 15 s: a quip most of the time, else a word on the day or a tip.
    // Not while he sleeps, flies, is held, or the game or the tab hides him.
    chatter() {
      if (!this.el || !this.arrived || this.asleep || this.held || this.flying || game || document.hidden || this.el.hidden) return;
      const now = performance.now();
      if (now - this.lastTalk < 15000) return;
      const walking = now < this.walkEnd;
      if (!walking && now < this.until) return;
      const r = Math.random(), mo = this.mo;
      const line = mo && r < .12 ? [mo.pose, say2(pick(mo.more))] : r < .2 ? [8, pick(lineList())] : null;
      if (!line) { this.quip(walking); return; }
      if (walking) this.talk(line[1], 3000); else this.react(line[0], line[1], 3000);
    },
    // A line from QUIPS, never twice until all have been said (kept between visits).
    quip(talkOnly = false) {
      let said = store.list(QUIP_KEY).filter(i => i < QUIPS.length);
      if (said.length >= QUIPS.length) said = [];
      const i = pick(QUIPS.map((_, k) => k).filter(k => !said.includes(k)));
      said.push(i);
      store.set(QUIP_KEY, JSON.stringify(said));
      const text = say2(QUIPS[i]);
      if (talkOnly) this.talk(text, 3400); else this.react(pick([8, 9, 10, 11]), text, 3400);
    },
    // A challenge link first, then the day or the time of day, else a plain hello.
    greet(tries = 0, g = this.gen) {
      if (!this.el || g !== this.gen) return;
      // On a first visit the "start" achievement lands about now: let its GG go first.
      if (tries < 12 && (!unlocked.has('start') || performance.now() < this.until)) { setTimeout(() => this.greet(tries + 1, g), 400); return; }
      if (DARE && isOn()) { this.react(9, (bugs.caught().length ? u('dareReset') : u('dareIn'))(clock(DARE)), 4200); return; }
      const mo = this.mo;
      if (!mo) { this.talk(u('hello'), 1800); return; }
      const line = say2(mo.hi(mo.arg));
      if (mo.id === 'april') aprilFlip(() => this.react(mo.pose, line, 3000));
      else this.react(mo.pose, line, 3000);
    },
    destroy() {
      clearTimeout(this.timer); clearTimeout(this.talkTimer); clearTimeout(this.idleTimer); clearTimeout(this.walkDone); clearInterval(this.chat);
      this.walkThen = null;
      this.gen++;
      cancelAnimationFrame(this.raf);
      this.held = this.flying = false;
      if (this.el) this.el.remove();
      this.el = this.s = this.say = null;
    },
    hide(v) { if (this.el) this.el.hidden = v; },
    schedule() {
      clearTimeout(this.timer);
      if (!this.el) return;
      this.timer = setTimeout(() => {
        if (!this.el || this.asleep || document.hidden || performance.now() < this.until || !motion()) { this.schedule(); return; }
        // Walks and poses; his lines come from chatter().
        if (Math.random() < .65) this.walkTo(rand(16, innerWidth - 90));
        else this.react(pick([9, 10, 11]), '', 1600);
        this.schedule();
      }, rand(6000, 12000));
    },
    walkTo(x, then) {
      if (!this.el || !motion() || this.held || this.flying) return;
      const dist = Math.abs(x - this.x);
      if (dist < 4) { if (then) then(); return; }
      const t = dist / 75;
      this.dir = x > this.x ? 0 : 4;
      this.frame(this.dir, true, this.dir);
      this.el.style.setProperty('--t', `${t}s`);
      this.el.style.setProperty('--x', `${x}px`);
      this.el.classList.toggle('r', x > innerWidth / 2);
      this.x = x;
      this.until = this.walkEnd = performance.now() + t * 1000;
      clearTimeout(this.walkDone);
      this.walkThen = then || null;
      this.walkDone = setTimeout(() => { this.walkEnd = 0; this.frame(8); const f = this.walkThen; this.walkThen = null; if (f) f(); }, t * 1000);
    },
    // A walk cut short (a GG, a grab) still runs what was to follow, such as his arrival, once he is free.
    later(ms) { const f = this.walkThen, g = this.gen; this.walkThen = null; if (f) setTimeout(() => { if (g === this.gen) f(); }, ms); },
    jump() {
      if (!this.el || !motion()) return;
      this.el.classList.remove('jump');
      void this.el.offsetWidth;
      this.el.classList.add('jump');
      audio.play('jump');
    },
    talk(text, ms = 2000) {
      if (!this.el || !text) return;
      this.say.textContent = text;
      this.lastTalk = performance.now();
      this.say.classList.toggle('wrap', text.length > 28);
      this.el.classList.add('talk');
      clearTimeout(this.talkTimer);
      this.talkTimer = setTimeout(() => this.el && this.el.classList.remove('talk'), ms);
    },
    react(col, text, ms = 1800) {
      if (!this.el) return;
      if (this.held || this.flying) { if (text) this.talk(text, ms); return; }
      this.wake();
      clearTimeout(this.walkDone);
      this.later(ms + 200);
      this.walkEnd = 0;
      // Stop where he is.
      const r = this.el.getBoundingClientRect();
      if (Math.abs(r.left - this.x) > 2) { this.x = r.left; this.el.style.setProperty('--t', '0s'); this.el.style.setProperty('--x', `${this.x}px`); }
      this.frame(col);
      if (text) this.talk(text, ms);
      this.until = performance.now() + ms;
      setTimeout(() => { if (this.el && performance.now() >= this.until - 20 && !this.asleep) this.frame(8); }, ms);
    },
    outfit() {
      if (!this.el) return;
      // Mid-walk he keeps walking in the new outfit; standing still, he faces the visitor.
      if (performance.now() < this.walkEnd) this.frame(this.dir, true, this.dir);
      else this.frame(this.asleep ? 11 : 8);
      if (motion()) { this.el.classList.remove('poof'); void this.el.offsetWidth; this.el.classList.add('poof'); }
      this.talk(u('outfit'), 1400);
    },
    poke() {
      this.wake();
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.sleep(), this.mo && this.mo.sleepy ? 12000 : 25000);
    },
    sleep() {
      if (!this.el || game || this.held || this.flying) return;
      this.asleep = true;
      this.frame(11);
      this.say.textContent = 'Zzz…';
      this.el.classList.add('sleep');
    },
    wake() {
      if (!this.asleep || !this.el) return;
      this.asleep = false;
      this.el.classList.remove('sleep', 'talk');
      this.frame(8);
    },
    // A word on each project, once per visit, when the visitor stops on it (not while scrolling
    // past, and not before he has walked in).
    comment(id, sec) {
      if (!COMMENTS[id] || this.said.has(id) || this.waiting.has(id)) return;
      this.waiting.add(id);
      const t0 = performance.now();
      const check = () => {
        if (!this.el) { this.waiting.delete(id); return; }
        const r = sec.getBoundingClientRect(), now = performance.now();
        const gone = r.bottom < 0 || r.top > innerHeight || now - t0 > 15000;
        const settled = r.top < innerHeight * .55 && r.bottom > innerHeight * .45;
        if (gone) { this.waiting.delete(id); return; }
        if (settled && this.arrived && !game && !this.asleep && !this.held && !this.flying && now - this.lastComment > 5000 && now >= this.until) {
          this.waiting.delete(id);
          this.said.add(id);
          store.set(SAID_KEY, JSON.stringify([...this.said]));
          this.lastComment = now;
          const [pose, en, fr] = COMMENTS[id];
          this.react(pose, isFr() ? fr : en, 3400);
          return;
        }
        setTimeout(check, 500);
      };
      setTimeout(check, 700);
    },
    // Grab him and throw him: gravity, bounces off the edges of the window, then he gets up grumbling.
    grab(e) {
      if (!motion() || e.button > 0 || game || this.flying) return;
      const el = this.el, r = el.getBoundingClientRect();
      const ox = e.clientX - r.left, oy = e.clientY - r.top, sx = e.clientX, sy = e.clientY;
      const trail = [];
      let dragging = false;
      const move = ev => {
        if (!dragging) {
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
          dragging = true;
          this.hold();
        }
        this.put(ev.clientX - ox, ev.clientY - oy - this.ground());
        trail.push([ev.clientX, ev.clientY, performance.now()]);
        while (trail.length > 2 && trail[trail.length - 1][2] - trail[0][2] > 90) trail.shift();
      };
      const up = () => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', up);
        removeEventListener('pointercancel', up);
        if (!dragging || !this.el) return;
        this.noClick = true;
        setTimeout(() => { this.noClick = false; }, 0);
        const a = trail[0], b = trail[trail.length - 1];
        const dt = a && b && b[2] > a[2] ? (b[2] - a[2]) / 1000 : 0;
        this.fly(dt ? (b[0] - a[0]) / dt : 0, dt ? (b[1] - a[1]) / dt : 0);
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
      addEventListener('pointercancel', up);
    },
    // Top of his box when he stands on his line.
    ground() { return innerHeight - parseFloat(getComputedStyle(this.el).bottom) - this.el.offsetHeight; },
    put(x, y) {
      if (!this.el) return;
      this.fx = Math.max(0, Math.min(innerWidth - this.el.offsetWidth, x));
      this.fy = Math.min(0, Math.max(-this.ground(), y));
      this.el.style.setProperty('--x', `${this.fx.toFixed(1)}px`);
      this.el.style.setProperty('--y', `${this.fy.toFixed(1)}px`);
    },
    hold() {
      this.wake();
      clearTimeout(this.walkDone);
      this.later(3000);
      this.walkEnd = 0;
      this.held = true;
      this.until = Infinity;
      const r = this.el.getBoundingClientRect();
      this.fx = r.left;
      this.fy = r.top - this.ground();
      this.el.classList.add('held');
      this.frame(9);
      this.talk(u('whoa'), 900);
    },
    fly(vx, vy) {
      this.held = false;
      this.flying = true;
      const lim = v => Math.max(-2800, Math.min(2800, v));
      vx = lim(vx); vy = lim(vy);
      const thrown = Math.hypot(vx, vy) > 600;
      let last = performance.now();
      const step = now => {
        if (!this.el) return;
        const dt = Math.min(.033, (now - last) / 1000);
        last = now;
        const maxX = innerWidth - this.el.offsetWidth, top = -this.ground();
        vy += 2600 * dt;
        let x = this.fx + vx * dt, y = this.fy + vy * dt;
        if (x < 0 || x > maxX) { x = x < 0 ? 0 : maxX; vx = -vx * .6; }
        if (y < top) { y = top; vy = -vy * .5; }
        if (y > 0) {
          y = 0;
          if (Math.abs(vy) > 280) { vy = -vy * .42; vx *= .8; audio.play('jump'); } else { vy = 0; vx *= .86; }
        }
        this.put(x, y);
        if (this.fy === 0 && vy === 0 && Math.abs(vx) < 14) { this.land(thrown); return; }
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    },
    land(thrown) {
      this.flying = false;
      this.el.classList.remove('held');
      this.x = this.fx;
      this.el.style.setProperty('--t', '0s');
      this.el.classList.toggle('r', this.x > innerWidth / 2);
      this.until = 0;
      const o = pick(OUCH);
      this.react(11, o[isFr() ? 1 : 0], 2200);
      if (thrown) setTimeout(() => trophy('yeet'), 2300);
    },
    near(x, y) {
      if (!this.el || this.el.hidden) return false;
      const r = this.el.getBoundingClientRect();
      return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < 150;
    },
  };

  /* ================= Hidden bugs ================= */
  // Twelve little bugs peek out from the edges of things. Click one to catch it: it says
  // something, flies off and stays caught (localStorage). The spots follow the layout,
  // which changes with the style and the window size.
  // [id, host, target inside the host ('' = the host), edge it peeks from, position along that edge]
  const BUG_SPOTS = [
    ['top', 'header.top', '.mark .glyph', 'bottom', .5],
    ['roughcut', '#roughcut', '.stage .inset', 'top', .78],
    ['earshot', '#earshot', '.stage video', 'left', .8],
    ['vigie', '#vigie', '.fact', 'right', .5],
    ['boulito', '#boulito', '.stage > img', 'bottom', .5],
    ['takeline', '#takeline', '.stage .screen', 'top', .14],
    ['trackmend', '#trackmend', '.stage img', 'bottom', .22],
    ['doc-indexer', '#doc-indexer', '.stage img', 'left', .35],
    ['mac-toolkit', '#mac-toolkit', '.stage .term', 'right', .7],
    ['lantern', '#lantern', '.stage img', 'right', .3],
    ['upstream', '#upstream', '.stage pre', 'top', .8],
    ['bottom', 'footer', '.fx-coin', 'top', .8],
  ];
  // 16×16, two frames (antennae and legs move, eyes look the other way).
  // k outline and head, w eye, b shell (the section's accent colour), s shine.
  const BUG_ART = [[
    '...k........k...', '....k......k....', '.....k....k.....', '....kkkkkkkk....',
    '...kkkkkkkkkk...', '..kkwwkkkkwwkk..', '..kkwkkkkkwkkk..', '..kkkkkkkkkkkk..',
    '...kkkkkkkkkk...', 'k.kbbsbbkbbbbk.k', '.kbbsbbbkbbkbbk.', 'kkbbbbbbkbbbbbkk',
    '.kbkbbbbkbbbbbk.', 'kkbbbbbbkbbbkbkk', '..kbbbbbkbbbbk..', '...kkkkkkkkkk...',
  ], [
    '..k..........k..', '...k........k...', '.....k....k.....', '....kkkkkkkk....',
    '...kkkkkkkkkk...', '..kkwwkkkkwwkk..', '..kkkwkkkkkwkk..', '..kkkkkkkkkkkk..',
    '...kkkkkkkkkk...', '..kbbsbbkbbbbk..', 'kkbbsbbbkbbkbbkk', '.kbbbbbbkbbbbbk.',
    'kkbkbbbbkbbbbbkk', '.kbbbbbbkbbbkbk.', 'k.kbbbbbkbbbbk.k', '...kkkkkkkkkk...',
  ]];
  const BUG_FILL = { k: '#0a0a0b', w: '#fff', b: 'currentColor', s: 'rgb(255 255 255 / .75)' };
  let bugSvg = '';
  function bugMarkup() {
    if (bugSvg) return bugSvg;
    const frame = (rows, cls) => {
      let out = '';
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length;) {
          const c = row[x];
          let w = 1;
          while (row[x + w] === c) w++;
          if (c !== '.') out += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${BUG_FILL[c]}"/>`;
          x += w;
        }
      });
      return `<g class="${cls}">${out}</g>`;
    };
    bugSvg = `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">${frame(BUG_ART[0], 'fa')}${frame(BUG_ART[1], 'fb')}</svg>`;
    return bugSvg;
  }
  const bugs = {
    items: [], ro: null, io: null, raf: 0, onResize: null,
    // The bug run clock starts with the first bug caught. It counts only while the page is on screen
    // and carries over between visits (localStorage) until the last bug, so the first time someone
    // catches them all, they get their time.
    timed: false, acc: 0, seg: 0, onVis: null, onSave: null, saveTick: 0, chip: null, tick: 0,
    elapsed() { return this.acc + (this.seg ? performance.now() - this.seg : 0); },
    clockSave() { if (this.timed) store.set(BUG_TIME_KEY, String(Math.round(this.elapsed()))); },
    clockStart(caughtCount) {
      const saved = store.get(BUG_TIME_KEY);
      // Bugs caught before the clock existed: that run stays untimed until the bugs are hidden again.
      this.timed = caughtCount === 0 || saved !== null;
      if (!this.timed) return;
      this.acc = parseInt(saved || '0', 10) || 0;
      this.seg = document.hidden ? 0 : performance.now();
      this.clockSave();
      this.onVis = () => {
        if (document.hidden) { if (this.seg) { this.acc += performance.now() - this.seg; this.seg = 0; } this.clockSave(); }
        else if (!this.seg) this.seg = performance.now();
      };
      this.onSave = () => this.clockSave();
      document.addEventListener('visibilitychange', this.onVis);
      addEventListener('pagehide', this.onSave);
      this.saveTick = setInterval(this.onSave, 5000);
    },
    clockStop() {
      if (this.onVis) document.removeEventListener('visibilitychange', this.onVis);
      if (this.onSave) removeEventListener('pagehide', this.onSave);
      clearInterval(this.saveTick);
      // Bugs still out there: keep the time for the next visit.
      if (this.timed && this.items.length) this.clockSave();
      this.onVis = this.onSave = null;
      this.timed = false;
      this.seg = 0;
    },
    caught() { return store.list(BUG_KEY).filter(id => BUG_SPOTS.some(([s]) => s === id)); },
    create() {
      if (this.items.length || !isOn()) return;
      const caught = new Set(this.caught());
      this.ro = new ResizeObserver(() => this.place());
      this.io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)), { rootMargin: '120px' });
      BUG_SPOTS.forEach(spot => {
        const [id, hostSel, targetSel] = spot;
        const host = document.querySelector(hostSel);
        if (caught.has(id) || !host) return;
        const el = hidden('span', 'fx-bug', bugMarkup());
        el.style.setProperty('--d', `${-rand(0, 7).toFixed(2)}s`);
        el.querySelector('svg').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); this.catch(item); });
        host.append(el);
        const item = { id, spot, el, host };
        this.items.push(item);
        this.ro.observe(host);
        const t = targetSel && host.querySelector(targetSel);
        if (t) this.ro.observe(t);
        this.io.observe(el);
      });
      this.onResize = () => this.place();
      addEventListener('resize', this.onResize);
      if (document.fonts) document.fonts.ready.then(() => this.place());
      this.place();
      // A run already under way (from an earlier visit): the clock goes on, and its timer shows.
      if (this.items.length && caught.size) {
        this.clockStart(caught.size);
        if (this.timed) { this.runStart(); this.chip.querySelector('span').textContent = `${caught.size}/${BUG_SPOTS.length}`; }
      }
    },
    destroy() {
      this.clockStop();
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      if (this.io) this.io.disconnect();
      if (this.onResize) removeEventListener('resize', this.onResize);
      this.items.forEach(({ el }) => el.remove());
      this.items = [];
      this.ro = this.io = this.onResize = null;
      clearInterval(this.tick);
      if (this.chip) this.chip.remove();
      this.chip = null;
    },
    // Puts each bug against its edge. Layout boxes, not what is on screen: windows that slide
    // or tilt in on scroll would otherwise drag the bug off with their first frame.
    // Left and right edges too close to the window's sides (one column on phones) fall back to the top.
    place() {
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(() => {
        const vw = document.documentElement.clientWidth;
        const box = (t, host) => {
          if (t === host) return { x: -host.clientLeft, y: -host.clientTop, w: host.offsetWidth, h: host.offsetHeight };
          let x = 0, y = 0, n = t;
          while (n && n !== host) {
            x += n.offsetLeft; y += n.offsetTop;
            const p = n.offsetParent;
            if (p && p !== host) { x += p.clientLeft; y += p.clientTop; }
            n = p;
          }
          return n === host ? { x, y, w: t.offsetWidth, h: t.offsetHeight } : null;
        };
        this.items.forEach(({ spot, el, host }) => {
          if (el.classList.contains('got')) return;
          const [, , targetSel, edge, f] = spot;
          const t = targetSel ? host.querySelector(targetSel) : host;
          const r = t && t.getClientRects().length ? box(t, host) : null;
          if (!r || !r.w || !r.h) { el.hidden = true; return; }
          el.hidden = false;
          const S = el.offsetWidth;
          const ox = host.getBoundingClientRect().left + host.clientLeft;
          let side = edge;
          if ((side === 'left' && ox + r.x - S < 6) || (side === 'right' && ox + r.x + r.w + S > vw - 6)) side = 'top';
          let x, y;
          if (side === 'top' || side === 'bottom') { x = r.x + f * r.w - S / 2; y = side === 'top' ? r.y - S : r.y + r.h; }
          else { x = side === 'left' ? r.x - S : r.x + r.w; y = r.y + f * r.h - S / 2; }
          x = Math.max(6 - ox, Math.min(vw - S - 6 - ox, x));
          el.dataset.side = side;
          el.style.left = `${x.toFixed(1)}px`;
          el.style.top = `${y.toFixed(1)}px`;
        });
      });
    },
    catch(item) {
      const { id, el } = item;
      const caught = new Set(this.caught());
      if (caught.has(id) || el.classList.contains('got')) return;
      caught.add(id);
      store.set(BUG_KEY, JSON.stringify([...caught]));
      const n = caught.size, total = BUG_SPOTS.length;
      // The first bug of a run starts the clock.
      if (n === 1 && !this.timed) this.clockStart(0);
      const ms = this.timed ? this.elapsed() : 0;
      if (this.timed && !this.chip) this.runStart();
      let text;
      if (n >= total) {
        text = isFr() ? FR.bugLast : BUG_LAST;
        if (this.timed) text += ` (${clock(ms)})`;
      }
      else {
        const all = bugLines().map((_, i) => i);
        let said = store.list(BUG_SAID_KEY).filter(i => i < all.length);
        if (said.length >= all.length) said = [];
        const i = pick(all.filter(k => !said.includes(k)));
        said.push(i);
        store.set(BUG_SAID_KEY, JSON.stringify(said));
        text = bugLines()[i];
      }
      this.say(el, `BUG ${n}/${total}`, text);
      el.classList.add('got');
      this.items = this.items.filter(it => it !== item);
      setTimeout(() => el.remove(), motion() ? 1000 : 0);
      audio.play('bug');
      xp.add(15);
      trophy('bug');
      if (n >= total) trophy('bugs');
      if (this.timed) this.runStep(n, total, ms);
      if (panel) renderPanel();
    },
    // A small timer in the corner while a run is on.
    runStart() {
      this.chip = hidden('div', 'fx-run', `<b></b><span></span>${DARE ? `<i>${u('dareChip')(clock(DARE))}</i>` : ''}`);
      document.body.append(this.chip);
      const draw = () => { if (this.chip && !this.chip.classList.contains('done')) this.chip.querySelector('b').textContent = `${u('run')} ${clock(this.elapsed())}`; };
      draw();
      this.tick = setInterval(draw, 100);
    },
    runStep(n, total, ms) {
      if (!this.chip) return;
      this.chip.querySelector('span').textContent = `${n}/${total}`;
      if (n < total) return;
      clearInterval(this.tick);
      // The run is over: stop the clock and forget its time.
      this.clockStop();
      try { localStorage.removeItem(BUG_TIME_KEY); } catch (e) { /* storage blocked */ }
      const best = parseInt(store.get(BUG_BEST_KEY) || '0', 10) || 0;
      const record = !best || ms < best;
      if (record) store.set(BUG_BEST_KEY, String(Math.round(ms)));
      this.chip.classList.add('done');
      this.chip.querySelector('b').textContent = `${record ? u('record') : u('run')} ${clock(ms)}`;
      if (ms < 180000) setTimeout(() => trophy('speedrun'), 900);
      if (DARE) {
        const won = ms < DARE;
        if (won) this.chip.querySelector('i').textContent = u('dareWon');
        setTimeout(() => buddy.react(won ? 10 : 11, won ? u('dareWin')(u('sec')(DARE - ms)) : u('dareLose')(u('sec')(ms - DARE)), 4200), 1400);
        if (won) setTimeout(() => trophy('dare'), 2600);
      }
      dareCard(ms);
      const chip = this.chip;
      this.chip = null;
      setTimeout(() => chip.remove(), 7000);
    },
    // The speech bubble lives in the page (not in the bug, which may be turned on its side).
    say(el, tag, text) {
      const r = el.getBoundingClientRect();
      const b = hidden('div', 'fx-bug-say', '<small></small><span></span>');
      b.querySelector('small').textContent = tag;
      b.querySelector('span').textContent = text;
      b.style.setProperty('--bug', getComputedStyle(el).color);
      document.body.append(b);
      const vw = document.documentElement.clientWidth, w = b.offsetWidth, h = b.offsetHeight;
      const cx = Math.max(w / 2 + 8, Math.min(vw - w / 2 - 8, r.left + r.width / 2));
      const below = r.top - h - 14 < 8;
      b.classList.toggle('below', below);
      b.style.left = `${cx + scrollX}px`;
      b.style.top = `${(below ? r.bottom : r.top) + scrollY}px`;
      setTimeout(() => b.remove(), 3400);
    },
  };

  /* ================= Challenge someone: a link with your bug run time ================= */
  const dareLink = ms => `${SITE}?dare=${Math.round(ms)}`;
  async function shareDare(ms, btn) {
    const text = u('dareText')(clock(ms)), url = dareLink(ms);
    // Phones get the share sheet; computers get the link in the clipboard.
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      const was = btn.textContent;
      btn.textContent = u('copied');
      btn.classList.add('ok');
      setTimeout(() => { if (btn.isConnected) { btn.textContent = was; btn.classList.remove('ok'); } }, 2200);
    } catch (e) {
      // No clipboard (an old browser, an iframe): show the link, selected, to copy by hand.
      const box = document.createElement('input');
      box.className = 'fx-dare-link';
      box.readOnly = true;
      box.value = `${text} ${url}`;
      box.setAttribute('aria-label', u('copyThis'));
      btn.replaceWith(box);
      box.focus();
      box.select();
    }
    audio.play('switch');
  }
  // Right after a full run: the time and a button to challenge someone.
  let dareBox = null;
  function dareCard(ms) {
    if (dareBox) dareBox.remove();
    const card = document.createElement('div');
    card.className = 'fx-dare';
    card.setAttribute('role', 'status');
    card.innerHTML = `<b>${esc(clock(ms))}</b><button type="button" class="go">${esc(u('dare'))}</button><button type="button" class="x" aria-label="${esc(u('close'))}">×</button>`;
    card.querySelector('.go').addEventListener('click', e => { e.stopPropagation(); shareDare(ms, e.currentTarget); });
    card.querySelector('.x').addEventListener('click', e => { e.stopPropagation(); card.remove(); });
    document.body.append(card);
    dareBox = card;
    setTimeout(() => { if (card.isConnected && !card.contains(document.activeElement)) card.remove(); }, 30000);
  }

  /* ================= Event menu (dock): pick a seasonal event by hand ================= */
  let evMenu = null, evOff = null;
  function syncEventButton() {
    const b = dock && dock.querySelector('.fx-event');
    if (!b) return;
    const v = eventPref();
    b.classList.toggle('on', v !== 'auto');
    b.setAttribute('aria-label', `${u('eventAria')}${isFr() ? ' : ' : ': '}${u('events')[v]}`);
  }
  function closeEventMenu(refocus) {
    if (!evMenu) return;
    evMenu.remove();
    evMenu = null;
    if (evOff) evOff();
    evOff = null;
    const b = dock && dock.querySelector('.fx-event');
    if (b) { b.setAttribute('aria-expanded', 'false'); if (refocus) b.focus(); }
  }
  function eventMenu(btn) {
    if (evMenu) { closeEventMenu(true); return; }
    const cur = eventPref();
    evMenu = document.createElement('div');
    evMenu.className = 'fx-ev-menu';
    evMenu.setAttribute('role', 'menu');
    evMenu.setAttribute('aria-label', u('eventAria'));
    evMenu.innerHTML = EVENTS.map(k => `<button type="button" role="menuitemradio" aria-checked="${k === cur}" data-ev="${k}">${esc(u('events')[k])}</button>` +
      (k === 'none' ? '<span class="sep" role="separator"></span>' : '')).join('');
    document.body.append(evMenu);
    // Above the button, kept inside the window.
    const r = btn.getBoundingClientRect(), w = evMenu.offsetWidth;
    evMenu.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)).toFixed(0)}px`;
    evMenu.style.bottom = `${(innerHeight - r.top + 10).toFixed(0)}px`;
    btn.setAttribute('aria-expanded', 'true');
    audio.play('switch');
    const items = [...evMenu.querySelectorAll('[data-ev]')];
    (items.find(i => i.getAttribute('aria-checked') === 'true') || items[0]).focus();
    evMenu.addEventListener('click', e => {
      const it = e.target.closest('[data-ev]');
      if (!it) return;
      setEvent(it.dataset.ev);
      closeEventMenu(true);
    });
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); closeEventMenu(true); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const i = items.indexOf(document.activeElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1) + items.length) % items.length].focus();
      }
      if (e.key === 'Tab') closeEventMenu(false);
    };
    const onDown = e => { if (!evMenu.contains(e.target) && !btn.contains(e.target)) closeEventMenu(false); };
    const onResize = () => closeEventMenu(false);
    addEventListener('keydown', onKey, true);
    addEventListener('pointerdown', onDown, true);
    addEventListener('resize', onResize);
    evOff = () => { removeEventListener('keydown', onKey, true); removeEventListener('pointerdown', onDown, true); removeEventListener('resize', onResize); };
  }
  // Applies at once: snow on or off, and the buddy walks back in dressed for it.
  function setEvent(v) {
    if (!EVENTS.includes(v)) return;
    store.set(EVENT_KEY, v);
    syncEventButton();
    aprilDone = false;
    if (!isOn()) return;
    document.querySelectorAll('.fx-snow').forEach(n => n.remove());
    if (winter() && core) snowOn(core.add);
    buddy.destroy();
    buddy.create();
  }

  /* ================= Menu poses and the sliding selection ================= */
  const menuLinks = () => document.querySelectorAll('.index ol a');
  function moveSel(pop) {
    const sel = document.querySelector('.fx-sel');
    const a = menuLinks()[current];
    if (!sel || !a) return;
    const li = a.parentElement;
    sel.style.translate = `${li.offsetLeft + a.offsetLeft}px ${li.offsetTop + a.offsetTop}px`;
    sel.style.width = `${a.offsetWidth}px`;
    sel.style.height = `${a.offsetHeight}px`;
    if (pop && motion()) { sel.classList.remove('pop'); void sel.offsetWidth; sel.classList.add('pop'); }
  }
  function setPose(i) {
    if (i === current) return;
    current = i;
    document.querySelectorAll('.fx-pose, .od-pose').forEach(p => [...p.children].forEach((n, k) => {
      n.classList.toggle('on', k === i);
      const img = k === i && n.querySelector('img[data-src]');
      if (img) { img.src = img.dataset.src; delete img.dataset.src; }
    }));
    menuLinks().forEach((a, k) => a.classList.toggle('on', k === i));
    moveSel(true);
  }
  function buildPose(cls, index) {
    const pose = hidden('div', cls);
    index.querySelectorAll('li').forEach((li, i) => {
      const href = li.querySelector('a').getAttribute('href');
      const sec = document.getElementById(href.slice(1));
      const item = document.createElement('div');
      item.dataset.href = href;
      const [r, c] = MENU_POSES[i] || [0, 8];
      const mart = document.createElement('span');
      mart.className = 'fx-mart';
      mart.style.cssText = `--c:${c};--r:${r}`;
      item.append(mart);
      const icon = sec && sec.querySelector('.head img, .boulito-stage > img');
      const shot = sec && sec.querySelector('.stage img.shot, .stage .window img');
      if (icon || shot) {
        const img = new Image();
        // Loaded when this item is first shown (see setPose), not all at start.
        img.dataset.src = (icon || shot).getAttribute('src');
        img.decoding = 'async';
        img.alt = '';
        img.className = icon ? 'badge' : 'badge shot-pose';
        item.append(img);
      } else {
        const b = document.createElement('b');
        b.className = 'num badge';
        b.textContent = li.querySelector('.n').textContent;
        item.append(b);
      }
      const say = document.createElement('span');
      say.className = 'say';
      say.textContent = li.querySelector('.d').textContent;
      item.append(say);
      pose.append(item);
    });
    return pose;
  }

  /* ================= Click bursts ================= */
  const EASE_OUT = 'cubic-bezier(.2, .8, .3, 1)';
  function burstAt(x, y, kind) {
    const make = (cls, css, text) => {
      const p = hidden('i', `fx-p ${cls}`);
      p.style.cssText = `left:${x}px;top:${y}px;${css}`;
      if (text) p.textContent = text;
      document.body.append(p);
      setTimeout(() => p.remove(), 1100);
      return p;
    };
    // Flying bits: keyframes built with real numbers.
    const flyer = (cls, color, text, ms) => (ang, d) => {
      const p = make(`${cls} fx-js`, `--c:${color};`, text);
      const dx = Math.cos(ang) * d, dy = Math.sin(ang) * d, r = rand(-200, 200);
      p.animate([{ transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) rotate(${r}deg) scale(.25)`, opacity: 0 }], { duration: ms, easing: EASE_OUT, fill: 'forwards' });
    };
    const spread = (n, mk) => { for (let i = 0; i < n; i++) mk((i / n) * Math.PI * 2 + rand(-.3, .3), rand(40, 90)); };
    const n = lite ? .5 : 1;
    if (kind === 'stars') spread(Math.round(8 * n), (a, d) => flyer('star', pick(['#e60012', '#ffffff', '#0a0a0b']), '', 700)(a, d));
    else if (kind === 'hex') { make('hex', ''); make('hex', 'animation-delay:.12s;opacity:0;animation-fill-mode:both;'); }
    else if (kind === 'coins') for (let i = 0; i < 4 * n; i++) {
      const p = make('coin fx-js', 'animation: fx-p-spin .24s steps(2) infinite;');
      const dx = rand(-70, 70);
      p.animate([{ transform: 'translate(0, 0)', opacity: 1 }, { transform: `translate(${dx * .5}px, -72px)`, opacity: 1, offset: .45 }, { transform: `translate(${dx}px, 26px)`, opacity: 0 }], { duration: 800, delay: i * 40, easing: 'cubic-bezier(.3, .7, .6, 1)', fill: 'both' });
    }
    else if (kind === 'neon') {
      make('ring', '');
      for (let i = 0; i < 10 * n; i++) {
        const a = i * 36 / n;
        make('ray fx-js', '').animate([{ transform: `rotate(${a}deg) translateY(-8px)`, opacity: 1 }, { transform: `rotate(${a}deg) translateY(-46px)`, opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' });
      }
    }
    else if (kind === 'sparks') spread(Math.round(9 * n), (a, d) => flyer('spark', pick(SPARKS), '✦', 750)(a, d));
    else { make('lock', ''); spread(Math.round(10 * n), (a, d) => flyer('px', pick(COLORS.slice(0, 4)), '', 650)(a, d)); }
  }

  /* ================= The hidden game ================= */
  function openGame(opener) {
    if (game) return;
    trophy('arcade');
    audio.play('coin');
    buddy.hide(true);
    const g = document.createElement('div');
    g.className = 'fx-game';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.setAttribute('aria-label', u('game'));
    g.innerHTML = '<div class="cab"><div class="hud"><span>SCORE <b class="sc">0</b></span><span>HI <b class="hi">0</b></span><span>LIVES <b class="lv">3</b></span></div>' +
      `<canvas width="240" height="320" tabindex="0" aria-label="${u('screen')}"></canvas>` +
      '<div class="help"><span>← → OR Q D / A D MOVE · SPACE FIRE · ESC QUIT</span><button type="button" class="quit">QUIT</button></div></div>';
    document.body.append(g);
    const cv = g.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const atlas = new Image();
    atlas.src = new URL('sprites/buddy.png', SCRIPT).href;
    const icons = [...document.querySelectorAll('.head img, .boulito-stage > img')].map(i => { const im = new Image(); im.src = i.currentSrc || i.src; return im; });
    const sc = g.querySelector('.sc'), hiEl = g.querySelector('.hi'), lvEl = g.querySelector('.lv');
    let hi = parseInt(store.get(HI_KEY) || '0', 10) || 0;
    hiEl.textContent = hi;
    const keys = {};
    const S = { state: 'ready', score: 0, lives: 3, wave: 1, px: 120, tx: null, fireHeld: false, cool: 0, inv: 0, dir: 1, bombT: 0, t: 0, en: [], shots: [], bombs: [], booms: [], stars: Array.from({ length: 40 }, () => [Math.random() * 240, Math.random() * 320, rand(.2, .8)]) };
    const spawn = () => {
      S.en = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) S.en.push({ x: 34 + c * 34, y: 34 + r * 28, r, alive: true });
      S.dir = 1; S.shots = []; S.bombs = [];
    };
    const reset = () => { S.score = 0; S.lives = 3; S.wave = 1; S.px = 120; S.inv = 0; spawn(); S.state = 'play'; };
    spawn();
    const fire = () => {
      if (S.state !== 'play' || S.cool > 0 || S.shots.length >= 3) return;
      S.shots.push({ x: S.px, y: 266 }); S.cool = 240; audio.play('shoot');
    };
    const end = () => {
      S.state = 'over';
      if (S.score > hi) { hi = S.score; store.set(HI_KEY, String(hi)); hiEl.textContent = hi; }
      xp.add(Math.round(S.score / 50));
    };
    // Arrows, Q/D (AZERTY) or A/D (QWERTY) to move; space, Z, W or ↑ to fire.
    const LEFT = ['arrowleft', 'q', 'a'], RIGHT = ['arrowright', 'd'], FIRE = [' ', 'arrowup', 'z', 'w'];
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (e.key === 'Tab') { if (e.type === 'keydown') { e.preventDefault(); (document.activeElement === cv ? g.querySelector('.quit') : cv).focus(); } return; }
      if (e.key === 'Enter' && document.activeElement !== cv) return;
      if (![...LEFT, ...RIGHT, ...FIRE, 'enter'].includes(k)) return;
      e.preventDefault();
      e.stopPropagation();
      const down = e.type === 'keydown';
      if (LEFT.includes(k)) keys.left = down;
      if (RIGHT.includes(k)) keys.right = down;
      if (LEFT.includes(k) || RIGHT.includes(k)) S.tx = null; // the keyboard takes over from the pointer
      if (FIRE.includes(k) || k === 'enter') {
        keys.fire = down;
        if (down && !e.repeat) { if (S.state !== 'play') reset(); else fire(); }
      }
    };
    const toCanvas = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 240; };
    cv.addEventListener('pointermove', e => { S.tx = toCanvas(e); });
    cv.addEventListener('pointerdown', e => { S.tx = toCanvas(e); S.fireHeld = true; if (S.state !== 'play') reset(); else fire(); });
    addEventListener('pointerup', () => { S.fireHeld = false; });
    addEventListener('keydown', onKey, true);
    addEventListener('keyup', onKey, true);
    const onBlur = () => { keys.left = keys.right = keys.fire = false; };
    addEventListener('blur', onBlur);
    root.classList.add('fx-gaming');
    g.querySelector('.quit').addEventListener('click', () => close());
    let raf = 0, last = performance.now();
    const hit = (a, b, w, h) => Math.abs(a.x - b.x) < w && Math.abs(a.y - b.y) < h;
    const frame = now => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(34, now - last);
      last = now;
      if (document.hidden) return;
      S.t += dt;
      // update
      if (S.state === 'play') {
        const sp = .12 * dt;
        if (keys.left) S.px -= sp * 1.6;
        if (keys.right) S.px += sp * 1.6;
        if (S.tx != null) S.px += Math.max(-sp * 1.6, Math.min(sp * 1.6, S.tx - S.px));
        S.px = Math.max(14, Math.min(226, S.px));
        S.cool -= dt; S.inv -= dt;
        if (S.fireHeld || keys.fire) fire();
        const alive = S.en.filter(e => e.alive);
        const speed = (.012 + S.wave * .004 + (1 - alive.length / 24) * .03) * dt;
        let edge = false;
        alive.forEach(e => { e.x += speed * S.dir * 2; if (e.x < 12 || e.x > 228) edge = true; });
        if (edge) { S.dir *= -1; alive.forEach(e => { e.y += 8; e.x += speed * S.dir * 2; }); }
        S.bombT -= dt;
        if (S.bombT <= 0 && alive.length) {
          const e = pick(alive);
          S.bombs.push({ x: e.x, y: e.y + 8 });
          S.bombT = Math.max(260, 900 - S.wave * 90) * rand(.6, 1.4);
        }
        S.shots.forEach(s => { s.y -= .3 * dt; });
        S.bombs.forEach(b => { b.y += (.09 + S.wave * .01) * dt; });
        S.shots = S.shots.filter(s => s.y > -8);
        S.bombs = S.bombs.filter(b => b.y < 330);
        S.shots.forEach(s => alive.forEach(e => {
          if (e.alive && !s.dead && hit(s, e, 10, 10)) {
            e.alive = false; s.dead = true; S.score += e.r < 2 ? 150 : 100;
            S.booms.push({ x: e.x, y: e.y, t: 0 }); audio.play('boom');
          }
        }));
        S.shots = S.shots.filter(s => !s.dead);
        if (S.inv <= 0) S.bombs.forEach(b => {
          if (!b.dead && hit(b, { x: S.px, y: 286 }, 11, 22)) {
            b.dead = true; S.lives--; S.inv = 1200; audio.play('hurt');
            if (S.lives <= 0) end();
          }
        });
        S.bombs = S.bombs.filter(b => !b.dead);
        if (alive.some(e => e.alive && e.y > 252)) { S.lives = 0; end(); }
        if (!S.en.some(e => e.alive)) { S.score += 500; S.wave++; audio.play('wave'); spawn(); }
        if (S.score >= 3000) trophy('ace');
        sc.textContent = S.score; lvEl.textContent = Math.max(0, S.lives);
      }
      S.booms.forEach(b => { b.t += dt; });
      S.booms = S.booms.filter(b => b.t < 360);
      // draw
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, 240, 320);
      S.stars.forEach(s => { s[1] = (s[1] + s[2] * dt * .03) % 320; ctx.fillStyle = `rgba(255,241,232,${s[2]})`; ctx.fillRect(s[0] | 0, s[1] | 0, 1, 1); });
      S.en.forEach(e => {
        if (!e.alive) return;
        const wob = Math.sin((S.t / 260) + e.x * .1) * 1.5;
        const im = icons[e.r % Math.max(1, icons.length)];
        if (im && im.complete && im.naturalWidth) { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, e.x - 10, e.y - 10 + wob, 20, 20); ctx.imageSmoothingEnabled = false; }
        else { ctx.fillStyle = COLORS[e.r % 4]; ctx.fillRect(e.x - 8, e.y - 6 + wob, 16, 12); }
      });
      ctx.fillStyle = '#b6ff3b'; S.shots.forEach(s => ctx.fillRect(s.x - 1, s.y - 5, 2, 8));
      ctx.fillStyle = '#ff004d'; S.bombs.forEach(b => ctx.fillRect(b.x - 2, b.y - 3, 4, 6));
      S.booms.forEach(b => { const k = b.t / 360; ctx.fillStyle = `rgba(255,236,39,${1 - k})`; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillRect(b.x + Math.cos(a) * k * 16 - 1, b.y + Math.sin(a) * k * 16 - 1, 3, 3); } });
      if (atlas.complete && atlas.naturalWidth && (S.inv <= 0 || Math.floor(S.t / 80) % 2)) {
        const f = S.state === 'play' && (keys.left || keys.right || (S.tx != null && Math.abs(S.tx - S.px) > 2)) ? Math.floor(S.t / 160) % 4 : 0;
        ctx.drawImage(atlas, (6 + f) * 32, 5 * 52, 32, 52, Math.round(S.px - 16), 262, 32, 52);
      }
      ctx.fillStyle = '#fff1e8';
      ctx.font = '8px "FX Press", monospace';
      ctx.textAlign = 'center';
      if (S.state === 'ready') { ctx.fillText('PRESS SPACE', 120, 200); ctx.fillText('OR TAP TO START', 120, 214); }
      if (S.state === 'over') { ctx.fillStyle = '#ff004d'; ctx.fillText('GAME OVER', 120, 190); ctx.fillStyle = '#fff1e8'; ctx.fillText('SPACE OR TAP: RETRY', 120, 208); }
      if (S.state === 'play' && S.t < 1200 && S.wave === 1) ctx.fillText(`WAVE ${S.wave}`, 120, 200);
    };
    raf = requestAnimationFrame(frame);
    cv.focus();
    function close() {
      cancelAnimationFrame(raf);
      removeEventListener('keydown', onKey, true);
      removeEventListener('keyup', onKey, true);
      removeEventListener('blur', onBlur);
      root.classList.remove('fx-gaming');
      if (S.state === 'play' && S.score) xp.add(Math.round(S.score / 50));
      g.remove();
      game = null;
      buddy.hide(false);
      if (opener) opener.focus();
    }
    game = { close };
  }

  /* ================= Long titles never run into their window ================= */
  // Some styles set project titles huge; a long one (doc-indexer-macos) would run under the window
  // next to it. Measured from the layout (transforms ignored), the window then starts below the title.
  const layoutPos = el => { let x = 0, y = 0; for (let n = el; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return { x, y }; };
  let clearTimer = 0;
  function clearTitles() {
    const stages = [...document.querySelectorAll(':is(.project, .upstream) .stage')];
    stages.forEach(st => { st.style.marginTop = ''; });
    if (!isOn()) return;
    // How far the window must still move down (0 when the title is clear of it).
    const need = st => {
      const h = st.closest('.project, .upstream').querySelector('.head h2');
      if (!h || !st.offsetWidth) return 0;
      const t = layoutPos(h), w = layoutPos(st);
      const right = Math.max(...[...h.parentElement.children].map(c => layoutPos(c).x + Math.max(c.scrollWidth, c.offsetWidth)));
      const bottom = t.y + h.offsetHeight;
      const overlaps = right > w.x - 6 && t.x < w.x + st.offsetWidth && bottom + 36 > w.y && t.y < w.y + st.offsetHeight;
      return overlaps ? Math.ceil(bottom + 36 - w.y) : 0;
    };
    // Columns are centred, so pushing the window also moves the title a little: repeat until clear.
    stages.forEach(st => {
      let m = 0;
      for (let pass = 0; pass < 8; pass++) {
        const n = need(st);
        if (n <= 1) break;
        m += n;
        st.style.marginTop = `${m}px`;
      }
    });
  }
  const clearTitlesSoon = (ms = 120) => { clearTimeout(clearTimer); clearTimer = setTimeout(clearTitles, ms); };

  /* ================= Shared decorations, used by every style ================= */
  function coreOn() {
    if (core) return;
    core = bag();
    const { add, on, later } = core;

    toasts = add(document.createElement('div'), document.body);
    toasts.className = 'fx-toasts';
    toasts.setAttribute('role', 'status');
    later(() => { toasts = null; queue.length = 0; showing = false; });

    document.querySelectorAll('.top, .hero, .project, .upstream, footer').forEach(s => add(hidden('div', 'fx-deco'), s, s.firstChild));
    document.querySelectorAll('.hero h1, main h2').forEach(h => { h.dataset.text = h.textContent.trim(); });
    later(() => document.querySelectorAll('[data-text]').forEach(n => n.removeAttribute('data-text')));

    // Ransom letters for the end of the headline; the original text stays for screen readers.
    const em = document.querySelector('.hero h1 em');
    if (em) {
      const html = em.innerHTML;
      const text = em.textContent;
      const orig = document.createElement('span');
      orig.className = 'fx-orig';
      orig.textContent = text;
      const split = hidden('span', 'fx-split');
      text.split(' ').forEach(word => {
        const w = document.createElement('span');
        w.className = 'fx-w';
        [...word].forEach(c => { const ch = document.createElement('span'); ch.className = c === ' ' ? 'fx-gap' : 'fx-ch'; ch.textContent = c; w.append(ch); });
        split.append(w);
      });
      em.replaceChildren(orig, split);
      later(() => { em.innerHTML = html; });
    }

    // Menu: the buddy's poses, sliding selection.
    const index = document.querySelector('.index');
    if (index) {
      index.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
      add(buildPose('fx-pose', index), index);
      add(buildPose('od-pose', index), index);
      add(hidden('span', 'fx-sel'), index.querySelector('ol'));
      current = -1;
      setPose(0);
      const onPose = e => { const li = e.target.closest && e.target.closest('.index li'); if (li) setPose([...li.parentNode.children].indexOf(li)); };
      on(index, 'pointerover', onPose);
      on(index, 'focusin', onPose);
      on(window, 'resize', () => moveSel(false));
      if (document.fonts) document.fonts.ready.then(() => moveSel(false));
      later(() => {
        menuLinks().forEach(a => a.classList.remove('on'));
        index.querySelectorAll('li').forEach(li => li.style.removeProperty('--i'));
        current = -1;
      });
    }

    // Window titles, camera labels, episode cards, windows that open their project, the peeking buddy.
    const peeks = [];
    document.querySelectorAll('.project, .upstream').forEach((p, i) => {
      const st = p.querySelector('.stage');
      if (st) {
        st.dataset.fxName = p.id;
        st.dataset.fxN = i + 1;
        const link = p.querySelector('.links a.more[href*="github.com/"]') || p.querySelector('.links a');
        if (link && !st.querySelector('a')) {
          const open = hidden('a', 'fx-open');
          open.href = link.href;
          open.tabIndex = -1;
          add(open, st);
        }
        const peek = add(hidden('div', 'fx-peek', spr(9, 0)), p);
        peeks.push([p, st, peek]);
      }
      const copy = p.querySelector('.copy');
      add(hidden('div', 'fx-ep', `<b>${EPISODES[i] || ''}</b><i>EPISODE:${String(i + 1).padStart(2, '0')}</i>`), copy, copy.firstChild);
    });
    later(() => document.querySelectorAll('[data-fx-name]').forEach(n => { n.removeAttribute('data-fx-name'); n.removeAttribute('data-fx-n'); }));
    const peekAt = (st, peek) => {
      if (!motion() || peek.classList.contains('up') || innerWidth < 760) return;
      const box = (peek.offsetParent || document.body).getBoundingClientRect();
      const r = st.getBoundingClientRect();
      peek.style.left = `${r.left - box.left + 22}px`;
      peek.style.top = `${r.top - box.top - peek.offsetHeight + 2}px`;
      const s = peek.firstChild;
      s.style.setProperty('--r', OUTFIT[skinNow()] || 0);
      peek.classList.add('up');
      setTimeout(() => peek.classList.remove('up'), 1700);
    };
    peeks.forEach(([, st, peek]) => {
      let lastPeek = 0;
      on(st, 'pointerenter', () => { if (performance.now() - lastPeek > 6000) { lastPeek = performance.now(); peekAt(st, peek); } });
    });

    const hero = document.querySelector('.hero');
    if (hero) {
      const mq = hidden('div', 'fx-marquee');
      const t = 'VIDEO ✦ VOICE ✦ BLUE TEAM ✦ MUSIC ✦ OCR ✦ OPEN SOURCE ✦ BEST VIEWED AT ANY RESOLUTION ✦ Y2K COMPLIANT ✦ ';
      const span = document.createElement('span');
      span.textContent = t.repeat(3) + t.repeat(3);
      mq.append(span);
      add(mq, hero);
    }
    const foot = document.querySelector('footer');
    if (foot) {
      add(hidden('div', 'fx-badges', ['VIDEO &amp;<br>VOICE', 'OPEN<br>SOURCE', 'BLUE<br>TEAM', 'MUSIC<br>&amp; OCR', 'Y2K<br>COMPLIANT'].map(x => `<b>${x}</b>`).join('')), foot);
      const coin = document.createElement('button');
      coin.type = 'button';
      coin.className = 'fx-coin';
      coin.innerHTML = '<i aria-hidden="true"></i>INSERT COIN';
      coin.addEventListener('click', () => openGame(coin));
      add(coin, foot);
    }

    // Scenery for the single styles.
    const scen = add(hidden('div', 'fx-scenery',
      Array.from({ length: 9 }, (_, i) => `<i class="bub" style="--x:${(i * 11 + 4) % 96}vw;--d:${rand(24, 90) | 0}px;--t:${rand(18, 34) | 0}s;--dl:-${rand(0, 30) | 0}s;--sw:${rand(-60, 60) | 0}px"></i>`).join('') +
      '<i class="star" style="--x:6vw;--y:18vh;--d:220px;--t:90s"></i><i class="star" style="--x:78vw;--y:55vh;--d:300px;--t:120s"></i><i class="star" style="--x:40vw;--y:80vh;--d:140px;--t:70s"></i>' +
      '<i class="radar"></i><i class="blip" style="--x:180px;--y:220px;--dl:.6s"></i><i class="blip" style="--x:90px;--y:140px;--dl:2.2s"></i><i class="blip" style="--x:260px;--y:90px;--dl:3.1s"></i>' +
      '<div class="floor"><i></i></div><i class="hills far"></i><i class="hills"></i>'), document.body);

    // Entrance animations play once per page load: after this they are switched off for good,
    // so scrolling back or changing style never replays them.
    const land = sec => { const id = setTimeout(() => sec.classList.add('fx-landed'), 2600); later(() => clearTimeout(id)); };
    later(() => document.querySelectorAll('.fx-landed').forEach(n => n.classList.remove('fx-landed')));
    // Animations of sections far off screen are paused. Measured from the layout on every scroll,
    // so a page restored half-way down or opened in a hidden window can never stay frozen.
    const pausable = [...document.querySelectorAll('.hero, .project, .upstream, footer')];
    const checkPause = () => {
      const top = -400, bottom = innerHeight + 400;
      // All the reads first, then the writes: one layout per call instead of one per section.
      const rects = pausable.map(sec => sec.getBoundingClientRect());
      pausable.forEach((sec, i) => {
        const r = rects[i];
        sec.classList.toggle('fx-paused', r.bottom < top || r.top > bottom);
        // Safety net: a project on screen is always shown, even if its reveal was missed.
        if (r.top < innerHeight * .85 && r.bottom > 0 && !sec.classList.contains('fx-in') && !sec.matches('.hero, footer')) { sec.classList.add('fx-in'); land(sec); }
      });
    };
    checkPause();
    [250, 1200].forEach(ms => { const id = setTimeout(checkPause, ms); later(() => clearTimeout(id)); });
    on(window, 'resize', checkPause);
    on(document, 'visibilitychange', () => { if (!document.hidden) checkPause(); });

    // Boulito, in katakana too.
    const bh = document.querySelector('#boulito .head');
    if (bh) add(hidden('span', 'fx-kana', 'ブリト'), bh);

    // Tags drop one after another; the main buttons get a shine; clicks squash them; tags tick on hover.
    document.querySelectorAll('.stack').forEach(ul => [...ul.children].forEach((li, i) => li.style.setProperty('--i', i)));
    later(() => document.querySelectorAll('.stack li').forEach(li => li.style.removeProperty('--i')));
    document.querySelectorAll('.btn').forEach((b, i) => { const sh = add(hidden('span', 'fx-shine'), b); sh.style.setProperty('--sd', `${(i * 0.9) % 5}s`); });
    on(document, 'pointerdown', e => {
      const b = e.target.closest && e.target.closest('.btn, .fx-coin, .od-continue');
      if (!b || !motion()) return;
      b.classList.remove('fx-squash'); void b.offsetWidth; b.classList.add('fx-squash');
      b.addEventListener('animationend', () => b.classList.remove('fx-squash'), { once: true });
    });
    on(document, 'pointerover', e => {
      const li = e.target.closest && e.target.closest('.stack li');
      if (li && !(e.relatedTarget instanceof Node && li.contains(e.relatedTarget))) audio.play('tick', clickKind(li));
    });

    // Lean on scroll: the projects tilt a little when you scroll fast, and straighten up at rest.
    const main = document.querySelector('main');
    if (main && motion() && finePointer()) {
      let lean = 0, target = 0, lastY = scrollY, lastT = performance.now(), raf = 0;
      const step = () => {
        raf = 0;
        lean += (target - lean) * .2;
        target *= .86;
        if (Math.abs(lean) < .01 && Math.abs(target) < .01) { main.style.transform = ''; main.style.willChange = ''; return; }
        main.style.transform = `skewY(${lean.toFixed(3)}deg)`;
        raf = requestAnimationFrame(step);
      };
      on(window, 'scroll', () => {
        const now = performance.now(), v = (scrollY - lastY) / Math.max(8, now - lastT);
        lastY = scrollY; lastT = now;
        if (lite || game) return;
        target = Math.max(-2.4, Math.min(2.4, v * .45));
        main.style.willChange = 'transform';
        if (!raf) raf = requestAnimationFrame(step);
      }, { passive: true });
      later(() => { cancelAnimationFrame(raf); main.style.transform = ''; main.style.willChange = ''; });
    }

    // Scroll: scenery parallax, depth XP, pausing. One rAF per frame at most.
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      checkPause();
      const y = scrollY;
      const k = skinNow();
      if (k === 'neon') scen.style.setProperty('--g', `${((y * .6) % 64).toFixed(1)}px`);
      else if (k === 'pixel') { scen.style.setProperty('--h', `${(-y * .3).toFixed(0)}px`); scen.style.setProperty('--hf', `${(-y * .12).toFixed(0)}px`); }
      const depth = Math.floor(y / 600);
      if (depth > xp.session.depth) { xp.session.depth = depth; xp.add(3); }
    };
    on(window, 'scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

    // Reveal on scroll, the world tour, sounds; pause what is off screen.
    const seen = visit.seen;
    seen.clear();
    const stages = [...document.querySelectorAll('.project, .upstream')];
    visit.stages = stages.length;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      buddy.comment(e.target.id, e.target);
      if (!seen.has(e.target.id)) {
        seen.add(e.target.id);
        xp.add(15);
        audio.play('tick', clickKind(e.target));
        if (seen.size === stages.length) trophy('tour');
      }
      if (e.target.classList.contains('fx-in')) return;
      e.target.classList.add('fx-in');
      land(e.target);
      const h = e.target.querySelector('h2');
      if (h && od && motion()) setTimeout(() => scramble(h, h.dataset.text || h.textContent), 220);
      const pk = peeks.find(([p]) => p === e.target);
      if (pk) setTimeout(() => peekAt(pk[1], pk[2]), 700);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    if (motion()) root.classList.add('fx-anim');
    stages.forEach(s => io.observe(s));
    later(() => { io.disconnect(); document.querySelectorAll('.fx-in').forEach(n => n.classList.remove('fx-in')); root.classList.remove('fx-anim'); });
    later(() => document.querySelectorAll('.fx-paused').forEach(n => n.classList.remove('fx-paused')));
    let cleared = false;
    if (foot) {
      const endIO = new IntersectionObserver(es => {
        if (es[0].isIntersecting && !cleared) { cleared = true; audio.play('clear', clickKind(foot)); buddy.react(9, u('thanks'), 2600); }
      }, { threshold: .5 });
      endIO.observe(foot);
      later(() => endIO.disconnect());
    }

    // Menu → project: a full-screen slash, then the page lands on the project.
    on(document, 'click', e => {
      const a = e.target.closest && e.target.closest('.index ol a, .fx-pose > div, .od-pose > div');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || busy) return;
      const href = a.getAttribute('href') || a.dataset.href;
      const id = href.slice(1);
      const sec = document.getElementById(id);
      if (!sec) return;
      e.preventDefault();
      const land = () => {
        if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
        sec.scrollIntoView({ behavior: motion() ? 'instant' : 'auto', block: 'start' });
        const h = sec.querySelector('h2');
        if (h) {
          h.setAttribute('tabindex', '-1');
          h.focus({ preventScroll: true });
          h.addEventListener('blur', () => h.removeAttribute('tabindex'), { once: true });
        }
      };
      if (!motion()) { land(); return; }
      const h = sec.querySelector('h2');
      const lab = sec.querySelector('.label');
      audio.play('whoosh');
      cover('slash', skinOf(sec), h ? (h.dataset.text || h.textContent) : id, lab ? lab.textContent : '', land);
    });

    // The logo goes back to the top (no reload, so no start-up animation again).
    on(document, 'click', e => {
      const a = e.target.closest && e.target.closest('.top .mark');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      backToTop({ title: 'BOULIW', small: 'HOME', xp: 0 });
    });

    // Projects opened, clicks counted, bursts and sounds, the buddy reacting.
    visit.clicks = 0;
    on(document, 'click', e => {
      if (e.target.closest && e.target.closest('a[href*="github.com/"], .fx-open, a[href*="bouliw.github.io/vigie"]')) { trophy('source'); xp.add(25); }
    }, true);
    // Browsers start audio only after a click or a key: wake it up on the first one.
    // Safari counts click, touchend and keydown as gestures (not always pointerdown), so all of them can wake it.
    const wake = () => { if (audio.fx && isOn() && (!audio.ctx || audio.ctx.state !== 'running')) { audio.ready(); setTimeout(() => music.sync(), 60); } };
    on(window, 'keydown', wake, true);
    on(window, 'click', wake, true);
    on(window, 'touchend', wake, true);
    on(window, 'pointerdown', e => {
      wake();
      if (!isOn() || game) return;
      if (++visit.clicks === 30) trophy('clicks');
      if (xp.session.clicks++ < 40) xp.add(1);
      const kind = clickKind(e.target);
      if (motion() && e.target instanceof Element && !e.target.closest('.fx-buddy')) burstAt(e.clientX, e.clientY, kind);
      audio.play('click', kind);
      if (buddy.near(e.clientX, e.clientY) && !e.target.closest('.fx-buddy')) { buddy.jump(); buddy.talk('!', 700); }
      buddy.poke();
    }, { passive: true });
    on(document, 'pointerover', e => {
      const t = e.target instanceof Element && e.target.closest('a, button');
      if (t && !(e.relatedTarget instanceof Node && t.contains(e.relatedTarget))) audio.play('hover', clickKind(t));
    });
    on(window, 'keydown', () => buddy.poke());
    let pokeT = 0;
    on(window, 'pointermove', () => { const n = performance.now(); if (n - pokeT > 1000) { pokeT = n; buddy.poke(); } }, { passive: true });

    // Project titles tilt like cards; the headline turns in 3D.
    if (finePointer()) {
      document.querySelectorAll('.head').forEach(h => {
        let raf = 0, ev = null;
        const apply = () => {
          raf = 0;
          if (!ev) return;
          const r = h.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
          h.style.setProperty('--hry', `${((px - .5) * 18).toFixed(2)}deg`);
          h.style.setProperty('--hrx', `${((.5 - py) * 16).toFixed(2)}deg`);
          h.style.setProperty('--hmx', `${(px * 100).toFixed(1)}%`);
          h.style.setProperty('--hmy', `${(py * 100).toFixed(1)}%`);
        };
        on(h, 'pointerenter', () => { if (!motion()) return; h.classList.add('fx-card-on'); h.style.setProperty('--hs', '1.03'); });
        on(h, 'pointermove', e => { ev = e; if (!raf && motion()) raf = requestAnimationFrame(apply); });
        on(h, 'pointerleave', () => { ev = null; h.classList.remove('fx-card-on'); ['--hrx', '--hry', '--hs'].forEach(p => h.style.removeProperty(p)); });
      });
      const h1 = document.querySelector('.hero h1');
      if (hero && h1) {
        let raf = 0, ev = null;
        const depthEls = () => [h1];
        const apply = () => {
          raf = 0;
          if (!ev) return;
          const r = hero.getBoundingClientRect();
          const px = ((ev.clientX - r.left) / r.width - .5) * 2, py = ((ev.clientY - r.top) / Math.min(r.height, innerHeight) - .5) * 2;
          depthEls().forEach(el => { el.style.setProperty('--px', px.toFixed(3)); el.style.setProperty('--py', py.toFixed(3)); });
        };
        on(hero, 'pointermove', e => { ev = e; if (!raf && motion()) raf = requestAnimationFrame(apply); });
        on(hero, 'pointerleave', () => { ev = null; depthEls().forEach(el => { el.style.removeProperty('--px'); el.style.removeProperty('--py'); }); });
        later(() => depthEls().forEach(el => { el.style.removeProperty('--px'); el.style.removeProperty('--py'); }));
      }
    }

    // Sparkle trail wherever a style asks for it (Y2K).
    let last = 0;
    on(window, 'pointermove', e => {
      if (e.pointerType === 'touch' || !motion() || lite) return;
      const now = performance.now();
      if (now - last < 45 || !(e.target instanceof Element)) return;
      last = now;
      if (getComputedStyle(e.target).getPropertyValue('--fx-trail').trim() !== '1') return;
      const s = hidden('span', 'fx-spark fx-js');
      s.textContent = '✦';
      s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--c:${pick(SPARKS)};font-size:${10 + Math.random() * 14}px`;
      document.body.append(s);
      const dx = (Math.random() - .5) * 70, dy = 18 + Math.random() * 46;
      s.animate([{ transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.2) rotate(140deg)`, opacity: 0 }], { duration: 900, easing: EASE_OUT, fill: 'forwards' });
      setTimeout(() => s.remove(), 950);
    }, { passive: true });

    // ↑ ↑ ↓ ↓ ← → ← → B A, checked on the last ten keys, so a stray or extra key never spoils it.
    const code = 'up up down down left right left right b a';
    let keys = [];
    on(window, 'keydown', e => {
      if (game || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      let key = '';
      if (e.key.startsWith('Arrow')) key = e.key.slice(5).toLowerCase();
      else if (/^[a-z]$/i.test(e.key)) key = e.key.toLowerCase();
      else if (/^Key[A-Z]$/.test(e.code)) key = e.code.slice(3).toLowerCase(); // other alphabets
      if (!key) return;
      keys.push(key);
      if (keys.length > 10) keys.shift();
      // A little blip for every key that is on the right track.
      const seq = code.split(' ');
      for (let n = Math.min(keys.length, seq.length - 1); n >= 2; n--) {
        if (keys.slice(-n).join(' ') === seq.slice(0, n).join(' ')) { audio.play('seg'); break; }
      }
      if (keys.join(' ') === code) {
        keys = [];
        cheatBanner();
        trophy('konami');
        setTimeout(() => xp.add(100), 1700);
        root.classList.add('od-hyper');
        if (motion()) confetti();
        buddy.react(10, u('cheat'), 2200);
        setTimeout(() => root.classList.remove('od-hyper'), 6000);
      }
    });
    later(() => root.classList.remove('od-hyper'));

    clearTitlesSoon(60);
    on(window, 'resize', () => clearTitlesSoon(200));
    if (document.fonts) document.fonts.ready.then(() => clearTitlesSoon(0));
    later(() => { clearTimeout(clearTimer); document.querySelectorAll(':is(.project, .upstream) .stage').forEach(st => { st.style.marginTop = ''; }); });

    // The buddy, the bugs and the snow come in a task of their own, once the page has been laid out,
    // so start-up is not one long block of work.
    const bagNow = core;
    const extras = () => { if (core !== bagNow || !isOn()) return; buddy.create(); bugs.create(); if (winter()) snowOn(add); };
    const idle = window.requestIdleCallback ? requestIdleCallback(extras, { timeout: 500 }) : setTimeout(extras, 80);
    later(() => { if (window.cancelIdleCallback) cancelIdleCallback(idle); else clearTimeout(idle); });
    later(() => buddy.destroy());
    later(() => bugs.destroy());
    later(() => { if (game) game.close(); });
    music.sync();
    later(() => { music.stop(); audio.keepAwake(false); });
    // Check the frame rate once the start-up animations are over.
    const probeId = setTimeout(probe, 3500);
    later(() => clearTimeout(probeId));
  }

  function coreOff() {
    if (!core) return;
    core.clear();
    core = null;
    document.querySelectorAll('.fx-spark, .fx-p, .od-confetti, .fx-slash, .fx-glitch, .fx-bars, .fx-alarm, .fx-iris, .fx-win, .fx-levelup, .fx-xpgain, .fx-bug-say').forEach(n => n.remove());
  }

  // Watch the frame rate for two seconds; if it is low, switch to the lighter version.
  function probe() {
    if (!motion() || lite) return;
    let n = 0, t0 = 0, slow = 0, prev = 0;
    const step = now => {
      if (!isOn()) return;
      if (!t0) { t0 = prev = now; requestAnimationFrame(step); return; }
      const dt = now - prev;
      prev = now;
      if (!document.hidden && dt > 30) slow++;
      if (++n < 120) requestAnimationFrame(step);
      else if (slow > 40) goLite();
    };
    requestAnimationFrame(step);
  }
  function goLite() {
    if (lite) return;
    lite = true;
    root.classList.add('fx-lite');
  }

  /* ================= Overdrive: HUD, cursor, particles, stickers, title cards ================= */
  function confetti(n = 46) {
    if (lite) n = 24;
    for (let i = 0; i < n; i++) {
      const c = hidden('i', 'od-confetti fx-js');
      document.body.append(c);
      const t = 1.6 + Math.random() * 1.8;
      c.animate([{ transform: 'translate(0, 0) rotate(0deg)' }, { transform: `translate(${(Math.random() - .5) * 240}px, 110vh) rotate(${(Math.random() - .5) * 1440}deg)` }], { duration: t * 1000, delay: Math.random() * 500, easing: 'cubic-bezier(.3, .2, .6, 1)', fill: 'both' });
      c.style.cssText = `left:${Math.random() * 100}vw;background:${COLORS[i % COLORS.length]};` +
        (i % 3 ? '' : 'width:14px;height:6px;');
      setTimeout(() => c.remove(), 4200);
    }
  }

  // CONTINUE? and the logo: back to the start of the page, with the style's own transition and the intro again.
  function backToTop({ title = 'CONTINUE', small = 'NEW GAME +', xp: gain = 10, say = u('round') } = {}) {
    if (busy) return;
    if (gain) xp.add(gain);
    audio.play(gain ? 'coin' : 'whoosh');
    const top = () => {
      if (location.hash) history.pushState(null, '', location.pathname + location.search);
      scrollTo({ top: 0, behavior: 'instant' });
      const h1 = document.querySelector('.hero h1');
      if (h1) {
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
        h1.addEventListener('blur', () => h1.removeAttribute('tabindex'), { once: true });
      }
      if (od) intro();
      if (say) buddy.react(9, say, 2000);
    };
    if (!motion()) { top(); return; }
    const k = skinNow();
    cover(SKIN_COVER[k] || 'slash', k, title, small, top);
  }
  const newGame = () => backToTop();

  function intro(restart = true) {
    if (restart || !root.classList.contains('od-intro')) {
      root.classList.remove('od-intro');
      void root.offsetWidth;
      root.classList.add('od-intro');
    }
    const lede = document.querySelector('.lede');
    if (lede && od && !lede.dataset.fxText) {
      const text = lede.textContent;
      lede.dataset.fxText = '1';
      scramble(lede, text, 26);
      od.later(() => { lede.textContent = text; delete lede.dataset.fxText; });
    }
  }

  function odOn() {
    if (od) return;
    od = bag();
    const { add, on, later } = od;
    const hero = document.querySelector('.hero');
    const projects = [...document.querySelectorAll('.project, .upstream')];

    add(hidden('div', 'od-aurora', '<i></i><i></i><i></i>'), document.body);
    const canvas = add(hidden('canvas', 'od-canvas'), document.body);
    const hud = add(hidden('div', 'od-hud',
      '<i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>' +
      '<span class="side">BOULIW // FUN MODE // <span class="jp">ファンモード</span></span><span class="xy">X 0000 · Y 0000</span>' +
      '<span class="stage-no">STAGE <b>00</b>/<span class="of">00</span> · <span class="nm">START</span></span><span class="gauge"></span>'), document.body);
    const progress = add(hidden('div', 'od-progress'), document.body);
    const gauge = hud.querySelector('.gauge');
    for (let i = 0; i < 24; i++) gauge.append(document.createElement('i'));
    const segs = [...gauge.children];

    if (hero) {
      const st = add(hidden('div', 'od-stickers',
        '<span class="od-sticker s1">OPEN SOURCE</span><span class="od-sticker s2">VIDEO ✦</span>' +
        '<span class="od-sticker s3">BLUE TEAM</span><span class="od-sticker s4">VOICE</span><span class="od-sticker s5">MUSIC ♪</span>'), hero);
      st.querySelectorAll('.od-sticker').forEach(s => {
        let sx = 0, sy = 0, ox = 0, oy = 0, drag = false, moved = 0;
        s.addEventListener('pointerdown', e => { drag = true; moved = 0; s.setPointerCapture(e.pointerId); sx = e.clientX - ox; sy = e.clientY - oy; s.style.animation = 'none'; });
        s.addEventListener('pointermove', e => {
          if (!drag) return;
          ox = e.clientX - sx; oy = e.clientY - sy; s.style.translate = `${ox}px ${oy}px`;
          if (++moved === 6) trophy('sticker');
        });
        s.addEventListener('pointerup', () => { drag = false; });
      });
      add(hidden('div', 'od-band', `<span>${'VIDEO ✦ VOICE ✦ BLUE TEAM ✦ MUSIC ✦ OCR ✦ OPEN SOURCE ✦ 楽しい ✦ '.repeat(6)}</span>`), hero);
    }

    // Mashup: each project gets a guest reference for its title card and a few details.
    const GUESTS = ['synth', 'persona', 'eva', 'arcade', 'y2k'];
    projects.forEach((p, i) => {
      const n = String(i + 1).padStart(2, '0');
      const name = p.id.replace(/-/g, ' ');
      const guest = GUESTS[i % GUESTS.length];
      p.dataset.guest = guest;
      const segsHtml = Array.from({ length: 9 }, (_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('');
      const ransom = [...name.toUpperCase()].map((c, k) => c === ' ' ? '<i class="gap"></i>' : `<i style="--k:${k}">${c}</i>`).join('');
      const card = {
        eva: `<div class="inner"><b>${EPISODES[i] || ''}</b><span class="ep">EPISODE ${n}</span><span class="rule"></span><span>${name}</span><span class="seg">${segsHtml}</span></div><span class="hz"></span>`,
        persona: `<div class="inner"><span class="star">★</span><span class="cc">CALLING CARD</span><span class="ransom">${ransom}</span><span class="no">No.${n}</span></div><span class="slash"></span>`,
        arcade: `<div class="inner"><span class="up">1UP <b>${n}0000</b></span><span class="stage-t">STAGE ${n}</span><span class="nm">${name}</span><span class="ready">READY!</span><span class="coins"><i></i><i></i><i></i></span></div>`,
        y2k: `<div class="inner"><span class="win"><i class="ico"></i><span class="tt">Episode_${n}.exe — ${name}</span><span class="btns"><i>_</i><i>□</i><i>×</i></span></span><span class="prog"><i></i></span><span class="spark">✦</span></div>`,
        synth: `<div class="inner"><span class="sun"></span><span class="ep">EPISODE</span><b class="big">${n}</b><span class="nm">${name}</span></div><span class="grid"></span>`,
      }[guest];
      add(hidden('div', `od-card g-${guest}`, card), p, p.firstChild);
      add(hidden('span', 'od-num', n), p, p.firstChild);
      const st = p.querySelector('.stage');
      if (st) add(hidden('span', 'od-sheen'), st);
      const h = p.querySelector('h2');
      if (h) h.style.setProperty('--gd', `${(-i * 1.37).toFixed(2)}s`);
    });
    later(() => projects.forEach(p => { delete p.dataset.guest; const h = p.querySelector('h2'); if (h) h.style.removeProperty('--gd'); }));
    // An RGB glitch layer over the headline (decorative copy of its text).
    const h1 = hero && hero.querySelector('h1');
    if (h1) { const gl = add(hidden('span', 'od-glitch'), h1); gl.textContent = h1.dataset.text || h1.textContent; }

    const foot = document.querySelector('footer');
    if (foot) {
      add(hidden('div', 'od-endroll', `<span>${'Thanks for playing ✦ <em>Bouliw</em> ✦ '.repeat(6)}</span>`), foot, foot.firstChild);
      const thanks = add(hidden('div', 'od-thanks', '<i aria-hidden="true">↑ ↑ ↓ ↓ ← → ← → B A</i>'), foot);
      thanks.removeAttribute('aria-hidden');
      const cont = document.createElement('button');
      cont.type = 'button';
      cont.className = 'od-continue';
      cont.innerHTML = '<b aria-hidden="true">▶</b> CONTINUE?';
      cont.setAttribute('aria-label', u('cont'));
      cont.addEventListener('click', () => newGame());
      thanks.prepend(cont);
    }

    // Canvas: pixel stars with parallax and the pointer trail, drawn only when something changed.
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    const stars = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), z: .2 + Math.random() * .8, s: Math.random() < .15 ? 3 : 2, a: .25 + Math.random() * .55 }));
    const parts = [];
    const resize = () => { W = innerWidth; H = innerHeight; canvas.width = W; canvas.height = H; kick(); };
    const dark = matchMedia('(prefers-color-scheme: dark)');
    let dot = null, ring = null;
    const ptr = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2, s: 1, down: false, target: null, seen: false, tw: 34, th: 34 };
    let raf = 0, dirty = true, lastY = -1, slowFrames = 0, prevT = 0;
    function kick() { if (!raf && od) raf = requestAnimationFrame(frame); }
    function frame(now) {
      raf = 0;
      if (!od || document.hidden) return;
      if (prevT && now - prevT > 34) { if (++slowFrames > 45) goLite(); } else if (slowFrames > 0) slowFrames--;
      prevT = now;
      let again = false;
      if (dirty || parts.length || scrollY !== lastY) {
        dirty = false;
        lastY = scrollY;
        ctx.clearRect(0, 0, W, H);
        if (!lite) {
          const col = dark.matches ? '245,245,247' : '107,43,255';
          for (const s of stars) {
            ctx.fillStyle = `rgba(${col},${(s.a * s.z).toFixed(2)})`;
            ctx.fillRect(Math.round(s.x * W), Math.round(((s.y * H - scrollY * s.z * .35) % H + H) % H), s.s, s.s);
          }
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.x += p.vx; p.y += p.vy; p.vy += .06; p.life -= .03;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.c;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
          ctx.globalAlpha = 1;
        }
        if (parts.length) again = true;
      }
      if (ring) {
        let tx = ptr.x - 17, ty = ptr.y - 17, tw = 34, th = 34;
        if (ptr.target && ptr.target.isConnected) {
          const r = ptr.target.getBoundingClientRect();
          tx = r.left - 7; ty = r.top - 7; tw = r.width + 14; th = r.height + 14;
          ring.classList.add('lock');
        } else ring.classList.remove('lock');
        const ds = (ptr.down ? .9 : 1) - ptr.s;
        ptr.rx += (tx - ptr.rx) * .25; ptr.ry += (ty - ptr.ry) * .25; ptr.s += ds * .35;
        ptr.tw += (tw - ptr.tw) * .35; ptr.th += (th - ptr.th) * .35;
        // The press shrinks the frame around its own centre, so it never drifts.
        const w = ptr.tw * ptr.s, h = ptr.th * ptr.s;
        ring.style.transform = `translate(${(ptr.rx + (ptr.tw - w) / 2).toFixed(1)}px, ${(ptr.ry + (ptr.th - h) / 2).toFixed(1)}px)`;
        ring.style.width = `${w.toFixed(1)}px`;
        ring.style.height = `${h.toFixed(1)}px`;
        ring.style.opacity = ptr.seen ? 1 : 0;
        dot.style.transform = `translate(${ptr.x}px, ${ptr.y}px)`;
        dot.style.opacity = ptr.seen ? 1 : 0;
        if (Math.abs(tx - ptr.rx) > .3 || Math.abs(ty - ptr.ry) > .3 || Math.abs(ds) > .005 || Math.abs(tw - ptr.tw) > .3 || Math.abs(th - ptr.th) > .3) again = true;
      }
      if (again) raf = requestAnimationFrame(frame);
      else prevT = 0;
    }
    resize();
    on(window, 'resize', resize);
    later(() => { cancelAnimationFrame(raf); raf = 0; });

    // HUD: progress, gauge, current stage, pointer coordinates.
    const named = [hero, ...projects].filter(Boolean);
    hud.querySelector('.of').textContent = String(named.length - 1).padStart(2, '0');
    let lit = -1, ticking = false, tinted = -1;
    later(() => { root.style.removeProperty('--od-c1'); root.style.removeProperty('--od-c3'); });
    const onScroll = () => {
      ticking = false;
      if (!od) return;
      // All the reads first (page height, section positions, accent), then the writes.
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      let cur = 0;
      named.forEach((s, k) => { if (s.getBoundingClientRect().top < innerHeight * .45) cur = k; });
      const acc = cur !== tinted && cur !== 0 ? getComputedStyle(named[cur]).getPropertyValue('--accent').trim() : '';
      progress.style.setProperty('--p', p.toFixed(4));
      const nl = Math.round(p * segs.length);
      if (nl !== lit) {
        if (lit >= 0) audio.play('seg');
        lit = nl;
        segs.forEach((s, k) => s.classList.toggle('on', k < lit));
      }
      hud.querySelector('b').textContent = String(cur).padStart(2, '0');
      hud.querySelector('.nm').textContent = cur === 0 ? 'START' : named[cur].id.replace(/-/g, ' ');
      if (cur !== tinted) {
        tinted = cur;
        if (acc) { root.style.setProperty('--od-c1', acc); root.style.setProperty('--od-c3', `color-mix(in oklab, ${acc} 60%, #ff2e88)`); }
        else { root.style.removeProperty('--od-c1'); root.style.removeProperty('--od-c3'); }
      }
      kick();
    };
    on(window, 'scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    // Custom cursor that locks onto links, windows that tilt, magnetic buttons, pixel trail.
    if (motion() && finePointer()) {
      dot = add(hidden('div', 'od-dot'), document.body);
      ring = add(hidden('div', 'od-ring'), document.body);
      ring.dataset.label = 'LOCK';
      root.classList.add('od-cursor-on');
      later(() => root.classList.remove('od-cursor-on'));
    }
    const xy = hud.querySelector('.xy');
    on(window, 'pointermove', e => {
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.seen = true;
      xy.textContent = `X ${String(Math.round(e.clientX)).padStart(4, '0')} · Y ${String(Math.round(e.clientY + scrollY)).padStart(4, '0')}`;
      const t = e.target instanceof Element ? e.target.closest('a, button, video, .od-sticker, pre[tabindex], .od-pose > div, .fx-buddy') : null;
      if (t !== ptr.target && ring) {
        ring.dataset.label = !t ? 'LOCK' : t.matches('.fx-open') ? 'OPEN ↗' : (t.dataset.href || t.getAttribute('href') || '').startsWith('#') ? 'GO ↓' : t.matches('.od-sticker') ? 'DRAG' : t.matches('.fx-buddy') ? 'HI!' : 'LOCK';
      }
      ptr.target = t;
      if (motion() && e.pointerType !== 'touch' && !lite) {
        for (let i = 0; i < 2; i++) parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * 2.4, vy: (Math.random() - .8) * 2.2, life: 1, c: COLORS[Math.random() * 4 | 0], s: 2 + Math.random() * 4 });
        if (parts.length > 160) parts.splice(0, parts.length - 160);
      }
      kick();
    }, { passive: true });
    on(window, 'pointerdown', () => { ptr.down = true; kick(); });
    on(window, 'pointerup', () => { ptr.down = false; kick(); });
    on(document, 'pointerleave', () => { ptr.seen = false; kick(); });

    if (motion() && finePointer()) {
      document.querySelectorAll('.stage').forEach(st => {
        let r2 = 0, ev = null;
        const apply = () => {
          r2 = 0;
          if (!ev) return;
          const r = st.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
          st.style.setProperty('--ry', `${((px - .5) * 9).toFixed(2)}deg`);
          st.style.setProperty('--rx', `${((.5 - py) * 7).toFixed(2)}deg`);
          st.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
          st.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        };
        on(st, 'pointermove', e => { ev = e; if (!r2) r2 = requestAnimationFrame(apply); });
        on(st, 'pointerleave', () => { ev = null; st.style.setProperty('--rx', '0deg'); st.style.setProperty('--ry', '0deg'); });
      });
      later(() => {
        document.querySelectorAll('.stage').forEach(st => ['--rx', '--ry', '--mx', '--my'].forEach(p => st.style.removeProperty(p)));
      });
    }
    later(() => root.classList.remove('od-intro'));
  }

  function odOff() {
    if (!od) return;
    const b = od;
    od = null;
    b.clear();
    document.querySelectorAll('.od-boot').forEach(n => n.remove());
  }

  function boot() {
    if (!motion()) return intro();
    audio.play('boot');
    const b = hidden('div', 'od-boot out',
      '<div class="in">' +
      '<p>BOULIW BIOS 26.10 ── FUN MODE</p>' +
      '<p>CHECKING DISPLAY ......... <b>OK</b></p>' +
      '<p>LOADING Y2K.CHROME ....... <b>OK</b></p>' +
      '<p>LOADING PHANTOM.MENU ..... <b>OK</b></p>' +
      '<p>LOADING ALERT.CARDS ...... <b>OK</b></p>' +
      '<p>LOADING NEON.GRID ........ <b>OK</b></p>' +
      '<p>LOADING 8BIT.SPRITES ..... <b>OK</b></p>' +
      `<div class="bar">${Array.from({ length: 24 }, (_, i) => `<i style="animation-delay:${(.2 + i * .05).toFixed(2)}s"></i>`).join('')}</div>` +
      '<p class="start">PRESS START</p></div>' +
      '<span class="kana">ファンモード起動</span><i class="w w1"></i><i class="w w2"></i><i class="w w3"></i>');
    document.body.append(b);
    // Typewriter clicks as each line appears.
    [50, 220, 360, 500, 640, 780, 920].forEach(ms => setTimeout(() => { for (let i = 0; i < 4; i++) setTimeout(() => audio.play('type'), i * 34); }, ms));
    let done = false;
    const esc = e => { if (e.key === 'Escape') skip(); };
    const finish = () => {
      if (done) return;
      done = true;
      removeEventListener('keydown', esc);
      b.remove();
      if (od) intro();
    };
    const skip = () => { b.classList.add('skip'); setTimeout(finish, 200); };
    b.addEventListener('click', skip);
    addEventListener('keydown', esc);
    setTimeout(finish, 2750);
  }

  /* ================= Switching ================= */
  function setSkin(k, save) {
    if (!isSkin(k)) k = DEFAULT_SKIN;
    const changed = root.dataset.skin !== k;
    root.dataset.skin = k;
    if (save) store.set(STYLE_KEY, k);
    if (k === 'overdrive') odOn(); else odOff();
    if (dock) dock.querySelectorAll('[data-skin-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.skinBtn === k)));
    const tried = new Set(store.list(TRIED_KEY));
    const fresh = !tried.has(k);
    tried.add(k);
    store.set(TRIED_KEY, JSON.stringify([...tried]));
    if (tried.size >= SKINS.length) trophy('hopper');
    if (save && changed) xp.add(fresh ? 20 : 10);
    requestAnimationFrame(() => moveSel(false));
    if (changed) { clearTitlesSoon(30); setTimeout(clearTitles, 700); }
    if (changed && buddy.el) buddy.outfit();
    // The layout moves with the style: put the bugs back against their edges.
    if (changed) { bugs.place(); setTimeout(() => bugs.place(), 800); }
  }

  function pickSkin(k) {
    if (k === root.dataset.skin || busy) return;
    audio.play('switch');
    cover(SKIN_COVER[k], k, label(k), 'STYLE', () => {
      setSkin(k, true);
      trophy('costume');
      if (k === 'overdrive') intro();
    });
  }

  const ICONS = {
    soundOff: '<svg class="off" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9l5 6m0-6-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    soundOn: '<svg class="on" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 4v11.3A3.5 3.5 0 1 0 11 18.5V8l9-2v7.3a3.5 3.5 0 1 0 2 3.2V2z"/></svg>',
    event: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m12 12.6.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor" stroke="none"/></svg>',
    typing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h0M10 10h0M14 10h0M18 10h0M7 14h10" stroke-linecap="round"/></svg>',
  };

  function syncAudioButtons() {
    if (!dock) return;
    dock.querySelector('.fx-sound').setAttribute('aria-pressed', String(audio.fx));
    dock.querySelectorAll('.fx-music, .fx-typing').forEach(b => { b.hidden = !audio.fx; });
    dock.querySelector('.fx-music').setAttribute('aria-pressed', String(audio.music));
    dock.querySelector('.fx-typing').setAttribute('aria-pressed', String(audio.typing));
  }

  function buildDock() {
    dock = document.createElement('div');
    dock.className = 'fx-dock';
    dock.setAttribute('role', 'group');
    dock.setAttribute('aria-label', u('dock'));
    dock.innerHTML = '<button type="button" class="fx-xp" aria-haspopup="dialog" aria-expanded="false"><b>LV 1</b><i aria-hidden="true"></i></button><span class="fx-dock-label" aria-hidden="true">STYLE</span>' +
      SKINS.map(([k, name]) => `<button type="button" data-skin-btn="${k}" aria-pressed="false"><span class="sw" aria-hidden="true"></span>${name}</button>`).join('') +
      '<span class="fx-dock-sep" aria-hidden="true"></span>' +
      `<button type="button" class="fx-sound" aria-pressed="false" aria-label="${u('sound')}">${ICONS.soundOff}${ICONS.soundOn}<span class="lbl" aria-hidden="true">${u('sound')}</span></button>` +
      `<button type="button" class="fx-music" aria-pressed="false" aria-label="${u('music')}" hidden>${ICONS.music}<span class="lbl" aria-hidden="true">${u('music')}</span></button>` +
      `<button type="button" class="fx-typing" aria-pressed="false" aria-label="${u('typingAria')}" hidden>${ICONS.typing}<span class="lbl" aria-hidden="true">${u('typing')}</span></button>` +
      `<button type="button" class="fx-event" aria-haspopup="menu" aria-expanded="false">${ICONS.event}<span class="lbl" aria-hidden="true">${u('event')}</span></button>`;
    dock.addEventListener('click', e => {
      if (e.target.closest('.fx-xp')) { openPanel(); return; }
      const ev = e.target.closest('.fx-event');
      if (ev) { eventMenu(ev); return; }
      const b = e.target.closest('[data-skin-btn]');
      if (b) pickSkin(b.dataset.skinBtn);
      if (e.target.closest('.fx-sound')) {
        audio.fx = !audio.fx;
        store.set(SOUND_KEY, audio.fx ? 'on' : 'off');
        if (audio.fx) { audio.ready(); setTimeout(() => { audio.play('switch'); music.sync(); }, 40); trophy('sound'); } else music.sync();
        syncAudioButtons();
      }
      if (e.target.closest('.fx-music')) {
        audio.music = !audio.music;
        store.set(MUSIC_KEY, audio.music ? 'on' : 'off');
        music.sync();
        syncAudioButtons();
      }
      if (e.target.closest('.fx-typing')) {
        audio.typing = !audio.typing;
        store.set(TYPING_KEY, audio.typing ? 'on' : 'off');
        if (audio.typing) audio.play('type');
        syncAudioButtons();
      }
    });
    // Right after the header: next in tab order, but outside the header so it stays pinned to the window.
    const header = toggle.closest('header');
    (header || toggle).after(dock);
    syncAudioButtons();
    syncEventButton();
    xp.render();
  }

  function setOn(state, { save = false } = {}) {
    toggle.setAttribute('aria-pressed', String(state));
    if (state) {
      root.dataset.fun = '';
      if (!dock) buildDock();
      const skin = isSkin(root.dataset.skin) ? root.dataset.skin : (store.get(STYLE_KEY) || DEFAULT_SKIN);
      root.dataset.skin = isSkin(skin) ? skin : DEFAULT_SKIN;
      coreOn();
      setSkin(root.dataset.skin, false);
    } else {
      music.stop();
      audio.keepAwake(false);
      closePanel(false);
      closeEventMenu(false);
      lite = false;
      root.classList.remove('fx-lite');
      odOff();
      coreOff();
      if (dock) { dock.remove(); dock = null; }
      delete root.dataset.fun;
      delete root.dataset.skin;
      root.classList.remove('od-intro');
    }
    if (save) store.set(KEY, state ? 'on' : 'off');
  }

  // The old TV switching off: used to leave fun mode, and at startup to leave the plain page.
  function powerOff(done) {
    if (!motion()) { done(); return; }
    audio.play('off');
    document.body.style.transformOrigin = `50% ${scrollY + innerHeight / 2}px`;
    root.classList.add('fx-poweroff');
    setTimeout(() => {
      root.classList.remove('fx-poweroff');
      document.body.style.transformOrigin = '';
      done();
    }, 450);
  }

  let relang = false;
  document.addEventListener('bouliw:beforelang', () => {
    if (!isOn()) return;
    relang = true;
    closePanel(false);
    closeEventMenu(false);
    odOff();
    coreOff();
  });
  document.addEventListener('bouliw:afterlang', () => {
    toggle.setAttribute('aria-label', u('fun'));
    if (!relang) return;
    relang = false;
    if (dock) { dock.remove(); dock = null; }
    buildDock();
    coreOn();
    setSkin(root.dataset.skin, false);
  });
  toggle.setAttribute('aria-label', u('fun'));

  toggle.addEventListener('click', () => {
    if (busy) return;
    const turnOn = toggle.getAttribute('aria-pressed') !== 'true';
    if (!turnOn) { powerOff(() => setOn(false, { save: true })); return; }
    setOn(true, { save: true });
    boot();
    setTimeout(() => trophy('start'), 3200);
  });

  // Opens straight into fun mode (the pre-paint script in index.html already set it).
  setOn(isOn());
  if (isOn()) {
    if (skinNow() === 'overdrive') intro(false);
    setTimeout(() => trophy('start'), 2600);
  }
})();
