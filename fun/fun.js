/* Bouliw · Fun mode.
   On by default. The Fun switch in the header brings back the plain site, and a dock
   picks the style: Overdrive (default), Y2K, Phantom, Alert, Neon, 8-bit or Mix.
   Choices (mode, style, sound, achievements) are kept in localStorage. */
(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.fun-toggle');
  if (!toggle) return;

  const KEY = 'bouliw-fun';
  const STYLE_KEY = 'bouliw-fun-style';
  const SOUND_KEY = 'bouliw-fun-sound';
  const TROPHY_KEY = 'bouliw-fun-trophies';
  const TRIED_KEY = 'bouliw-fun-tried';
  const DEFAULT_SKIN = 'overdrive';
  const SKINS = [['overdrive', 'Overdrive'], ['y2k', 'Y2K'], ['phantom', 'Phantom'], ['alert', 'Alert'], ['neon', 'Neon'], ['pixel', '8-bit'], ['mix', 'Mix']];
  // In Mix, each section wears one style (keep in sync with build_css.py).
  const MIX = { takeline: 'phantom', roughcut: 'neon', 'mac-toolkit': 'neon', earshot: 'y2k', trackmend: 'y2k', vigie: 'alert', 'doc-indexer': 'alert', boulito: 'pixel', upstream: 'pixel' };
  const EPISODES = ['第壱話', '第弐話', '第参話', '第四話', '第伍話', '第六話', '第七話', '第八話', '第九話'];
  const SPARKS = ['#ff6bd5', '#b49cff', '#22d3ee', '#b6ff3b', '#6b2bff'];
  const COLORS = ['#b6ff3b', '#6b2bff', '#ff2e88', '#22d3ee', '#ffffff'];
  const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const TROPHIES = {
    start: ['New game', 'Opened the portfolio in fun mode'],
    costume: ['Costume change', 'Switched to another style'],
    hopper: ['Style hopper', 'Tried all seven styles'],
    tour: ['World tour', 'Visited all nine stages'],
    source: ['Open source', 'Opened a project'],
    konami: ['Old school', 'Entered the code from old games'],
    sticker: ['Sticker bomb', 'Moved a sticker'],
    sound: ['Sound check', 'Turned the sound on'],
    clicks: ['Button masher', 'Clicked 30 times'],
  };

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

  const hidden = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    n.setAttribute('aria-hidden', 'true');
    return n;
  };
  // A small bag of things to undo: injected nodes, listeners, restorers.
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

  /* ---------------- Sound: tiny 8-bit beeps made in the browser, off by default ---------------- */
  const sfx = {
    ctx: null,
    on: store.get(SOUND_KEY) === 'on',
    last: 0,
    ready() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    },
    tone(f, t, dur, type = 'square', vol = .035, f2 = 0) {
      const c = this.ctx;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + .02);
    },
    play(name) {
      if (!this.on || !isOn()) return;
      const c = this.ready();
      if (!c || c.state !== 'running') return;
      const t = c.currentTime + .005;
      if (name === 'hover') {
        if (performance.now() - this.last < 70) return;
        this.last = performance.now();
        this.tone(1320, t, .03, 'square', .012);
      } else if (name === 'click') { this.tone(660, t, .05); this.tone(990, t + .05, .07); }
      else if (name === 'switch') [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * .05, .08));
      else if (name === 'trophy') [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, t + i * .08, .16, 'triangle', .05));
      else if (name === 'whoosh') this.tone(180, t, .28, 'sawtooth', .022, 1600);
      else if (name === 'off') this.tone(880, t, .34, 'square', .03, 55);
      else if (name === 'boot') [262, 330, 392, 523, 659, 784].forEach((f, i) => this.tone(f, t + i * .07, .1));
    },
  };

  /* ---------------- Achievements ---------------- */
  let toasts = null;
  const unlocked = new Set(store.list(TROPHY_KEY));
  const queue = [];
  let showing = false;
  function trophy(id) {
    if (!TROPHIES[id] || unlocked.has(id) || !isOn()) return;
    unlocked.add(id);
    store.set(TROPHY_KEY, JSON.stringify([...unlocked]));
    queue.push(id);
    nextToast();
  }
  function nextToast() {
    if (showing || !queue.length || !toasts) return;
    showing = true;
    const id = queue.shift();
    const [name, desc] = TROPHIES[id];
    const t = document.createElement('div');
    t.className = 'fx-toast';
    t.innerHTML = '<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v3H8v-3h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1.2 1.8A5 5 0 0 1 7 8zm10 0v1q0 .9-.2 1.8A2 2 0 0 0 18 8V7z"/></svg></span>' +
      `<span><small>Achievement unlocked · ${unlocked.size}/${Object.keys(TROPHIES).length}</small><b></b><span></span></span>`;
    t.querySelector('b').textContent = name;
    t.querySelector('b + span').textContent = desc;
    toasts.append(t);
    sfx.play('trophy');
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => { t.remove(); showing = false; nextToast(); }, motion() ? 360 : 0);
    }, 3300);
  }

  /* ---------------- Text decode ---------------- */
  const originals = new WeakMap();
  function scramble(el, final, frames = 20, done) {
    if (!motion()) { if (done) done(); return; }
    let f = 0;
    const chars = [...final];
    const step = () => {
      if (!isOn()) { el.textContent = final; if (done) done(); return; }
      f++;
      const solved = Math.floor(chars.length * f / frames);
      el.textContent = chars.map((c, i) => (c === ' ' || c === ' ' || i < solved) ? c : GLYPHS[Math.random() * GLYPHS.length | 0]).join('');
      if (f < frames) requestAnimationFrame(step);
      else { el.textContent = final; if (done) done(); }
    };
    step();
  }
  function decode(el) {
    if (!motion() || el.children.length || el.dataset.fxBusy) return;
    if (!originals.has(el)) originals.set(el, el.textContent);
    el.dataset.fxBusy = '1';
    scramble(el, originals.get(el), 12, () => { delete el.dataset.fxBusy; });
  }

  /* ---------------- Covers: full-screen transitions ---------------- */
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

  /* ---------------- Menu poses and the sliding selection ---------------- */
  function moveSel(pop) {
    const sel = document.querySelector('.fx-sel');
    const a = document.querySelectorAll('.index a')[current];
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
    document.querySelectorAll('.index a').forEach((a, k) => a.classList.toggle('on', k === i));
    moveSel(true);
  }
  function buildPose(cls, index) {
    const pose = hidden('div', cls);
    index.querySelectorAll('li').forEach(li => {
      const href = li.querySelector('a').getAttribute('href');
      const sec = document.getElementById(href.slice(1));
      const item = document.createElement('a');
      item.href = href;
      item.tabIndex = -1;
      const icon = sec && sec.querySelector('.head img, .boulito-stage > img');
      const shot = sec && sec.querySelector('.stage img.shot, .stage .window img');
      if (icon || shot) {
        const img = new Image();
        img.src = (icon || shot).getAttribute('src');
        img.alt = '';
        if (!icon) img.className = 'shot-pose';
        item.append(img);
      } else {
        const b = document.createElement('b');
        b.className = 'num';
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

  /* ---------------- Click bursts ---------------- */
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
    if (kind === 'stars') fly(8).forEach((v, i) => make('star', `${v}--c:${['#e60012', '#ffffff', '#0a0a0b'][i % 3]};`));
    else if (kind === 'hex') { make('hex', ''); make('hex', 'animation-delay:.12s;opacity:0;animation-fill-mode:both;'); }
    else if (kind === 'coins') for (let i = 0; i < 4; i++) make('coin', `--dx:${rand(-70, 70)}px;animation-delay:${i * 40}ms;`);
    else if (kind === 'neon') { make('ring', ''); for (let i = 0; i < 10; i++) make('ray', `--a:${i * 36}deg;`); }
    else if (kind === 'sparks') fly(9).forEach((v, i) => make('spark', `${v}--c:${SPARKS[i % SPARKS.length]};`, '✦'));
    else { make('lock', ''); fly(10).forEach((v, i) => make('px', `${v}--c:${COLORS[i % 4]};`)); }
  }

  /* ---------------- Shared decorations, used by every style ---------------- */
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

    // Menu: poses, sliding selection.
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
        index.querySelectorAll('a.on').forEach(a => a.classList.remove('on'));
        index.querySelectorAll('li').forEach(li => li.style.removeProperty('--i'));
        current = -1;
      });
    }

    // Window titles, camera labels, episode cards, and windows that open their project.
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
      }
      const copy = p.querySelector('.copy');
      add(hidden('div', 'fx-ep', `<b>${EPISODES[i] || ''}</b><i>EPISODE:${String(i + 1).padStart(2, '0')}</i>`), copy, copy.firstChild);
    });
    later(() => document.querySelectorAll('[data-fx-name]').forEach(n => { n.removeAttribute('data-fx-name'); n.removeAttribute('data-fx-n'); }));

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
    }

    // Reveal on scroll, and the world tour.
    const seen = new Set();
    const stages = [...document.querySelectorAll('.project, .upstream')];
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      seen.add(e.target.id);
      if (seen.size === stages.length) trophy('tour');
      if (e.target.classList.contains('fx-in')) return;
      e.target.classList.add('fx-in');
      const h = e.target.querySelector('h2');
      if (h && od && motion()) setTimeout(() => scramble(h, h.dataset.text || h.textContent), 220);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    if (motion()) root.classList.add('fx-anim');
    stages.forEach(s => io.observe(s));
    later(() => { io.disconnect(); document.querySelectorAll('.fx-in').forEach(n => n.classList.remove('fx-in')); root.classList.remove('fx-anim'); });

    // Menu → project: a full-screen slash, then the page lands on the project.
    on(document, 'click', e => {
      const a = e.target.closest && e.target.closest('.index a, .fx-pose > a, .od-pose > a');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !motion() || busy) return;
      const id = a.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (!sec) return;
      e.preventDefault();
      const h = sec.querySelector('h2');
      const lab = sec.querySelector('.label');
      sfx.play('whoosh');
      cover('slash', skinOf(sec), h ? (h.dataset.text || h.textContent) : id, lab ? lab.textContent : '', () => {
        if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
        sec.scrollIntoView({ behavior: 'instant', block: 'start' });
        // Move focus along, as the plain link would.
        if (h) {
          h.setAttribute('tabindex', '-1');
          h.focus({ preventScroll: true });
          h.addEventListener('blur', () => h.removeAttribute('tabindex'), { once: true });
        }
      });
    });

    // Projects opened, clicks counted, bursts and sounds.
    let clicks = 0;
    on(document, 'click', e => {
      if (e.target.closest && e.target.closest('a[href*="github.com/"], .fx-open, a[href*="bouliw.github.io/vigie"]')) trophy('source');
    }, true);
    on(window, 'pointerdown', e => {
      if (!isOn()) return;
      if (++clicks === 30) trophy('clicks');
      if (motion() && e.target instanceof Element) burstAt(e.clientX, e.clientY, getComputedStyle(e.target).getPropertyValue('--fx-click').trim());
      if (e.target.closest && e.target.closest('a, button')) sfx.play('click');
    }, { passive: true });

    // Hover: titles and links decode themselves; links blip.
    on(document, 'pointerover', e => {
      if (!(e.target instanceof Element)) return;
      const el = e.target.closest('main h2, .index .t, .btn, .more, .top nav a, footer nav a');
      if (el && !(e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) decode(el);
      if (e.target.closest('a, button')) sfx.play('hover');
    });

    // Sparkle trail wherever a style asks for it (Y2K).
    let last = 0;
    on(window, 'pointermove', e => {
      if (e.pointerType === 'touch' || !motion()) return;
      const now = performance.now();
      if (now - last < 38 || !(e.target instanceof Element)) return;
      last = now;
      if (getComputedStyle(e.target).getPropertyValue('--fx-trail').trim() !== '1') return;
      const s = hidden('span', 'fx-spark');
      s.textContent = '✦';
      s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--c:${SPARKS[Math.random() * SPARKS.length | 0]};` +
        `--dx:${(Math.random() - .5) * 70}px;--dy:${18 + Math.random() * 46}px;font-size:${10 + Math.random() * 14}px`;
      document.body.append(s);
      setTimeout(() => s.remove(), 950);
    }, { passive: true });

    // ↑ ↑ ↓ ↓ ← → ← → B A
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let k = 0;
    on(document, 'keydown', e => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      k = key === code[k] ? k + 1 : (key === code[0] ? 1 : 0);
      if (k === code.length) {
        k = 0;
        trophy('konami');
        root.classList.add('od-hyper');
        if (motion()) confetti();
        setTimeout(() => root.classList.remove('od-hyper'), 6000);
      }
    });
    later(() => root.classList.remove('od-hyper'));
  }

  function coreOff() {
    if (!core) return;
    core.clear();
    core = null;
    document.querySelectorAll('.fx-spark, .fx-p, .od-confetti, .fx-slash, .fx-glitch, .fx-bars, .fx-alarm, .fx-iris, .fx-win').forEach(n => n.remove());
  }

  /* ---------------- Overdrive: HUD, cursor, particles, stickers, title cards ---------------- */
  function confetti(n = 90) {
    for (let i = 0; i < n; i++) {
      const c = hidden('i', 'od-confetti');
      c.style.cssText = `left:${Math.random() * 100}vw;background:${COLORS[i % COLORS.length]};--dx:${(Math.random() - .5) * 240}px;` +
        `--t:${1.6 + Math.random() * 1.8}s;--r:${(Math.random() - .5) * 1440}deg;animation-delay:${Math.random() * .5}s;` +
        (i % 3 ? '' : 'clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);width:16px;height:16px;');
      document.body.append(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

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
      '<span class="side">BOULIW // FUN MODE // ファンモード</span><span class="xy">X 0000 · Y 0000</span>' +
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
      add(hidden('div', 'od-thanks', '<b>▶ CONTINUE?</b><i>↑ ↑ ↓ ↓ ← → ← → B A</i>'), foot);
    }

    // HUD: progress, gauge, current stage, pointer coordinates.
    const named = [hero, ...projects].filter(Boolean);
    hud.querySelector('.of').textContent = String(named.length - 1).padStart(2, '0');
    const onScroll = () => {
      if (!od) return;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      progress.style.setProperty('--p', p.toFixed(4));
      const lit = Math.round(p * segs.length);
      segs.forEach((s, k) => s.classList.toggle('on', k < lit));
      let cur = 0;
      named.forEach((s, k) => { if (s.getBoundingClientRect().top < innerHeight * .45) cur = k; });
      hud.querySelector('b').textContent = String(cur).padStart(2, '0');
      hud.querySelector('.nm').textContent = cur === 0 ? 'START' : named[cur].id.replace(/-/g, ' ');
    };
    on(window, 'scroll', () => requestAnimationFrame(onScroll), { passive: true });
    onScroll();

    // Custom cursor that locks onto links, windows that tilt, magnetic buttons, pixel trail.
    let dot = null, ring = null;
    if (motion() && finePointer()) {
      dot = add(hidden('div', 'od-dot'), document.body);
      ring = add(hidden('div', 'od-ring'), document.body);
      ring.dataset.label = 'LOCK';
      root.classList.add('od-cursor-on');
      later(() => root.classList.remove('od-cursor-on'));
    }
    const ptr = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2, s: 1, down: false, target: null, seen: false };
    const xy = hud.querySelector('.xy');
    const parts = [];
    const spawn = (x, y, n) => {
      for (let i = 0; i < n; i++) {
        parts.push({ x, y, vx: (Math.random() - .5) * 2.4, vy: (Math.random() - .8) * 2.2, life: 1, c: COLORS[Math.random() * 4 | 0], s: 2 + Math.random() * 4 });
      }
      if (parts.length > 260) parts.splice(0, parts.length - 260);
    };
    on(window, 'pointermove', e => {
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.seen = true;
      xy.textContent = `X ${String(Math.round(e.clientX)).padStart(4, '0')} · Y ${String(Math.round(e.clientY + scrollY)).padStart(4, '0')}`;
      const t = e.target instanceof Element ? e.target.closest('a, button, video, .od-sticker, pre[tabindex]') : null;
      if (t !== ptr.target && ring) {
        ring.dataset.label = !t ? 'LOCK' : t.matches('.fx-open') ? 'OPEN ↗' : (t.getAttribute('href') || '').startsWith('#') ? 'GO ↓' : t.matches('.od-sticker') ? 'DRAG' : 'LOCK';
      }
      ptr.target = t;
      if (motion() && e.pointerType !== 'touch') spawn(e.clientX, e.clientY, 2);
    }, { passive: true });
    on(window, 'pointerdown', () => { ptr.down = true; });
    on(window, 'pointerup', () => { ptr.down = false; });
    on(document, 'pointerleave', () => { ptr.seen = false; });

    if (motion() && finePointer()) {
      document.querySelectorAll('.stage').forEach(st => {
        on(st, 'pointermove', e => {
          const r = st.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          st.style.setProperty('--ry', `${(px - .5) * 9}deg`);
          st.style.setProperty('--rx', `${(.5 - py) * 7}deg`);
          st.style.setProperty('--mx', `${px * 100}%`);
          st.style.setProperty('--my', `${py * 100}%`);
        });
        on(st, 'pointerleave', () => { st.style.setProperty('--rx', '0deg'); st.style.setProperty('--ry', '0deg'); });
      });
      document.querySelectorAll('.btn').forEach(b => {
        on(b, 'pointermove', e => {
          const r = b.getBoundingClientRect();
          b.style.translate = `${(e.clientX - r.left - r.width / 2) * .25}px ${(e.clientY - r.top - r.height / 2) * .35}px`;
        });
        on(b, 'pointerleave', () => { b.style.translate = ''; });
      });
      later(() => {
        document.querySelectorAll('.stage').forEach(st => ['--rx', '--ry', '--mx', '--my'].forEach(p => st.style.removeProperty(p)));
        document.querySelectorAll('.btn').forEach(b => { b.style.translate = ''; });
      });
    }

    // Canvas: drifting pixel stars plus the pointer trail. The cursor is drawn in the same loop.
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), z: .2 + Math.random() * .8, s: Math.random() < .15 ? 3 : 2, t: Math.random() * 6 }));
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    on(window, 'resize', resize);
    const dark = matchMedia('(prefers-color-scheme: dark)');
    let raf = 0;
    const frame = time => {
      if (motion()) raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      const starColor = dark.matches ? '245,245,247' : '107,43,255';
      for (const s of stars) {
        const y = ((s.y * H - scrollY * s.z * .35) % H + H) % H;
        const a = (.25 + .55 * Math.abs(Math.sin(time / 900 + s.t))) * s.z;
        ctx.fillStyle = `rgba(${starColor},${a.toFixed(3)})`;
        ctx.fillRect(Math.round(s.x * W), Math.round(y), s.s, s.s);
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += .06; p.life -= .022;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
        ctx.globalAlpha = 1;
      }
      if (ring) {
        let tx = ptr.x - 17, ty = ptr.y - 17, tw = 34, th = 34;
        if (ptr.target && ptr.target.isConnected) {
          const r = ptr.target.getBoundingClientRect();
          tx = r.left - 7; ty = r.top - 7; tw = r.width + 14; th = r.height + 14;
          ring.classList.add('lock');
        } else ring.classList.remove('lock');
        ptr.rx += (tx - ptr.rx) * .22; ptr.ry += (ty - ptr.ry) * .22;
        ptr.s += ((ptr.down ? .9 : 1) - ptr.s) * .35;
        // The press shrinks the frame around its own centre, so it never drifts.
        const w = tw * ptr.s, h = th * ptr.s;
        ring.style.transform = `translate(${ptr.rx + (tw - w) / 2}px, ${ptr.ry + (th - h) / 2}px)`;
        ring.style.width = `${w}px`; ring.style.height = `${h}px`;
        ring.style.opacity = ptr.seen ? 1 : 0;
        dot.style.transform = `translate(${ptr.x}px, ${ptr.y}px)`;
        dot.style.opacity = ptr.seen ? 1 : 0;
      }
    };
    raf = requestAnimationFrame(frame);
    later(() => cancelAnimationFrame(raf));
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
    sfx.play('boot');
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

  /* ---------------- Switching ---------------- */
  function setSkin(k, save) {
    if (!isSkin(k)) k = DEFAULT_SKIN;
    root.dataset.skin = k;
    if (save) store.set(STYLE_KEY, k);
    if (k === 'overdrive') odOn(); else odOff();
    if (dock) dock.querySelectorAll('[data-skin-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.skinBtn === k)));
    const tried = new Set(store.list(TRIED_KEY));
    tried.add(k);
    store.set(TRIED_KEY, JSON.stringify([...tried]));
    if (tried.size >= SKINS.length) trophy('hopper');
    requestAnimationFrame(() => moveSel(false));
  }

  function pickSkin(k) {
    if (k === root.dataset.skin || busy) return;
    sfx.play('switch');
    cover(SKIN_COVER[k], k, label(k), 'STYLE', () => {
      setSkin(k, true);
      trophy('costume');
      if (k === 'overdrive') intro();
    });
  }

  function buildDock() {
    dock = document.createElement('div');
    dock.className = 'fx-dock';
    dock.setAttribute('role', 'group');
    dock.setAttribute('aria-label', 'Fun mode style');
    dock.innerHTML = '<span class="fx-dock-label" aria-hidden="true">STYLE</span>' +
      SKINS.map(([k, name]) => `<button type="button" data-skin-btn="${k}" aria-pressed="false"><span class="sw" aria-hidden="true"></span>${name}</button>`).join('') +
      '<span class="fx-dock-sep" aria-hidden="true"></span>' +
      `<button type="button" class="fx-sound" aria-pressed="${sfx.on}" aria-label="Sound">` +
      '<svg class="off" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6" stroke="currentColor" stroke-width="2" fill-rule="evenodd"/></svg>' +
      '<svg class="on" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<span class="lbl" aria-hidden="true">Sound</span></button>';
    dock.addEventListener('click', e => {
      const b = e.target.closest('[data-skin-btn]');
      if (b) pickSkin(b.dataset.skinBtn);
      const s = e.target.closest('.fx-sound');
      if (s) {
        sfx.on = !sfx.on;
        s.setAttribute('aria-pressed', String(sfx.on));
        store.set(SOUND_KEY, sfx.on ? 'on' : 'off');
        if (sfx.on) { sfx.ready(); setTimeout(() => sfx.play('switch'), 30); trophy('sound'); }
      }
    });
    // Right after the header: next in tab order, but outside the header so it stays pinned to the window.
    const header = toggle.closest('header');
    (header || toggle).after(dock);
  }

  function setOn(state, { save = false } = {}) {
    toggle.setAttribute('aria-pressed', String(state));
    if (state) {
      root.dataset.fun = '';
      coreOn();
      if (!dock) buildDock();
      const skin = isSkin(root.dataset.skin) ? root.dataset.skin : (store.get(STYLE_KEY) || DEFAULT_SKIN);
      setSkin(skin, false);
    } else {
      odOff();
      coreOff();
      if (dock) { dock.remove(); dock = null; }
      delete root.dataset.fun;
      delete root.dataset.skin;
      root.classList.remove('od-intro');
    }
    if (save) store.set(KEY, state ? 'on' : 'off');
  }

  function powerOff(done) {
    if (!motion()) { done(); return; }
    sfx.play('off');
    document.body.style.transformOrigin = `50% ${scrollY + innerHeight / 2}px`;
    root.classList.add('fx-poweroff');
    setTimeout(() => {
      root.classList.remove('fx-poweroff');
      document.body.style.transformOrigin = '';
      done();
    }, 450);
  }

  toggle.addEventListener('click', () => {
    if (busy) return;
    const turnOn = toggle.getAttribute('aria-pressed') !== 'true';
    if (!turnOn) { powerOff(() => setOn(false, { save: true })); return; }
    const skin = store.get(STYLE_KEY);
    const k = isSkin(skin) ? skin : DEFAULT_SKIN;
    if (k === 'overdrive') {
      setOn(true, { save: true });
      boot();
    } else {
      cover(SKIN_COVER[k], k, label(k), 'FUN MODE', () => setOn(true, { save: true }));
    }
    setTimeout(() => trophy('start'), 3200);
  });

  setOn(isOn());
  if (isOn()) {
    if (root.dataset.skin === 'overdrive') intro(false);
    setTimeout(() => trophy('start'), 2600);
  }
})();
