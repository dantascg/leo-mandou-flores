// ─────────────────────────────────────────────────────────────
// CONTADOR REAL DO BUQUÊ DIGITAL
// GET  → devolve o número atual de flores enviadas
// POST → soma +1 e devolve o novo número
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

function clean(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return v.trim().replace(/^["']+|["']+$/g, "").trim() || undefined;   // remove espaços e aspas coladas por engano
}

function env(name: string): string | undefined {
  const fromAstro = (import.meta.env as Record<string, string | undefined>)[name];
  const fromProcess = typeof process !== "undefined" ? process.env[name] : undefined;
  return clean(fromAstro ?? fromProcess);
}

function getRedis(): Redis | null {
  const url = env("UPSTASH_REDIS_REST_URL") ?? env("KV_REST_API_URL");
  const token = env("UPSTASH_REDIS_REST_TOKEN") ?? env("KV_REST_API_TOKEN");
  if (!url || !token) return null;
  if (!url.startsWith("https://")) {
    console.error("[bouquet] A URL REST do Upstash deve começar com https:// (não use rediss:// nem redis://).");
    return null;
  }
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
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  let urlHost = "";
  try {
    urlHost = new URL(request.url).host;
  } catch {}
  const allowedHosts = new Set([urlHost, forwardedHost, hostHeader].filter(Boolean));

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (allowedHosts.has(originHost)) return true;
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (allowedHosts.has(refererHost)) return true;
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
  try {
    const redis = getRedis();

    if (!redis) {
      // Banco ainda não configurado (provavelmente rodando local) —
      // devolve baseline com persisted: false para não quebrar a página.
      return json(
        { count: BASELINE, persisted: false },
        { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } }
      );
    }

    let count = await redis.get<number>(KEY);
    if (count === null || count === undefined) {
      count = BASELINE;
      await redis.set(KEY, count);
    }
    return json(
      { count, persisted: true },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } }
    );
  } catch (e) {
    console.error("[bouquet] erro:", (e as Error)?.message || "desconhecido");
    return json({ count: 0, persisted: false, error: true });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
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
      let count = (await redis.get<number>(KEY)) ?? BASELINE;
      return json({ count, persisted: true, limited: true });
    }

    // ── Tudo certo: soma +1 ──
    const count = await redis.incr(KEY);
    return json({ count, persisted: true });
  } catch (e) {
    console.error("[bouquet] erro:", (e as Error)?.message || "desconhecido");
    return json({ count: 0, persisted: false, error: true });
  }
};

function json(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), {
    ...init,
    status: init?.status ?? 200,
    headers,
  });
}
