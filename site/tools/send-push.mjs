#!/usr/bin/env node
/* Sends a test push notification to every subscriber via the Send Function.
   Usage:
     node site/tools/send-push.mjs [title] [body]
   The Function base URL is read from site/push-config.js so the script targets
   the same endpoint the site is wired to. Against a deployed app, provide the
   Function host key:
     PUSH_FUNCTION_KEY=<host-key> node site/tools/send-push.mjs */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [title = "Egnlish Craft", body = "Time to practice your pronouns! 🎯"] =
  process.argv.slice(2);

const cfgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "push-config.js");
let apiBase = "http://localhost:7071";
try {
  const m = readFileSync(cfgPath, "utf8").match(/apiBase:\s*"([^"]+)"/);
  if (m) apiBase = m[1];
} catch {}

const headers = { "Content-Type": "application/json" };
if (process.env.PUSH_FUNCTION_KEY) headers["x-functions-key"] = process.env.PUSH_FUNCTION_KEY;

const res = await fetch(apiBase + "/api/send", {
  method: "POST",
  headers,
  body: JSON.stringify({ title, body }),
});

const text = await res.text();
let result;
try {
  result = JSON.parse(text);
} catch {
  result = { raw: text };
}

console.log(
  res.ok
    ? `sent=${result.sent} failed=${(result.failed || []).length}`
    : `HTTP ${res.status}: ${text}`
);
if (Array.isArray(result?.failed) && result.failed.length) {
  for (const f of result.failed) console.log(`  ✗ ${f.endpointHash} — ${f.error}`);
}
process.exit(res.ok ? 0 : 1);
