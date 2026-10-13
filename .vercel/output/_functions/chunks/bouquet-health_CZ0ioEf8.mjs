import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { Redis } from "@upstash/redis";
//#region src/pages/api/bouquet-health.ts
var bouquet_health_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
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
	}, {})[name];
	const fromProcess = typeof process !== "undefined" ? process.env[name] : void 0;
	return clean(fromAstro ?? fromProcess);
}
var GET = async () => {
	const rawUrl = env("UPSTASH_REDIS_REST_URL") ?? env("KV_REST_API_URL");
	const rawToken = env("UPSTASH_REDIS_REST_TOKEN") ?? env("KV_REST_API_TOKEN");
	const hasUrl = Boolean(rawUrl);
	const urlStartsWithHttps = Boolean(rawUrl?.startsWith("https://"));
	const hasToken = Boolean(rawToken);
	let ping = "failed";
	let readWrite = "failed";
	let errorName = null;
	if (!hasUrl || !hasToken) errorName = "Variáveis de ambiente ausentes";
	else if (!urlStartsWithHttps) errorName = "URL não começa com https:// (não use rediss:// nem redis://)";
	else try {
		const redis = new Redis({
			url: rawUrl,
			token: rawToken
		});
		const pingRes = await redis.ping();
		if (pingRes === "PONG" || pingRes) ping = "ok";
		const testKey = "bouquet:healthcheck";
		const testVal = `ok-${Date.now()}`;
		await redis.set(testKey, testVal, { ex: 30 });
		if (await redis.get(testKey) === testVal) readWrite = "ok";
		else errorName = "readWrite mismatch";
	} catch (e) {
		const msg = (e?.message || e?.name || "").toString();
		if (msg.includes("Unauthorized") || msg.includes("WRONGPASS") || msg.includes("401")) errorName = "Unauthorized (token incorreto ou expirado)";
		else if (msg.includes("NOPERM") || msg.includes("permission")) errorName = "NOPERM (token read-only, use o token completo)";
		else if (msg.includes("Invalid URL") || msg.includes("Failed to parse URL")) errorName = "Invalid URL";
		else if (msg.includes("fetch failed") || msg.includes("ENOTFOUND")) errorName = "fetch failed (erro de rede ou domínio)";
		else errorName = e?.name || "Falha na conexão com Redis";
	}
	return new Response(JSON.stringify({
		hasUrl,
		urlStartsWithHttps,
		hasToken,
		ping,
		readWrite,
		errorName
	}), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store"
		}
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/bouquet-health@_@ts
var page = () => bouquet_health_exports;
//#endregion
export { page };
