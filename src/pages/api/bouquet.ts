// ─────────────────────────────────────────────────────────────
// CONTADOR REAL DO BUQUÊ DIGITAL
// GET  → devolve o número atual de flores enviadas
// POST → soma +1 e devolve o novo número
// ─────────────────────────────────────────────────────────────
export const prerender = false;

import type { APIRoute } from "astro";

const KEY = "bouquet:count";
const BASELINE = 0;

const RATE_PER_MINUTE = 5;
const RATE_PER_DAY = 20;

function clean(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return v.trim().replace(/^["']+|["']+$/g, "").trim() || undefined;
}

function env(name: string): string | undefined {
  try {
    if (typeof process !== "undefined") {
      if (!process.env?.[name]) {
        try { process.loadEnvFile?.(); } catch {}
      }
      return clean(process.env?.[name]);
    }
  } catch {}
  return undefined;
}

async function getRedis() {
  try {
    const url = env("UPSTASH_REDIS_REST_URL") ?? env("KV_REST_API_URL");
    const token = env("UPSTASH_REDIS_REST_TOKEN") ?? env("KV_REST_API_TOKEN");
    if (!url || !token) return null;
    if (!url.startsWith("https://")) {
      console.error("[bouquet] A URL REST do Upstash deve começar com https:// (não use rediss:// nem redis://).");
      return null;
    }
    const { Redis } = await import("@upstash/redis");
    return new Redis({ url, token });
  } catch (e) {
    console.error("[bouquet] Falha ao inicializar Redis:", (e as Error)?.message);
    return null;
  }
}

async function checkRateLimit(redis: any, ip: string): Promise<boolean> {
  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
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

    const [minRes, dayRes] = await Promise.all([
      perMinute.limit(ip),
      perDay.limit(ip),
    ]);

    return minRes.success && dayRes.success;
  } catch (e) {
    console.warn("[bouquet] Rate limit indisponível, continuando sem limite:", (e as Error)?.message);
    return true; // Não derruba a função se o rate limit falhar
  }
}

function isAllowedOrigin(request: Request): boolean {
  try {
    const origin = request.headers.get("origin") ?? "";
    const referer = request.headers.get("referer") ?? "";

    if (origin.includes("localhost") || referer.includes("localhost")) return true;
    if (origin.includes("127.0.0.1") || referer.includes("127.0.0.1")) return true;

    const forwardedHost = request.headers.get("x-forwarded-host");
    const hostHeader = request.headers.get("host");
    let urlHost = "";
    try {
      urlHost = new URL(request.url).host;
    } catch {}

    const allowedHosts = new Set([urlHost, forwardedHost, hostHeader].filter(Boolean));

    if (origin) {
      try {
        if (allowedHosts.has(new URL(origin).host)) return true;
      } catch {}
    }
    if (referer) {
      try {
        if (allowedHosts.has(new URL(referer).host)) return true;
      } catch {}
    }

    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite === "same-origin") return true;

    return false;
  } catch {
    return true; // Em caso de falha no parse, não bloqueia
  }
}

function getClientIP(request: Request): string {
  try {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      request.headers.get("cf-connecting-ip") ??
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

export const GET: APIRoute = async () => {
  try {
    const redis = await getRedis();

    if (!redis) {
      return json(
        { count: BASELINE, persisted: false },
        { cache: true }
      );
    }

    let count = await redis.get<number>(KEY);
    if (count === null || count === undefined) {
      count = BASELINE;
      await redis.set(KEY, count);
    }
    return json({ count, persisted: true });
  } catch (e) {
    console.error("[bouquet] erro no GET:", (e as Error)?.message || "desconhecido");
    return json({ count: 0, persisted: false, error: true });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!isAllowedOrigin(request)) {
      return json({ error: "forbidden" }, { status: 403 });
    }

    const redis = await getRedis();

    if (!redis) {
      return json({ count: BASELINE + 1, persisted: false });
    }

    const ip = getClientIP(request);
    const allowed = await checkRateLimit(redis, ip);

    if (!allowed) {
      let count = (await redis.get<number>(KEY)) ?? BASELINE;
      return json({ count, persisted: true, limited: true });
    }

    const count = await redis.incr(KEY);
    return json({ count, persisted: true });
  } catch (e) {
    console.error("[bouquet] erro no POST:", (e as Error)?.message || "desconhecido");
    return json({ count: 0, persisted: false, error: true });
  }
};

function json(body: unknown, options?: { cache?: boolean; status?: number }) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.cache) {
    headers["Cache-Control"] = "public, s-maxage=10, stale-while-revalidate=30";
  } else {
    headers["Cache-Control"] = "no-store";
  }
  return new Response(JSON.stringify(body), {
    status: options?.status ?? 200,
    headers,
  });
}
