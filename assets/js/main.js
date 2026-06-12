/* ════════════════════════════════════════════════════════════
   ARTEQ AI — Motion + sound system
   Lenis smooth scroll · GSAP/ScrollTrigger · three.js · WebAudio
   ════════════════════════════════════════════════════════════ */

(() => {
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  const hasLenis = typeof Lenis !== 'undefined';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!hasGSAP || reduced) document.documentElement.classList.add('no-motion');
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis smooth scroll, driven by GSAP ticker ────────── */
  let lenis = null;
  if (hasLenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: true, touchMultiplier: 1.3 });
    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault();
          lenis.scrollTo(id, { offset: -90 });
        }
      });
    });
  }

  /* ── Sound design (WebAudio, synthesized — no files) ───── */
  const Sound = (() => {
    let ctx = null;
    let enabled = localStorage.getItem('arteq-snd') !== 'off';
    const ensure = () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    const blip = (freq, dur, type, vol) => {
      if (!enabled) return;
      const c = ensure();
      if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(vol || 0.05, c.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur + 0.02);
    };
    return {
      hover: () => blip(1450, 0.05, 'sine', 0.02),
      click: () => { blip(620, 0.09, 'square', 0.03); blip(1240, 0.07, 'sine', 0.025); },
      open: () => blip(880, 0.12, 'triangle', 0.045),
      close: () => blip(440, 0.1, 'triangle', 0.04),
      send: () => { blip(660, 0.1, 'sine', 0.05); setTimeout(() => blip(990, 0.14, 'sine', 0.05), 90); },
      toggle(v) { enabled = v; localStorage.setItem('arteq-snd', v ? 'on' : 'off'); if (v) ensure(); },
      get on() { return enabled; }
    };
  })();

  ['pointerdown', 'keydown'].forEach(ev =>
    window.addEventListener(ev, () => { if (Sound.on) Sound.toggle(true); }, { once: true })
  );

  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => Sound.hover());
    });
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) Sound.click();
  });

  const sndBtn = document.querySelector('.snd-toggle');
  const syncSnd = () => { if (sndBtn) sndBtn.classList.toggle('off', !Sound.on); };
  if (sndBtn) {
    syncSnd();
    sndBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      Sound.toggle(!Sound.on);
      syncSnd();
    });
  }

  /* ── Preloader: drafting sequence ──────────────────────── */
  const pre = document.querySelector('.preloader');
  const runIntro = () => {
    if (!pre) return introHero();
    if (!hasGSAP || reduced) { pre.classList.add('done'); return introHero(); }
    const guides = pre.querySelectorAll('.pg');
    const strokes = pre.querySelectorAll('.ps');
    const node = pre.querySelector('.pn');
    const status = pre.querySelector('.pre-status');
    const say = (t) => () => { if (status) status.textContent = t; };
    strokes.forEach((el) => {
      const len = el.getTotalLength();
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    });
    const tl = gsap.timeline({
      onComplete: () => { pre.classList.add('done'); introHero(); }
    });
    tl.to(guides, { opacity: 1, duration: 0.35, stagger: 0.09, ease: 'power1.out' })
      .call(say('ROUTING SIGNALS'))
      .to(strokes, { strokeDashoffset: 0, duration: 0.85, stagger: 0.11, ease: 'power2.inOut' }, '<0.15')
      .call(say('CALIBRATING AGENTS'))
      .to(node, { attr: { r: 4 }, duration: 0.3, ease: 'back.out(3)' })
      .to(strokes, { stroke: '#4640e0', duration: 0.3 }, '<')
      .call(say('SYSTEM ONLINE'))
      .to(pre, { yPercent: -100, duration: 0.7, ease: 'power4.inOut', delay: 0.3 });
  };

  /* ── Hero intro ────────────────────────────────────────── */
  const introHero = () => {
    if (!hasGSAP || reduced) return;
    const lines = document.querySelectorAll('.hero h1 .line > span');
    const tl = gsap.timeline();
    if (lines.length) {
      gsap.set(lines, { yPercent: 110 });
      tl.to(lines, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.09 });
    }
    if (document.querySelector('.hero .lead')) {
      tl.from('.hero .lead, .hero .hero-ctas, .hero .tag', {
        y: 26, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08
      }, '-=0.55');
    }
    const sch = document.querySelector('.schematic');
    if (sch && sch.closest('.hero')) {
      tl.from(sch, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'power4.inOut' }, '-=0.8')
        .from(sch.querySelector('img'), { scale: 1.15, duration: 1.2, ease: 'power3.out' }, '-=0.7');
    }
    if (document.querySelector('.page-hero h1')) {
      gsap.from('.page-hero h1, .page-hero .crumb, .page-hero .lead', {
        y: 40, opacity: 0, duration: 1, ease: 'power4.out', stagger: 0.1
      });
    }
  };
  window.addEventListener('load', runIntro);

  if (hasGSAP && hasST && !reduced) {

    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        delay: (parseFloat(el.dataset.delay) || 0),
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    gsap.utils.toArray('[data-stagger]').forEach((group) => {
      gsap.from(group.children, {
        opacity: 0, y: 36, duration: 0.8, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: group, start: 'top 85%', once: true }
      });
    });

    gsap.utils.toArray('[data-counter]').forEach((el) => {
      const end = parseFloat(el.dataset.counter);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = Math.round(obj.v); }
      });
    });

    /* marquee: infinite loop + scroll-velocity boost */
    document.querySelectorAll('.marquee').forEach((mq) => {
      const track = mq.querySelector('.marquee-track');
      if (!track) return;
      track.innerHTML += track.innerHTML;
      const w = track.scrollWidth / 2;
      const loop = gsap.to(track, { x: -w, duration: 30, ease: 'none', repeat: -1 });
      let boost = gsap.to({}, {});
      ScrollTrigger.create({
        trigger: mq, start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          const v = 1 + Math.min(Math.abs(self.getVelocity()) / 800, 4);
          boost.kill();
          loop.timeScale(v);
          boost = gsap.to(loop, { timeScale: 1, duration: 1 });
        }
      });
    });

    /* pinned horizontal process */
    const pin = document.querySelector('.proc-pin');
    const track = document.querySelector('.proc-track');
    if (pin && track) {
      const dist = () => track.scrollWidth - pin.clientWidth + 80;
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top 12%', end: () => '+=' + dist(),
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
    }

    /* footer wordmark slide */
    const fw = document.querySelector('.ftr-word .w');
    if (fw) {
      gsap.from(fw, {
        xPercent: 8, opacity: 0.3, ease: 'none',
        scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'top 40%', scrub: 1 }
      });
    }

    /* watermark parallax */
    gsap.utils.toArray('.d-visual .watermark, .page-hero .wm').forEach((el) => {
      gsap.fromTo(el, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });

    /* section index rules grow in */
    gsap.utils.toArray('.sec-head .idx').forEach((el) => {
      gsap.from(el, {
        scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.opacity = 1; el.style.transform = 'none';
    });
  }

  /* ── Story scrub: words light up as you read ───────────── */
  document.querySelectorAll('.story-text').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => '<span class="w">' + w + '</span>').join(' ');
    if (!hasGSAP || !hasST || reduced) return;
    gsap.to(el.querySelectorAll('.w'), {
      color: '#0e0d3b',
      stagger: 0.06,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 }
    });
  });

  /* ── Hero: signal network — agents routing live traffic ── */
  const heroCanvas = document.getElementById('hero-3d');
  if (heroCanvas && !reduced) {
    const c2 = heroCanvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, nodes = [], edges = [], adj = [], pulses = [];

    const build = () => {
      const r = heroCanvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      heroCanvas.width = W * DPR; heroCanvas.height = H * DPR;
      c2.setTransform(DPR, 0, 0, DPR, 0, 0);
      nodes = []; edges = []; pulses = [];
      const step = Math.max(105, Math.min(170, W / 9));
      const cols = Math.ceil(W / step) + 1;
      const rows = Math.ceil(H / step) + 1;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          nodes.push({
            x: gx * step + (Math.random() - 0.5) * step * 0.55,
            y: gy * step + (Math.random() - 0.5) * step * 0.55,
            hub: Math.random() < 0.12
          });
        }
      }
      adj = nodes.map(() => []);
      const link = (a, b) => { adj[a].push(edges.length); adj[b].push(edges.length); edges.push([a, b]); };
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          if (gx < cols - 1 && Math.random() < 0.82) link(i, i + 1);
          if (gy < rows - 1 && Math.random() < 0.82) link(i, i + cols);
          if (gx < cols - 1 && gy < rows - 1 && Math.random() < 0.16) link(i, i + cols + 1);
        }
      }
      const P = Math.max(5, Math.min(14, Math.round(W / 110)));
      for (let k = 0; k < P && edges.length; k++) {
        const e = edges[Math.floor(Math.random() * edges.length)];
        pulses.push({ a: e[0], b: e[1], t: Math.random(), s: 0.25 + Math.random() * 0.3 });
      }
    };
    build();
    window.addEventListener('resize', build);

    let mx = 0, my = 0, visible = true, last = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0 })
      .observe(heroCanvas.parentElement);

    const hop = (p) => {
      const opts = adj[p.b].filter(ei => edges[ei][0] !== p.a && edges[ei][1] !== p.a);
      const pool = opts.length ? opts : adj[p.b];
      if (!pool.length) { const e = edges[Math.floor(Math.random() * edges.length)]; p.a = e[0]; p.b = e[1]; p.t = 0; return; }
      const e = edges[pool[Math.floor(Math.random() * pool.length)]];
      const from = p.b;
      p.b = (e[0] === from) ? e[1] : e[0];
      p.a = from;
      p.t = 0;
    };

    const tick = (now) => {
      requestAnimationFrame(tick);
      if (!visible || !edges.length) return;
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;
      c2.clearRect(0, 0, W, H);
      c2.save();
      c2.translate(mx * -18, my * -12);

      /* wiring */
      c2.lineWidth = 1;
      c2.strokeStyle = 'rgba(43, 41, 170, 0.12)';
      c2.beginPath();
      for (const [a, b] of edges) {
        c2.moveTo(nodes[a].x, nodes[a].y);
        c2.lineTo(nodes[b].x, nodes[b].y);
      }
      c2.stroke();

      /* nodes: endpoints + hub agents */
      for (const n of nodes) {
        if (n.hub) {
          c2.strokeStyle = 'rgba(70, 64, 224, 0.55)';
          c2.strokeRect(n.x - 3.5, n.y - 3.5, 7, 7);
        } else {
          c2.fillStyle = 'rgba(43, 41, 170, 0.32)';
          c2.fillRect(n.x - 1.5, n.y - 1.5, 3, 3);
        }
      }

      /* pulses: requests routed through the network */
      for (const p of pulses) {
        p.t += p.s * dt;
        if (p.t >= 1) hop(p);
        const A = nodes[p.a], B = nodes[p.b];
        const x = A.x + (B.x - A.x) * p.t;
        const y = A.y + (B.y - A.y) * p.t;
        const t0 = Math.max(0, p.t - 0.18);
        c2.strokeStyle = 'rgba(70, 64, 224, 0.45)';
        c2.lineWidth = 1.5;
        c2.beginPath();
        c2.moveTo(A.x + (B.x - A.x) * t0, A.y + (B.y - A.y) * t0);
        c2.lineTo(x, y);
        c2.stroke();
        c2.fillStyle = '#4640e0';
        c2.beginPath();
        c2.arc(x, y, 2.2, 0, Math.PI * 2);
        c2.fill();
      }
      c2.restore();
    };
    requestAnimationFrame(tick);
  }

  /* ── Magnetic buttons ──────────────────────────────────── */
  if (hasGSAP && !reduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ── Cursor dot ────────────────────────────────────────── */
  if (hasGSAP && !reduced && window.matchMedia('(hover: hover)').matches) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
    const xTo = gsap.quickTo(dot, 'x', { duration: 0.18, ease: 'power3' });
    const yTo = gsap.quickTo(dot, 'y', { duration: 0.18, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); });
    document.querySelectorAll('a, button, .index-row, .tile').forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(dot, { scale: 3.2, duration: 0.25 }));
      el.addEventListener('mouseleave', () => gsap.to(dot, { scale: 1, duration: 0.25 }));
    });
  }

  /* ── Active nav ────────────────────────────────────────── */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.hdr-nav a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* ── Mobile menu ───────────────────────────────────────── */
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
      if (open) Sound.open(); else Sound.close();
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      if (lenis) lenis.start();
    }));
  }

  /* ── FAQ accordion ─────────────────────────────────────── */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
        Sound.open();
      } else {
        Sound.close();
      }
    });
  });

  /* ── Contact form (demo handler) ───────────────────────── */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = document.getElementById('form-success');
      if (ok) ok.classList.add('visible');
      Sound.send();
      form.reset();
      // TODO: connect your form backend / CRM endpoint here.
    });
  }
})();