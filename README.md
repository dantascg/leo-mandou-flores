# Léo Mandou Flores — site do álbum

Astro + GSAP. Estrutura enxuta: só 3 seções (Hero, Envie uma Flor,
Buquê). O site é estático exceto por UMA rota dinâmica,
`/api/bouquet`, o contador real de flores enviadas.

## Rodando local

```bash
npm install
npm run dev
```

Para iniciar o servidor em segundo plano no ambiente do projeto:

```bash
astro dev --background
```

Pra testar no celular sem publicar nada: `npm run dev -- --host`.
Ele mostra um endereço tipo `http://192.168.x.x:4321` — abre no
navegador do celular, desde que esteja na mesma wifi do computador.

## Assets pendentes (você vai desenhar/exportar do Figma)

O código já está pronto esperando estes arquivos — quando você
colocar cada um no lugar certo, ele aparece sozinho, sem mexer em
nenhuma linha de código:

| O que é | Onde colocar | Enquanto não existe |
|---|---|---|
| Logo/wordmark completo do Hero | `public/hero-wordmark.png` | Mostra um placeholder de texto (Barlow Condensed + Kapakana) |
| Flores de fundo do Hero (line-art) | `public/hero-flowers.png` | Fundo rosa liso, sem quebrar nada |
| Logo pequena da nav/cartão | `public/logo.png` | Já tem uma versão provisória aplicada |
| Ícone Spotify | `public/streaming/spotify.svg` | Círculo com "S" |
| Ícone Apple Music | `public/streaming/apple-music.svg` | Círculo com "A" |
| Ícone YouTube | `public/streaming/youtube.svg` | Círculo com "Y" |
| Ícone SoundCloud | `public/streaming/soundcloud.svg` | Círculo com "S" |
| Ícones das 5 flores (Escolha a flor) | ver nota abaixo | Blocos em branco |

Pra trocar o `<img>` do Hero pelo wordmark pronto, veja o comentário
dentro de `src/components/Hero.astro` — é só substituir um bloco.

Os ícones de flor ainda não têm um caminho de arquivo definido
porque você não tinha me falado o formato ainda — me avisa se vai
ser um SVG por flor (tipo os de streaming) ou algo diferente, que eu
já deixo o código apontando pro lugar certo.

## Links de streaming e nomes das flores

- `src/data/site.js` → troque os `href: "#"` pelos links reais
  quando tiver.
- `src/data/flowers.js` → nomes das 5 flores (pode adicionar, remover
  ou renomear à vontade, o layout se ajusta sozinho).

## Deploy (precisa ser Vercel, por causa do contador)

```bash
npm install -g vercel
vercel
```

### Ativando o contador de verdade (Buquê)

1. No dashboard da Vercel: **Storage** → **Create Database** →
   **Upstash Redis** (plano grátis já serve).
2. Conecte o banco ao projeto — a Vercel adiciona sozinha as
   variáveis de ambiente.
3. `vercel --prod` de novo (as variáveis só existem depois do banco
   criado).

Sem isso configurado, o contador mostra um número de exemplo — o
resto do site funciona normal.

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha as credenciais do Upstash.
`RATE_PER_MINUTE` e `RATE_PER_DAY` controlam os limites por IP.
Para ativar a proteção invisível contra bots, configure
`PUBLIC_TURNSTILE_SITE_KEY` (pública) e `TURNSTILE_SECRET_KEY` (secreta)
na Vercel. O site continua gerando cartões mesmo quando o Turnstile
falha; nesse caso, o contador não é incrementado.

Depois de alterar as variáveis, faça um novo deploy e teste o envio de
uma flor no domínio publicado. Consulte `.env.example` para a lista
completa, incluindo `SITE_HOST` e os nomes alternativos KV da Vercel.

## Fontes

- Principal: **Barlow Condensed**.
- Texto corrido longo: **Barlow**.
- Cursiva/script: **Kapakana** (Google Fonts, licença OFL — grátis).

Tudo documentado com comentários em `src/styles/global.css`.

## Estrutura

```
src/
  components/
    Nav.astro         -> barra fina com a logo
    Hero.astro         -> wordmark + botões de streaming
    MandaFlores.astro  -> formulário + cartão + compartilhar/baixar/copiar
    Bouquet.astro       -> contador real + buquê visual crescendo
  data/
    site.js            -> links de streaming, config geral
    flowers.js          -> as 5 flores selecionáveis
  pages/api/bouquet.ts -> única rota dinâmica (contador real)
  styles/global.css    -> cores, fontes, grain, cursor
public/
  logo.png             -> logo usada na nav e no cartão
  streaming/*.svg      -> ícones placeholder das plataformas
```

## Build de produção (sem deploy, só gerar os arquivos)

```bash
npm run build
npm run preview
```
