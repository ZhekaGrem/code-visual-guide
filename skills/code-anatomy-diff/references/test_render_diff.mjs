// Тести diff-режиму рендерера. Запуск: node --test skills/code-anatomy-diff/references/test_render_diff.mjs
// Рендерер один — у code-anatomy/references/guide_template.html; тест бере його звідти.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHARED = join(HERE, "..", "..", "code-anatomy", "references");
const TEMPLATE = readFileSync(join(SHARED, "guide_template.html"), "utf8");

function loadRenderer() {
  const m = TEMPLATE.match(/<script id="renderer">([\s\S]*?)<\/script>/);
  assert.ok(m, "у шаблоні немає <script id=\"renderer\">");
  return new Function(m[1] + "\nreturn CodeGuide;")();
}
function jsonFrom(path) {
  const m = readFileSync(path, "utf8").match(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/);
  assert.ok(m, `у ${path} немає блоку json`);
  return JSON.parse(m[1]);
}
const diffData = () => jsonFrom(join(HERE, "worked_example_diff.md"));
const guideData = () => jsonFrom(join(SHARED, "worked_example.md"));
const file = (side, path) => side.files.find((f) => f.path === path);
const el = (f, name) => f.elements.find((e) => e.name === name);
function rootCommit() {
  const d = diffData();
  d.range.from = null;
  d.before = { l1: { nodes: [], edges: [], callouts: [] }, files: [] };
  const a = d.after;
  for (const x of [...a.l1.nodes, ...a.l1.edges, ...a.files, ...a.files.flatMap((f) => f.elements)]) x.change = "added";
  return d;
}
const CG = loadRenderer();

// --- валідація --------------------------------------------------------------------
test("фікстура diff валідна", () => {
  CG.validateDiff(diffData());
});
test("звичайний гайд і далі валідний", () => {
  CG.validate(guideData());
});
test("added, що є в обох сторонах, відхиляється з ключем елемента", () => {
  const d = diffData();
  el(file(d.before, "src/checkout.ts"), "Item").change = "added";
  el(file(d.after, "src/checkout.ts"), "Item").change = "added";
  assert.throws(() => CG.validateDiff(d), (e) => e instanceof CG.GuideError && /Item \(import\)/.test(e.message) && /в обох/.test(e.message));
});
test("modified без пари відхиляється", () => {
  const d = diffData();
  const f = file(d.after, "src/checkout.ts");
  f.elements = f.elements.filter((e) => e.name !== "return");
  assert.throws(() => CG.validateDiff(d), (e) => e instanceof CG.GuideError && /return/.test(e.message) && /removed/.test(e.message));
});
test("різний change у двох сторонах відхиляється", () => {
  const d = diffData();
  el(file(d.before, "src/checkout.ts"), "TAX_RATE").change = "modified";
  assert.throws(() => CG.validateDiff(d), /не збігається/);
});
test("невідомий change відхиляється з переліком дозволених", () => {
  const d = diffData();
  d.before.l1.nodes[0].change = "moved";
  assert.throws(() => CG.validateDiff(d), /added \| removed \| modified \| null/);
});
test("повтор ключа в межах файлу відхиляється", () => {
  const d = diffData();
  const f = file(d.after, "src/checkout.ts");
  f.elements.push({ ...el(f, "reduce") });
  assert.throws(() => CG.validateDiff(d), /повторюється/);
});
test("renamed_from на неіснуючий шлях відхиляється", () => {
  const d = diffData();
  file(d.after, "src/checkout.ts").renamed_from = "src/old.ts";
  assert.throws(() => CG.validateDiff(d), (e) => /renamed_from/.test(e.message) && /src\/old\.ts/.test(e.message));
});
test("renamed_from зіставляє перейменований файл", () => {
  const d = diffData();
  file(d.before, "src/checkout.ts").path = "src/cart.ts";
  file(d.after, "src/checkout.ts").renamed_from = "src/cart.ts";
  CG.validateDiff(d);
});
test("changed_lines поза lines відхиляється", () => {
  const d = diffData();
  file(d.after, "src/checkout.ts").l3_fragment.changed_lines = [99];
  assert.throws(() => CG.validateDiff(d), /changed_lines/);
});
test("кожна сторона проходить звичайну валідацію", () => {
  const d = diffData();
  el(file(d.after, "src/checkout.ts"), "TAX_RATE").type = "helper";
  assert.throws(() => CG.validateDiff(d), (e) => /after: /.test(e.message) && /helper/.test(e.message));
});
test("бракує range — помилка називає поле", () => {
  const d = diffData();
  delete d.range;
  assert.throws(() => CG.validateDiff(d), /range/);
});
test("кореневий коміт з порожнім before валідний", () => {
  CG.validateDiff(rootCommit());
});
test("range.from = null з непорожнім before відхиляється, помилка називає range.from", () => {
  const d = diffData();
  d.range.from = null;
  assert.throws(() => CG.validateDiff(d), (e) => e instanceof CG.GuideError && /range\.from/.test(e.message));
});
test("changed_lines не масив відхиляється з GuideError, а не TypeError", () => {
  const d = diffData();
  file(d.after, "src/checkout.ts").l3_fragment.changed_lines = "3";
  assert.throws(() => CG.validateDiff(d), (e) => e instanceof CG.GuideError && /changed_lines/.test(e.message));
});

