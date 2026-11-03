/* UI controller: draws bars, runs the selected generator step by step. */
(() => {
  const $ = (id) => document.getElementById(id);
  const barsEl = $("bars");
  const els = {
    size: $("size"), speed: $("speed"), sizeOut: $("sizeOut"), speedOut: $("speedOut"),
    play: $("playBtn"), step: $("stepBtn"), newArray: $("newArray"),
    cmp: $("cmpCount"), swaps: $("swapCount"), writes: $("writeCount"), status: $("status"),
  };

  const state = {
    algo: "bubble",
    values: [],
    bars: [],
    gen: null,
    running: false,
    done: false,
    timer: null,
    counts: { compare: 0, swap: 0, overwrite: 0 },
    sorted: new Set(),
    highlighted: [],
    rng: Math.random,
  };

  // Small seeded PRNG so a URL like #seed=7 always shows the same array.
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildPills() {
    const nav = $("algoPills");
    for (const [key, { name }] of Object.entries(ALGORITHMS)) {
      const b = document.createElement("button");
      b.className = "pill" + (key === state.algo ? " active" : "");
      b.textContent = name.replace(" Sort", "");
      b.dataset.key = key;
      b.addEventListener("click", () => selectAlgorithm(key));
      nav.appendChild(b);
    }
  }

  function selectAlgorithm(key) {
    state.algo = key;
    document.querySelectorAll(".pill").forEach((t) => t.classList.toggle("active", t.dataset.key === key));
    showInfo();
    resetRun(); // same array, fresh run
  }

  function showInfo() {
    const c = COMPLEXITY[state.algo];
    $("infoTitle").textContent = ALGORITHMS[state.algo].name;
    $("infoText").textContent = c.description;
    $("cBest").textContent = c.best;
    $("cAvg").textContent = c.average;
    $("cWorst").textContent = c.worst;
    $("cSpace").textContent = c.space;
    $("cStable").innerHTML = badge(c.stable);
    $("cInPlace").innerHTML = badge(c.inPlace);
    $("infoUse").textContent = c.useWhen;
  }
  const badge = (yes) => `<span class="badge ${yes ? "yes" : "no"}">${yes ? "Yes" : "No"}</span>`;

  function newArray() {
    const n = Number(els.size.value);
    state.values = Array.from({ length: n }, () => 5 + Math.floor(state.rng() * 96));
    state.original = state.values.slice();
    drawBars();
    resetRun(false);
  }

  function drawBars() {
    barsEl.innerHTML = "";
    const showValues = state.values.length <= 30;
    state.bars = state.values.map((v) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = v + "%";
      if (showValues) {
        const label = document.createElement("span");
        label.className = "val";
        label.textContent = v;
        bar.appendChild(label);
      }
      barsEl.appendChild(bar);
      return bar;
    });
  }

  function updateBar(i) {
    const bar = state.bars[i];
    bar.style.height = state.values[i] + "%";
    const label = bar.firstChild;
    if (label) label.textContent = state.values[i];
  }

  function resetRun(restore = true) {
    pause();
    if (restore && state.original) {
      state.values = state.original.slice();
      state.values.forEach((_, i) => updateBar(i));
    }
    state.gen = ALGORITHMS[state.algo].fn(state.values);
    state.done = false;
    state.counts = { compare: 0, swap: 0, overwrite: 0 };
    state.sorted.clear();
    state.bars.forEach((b) => (b.className = "bar"));
    state.highlighted = [];
    updateCounters();
    setStatus("Ready");
    els.play.textContent = "Start";
    els.step.disabled = false;
    els.play.disabled = false;
  }

  function clearHighlights() {
    for (const i of state.highlighted) {
      if (!state.sorted.has(i)) state.bars[i].className = "bar";
    }
    state.highlighted = [];
  }

  function mark(i, cls) {
    if (state.sorted.has(i) && cls !== "sorted") return;
    state.bars[i].className = "bar " + cls;
    if (cls !== "sorted") state.highlighted.push(i);
  }

  /** Advances the generator by one step and paints it. Returns false when finished. */
  function step() {
    if (state.done) return false;
    const { value: s, done } = state.gen.next();
    clearHighlights();
    if (done) {
      finish();
      return false;
    }
    switch (s.type) {
      case "compare":
        state.counts.compare++;
        mark(s.i, "compare");
        mark(s.j, "compare");
        break;
      case "swap":
        state.counts.swap++;
        updateBar(s.i);
        updateBar(s.j);
        mark(s.i, "swap");
        mark(s.j, "swap");
        break;
      case "overwrite":
        state.counts.overwrite++;
        updateBar(s.i);
        mark(s.i, "swap");
        break;
      case "pivot":
        mark(s.i, "pivot");
        break;
      case "sorted":
        state.sorted.add(s.i);
        mark(s.i, "sorted");
        break;
    }
    updateCounters();
    return true;
  }

  function finish() {
    state.done = true;
    pause();
    state.bars.forEach((b, i) => { state.sorted.add(i); b.className = "bar sorted"; });
    setStatus("Sorted ✓");
    els.play.textContent = "Replay";
    els.step.disabled = true;
  }

  function updateCounters() {
    els.cmp.textContent = state.counts.compare.toLocaleString();
    els.swaps.textContent = state.counts.swap.toLocaleString();
    els.writes.textContent = state.counts.overwrite.toLocaleString();
  }
  const setStatus = (t) => (els.status.textContent = t);

  // Speed 1..100 -> delay 600ms..0ms; at high speed several steps per tick.
  function timing() {
    const s = Number(els.speed.value);
    const delay = Math.round(600 * Math.pow(1 - (s - 1) / 99, 2.2));
    const stepsPerTick = s > 90 ? Math.ceil((s - 88) / 2) : 1;
    return { delay, stepsPerTick };
  }

  function loop() {
    if (!state.running) return;
    const { delay, stepsPerTick } = timing();
    for (let k = 0; k < stepsPerTick; k++) {
      if (!step()) return;
    }
    state.timer = setTimeout(loop, delay);
  }

  function play() {
    if (state.done) resetRun();
    state.running = true;
    els.play.textContent = "Pause";
    setStatus("Sorting…");
    loop();
  }

  function pause() {
    state.running = false;
    clearTimeout(state.timer);
    if (!state.done && state.gen) {
      els.play.textContent = "Resume";
      setStatus(state.counts.compare ? "Paused" : "Ready");
    }
  }

  function compareAll() {
    const tbody = document.querySelector("#results tbody");
    const rows = Object.keys(ALGORITHMS).map((key) => ({ key, ...countOperations(key, state.original) }));
    const best = Math.min(...rows.map((r) => r.comparisons));
    tbody.innerHTML = rows
      .map((r) => `<tr class="${r.comparisons === best ? "best" : ""}"><td>${ALGORITHMS[r.key].name}</td>` +
        `<td>${r.comparisons.toLocaleString()}</td><td>${r.swaps.toLocaleString()}</td><td>${r.writes.toLocaleString()}</td></tr>`)
      .join("");
  }

  // ---- events ----
  els.play.addEventListener("click", () => (state.running ? pause() : play()));
  els.step.addEventListener("click", () => { pause(); step(); });
  els.newArray.addEventListener("click", () => { state.rng = Math.random; newArray(); });
  els.size.addEventListener("input", () => { els.sizeOut.textContent = els.size.value; newArray(); });
  els.speed.addEventListener("input", () => (els.speedOut.textContent = els.speed.value));
  $("compareBtn").addEventListener("click", compareAll);
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.code === "Space") { e.preventDefault(); state.running ? pause() : play(); }
    if (e.key === "s" || e.key === "S") { pause(); step(); }
    if (e.key === "n" || e.key === "N") { state.rng = Math.random; newArray(); }
  });

  // ---- start: optional URL hash, e.g. #algo=quick&size=60&speed=80&seed=3&autoplay=1 ----
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.get("algo") in ALGORITHMS) state.algo = params.get("algo");
  if (params.get("size")) els.size.value = params.get("size");
  if (params.get("speed")) els.speed.value = params.get("speed");
  if (params.get("seed")) state.rng = mulberry32(Number(params.get("seed")));
  els.sizeOut.textContent = els.size.value;
  els.speedOut.textContent = els.speed.value;

  buildPills();
  showInfo();
  newArray();
  state.rng = params.get("seed") ? state.rng : Math.random;
  if (params.get("autoplay") === "1") play();

  // Exposed for automated screenshots/tests.
  window.sortViz = { step, play, pause, compareAll, state };
})();
