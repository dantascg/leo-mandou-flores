// REMOVER depois que o contador estiver funcionando.
export const prerender = false;

import type { APIRoute } from "astro";

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

export const GET: APIRoute = async () => {
  try {
    const rawUrl = env("UPSTASH_REDIS_REST_URL") ?? env("KV_REST_API_URL");
    const rawToken = env("UPSTASH_REDIS_REST_TOKEN") ?? env("KV_REST_API_TOKEN");

    const hasUrl = Boolean(rawUrl);
    const urlStartsWithHttps = Boolean(rawUrl?.startsWith("https://"));
    const hasToken = Boolean(rawToken);

    let ping: string = "failed";
    let readWrite: string = "failed";
    let errorName: string | null = null;

    if (!hasUrl || !hasToken) {
      errorName = "Variáveis de ambiente ausentes";
    } else if (!urlStartsWithHttps) {
      errorName = "URL não começa com https:// (não use rediss:// nem redis://)";
    } else {
      try {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({ url: rawUrl!, token: rawToken! });

        // Teste de ping
        const pingRes = await redis.ping();
        if (pingRes === "PONG" || pingRes) {
          ping = "ok";
        }

        // Teste de leitura e escrita
        const testKey = "bouquet:healthcheck";
        const testVal = `ok-${Date.now()}`;
        await redis.set(testKey, testVal, { ex: 30 });
        const readBack = await redis.get<string>(testKey);

        if (readBack === testVal) {
          readWrite = "ok";
        } else {
          errorName = "readWrite mismatch";
        }
      } catch (e: any) {
        const msg = (e?.message || e?.name || "").toString();
        if (msg.includes("Unauthorized") || msg.includes("WRONGPASS") || msg.includes("401")) {
          errorName = "Unauthorized (token incorreto ou expirado)";
        } else if (msg.includes("NOPERM") || msg.includes("permission")) {
          errorName = "NOPERM (token read-only, use o token completo)";
        } else if (msg.includes("Invalid URL") || msg.includes("Failed to parse URL")) {
          errorName = "Invalid URL";
        } else if (msg.includes("fetch failed") || msg.includes("ENOTFOUND")) {
          errorName = "fetch failed (erro de rede ou domínio)";
        } else {
          errorName = e?.name || "Falha na conexão com Redis";
        }
      }
    }

    return new Response(
      JSON.stringify({
        hasUrl,
        urlStartsWithHttps,
        hasToken,
        ping,
        readWrite,
        errorName,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        hasUrl: false,
        urlStartsWithHttps: false,
        hasToken: false,
        ping: "failed",
        readWrite: "failed",
        errorName: (e as Error)?.message || "Erro fatal na rota",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
};
