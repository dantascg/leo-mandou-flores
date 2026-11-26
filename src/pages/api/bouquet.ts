// CONTADOR REAL DO BUQUÊ DIGITAL: GET lê e POST soma uma flor.
export const prerender = false;

import type { APIRoute } from "astro";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const KEY = "bouquet:count";
const BASELINE = 0;
const GLOBAL_LIMIT = 300;
const NTFY_COOLDOWN = "ntfy:cooldown";

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^['"]+|['"]+$/g, "").trim() || undefined;
}

function env(name: string): string | undefined {
  return clean(typeof process !== "undefined" ? process.env[name] : undefined);
}

function positiveInt(name: string, fallback: number): number {
  const value = Number.parseInt(env(name) ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const RATE_PER_MINUTE = positiveInt("RATE_PER_MINUTE", 5);
const RATE_PER_DAY = positiveInt("RATE_PER_DAY", 50);

function createRedis(): Redis | null {
  try {
    const url = env("UPSTASH_REDIS_REST_URL") ?? env("KV_REST_API_URL");
    const token = env("UPSTASH_REDIS_REST_TOKEN") ?? env("KV_REST_API_TOKEN");
    if (!url || !token) return null;
    if (!url.startsWith("https://")) {
      console.error("[bouquet] URL REST do Upstash inválida.");
      return null;
    }
    return new Redis({ url, token });
  } catch (error) {
    console.error("[bouquet] Falha ao inicializar Redis:", (error as Error)?.message);
    return null;
  }
}

// As instâncias são reutilizadas durante a vida da função serverless.
const redis = createRedis();
const perMinute = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(RATE_PER_MINUTE, "1 m"), prefix: "rl:bouquet:min" })
  : null;
const perDay = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(RATE_PER_DAY, "1 d"), prefix: "rl:bouquet:day" })
  : null;
const unknownPerMinute = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, "1 m"), prefix: "rl:bouquet:unknown:min" })
  : null;
const unknownPerDay = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(3, "1 d"), prefix: "rl:bouquet:unknown:day" })
  : null;
const globalLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(GLOBAL_LIMIT, "1 m"), prefix: "rl:bouquet:global" })
  : null;

async function checkRateLimit(ip: string): Promise<{ limited: boolean }> {
  if (!redis || !perMinute || !perDay || !globalLimit) return { limited: true };
  try {
    const isUnknown = ip === "unknown";
    const [minute, day, global] = await Promise.all([
      (isUnknown ? unknownPerMinute : perMinute)!.limit(ip),
      (isUnknown ? unknownPerDay : perDay)!.limit(ip),
      globalLimit.limit("all"),
    ]);
    return { limited: !(minute.success && day.success && global.success) };
  } catch (error) {
    console.error("[bouquet] Rate limit indisponível:", (error as Error)?.message);
    return { limited: true };
  }
}

function isAllowedOrigin(request: Request): boolean {
  try {
    const origin = request.headers.get("origin");
    if (!origin) return false;
    const originUrl = new URL(origin);
    const requestHost = new URL(request.url).host;
    const allowedHosts = new Set([
      requestHost,
      "leomandouflores.com",
      "www.leomandouflores.com",
      env("SITE_HOST"),
      env("VERCEL_URL"),
      env("VERCEL_PROJECT_PRODUCTION_URL"),
      env("VERCEL_BRANCH_URL"),
    ].filter(Boolean).map((host) => host!.replace(/^https?:\/\//, "").replace(/\/$/, "")));
    if (import.meta.env.DEV && (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")) return true;
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite && secFetchSite !== "same-origin") return false;
    return allowedHosts.has(originUrl.host);
  } catch {
    return false;
  }
}

function getClientIP(request: Request): string {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

async function verifyTurnstile(token: unknown, request: Request): Promise<boolean> {
  const secret = env("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (typeof token !== "string" || token.length < 10 || token.length > 4096) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: getClientIP(request) }),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("[bouquet] Falha na validação do Turnstile:", (error as Error)?.message);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export const GET: APIRoute = async () => {
  try {
    if (!redis) return json({ count: BASELINE, persisted: false }, { cache: true });
    let count = await redis.get<number>(KEY);
    if (count === null || count === undefined) {
      count = BASELINE;
      await redis.set(KEY, count);
    }
    return json({ count, persisted: true }, { cache: true });
  } catch (error) {
    console.error("[bouquet] erro no GET:", (error as Error)?.message);
    return json({ count: BASELINE, persisted: false, error: true }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!isAllowedOrigin(request)) return json({ error: true }, { status: 403 });
    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") return json({ error: true }, { status: 415 });
    const body = await request.json() as { turnstileToken?: unknown };
    if (!(await verifyTurnstile(body.turnstileToken, request))) return json({ error: true }, { status: 403 });
    if (!redis) return json({ count: BASELINE + 1, persisted: false });
    const { limited } = await checkRateLimit(getClientIP(request));
    const current = (await redis.get<number>(KEY)) ?? BASELINE;
    if (limited) return json({ count: current, persisted: true, limited: true }, { status: 429 });
    const count = await redis.incr(KEY);
    void notifyNtfy(count, redis);
    return json({ count, persisted: true });
  } catch (error) {
    console.error("[bouquet] erro no POST:", (error as Error)?.message);
    return json({ error: true }, { status: 500 });
  }
};

async function notifyNtfy(count: number, store: Redis) {
  const topic = env("NTFY_TOPIC");
  if (!topic) return;
  const milestone = count >= 100 && (count % 100 === 0 || [500, 1000, 5000, 10000].includes(count));
  try {
    const allowed = milestone || await store.set(NTFY_COOLDOWN, "1", { ex: 60, nx: true });
    if (!allowed) return;
    const base = (env("NTFY_URL") ?? "https://ntfy.sh").replace(/\/$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(`${base}/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        "Title": milestone ? `${count} flores!` : "Nova flor enviada",
        "Priority": milestone ? "3" : "2",
        ...(env("NTFY_TOKEN") ? { Authorization: `Bearer ${env("NTFY_TOKEN")}` } : {}),
      },
      body: milestone ? `${count} flores` : `Total: ${count} flores`,
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (error) {
    console.error("[bouquet] ntfy indisponível:", (error as Error)?.message);
  }
}

export const ALL: APIRoute = async () => json({ error: true }, { status: 405, allow: "GET, POST" });

function json(body: unknown, options: { cache?: boolean; status?: number; allow?: string } = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": options.cache ? "public, s-maxage=10, stale-while-revalidate=30" : "no-store",
  };
  if (options.allow) headers.Allow = options.allow;
  return new Response(JSON.stringify(body), { status: options.status ?? 200, headers });
}
