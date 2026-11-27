# Léo Mandou Flores

Site do álbum "Léo Mandou Flores" (lançamento em 05/12/2026, 00h, horário de Brasília): https://leomandouflores.com

Contagem regressiva com pré-save ou links de streaming, envio de flores com cartão para compartilhar e um buquê com contador de flores enviadas. Feito com Astro e publicado na Vercel a cada push na `main`.

## Rodar local

Requer Node 22.12 ou mais novo.

```bash
npm install
astro dev --background   # servidor em segundo plano
astro dev status
astro dev logs
astro dev stop
npm run build            # build de produção (inclui a conferência da CSP)
```

## Variáveis de ambiente

Copie `.env.example` para `.env` (nunca commite o `.env`). Em produção, configure as mesmas variáveis no painel da Vercel.

| Variável | Para que serve |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis do contador (URL começa com `https://`) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Alternativa às duas acima (nomes da integração da Vercel) |
| `PUBLIC_TURNSTILE_SITE_KEY` | Chave pública do Cloudflare Turnstile (widget invisível) |
| `TURNSTILE_SECRET_KEY` | Chave secreta do Turnstile; sem ela, a produção recusa novas flores |
| `RATE_PER_MINUTE`, `RATE_PER_DAY` | Limite de flores por IP (padrão 5 por minuto e 50 por dia) |
| `SITE_HOST` | Domínio extra aceito como origem da API |
| `NTFY_TOPIC` | Liga a notificação de novas flores no ntfy (use um nome difícil de adivinhar) |
| `NTFY_URL`, `NTFY_TOKEN` | Servidor do ntfy (padrão `https://ntfy.sh`) e token opcional |

## Trocar links pelo GitHub (no navegador)

Todos os links ficam em `src/data/site.js`.

1. Abra `src/data/site.js` no GitHub e clique no lápis (Edit).
2. Troque o que precisar:
   - `presave`: link do pré-save. Preenchido, o site mostra o botão PRÉ-SAVE; vazio (`""`), mostra os ícones de streaming.
   - `streaming`: troque só o `href` de cada plataforma (o primeiro também é o botão OUÇA O ÁLBUM do pop-up).
3. Clique em **Commit changes** na `main` e aguarde o deploy da Vercel (cerca de 1 minuto).

## Checklist do dia 5

- [ ] Em `src/data/site.js`, deixar `presave: ""` (vazio) para trocar o botão PRÉ-SAVE pelos ícones de streaming.
- [ ] Trocar os `href` de `streaming` pelos links do álbum em cada plataforma.
- [ ] Commit na `main`, esperar o deploy e conferir no site: ícones aparecem, cada um abre o álbum certo, e o botão do pop-up depois de enviar uma flor diz OUÇA O ÁLBUM.

## Aviso: CSP e scripts inline

A Content-Security-Policy fica no `vercel.json` e lista o hash de cada script inline. Ao mudar qualquer script inline (`is:inline` ou `define:vars`, incluindo `releaseDate` em `src/data/site.js`), rode:

```bash
npm run csp:update
```

e commite o `vercel.json` junto. Sem isso, o `npm run build` falha (e o deploy não sai). Trocar `presave` e links de `streaming` não exige isso.
