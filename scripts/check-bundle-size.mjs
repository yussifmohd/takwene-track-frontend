// Fails when the gzipped JS loaded by index.html exceeds the budget in kB (plan performance goal).
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const budgetKb = Number(process.argv[2] ?? 250);
const html = readFileSync("dist/index.html", "utf8");
const scripts = [...html.matchAll(/<script[^>]+src="\/([^"]+\.js)"/g)].map((m) => m[1]);
const preloads = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/([^"]+\.js)"/g)].map((m) => m[1]);
const files = [...new Set([...scripts, ...preloads])];

const totalKb = files.reduce((sum, file) => sum + gzipSync(readFileSync(`dist/${file}`)).length, 0) / 1024;
console.log(`Initial JS: ${totalKb.toFixed(1)} kB gzip across ${files.length} file(s); budget ${budgetKb} kB`);
if (totalKb > budgetKb) {
  console.error("Bundle size budget exceeded.");
  process.exit(1);
}
