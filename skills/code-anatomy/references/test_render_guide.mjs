// Тести рендерера code-anatomy. Запуск: node --test skills/code-anatomy/references/test_render_guide.mjs
// Рендерер живе всередині guide_template.html (<script id="renderer">); тест витягує його звідти,
// тому джерело правди одне. Node потрібен лише тому, хто править скіл, не учню.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = readFileSync(join(HERE, "guide_template.html"), "utf8");
const EXAMPLE = readFileSync(join(HERE, "worked_example.md"), "utf8");

function loadRenderer() {
  const m = TEMPLATE.match(/<script id="renderer">([\s\S]*?)<\/script>/);
  assert.ok(m, "у шаблоні немає <script id=\"renderer\">");
  return new Function(m[1] + "\nreturn CodeGuide;")();
}
function exampleData() {
  const m = EXAMPLE.match(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/);
  assert.ok(m, "у worked_example.md немає блоку ```json");
  return JSON.parse(m[1]);
}
const CG = loadRenderer();

// --- фікстура і шаблон ---------------------------------------------------------
test("worked_example має 12 елементів і валідний", () => {
  const data = exampleData();
  assert.equal(data.files[0].elements.length, 12);
  CG.validate(data);
});
test("шаблон має рівно один плейсхолдер — {{DATA}}", () => {
  const placeholders = [...TEMPLATE.matchAll(/\{\{[A-Z_]+\}\}/g)].map((m) => m[0]);
  assert.deepEqual(placeholders, ["{{DATA}}"]);
});
test("вставка JSON у шаблон лишає файл без плейсхолдерів", () => {
  const json = JSON.stringify(exampleData()).replace(/<\//g, "<\\/");
  const out = TEMPLATE.replace("{{DATA}}", json);
  assert.doesNotMatch(out, /\{\{[A-Z_]+\}\}/);
  assert.match(out, /"project":"shop"/);
});

// --- валідація ------------------------------------------------------------------
test("невідомий type відхиляється з переліком дозволених", () => {
  const d = exampleData(); d.files[0].elements[0].type = "helper";
  assert.throws(() => CG.validate(d), (e) => e instanceof CG.GuideError && /helper/.test(e.message) && /data \| operation \| syntax_sugar \| structure/.test(e.message));
});
test("explanation понад 15 слів відхиляється з назвою елемента", () => {
  const d = exampleData(); d.files[0].elements[1].explanation = Array(16).fill("слово").join(" ");
  assert.throws(() => CG.validate(d), /15/);
  assert.throws(() => CG.validate(d), /calculateTotal/);
});
test("відсутнє поле верхнього рівня називається", () => {
  const d = exampleData(); delete d.files;
  assert.throws(() => CG.validate(d), /files/);
});
test("order у чужому форматі відхиляється", () => {
  const d = exampleData(); d.files[0].elements[5].order = "step1";
  assert.throws(() => CG.validate(d), /order/);
});
test("callout з чужим kind відхиляється", () => {
  const d = exampleData();
  d.l1.callouts.push({ kind: 'x" onmouseover="alert(1)', where: "src/x.ts", note: "n" });
  assert.throws(() => CG.validate(d), (e) => e instanceof CG.GuideError && /callouts/.test(e.message) && /cycle \| orphan/.test(e.message));
});

// --- схема L1: files / entry ----------------------------------------------------
test("вузол L1 з files і entry валідний", () => {
  const d = exampleData(); d.l1.nodes[0].files = 3; d.l1.nodes[0].entry = true;
  CG.validate(d);
});
test("files не ціле > 0 відхиляється з назвою вузла", () => {
  const d = exampleData(); d.l1.nodes[0].files = "182";
  assert.throws(() => CG.validate(d), (e) => e instanceof CG.GuideError && /src\/checkout\.ts/.test(e.message) && /files/.test(e.message));
  d.l1.nodes[0].files = 0;
  assert.throws(() => CG.validate(d), /files/);
});
test("entry не bool відхиляється", () => {
  const d = exampleData(); d.l1.nodes[0].entry = "так";
  assert.throws(() => CG.validate(d), (e) => e instanceof CG.GuideError && /entry/.test(e.message));
});

// --- рендер -----------------------------------------------------------------------
const html = CG.render(exampleData());
test("render за замовчуванням темний: палітра dark у <style id=\"palette\"> і в Mermaid", () => {
  const out = CG.render(exampleData());
  assert.match(out, /<style id="palette">:root \{ color-scheme: dark;/);
  assert.ok(out.includes("--data: #93C2DA;"));
  assert.ok(out.includes("classDef data fill:#93C2DA"));
});
test("Mermaid стилізує через classDef усередині діаграми", () => {
  assert.match(html, /classDef structure/);
  assert.match(html, /classDef operation/);
});
test("по одній SVG-стрічці на фрагмент, з обома просторами нумерації", () => {
  const frags = exampleData().files.filter((f) => f.l3_fragment).length;
  assert.equal(html.split("<svg").length - 1, frags);
  assert.ok(html.includes(">1<"), "① модуль");
  assert.ok(html.includes(">f3<"), "тіло функції");
});
test("цукор малюється трикутником і шестикутником", () => {
  assert.match(html, /<polygon class="sugar-tri" points="[^"]+"/);
  assert.match(html, /<polygon class="sugar-hex" points="[^"]+"/);
});
test("рядки коду пронумеровані й підсвічені за типом", () => {
  assert.ok(html.includes('<span class="ln">1</span>'));
  assert.ok(html.includes('class="line-structure"'));
  assert.ok(html.includes('class="line-operation"'));
});
test("еквіваленти цукру виведені", () => {
  assert.ok(html.includes("Promise.resolve"));
});
test("side effect дає червону рамку і callout", () => {
  const d = exampleData(); d.files[0].elements[1].side_effect = "пише в консоль";
  const out = CG.render(d);
  assert.ok(out.includes("callout-side-effect"));
  assert.ok(out.includes(`stroke:${CG.PALETTES.dark.warn}`));
});
test("цикл імпортів дає callout і червоне ребро", () => {
  const d = exampleData();
  d.l1.edges.push({ from: "src/types.ts", to: "src/checkout.ts" });
  d.l1.callouts.push({ kind: "cycle", where: "src/checkout.ts -> src/types.ts", note: "Цикл імпортів." });
  const out = CG.render(d);
  assert.ok(out.includes("callout-cycle"));
  assert.ok(CG.mermaidL1(d.l1).includes("linkStyle"));
});
test("сирота малюється пунктирним колом", () => {
  const d = exampleData();
  d.l1.nodes.push({ id: "src/unused.ts", kind: "file", summary: "Ніхто не імпортує." });
  d.l1.callouts.push({ kind: "orphan", where: "src/unused.ts", note: "Сирота." });
  assert.ok(CG.render(d).includes("callout-orphan"));
  assert.ok(CG.mermaidL1(d.l1).includes('(("src/unused.ts"))'));
});
test("l2_note показується, коли є", () => {
  const d = exampleData(); d.l2_note = "L2 показано для 1 з 2 файлів: entry, хаби.";
  assert.ok(CG.render(d).includes("L2 показано для 1 з 2"));
});
test("HTML екранується", () => {
  const d = exampleData(); d.files[0].elements[0].explanation = "<script>alert(1)</script>";
  const out = CG.render(d);
  assert.ok(!out.includes("<script>alert"));
  assert.ok(out.includes("&lt;script&gt;"));
});
test("depth 1 без фрагментів дає підпис замість L3 і загальний teach-back", () => {
  const d = exampleData(); d.depth = 1; delete d.files[0].l3_fragment;
  const out = CG.render(d);
  assert.ok(out.includes("L3 не будувався"));
  assert.match(CG.teachback(d), /три файли/);
});

// --- екранування вставки в script-тег -----------------------------------------
test("вставка JSON екранує кожен < як \\u003c", () => {
  const json = JSON.stringify(exampleData()).replace(/</g, "\\u003c");
  assert.ok(!json.includes("<"), "у вставці не лишилось жодного <");
  assert.deepEqual(JSON.parse(json), exampleData());
});

// --- більше валідації -----------------------------------------------------------
test("lines у чужому форматі відхиляється", () => {
  const d = exampleData(); d.files[0].l3_fragment.lines = "перші рядки";
  assert.throws(() => CG.validate(d), (e) => e instanceof CG.GuideError && /lines/.test(e.message));
});
test("files не масив дає людську помилку", () => {
  const d = exampleData(); d.files = {};
  assert.throws(() => CG.validate(d), (e) => e instanceof CG.GuideError && /масивом/.test(e.message));
});

// --- Mermaid і фікстура ----------------------------------------------------------
test("ім'я з переносом рядка не ламає Mermaid", () => {
  const d = exampleData(); d.files[0].elements[1].name = "a\nb";
  const out = CG.mermaidL2(d.files[0]);
  assert.ok(!out.includes("a\nb"));
  assert.ok(out.includes("a b"));
});
test("ім'я '1. крок' не лишає пробіл після крапки — Mermaid читає це як markdown-список", () => {
  const d = exampleData(); d.files[0].elements[1].name = "1. крок";
  const out = CG.mermaidL2(d.files[0]);
  assert.ok(!out.includes('"1. крок"'));
  assert.ok(out.includes('"1.крок"'));
});
test("довге ім'я обрізається до ліміту з '…'", () => {
  const d = exampleData(); d.files[0].elements[1].name = "a".repeat(60);
  const out = CG.mermaidL2(d.files[0]);
  assert.ok(out.includes('"' + "a".repeat(40) + "…" + '"'));
  assert.ok(!out.includes("a".repeat(41)));
});
test("кожен f-order лежить у тілі функції фікстури", () => {
  const d = exampleData();
  for (const el of d.files[0].elements) {
    if (typeof el.order === "string") {
      assert.ok(el.line >= 3 && el.line <= 6, `${el.name}: line ${el.line} поза тілом функції (3-6)`);
    }
  }
});

// --- теми -------------------------------------------------------------------------
test("render у світлій темі бере світлу палітру і в Mermaid теж", () => {
  const out = CG.render(exampleData(), "light");
  assert.ok(out.includes("--data: #4C6FD6;"));
  assert.ok(out.includes("classDef data fill:#4C6FD6"));
  assert.ok(!out.includes("#93C2DA"));
});
test("після світлого рендера наступний дефолтний знову темний", () => {
  CG.render(exampleData(), "light");
  assert.ok(CG.render(exampleData()).includes("classDef data fill:#93C2DA"));
});
test("невідома тема відхиляється", () => {
  assert.throws(() => CG.render(exampleData(), "sepia"), (e) => e instanceof CG.GuideError && /dark \| light/.test(e.message));
});
test("кожен колір, який читає CSS шаблону, є в обох палітрах", () => {
  const css = TEMPLATE.match(/<style>([\s\S]*?)<\/style>/)[1];
  const used = new Set([...css.matchAll(/var\(--([\w-]+)/g)].map((m) => m[1]).filter((v) => !v.startsWith("font-") && v !== "c"));
  assert.ok(used.size > 10, "CSS має читати кольори через var(--…)");
  for (const theme of ["dark", "light"]) {
    const pal = CG.themeCss(theme);
    for (const v of used) assert.ok(pal.includes(`--${v}:`), `${theme}: бракує --${v}`);
  }
});
test("у CSS шаблону немає жодного hex-кольору — лише var(--…)", () => {
  const css = TEMPLATE.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.deepEqual(css.match(/#[0-9a-fA-F]{3,8}\b/g), null);
});
test("шапка має перемикач теми з підписом протилежної", () => {
  assert.ok(CG.render(exampleData()).includes("☀ Світла тема"));
  assert.ok(CG.render(exampleData(), "light").includes("☾ Темна тема"));
});

// --- граф L1 ----------------------------------------------------------------------
const l1Of = (nodes, edges, callouts = []) => ({ nodes, edges, callouts });
const elOf = (els, id) => els.find((e) => e.data.id === id);
test("cyElements: висота вузла росте як √files", () => {
  const els = CG.cyElements(l1Of([{ id: "web", kind: "dir", files: 182 }, { id: "pricing", kind: "dir", files: 6 }], []));
  assert.equal(elOf(els, "web").data.h, 130);
  assert.equal(elOf(els, "pricing").data.h, 65);
  assert.equal(elOf(els, "web").data.label, "web\n182");
});
test("cyElements: без files усі вузли однакові й підпис без числа", () => {
  const els = CG.cyElements(exampleData().l1);
  assert.equal(elOf(els, "src/checkout.ts").data.h, 130);
  assert.equal(elOf(els, "src/types.ts").data.h, 130);
  assert.equal(elOf(els, "src/checkout.ts").data.label, "src/checkout.ts");
});
test("cyElements: entry, orphan і hub стають класами; ребра в хаб — tohub", () => {
  const five = ["a", "b", "c", "d", "e"];
  const nodes = [{ id: "app", kind: "file", entry: true }, { id: "shared", kind: "dir" }, { id: "lonely", kind: "dir" }, ...five.map((id) => ({ id, kind: "dir" }))];
  const els = CG.cyElements(l1Of(nodes, five.map((from) => ({ from, to: "shared" })), [{ kind: "orphan", where: "lonely", note: "n" }]));
  assert.equal(elOf(els, "app").classes, "entry");
  assert.equal(elOf(els, "lonely").classes, "orphan");
  assert.equal(elOf(els, "shared").classes, "hub");
  assert.ok(els.filter((e) => e.group === "edges").every((e) => e.classes === "tohub"));
});
test("cyElements: ребра циклу — cycle, ребро на невідомий вузол відкидається", () => {
  const els = CG.cyElements(l1Of([{ id: "x", kind: "file" }, { id: "y", kind: "file" }],
    [{ from: "x", to: "y" }, { from: "y", to: "x" }, { from: "x", to: "ghost" }], [{ kind: "cycle", where: "x -> y", note: "n" }]));
  const edges = els.filter((e) => e.group === "edges");
  assert.equal(edges.length, 2);
  assert.ok(edges.every((e) => e.classes === "cycle"));
});
test("cyElements: дужки з id прибираються, довгий id обрізається з початку", () => {
  const els = CG.cyElements(l1Of([{ id: "com/emark (EmarkBackendApplication)", kind: "file" }, { id: "resources/db/migration + db/seed", kind: "dir" }], []));
  assert.equal(els[0].data.label, "com/emark");
  assert.equal(els[1].data.label, "…b/migration + db/seed");
});
test("панель вузла: від кого залежить і хто залежить від нього", () => {
  const l1 = l1Of([{ id: "web", kind: "dir" }, { id: "catalog", kind: "dir", files: 157, summary: "Товари." }, { id: "pricing", kind: "dir" }, { id: "shared", kind: "dir" }],
    [{ from: "web", to: "catalog" }, { from: "pricing", to: "catalog" }, { from: "catalog", to: "shared" }]);
  const out = CG.l1PanelHtml(l1, "catalog");
  assert.ok(out.includes("Залежить від (1)"));
  assert.ok(out.includes('<a data-node="shared">shared</a>'));
  assert.ok(out.includes("Від нього залежать (2)"));
  assert.ok(out.includes("файлів: 157"));
  assert.ok(out.includes("Товари."));
});
test("панель без вибору — огляд із callout-ами", () => {
  const out = CG.l1PanelHtml(l1Of([{ id: "cart", kind: "dir" }], [], [{ kind: "orphan", where: "cart", note: "Ніхто не імпортує." }]), null);
  assert.ok(out.includes("вузлів: 1 · залежностей: 0"));
  assert.ok(out.includes("callout-orphan"));
});
test("callout циклу видно в панелі обох кінців, але не у вузла з тим самим префіксом", () => {
  const l1 = l1Of([{ id: "a" }, { id: "ab" }, { id: "b" }], [], [{ kind: "cycle", where: "a -> b", note: "Цикл." }]);
  assert.ok(CG.l1PanelHtml(l1, "b").includes("Цикл."));
  assert.ok(!CG.l1PanelHtml(l1, "ab").includes("Цикл."));
});
test("панель екранює id і summary", () => {
  const out = CG.l1PanelHtml(l1Of([{ id: "<x>", summary: "<img src=x>" }], []), "<x>");
  assert.ok(!out.includes("<img"));
  assert.ok(out.includes("&lt;x&gt;"));
});

// --- L1 у сторінці ----------------------------------------------------------------
test("L1 — інтерактивний граф: контейнер, панель-огляд, список; Mermaid лише на L2", () => {
  const html = CG.render(exampleData());
  assert.equal(html.split('id="cy-l1"').length - 1, 1);
  assert.ok(html.includes('id="l1-panel"'));
  assert.ok(html.includes("вузлів: 2 · залежностей: 1"));
  assert.ok(html.includes("Список модулів (2)"));
  assert.equal(html.split('<pre class="mermaid">').length - 1, exampleData().files.length);
});
test("CDN: mermaid, elk → cytoscape → cytoscape-elk саме в такому порядку", () => {
  const i = (s) => TEMPLATE.indexOf(s);
  for (const s of ["mermaid/11.15.0/mermaid.min.js", "elkjs@0.9.3/lib/elk.bundled.js", "cytoscape/3.30.2/cytoscape.min.js", "cytoscape-elk@2.2.0/dist/cytoscape-elk.js"]) assert.ok(i(s) > 0, s);
  assert.ok(i("elkjs@0.9.3") < i("cytoscape/3.30.2"));
  assert.ok(i("cytoscape/3.30.2") < i("cytoscape-elk@2.2.0"));
});
test("diff-режим L1 лишається на Mermaid, без Cytoscape-контейнера", () => {
  const d = JSON.parse(readFileSync(join(HERE, "..", "..", "code-anatomy-diff", "references", "worked_example_diff.md"), "utf8").match(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/)[1]);
  assert.ok(!CG.render(d).includes('id="cy-l1"'));
});

// --- програвач L3: кроки ------------------------------------------------------------
const F = () => exampleData().files[0];
test("кроки програвача: спершу модуль 1..3, потім f1..f8; каркас без order випадає", () => {
  assert.deepEqual(CG.playerSteps(F()).map((s) => s.order), [1, 2, 3, "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"]);
});
test("markToken підсвічує саме токен, а не весь рядок", () => {
  assert.equal(CG.markToken("x.map(a)", ".map(...)"), "x<mark>.map(</mark>a)");
  assert.equal(CG.markToken("a => b", "a => b"), "<mark>a =&gt; b</mark>");
  assert.equal(CG.markToken("foo()", "bar"), null);
});
test("код на кроці f3: рядок 4 поточний з токеном reduce, бейджі f1–f3, рядок 5 ще попереду", () => {
  const out = CG.playerCode(F(), 5);
  const row4 = out.match(/<div class="row cur"[^>]*><span class="ln">4<\/span>[\s\S]*?<\/div>/)[0];
  assert.ok(row4.includes("<mark>reduce</mark>"));
  for (const o of ["f1", "f2", "f3"]) assert.ok(row4.includes(`>${o}</span>`), o);
  assert.ok(!row4.includes(">f4</span>"));
  assert.match(out, /<div class="row dim"><span class="ln">5<\/span>/);
  assert.match(out, /<div class="row"><span class="ln">1<\/span>/);
});
test("картка кроку: фаза, лічильник, тип; для async — еквівалент без цукру", () => {
  const first = CG.playerCard(F(), 0);
  assert.ok(first.includes("Завантаження модуля · 1 / 11"));
  assert.ok(first.includes("каркас · import"));
  const last = CG.playerCard(F(), 10);
  assert.ok(last.includes("Виклик функції · 11 / 11"));
  assert.ok(last.includes("Promise.resolve"));
});
test("побічний ефект — окремий блок у картці", () => {
  const f = F(); f.elements[1].side_effect = "пише в консоль";
  assert.ok(CG.playerCard(f, 1).includes("Побічний ефект"));
});
test("картка екранює ім'я і пояснення", () => {
  const f = F(); f.elements[0].name = "<b>"; f.elements[0].explanation = "<script>x</script>";
  const out = CG.playerCard(f, 0);
  assert.ok(!out.includes("<script>x"));
  assert.ok(out.includes("&lt;b&gt;"));
});
