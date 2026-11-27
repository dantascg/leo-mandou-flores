// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Site inteiro continua estático (rápido, sem servidor) — só a rota
// /api/bouquet roda sob demanda (precisa disso pra ler/gravar o
// contador de flores de verdade). Ver src/pages/api/bouquet.ts.
export default defineConfig({
  output: 'static',
  // A CSP fica no vercel.json e vale para todos os caminhos, inclusive 404.
  // scripts/csp-inline-hashes.mjs confere os hashes dos scripts inline a cada build.
  adapter: vercel(),
  site: 'https://leomandouflores.com',
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
});
