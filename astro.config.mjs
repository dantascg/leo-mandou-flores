// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Site inteiro continua estático (rápido, sem servidor) — só a rota
// /api/bouquet roda sob demanda (precisa disso pra ler/gravar o
// contador de flores de verdade). Ver src/pages/api/bouquet.ts.
export default defineConfig({
  output: 'static',
  // staticHeaders: a CSP gerada vai como cabeçalho HTTP da Vercel (não <meta>), para valer frame-ancestors.
  adapter: vercel({ staticHeaders: true }),
  site: 'https://leomandouflores.com',
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
  // CSP com hashes dos scripts e estilos inline, gerados no build (sem 'unsafe-inline' em script-src).
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "font-src 'self' data:",
        "img-src 'self' data: blob:",
        "connect-src 'self' https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
      scriptDirective: { resources: ["'self'", 'https://challenges.cloudflare.com'] },
      styleDirective: { resources: ["'self'"] },
    },
  },
});
