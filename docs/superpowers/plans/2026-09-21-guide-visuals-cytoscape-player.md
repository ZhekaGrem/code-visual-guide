# Візуалізація гайда: Cytoscape+ELK для L1, програвач для L3, дві теми — план реалізації

> **Для агентів-виконавців:** ОБОВ'ЯЗКОВИЙ СУБ-СКІЛ: superpowers:subagent-driven-development (рекомендовано) або superpowers:executing-plans — задача за задачею. Кроки мають чекбокси (`- [ ]`).

**Мета:** замінити статичний Mermaid-граф L1 на інтерактивний Cytoscape.js + ELK, а SVG-стрічку L3 — на покроковий програвач порядку виконання; зробити темну тему (Woodland + Willow Brook) основною, а світлу (Screamin' Green + Salt Box) — перемикачем.

**Архітектура:** рендерер лишається один — `skills/code-anatomy/references/guide_template.html`. Він і далі складається з **чистих** функцій, що повертають рядки HTML (їх ганяють тести в Node), плюс браузерна фаза `paint → mountL1 / mountPlayers`, яка оживляє розмітку. Палітри живуть у `PALETTES` (JS) — єдине джерело кольорів; `render(data, theme)` вставляє їх як `<style id="palette">` з CSS-змінними, тож перемикання теми = повний перерендер. Diff-режим (`code-anatomy-diff`) не переробляється: він і далі малює L1/L2 Mermaid-ом і L3 SVG-стрічкою, лише бере кольори з активної палітри.

**Стек:** vanilla JS у одному HTML; Cytoscape.js 3.30.2 (cdnjs), elkjs 0.9.3 + cytoscape-elk 2.2.0 (jsdelivr), Mermaid 11.15.0 (cdnjs, лишається для L2 і diff), Google Fonts (Unbounded / IBM Plex Sans / JetBrains Mono). Тести — `node --test`, Node 18+, без npm.

**Специфікація:** окремої немає — рішення погоджені в чаті 2026-09-21 і зведені в секцію «Рішення» нижче. Робочий прототип, який власник схвалив: `docs/superpowers/prototypes/2026-09-21-guide-visuals/prototype_template.html` (збірка: `build.mjs`). Коли сумніваєшся, як має виглядати чи поводитись — дивись прототип.

## Global Constraints

- Рендерер один: `skills/code-anatomy/references/guide_template.html`. Копій не робити; diff-скіл читає його ж (`../code-anatomy/references/guide_template.html`).
- Після **кожної** задачі зелені обидва набори: `node --test skills/code-anatomy/references/test_render_guide.mjs` і `node --test skills/code-anatomy-diff/references/test_render_diff.mjs` (стартова точка: 28 і 30 passed).
- CDN — рівно ці URL, у цьому порядку в кінці `<body>`:
  - `https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.15.0/mermaid.min.js`
  - `https://cdn.jsdelivr.net/npm/elkjs@0.9.3/lib/elk.bundled.js`
  - `https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.2/cytoscape.min.js`
  - `https://cdn.jsdelivr.net/npm/cytoscape-elk@2.2.0/dist/cytoscape-elk.js` (реєструється сам, якщо `ELK` і `cytoscape` уже є)
- Палітри — точні hex із `PALETTES` у Task 1; жодного hex-кольору поза `PALETTES` у рендерері й CSS.
- Тема за замовчуванням — `dark`; збережений вибір — `localStorage["code-anatomy-theme"]`, кожен доступ у `try/catch`.
- Код — у лігатурах **не** показувати (`font-variant-ligatures: none`): учень має бачити `->`, `==`, `=>` буквально.
- UI-тексти — українською; ідентифікатори — англійською.
- Діф-режим: розмітка й поведінка не змінюються (лише кольори через палітру).
- Коміти: Conventional Commits англійською, 1–2 речення тіла, без `Co-Authored-By`; `git commit -- <шляхи>` (pathspec). Якщо в репо ще немає першого коміту — кроки commit **пропускай**: перший коміт робить власник.

## Рішення (зведено з чату 2026-09-21)

1. **L1** — Cytoscape.js + ELK `layered`, напрям `RIGHT`. Висота вузла `round(50 + 80·√(files / maxFiles))`, ширина `max(round(h·1.6), len(label)·10 + 28)`. Класи: `entry` (вузол з `entry: true`), `orphan` (callout orphan), `hub` (≥ 5 вхідних ребер). Ребра в хаб — клас `tohub`, приглушуються прапорцем (за замовчуванням увімкнено). Ребра циклу — `cycle`, червоні. Клік на вузол: решта тьмяніє, вихідні ребра — `accent`, вхідні — `pink`, праворуч панель із summary і клікабельними сусідами. Пошук підсвічує збіги, кнопка «Вписати». Без інтернету — повідомлення + список модулів + панель-огляд.
2. **L3** — програвач: код ліворуч (поточний рядок підсвічений, поточний **токен** — `<mark>`, бейджі пройдених кроків на полях), картка кроку праворуч (номер, тип, пояснення, «як читає мова», «без цукру», побічний ефект), ◀ ▶ / програти (1.8 с на крок) / слайдер, доріжки «модуль» і «виклик» із клікабельними чипами; клавіші ← → Пробіл працюють у сфокусованому програвачі. Одразу після рендера показано крок 1 (сторінка має сенс без кліків).
3. **Схема L1** отримує два опційні поля вузла: `files` (ціле > 0, скільки файлів коду у вузлі) і `entry` (bool). Без них усе працює: `files` → 1, entry не підсвічується.
4. **Теми.** Темна: Woodland `#44472A` + Willow Brook `#E4EDDD`. Світла: Screamin' Green `#41ED89` (заливки/обводки) + Salt Box `#68596F` (другорядний текст, каркас); текстовий акцент світлої — `#0B8A46` (неон на білому не читається).
5. **L2 і diff** лишаються на Mermaid; Cytoscape для diff — поза цим планом.

## Карта файлів

| Файл | Що змінюється |
|---|---|
| `skills/code-anatomy/references/guide_template.html` | палітри + CSS; `render(data, theme)`; нові чисті функції `themeCss`, `cyElements`, `l1PanelHtml`, `playerSteps`, `markToken`, `playerCode`, `playerCard`, `playerHtml`; браузерні `paint`, `mountL1`, `mountPlayers`; CDN-скрипти |
| `skills/code-anatomy/references/test_render_guide.mjs` | нові тести й переписані ті, що перевіряли Mermaid-L1 / SVG-стрічку в звичайному режимі |
| `skills/code-anatomy/SKILL.md` | схема (`files`, `entry`), constraint-и Кроку 1, абзац про кольори, boundaries (зовнішні ресурси, офлайн) |
| `skills/code-anatomy/references/worked_example.md` | «Що з цього бачить учень» |
| `README.md` | кольори в Mermaid-легенді → темна палітра, опис інтерактиву |

---

### Task 1: Палітри, дві теми і перемикач

**Files:**
- Modify: `skills/code-anatomy/references/guide_template.html` (`<head>`, увесь `<style>`, константи рендерера, `classDefs`, `svgShape`, `svgStrip`, `header`, `diffHeader`, `render`, `boot`, `return`)
- Test: `skills/code-anatomy/references/test_render_guide.mjs`

**Interfaces:**
- Produces: `PALETTES` (`{dark, light}`, ключі нижче), `themeCss(theme) -> string`, `render(data, theme = "dark") -> string`, модульна змінна `COLORS` (= активна палітра; її читають `classDefs`, `svgShape`, `svgStrip` і всі наступні задачі), `paint(data, theme, first)` (браузер), CSS-класи `.btn`, `[data-theme-toggle]`.

- [ ] **Step 1: Напиши падаючі тести** — додай у кінець `test_render_guide.mjs` і заміни тест «усі п'ять кольорів палітри присутні» (він більше не має сенсу) на перший із них:

```js
// --- теми -------------------------------------------------------------------------
test("render за замовчуванням темний: палітра dark у <style id=\"palette\"> і в Mermaid", () => {
  const out = CG.render(exampleData());
  assert.match(out, /<style id="palette">:root \{ color-scheme: dark;/);
  assert.ok(out.includes("--data: #93C2DA;"));
  assert.ok(out.includes("classDef data fill:#93C2DA"));
});
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
```

І в тесті «side effect дає червону рамку і callout» заміни `assert.ok(out.includes("stroke:#DC2626"));` на:

```js
  assert.ok(out.includes(`stroke:${CG.PALETTES.dark.warn}`));
```

- [ ] **Step 2: Запусти — мають впасти**

Run: `node --test skills/code-anatomy/references/test_render_guide.mjs`
Expected: FAIL — `CG.themeCss is not a function`, `CG.PALETTES` undefined, немає `<style id="palette">`.

- [ ] **Step 3: Шрифти й CSS.** У `<head>` після `<meta name="viewport" …>` додай:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Unbounded:wght@500;700&display=swap" rel="stylesheet">
```

Заміни **весь** вміст `<style>…</style>` на:

```css
  /* Кольори — лише var(--…): значення пише рендерер (<style id="palette"> з PALETTES). Тут — шрифти й розкладка. */
  :root { color-scheme: dark;
    --font-display: "Unbounded", "Arial Black", system-ui, sans-serif;
    --font-body: "IBM Plex Sans", system-ui, "Segoe UI", sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, Consolas, monospace; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: var(--font-body); color: var(--ink); font-size: 15px; line-height: 1.5; background: var(--bg); }
  body { padding: 24px 16px 60px; max-width: 1280px; margin: 0 auto; }
  code, kbd, pre, .code { font-family: var(--font-mono); font-variant-ligatures: none; font-feature-settings: "liga" 0, "calt" 0; }
  header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
  h1 { font: 700 clamp(22px, 3vw, 32px)/1.1 var(--font-display); letter-spacing: -.02em; margin: 0 0 6px; }
  h2 { font: 700 20px/1.2 var(--font-display); letter-spacing: -.01em; margin: 32px 0 8px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
  a { color: var(--accent); }
  .sub { color: var(--muted); margin: 0 0 12px; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 10px; background: var(--sunk);
    border: 1px solid var(--line); font-size: .85em; margin-right: 4px; }
  .btn { border: 1px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 8px;
    padding: 6px 12px; cursor: pointer; font: inherit; }
  .btn:hover { background: var(--sunk); }
  button:focus-visible, input:focus-visible, summary:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--glow); outline-offset: 2px; }
  kbd { border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 4px; padding: 0 5px; font-size: .8em; background: var(--sunk); }
  details { border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; margin: 12px 0; background: var(--surface); }
  summary { cursor: pointer; font-weight: 600; }
  .legend { display: flex; flex-wrap: wrap; gap: 10px 18px; padding: 10px 12px; background: var(--sunk);
    border-radius: 8px; margin: 12px 0; }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .legend i { display: inline-block; width: 14px; height: 14px; border-radius: 3px; }
  .swatch-data { background: var(--data); }
  .swatch-const { background: var(--const); }
  .swatch-operation { background: var(--operation); }
  .swatch-sugar { background: var(--syntax_sugar); }
  .swatch-structure { background: var(--structure); }
  .swatch-warn { background: var(--warn); }
  .callout { border-left: 4px solid var(--warn); background: var(--warn-soft); padding: 6px 10px; margin: 8px 0; border-radius: 6px; }
  .callout-orphan { border-color: var(--structure); background: var(--sunk); }
  .error { border: 2px solid var(--warn); background: var(--warn-soft); padding: 12px; border-radius: 6px; white-space: pre-wrap; }
  pre.mermaid { background: transparent; overflow-x: auto; }
  table.elements { border-collapse: collapse; width: 100%; font-size: .92em; }
  table.elements th, table.elements td { border-bottom: 1px solid var(--line); padding: 4px 6px; text-align: left; vertical-align: top; }
  table.elements td.t-data { border-left: 4px solid var(--data); }
  table.elements td.t-operation { border-left: 4px solid var(--operation); }
  table.elements td.t-syntax_sugar { border-left: 4px solid var(--syntax_sugar); }
  table.elements td.t-structure { border-left: 4px solid var(--structure); }
  .frag { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  @media (max-width: 760px) { .frag { grid-template-columns: 1fr; } }
  .cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  @media (max-width: 760px) { .cols { grid-template-columns: 1fr; } }
  .col { min-width: 0; }
  .col h3 { font-size: .8rem; letter-spacing: .08em; color: var(--muted); margin: 4px 0 6px; }
  .absent { font-style: italic; }
  .code { font-size: .88em; background: var(--code-bg); color: var(--code-ink); border: 1px solid var(--line);
    border-radius: 8px; padding: 8px 0; overflow-x: auto; }
  .code div { display: flex; padding: 0 10px; white-space: pre; }
  .code div.chg { background: color-mix(in srgb, var(--glow) 14%, transparent); }
  .code .gl { width: 1.2em; flex: none; font-weight: 700; }
  .code .ln { width: 2.5em; color: var(--code-ln); user-select: none; flex: none; }
  .line-data { border-left: 4px solid var(--data); }
  .line-operation { border-left: 4px solid var(--operation); }
  .line-sugar { border-left: 4px solid var(--syntax_sugar); }
  .line-structure { border-left: 4px solid var(--structure); }
  .strip { overflow-x: auto; }
  .strip svg { display: block; max-width: 100%; height: auto; font-family: inherit; }
  .strip text { font-size: 11px; }
  .strip text.label { fill: var(--ink); font-size: 10px; }
  .strip text.space { fill: var(--muted); font-size: 11px; font-weight: 600; }
  .why { background: var(--sunk); border-radius: 8px; padding: 8px 12px; margin-top: 10px; }
  footer { margin-top: 32px; color: var(--muted); font-size: .9em; border-top: 1px solid var(--line); padding-top: 12px; }
```

(Зверни увагу: у `.strip text` більше немає `fill` — колір тексту в SVG задає атрибут із палітри; CSS-`fill` перебивав би атрибут.)

- [ ] **Step 4: Палітри в рендерері.** Заміни рядки з `const COLORS = { data: "#3B82F6", …` (2 рядки) на:

```js
  // Єдине джерело кольорів. Ключі стають CSS-змінними: accentSoft → --accent-soft, syntax_sugar → --syntax_sugar.
  const PALETTES = {
    // Темна (основна): Woodland #44472A + Willow Brook #E4EDDD
    dark: { bg: "#1A1B11", surface: "#232519", sunk: "#1E2015", ink: "#E4EDDD", muted: "#A7AE98", line: "#3A3D27",
      accent: "#E4EDDD", accentSoft: "#44472A", glow: "#C8DDB0", pink: "#D7A6E3",
      data: "#93C2DA", const: "#6A9FBC", operation: "#B3D57A", syntax_sugar: "#E6BF63", structure: "#8E9170",
      warn: "#E8876B", warnSoft: "#3A2419", hub: "#44472A", edge: "#5C5F42", grid: "#2A2C1D",
      codeBg: "#15160E", codeInk: "#E4EDDD", codeLn: "#676A4E", onType: "#1A1B11", mermaid: "dark" },
    // Світла: Screamin' Green #41ED89 (заливки) + Salt Box #68596F (текст, каркас)
    light: { bg: "#F6F4F7", surface: "#FFFFFF", sunk: "#EFEBF1", ink: "#2A2230", muted: "#68596F", line: "#DDD5E1",
      accent: "#0B8A46", accentSoft: "#DCFBE9", glow: "#41ED89", pink: "#B8479A",
      data: "#4C6FD6", const: "#34479A", operation: "#0E9384", syntax_sugar: "#D98612", structure: "#68596F",
      warn: "#D2423A", warnSoft: "#FBE7E5", hub: "#A99BB0", edge: "#B9AFBF", grid: "#E4DDE8",
      codeBg: "#2A2230", codeInk: "#F1ECF4", codeLn: "#8A7C92", onType: "#FFFFFF", mermaid: "neutral" },
  };
  let COLORS = PALETTES.dark;   // активна палітра; render() перемикає її на початку кожного виклику
  const cssName = (k) => "--" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  function themeCss(theme) {
    const vars = Object.entries(PALETTES[theme]).filter(([k]) => k !== "mermaid").map(([k, v]) => `${cssName(k)}: ${v};`).join(" ");
    return `<style id="palette">:root { color-scheme: ${theme}; ${vars} }</style>`;
  }
  const themeButton = (theme) => `<button type="button" class="btn" data-theme-toggle>${theme === "dark" ? "☀ Світла тема" : "☾ Темна тема"}</button>`;
```

- [ ] **Step 5: Mermaid і SVG — з палітри.** Заміни `classDefs()` на:

```js
  function classDefs() {
    const on = COLORS.onType;
    return [
      `classDef data fill:${COLORS.data},color:${on}`,
      `classDef const fill:${COLORS.const},color:${on}`,
      `classDef operation fill:${COLORS.operation},color:${on}`,
      `classDef syntax_sugar fill:${COLORS.syntax_sugar},color:${on}`,
      `classDef structure fill:${COLORS.structure},color:${on},stroke-dasharray:4 2`,
      `classDef orphan fill:${COLORS.structure},color:${on},stroke:${COLORS.warn},stroke-dasharray:4 2`,
    ];
  }
```

У `svgShape` останній `return` (каркас) — `fill="#fff"` → `fill="${COLORS.surface}"`. У `svgStrip`: у `<marker …><path … fill="#5b6470"/>` і в `<line … stroke="#5b6470" …>` заміни `#5b6470` на `${COLORS.edge}`; рядок `const fill = el.type === "syntax_sugar" ? "#1a1a1a" : "#fff";` заміни на:

```js
        const fill = el.type === "structure" ? COLORS.ink : COLORS.onType;
```

- [ ] **Step 6: Шапки з перемикачем.** Заміни `header(data)`:

```js
  function header(data, theme) {
    const langs = data.languages.map((l) => `<span class="badge">${esc(l)}</span>`).join(" ");
    return `<header><div><h1>Code guide — ${esc(data.project)}</h1>` +
      `<p class="sub">${esc(data.generated)} · commit ${esc(data.git_commit || "—")} · depth ${esc(data.depth)} · ${langs}</p></div>${themeButton(theme)}</header>`;
  }
```

У `diffHeader(data)` → `diffHeader(data, theme)`: відкривай `<header><div>`, а перед `</header>` закрий `</div>${themeButton(theme)}` (решта рядків без змін):

```js
  function diffHeader(data, theme) {
    const r = data.range;
    const langs = data.languages.map((l) => `<span class="badge">${esc(l)}</span>`).join(" ");
    return `<header><div><h1>Code diff — ${esc(data.project)}</h1>` +
      `<p class="sub">${esc(data.generated)} · ${esc(`${r.from || "∅"}..${r.to}`)}${r.subject ? " · " + esc(r.subject) : ""} · depth ${esc(data.depth)} · ${langs}</p>` +
      `<p>${esc(data.summary)}</p></div>${themeButton(theme)}</header>`;
  }
```

- [ ] **Step 7: `render` з темою.** Заміни `render`:

```js
  // Повний HTML тіла для #app. Кидає GuideError, якщо дані чи тема невалідні.
  function render(data, theme = "dark") {
    if (!PALETTES[theme]) throw new GuideError(`тема має бути dark | light, а не ${JSON.stringify(theme)}`);
    COLORS = PALETTES[theme];
    if (data && data.mode === "diff") {
      validateDiff(data);
      return themeCss(theme) + diffHeader(data, theme) + legend(true) + diffL1(data) + diffL2(data) + diffL3(data) + footer(data);
    }
    validate(data);
    return themeCss(theme) + header(data, theme) + legend() + l1Html(data) + l2Html(data) + l3Html(data) + footer(data);
  }
```

- [ ] **Step 8: Браузер — `paint` і збережена тема.** Заміни весь блок `// --- boot` (від `function boot()` до `return { … }` не включно) на:

```js
  // ------------------------------------------------------------------- boot
  const THEME_KEY = "code-anatomy-theme";
  function savedTheme() {
    try { return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"; } catch (e) { return "dark"; }
  }
  // Mermaid: в Artifact pre.mermaid може відрендерити хост; при першому показі чекаємо, і лише якщо SVG так і не з'явився — рендеримо самі.
  function runMermaid(theme, wait) {
    setTimeout(() => {
      if (!window.mermaid || document.querySelector("pre.mermaid svg")) return;
      window.mermaid.initialize({ startOnLoad: false, theme: PALETTES[theme].mermaid });
      window.mermaid.run({ querySelector: "pre.mermaid" });
    }, wait);
  }
  function paint(data, theme, first) {
    const app = document.getElementById("app");
    app.innerHTML = render(data, theme);
    document.documentElement.dataset.theme = theme;
    document.title = `${data.mode === "diff" ? "Code diff" : "Code guide"} — ${data.project}`;
    runMermaid(theme, first ? 1500 : 0);
    app.querySelector("[data-theme-toggle]").onclick = () => {
      const next = theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* приватне вікно — тема просто не запам'ятається */ }
      paint(data, next, false);
    };
  }
  function boot() {
    try {
      paint(JSON.parse(document.getElementById("guide-data").textContent), savedTheme(), true);
    } catch (e) {
      document.getElementById("app").innerHTML = `${themeCss("dark")}<div class="error">Помилка гайда: ${esc(e.message)}</div>`;
    }
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  }
```

Рядок експорту заміни на:

```js
  return { TYPES, PALETTES, GuideError, validate, validateDiff, themeCss, mermaidL1, mermaidL2, svgStrip, codeBlock, elementsTable, legend, render, teachback };
```

І коментар у першому рядку `<style>` уже оновлено (Step 3); коментар над `<script id="renderer">` не чіпай.

- [ ] **Step 9: Запусти обидва набори**

Run: `node --test skills/code-anatomy/references/test_render_guide.mjs; node --test skills/code-anatomy-diff/references/test_render_diff.mjs`
Expected: обидва PASS, 0 fail. Якщо diff-тест «незмінене в SVG-стрічці приглушене» впав — перевір, що `<g${dim}>` у `svgStrip` не зачепив.

- [ ] **Step 10: Commit** (пропусти, якщо першого коміту ще немає)

```bash
git add skills/code-anatomy/references/guide_template.html skills/code-anatomy/references/test_render_guide.mjs
git commit -m "feat(code-anatomy): add dark and light themes to the guide" -m "Dark Woodland/Willow Brook is the default and a header button switches to the light Screamin' Green/Salt Box palette; the choice is remembered in the browser." -- skills/code-anatomy/references/guide_template.html skills/code-anatomy/references/test_render_guide.mjs
```

---

### Task 2: Схема L1 — поля `files` і `entry`

**Files:**
- Modify: `skills/code-anatomy/references/guide_template.html` (`validateSide`)
- Modify: `skills/code-anatomy/SKILL.md:87-92` (Крок 1), `:227` (схема)
- Test: `skills/code-anatomy/references/test_render_guide.mjs`

**Interfaces:**
- Produces: у даних вузла L1 — `files?: integer > 0`, `entry?: boolean`; валідатор кидає `GuideError` з назвою вузла.

- [ ] **Step 1: Падаючі тести**

```js
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
```

- [ ] **Step 2: Run** `node --test skills/code-anatomy/references/test_render_guide.mjs` — Expected: 2 нові FAIL (невалідні значення проходять).

- [ ] **Step 3: Валідація.** У `validateSide` одразу після рядка `if (!Array.isArray(side.l1.edges)) …` додай:

```js
    side.l1.nodes.forEach((n, i) => {
      if (n.files !== undefined && !(Number.isInteger(n.files) && n.files > 0)) {
        throw new GuideError(`${p}l1.nodes[${i}] ${n.id}: files має бути цілим > 0, а не ${JSON.stringify(n.files)}`);
      }
      if (n.entry !== undefined && typeof n.entry !== "boolean") {
        throw new GuideError(`${p}l1.nodes[${i}] ${n.id}: entry має бути true або false, а не ${JSON.stringify(n.entry)}`);
      }
    });
```

- [ ] **Step 4: SKILL.md.** Рядок схеми (`:227`) заміни на:

```
    "nodes": [{"id": "src/api", "kind": "dir | file", "summary": "≤ 1 речення", "files": 12, "entry": false}],
```

Після `<constraint> тека з > 10 файлами → у її вузлі показати тільки експорти, не всі файли </constraint>` (`:92`) додай:

```
<constraint> files — скільки файлів коду у вузлі (вузол-файл → 1); рендерер робить вузол більшим пропорційно √files. Не знаєш точно — не пиши поле, не вигадуй </constraint>
<constraint> entry: true — лише на вузлі з точкою входу (lang_<x>.md §5); інших entry не позначай </constraint>
```

- [ ] **Step 5: Run обидва набори** — Expected: PASS.

- [ ] **Step 6: Commit** (пропусти, якщо першого коміту ще немає)

```bash
git commit -m "feat(code-anatomy): let L1 nodes carry file counts and an entry flag" -m "The graph sizes a module by how many files it holds and highlights the entry point, instead of guessing both from the summary text." -- skills/code-anatomy/references/guide_template.html skills/code-anatomy/references/test_render_guide.mjs skills/code-anatomy/SKILL.md
```

---

### Task 3: Дані графа L1 і панель вузла (чисті функції)

**Files:**
- Modify: `skills/code-anatomy/references/guide_template.html` (нова секція `// ---- L1 graph` перед `// ---- SVG L3`, експорт)
- Test: `skills/code-anatomy/references/test_render_guide.mjs`

**Interfaces:**
- Consumes: `esc`, `callout`, `COLORS` (Task 1), поля `files`/`entry` (Task 2).
- Produces:
  - `nodeFiles(n) -> integer` (`files` або 1)
  - `cyElements(l1) -> Array<{group: "nodes"|"edges", data: {...}, classes: string}>`; вузол: `data {id, label, h, w}`, класи з `entry | orphan | hub` через пробіл; ребро: `data {id: "e<i>", source, target}`, класи з `tohub | cycle`. Ребра на невідомі вузли відкидаються.
  - `l1PanelHtml(l1, id | null) -> string` — огляд (id = null) або вузол; посилання на сусідів — `<a data-node="<id>">`.

- [ ] **Step 1: Падаючі тести**

```js
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
test("панель екранує id і summary", () => {
  const out = CG.l1PanelHtml(l1Of([{ id: "<x>", summary: "<img src=x>" }], []), "<x>");
  assert.ok(!out.includes("<img"));
  assert.ok(out.includes("&lt;x&gt;"));
});
```

- [ ] **Step 2: Run** — Expected: FAIL `CG.cyElements is not a function`.

- [ ] **Step 3: Реалізація.** Перед рядком `// ---------------------------------------------------------------- SVG L3` встав:

```js
  // ---------------------------------------------------------------- L1 graph
  const HUB_MIN_IN = 5;                                                           // ≥ 5 вхідних ребер → хаб
  const nodeFiles = (n) => (Number.isInteger(n.files) && n.files > 0 ? n.files : 1);
  const shortLabel = (id) => {
    const t = String(id).replace(/\s*\(.*\)$/, "");
    return t.length > 22 ? "…" + t.slice(-21) : t;
  };
  const whereIds = (c) => String(c.where || "").split(" -> ");
  function knownEdges(l1) {
    const ids = new Set(l1.nodes.map((n) => n.id));
    return l1.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  }
  // Елементи для Cytoscape. Розмір, підпис і класи рахуються тут, щоб їх можна було перевірити без браузера.
  function cyElements(l1) {
    const edges = knownEdges(l1);
    const inDeg = new Map(l1.nodes.map((n) => [n.id, 0]));
    edges.forEach((e) => inDeg.set(e.to, inDeg.get(e.to) + 1));
    const callouts = l1.callouts || [];
    const orphans = new Set(callouts.filter((c) => c.kind === "orphan").map((c) => c.where));
    const cycles = callouts.filter((c) => c.kind === "cycle").map(whereIds);
    const maxFiles = Math.max(1, ...l1.nodes.map(nodeFiles));
    const nodes = l1.nodes.map((n) => {
      const files = nodeFiles(n), label = shortLabel(n.id);
      const h = Math.round(50 + 80 * Math.sqrt(files / maxFiles));
      const classes = [n.entry ? "entry" : "", orphans.has(n.id) ? "orphan" : "", inDeg.get(n.id) >= HUB_MIN_IN ? "hub" : ""].filter(Boolean).join(" ");
      return { group: "nodes", data: { id: n.id, label: files > 1 ? `${label}\n${files}` : label, h, w: Math.max(Math.round(h * 1.6), label.length * 10 + 28) }, classes };
    });
    const edgeEls = edges.map((e, i) => ({
      group: "edges", data: { id: `e${i}`, source: e.from, target: e.to },
      classes: [inDeg.get(e.to) >= HUB_MIN_IN ? "tohub" : "", cycles.some((w) => w.includes(e.from) && w.includes(e.to)) ? "cycle" : ""].filter(Boolean).join(" "),
    }));
    return nodes.concat(edgeEls);
  }
  // Права панель L1: огляд (id = null) або обраний вузол із сусідами.
  function l1PanelHtml(l1, id) {
    const callouts = l1.callouts || [];
    const n = id === null ? null : l1.nodes.find((x) => x.id === id);
    if (!n) {
      return `<h3>Огляд</h3><p class="sub">вузлів: ${l1.nodes.length} · залежностей: ${l1.edges.length}</p>` +
        `<p class="sub">Клікни вузол на графі: побачиш, від кого він залежить і хто залежить від нього.</p>` +
        callouts.map((c) => callout(c.kind, `${c.where || ""}: ${c.note || ""}`)).join("");
    }
    const edges = knownEdges(l1);
    const outs = edges.filter((e) => e.from === id).map((e) => e.to);
    const ins = edges.filter((e) => e.to === id).map((e) => e.from);
    const list = (ids, none) => (ids.length ? `<ul>${ids.map((x) => `<li><a data-node="${esc(x)}">${esc(x)}</a></li>`).join("")}</ul>` : `<p class="sub">${none}</p>`);
    const own = callouts.filter((c) => whereIds(c).includes(id)).map((c) => callout(c.kind, c.note || "")).join("");
    return `<h3>${esc(n.id)}</h3><p class="sub">${esc(n.kind || "")} · файлів: ${nodeFiles(n)}</p><p>${esc(n.summary || "")}</p>${own}` +
      `<p class="dep-out">Залежить від (${outs.length})</p>${list(outs, "ні від кого")}` +
      `<p class="dep-in">Від нього залежать (${ins.length})</p>${list(ins, "ніхто")}`;
  }
```

`callout` оголошено нижче (секція sections) як `const` — функції вище викликають її лише під час рендера, коли вона вже ініціалізована, тож порядок оголошень не заважає.

Додай `cyElements, l1PanelHtml` в об'єкт `return { … }`.

- [ ] **Step 4: Run обидва набори** — Expected: PASS.

- [ ] **Step 5: Commit** (пропусти, якщо першого коміту ще немає)

```bash
git commit -m "feat(code-anatomy): compute the L1 graph and its side panel" -m "Node size, labels, hub and cycle marks and the neighbour lists are plain functions, so the interactive graph stays testable without a browser." -- skills/code-anatomy/references/guide_template.html skills/code-anatomy/references/test_render_guide.mjs
```

---

### Task 4: Інтерактивний L1 у сторінці

**Files:**
- Modify: `skills/code-anatomy/references/guide_template.html` (`<style>` — L1-блок, `l1Html`, нові `l1Legend`, `cyStyle`, `ELK_LAYOUT`, `mountL1`, виклик у `paint`, CDN-скрипти)
- Test: `skills/code-anatomy/references/test_render_guide.mjs`

**Interfaces:**
- Consumes: `cyElements`, `l1PanelHtml` (Task 3), `COLORS`/`PALETTES`, `paint` (Task 1).
- Produces: розмітка з id `cy-l1`, `l1-panel`, `l1-q`, `l1-fadehub`, `l1-fit` (одна на сторінку); `mountL1(data, theme)`.

- [ ] **Step 1: Тести.** Видали тест «один Mermaid-блок на L1 і по одному на файл» і додай:

```js
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
```

- [ ] **Step 2: Run** — Expected: FAIL (немає `cy-l1`, на L1 ще Mermaid).

- [ ] **Step 3: CSS.** У кінець `<style>` додай:

```css
  .l1 { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; }
  @media (max-width: 900px) { .l1 { grid-template-columns: 1fr; } }
  .toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
  .toolbar input[type=search] { flex: 1; min-width: 160px; padding: 7px 10px; border: 1px solid var(--line); border-radius: 8px;
    font: inherit; background: var(--sunk); color: var(--ink); }
  .toolbar label { color: var(--muted); font-size: .9em; display: inline-flex; gap: 6px; align-items: center; }
  #cy-l1 { height: 560px; border: 1px solid var(--line); border-radius: 10px;
    background: radial-gradient(circle, var(--grid) 1px, transparent 1px) 0 0 / 18px 18px, var(--sunk); }
  .panel { border: 1px solid var(--line); border-radius: 10px; padding: 14px; background: var(--sunk); align-self: start; }
  .panel h3 { margin: 0 0 6px; font: 600 16px/1.3 var(--font-mono); word-break: break-word; }
  .panel a { cursor: pointer; }
  .panel ul { margin: 4px 0 10px; padding-left: 18px; }
  .dep-out { color: var(--accent); font-weight: 600; margin: 10px 0 2px; }
  .dep-in { color: var(--pink); font-weight: 600; margin: 10px 0 2px; }
  .l1-legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: .85em; color: var(--muted); margin-top: 8px; }
  .l1-legend span { display: inline-flex; gap: 6px; align-items: center; }
  .l1-legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  .l1-legend .k-entry { background: var(--accent); }
  .l1-legend .k-node { background: var(--structure); }
  .l1-legend .k-orphan { border: 2px dashed var(--warn); }
  .l1-legend .k-hub { background: var(--hub); border: 1px solid var(--edge); }
```

- [ ] **Step 4: Розмітка L1.** Заміни `l1Html(data)`:

```js
  function l1Legend() {
    return `<div class="l1-legend"><span><i class="k-entry"></i> точка входу</span><span><i class="k-node"></i> модуль / файл</span>` +
      `<span><i class="k-orphan"></i> сирота: ніхто не імпортує</span><span><i class="k-hub"></i> хаб: ≥ ${HUB_MIN_IN} вхідних ребер</span></div>`;
  }
  function l1Html(data) {
    const l1 = data.l1;
    const tree = l1.nodes.map((n) => `<li><code>${esc(n.id)}</code> — ${esc(n.summary || "")}</li>`).join("");
    return `<section id="l1"><h2>L1 — Проєкт</h2>` +
      `<p class="sub">Клік на вузол підсвічує його залежності. Розмір вузла — кількість файлів. Колесо — зум, тягни фон — панорама.</p>` +
      `<div class="l1"><div><div class="toolbar">` +
      `<input type="search" id="l1-q" placeholder="Знайти модуль…" aria-label="Знайти модуль">` +
      `<label><input type="checkbox" id="l1-fadehub" checked> приглушити ребра до хабів</label>` +
      `<button type="button" class="btn" id="l1-fit">Вписати</button></div>` +
      `<div id="cy-l1" role="img" aria-label="Граф залежностей між модулями"></div>${l1Legend()}</div>` +
      `<aside class="panel" id="l1-panel">${l1PanelHtml(l1, null)}</aside></div>` +
      `<details><summary>Список модулів (${l1.nodes.length})</summary><ul>${tree}</ul></details></section>`;
  }
```

- [ ] **Step 5: Монтування.** Після `l1PanelHtml` (секція L1 graph) додай:

```js
  function cyStyle(p) {
    return [
      { selector: "node", style: { shape: "round-rectangle", width: "data(w)", height: "data(h)", "background-color": p.structure,
        label: "data(label)", color: p.onType, "text-valign": "center", "text-halign": "center", "text-wrap": "wrap",
        "font-size": 17, "font-weight": 600, "font-family": "IBM Plex Sans, Segoe UI, system-ui, sans-serif" } },
      { selector: "node.hub", style: { "background-color": p.hub, color: p.ink, "border-width": 1, "border-color": p.edge } },
      { selector: "node.entry", style: { "background-color": p.accent, color: p.onType } },
      { selector: "node.orphan", style: { "background-color": p.sunk, color: p.warn, "border-width": 2, "border-style": "dashed", "border-color": p.warn } },
      { selector: "node.entry.orphan", style: { "background-color": p.accent, color: p.onType } },
      { selector: "edge", style: { width: 1.6, "line-color": p.edge, "target-arrow-color": p.edge, "target-arrow-shape": "triangle",
        "curve-style": "bezier", "arrow-scale": 0.9 } },
      { selector: "edge.tohub.fadehub", style: { opacity: 0.12 } },
      { selector: "edge.cycle", style: { "line-color": p.warn, "target-arrow-color": p.warn, width: 2.5 } },
      { selector: ".faded", style: { opacity: 0.1 } },
      { selector: "node.hit", style: { "border-width": 4, "border-color": p.syntax_sugar, "border-style": "solid" } },
      { selector: "node.sel", style: { "border-width": 4, "border-color": p.glow, "border-style": "solid" } },
      { selector: "edge.out", style: { "line-color": p.accent, "target-arrow-color": p.accent, width: 2.6, opacity: 1 } },
      { selector: "edge.in", style: { "line-color": p.pink, "target-arrow-color": p.pink, width: 2.6, opacity: 1 } },
    ];
  }
  const ELK_LAYOUT = { name: "elk", fit: true, padding: 24, elk: { algorithm: "layered", "elk.direction": "RIGHT",
    "elk.layered.spacing.nodeNodeBetweenLayers": 90, "elk.spacing.nodeNode": 22,
    "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF", "elk.edgeRouting": "SPLINES" } };
  // Браузер: оживляє #cy-l1. Без Cytoscape (офлайн) лишає пояснення — панель-огляд і список модулів уже в розмітці.
  function mountL1(data, theme) {
    const box = document.getElementById("cy-l1");
    if (!box) return;
    if (!window.cytoscape) {
      box.innerHTML = `<p class="sub" style="padding:12px">Граф не завантажився: потрібен інтернет (Cytoscape з CDN). Модулі — у списку нижче.</p>`;
      return;
    }
    const l1 = data.l1, panel = document.getElementById("l1-panel");
    const cy = window.cytoscape({ container: box, elements: cyElements(l1), style: cyStyle(PALETTES[theme]), layout: ELK_LAYOUT, minZoom: 0.2, maxZoom: 3 });
    const select = (id) => {
      cy.elements().removeClass("faded out in sel");
      panel.innerHTML = l1PanelHtml(l1, id);
      panel.querySelectorAll("a[data-node]").forEach((a) => { a.onclick = () => select(a.dataset.node); });
      if (id === null) return;
      const node = cy.getElementById(id), outs = node.outgoers("edge"), ins = node.incomers("edge");
      cy.elements().addClass("faded");
      node.removeClass("faded").addClass("sel");
      outs.removeClass("faded").addClass("out"); outs.targets().removeClass("faded");
      ins.removeClass("faded").addClass("in"); ins.sources().removeClass("faded");
    };
    const fade = document.getElementById("l1-fadehub");
    const applyFade = () => cy.edges(".tohub").toggleClass("fadehub", fade.checked);
    fade.onchange = applyFade;
    applyFade();
    document.getElementById("l1-fit").onclick = () => cy.animate({ fit: { padding: 24 }, duration: 300 });
    document.getElementById("l1-q").oninput = (e) => {
      const q = e.target.value.trim().toLowerCase();
      cy.nodes().removeClass("hit");
      if (q) cy.nodes().filter((n) => n.id().toLowerCase().includes(q)).addClass("hit");
    };
    cy.on("tap", "node", (ev) => select(ev.target.id()));
    cy.on("tap", (ev) => { if (ev.target === cy) select(null); });
    select(null);
  }
```

У `paint` після `runMermaid(theme, first ? 1500 : 0);` додай рядок:

```js
    mountL1(data, theme);
```

- [ ] **Step 6: CDN.** Заміни рядок `<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.15.0/mermaid.min.js"></script>` на:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.15.0/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/elkjs@0.9.3/lib/elk.bundled.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.2/cytoscape.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cytoscape-elk@2.2.0/dist/cytoscape-elk.js"></script>
```

(Рендерер-скрипт стоїть вище за них, але `boot` чекає `DOMContentLoaded`, тож синхронні CDN-скрипти вже завантажені, коли `mountL1` біжить.)

- [ ] **Step 7: Run обидва набори** — Expected: PASS. Тести «цикл імпортів…» і «сирота…» проходять і далі: callout-и тепер у панелі-огляді, `mermaidL1` лишився для diff.

- [ ] **Step 8: Commit** (пропусти, якщо першого коміту ще немає)

```bash
git commit -m "feat(code-anatomy): draw L1 as an interactive Cytoscape graph" -m "Modules are laid out with ELK, sized by file count and clickable to reveal what they depend on and what depends on them; without internet the page falls back to the module list." -- skills/code-anatomy/references/guide_template.html skills/code-anatomy/references/test_render_guide.mjs
```

---

### Task 5: Кроки програвача L3 (чисті функції)

**Files:**
- Modify: `skills/code-anatomy/references/guide_template.html` (нова секція `// ---- L3 player` після `svgStrip`, `svgStrip` використовує спільний `byOrder`, експорт)
- Test: `skills/code-anatomy/references/test_render_guide.mjs`

**Interfaces:**
- Consumes: `COLORS`, `esc`, `orderKey`.
- Produces: `byOrder(a, b)`, `typeColor(el) -> hex`, `playerSteps(f) -> element[]` (без `order: null`, відсортовані: модуль 1..N, потім f1..fN), `markToken(line, name) -> string | null`, `playerCode(f, i) -> string` (рядки `<div class="row[ cur| dim]">`), `playerCard(f, i) -> string`.

- [ ] **Step 1: Падаючі тести**

```js
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
test("картка екранує ім'я і пояснення", () => {
  const f = F(); f.elements[0].name = "<b>"; f.elements[0].explanation = "<script>x</script>";
  const out = CG.playerCard(f, 0);
  assert.ok(!out.includes("<script>x"));
  assert.ok(out.includes("&lt;b&gt;"));
});
```

- [ ] **Step 2: Run** — Expected: FAIL `CG.playerSteps is not a function`.

- [ ] **Step 3: Реалізація.** Одразу після рядка `const orderKey = …` додай:

```js
  const byOrder = (a, b) => { const [x, y] = [orderKey(a.order), orderKey(b.order)]; return x[0] - y[0] || x[1] - y[1]; };
```

У `svgStrip` заміни `.sort((a, b) => { const [x, y] = [orderKey(a.order), orderKey(b.order)]; return x[0] - y[0] || x[1] - y[1]; });` на `.sort(byOrder);`.

Після функції `svgStrip` встав:

```js
  // ---------------------------------------------------------------- L3 player
  const TYPE_UA = { data: "дані", operation: "операція", syntax_sugar: "цукор", structure: "каркас" };
  const typeColor = (el) => (el.type === "data" && el.kind === "const" ? COLORS.const : COLORS[el.type]);
  const playerSteps = (f) => f.elements.filter((el) => el.order !== null && el.order !== undefined).sort(byOrder);
  // Обгортає в <mark> перше входження назви елемента в рядку; ".map(...)" шукається як ".map(". Не знайшов — null.
  function markToken(line, name) {
    const cands = [name, name.replace(/\(\.\.\.\)$/, "("), name.replace(/\(.*$/, ""), name.split(/\s+/)[0]].filter((c) => c && c.length > 1);
    for (const c of cands) {
      const i = line.indexOf(c);
      if (i >= 0) return esc(line.slice(0, i)) + "<mark>" + esc(line.slice(i, i + c.length)) + "</mark>" + esc(line.slice(i + c.length));
    }
    return null;
  }
  // Код фрагмента на кроці i: поточний рядок і токен підсвічені, на полях — бейджі пройдених кроків, майбутні рядки бліді.
  function playerCode(f, i) {
    const steps = playerSteps(f), s = steps[i], fr = f.l3_fragment;
    const lo = parseInt(String(fr.lines).split("-")[0], 10);
    const done = new Map();
    steps.slice(0, i + 1).forEach((st) => { if (Number.isInteger(st.line)) done.set(st.line, (done.get(st.line) || []).concat(st)); });
    return fr.full_code.split("\n").map((text, k) => {
      const ln = lo + k, cur = s.line === ln;
      const badges = (done.get(ln) || []).map((st) => `<span class="b${st === s ? " now" : ""}" style="background:${typeColor(st)}">${esc(st.order)}</span>`).join("");
      const body = cur ? (markToken(text, String(s.name)) ?? `<mark>${esc(text)}</mark>`) : esc(text);
      const cls = cur ? "row cur" : done.has(ln) ? "row" : "row dim";
      return `<div class="${cls}"${cur ? ` style="--c:${typeColor(s)}"` : ""}><span class="ln">${ln}</span><span class="badges">${badges}</span>${body}</div>`;
    }).join("");
  }
  function playerCard(f, i) {
    const steps = playerSteps(f), s = steps[i], col = typeColor(s);
    const phase = Number.isInteger(s.order) ? "Завантаження модуля" : "Виклик функції";
    return `<p class="pl-phase">${phase} · ${i + 1} / ${steps.length}</p>` +
      `<div class="pl-head"><div class="pl-order" style="background:${col}">${esc(s.order)}</div><div>` +
      `<div class="pl-name">${esc(s.name)}</div>` +
      `<span class="pl-pill" style="background:${col}">${TYPE_UA[s.type]}${s.kind ? " · " + esc(s.kind) : ""}</span> ` +
      `<span class="pl-phase">рядок ${esc(s.line ?? "—")}</span></div></div>` +
      `<p class="pl-expl">${esc(s.explanation)}</p>` +
      (s.reading ? `<div class="pl-box"><b>Як читає мова</b>${esc(s.reading)}</div>` : "") +
      (s.equivalent ? `<div class="pl-box"><b>Без цукру</b><code>${esc(s.equivalent)}</code></div>` : "") +
      (s.side_effect ? `<div class="pl-box pl-warn"><b>⚠️ Побічний ефект</b>${esc(s.side_effect)}</div>` : "");
  }
```

Додай `playerSteps, markToken, playerCode, playerCard` в об'єкт `return { … }`.

- [ ] **Step 4: Run обидва набори** — Expected: PASS.

- [ ] **Step 5: Commit** (пропусти, якщо першого коміту ще немає)

```bash
git commit -m "feat(code-anatomy): compute each step of the L3 execution player" -m "For any step the renderer knows which line and token run, which steps already ran and what the step means, so the player can be tested without a browser." -- skills/code-anatomy/references/guide_template.html skills/code-anatomy/references/test_render_guide.mjs
```

---

### Task 6: Програвач L3 у сторінці

**Files:**
- Modify: `skills/code-anatomy/references/guide_template.html` (`<style>` — player-блок, нові `playerHtml`, `mountPlayers`, `stopPlayers`, змінений `l3Html`, виклики в `paint`, експорт)
- Test: `skills/code-anatomy/references/test_render_guide.mjs`

**Interfaces:**
- Consumes: `playerSteps`, `playerCode`, `playerCard`, `typeColor` (Task 5), `codeBlock` (є).
- Produces: `playerHtml(f, fileIdx) -> string` (корінь `<div class="player" data-file="<індекс у data.files>" tabindex="0">`), `mountPlayers(data)`, `stopPlayers()`.

- [ ] **Step 1: Тести.** Видали тести «по одній SVG-стрічці на фрагмент, з обома просторами нумерації», «цукор малюється трикутником і шестикутником», «рядки коду пронумеровані й підсвічені за типом» і додай:

```js
// --- програвач L3 у сторінці --------------------------------------------------------
test("по одному програвачу на фрагмент, з доріжками модуль/виклик", () => {
  const html = CG.render(exampleData());
  const frags = exampleData().files.filter((f) => f.l3_fragment).length;
  assert.equal(html.split('<div class="player"').length - 1, frags);
  assert.ok(html.includes(">1 · Item<"));
  assert.ok(html.includes(">f3 · reduce<"));
  assert.ok(html.includes('max="10"'));
});
test("програвач одразу показує крок 1 — сторінка має сенс і без кліків", () => {
  const html = CG.render(exampleData());
  assert.ok(html.includes("Завантаження модуля · 1 / 11"));
  assert.ok(html.includes('<span class="ln">1</span>'));
});
test("фрагмент без кроків показує статичний код замість програвача", () => {
  const d = exampleData(); d.files[0].elements.forEach((el) => { el.order = null; });
  const html = CG.render(d);
  assert.ok(!html.includes('<div class="player"'));
  assert.ok(html.includes("немає кроків виконання"));
});
test("каркас без order названий під програвачем", () => {
  assert.ok(CG.render(exampleData()).includes("Поза порядком"));
});
test("статичний блок коду (diff, фрагмент без кроків) пронумерований і підсвічений за типом", () => {
  const out = CG.codeBlock(exampleData().files[0]);
  assert.ok(out.includes('<span class="ln">1</span>'));
  assert.ok(out.includes('class="line-structure"'));
  assert.ok(out.includes('class="line-operation"'));
});
test("SVG-стрічка (diff) має обидва простори нумерації і фігури цукру", () => {
  const svg = CG.svgStrip(exampleData().files[0]);
  assert.equal(svg.split("<svg").length - 1, 1);
  assert.ok(svg.includes(">1<"));
  assert.ok(svg.includes(">f3<"));
  assert.match(svg, /<polygon class="sugar-tri" points="[^"]+"/);
  assert.match(svg, /<polygon class="sugar-hex" points="[^"]+"/);
});
```

- [ ] **Step 2: Run** — Expected: FAIL (немає `.player`, у L3 ще SVG-стрічка).

- [ ] **Step 3: CSS.** У кінець `<style>` додай:

```css
  .player { outline: none; }
  .pl-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  @media (max-width: 900px) { .pl-grid { grid-template-columns: 1fr; } }
  .pl-code { font-family: var(--font-mono); font-variant-ligatures: none; font-feature-settings: "liga" 0, "calt" 0;
    font-size: 13px; background: var(--code-bg); color: var(--code-ink); border: 1px solid var(--line); border-radius: 10px; padding: 12px 0; overflow-x: auto; }
  .pl-code .row { display: flex; align-items: center; white-space: pre; padding: 1px 12px 1px 0; border-left: 3px solid transparent;
    transition: background .25s, opacity .25s; }
  .pl-code .row.dim { opacity: .38; }
  .pl-code .row.cur { background: color-mix(in srgb, var(--c) 12%, transparent); border-left-color: var(--c); }
  .pl-code .ln { width: 3.2em; text-align: right; padding-right: 12px; color: var(--code-ln); user-select: none; flex: none; }
  .pl-code .badges { width: 5.6em; flex: none; display: flex; gap: 3px; justify-content: flex-end; padding-right: 8px; }
  .pl-code .b { font: 600 10px/16px var(--font-body); min-width: 20px; padding: 0 4px; border-radius: 8px; text-align: center; color: var(--on-type); }
  .pl-code .b.now { box-shadow: 0 0 0 2px var(--code-ink); }
  .pl-code mark { color: var(--code-ink); border-radius: 3px; padding: 0 2px; box-shadow: inset 0 -2px 0 var(--c);
    background: color-mix(in srgb, var(--c) 35%, transparent); }
  .pl-card { border: 1px solid var(--line); border-radius: 12px; padding: 16px; background: var(--sunk); min-height: 240px; }
  .pl-phase { font-size: .78em; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 600; margin: 0; }
  .pl-head { display: flex; gap: 12px; align-items: center; margin: 8px 0 10px; }
  .pl-order { font: 700 1.25rem/1 var(--font-display); color: var(--on-type); min-width: 54px; height: 54px; border-radius: 14px;
    display: grid; place-items: center; flex: none; }
  .pl-name { font-family: var(--font-mono); font-variant-ligatures: none; word-break: break-word; }
  .pl-pill { display: inline-block; font-size: .75em; font-weight: 600; padding: 1px 8px; border-radius: 999px; color: var(--on-type); margin-top: 4px; }
  .pl-expl { margin: 6px 0 10px; }
  .pl-box { background: var(--surface); border-radius: 8px; padding: 8px 10px; margin: 8px 0; font-size: .93em; }
  .pl-box b { display: block; font-size: .78em; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin-bottom: 2px; }
  .pl-warn { background: var(--warn-soft); border-left: 3px solid var(--warn); }
  .pl-controls { display: flex; gap: 8px; align-items: center; margin: 14px 0 8px; flex-wrap: wrap; }
  .pl-controls input[type=range] { flex: 1; min-width: 140px; accent-color: var(--glow); }
  .pl-count { color: var(--muted); font-variant-numeric: tabular-nums; min-width: 60px; text-align: right; }
  .pl-lanes { display: grid; gap: 6px; }
  .pl-lane { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .pl-lname { width: 70px; font-size: .8em; color: var(--muted); font-weight: 600; flex: none; }
  .pl-chip { border: 0; border-radius: 8px; padding: 4px 9px; font: inherit; font-size: .82em; font-weight: 600; color: var(--on-type);
    cursor: pointer; opacity: .35; transition: opacity .2s, transform .2s; }
  .pl-chip.done { opacity: .75; }
  .pl-chip.on { opacity: 1; transform: translateY(-2px); }
  .pl-arrow { color: var(--muted); font-size: .8em; }
```

- [ ] **Step 4: Розмітка програвача.** Після `playerCard` (секція L3 player) додай:

```js
  function playerHtml(f, fileIdx) {
    const steps = playerSteps(f);
    if (!steps.length) return codeBlock(f) + `<p class="sub">У фрагменті немає кроків виконання — лише каркас.</p>`;
    const lanes = [["модуль", steps.filter((s) => Number.isInteger(s.order))], ["виклик", steps.filter((s) => typeof s.order === "string")]]
      .filter((l) => l[1].length)
      .map(([name, ss]) => `<div class="pl-lane"><span class="pl-lname">${name}</span>` + ss.map((s, k) =>
        (k ? `<span class="pl-arrow">→</span>` : "") +
        `<button type="button" class="pl-chip" data-step="${steps.indexOf(s)}" style="background:${typeColor(s)}" title="${esc(s.name)}">${esc(s.order)} · ${esc(String(s.name).slice(0, 18))}</button>`).join("") + `</div>`)
      .join("");
    const un = f.elements.filter((el) => el.order === null || el.order === undefined);
    return `<div class="player" data-file="${fileIdx}" tabindex="0" aria-label="Програвач порядку виконання: ${esc(f.path)}">` +
      `<div class="pl-grid"><div class="pl-code">${playerCode(f, 0)}</div><div class="pl-card" aria-live="polite">${playerCard(f, 0)}</div></div>` +
      `<div class="pl-controls"><button type="button" class="btn" data-act="prev" aria-label="Попередній крок">◀</button>` +
      `<button type="button" class="btn" data-act="play">▶ Програти</button>` +
      `<button type="button" class="btn" data-act="next" aria-label="Наступний крок">▶</button>` +
      `<input type="range" data-act="seek" min="0" max="${steps.length - 1}" value="0" aria-label="Крок">` +
      `<span class="pl-count">1 / ${steps.length}</span></div>` +
      `<div class="pl-lanes">${lanes}</div>` +
      (un.length ? `<p class="sub">Поза порядком (каркас, на виконання не впливає): ${un.map((el) => `<code>${esc(el.name)}</code>`).join(", ")}</p>` : "") +
      `</div>`;
  }
  // Браузер: оживляє кожен .player. Таймери живуть у PLAYER_TIMERS, щоб перерендер теми їх зупиняв.
  const PLAYER_TIMERS = new Set();
  function stopPlayers() { PLAYER_TIMERS.forEach(clearInterval); PLAYER_TIMERS.clear(); }
  function mountPlayers(data) {
    document.querySelectorAll(".player[data-file]").forEach((root) => {
      const f = data.files[+root.dataset.file], steps = playerSteps(f);
      const q = (sel) => root.querySelector(sel);
      let cur = 0, timer = null;
      const stop = () => { clearInterval(timer); PLAYER_TIMERS.delete(timer); timer = null; q('[data-act="play"]').textContent = "▶ Програти"; };
      const go = (i) => {
        cur = Math.max(0, Math.min(i, steps.length - 1));
        q(".pl-code").innerHTML = playerCode(f, cur);
        q(".pl-card").innerHTML = playerCard(f, cur);
        q('[data-act="seek"]').value = cur;
        q(".pl-count").textContent = `${cur + 1} / ${steps.length}`;
        root.querySelectorAll(".pl-chip").forEach((c) => { const k = +c.dataset.step; c.classList.toggle("on", k === cur); c.classList.toggle("done", k < cur); });
      };
      const play = () => {
        if (timer) return stop();
        if (cur >= steps.length - 1) go(0);
        q('[data-act="play"]').textContent = "⏸ Пауза";
        timer = setInterval(() => (cur >= steps.length - 1 ? stop() : go(cur + 1)), 1800);
        PLAYER_TIMERS.add(timer);
      };
      root.addEventListener("click", (e) => {
        const b = e.target.closest(".pl-chip, [data-act]");
        if (!b || b.dataset.act === "seek") return;
        if (b.classList.contains("pl-chip")) { stop(); go(+b.dataset.step); }
        else if (b.dataset.act === "prev") { stop(); go(cur - 1); }
        else if (b.dataset.act === "next") { stop(); go(cur + 1); }
        else if (b.dataset.act === "play") play();
      });
      q('[data-act="seek"]').addEventListener("input", (e) => { stop(); go(+e.target.value); });
      root.addEventListener("keydown", (e) => {
        if (e.target.matches('input[type="range"]')) return;                       // слайдер сам обробляє стрілки
        if (e.key === "ArrowRight") { stop(); go(cur + 1); e.preventDefault(); }
        else if (e.key === "ArrowLeft") { stop(); go(cur - 1); e.preventDefault(); }
        else if (e.key === " " && !e.target.closest("button")) { play(); e.preventDefault(); }   // Пробіл на кнопці — її власний клік
      });
      go(0);
    });
  }
```

- [ ] **Step 5: L3-секція.** Заміни `l3Html(data)`:

```js
  function l3Html(data) {
    const frags = data.files.map((f, i) => [f, i]).filter(([f]) => f.l3_fragment);
    const body = frags.length ? frags.map(([f, i], n) => {
      const frag = f.l3_fragment;
      const eq = f.elements.filter((el) => el.equivalent).map((el) => `<li><code>${esc(el.name)}</code> → <code>${esc(el.equivalent)}</code></li>`).join("");
      const rd = f.elements.filter((el) => el.reading).map((el) => `<li><code>${esc(el.name)}</code>: ${esc(el.reading)}</li>`).join("");
      return `<details open><summary>Фрагмент №${n + 1} · <code>${esc(f.path)}</code> · рядки ${esc(frag.lines)} · обрано: ${esc(frag.why_chosen)}</summary>` +
        playerHtml(f, i) +
        `<div class="why"><strong>Чому такий порядок:</strong> ${esc(frag.order_explanation)}</div>` +
        (rd ? `<p><strong>Як читає мова:</strong></p><ul>${rd}</ul>` : "") +
        (eq ? `<p><strong>Еквівалент без цукру:</strong></p><ul>${eq}</ul>` : "") + `</details>`;
    }).join("") : (data.depth === 1 ? `<p class="sub">L3 не будувався (depth 1).</p>`
      : `<p class="sub">L3: жоден файл не підійшов під фрагмент (≥ 5 рядків або entry).</p>`);
    return `<section id="l3"><h2>L3 — Як читає мова</h2>` +
      (frags.length ? `<p class="sub">Клікни програвач і гортай кроки: <kbd>←</kbd> <kbd>→</kbd>, <kbd>Пробіл</kbd> — програти.</p>` : "") +
      `${body}</section>`;
  }
```

- [ ] **Step 6: `paint`.** Першим рядком тіла `paint` (до `app.innerHTML = …`) додай `stopPlayers();`, а після `mountL1(data, theme);` — `mountPlayers(data);`. Додай `playerHtml` в об'єкт `return { … }`.

- [ ] **Step 7: Run обидва набори** — Expected: PASS. Тест «еквіваленти цукру виведені» проходить через список під програвачем.

- [ ] **Step 8: Commit** (пропусти, якщо першого коміту ще немає)

```bash
git commit -m "feat(code-anatomy): replace the L3 strip with a step-by-step player" -m "The learner steps through a fragment in the order the engine runs it, with the current token highlighted in the code and the step explained beside it; arrow keys and space drive the focused player." -- skills/code-anatomy/references/guide_template.html skills/code-anatomy/references/test_render_guide.mjs
```

---

### Task 7: Документація і візуальна перевірка

**Files:**
- Modify: `skills/code-anatomy/SKILL.md:258-260`, `:297`, `:299`
- Modify: `skills/code-anatomy/references/worked_example.md:90-96`
- Modify: `README.md` (легенда «Чотири типи блоків», приклад `checkout.ts`)

**Interfaces:**
- Consumes: усе з Tasks 1–6.

- [ ] **Step 1: SKILL.md — кольори.** Абзац із рядків 258–260 («Форми й кольори з даних **не виводяться** — …червона рамка.») заміни на:

```
Форми й кольори з даних **не виводяться** — їх знає рендерер (`PALETTES`, `*_KINDS` у
`<script id="renderer">` шаблону). Дві теми: темна (основна, Woodland + Willow Brook) і світла
(Screamin' Green + Salt Box), перемикач у шапці гайда. В обох data — блакитний (const темніший),
operation — зелений, syntax_sugar — охра, structure — сірий пунктир, side effect / цикл — червона рамка.
```

- [ ] **Step 2: SKILL.md — boundaries.** Рядок `:297` заміни на:

```
- L1 — інтерактивний граф (Cytoscape.js + ELK): без інтернету лишаються панель-огляд і список модулів. L2 — Mermaid, без інтернету — текстом. L3 — покроковий програвач на чистому JS, працює офлайн
```

Рядок `:299` заміни на:

```
- HTML self-contained; зовнішні ресурси — лише mermaid і cytoscape (cdnjs), elkjs і cytoscape-elk (jsdelivr), шрифти з Google Fonts; нових не додавати
```

- [ ] **Step 3: worked_example.md.** Рядки 92–96 (абзац «HTML будує рендерер із JSON вище: …») заміни на:

```
HTML будує рендерер із JSON вище: L1 — інтерактивний граф `checkout.ts → types.ts` (клік на
вузол показує, від кого він залежить і хто від нього); L2 — таблиця 12 елементів і Mermaid із
стрілкою `calculateTotal → reduce`; L3 — програвач: код ліворуч, картка кроку праворуч, 11 кроків
у двох доріжках. ①②③ — модуль при завантаженні; f1…f8 — тіло при виклику `calculateTotal()`.
Головна пастка: функція існує **до** константи, а аргументи `reduce` обчислюються **до** самого
виклику (на кроці f3 бейджі f1 і f2 уже стоять на тому ж рядку). Mermaid у `.md` не пишеться —
форми знає лише рендерер.
```

- [ ] **Step 4: README.** У двох Mermaid-блоках (`## Чотири типи блоків` і приклад `checkout.ts`) заміни чотири рядки `classDef` на темну палітру:

```
    classDef data fill:#93C2DA,stroke:#6A9FBC,color:#1A1B11
    classDef op fill:#B3D57A,stroke:#8E9170,color:#1A1B11
    classDef sugar fill:#E6BF63,stroke:#8E9170,color:#1A1B11
    classDef struct fill:#8E9170,stroke:#44472A,color:#1A1B11
```

Речення «Кожен елемент коду належить рівно до одного типу. Кольори ті самі, що в HTML-гайді:» заміни на «Кожен елемент коду належить рівно до одного типу. Кольори ті самі, що в HTML-гайді (темна тема):». Після абзацу «Скіл пише `code/<репо>/code_guide_<sha8>.md` (джерело)…» додай:

```
У HTML граф L1 інтерактивний (зум, клік на модуль, пошук), а L3 — покроковий програвач
порядку виконання; тема темна, світла — кнопкою в шапці.
```

- [ ] **Step 5: Тести ще раз**

Run: `node --test skills/code-anatomy/references/test_render_guide.mjs; node --test skills/code-anatomy-diff/references/test_render_diff.mjs`
Expected: обидва PASS.

- [ ] **Step 6: Візуальна перевірка на реальних даних.** Збери три сторінки в `code/_check/` (тека в `.gitignore`):

```bash
node -e '
const fs = require("fs");
const tpl = fs.readFileSync("skills/code-anatomy/references/guide_template.html", "utf8");
const pick = (p) => JSON.parse(fs.readFileSync(p, "utf8").match(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/)[1]);
const build = (src, out) => fs.writeFileSync(out, tpl.replace("{{DATA}}", () => JSON.stringify(pick(src)).replace(/</g, "\\u003c")));
fs.mkdirSync("code/_check", { recursive: true });
build("skills/code-anatomy/references/worked_example.md", "code/_check/guide.html");
build("skills/code-anatomy-diff/references/worked_example_diff.md", "code/_check/diff.html");
if (fs.existsSync("code/emark/code_guide_1f474752_backend.md")) build("code/emark/code_guide_1f474752_backend.md", "code/_check/emark.html");
console.log(fs.readdirSync("code/_check"));'
```

Відкрий кожну в браузері й звір з прототипом (`docs/superpowers/prototypes/2026-09-21-guide-visuals/`). Чекліст:
- `guide.html`: темна тема за замовчуванням; кнопка перемикає на світлу й назад, після перезавантаження тема та сама; граф L1 з двома вузлами; клік на вузол — панель; програвач: ◀ ▶, Пробіл, слайдер, чипи; на f3 підсвічено `reduce`; код без лігатур (`=>` видно двома символами).
- `diff.html`: БУЛО/СТАЛО, Mermaid на L1/L2, SVG-стрічки на L3, кольори з палітри в обох темах, помилок немає.
- `emark.html` (якщо є локально): граф на 18 модулів читабельний; старі гайди без `files` показують вузли однакового розміру — це очікувано, розмір з'явиться після перегенерації.
- Консоль браузера: без помилок.
- Офлайн (DevTools → Network → Offline, перезавантаж `guide.html`): замість графа — повідомлення, список модулів і панель на місці, програвач працює.

- [ ] **Step 7: Commit** (пропусти, якщо першого коміту ще немає)

```bash
git commit -m "docs(code-anatomy): describe the interactive graph, the player and the themes" -m "The skill, the worked example and the README now match what the rendered guide shows." -- skills/code-anatomy/SKILL.md skills/code-anatomy/references/worked_example.md README.md
```
