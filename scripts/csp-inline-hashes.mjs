// CSP única no vercel.json, valendo para todos os caminhos (inclusive 404 de caminho qualquer,
// que o header por rota do adapter não cobria). Roda depois do build: calcula o hash de cada
// <script> inline de todas as páginas geradas e confere se o script-src do vercel.json tem
// exatamente esses hashes.
//   node scripts/csp-inline-hashes.mjs          -> confere (falha o build se estiver desatualizado)
//   node scripts/csp-inline-hashes.mjs --write  -> atualiza os hashes no vercel.json
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const STATIC = ".vercel/output/static";
const VERCEL_JSON = "vercel.json";
const JS_TYPES = new Set(["", "text/javascript", "module", "application/javascript"]);
const write = process.argv.includes("--write");

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

const hashes = new Set();
for (const file of htmlFiles(STATIC)) {
  const html = readFileSync(file, "utf8");
  if (/\son[a-z]+\s*=/i.test(html.replace(/<script[\s\S]*?<\/script>/gi, ""))) {
    throw new Error(`${file} tem handler inline (on...=), bloqueado pela CSP`);
  }
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(m[1]) || !m[2]) continue;
    const type = (m[1].match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? "").toLowerCase();
    if (!JS_TYPES.has(type)) continue; // JSON-LD e outros blocos de dados não executam
    hashes.add(`'sha256-${createHash("sha256").update(m[2], "utf8").digest("base64")}'`);
  }
}

const config = JSON.parse(readFileSync(VERCEL_JSON, "utf8"));
const entries = config.headers.flatMap((h) =>
  h.headers.filter((x) => x.key.toLowerCase() === "content-security-policy").map((x) => ({ h, x })));
if (entries.length !== 1 || entries[0].h.source !== "/(.*)") {
  throw new Error('vercel.json precisa de exatamente uma Content-Security-Policy, em source "/(.*)"');
}
const csp = entries[0].x;
const parts = csp.value.split(";").map((p) => p.trim()).filter(Boolean);
const i = parts.findIndex((p) => p.split(/\s+/)[0] === "script-src");
if (i === -1) throw new Error("CSP sem script-src");
const base = parts[i].split(/\s+/).filter((t) => !t.startsWith("'sha256-"));
if (base.includes("'unsafe-inline'")) throw new Error("script-src não pode ter 'unsafe-inline'");
const expected = [...base, ...[...hashes].sort()].join(" ");

if (parts[i] === expected) {
  console.log(`[csp] vercel.json em dia (${hashes.size} hashes inline).`);
} else if (write) {
  parts[i] = expected;
  csp.value = parts.join("; ");
  writeFileSync(VERCEL_JSON, JSON.stringify(config, null, 2) + "\n");
  console.log(`[csp] vercel.json atualizado (${hashes.size} hashes inline).`);
} else {
  throw new Error("Hashes de script-src no vercel.json desatualizados. Rode: npm run csp:update");
}
