"use strict";

/* ============================== helpers ============================== */

const ROUND_SIZE = 10;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN(arr, n) {
  return shuffle(arr).slice(0, n);
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

const $ = (sel) => document.querySelector(sel);

/* =============================== views =============================== */

const menuEl = $("#menu");
const activityEl = $("#activity");
const stageEl = $("#stage");
const voiceBanner = $("#voiceBanner");

const FEATURES = {
  spelling: { emoji: "✏️", label: "Spelling", labelZh: "拼写" },
  usage: { emoji: "💬", label: "Usage", labelZh: "用法" },
};

let state = null; // { moduleId, feature, round, index, score, missed }

/* ================================ TTS ================================ */

const TTS = (() => {
  let englishVoice = null;

  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    englishVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith("en") && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
      null;
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const s = window.speechSynthesis;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    if (englishVoice) u.voice = englishVoice;
    // setTimeout(0) after cancel is the standard iOS quirk workaround.
    setTimeout(() => s.speak(u), 0);
  }

  function hasEnglishVoice() {
    return !!englishVoice;
  }

  function available() {
    return "speechSynthesis" in window;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      pickVoice();
      updateVoiceBanner();
    };
    // Some browsers don't fire voiceschanged reliably; re-poll a few times.
    setTimeout(pickVoice, 300);
    setTimeout(pickVoice, 1500);
    // iOS bug: without a periodic pause/resume, speech stops firing after ~15s.
    setInterval(() => {
      const s = window.speechSynthesis;
      if (s.speaking && !s.paused) {
        s.pause();
        s.resume();
      }
    }, 10000);
  }

  return { speak, hasEnglishVoice, available, pickVoice };
})();

function updateVoiceBanner() {
  if (!TTS.available()) {
    voiceBanner.hidden = false;
    voiceBanner.textContent = "⚠️ This device cannot speak words. Spelling practice needs audio.";
    return;
  }
  if (!TTS.hasEnglishVoice()) {
    voiceBanner.hidden = false;
    voiceBanner.textContent =
      "🔇 No English voice found — please download an English voice in your device settings, then reload.";
    return;
  }
  voiceBanner.hidden = true;
}

/* =============================== menu ================================ */

function renderMenu() {
  const grid = [];
  for (const mod of MODULES) {
    for (const key of ["spelling", "usage"]) {
      const f = FEATURES[key];
      grid.push(
        `<button class="card" style="--c:${mod.color}" data-mod="${mod.id}" data-feature="${key}">
          <span class="card-emoji">${f.emoji}</span>
          <span class="card-mod">${mod.shortTitle}</span>
          <span class="card-zh">${mod.zhTitle}</span>
          <span class="card-feat">${f.label} · ${f.labelZh}</span>
        </button>`
      );
    }
  }
  $("#cards").innerHTML = grid.join("");

  document.querySelectorAll(".card").forEach((c) => {
    c.addEventListener("click", () => startActivity(c.dataset.mod, c.dataset.feature));
  });
}

function showMenu() {
  activityEl.hidden = true;
  menuEl.hidden = false;
}

function showActivity() {
  menuEl.hidden = true;
  activityEl.hidden = false;
  const mod = MODULES.find((m) => m.id === state.moduleId);
  $("#actTitle").textContent = `${mod.shortTitle} ${FEATURES[state.feature].label}`;
  $("#actZh").textContent = `${mod.zhTitle} · ${FEATURES[state.feature].labelZh}`;
}

/* =========================== round logic ============================ */

function startActivity(moduleId, feature) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const pool =
    feature === "spelling"
      ? mod.words.map((w) => ({ ...w }))
      : mod.usage.map((u) => ({ ...u }));
  state = {
    moduleId,
    feature,
    round: pickN(pool, ROUND_SIZE),
    index: 0,
    score: 0,
    missed: [],
  };
  showActivity();
  renderItem();
}

function advance() {
  state.index++;
  renderItem();
}

function renderItem() {
  updateProgress();
  stageEl.innerHTML = "";

  if (state.index >= state.round.length) {
    renderResult();
    return;
  }
  if (state.feature === "spelling") renderSpellingItem(state.round[state.index]);
  else renderUsageItem(state.round[state.index]);
}

function updateProgress() {
  const total = state.round.length;
  const shown = Math.min(state.index, total);
  $("#progressText").textContent = `${shown} / ${total}`;
  $("#progressFill").style.width = Math.round((shown / total) * 100) + "%";
}

/* ========================= spelling activity ========================= */

function renderSpellingItem(word) {
  const v = el(`
    <div class="spell">
      <button id="listenBtn" class="listen" aria-label="Listen">🔊</button>
      <div class="zh-big">${word.zh}</div>
      <form id="spellForm" class="spell-form" autocomplete="off">
        <input id="spellInput" type="text" autocomplete="off"
               autocapitalize="off" autocorrect="off" spellcheck="false"
               placeholder="type the English word" />
        <button type="submit" class="check-btn">Check ✓</button>
      </form>
      <div id="spellFeedback" class="feedback"></div>
      <button id="nextBtn" class="next-btn" hidden>Next →</button>
    </div>
  `);
  stageEl.appendChild(v);

  TTS.speak(word.en);
  const input = $("#spellInput");
  const feedback = $("#spellFeedback");
  const nextBtn = $("#nextBtn");

  $("#listenBtn").addEventListener("click", () => TTS.speak(word.en));

  $("#spellForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const guess = input.value.trim().toLowerCase();
    if (!guess) return;
    const answer = word.en.toLowerCase();
    input.readOnly = true;
    if (guess === answer) {
      state.score++;
      feedback.className = "feedback good";
      feedback.innerHTML = "✓  Great!";
    } else {
      state.missed.push(word);
      feedback.className = "feedback bad";
      feedback.innerHTML = `✗  Not quite — the word is <b>${word.en}</b>`;
    }
    nextBtn.hidden = false;
    nextBtn.focus();
  });

  nextBtn.addEventListener("click", () => {
    input.blur();
    advance();
  });

  input.focus();
}

