# Worked example — коміт у `checkout.ts`

Повний прохід скіла на одному коміті. Це **фікстура**: `test_render_diff.mjs` читає JSON
звідси, тому блок нижче має лишатись валідним за схемою з `SKILL.md`.

## Вхід

`e5f6a7b8` — `refactor(checkout): arrow calculateTotal, format the sum`

Було (`a1b2c3d4`):

```ts
import { Item } from "./types";
export const TAX_RATE = 0.2;
export async function calculateTotal(items: Item[]) {
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  return subtotal * (1 + TAX_RATE);
}
```

Стало (`e5f6a7b8`), плюс новий файл `src/format.ts` з `formatSum`:

```ts
import { Item } from "./types";
import { formatSum } from "./format";
export const TAX_RATE = 0.2;
export const calculateTotal = async (items: Item[]) => {
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  return formatSum(subtotal * (1 + TAX_RATE));
};
```

## Дані (те, що пише скіл у `code_diff_<to8>.md`)

```json
{
  "mode": "diff",
  "project": "shop",
  "generated": "2026-09-21",
  "root_path": "/work/shop",
  "source_md": "code/shop/code_diff_e5f6a7b8.md",
  "languages": ["js_ts"],
  "depth": 2,
  "range": {"from": "a1b2c3d4", "to": "e5f6a7b8", "input": "e5f6a7b8", "subject": "refactor(checkout): arrow calculateTotal, format the sum"},
  "summary": "calculateTotal стала стрілкою в const — hoisting зник, вона існує лише з рядка 4. Сума форматується новим formatSum.",
  "l2_note": "L2 показано для 2 з 2 змінених файлів.",
  "before": {
    "l1": {
      "nodes": [
        {"id": "src/checkout.ts", "kind": "file", "summary": "Рахує суму замовлення з податком.", "change": "modified"},
        {"id": "src/types.ts", "kind": "file", "summary": "Типи доменних сутностей.", "change": null}
      ],
      "edges": [{"from": "src/checkout.ts", "to": "src/types.ts", "change": null}],
      "callouts": []
    },
    "files": [
      {
        "path": "src/checkout.ts",
        "language": "js_ts",
        "change": "modified",
        "elements": [
          {"type": "structure", "kind": "import", "name": "Item", "line": 1,
           "explanation": "Тип із сусіднього файлу; зникає після компіляції.",
           "language_specific": true, "order": 1, "equivalent": null, "reading": "ESM: зв'язується до виконання модуля", "side_effect": null, "change": null},
          {"type": "operation", "kind": "function", "name": "calculateTotal", "line": 3,
           "explanation": "Оголошення функції; піднімається, існує ще до рядка 2.",
           "language_specific": false, "order": 2, "equivalent": null, "reading": "hoisting: доступна в усьому модулі до виконання", "side_effect": null, "change": "removed",
           "calls": ["reduce"]},
          {"type": "data", "kind": "const", "name": "TAX_RATE", "line": 2,
           "explanation": "Константа 0.2, число; читається всередині функції.",
           "language_specific": false, "order": 3, "equivalent": null, "reading": null, "side_effect": null, "change": null},
          {"type": "syntax_sugar", "kind": "async", "name": "async", "line": 3,
           "explanation": "Загортає повернене значення в Promise — останній крок виклику.",
           "language_specific": true, "order": "f4", "equivalent": "return Promise.resolve(...)", "reading": null, "side_effect": null, "change": null},
          {"type": "operation", "kind": "method", "name": "reduce", "line": 4,
           "explanation": "Проходить масив, накопичує суму.",
           "language_specific": false, "order": "f1", "equivalent": null, "reading": null, "side_effect": null, "change": null},
          {"type": "data", "kind": "const", "name": "subtotal", "line": 4,
           "explanation": "Результат reduce; незмінна в межах виклику.",
           "language_specific": false, "order": "f2", "equivalent": null, "reading": null, "side_effect": null, "change": null},
          {"type": "operation", "kind": "return", "name": "return", "line": 5,
           "explanation": "Віддає число без форматування.",
           "language_specific": false, "order": "f3", "equivalent": null, "reading": null, "side_effect": null, "change": "modified"}
        ],
        "l3_fragment": {
          "lines": "1-6",
          "why_chosen": "trap",
          "full_code": "import { Item } from \"./types\";\nexport const TAX_RATE = 0.2;\nexport async function calculateTotal(items: Item[]) {\n  const subtotal = items.reduce((sum, i) => sum + i.price, 0);\n  return subtotal * (1 + TAX_RATE);\n}",
          "changed_lines": [3, 5, 6],
          "order_explanation": "Модуль: ① import, ② calculateTotal піднята (hoisting) — існує ще до ③ TAX_RATE. Виклик з будь-якого місця модуля працює. Див. lang_js_ts.md §2.1."
        }
      }
    ]
  },
  "after": {
    "l1": {
      "nodes": [
        {"id": "src/checkout.ts", "kind": "file", "summary": "Рахує суму з податком і форматує її.", "change": "modified"},
        {"id": "src/types.ts", "kind": "file", "summary": "Типи доменних сутностей.", "change": null},
        {"id": "src/format.ts", "kind": "file", "summary": "Форматує суму для показу.", "change": "added"}
      ],
      "edges": [
        {"from": "src/checkout.ts", "to": "src/types.ts", "change": null},
        {"from": "src/checkout.ts", "to": "src/format.ts", "change": "added"}
      ],
      "callouts": []
    },
    "files": [
      {
        "path": "src/checkout.ts",
        "language": "js_ts",
        "change": "modified",
        "elements": [
          {"type": "structure", "kind": "import", "name": "Item", "line": 1,
           "explanation": "Тип із сусіднього файлу; зникає після компіляції.",
           "language_specific": true, "order": 1, "equivalent": null, "reading": "ESM: зв'язується до виконання модуля", "side_effect": null, "change": null},
          {"type": "structure", "kind": "import", "name": "formatSum", "line": 2,
           "explanation": "Функція форматування з нового файлу format.ts.",
           "language_specific": true, "order": 2, "equivalent": null, "reading": "ESM: зв'язується до виконання модуля", "side_effect": null, "change": "added"},
          {"type": "data", "kind": "const", "name": "TAX_RATE", "line": 3,
           "explanation": "Константа 0.2, число; читається всередині функції.",
           "language_specific": false, "order": 3, "equivalent": null, "reading": null, "side_effect": null, "change": null},
          {"type": "data", "kind": "const", "name": "calculateTotal", "line": 4,
           "explanation": "Змінна зі стрілкою; до рядка 4 недоступна (TDZ).",
           "language_specific": false, "order": 4, "equivalent": null, "reading": "не піднімається: виклик до цього рядка — ReferenceError", "side_effect": null, "change": "added",
           "calls": ["reduce"]},
          {"type": "syntax_sugar", "kind": "async", "name": "async", "line": 4,
           "explanation": "Загортає повернене значення в Promise — останній крок виклику.",
           "language_specific": true, "order": "f4", "equivalent": "return Promise.resolve(...)", "reading": null, "side_effect": null, "change": null},
          {"type": "operation", "kind": "method", "name": "reduce", "line": 5,
           "explanation": "Проходить масив, накопичує суму.",
           "language_specific": false, "order": "f1", "equivalent": null, "reading": null, "side_effect": null, "change": null},
          {"type": "data", "kind": "const", "name": "subtotal", "line": 5,
           "explanation": "Результат reduce; незмінна в межах виклику.",
           "language_specific": false, "order": "f2", "equivalent": null, "reading": null, "side_effect": null, "change": null},
          {"type": "operation", "kind": "return", "name": "return", "line": 6,
           "explanation": "Віддає рядок через formatSum, не число.",
           "language_specific": false, "order": "f3", "equivalent": null, "reading": null, "side_effect": null, "change": "modified",
           "calls": ["formatSum"]}
        ],
        "l3_fragment": {
          "lines": "1-7",
          "why_chosen": "trap",
          "full_code": "import { Item } from \"./types\";\nimport { formatSum } from \"./format\";\nexport const TAX_RATE = 0.2;\nexport const calculateTotal = async (items: Item[]) => {\n  const subtotal = items.reduce((sum, i) => sum + i.price, 0);\n  return formatSum(subtotal * (1 + TAX_RATE));\n};",
          "changed_lines": [2, 4, 6, 7],
          "order_explanation": "Модуль: ① ② імпорти, ③ TAX_RATE, ④ calculateTotal — лише тепер; до рядка 4 вона в TDZ. Код, що викликав її вище, тепер падає. Див. lang_js_ts.md §2.1."
        }
      },
      {
        "path": "src/format.ts",
        "language": "js_ts",
        "change": "added",
        "elements": [
          {"type": "operation", "kind": "function", "name": "formatSum", "line": 1,
           "explanation": "Число → рядок з двома знаками після коми.",
           "language_specific": false, "order": 1, "equivalent": null, "reading": null, "side_effect": null, "change": "added"}
        ]
      }
    ]
  }
}
```
