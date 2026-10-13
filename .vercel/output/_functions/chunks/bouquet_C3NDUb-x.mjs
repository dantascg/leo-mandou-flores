import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
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
	const fromAstro = Object.assign({
		"ASSETS_PREFIX": void 0,
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SITE": void 0,
		"SSR": true
	}, { OS: "Windows_NT" })[name];
	const fromProcess = typeof process !== "undefined" ? process.env[name] : void 0;
	return clean(fromAstro ?? fromProcess);
}
function getRedis() {
	const url = env("UPSTASH_REDIS_REST_URL") ?? env("KV_REST_API_URL");
	const token = env("UPSTASH_REDIS_REST_TOKEN") ?? env("KV_REST_API_TOKEN");
	if (!url || !token) return null;
	if (!url.startsWith("https://")) {
		console.error("[bouquet] A URL REST do Upstash deve começar com https:// (não use rediss:// nem redis://).");
		return null;
	}
	return new Redis({
		url,
		token
	});
}
function getRatelimiters(redis) {
	return {
		perMinute: new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(RATE_PER_MINUTE, "1 m"),
			prefix: "rl:bouquet:min"
		}),
		perDay: new Ratelimit({
			redis,
			limiter: Ratelimit.fixedWindow(RATE_PER_DAY, "1 d"),
			prefix: "rl:bouquet:day"
		})
	};
}
function isAllowedOrigin(request) {
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
		const originHost = new URL(origin).host;
		if (allowedHosts.has(originHost)) return true;
	} catch {
		return false;
	}
	if (referer) try {
		const refererHost = new URL(referer).host;
		if (allowedHosts.has(refererHost)) return true;
	} catch {
		return false;
	}
	return false;
}
function getClientIP(request) {
	return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? "unknown";
}
var GET = async () => {
	try {
		const redis = getRedis();
		if (!redis) return json({
			count: BASELINE,
			persisted: false
		}, { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } });
		let count = await redis.get(KEY);
		if (count === null || count === void 0) {
			count = BASELINE;
			await redis.set(KEY, count);
		}
		return json({
			count,
			persisted: true
		}, { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } });
	} catch (e) {
		console.error("[bouquet] erro:", e?.message || "desconhecido");
		return json({
			count: 0,
			persisted: false,
			error: true
		});
	}
};
var POST = async ({ request }) => {
	try {
		if (!isAllowedOrigin(request)) return new Response(JSON.stringify({ error: "forbidden" }), {
			status: 403,
			headers: { "Content-Type": "application/json" }
		});
		const redis = getRedis();
		if (!redis) return json({
			count: 1,
			persisted: false
		});
		const ip = getClientIP(request);
		const { perMinute, perDay } = getRatelimiters(redis);
		const [minResult, dayResult] = await Promise.all([perMinute.limit(ip), perDay.limit(ip)]);
		if (!minResult.success || !dayResult.success) return json({
			count: await redis.get(KEY) ?? BASELINE,
			persisted: true,
			limited: true
		});
		return json({
			count: await redis.incr(KEY),
			persisted: true
		});
	} catch (e) {
		console.error("[bouquet] erro:", e?.message || "desconhecido");
		return json({
			count: 0,
			persisted: false,
			error: true
		});
	}
};
function json(body, init) {
	const headers = new Headers(init?.headers);
	headers.set("Content-Type", "application/json");
	return new Response(JSON.stringify(body), {
		...init,
		status: init?.status ?? 200,
		headers
	});
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/bouquet@_@ts
var page = () => bouquet_exports;
//#endregion
export { page };