/* ========================== usage activity =========================== */

function renderUsageItem(item) {
  const mod = MODULES.find((m) => m.id === state.moduleId);
  const pool = mod.words.map((w) => w.en).filter((w) => w !== item.answer);
  const bad = item.alsoCorrect || [];
  // Only offer options that are NOT also grammatically correct, so exactly one
  // of the four choices is right (e.g. "help ___" never pairs them with him/her/us).
  let distractors = shuffle(pool.filter((w) => !bad.includes(w))).slice(0, 3);
  if (distractors.length < 3) {
    // Defensive: if a future sentence leaves <3 safe words, pad with non-answer
    // words so four options always render.
    const extra = shuffle(pool.filter((w) => !distractors.includes(w))).slice(0, 3 - distractors.length);
    distractors = distractors.concat(extra);
  }
  const options = shuffle([item.answer, ...distractors]);

  const v = el(`
    <div class="usage">
      <div class="sentence">${item.prompt}</div>
      <div class="options"></div>
      <div id="usageFeedback" class="feedback"></div>
      <button id="nextBtn" class="next-btn" hidden>Next →</button>
    </div>
  `);
  stageEl.appendChild(v);

  const optWrap = v.querySelector(".options");
  const feedback = v.querySelector("#usageFeedback");
  const nextBtn = v.querySelector("#nextBtn");

  options.forEach((w) => {
    const b = el(`<button class="opt">${w}</button>`);
    b.addEventListener("click", () => {
      if (feedback.dataset.done) return;
      feedback.dataset.done = "1";
      const right = w === item.answer;
      optWrap.querySelectorAll(".opt").forEach((o) => (o.disabled = true));
      if (right) {
        b.classList.add("right");
        state.score++;
        feedback.className = "feedback good";
        feedback.innerHTML = "✓  Correct!";
      } else {
        b.classList.add("wrong");
        optWrap.querySelectorAll(".opt").forEach((o) => {
          if (o.textContent === item.answer) o.classList.add("right");
        });
        state.missed.push(item);
        feedback.className = "feedback bad";
        feedback.innerHTML = `✗  <b>${item.answer}</b> — ${item.why}`;
      }
      nextBtn.hidden = false;
      nextBtn.focus();
    });
    optWrap.appendChild(b);
  });

  nextBtn.addEventListener("click", advance);
}

/* ============================== results =============================== */

function resultMessage(score, total) {
  if (score === total) return "Perfect! 🌟";
  if (score >= total * 0.8) return "Great job!";
  if (score >= total * 0.5) return "Good try!";
  return "Keep practicing! You can do it!";
}

function renderResult() {
  const total = state.round.length;
  const score = state.score;
  const v = el(`
    <div class="result">
      <div class="big-emoji">🎉</div>
      <h3>You got <span class="score">${score}</span> / ${total}!</h3>
      <p class="result-msg">${resultMessage(score, total)}</p>
      <div class="result-actions">
        ${state.missed.length ? `<button id="retryMissed" class="btn primary">Try missed again (${state.missed.length})</button>` : ""}
        <button id="backToMenu" class="btn">Back to menu</button>
      </div>
    </div>
  `);
  stageEl.appendChild(v);
  confettiBurst();

  const retry = $("#retryMissed");
  if (retry) {
    retry.addEventListener("click", () => {
      state.round = shuffle(state.missed);
      state.index = 0;
      state.score = 0;
      state.missed = [];
      renderItem();
    });
  }
  $("#backToMenu").addEventListener("click", () => {
    confettiStop();
    showMenu();
  });
}

/* =============================== confetti ============================== */

let confettiCtx = null;
let confettiRaf = null;
const confettiParts = [];

function setupConfettiCanvas() {
  let c = document.getElementById("confetti");
  if (!c) {
    c = document.createElement("canvas");
    c.id = "confetti";
    c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99";
    document.body.appendChild(c);
  }
  // Resetting canvas size resets its transform, so the dpr scale below is fresh.
  c.width = window.innerWidth * devicePixelRatio;
  c.height = window.innerHeight * devicePixelRatio;
  confettiCtx = c.getContext("2d");
  confettiCtx.scale(devicePixelRatio, devicePixelRatio);
  return c;
}

function confettiBurst() {
  setupConfettiCanvas();
  const colors = ["#6C5CE7", "#FF9F43", "#00A8FF", "#FF6B6B", "#FFD166", "#2ED573"];
  for (let i = 0; i < 120; i++) {
    confettiParts.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.3,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 3,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }
  if (!confettiRaf) confettiLoop();
}

function confettiLoop() {
  confettiRaf = requestAnimationFrame(confettiLoop);
  const ctx = confettiCtx;
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = confettiParts.length - 1; i >= 0; i--) {
    const p = confettiParts[i];
    p.vy += 0.18;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 0.008;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
    if (p.life <= 0 || p.y > window.innerHeight + 40) confettiParts.splice(i, 1);
  }
  if (!confettiParts.length) confettiStop();
}

function confettiStop() {
  if (confettiRaf) {
    cancelAnimationFrame(confettiRaf);
    confettiRaf = null;
  }
  confettiParts.length = 0;
  if (confettiCtx) confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

/* ================================ init ================================ */

$("#backBtn").addEventListener("click", () => {
  confettiStop();
  showMenu();
});

TTS.pickVoice();
updateVoiceBanner();
renderMenu();
window.addEventListener("voiceschanged", () => {
  TTS.pickVoice();
  updateVoiceBanner();
});
