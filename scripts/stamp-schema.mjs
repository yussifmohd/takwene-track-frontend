// Prepends the source contract path to the generated API types (research R3).
import { readFileSync, writeFileSync } from "node:fs";

const target = "src/api/schema.d.ts";
const source = process.argv[2];
const body = readFileSync(target, "utf8").replace(/^\/\/ Source contract:.*\n/, "");
writeFileSync(target, `// Source contract: ${source}\n${body}`);
