import { readFileSync, writeFileSync } from "node:fs";
const [tpl, out, ...mds] = process.argv.slice(2);
const pick = (p) => JSON.parse(readFileSync(p, "utf8").match(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/)[1]);
const data = mds.map(pick);
const json = JSON.stringify(data).replace(/</g, "\u003c");
writeFileSync(out, readFileSync(tpl, "utf8").replace("/*DATA*/", () => json));
console.log("ok", data.map((d) => d.project), out);
