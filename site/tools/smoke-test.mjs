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
    return r?.result?.value;
  };

  await send("Runtime.enable");
  await send("Page.enable");

  // Wait for the app to finish rendering the menu.
  let cards = 0;
  for (let i = 0; i < 60; i++) {
    cards = (await evaluate(`document.querySelectorAll('.card').length`)) || 0;
    if (cards === 4) break;
    await sleep(200);
  }

  check(cards === 4, `menu renders 4 activity cards (got ${cards})`);
  const menuState = await evaluate(`({
    cards: document.querySelectorAll('.card').length,
    menuHidden: document.querySelector('#menu').hidden,
    activityHidden: document.querySelector('#activity').hidden,
  })`);
  check(
    menuState.cards === 4 && !menuState.menuHidden && menuState.activityHidden,
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
    nextShown: !document.querySelector('#nextBtn').hidden,
  })`);
  check(fb.bad, "spelling wrong answer marks red feedback");
  check(/Not quite/.test(fb.text), `spelling reveals correct word on a miss (${fb.text.trim()})`);
  check(fb.nextShown, "spelling next button appears after check");

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
