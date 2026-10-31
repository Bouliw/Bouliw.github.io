/* Bouliw · Fun mode.
   On by default. The Fun switch in the header brings back the plain site, and a dock
   picks the style: Overdrive (default), Y2K, Phantom, Alert, Neon, 8-bit or Mix.
   Both choices are kept in localStorage. */
(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.fun-toggle');
  if (!toggle) return;

  const KEY = 'bouliw-fun';
  const STYLE_KEY = 'bouliw-fun-style';
  const DEFAULT_SKIN = 'overdrive';
  const SKINS = [['overdrive', 'Overdrive'], ['y2k', 'Y2K'], ['phantom', 'Phantom'], ['alert', 'Alert'], ['neon', 'Neon'], ['pixel', '8-bit'], ['mix', 'Mix']];
  const EPISODES = ['第壱話', '第弐話', '第参話', '第四話', '第伍話', '第六話', '第七話', '第八話', '第九話'];
  const SPARKS = ['#ff6bd5', '#b49cff', '#22d3ee', '#b6ff3b', '#6b2bff'];
  const COLORS = ['#b6ff3b', '#6b2bff', '#ff2e88', '#22d3ee', '#ffffff'];
  const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: the choice just isn't kept */ } },
  };
  const motion = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = () => matchMedia('(pointer: fine)').matches;
  const isSkin = k => SKINS.some(([s]) => s === k);

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

  function scramble(el, final, frames = 20) {
    if (!motion()) return;
    let f = 0;
    const chars = [...final];
    const step = () => {
      if (!od) { el.textContent = final; return; }
      f++;
      const done = Math.floor(chars.length * f / frames);
      el.textContent = chars.map((c, i) => (c === ' ' || i < done) ? c : GLYPHS[Math.random() * GLYPHS.length | 0]).join('');
      if (f < frames) requestAnimationFrame(step); else el.textContent = final;
    };
    step();
  }

  // Menu poses: the index line in focus picks the pose shown beside the menu.
  function setPose(i) {
    if (i === current) return;
    current = i;
    document.querySelectorAll('.fx-pose, .od-pose').forEach(p => [...p.children].forEach((n, k) => n.classList.toggle('on', k === i)));
    document.querySelectorAll('.index a').forEach((a, k) => a.classList.toggle('on', k === i));
  }
  function buildPose(cls, index) {
    const pose = hidden('div', cls);
    index.querySelectorAll('li').forEach(li => {
      const sec = document.getElementById(li.querySelector('a').getAttribute('href').slice(1));
      const item = document.createElement('div');
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

  /* ---------------- Shared decorations, used by every style ---------------- */
  function coreOn() {
    if (core) return;
    core = bag();
    const { add, on, later } = core;

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
        [...word].forEach(c => { const ch = document.createElement('span'); ch.className = c === '\u00a0' ? 'fx-gap' : 'fx-ch'; ch.textContent = c; w.append(ch); });
        split.append(w);
      });
      em.replaceChildren(orig, split);
      later(() => { em.innerHTML = html; });
    }

    const index = document.querySelector('.index');
    if (index) {
      index.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
      add(buildPose('fx-pose', index), index);
      add(buildPose('od-pose', index), index);
      current = -1;
      setPose(0);
      const onPose = e => { const li = e.target.closest && e.target.closest('.index li'); if (li) setPose([...li.parentNode.children].indexOf(li)); };
      on(index, 'pointerover', onPose);
      on(index, 'focusin', onPose);
      later(() => {
        index.querySelectorAll('a.on').forEach(a => a.classList.remove('on'));
        index.querySelectorAll('li').forEach(li => li.style.removeProperty('--i'));
        current = -1;
      });
    }

    // Window titles, camera labels and episode cards.
    document.querySelectorAll('.project, .upstream').forEach((p, i) => {
      const st = p.querySelector('.stage');
      if (st) { st.dataset.fxName = p.id; st.dataset.fxN = i + 1; }
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

    // Reveal on scroll.
    if (motion()) {
      root.classList.add('fx-anim');
      const io = new IntersectionObserver(entries => entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('fx-in');
        io.unobserve(e.target);
        const h = e.target.querySelector('h2');
        if (h && od) setTimeout(() => scramble(h, h.dataset.text || h.textContent), 220);
      }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
      document.querySelectorAll('.project, .upstream').forEach(s => io.observe(s));
      later(() => { io.disconnect(); document.querySelectorAll('.fx-in').forEach(n => n.classList.remove('fx-in')); root.classList.remove('fx-anim'); });
    }

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
  }

  function coreOff() {
    if (!core) return;
    core.clear();
    core = null;
    document.querySelectorAll('.fx-spark').forEach(n => n.remove());
  }

  /* ---------------- Overdrive: HUD, cursor, particles, stickers, title cards ---------------- */
  function burst(n = 90) {
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
        let sx = 0, sy = 0, ox = 0, oy = 0, drag = false;
        s.addEventListener('pointerdown', e => { drag = true; s.setPointerCapture(e.pointerId); sx = e.clientX - ox; sy = e.clientY - oy; s.style.animation = 'none'; });
        s.addEventListener('pointermove', e => { if (!drag) return; ox = e.clientX - sx; oy = e.clientY - sy; s.style.translate = `${ox}px ${oy}px`; });
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
      root.classList.add('od-cursor-on');
      later(() => root.classList.remove('od-cursor-on'));
    }
    const ptr = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2, target: null, seen: false };
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
      ptr.target = e.target instanceof Element ? e.target.closest('a, button, video, .od-sticker, pre[tabindex]') : null;
      if (motion() && e.pointerType !== 'touch') spawn(e.clientX, e.clientY, 2);
    }, { passive: true });
    on(window, 'pointerdown', () => ring && ring.classList.add('down'));
    on(window, 'pointerup', () => ring && ring.classList.remove('down'));
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

    // Canvas: drifting pixel stars plus the pointer trail.
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
        ring.style.transform = `translate(${ptr.rx}px, ${ptr.ry}px)`;
        ring.style.width = `${tw}px`; ring.style.height = `${th}px`;
        ring.style.opacity = ptr.seen ? 1 : 0;
        dot.style.transform = `translate(${ptr.x}px, ${ptr.y}px)`;
        dot.style.opacity = ptr.seen ? 1 : 0;
      }
    };
    raf = requestAnimationFrame(frame);
    later(() => cancelAnimationFrame(raf));

    // ↑ ↑ ↓ ↓ ← → ← → B A
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let k = 0;
    on(document, 'keydown', e => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      k = key === code[k] ? k + 1 : (key === code[0] ? 1 : 0);
      if (k === code.length) {
        k = 0;
        root.classList.add('od-hyper');
        if (motion()) burst();
        setTimeout(() => root.classList.remove('od-hyper'), 6000);
      }
    });
    later(() => root.classList.remove('od-hyper', 'od-intro'));
  }

  function odOff() {
    if (!od) return;
    const b = od;
    od = null;
    b.clear();
    document.querySelectorAll('.od-boot, .od-confetti').forEach(n => n.remove());
  }

  function boot() {
    if (!motion()) return intro();
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
  function flash() {
    if (!motion()) return;
    root.classList.remove('fx-switching');
    void root.offsetWidth;
    root.classList.add('fx-switching');
    setTimeout(() => root.classList.remove('fx-switching'), 450);
  }

  function setSkin(k, save) {
    if (!isSkin(k)) k = DEFAULT_SKIN;
    root.dataset.skin = k;
    if (save) store.set(STYLE_KEY, k);
    if (k === 'overdrive') odOn(); else odOff();
    if (dock) dock.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.skinBtn === k)));
  }

  function buildDock() {
    dock = document.createElement('div');
    dock.className = 'fx-dock';
    dock.setAttribute('role', 'group');
    dock.setAttribute('aria-label', 'Fun mode style');
    dock.innerHTML = '<span class="fx-dock-label" aria-hidden="true">STYLE</span>' +
      SKINS.map(([k, label]) => `<button type="button" data-skin-btn="${k}" aria-pressed="false"><span class="sw" aria-hidden="true"></span>${label}</button>`).join('');
    dock.addEventListener('click', e => {
      const b = e.target.closest('[data-skin-btn]');
      if (!b || b.dataset.skinBtn === root.dataset.skin) return;
      flash();
      setSkin(b.dataset.skinBtn, true);
      if (b.dataset.skinBtn === 'overdrive') intro();
    });
    // Right after the header: next in tab order, but outside the header so it stays pinned to the window.
    const header = toggle.closest('header');
    (header || toggle).after(dock);
  }

  function setOn(state, { save = false, fromClick = false } = {}) {
    toggle.setAttribute('aria-pressed', String(state));
    if (state) {
      root.dataset.fun = '';
      coreOn();
      if (!dock) buildDock();
      const skin = isSkin(root.dataset.skin) ? root.dataset.skin : (store.get(STYLE_KEY) || DEFAULT_SKIN);
      setSkin(skin, false);
      if (skin === 'overdrive') { if (fromClick) boot(); else intro(false); } else if (fromClick) flash();
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

  toggle.addEventListener('click', () => setOn(toggle.getAttribute('aria-pressed') !== 'true', { save: true, fromClick: true }));
  setOn(root.hasAttribute('data-fun'));
})();
