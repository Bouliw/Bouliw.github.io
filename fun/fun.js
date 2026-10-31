/* Bouliw · Fun mode.
   On by default. The Fun switch in the header brings back the plain site, and a dock
   picks the style: Overdrive (default), Y2K, Phantom, Alert, Neon, 8-bit or Mix.
   Choices (mode, style, sound, music, typing, achievements, XP) live in localStorage.
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
  const DEFAULT_SKIN = 'overdrive';
  const SKINS = [['overdrive', 'Overdrive'], ['y2k', 'Y2K'], ['phantom', 'Phantom'], ['alert', 'Alert'], ['neon', 'Neon'], ['pixel', '8-bit'], ['mix', 'Mix']];
  // In Mix, each section wears one style (keep in sync with build_css.py).
  const MIX = { takeline: 'phantom', roughcut: 'neon', 'mac-toolkit': 'neon', earshot: 'y2k', trackmend: 'y2k', vigie: 'alert', 'doc-indexer': 'alert', boulito: 'pixel', upstream: 'pixel' };
  const EPISODES = ['第壱話', '第弐話', '第参話', '第四話', '第伍話', '第六話', '第七話', '第八話', '第九話'];
  const SPARKS = ['#ff6bd5', '#b49cff', '#22d3ee', '#b6ff3b', '#6b2bff'];
  const COLORS = ['#b6ff3b', '#6b2bff', '#ff2e88', '#22d3ee', '#ffffff'];
  const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // Sprite atlas (fun/sprites/buddy.png): rows are outfits, then a row of extras.
  // Columns: 0-3 walk right, 4-7 walk left, 8 idle, 9 wave, 10 thumbs up, 11 arms crossed.
  const OUTFIT = { overdrive: 0, y2k: 1, phantom: 2, alert: 3, neon: 4, pixel: 0, mix: 0 };
  const MENU_POSES = [[0, 8], [5, 4], [3, 11], [2, 9], [5, 1], [5, 5], [2, 11], [1, 10], [4, 10]];
  const LINES = ['Hi there!', 'Pick a style below!', 'Click a window to see the code.', 'Try ↑↑↓↓←→←→BA', 'Insert coin at the bottom!', 'New outfit?', 'Turn the sound on!'];
  const TROPHIES = {
    start: ["It's dangerous to go alone", 'Opened the portfolio in fun mode'],
    costume: ['Outfit check', 'Switched to another style'],
    hopper: ["Gotta try 'em all", 'Tried all seven styles'],
    tour: ['Around the world in nine stages', 'Visited all nine projects'],
    source: ['Use the source, Luke', 'Opened a project'],
    konami: ['Thirty extra lives', 'Entered the code from old games'],
    sticker: ['Sticky fingers', 'Moved a sticker'],
    sound: ['Is this thing on?', 'Turned the sound on'],
    music: ['When the music is good', 'Turned the music on'],
    clicks: ['Carpal tunnel any%', 'Clicked 30 times'],
    arcade: ['Arcade rat', 'Found the hidden game'],
    ace: ['All your base are belong to us', 'Scored 3,000 points'],
  };

  // What to do for each achievement still locked; a counter where there is one.
  const HINTS = {
    start: 'Open the portfolio in fun mode',
    costume: 'Pick another style in the dock',
    hopper: 'Try all seven styles',
    tour: 'Scroll through all nine projects in one visit',
    source: 'Click a project window or one of its links',
    konami: 'Type the code shown in the footer',
    sticker: 'Drag a sticker around the Overdrive headline',
    sound: 'Turn the sound on in the dock',
    music: 'Turn the sound on, then the music',
    clicks: 'Click 30 times in one visit',
    arcade: 'Find the coin slot at the bottom of the page',
    ace: 'Score 3,000 in the hidden game',
  };
  const EARN = [
    ['Unlock an achievement', '+50'],
    ['Open a project on GitHub', '+25'],
    ['Try a style for the first time', '+20'],
    ['Reach a project you have not seen this visit', '+15'],
    ['Switch back to a style', '+10'],
    ['Press CONTINUE? in the footer', '+10'],
    ['Type the cheat code', '+30'],
    ['Scroll further down the page', '+3'],
    ['Click around (40 per visit) or poke the buddy', '+1 / +2'],
    ['Play the hidden game', 'score ÷ 50'],
  ];

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
    fx: store.get(SOUND_KEY) === 'on',
    music: store.get(MUSIC_KEY) === 'on',
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
      if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume().catch(() => {});
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
        case 'clear': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, t + i * .09, .14, k === 'sparks' ? 'sine' : 'square', .03)); break;
        case 'switch': [523, 659, 784, 1047].forEach((f, i) => T(f, t + i * .05, .08, 'square', .025)); break;
        case 'trophy': [784, 988, 1175, 1568].forEach((f, i) => T(f, t + i * .08, .16, 'triangle', .05)); break;
        case 'level': [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => T(f, t + i * .07, .12, 'square', .03)); break;
        case 'whoosh': T(180, t, .28, 'sawtooth', .02, 1600, 3000); this.hiss(t, .25, .02, 1200); break;
        case 'off': T(880, t, .34, 'square', .025, 55); break;
        case 'boot': [262, 330, 392, 523, 659, 784].forEach((f, i) => T(f, t + i * .07, .1, 'square', .025)); break;
        case 'jump': T(330, t, .14, 'square', .025, 880); break;
        case 'shoot': T(880, t, .08, 'square', .02, 300); break;
        case 'boom': this.hiss(t, .22, .06, 600, 'lowpass'); T(140, t, .2, 'square', .02, 40); break;
        case 'hurt': T(200, t, .3, 'sawtooth', .03, 60, 1200); break;
        case 'wave': [659, 784, 988, 1319].forEach((f, i) => T(f, t + i * .06, .1, 'square', .025)); break;
        case 'coin': T(988, t, .07, 'square', .03); T(1319, t + .07, .3, 'square', .03); break;
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
    wanted() { return audio.fx && audio.music && isOn() && !document.hidden; },
    sync() {
      if (this.wanted() && audio.ready()) this.start(); else this.stop();
      audio.keepAwake(audio.fx && isOn() && !document.hidden);
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
      while (this.next < c.currentTime + .25) {
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
  document.addEventListener('visibilitychange', () => {
    if (!audio.ctx) return;
    if (document.hidden) { music.stop(); audio.keepAwake(false); audio.ctx.suspend().catch(() => {}); }
    else if (audio.fx && isOn()) { audio.ctx.resume().then(() => music.sync()).catch(() => {}); }
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
      chip.setAttribute('aria-label', `Level ${L}, ${this.total - lo} of ${hi - lo} XP. Show achievements and how to level up`);
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
  function levelUp(L) {
    audio.play('level');
    buddy.react(9, `LEVEL ${L}!`);
    if (!motion()) return;
    const o = hidden('div', 'fx-levelup', '<b>LEVEL UP!</b><span></span>');
    o.querySelector('span').textContent = `LV ${L}`;
    document.body.append(o);
    setTimeout(() => o.remove(), 1900);
  }

  /* ================= Progress panel: level, achievements left, ways to earn XP ================= */
  let panel = null;
  let panelOff = null;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ICON_CUP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v3H8v-3h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1.2 1.8A5 5 0 0 1 7 8zm10 0v1q0 .9-.2 1.8A2 2 0 0 0 18 8V7z"/></svg>';
  const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3z"/></svg>';
  function counter(id) {
    if (id === 'hopper') return `${Math.min(store.list(TRIED_KEY).length, SKINS.length)}/${SKINS.length}`;
    if (id === 'tour') return `${visit.seen.size}/${visit.stages}`;
    if (id === 'clicks') return `${Math.min(visit.clicks, 30)}/30`;
    if (id === 'ace') { const hi = parseInt(store.get(HI_KEY) || '0', 10) || 0; return hi ? `best ${hi}` : ''; }
    return '';
  }
  function renderPanel() {
    const L = xp.level(), lo = 50 * (L - 1) * L, hi = 50 * L * (L + 1);
    const ids = Object.keys(TROPHIES);
    const todo = ids.filter(id => !unlocked.has(id)), done = ids.filter(id => unlocked.has(id));
    const best = parseInt(store.get(HI_KEY) || '0', 10) || 0;
    const item = (id, ok) => {
      const [name, desc] = TROPHIES[id];
      const c = ok ? '' : counter(id);
      return `<li class="${ok ? 'ok' : 'todo'}"><span class="ico">${ok ? ICON_CUP : ICON_LOCK}</span><span class="txt"><b>${esc(name)}</b><span>${esc(ok ? desc : HINTS[id])}</span></span>` +
        `<em>${c ? `<i>${esc(c)}</i>` : ''}${ok ? 'Done' : '+50 XP'}</em></li>`;
    };
    panel.querySelector('.fx-panel-body').innerHTML =
      `<div class="lv"><b>LV ${L}</b><span>${xp.total - lo} / ${hi - lo} XP</span></div>` +
      `<div class="bar"><i style="--p:${((xp.total - lo) / (hi - lo)).toFixed(3)}"></i></div>` +
      `<p class="next">${hi - xp.total} XP to level ${L + 1} · ${xp.total} XP in total</p>` +
      (todo.length ? `<div class="fx-sec">Still to unlock · ${todo.length}</div><ul class="ach">${todo.map(id => item(id, false)).join('')}</ul>` : '<p class="all">Every achievement unlocked. Well played.</p>') +
      `<div class="fx-sec">How to earn XP</div><ul class="earn">${EARN.map(([what, n]) => `<li><span>${esc(what)}</span><b>${esc(n)}</b></li>`).join('')}</ul>` +
      (done.length ? `<div class="fx-sec">Unlocked · ${done.length}/${ids.length}</div><ul class="ach">${done.map(id => item(id, true)).join('')}</ul>` : '') +
      (best ? `<p class="next">Hidden game high score: ${best}</p>` : '');
  }
  function openPanel() {
    if (panel) { closePanel(); return; }
    const chip = dock && dock.querySelector('.fx-xp');
    panel = document.createElement('div');
    panel.className = 'fx-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'fx-panel-title');
    panel.innerHTML = '<div class="fx-panel-top"><div class="fx-panel-title" id="fx-panel-title">Progress</div><button type="button" class="close" aria-label="Close">×</button></div><div class="fx-panel-body" tabindex="0"></div>';
    renderPanel();
    document.body.append(panel);
    if (chip) chip.setAttribute('aria-expanded', 'true');
    audio.play('switch');
    const close = panel.querySelector('.close');
    close.addEventListener('click', () => closePanel());
    close.focus();
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
      if (e.key === 'Tab') {
        const f = [close, panel.querySelector('.fx-panel-body')];
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
    const [name, desc] = TROPHIES[id];
    const t = document.createElement('div');
    t.className = 'fx-toast';
    t.innerHTML = '<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v3H8v-3h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1.2 1.8A5 5 0 0 1 7 8zm10 0v1q0 .9-.2 1.8A2 2 0 0 0 18 8V7z"/></svg></span>' +
      `<span><small>Achievement unlocked · ${unlocked.size}/${Object.keys(TROPHIES).length} · +50 XP</small><b></b><span></span></span>`;
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

  /* ================= The pixel buddy ================= */
  const spr = (c, r, extra = '') => `<span class="fx-spr${extra}" style="--c:${c};--r:${r}"></span>`;
  const buddy = {
    el: null, s: null, say: null, x: -90, timer: 0, talkTimer: 0, idleTimer: 0, until: 0, asleep: false,
    row() { return OUTFIT[skinNow()] || 0; },
    frame(c, walk = false, c0 = 0) {
      if (!this.s) return;
      this.s.style.setProperty('--c', c);
      this.s.style.setProperty('--r', this.row());
      this.s.style.setProperty('--c0', c0);
      this.s.classList.toggle('walk', walk && motion());
    },
    create() {
      if (this.el || !isOn()) return;
      this.el = hidden('div', 'fx-buddy', `<div class="hop">${spr(8, 0)}<span class="say"></span></div>`);
      this.s = this.el.querySelector('.fx-spr');
      this.say = this.el.querySelector('.say');
      this.el.addEventListener('click', e => {
        e.stopPropagation();
        this.wake();
        this.jump();
        this.talk(pick(LINES), 2200);
        if (xp.session.clicks < 40) xp.add(2);
      });
      document.body.append(this.el);
      this.x = -90;
      this.el.style.setProperty('--x', `${this.x}px`);
      this.frame(8);
      // Walk in once the boot screen (if any) is gone.
      const arrive = () => {
        if (!this.el) return;
        if (document.querySelector('.od-boot')) { setTimeout(arrive, 300); return; }
        this.walkTo(rand(40, Math.min(innerWidth * .4, 420)), () => this.talk('Hi there!', 1800));
      };
      if (motion()) setTimeout(arrive, 900);
      else { this.x = 16; this.el.style.setProperty('--x', '16px'); }
      this.schedule();
      this.poke();
    },
    destroy() {
      clearTimeout(this.timer); clearTimeout(this.talkTimer); clearTimeout(this.idleTimer);
      if (this.el) this.el.remove();
      this.el = this.s = this.say = null;
    },
    hide(v) { if (this.el) this.el.hidden = v; },
    schedule() {
      clearTimeout(this.timer);
      if (!this.el) return;
      this.timer = setTimeout(() => {
        if (!this.el || this.asleep || document.hidden || performance.now() < this.until || !motion()) { this.schedule(); return; }
        const r = Math.random();
        if (r < .6) this.walkTo(rand(16, innerWidth - 90));
        else if (r < .8) this.react(pick([9, 10, 11]), '', 1600);
        else this.react(8, pick(LINES), 2400);
        this.schedule();
      }, rand(6000, 12000));
    },
    walkTo(x, then) {
      if (!this.el || !motion()) return;
      const dist = Math.abs(x - this.x);
      if (dist < 4) { if (then) then(); return; }
      const t = dist / 75;
      this.frame(x > this.x ? 0 : 4, true, x > this.x ? 0 : 4);
      this.el.style.setProperty('--t', `${t}s`);
      this.el.style.setProperty('--x', `${x}px`);
      this.el.classList.toggle('r', x > innerWidth / 2);
      this.x = x;
      this.until = performance.now() + t * 1000;
      clearTimeout(this.walkDone);
      this.walkDone = setTimeout(() => { this.frame(8); if (then) then(); }, t * 1000);
    },
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
      this.el.classList.add('talk');
      clearTimeout(this.talkTimer);
      this.talkTimer = setTimeout(() => this.el && this.el.classList.remove('talk'), ms);
    },
    react(col, text, ms = 1800) {
      if (!this.el) return;
      this.wake();
      clearTimeout(this.walkDone);
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
      this.frame(8);
      if (motion()) { this.el.classList.remove('poof'); void this.el.offsetWidth; this.el.classList.add('poof'); }
      this.talk('New outfit!', 1400);
    },
    poke() {
      this.wake();
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.sleep(), 25000);
    },
    sleep() {
      if (!this.el || game) return;
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
    near(x, y) {
      if (!this.el || this.el.hidden) return false;
      const r = this.el.getBoundingClientRect();
      return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < 150;
    },
  };

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
    document.querySelectorAll('.fx-pose, .od-pose').forEach(p => [...p.children].forEach((n, k) => n.classList.toggle('on', k === i)));
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
        img.src = (icon || shot).getAttribute('src');
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
  function burstAt(x, y, kind) {
    const make = (cls, css, text) => {
      const p = hidden('i', `fx-p ${cls}`);
      p.style.cssText = `left:${x}px;top:${y}px;${css}`;
      if (text) p.textContent = text;
      document.body.append(p);
      setTimeout(() => p.remove(), 900);
    };
    const fly = n => Array.from({ length: n }, (_, i) => {
      const ang = (i / n) * Math.PI * 2 + rand(-.3, .3);
      const d = rand(40, 90);
      return `--dx:${Math.cos(ang) * d}px;--dy:${Math.sin(ang) * d}px;--r:${rand(-200, 200)}deg;`;
    });
    const n = lite ? .5 : 1;
    if (kind === 'stars') fly(Math.round(8 * n)).forEach((v, i) => make('star', `${v}--c:${['#e60012', '#ffffff', '#0a0a0b'][i % 3]};`));
    else if (kind === 'hex') { make('hex', ''); make('hex', 'animation-delay:.12s;opacity:0;animation-fill-mode:both;'); }
    else if (kind === 'coins') for (let i = 0; i < 4 * n; i++) make('coin', `--dx:${rand(-70, 70)}px;animation-delay:${i * 40}ms;`);
    else if (kind === 'neon') { make('ring', ''); for (let i = 0; i < 10 * n; i++) make('ray', `--a:${i * 36 / n}deg;`); }
    else if (kind === 'sparks') fly(Math.round(9 * n)).forEach((v, i) => make('spark', `${v}--c:${SPARKS[i % SPARKS.length]};`, '✦'));
    else { make('lock', ''); fly(Math.round(10 * n)).forEach((v, i) => make('px', `${v}--c:${COLORS[i % 4]};`)); }
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
    g.setAttribute('aria-label', 'Hidden game');
    g.innerHTML = '<div class="cab"><div class="hud"><span>SCORE <b class="sc">0</b></span><span>HI <b class="hi">0</b></span><span>LIVES <b class="lv">3</b></span></div>' +
      '<canvas width="240" height="320" tabindex="0" aria-label="Game screen. Move with the arrow keys or the pointer, fire with space or a tap."></canvas>' +
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

    // Scroll: scenery parallax, depth XP. One rAF per frame at most.
    let ticking = false;
    const onScroll = () => {
      ticking = false;
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
      if (!seen.has(e.target.id)) {
        seen.add(e.target.id);
        xp.add(15);
        audio.play('tick', clickKind(e.target));
        if (seen.size === stages.length) trophy('tour');
      }
      if (e.target.classList.contains('fx-in')) return;
      e.target.classList.add('fx-in');
      const h = e.target.querySelector('h2');
      if (h && od && motion()) setTimeout(() => scramble(h, h.dataset.text || h.textContent), 220);
      const pk = peeks.find(([p]) => p === e.target);
      if (pk) setTimeout(() => peekAt(pk[1], pk[2]), 700);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    if (motion()) root.classList.add('fx-anim');
    stages.forEach(s => io.observe(s));
    later(() => { io.disconnect(); document.querySelectorAll('.fx-in').forEach(n => n.classList.remove('fx-in')); root.classList.remove('fx-anim'); });
    const pauser = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('fx-paused', !e.isIntersecting)), { rootMargin: '200px 0px' });
    document.querySelectorAll('.hero, .project, .upstream, footer').forEach(s => pauser.observe(s));
    later(() => { pauser.disconnect(); document.querySelectorAll('.fx-paused').forEach(n => n.classList.remove('fx-paused')); });
    let cleared = false;
    if (foot) {
      const endIO = new IntersectionObserver(es => {
        if (es[0].isIntersecting && !cleared) { cleared = true; audio.play('clear', clickKind(foot)); buddy.react(9, 'Thanks for playing!', 2600); }
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
    const wake = () => { if (audio.fx && isOn() && (!audio.ctx || audio.ctx.state !== 'running')) { audio.ready(); setTimeout(() => music.sync(), 60); } };
    on(window, 'keydown', wake);
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
      const s = hidden('span', 'fx-spark');
      s.textContent = '✦';
      s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--c:${pick(SPARKS)};` +
        `--dx:${(Math.random() - .5) * 70}px;--dy:${18 + Math.random() * 46}px;font-size:${10 + Math.random() * 14}px`;
      document.body.append(s);
      setTimeout(() => s.remove(), 950);
    }, { passive: true });

    // ↑ ↑ ↓ ↓ ← → ← → B A
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let k = 0;
    on(document, 'keydown', e => {
      if (game) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      k = key === code[k] ? k + 1 : (key === code[0] ? 1 : 0);
      if (k === code.length) {
        k = 0;
        trophy('konami');
        xp.add(30);
        root.classList.add('od-hyper');
        if (motion()) confetti();
        buddy.react(10, 'Cheat code!', 2200);
        setTimeout(() => root.classList.remove('od-hyper'), 6000);
      }
    });
    later(() => root.classList.remove('od-hyper'));

    buddy.create();
    later(() => buddy.destroy());
    later(() => { if (game) game.close(); });
    music.sync();
    later(() => { music.stop(); audio.keepAwake(false); });
    probe();
  }

  function coreOff() {
    if (!core) return;
    core.clear();
    core = null;
    document.querySelectorAll('.fx-spark, .fx-p, .od-confetti, .fx-slash, .fx-glitch, .fx-bars, .fx-alarm, .fx-iris, .fx-win, .fx-levelup, .fx-xpgain').forEach(n => n.remove());
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
  function confetti(n = 90) {
    if (lite) n = 40;
    for (let i = 0; i < n; i++) {
      const c = hidden('i', 'od-confetti');
      c.style.cssText = `left:${Math.random() * 100}vw;background:${COLORS[i % COLORS.length]};--dx:${(Math.random() - .5) * 240}px;` +
        `--t:${1.6 + Math.random() * 1.8}s;--r:${(Math.random() - .5) * 1440}deg;animation-delay:${Math.random() * .5}s;` +
        (i % 3 ? '' : 'clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);width:16px;height:16px;');
      document.body.append(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  // CONTINUE? and the logo: back to the start of the page, with the style's own transition and the intro again.
  function backToTop({ title = 'CONTINUE', small = 'NEW GAME +', xp: gain = 10, say = 'Round 2!' } = {}) {
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

    projects.forEach((p, i) => {
      const n = String(i + 1).padStart(2, '0');
      const segsHtml = Array.from({ length: 9 }, (_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('');
      add(hidden('div', 'od-card', `<div class="inner"><b>${EPISODES[i] || ''}</b><span class="ep">EPISODE ${n}</span><span class="rule"></span>` +
        `<span>${p.id.replace(/-/g, ' ')}</span><span class="seg">${segsHtml}</span></div><span class="hz"></span>`), p, p.firstChild);
      const st = p.querySelector('.stage');
      if (st) add(hidden('span', 'od-sheen'), st);
    });

    const foot = document.querySelector('footer');
    if (foot) {
      add(hidden('div', 'od-endroll', `<span>${'Thanks for playing ✦ <em>Bouliw</em> ✦ '.repeat(6)}</span>`), foot, foot.firstChild);
      const thanks = add(hidden('div', 'od-thanks', '<i aria-hidden="true">↑ ↑ ↓ ↓ ← → ← → B A</i>'), foot);
      thanks.removeAttribute('aria-hidden');
      const cont = document.createElement('button');
      cont.type = 'button';
      cont.className = 'od-continue';
      cont.innerHTML = '<b aria-hidden="true">▶</b> CONTINUE?';
      cont.setAttribute('aria-label', 'Continue: back to the top');
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
    let lit = -1, ticking = false;
    const onScroll = () => {
      ticking = false;
      if (!od) return;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      progress.style.setProperty('--p', p.toFixed(4));
      const nl = Math.round(p * segs.length);
      if (nl !== lit) {
        if (lit >= 0) audio.play('seg');
        lit = nl;
        segs.forEach((s, k) => s.classList.toggle('on', k < lit));
      }
      let cur = 0;
      named.forEach((s, k) => { if (s.getBoundingClientRect().top < innerHeight * .45) cur = k; });
      hud.querySelector('b').textContent = String(cur).padStart(2, '0');
      hud.querySelector('.nm').textContent = cur === 0 ? 'START' : named[cur].id.replace(/-/g, ' ');
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
    if (changed && buddy.el) buddy.outfit();
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
    dock.setAttribute('aria-label', 'Fun mode style');
    dock.innerHTML = '<button type="button" class="fx-xp" aria-haspopup="dialog" aria-expanded="false"><b>LV 1</b><i aria-hidden="true"></i></button><span class="fx-dock-label" aria-hidden="true">STYLE</span>' +
      SKINS.map(([k, name]) => `<button type="button" data-skin-btn="${k}" aria-pressed="false"><span class="sw" aria-hidden="true"></span>${name}</button>`).join('') +
      '<span class="fx-dock-sep" aria-hidden="true"></span>' +
      `<button type="button" class="fx-sound" aria-pressed="false" aria-label="Sound">${ICONS.soundOff}${ICONS.soundOn}<span class="lbl" aria-hidden="true">Sound</span></button>` +
      `<button type="button" class="fx-music" aria-pressed="false" aria-label="Music" hidden>${ICONS.music}<span class="lbl" aria-hidden="true">Music</span></button>` +
      `<button type="button" class="fx-typing" aria-pressed="false" aria-label="Typing sounds" hidden>${ICONS.typing}<span class="lbl" aria-hidden="true">Typing</span></button>`;
    dock.addEventListener('click', e => {
      if (e.target.closest('.fx-xp')) { openPanel(); return; }
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

  toggle.addEventListener('click', () => {
    if (busy || root.classList.contains('fx-starting')) return;
    const turnOn = toggle.getAttribute('aria-pressed') !== 'true';
    if (!turnOn) { powerOff(() => setOn(false, { save: true })); return; }
    setOn(true, { save: true });
    boot();
    setTimeout(() => trophy('start'), 3200);
  });

  const FONTS = {
    overdrive: ['Mono', 'Serif', 'Dot', 'Press', 'Geist'], y2k: ['Michroma', 'Silk', 'Geist'], phantom: ['Anton', 'Geist', 'Display'],
    alert: ['Mono', 'Serif', 'Mincho'], neon: ['Mono', 'Orbitron'], pixel: ['Press', 'Silk', 'Pixelify'], mix: ['Anton', 'Geist', 'Mono', 'Orbitron', 'Michroma', 'Press', 'Serif'],
  };
  const preload = k => {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all((FONTS[k] || FONTS.overdrive).map(f => document.fonts.load(`16px "FX ${f}"`).catch(() => {})));
  };

  if (root.classList.contains('fx-pending')) {
    // Startup: the plain page shows for a moment, switches off like an old TV, and fun mode takes over.
    root.classList.add('fx-starting');
    const saved = store.get(STYLE_KEY);
    Promise.race([Promise.all([preload(isSkin(saved) ? saved : DEFAULT_SKIN), wait(420)]), wait(900)]).then(() => powerOff(() => {
      root.classList.remove('fx-pending', 'fx-starting');
      setOn(true);
      if (skinNow() === 'overdrive') intro();
      setTimeout(() => trophy('start'), 2200);
    }));
  } else {
    setOn(isOn());
    if (isOn()) {
      if (skinNow() === 'overdrive') intro(false);
      setTimeout(() => trophy('start'), 2600);
    }
  }
})();
