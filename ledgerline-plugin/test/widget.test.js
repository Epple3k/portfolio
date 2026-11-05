import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("MCP Apps widget script parses and keeps keyboard/source inspection", () => {
  const html=readFileSync(new URL("../public/finance-canvas.html",import.meta.url),"utf8");
  const body=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(body,"embedded app module should exist");
  const script=body.replace(/^\s*import\s*\{[\s\S]*?\}\s*from\s*"[^"]+";/,"");
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  assert.doesNotThrow(()=>new AsyncFunction(script));
  assert.match(script,/SEPARATE SCALE/);
  assert.match(script,/event\.key==="Enter"/);
  assert.match(script,/point\.meta\?\.derived/);
});
