# Léo Mandou Flores — instruções para agentes

Site do álbum "Léo Mandou Flores" (lançamento 05/12/2026, 00h, horário de Brasília).
Domínio oficial: https://leomandouflores.com (sem www; o www redireciona).
Repositório PÚBLICO: nunca coloque segredos, dados pessoais ou arquivos internos no código ou nos commits.

## Stack

- Astro (site estático) + adapter `@astrojs/vercel`, deploy na Vercel a cada push na `main`.
- Única rota dinâmica: `src/pages/api/bouquet.ts` (contador de flores no Upstash Redis, Cloudflare Turnstile, rate limit, notificação ntfy).
- Fontes self-hosted via `@fontsource`. Sem GSAP (animações em CSS + IntersectionObserver). `html2canvas` só por import dinâmico.

## Estrutura

- `src/components/` — `Nav`, `Hero` (wordmark, contagem regressiva, streaming/pré-save, faixa `?para=`/`?de=`), `MandaFlores` (formulário com remetente opcional "de" + "para" + mensagem, prévia do cartão, cartão/Story, modal de obrigado com a flor animada em SVG: classe `fe--play` adicionada ao abrir e removida ao fechar, pétalas posicionadas no CSS), `Bouquet` (contador).
- O remetente (`#manda-from`) aparece no cartão como "de:" só quando preenchido.
- `src/layouts/Layout.astro` — head, SEO, JSON-LD, tema (script inline anti-pisca), tela de carregamento, modal de privacidade, footer.
- `scripts/csp-inline-hashes.mjs` — roda no fim do `npm run build`: calcula o hash de cada `<script>` inline das páginas geradas e falha o build se o `script-src` do `vercel.json` não tiver exatamente esses hashes. `npm run csp:update` reescreve os hashes.
- `vercel.json` — cabeçalhos de segurança e a CSP única do site (`source: "/(.*)"`, vale também para 404). O Astro não gera CSP (sem `security.csp` nem `staticHeaders`), para não haver duas.
- `src/data/site.js` — **todos os links e configurações editáveis**: `streaming`, `presave`, `releaseDate`, `showStoryButton`. Links nunca ficam escritos direto nos componentes.
- `src/data/flowers.js` — as flores selecionáveis.
- `public/generated/` — imagens otimizadas (AVIF/WebP). Todo caminho em `srcset`/preload precisa existir aqui.

## Identidade visual (não mudar sem pedido explícito)

- Cores: rosa `#ca0053`, roxo `#3b0d1e`, creme `#f6e9de` (variáveis em `src/styles/global.css`). Não criar cores novas.
- Tema padrão: rosa + roxo. Tema escuro (botão lua, `data-theme="escuro"` no `<html>`): SÓ roxo e creme, nenhum rosa.
- O cartão compartilhado (imagem do cartão e do Story) sai SEMPRE rosa, em qualquer tema. A prévia na página acompanha o tema.
- Fontes: Barlow Condensed (principal, tudo), Barlow (texto corrido pequeno) e Kapakana (só acento de marca). Nenhuma outra.
- **Sem emojis** em lugar nenhum (site, textos de compartilhamento, notificações, README). Ícones em SVG inline.
- Cursor nativo de flor (`public/cursor/`), rastro de pétalas leve, favicon de flor.

## Regras de git

- NUNCA `git add -A` nem `git add .`: adicione arquivos pelo caminho. Rode `git status` antes de cada commit.
- Nunca commitar: `.env`, `prompt-*.md`, `RELATORIO-*.md`, `SEGURANCA.md`, screenshots, scripts temporários, saídas de teste.
- Mudanças grandes ou visuais: branch separada a partir da `main`; merge só depois de testado. Correções pequenas e urgentes podem ir direto na `main`.
- Commits pequenos, um por mudança significativa, mensagens em português.
- Sem force push e sem reescrever histórico.
- Nunca adicionar linhas Co-Authored-By nem qualquer assinatura de IA nas mensagens de commit.
- A pasta `.omc/` (estado local do oh-my-claudecode) nunca vai para o repositório: fica em `.git/info/exclude`. Num clone novo, acrescente `.omc/` lá antes de usar o oh-my-claudecode.

## Como trabalhar

- Leia o código envolvido inteiro antes de mudar. Uma mudança por vez.
- Depois de cada mudança: `npm run build` e confira visualmente (Playwright) nos DOIS temas, no celular (iPhone, deviceScaleFactor 3, largura 390) e no desktop (1440). Olhe as imagens de verdade.
- Checklist do que não pode quebrar: formulário (de/para/mensagem), escolha de flor, prévia, compartilhar, baixar, copiar, Story (oculto, mas funcional), modal de obrigado, contador, `?para=`/`?de=`, troca de tema, tela de carregamento (só na primeira entrada da sessão), cursor e rastro, modal de privacidade, página 404, navbar sem cortar de 320px a 1920px.
- Servidor de desenvolvimento SEMPRE em segundo plano (ver abaixo); nunca deixe um comando travado: se passar de 2 minutos, cancele e tente outro jeito. Feche o navegador do Playwright ao fim de cada teste.
- Dependências instaladas só para testar devem ser removidas no final.

## Segurança (manter)

- `?para=` e `?de=` vêm da URL: exibir só com `textContent`, máximo 40 caracteres, sem caracteres de controle; nunca em meta tags, título, canonical ou JSON-LD.
- Nunca usar `innerHTML`/`set:html` com conteúdo do usuário.
- API do contador: exige Origin permitida, `Content-Type: application/json`, token Turnstile válido; rate limit por IP e global; erros sem detalhes internos.
- Segredos só em variáveis de ambiente da Vercel (ver `.env.example`). Nunca imprimir valores de segredos.
- Cabeçalhos e CSP ficam em `vercel.json`; ao adicionar qualquer recurso externo, atualizar a CSP.
- Ao mudar qualquer script inline (is:inline ou define:vars, incluindo releaseDate em src/data/site.js), rode npm run csp:update e commite o vercel.json junto; senão o build falha. Trocar presave e links de streaming em site.js não exige isso.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Adding styles](https://docs.astro.build/en/guides/styling/)
