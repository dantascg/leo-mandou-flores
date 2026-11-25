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

## Resumo executivo

O contador agora só aceita incrementos vindos de origens permitidas, exige JSON, aplica limites de uso e pode validar Turnstile contra bots. O site também ganhou cabeçalhos de segurança, política de privacidade visível e os elementos técnicos necessários para indexação.

## Testes executados

- `npm run build`: passou sem erros; sitemap-index.xml foi gerado.
- `POST` sem Origin: 403.
- `POST` com `Origin: https://evil.com`: 403.
- `POST` com `Referer: https://evil.com/?localhost` sem Origin: 403.
- `POST` sem `Content-Type: application/json`: 415.
- `PUT` e `DELETE`: 405 com `Allow: GET, POST`.
- POST local válido sem Redis: 200, `{"count":1,"persisted":false}`; comportamento compatível com o fallback local existente.
- Turnstile com secret oficial de teste que passa: 200 no ambiente sem Redis; secret oficial que falha: 403 e não incrementa.
- `dist/client/index.html`: title, description de 150 caracteres, canonical, OG, JSON-LD, h1 e `lang="pt-BR"` presentes. `robots.txt`, `sitemap-index.xml`, manifest e ícones presentes.
- JSON-LD: parseado como JSON válido durante a inspeção do HTML gerado.
- Recursos externos permitidos pela CSP: Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) e Cloudflare Turnstile (`challenges.cloudflare.com` em script, conexão e iframe). O restante é local; `data:`/`blob:` ficam restritos a imagens para cursor/QR/exportação.
- `npm audit`: 8 alertas transitivos (4 altos, 4 moderados). `npm audit fix` não foi aplicado porque o caminho principal exige upgrade major do adapter.

## Riscos que ficaram

- O Redis/Upstash ainda é necessário em produção para persistência e rate limit; sem as variáveis corretas o fallback não persiste.
- O Turnstile só protege quando as duas chaves forem configuradas na Vercel.
- O CSP mantém `unsafe-inline` para os scripts inline do Astro/componentes atuais. Removê-lo exigiria refatorar scripts para arquivos externos ou nonce.
- A imagem-fonte `src/assets/main-cover.png` é grande e os arquivos de arquivo visual não usados continuam no repositório por cautela; o OG usado no runtime foi reduzido de 1,7 MB para aproximadamente 386 KB.

## O que o dono precisa fazer fora do código

1. Na Vercel, configure `PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` em Production; configure Preview apenas se o hostname do preview estiver no widget.
2. Confira as variáveis do Upstash (`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`) e faça redeploy.
3. Teste enviar uma flor no domínio publicado.
4. Cadastre `leomandouflores.com` no Google Search Console, verifique pelo registro DNS TXT, envie `https://leomandouflores.com/sitemap-index.xml` e peça indexação da home.
5. Faça o mesmo no Bing Webmaster Tools (é possível importar do Search Console).
6. Coloque o link do site na bio do Instagram, TikTok e YouTube, nos perfis Spotify for Artists/Apple Music for Artists e em matérias ou blogs sobre o álbum.

A indexação costuma levar dias ou semanas e ranking não é garantido. O nome do artista foi inferido dos links reais do projeto (`leonandradej`); confirme esse dado antes de publicar se necessário.

## Commits

```
3caca91 feat(seo): adiciona sitemap metadata e privacidade
fec5fa5 fix(api): endurece contador e integra Turnstile
1694523 docs(seguranca): registra auditoria inicial
```
