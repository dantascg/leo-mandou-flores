import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import "@upstash/redis";
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
function getRedis() {
	return null;
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
	const host = new URL(request.url).host;
	if (origin) try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
	if (referer) try {
		return new URL(referer).host === host;
	} catch {
		return false;
	}
	return false;
}
function getClientIP(request) {
	return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? "unknown";
}
var GET = async () => {
	const redis = getRedis();
	if (!redis) return json({
		count: BASELINE,
		persisted: false
	});
	let count = await redis.get(KEY);
	if (count === null || count === void 0) {
		count = BASELINE;
		await redis.set(KEY, count);
	}
	return json({
		count,
		persisted: true
	});
};
var POST = async ({ request }) => {
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
};
function json(body) {
	return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/bouquet@_@ts
var page = () => bouquet_exports;
//#endregion
export { page };
