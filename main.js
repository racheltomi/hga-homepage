/* HGA homepage — morphing housing + glass cards, reviews, proof, calendar, clock */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero: housing that morphs through every size ----------
     w/h/d = housing size in design px. cards = files in assets/cards/. */
  const FORMATS = [
    { id: "single",   name: "Single",    w: 250, h: 412, d: 20,  amp: 24, boost: 1,   cards: ["ohtani"],                                         title: "Shohei Ohtani", sub: "2025 Topps Finest" },
    { id: "booklet",  name: "Booklet",   w: 366, h: 330, d: 22,  amp: 22, boost: 1,   cards: ["gengar", "alakazam"],                             title: "Booklet",       sub: "2 panels" },
    { id: "trifold",  name: "Trifold",   w: 532, h: 330, d: 24,  amp: 18, boost: 0.5, cards: ["jenkins", "white", "ohtani"],                     title: "Trifold",       sub: "3 panels" },
    { id: "fivefold", name: "Five-fold", w: 864, h: 330, d: 26,  amp: 12, boost: 0,   cards: ["meowth", "gengar", "alakazam", "jenkins", "white"], title: "Five-fold",     sub: "5 panels" },
    { id: "deck",     name: "Deck",      w: 330, h: 470, d: 200, amp: 32, boost: 0.3, cards: ["meowth"],                                         title: "Deck",          sub: "Full deck" },
  ];
  const AUTO_MS = 3400;
  const stage = $("#stage"), rig = $("#rig"), slab = $("#slab"), bay = $("#bay"), dots = $("#fmtDots"), fmtName = $("#fmtName");
  let current = 0;

  FORMATS.forEach((f, i) => {
    const set = document.createElement("div");
    set.className = "panelset" + (i === 0 ? " on" : "");
    set.innerHTML = f.cards.map((c) => `<img src="assets/cards/${c}.jpg" alt="" loading="${i === 0 ? "eager" : "lazy"}" decoding="async" />`).join("");
    bay.appendChild(set);
    const b = document.createElement("button");
    b.className = "fmt-dot"; b.type = "button";
    b.setAttribute("role", "tab"); b.setAttribute("aria-label", f.name);
    b.addEventListener("click", () => { pauseAuto(); show(i); });
    dots.appendChild(b);
  });
  const sets = $$(".panelset", bay), dotBtns = $$(".fmt-dot", dots);
  dots.style.setProperty("--auto", AUTO_MS + "ms");

  // Sizes stay visibly ascending; the slab never runs under the side cards on desktop
  function fit() {
    const f = FORMATS[current];
    const narrow = innerWidth <= 860;
    const sw = stage.clientWidth * (narrow ? 0.9 : 0.54), sh = stage.clientHeight;
    const base = Math.min(1, sw / 900, sh / 560);
    let s = base * Math.pow(1 / base, f.boost);
    s = Math.min(s, sw / (f.w + f.d * 0.3), (sh * 0.8) / f.h);
    rig.style.setProperty("--s", s.toFixed(3));
  }
  function scan() { if (reduce) return; slab.classList.remove("scan"); void slab.offsetWidth; slab.classList.add("scan"); }
  function show(i) {
    current = (i + FORMATS.length) % FORMATS.length;
    const f = FORMATS[current];
    slab.style.setProperty("--w", f.w + "px");
    slab.style.setProperty("--h", f.h + "px");
    slab.style.setProperty("--d", f.d + "px");
    slab.dataset.format = f.id;
    sets.forEach((el, j) => el.classList.toggle("on", j === current));
    dotBtns.forEach((el, j) => el.setAttribute("aria-selected", j === current ? "true" : "false"));
    $("#labelTitle").textContent = f.title;
    $("#labelSub").textContent = f.sub;
    fmtName.textContent = f.name;
    fmtName.style.setProperty("--fi", current);
    dots.classList.remove("auto"); void dots.offsetWidth; if (autoTimer) dots.classList.add("auto");
    fit(); scan();
  }
  let autoTimer = null, resumeTimer = null, inView = true;
  function startAuto() {
    if (reduce) return;
    stopAuto();
    autoTimer = setInterval(() => { if (inView && !document.hidden) show(current + 1); }, AUTO_MS);
    dots.classList.add("auto");
  }
  function stopAuto() { clearInterval(autoTimer); autoTimer = null; dots.classList.remove("auto"); }
  function pauseAuto() { stopAuto(); clearTimeout(resumeTimer); resumeTimer = setTimeout(startAuto, 9000); }

  // Gentle rotation + drag with ease-back
  let drag = 0, dragging = false, lastX = 0, running = false;
  const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    if (!dragging) drag *= 0.94;
    const ry = (reduce ? -16 : FORMATS[current].amp * Math.sin(t * 0.55)) + drag;
    const rx = reduce ? -6 : -6 + 3 * Math.sin(t * 0.4);
    slab.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    slab.style.setProperty("--sx", ((ry / 40) * 70).toFixed(1) + "%");
    if (inView) requestAnimationFrame(frame); else running = false;
  }
  const run = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
  stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; stage.classList.add("dragging"); stage.setPointerCapture(e.pointerId); pauseAuto(); });
  stage.addEventListener("pointermove", (e) => { if (!dragging) return; drag += (e.clientX - lastX) * 0.45; lastX = e.clientX; });
  const endDrag = () => { dragging = false; stage.classList.remove("dragging"); };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) run(); }).observe(stage);
  addEventListener("resize", fit);
  show(0); run();
  setTimeout(startAuto, 2000);
  setTimeout(scan, 1400);

  /* ---------- Hero: glass cards float once they land ---------- */
  if (!reduce) setTimeout(() => $$(".gc").forEach((g, k) => { g.style.animationDelay = (k * -1.7) + "s"; g.classList.add("float-on"); }), 2600);

  /* ---------- Hero: one collector review at a time (PLACEHOLDERS) ---------- */
  const QUOTES = [
    ["“Picking my own grading date beats refreshing a status page for months.”", "On the grading calendar"],
    ["“First slab I'd actually put on a shelf. The glass makes the card the star.”", "On the glass housing"],
    ["“One tap and I can see the card's record. Buying graded cards feels a lot less sketchy.”", "On RFID"],
    ["“A real date instead of an ‘estimated turnaround.’ That alone sold me.”", "On the 30-day turnaround"],
    ["“Glass at presale pricing was a no-brainer.”", "On presale pricing"],
  ];
  const hq = $(".hero-quote");
  if (hq && !reduce) {
    let qi = 0;
    setInterval(() => {
      if (document.hidden) return;
      hq.classList.add("fade");
      setTimeout(() => {
        qi = (qi + 1) % QUOTES.length;
        $("#heroQuote").textContent = QUOTES[qi][0];
        $("#heroQuoteBy").textContent = "[Collector name] · " + QUOTES[qi][1];
        hq.classList.remove("fade");
      }, 420);
    }, 5200);
  }

  /* ---------- Review tickers: duplicate cards so the loop is seamless ---------- */
  $$(".rv-track").forEach((tr) => {
    [...tr.children].forEach((c) => { const d = c.cloneNode(true); d.setAttribute("aria-hidden", "true"); tr.appendChild(d); });
  });

  /* ---------- Presale countdown (pricing ends Feb 1, 2027) ---------- */
  const daysLeft = $("#daysLeft");
  if (daysLeft) {
    const n = Math.ceil((new Date(2027, 1, 1) - new Date()) / 864e5);
    if (n > 0) daysLeft.textContent = n; else $("#daysLeftWrap").remove();
    if (n === 1) daysLeft.parentNode.lastChild.textContent = " day left";
  }

  /* ---------- Proof: subgrades + final grade count-up ---------- */
  const report = $("#report");
  if (report) {
    const sgs = $$(".sg", report), who = $("#sgWho"), note = $("#sgNote"), box = $(".report-note", report);
    sgs.forEach((b) => b.addEventListener("click", () => {
      sgs.forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      who.textContent = b.dataset.who; note.textContent = b.dataset.note;
      box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash");
    }));
  }
  const countUp = (el, end) => {
    if (reduce) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };

  /* ---------- Calendar preview (illustrative; not a live booking system) ---------- */
  const days = $("#calDays"), your = $("#calYour"), yourBox = $("#calYourBox");
  if (days) {
    const FULL = [1, 2, 3, 4, 5, 10];       // example: days already booked
    const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let mine = 9;                            // Feb 1, 2027 is a Monday
    const render = (animate) => {
      days.innerHTML = "";
      for (let d = 1; d <= 28; d++) {
        const dow = (d - 1) % 7, weekend = dow >= 5, full = FULL.includes(d);
        const el = document.createElement(weekend || full ? "span" : "button");
        el.className = "cal-day" + (weekend ? " weekend" : "") + (full ? " full" : "") + (d === mine ? " mine" : "");
        el.style.setProperty("--n", animate ? d : 0);
        el.textContent = d;
        if (el.tagName === "BUTTON") {
          el.type = "button";
          el.setAttribute("aria-label", `Reserve ${DOW[dow]}, February ${d}, 2027 (preview)`);
          el.setAttribute("aria-pressed", d === mine ? "true" : "false");
          el.addEventListener("click", () => {
            mine = d; render(false);
            your.textContent = `${DOW[dow]}, Feb ${d}, 2027`;
            yourBox.classList.remove("flash"); void yourBox.offsetWidth; yourBox.classList.add("flash");
            days.querySelector(`[aria-pressed="true"]`)?.focus();
          });
        }
        days.appendChild(el);
      }
    };
    render(true);
  }

  /* ---------- Hero grading clock: 30 days fill after the cards land ---------- */
  const bar = $("#clockBar");
  if (bar) for (let d = 1; d <= 30; d++) { const i = document.createElement("i"); if (d === 30) i.className = "end"; bar.appendChild(i); }
  const fillClock = () => {
    const cells = $$("i", bar);
    cells.forEach((c, k) => setTimeout(() => c.classList.add("on"), reduce ? 0 : 300 + k * 45));
  };
  if (bar) setTimeout(fillClock, reduce ? 0 : 1800);

  /* ---------- How it works: timeline fill + active steps ---------- */
  const timeline = $("#timeline");
  const tlSteps = timeline ? $$(".tl-step", timeline) : [];
  const onTimeline = () => {
    if (!timeline) return;
    const vh = innerHeight, r = timeline.getBoundingClientRect();
    const k = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.55 - r.top) / r.height));
    timeline.style.setProperty("--tl", k.toFixed(4));
    tlSteps.forEach((st) => { const b = st.getBoundingClientRect(); st.classList.toggle("active", reduce || b.top + b.height / 2 < vh * 0.62); });
  };
  let tlTick = false;
  addEventListener("scroll", () => { if (tlTick) return; tlTick = true; requestAnimationFrame(() => { onTimeline(); tlTick = false; }); }, { passive: true });
  addEventListener("resize", onTimeline);
  onTimeline();

  /* ---------- Reveal on scroll (+ one-shot section effects) ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add("in");
    if (el.id === "report") countUp($("#finalGrade"), 10);
    io.unobserve(el);
  }), { threshold: 0.18 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Mobile sticky CTA: after the hero CTA, hidden over the offer ---------- */
  const sticky = $("#sticky"), heroCta = $("#heroCta"), offer = $("#offer");
  const onScroll = () => {
    const past = heroCta.getBoundingClientRect().bottom < 0;
    const o = offer.getBoundingClientRect();
    const showIt = past && !(o.top < innerHeight && o.bottom > 0);
    sticky.classList.toggle("show", showIt);
    sticky.setAttribute("aria-hidden", showIt ? "false" : "true");
    $("a", sticky).tabIndex = showIt ? 0 : -1;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
