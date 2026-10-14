/* HGA homepage — rotating glass housing, size selector, proof, calendar, clock */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Housing formats (ascending size) ----------
     w/h/d = housing size in design px. cards = files in assets/cards/.
     Swap artwork, copy or sizes here; the 3D housing rebuilds from this list. */
  const FORMATS = [
    { id: "single",   name: "Single card", w: 250, h: 412, d: 20,  amp: 26, boost: 1,   cards: ["ohtani"],                                         title: "Shohei Ohtani", sub: "2025 Topps Finest" },
    { id: "booklet",  name: "Booklet",     w: 366, h: 330, d: 22,  amp: 24, boost: 1,   cards: ["gengar", "alakazam"],                             title: "Booklet",       sub: "2 panels" },
    { id: "trifold",  name: "Trifold",     w: 532, h: 330, d: 24,  amp: 20, boost: 0.5, cards: ["jenkins", "white", "ohtani"],                     title: "Trifold",       sub: "3 panels" },
    { id: "fivefold", name: "Five-fold",   w: 864, h: 330, d: 26,  amp: 14, boost: 0,   cards: ["meowth", "gengar", "alakazam", "jenkins", "white"], title: "Five-fold",     sub: "5 panels" },
    { id: "deck",     name: "Deck",        w: 330, h: 470, d: 200, amp: 34, boost: 0.3, cards: ["meowth"],                                         title: "Deck",          sub: "Full deck" },
  ];
  const ICON = [[16, 26], [28, 22], [38, 22], [58, 22], [20, 28]];   // selector silhouettes, ascending
  const AUTO_MS = 3600;

  const stage = $("#stage"), stageCol = $(".stage-col"), rig = $("#rig"), slab = $("#slab"), bay = $("#bay"), list = $("#fmtList");
  let current = 0;

  FORMATS.forEach((f, i) => {
    const set = document.createElement("div");
    set.className = "panelset" + (i === 0 ? " on" : "");
    set.innerHTML = f.cards.map((c) => `<img src="assets/cards/${c}.jpg" alt="" loading="${i === 0 ? "eager" : "lazy"}" decoding="async" />`).join("");
    bay.appendChild(set);

    const b = document.createElement("button");
    b.className = "fmt-btn";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", i === 0 ? "true" : "false");
    b.setAttribute("aria-label", f.name);
    b.innerHTML = `<span class="fi"><i class="${f.id === "deck" ? "deck" : ""}" style="width:${ICON[i][0]}px;height:${ICON[i][1]}px"></i></span><span class="node"></span><b>${f.name}</b>`;
    b.addEventListener("click", () => { pauseAuto(); show(i); });
    list.appendChild(b);
  });
  const sets = $$(".panelset", bay), btns = $$(".fmt-btn", list);
  list.insertAdjacentHTML("afterbegin", '<span class="fmt-track" aria-hidden="true"></span><span class="fmt-fill" aria-hidden="true"></span>');

  // Fit to the stage, keep sizes visibly ascending, never grow into the CTA above
  function fit() {
    const f = FORMATS[current];
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const base = Math.min(1, sw / 900, sh / 600);
    let s = base * Math.pow(1 / base, f.boost);
    s = Math.min(s, (sw * 0.88) / f.w, (sh * 0.72) / f.h);
    rig.style.setProperty("--s", s.toFixed(3));
    stageCol.style.setProperty("--wm", Math.max(0.55, base).toFixed(3));
  }

  function scan() {
    if (reduce) return;
    slab.classList.remove("scan"); void slab.offsetWidth; slab.classList.add("scan");
  }

  function show(i) {
    current = (i + FORMATS.length) % FORMATS.length;
    const f = FORMATS[current];
    slab.style.setProperty("--w", f.w + "px");
    slab.style.setProperty("--h", f.h + "px");
    slab.style.setProperty("--d", f.d + "px");
    slab.dataset.format = f.id;
    stageCol.style.setProperty("--k", current);
    sets.forEach((el, j) => el.classList.toggle("on", j === current));
    btns.forEach((el, j) => { el.setAttribute("aria-selected", j === current ? "true" : "false"); el.classList.toggle("done", j < current); });
    list.style.setProperty("--idx", current);
    $("#labelTitle").textContent = f.title;
    $("#labelSub").textContent = f.sub;
    $("#watermark").textContent = f.id === "single" ? "Single" : f.name;
    // restart the progress bar on the active button
    list.classList.remove("auto"); void list.offsetWidth; if (autoTimer) list.classList.add("auto");
    fit();
    scan();
  }

  // Auto-cycle through sizes; pause after the visitor interacts
  let autoTimer = null, resumeTimer = null, inView = true;
  list.style.setProperty("--auto", AUTO_MS + "ms");
  function startAuto() {
    if (reduce) return;
    stopAuto();
    autoTimer = setInterval(() => { if (inView && !document.hidden) show(current + 1); }, AUTO_MS);
    list.classList.add("auto");
  }
  function stopAuto() { clearInterval(autoTimer); autoTimer = null; list.classList.remove("auto"); }
  function pauseAuto() { stopAuto(); clearTimeout(resumeTimer); resumeTimer = setTimeout(startAuto, 9000); }

  // Rotation: gentle oscillation + drag with ease-back
  let drag = 0, dragging = false, lastX = 0, running = false;
  const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    if (!dragging) drag *= 0.94;
    const f = FORMATS[current];
    const ry = (reduce ? -18 : f.amp * Math.sin(t * 0.55)) + drag;
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
  list.addEventListener("keydown", (e) => {
    const k = e.key; if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(k)) return;
    e.preventDefault(); pauseAuto();
    show(current + (k === "ArrowRight" || k === "ArrowDown" ? 1 : -1));
    btns[current].focus();
  });
  new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) run(); }).observe(stage);
  addEventListener("resize", fit);
  show(0);
  run();
  setTimeout(startAuto, 1600);   // let the reveal finish first
  setTimeout(scan, 1400);

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

  /* ---------- 30-day clock ---------- */
  const bar = $("#clockBar");
  if (bar) for (let d = 1; d <= 30; d++) { const i = document.createElement("i"); if (d === 30) i.className = "end"; bar.appendChild(i); }
  const fillClock = () => {
    const cells = $$("i", bar);
    cells.forEach((c, k) => setTimeout(() => c.classList.add("on"), reduce ? 0 : 300 + k * 45));
  };

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
    if (el.id === "clockCard") fillClock();
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
