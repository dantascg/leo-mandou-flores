import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
//#region src/pages/api/bouquet.ts
var bouquet_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var KEY = "bouquet:count";
var BASELINE = 0;
var RATE_PER_MINUTE = 5;
var RATE_PER_DAY = 20;
function clean(v) {
	if (!v) return void 0;
	return v.trim().replace(/^["']+|["']+$/g, "").trim() || void 0;
}
function env(name) {
	try {
		if (typeof process !== "undefined") {
			if (!process.env?.[name]) try {
				process.loadEnvFile?.();
			} catch {}
			return clean(process.env?.[name]);
		}
	} catch {}
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
		return new Redis({
			url,
			token
		});
	} catch (e) {
		console.error("[bouquet] Falha ao inicializar Redis:", e?.message);
		return null;
	}
}
async function checkRateLimit(redis, ip) {
	try {
		const { Ratelimit } = await import("@upstash/ratelimit");
		const perMinute = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(RATE_PER_MINUTE, "1 m"),
			prefix: "rl:bouquet:min"
		});
		const perDay = new Ratelimit({
			redis,
			limiter: Ratelimit.fixedWindow(RATE_PER_DAY, "1 d"),
			prefix: "rl:bouquet:day"
		});
		const [minRes, dayRes] = await Promise.all([perMinute.limit(ip), perDay.limit(ip)]);
		return minRes.success && dayRes.success;
	} catch (e) {
		console.warn("[bouquet] Rate limit indisponível, continuando sem limite:", e?.message);
		return true;
	}
}
function isAllowedOrigin(request) {
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
		const allowedHosts = new Set([
			urlHost,
			forwardedHost,
			hostHeader
		].filter(Boolean));
		if (origin) try {
			if (allowedHosts.has(new URL(origin).host)) return true;
		} catch {}
		if (referer) try {
			if (allowedHosts.has(new URL(referer).host)) return true;
		} catch {}
		if (request.headers.get("sec-fetch-site") === "same-origin") return true;
		return false;
	} catch {
		return true;
	}
}
function getClientIP(request) {
	try {
		return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? "unknown";
	} catch {
		return "unknown";
	}
}
var GET = async () => {
	try {
		const redis = await getRedis();
		if (!redis) return json({
			count: BASELINE,
			persisted: false
		}, { cache: true });
		let count = await redis.get(KEY);
		if (count === null || count === void 0) {
			count = BASELINE;
			await redis.set(KEY, count);
		}
		return json({
			count,
			persisted: true
		}, { cache: true });
	} catch (e) {
		console.error("[bouquet] erro no GET:", e?.message || "desconhecido");
		return json({
			count: 0,
			persisted: false,
			error: true
		});
	}
};
var POST = async ({ request }) => {
	try {
		if (!isAllowedOrigin(request)) return json({ error: "forbidden" }, { status: 403 });
		const redis = await getRedis();
		if (!redis) return json({
			count: 1,
			persisted: false
		});
		if (!await checkRateLimit(redis, getClientIP(request))) return json({
			count: await redis.get(KEY) ?? BASELINE,
			persisted: true,
			limited: true
		});
		return json({
			count: await redis.incr(KEY),
			persisted: true
		});
	} catch (e) {
		console.error("[bouquet] erro no POST:", e?.message || "desconhecido");
		return json({
			count: 0,
			persisted: false,
			error: true
		});
	}
};
function json(body, options) {
	const headers = { "Content-Type": "application/json" };
	if (options?.cache) headers["Cache-Control"] = "public, s-maxage=10, stale-while-revalidate=30";
	else headers["Cache-Control"] = "no-store";
	return new Response(JSON.stringify(body), {
		status: options?.status ?? 200,
		headers
	});
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/bouquet@_@ts
var page = () => bouquet_exports;
//#endregion
export { page };
