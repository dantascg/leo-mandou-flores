import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import "@upstash/redis";
//#region src/pages/api/bouquet.ts
var bouquet_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var KEY = "bouquet:count";
var BASELINE = 1204;
function getRedis() {
	return null;
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
var POST = async () => {
	const redis = getRedis();
	if (!redis) return json({
		count: 1205,
		persisted: false
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