// --- рендер -----------------------------------------------------------------------
test("колонки БУЛО/СТАЛО на L1, кожному файлі L2 і фрагменті L3", () => {
  const html = CG.render(diffData());
  assert.equal(html.split('<div class="cols">').length - 1, 4);
  assert.ok(html.includes("<h3>БУЛО</h3>"));
  assert.ok(html.includes("<h3>СТАЛО</h3>"));
});
test("шапка показує діапазон, subject і summary", () => {
  const html = CG.render(diffData());
  assert.ok(html.includes("a1b2c3d4..e5f6a7b8"));
  assert.ok(html.includes("refactor(checkout)"));
  assert.ok(html.includes("hoisting зник"));
});
test("доданий файл має в колонці БУЛО «файлу не було»", () => {
  assert.ok(CG.render(diffData()).includes("файлу не було"));
});
test("кореневий коміт рендериться з порожнім БУЛО", () => {
  const html = CG.render(rootCommit());
  assert.ok(html.includes("кореневий коміт"));
  assert.ok(html.includes("∅..e5f6a7b8"));
});
test("усі файли видалені: порожнє СТАЛО не підписане як кореневий коміт", () => {
  const d = diffData();
  d.after = { l1: { nodes: [], edges: [], callouts: [] }, files: [] };
  const b = d.before;
  for (const x of [...b.l1.nodes, ...b.l1.edges, ...b.files, ...b.files.flatMap((f) => f.elements)]) x.change = "removed";
  const html = CG.render(d);
  assert.ok(!html.includes("кореневий коміт"));
  assert.ok(html.includes("вузлів немає"));
});
test("diff L3 показує «як читає мова» і «еквівалент без цукру»", () => {
  const html = CG.render(diffData());
  assert.ok(html.includes("ReferenceError"));
  assert.ok(html.includes("Promise.resolve"));
});
test("гліфи змін у Mermaid L2 і на ребрах L1", () => {
  const d = diffData();
  assert.ok(CG.mermaidL2(file(d.after, "src/checkout.ts"), true).includes('"+ formatSum"'));
  assert.ok(CG.mermaidL2(file(d.before, "src/checkout.ts"), true).includes('"− calculateTotal"'));
  assert.ok(CG.mermaidL2(file(d.after, "src/checkout.ts"), true).includes('"~ return"'));
  assert.ok(CG.mermaidL1(d.after.l1, true).includes('-->|"+"|'));
});
test("незмінене приглушене класом same", () => {
  const out = CG.mermaidL2(file(diffData().after, "src/checkout.ts"), true);
  assert.match(out, /classDef same opacity:0\.45/);
  assert.match(out, /class [e\d,]+ same/);
});
test("змінені рядки коду мають гліф у гутері і клас chg", () => {
  const html = CG.render(diffData());
  assert.ok(html.includes('<span class="gl">+</span>'));
  assert.ok(html.includes('<span class="gl">−</span>'));
  assert.match(html, /class="[^"]*\bchg\b/);
});
test("незмінене в SVG-стрічці приглушене", () => {
  const svg = CG.svgStrip(file(diffData().after, "src/checkout.ts"), true);
  assert.ok(svg.includes('<g opacity=".45">'));
  assert.ok(svg.includes(">+ calculateTotal<"));
});
test("таблиця елементів має стовпчик зміни", () => {
  assert.ok(CG.render(diffData()).includes("<th>зміна</th>"));
});
test("легенда пояснює гліфи", () => {
  assert.ok(CG.render(diffData()).includes("+ додано"));
});
test("teach-back diff питає про зміну порядку", () => {
  assert.match(CG.teachback(diffData()), /фрагмент №1 \(src\/checkout\.ts\).*в іншому порядку/);
});
test("звичайний гайд без mode не отримує diff-розмітки", () => {
  const html = CG.render(guideData());
  assert.ok(!html.includes('<div class="cols">'));
  assert.ok(!html.includes("classDef same"));
  assert.ok(!html.includes('class="gl"'));
  assert.ok(!html.includes("<th>зміна</th>"));
});
test("HTML у diff екранується", () => {
  const d = diffData();
  d.summary = "<img src=x onerror=alert(1)>";
  assert.ok(!CG.render(d).includes("<img src=x"));
});
