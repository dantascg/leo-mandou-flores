// ─────────────────────────────────────────────────────────────
// CONTADOR REAL DO BUQUÊ DIGITAL
// GET  → devolve o número atual de flores enviadas
// POST → soma +1 e devolve o novo número
//
// PRA ISSO FUNCIONAR EM PRODUÇÃO, você precisa:
// 1. No dashboard da Vercel, ir em Storage → Create Database →
//    escolher "Upstash Redis" (tem plano grátis)
// 2. Conectar esse banco ao projeto — a Vercel adiciona sozinha as
//    variáveis de ambiente KV_REST_API_URL e KV_REST_API_TOKEN
//    (ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN,
//    dependendo da versão da integração — os dois nomes são
//    verificados abaixo)
// 3. Fazer o deploy de novo (as env vars só existem depois de criar
//    o banco e conectar)
//
// Em localhost, sem essas variáveis configuradas, esta rota
// responde com um número fixo de exemplo — o site inteiro continua
// funcionando normal, só o contador não persiste de verdade ainda.
//
// PRÓXIMO PASSO ANTI-ABUSO: se o rate limit por IP não for
// suficiente, implementar um desafio invisível (ex.: Cloudflare
// Turnstile) antes de aceitar o POST.
// ─────────────────────────────────────────────────────────────
export const prerender = false;

import type { APIRoute } from "astro";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const KEY = "bouquet:count";

// ── Valor inicial do contador. O contador começa em zero e só sobe
//    com compartilhamentos reais (evento `flor-enviada`). ──
const BASELINE = 0;

// ── Limites de rate limit (fáceis de ajustar) ──
const RATE_PER_MINUTE = 5;    // máximo de envios por minuto por IP
const RATE_PER_DAY    = 20;   // máximo de envios por dia por IP

function getRedis(): Redis | null {
  const url = import.meta.env.KV_REST_API_URL ?? import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.KV_REST_API_TOKEN ?? import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getRatelimiters(redis: Redis) {
  const perMinute = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_PER_MINUTE, "1 m"),
    prefix: "rl:bouquet:min",
  });
  const perDay = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(RATE_PER_DAY, "1 d"),
    prefix: "rl:bouquet:day",
  });
  return { perMinute, perDay };
}

// ── Valida que a requisição vem do próprio site ──
function isAllowedOrigin(request: Request): boolean {
  // Em desenvolvimento (localhost), sempre aceita
  const origin = request.headers.get("origin") ?? "";
  const referer = request.headers.get("referer") ?? "";

  if (origin.includes("localhost") || referer.includes("localhost")) return true;
  if (origin.includes("127.0.0.1") || referer.includes("127.0.0.1")) return true;

  // Em produção: aceita se vier do mesmo domínio
  const url = new URL(request.url);
  const host = url.host;

  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // Sem Origin nem Referer — bloqueia (pode ser chamada direta de API)
  return false;
}

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export const GET: APIRoute = async () => {
  const redis = getRedis();

  if (!redis) {
    // Banco ainda não configurado (provavelmente rodando local) —
    // devolve um número de exemplo pra não quebrar a página.
    return json({ count: BASELINE, persisted: false });
  }

  let count = await redis.get<number>(KEY);
  if (count === null || count === undefined) {
    count = BASELINE;
    await redis.set(KEY, count);
  }
  return json({ count, persisted: true });
};

export const POST: APIRoute = async ({ request }) => {
  // ── Verificação de origem: recusa chamadas de outros domínios ──
  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const redis = getRedis();

  if (!redis) {
    return json({ count: BASELINE + 1, persisted: false });
  }

  // ── Rate limit por IP ──
  const ip = getClientIP(request);
  const { perMinute, perDay } = getRatelimiters(redis);

  const [minResult, dayResult] = await Promise.all([
    perMinute.limit(ip),
    perDay.limit(ip),
  ]);

  if (!minResult.success || !dayResult.success) {
    // Passou do limite: devolve o contador atual sem somar
    let count = await redis.get<number>(KEY) ?? BASELINE;
    return json({ count, persisted: true, limited: true });
  }

  // ── Tudo certo: soma +1 ──
  const count = await redis.incr(KEY);
  return json({ count, persisted: true });
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
