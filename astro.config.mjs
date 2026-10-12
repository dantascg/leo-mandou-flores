// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Site inteiro continua estático (rápido, sem servidor) — só a rota
// /api/bouquet roda sob demanda (precisa disso pra ler/gravar o
// contador de flores de verdade). Ver src/pages/api/bouquet.ts.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
});
