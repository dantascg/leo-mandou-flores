// Pós-build: o Astro só gera hash dos scripts/estilos que ele processa.
// Os blocos is:inline (tema anti-pisca, loader, contagem regressiva) ficam de fora,
// então este script calcula o hash de cada <script> inline do HTML final
// em script-src e acrescenta à CSP que o adapter da Vercel gravou em .vercel/output/config.json.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT = ".vercel/output";
const configPath = join(OUT, "config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const JS_TYPES = new Set(["", "text/javascript", "module", "application/javascript"]);
const sha = (text) => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

function htmlFor(src) {
  const route = src.replace(/^\^/, "").replace(/\$$/, "");
  const file = route === "/" ? "index.html" : `${route.replace(/^\//, "")}.html`;
  const candidates = [join(OUT, "static", file), join(OUT, "static", route, "index.html")];
  return candidates.find((p) => existsSync(p));
}

function addSources(policy, directive, sources) {
  const parts = policy.split(";").map((p) => p.trim()).filter(Boolean);
  const i = parts.findIndex((p) => p.split(/\s+/)[0] === directive);
  if (i === -1) throw new Error(`CSP sem ${directive}`);
  const current = new Set(parts[i].split(/\s+/));
  for (const s of sources) current.add(s);
  parts[i] = [...current].join(" ");
  return parts.join("; ");
}

let touched = 0;
for (const route of config.routes ?? []) {
  const key = route.headers && Object.keys(route.headers).find((k) => k.toLowerCase() === "content-security-policy");
  if (!key) continue;
  const file = htmlFor(route.src);
  if (!file) throw new Error(`HTML não encontrado para a rota ${route.src}`);
  const html = readFileSync(file, "utf8");
  const scripts = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(m[1])) continue;
    const type = (m[1].match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? "").toLowerCase();
    if (!JS_TYPES.has(type)) continue; // JSON-LD e outros blocos de dados não executam
    scripts.push(sha(m[2]));
  }
  if (/\son[a-z]+\s*=/i.test(html.replace(/<script[\s\S]*?<\/script>/gi, ""))) {
    throw new Error(`${file} tem handler inline (on...=), bloqueado pela CSP`);
  }
  let policy = route.headers[key];
  policy = addSources(policy, "script-src", scripts);
  // style-src fica com 'unsafe-inline' e sem hashes: o html2canvas recria os estilos do
  // cartão em <style> novos num iframe, e hashes desativariam o 'unsafe-inline'.
  policy = policy.split(";").map((p) => p.trim()).filter(Boolean)
    .map((p) => (p.split(/\s+/)[0] === "style-src" ? "style-src 'self' 'unsafe-inline'" : p)).join("; ");
  if (/script-src[^;]*'unsafe-inline'/.test(policy)) throw new Error("script-src não pode ter 'unsafe-inline'");
  route.headers[key] = policy;
  touched++;
}
if (!touched) throw new Error("Nenhuma rota com CSP encontrada em config.json");
writeFileSync(configPath, JSON.stringify(config, null, "\t"));
console.log(`[csp] hashes inline aplicados em ${touched} rota(s).`);
