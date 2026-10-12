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
// ─────────────────────────────────────────────────────────────
export const prerender = false;

import type { APIRoute } from "astro";
import { Redis } from "@upstash/redis";

const KEY = "bouquet:count";
const BASELINE = 1204; // valor inicial, só usado na primeira vez

function getRedis(): Redis | null {
  const url = import.meta.env.KV_REST_API_URL ?? import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.KV_REST_API_TOKEN ?? import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
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

export const POST: APIRoute = async () => {
  const redis = getRedis();

  if (!redis) {
    return json({ count: BASELINE + 1, persisted: false });
  }

  const count = await redis.incr(KEY);
  return json({ count, persisted: true });
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
