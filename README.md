# Léo Mandou Flores

Landing page do álbum, feita com Astro. A página tem Hero, envio de flores com cartão/Story, e o buquê com contador persistido em Redis.

## Desenvolvimento

```bash
npm install
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

## Estrutura

- `src/components`: `Nav`, `Hero`, `MandaFlores` e `Bouquet`.
- `src/data/site.js`: links, pré-save e data de lançamento.
- `src/pages/api/bouquet.ts`: contador e notificação opcional.
- `src/styles/global.css`: tokens, fontes, cursor e acessibilidade.
- `public/`: logos, flores, streaming, QR e cursor.

Fontes reais: Barlow Condensed para títulos/labels, Barlow para texto e Kapakana para script.

## Links e modo escuro

1. Abra `src/data/site.js` no GitHub.
2. Clique no lápis, troque os `href` de `streaming` pelos links finais e, se quiser, preencha `presave`.
3. Faça commit em **Commit changes** e aguarde o deploy da Vercel.

O modo escuro é opcional no botão de lua da navegação. A preferência fica no `localStorage`; o modo padrão continua rosa e não segue o tema do sistema.

## Variáveis de ambiente

Copie `.env.example` para `.env` e configure Upstash/Turnstile para produção. `NTFY_TOPIC` ativa notificações públicas do ntfy; escolha um tópico difícil de adivinhar, pois qualquer pessoa que souber o nome pode lê-lo. `NTFY_URL` usa `https://ntfy.sh` por padrão e `NTFY_TOKEN` é opcional.

## Deploy e verificação

```bash
npm run build
npm audit
```

O compartilhamento gera `leo-mandou-flores-cartao.png` e `leo-mandou-flores-story.png`. O Story é 1080×1920 e, quando o navegador não suporta compartilhamento de arquivos, é baixado com instrução para abrir o Instagram.
