# Relatório de segurança

## Achados iniciais

- **Alta — src/pages/api/bouquet.ts (origem e erro no catch)**: a implementação original aceitava qualquer URL contendo localhost/127.0.0.1, aceitava Referer como prova suficiente e falhava aberto no erro de parsing. Isso permitia chamadas externas ao contador e abuso do incremento.
- **Alta — src/pages/api/bouquet.ts (rate limit)**: o rate limit era criado a cada requisição e continuava a requisição quando o Redis falhava.
- **Média — src/pages/api/bouquet.ts (POST)**: não havia exigência de Content-Type application/json, método explícito nem validação anti-bot.
- **Média — vercel.json**: faltavam CSP e COOP; os recursos externos de fontes e Turnstile precisavam ser declarados explicitamente.
- **Baixa — raiz do projeto**: Bouquet.astro.bak era um backup público no repositório e foi removido.
- **Baixa — SEO**: faltavam site, sitemap, robots, canonical, metadados sociais, JSON-LD e h1 textual indexável.
- **Dependências**: npm audit encontrou 8 alertas transitivos (4 altos, 4 moderados). O conserto disponível para o adapter exige major; não foi aplicado automaticamente.

Não foram encontrados segredos reais no histórico auditado. O arquivo de instruções não foi incluído em commits.

## O que foi corrigido

- src/pages/api/bouquet.ts: allowlist estrita baseada em Origin, IPs confiáveis, rate limit em cache com limites configuráveis, limite global, fail-closed, Turnstile opcional, content type, métodos e respostas sem detalhes internos.
- src/components/Bouquet.astro: POST JSON, envio de token e tratamento silencioso de respostas 403/429/500.
- src/components/MandaFlores.astro: Turnstile Invisible com render explícito e token novo por envio; falhas não impedem gerar o cartão.
- src/layouts/Layout.astro: canonical, noindex de previews, Open Graph, Twitter Card, JSON-LD, favicon, manifest e modal de privacidade acessível.
- src/components/Hero.astro, src/pages/index.astro, src/styles/global.css: h1 textual acessível, alt descritivo e bloco indexável sobre o álbum.
- astro.config.mjs, public/robots.txt, public/site.webmanifest, vercel.json: sitemap, robots, headers, redirect do www e SEO base.
- public/og.png e public/apple-touch-icon.png: derivados dos assets existentes.
- .env.example: configuração das variáveis.

## CSP

unsafe-inline em script-src é necessário pelos scripts inline gerados pelos componentes Astro; Google Fonts usa fonts.googleapis.com e fonts.gstatic.com; Turnstile usa challenges.cloudflare.com em scripts, conexão e iframe; img-src permite data:/blob: para cursor, QR e exportação html2canvas.

## Assets

Os assets src/assets/main-cover.png e src/assets/archive/* não são referenciados pelo runtime atual. Permanecem no working tree porque a deleção binária foi bloqueada pelo ambiente; foram listados para remoção manual futura após confirmação de que não são fonte de arte. public/og.png já contém a versão otimizada usada no site.
