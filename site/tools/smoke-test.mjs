#!/usr/bin/env node
/* Headless smoke test: launches Edge via CDP, loads the app from file://,
   verifies the menu renders, clicks an activity, and checks the stage. */
import { spawn } from "node:child_process";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "file:///d:/TonyDev/English/site/index.html";
// Unique port + profile per run so stale processes can never interfere.
const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = `C:/Users/chengmu/AppData/Local/Temp/edge-cdp-${Date.now()}-${PORT}`;

const browser = spawn(EDGE, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--no-first-run",
  "--disable-extensions",
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${PORT}`,
  URL,
], { stdio: "ignore" });

// Edge's launcher exits immediately while browser children keep running; kill
// the whole tree on exit so no headless instance is left squatting on a port.
function killTree() {
  try {
    spawn("taskkill", ["/PID", String(browser.pid), "/T", "/F"], { stdio: "ignore" });
  } catch {}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;

function check(cond, label) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

async function main() {
  let target;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      target = list.find((t) => t.type === "page");
      if (target?.webSocketDebuggerUrl) break;
    } catch {}
    await sleep(250);
  }
  if (!target?.webSocketDebuggerUrl) throw new Error("CDP endpoint never came up");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let msgId = 0;
  const pending = new Map();
  const exceptions = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
    if (m.method === "Runtime.exceptionThrown") {
      exceptions.push(m.params.exceptionDetails?.text || "exception");
    }
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
      exceptions.push("console.error: " + (m.params.args?.map((a) => a.value ?? a.description).join(" ") || ""));
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const id = ++msgId;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) {
      const desc = r.exceptionDetails.exception?.description || r.exceptionDetails.text || "unknown";
      throw new Error("page exception during evaluate: " + desc);
    }
    return r?.result?.value;
  };

  await send("Runtime.enable");
  await send("Page.enable");

  // Wait for the app to finish rendering the menu.
  let cards = 0;
  for (let i = 0; i < 60; i++) {
    cards = (await evaluate(`document.querySelectorAll('.card').length`)) || 0;
    if (cards === 5) break;
    await sleep(200);
  }

  check(cards === 5, `menu renders 5 activity cards (got ${cards})`);

  // Data integrity: pronoun usage sentences must have >=3 safe distractors (words
  // that are NOT also grammatically correct) so exactly one of 4 options is right;
  // there-be choice questions must put their answer inside a unique 2+ option bank.
  const dataCheck = await evaluate(`(() => {
    const bad = [];
    for (const mod of MODULES) {
      const all = (mod.words || []).map((w) => w.en);
      if (mod.words) {
        const allowedForms = mod.id === "personal" ? ["sub", "obj", "sub/obj"] : ["PA", "PP"];
        for (const w of mod.words) {
          if (!w.forms) bad.push(mod.id + ': word "' + w.en + '" is missing the forms tag');
          else if (!allowedForms.includes(w.forms)) bad.push(mod.id + ': word "' + w.en + '" has invalid forms "' + w.forms + '" (allowed: ' + allowedForms.join(", ") + ")");
        }
      }
      if (mod.usage) {
        for (const u of mod.usage) {
          const also = u.alsoCorrect || [];
          if (!all.includes(u.answer)) bad.push(u.prompt + ': answer "' + u.answer + '" not in word list');
          for (const w of also) if (!all.includes(w)) bad.push(u.prompt + ': alsoCorrect "' + w + '" not in word list');
          if (also.includes(u.answer)) bad.push(u.prompt + ': answer is in alsoCorrect');
          const avail = all.filter((w) => w !== u.answer && !also.includes(w));
          if (avail.length < 3) bad.push(u.prompt + ': only ' + avail.length + ' safe distractors (<3)');
        }
      }
      if (mod.choice) {
        for (const c of mod.choice) {
          if (!Array.isArray(c.options) || c.options.length < 2) bad.push(c.prompt + ': needs >=2 options');
          else if (!c.options.includes(c.answer)) bad.push(c.prompt + ': answer "' + c.answer + '" not in options [' + c.options.join(", ") + "]");
          else if (new Set(c.options).size !== c.options.length) bad.push(c.prompt + ': duplicate options');
        }
      }
    }
    return bad;
  })()`);
  check(Array.isArray(dataCheck) && dataCheck.length === 0, `data integrity: forms, exactly-one-correct usage, valid choice options (${dataCheck.length} issue(s)${dataCheck.length ? ": " + dataCheck.join("; ") : ""})`);
  const menuState = await evaluate(`({
    cards: document.querySelectorAll('.card').length,
    menuHidden: document.querySelector('#menu').hidden,
    activityHidden: document.querySelector('#activity').hidden,
  })`);
  check(
    menuState.cards === 5 && !menuState.menuHidden && menuState.activityHidden,
    `menu visible on load, activity hidden (cards=${menuState.cards}, menuHidden=${menuState.menuHidden}, activityHidden=${menuState.activityHidden})`
  );

  // Click Personal pronouns -> Spelling
  await evaluate(`document.querySelector('[data-mod="personal"][data-feature="spelling"]').click()`);
  await sleep(200);
  const spell = await evaluate(`(() => {
    const inp = document.querySelector('#spellInput');
    return {
      title: document.querySelector('#actTitle').textContent,
      hasZh: !!document.querySelector('.zh-big'),
      zhText: document.querySelector('.zh-big')?.textContent,
      hasInput: !!inp,
      autocorrectOff: inp?.getAttribute('autocorrect') === 'off',
      autocapOff: inp?.getAttribute('autocapitalize') === 'off',
      spellcheckOff: inp?.getAttribute('spellcheck') === 'false',
      hasListen: !!document.querySelector('#listenBtn'),
      progress: document.querySelector('#progressText').textContent,
    };
  })()`);
  const personalZh = ["我", "你", "他", "她", "它", "我们", "他们"];
  check(spell.title === "Personal Spelling", `spelling view title (${spell.title})`);
  check(spell.hasZh && personalZh.includes(spell.zhText), `spelling shows Chinese prompt (${spell.zhText})`);
  check(spell.hasInput, "spelling has free-typing input");
  check(spell.autocorrectOff && spell.autocapOff && spell.spellcheckOff, "autocorrect/autocapitalize/spellcheck disabled on input");
  check(spell.hasListen, "spelling has listen button");
  check(spell.progress === "0 / 10", `round is 10 items (${spell.progress})`);

  // Submit a guaranteed-wrong spelling answer; feedback must appear and reveal the word.
  await evaluate(`(() => {
    const inp = document.querySelector('#spellInput');
    inp.value = 'zzzz';
    document.querySelector('#spellForm').dispatchEvent(new Event('submit', { cancelable: true }));
  })()`);
  await sleep(120);
  const fb = await evaluate(`({
    text: document.querySelector('#spellFeedback').textContent,
    bad: document.querySelector('#spellFeedback').classList.contains('bad'),
    submitText: document.querySelector('#spellSubmit').textContent,
    isNext: document.querySelector('#spellSubmit').classList.contains('is-next'),
  })`);
  check(fb.bad, "spelling wrong answer marks red feedback");
  check(/Not quite/.test(fb.text), `spelling reveals correct word on a miss (${fb.text.trim()})`);
  check(fb.isNext && /Next/.test(fb.submitText), `spelling Check button turns into Next ("${fb.submitText}")`);

  // Verify usage view.
  await evaluate(`document.querySelector('#backBtn').click()`);
  await sleep(100);
  await evaluate(`document.querySelector('[data-mod="possessive"][data-feature="usage"]').click()`);
  await sleep(200);
  const usage = await evaluate(`({
    title: document.querySelector('#actTitle').textContent,
    hasSentence: !!document.querySelector('.sentence'),
    blankKept: document.querySelector('.sentence')?.textContent.includes('___'),
    opts: document.querySelectorAll('.opt').length,
    progress: document.querySelector('#progressText').textContent,
  })`);
  check(usage.title === "Possessive Usage", `usage view title (${usage.title})`);
  check(usage.hasSentence && usage.blankKept, "usage shows sentence with blank");
  check(usage.opts === 4, `usage shows 4 options (${usage.opts})`);
  check(usage.progress === "0 / 10", `usage round is 10 items (${usage.progress})`);

  // The 4 shown options must contain exactly one grammatically-correct word (the
  // answer); no other displayed option may be in that item's alsoCorrect list.
  const optsCheck = await evaluate(`(() => {
    const sentence = document.querySelector('.sentence')?.textContent;
    const item = MODULES.flatMap((m) => m.usage).find((u) => u.prompt === sentence);
    if (!item) return { ok: false, reason: "no data item for shown sentence" };
    const shown = Array.from(document.querySelectorAll('.opt')).map((o) => o.textContent);
    const also = item.alsoCorrect || [];
    const answersShown = shown.filter((w) => w === item.answer).length;
    const alsoShown = shown.filter((w) => w !== item.answer && also.includes(w));
    return { ok: answersShown === 1 && alsoShown.length === 0, sentence, shown, answer: item.answer, answersShown, alsoShown };
  })()`);
  check(
    optsCheck.ok,
    `exactly one correct option shown (sentence="${optsCheck.sentence}", options=[${optsCheck.shown.join(", ")}], answer="${optsCheck.answer}", also-correct shown: ${(optsCheck.alsoShown || []).join(", ") || "none"})`
  );

  // Tap the correct option (button whose text equals the answer we know from data? we don't know which sentence;
  // instead pick any option and verify feedback appears + next button shows).
  const answered = await evaluate(`(() => {
    const b = document.querySelector('.opt');
    b.click();
    return {
      feedbackShown: !!document.querySelector('#usageFeedback').textContent.trim(),
      nextShown: !document.querySelector('#nextBtn').hidden,
      disabledAll: Array.from(document.querySelectorAll('.opt')).every(o => o.disabled),
    };
  })()`);
  check(answered.feedbackShown, "usage feedback appears after tap");
  check(answered.nextShown, "next button appears after tap");
  check(answered.disabledAll, "options lock after tap");

  // Open the There Be choice activity (fifth card).
  await evaluate(`document.querySelector('#backBtn').click()`);
  await sleep(100);
  await evaluate(`document.querySelector('[data-mod="therebe"][data-feature="choice"]').click()`);
  await sleep(200);
  const choice = await evaluate(`(() => {
    const sentence = document.querySelector('.sentence')?.textContent;
    const item = MODULES.find((m) => m.id === 'therebe').choice.find((c) => c.prompt === sentence);
    return {
      title: document.querySelector('#actTitle').textContent,
      hasSentence: !!sentence && sentence.includes('___'),
      optCount: document.querySelectorAll('.opt').length,
      hasAnswer: !!item && Array.from(document.querySelectorAll('.opt')).some((o) => o.textContent === item.answer),
      progress: document.querySelector('#progressText').textContent,
    };
  })()`);
  check(choice.title === "There Be Choice", `choice view title (${choice.title})`);
  check(choice.hasSentence, "choice shows there-be sentence with blank");
  check(choice.optCount >= 2, `choice shows ${choice.optCount} options (>=2)`);
  check(choice.hasAnswer, "the correct option is among the choices");
  check(choice.progress === "0 / 10", `choice round is 10 items (${choice.progress})`);

  // Play a full choice round answering correctly; summary must list 10, score 10.
  const choicePlayed = await evaluate(`(() => {
    const mod = MODULES.find((m) => m.id === 'therebe');
    for (let i = 0; i < 10; i++) {
      const sentence = document.querySelector('.sentence').textContent;
      const item = mod.choice.find((c) => c.prompt === sentence);
      const btn = Array.from(document.querySelectorAll('.opt')).find((o) => o.textContent === item.answer);
      btn.click();
      document.querySelector('#nextBtn').click();
    }
    return {
      count: document.querySelectorAll('.summary-item').length,
      score: document.querySelector('.score').textContent,
    };
  })()`);
  check(choicePlayed.count === 10, `choice summary lists all 10 questions (got ${choicePlayed.count})`);
  check(choicePlayed.score === "10", `choice summary score is 10/10 (got "${choicePlayed.score}")`);

  // Play a full spelling round (1 wrong + 9 right) and verify the result summary.
  await evaluate(`document.querySelector('#backBtn').click()`);
  await sleep(100);
  await evaluate(`document.querySelector('[data-mod="personal"][data-feature="spelling"]').click()`);
  await sleep(200);
  const played = await evaluate(`(() => {
    for (let i = 0; i < 10; i++) {
      const en = document.querySelector('.zh-big').dataset.en; // exact target word
      const inp = document.querySelector('#spellInput');
      inp.value = (i === 0) ? 'zzzz' : en; // first answer deliberately wrong
      document.querySelector('#spellForm').dispatchEvent(new Event('submit', { cancelable: true }));
      document.querySelector('#spellSubmit').click(); // Check button now says Next → and advances
    }
    const items = Array.from(document.querySelectorAll('.summary-item'));
    const bad = items.filter((it) => it.classList.contains('bad'));
    const firstBad = bad[0] ? bad[0].textContent : '';
    return {
      count: items.length,
      badCount: bad.length,
      firstBadShowsCorrect: firstBad.includes('correct:'),
      score: document.querySelector('.score').textContent,
      retryShown: !!document.querySelector('#retryMissed'),
    };
  })()`);
  check(played.count === 10, `result summary lists all 10 questions (got ${played.count})`);
  check(played.badCount === 1, `exactly 1 wrong answer marked red (got ${played.badCount})`);
  check(played.firstBadShowsCorrect, "wrong answer row reveals the correct word");
  check(played.score === "9", `summary score is 9/10 (got "${played.score}")`);
  check(played.retryShown, "retry-missed button shown after round");

  // Retry the 1 missed item: its summary must show only that question (answers reset).
  const retried = await evaluate(`(() => {
    document.querySelector('#retryMissed').click();
    const en = document.querySelector('.zh-big').dataset.en;
    const inp = document.querySelector('#spellInput');
    inp.value = en;
    document.querySelector('#spellForm').dispatchEvent(new Event('submit', { cancelable: true }));
    document.querySelector('#spellSubmit').click();
    return { count: document.querySelectorAll('.summary-item').length, score: document.querySelector('.score').textContent };
  })()`);
  check(retried.count === 1, `retry summary shows only the 1 retried question (got ${retried.count})`);
  check(retried.score === "1", `retry summary score is 1/1 (got "${retried.score}")`);

  // Final: no uncaught exceptions.
  await sleep(300);
  check(exceptions.length === 0, `no JS exceptions (${exceptions.length})` + (exceptions.length ? " — " + exceptions.join("; ") : ""));

  ws.close();
  console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("SMOKE TEST ERROR:", e.message);
  process.exit(1);
}).finally(() => {
  setTimeout(killTree, 200);
});
