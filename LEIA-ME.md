# GODI · Painel Comercial — guia de publicação

Este pacote tem 3 partes: o **site** (TV + formulário), o **backend**
(Google Apps Script, que lê e grava numa planilha Google) e este guia.

Nenhuma etapa aqui exige programar — é copiar, colar e clicar em alguns
botões. Leva uns 10-15 minutos na primeira vez.

## Arquivos

- `index.html` — TV 1: ranking, metas, destaques do dia. Auto-atualiza sozinha.
- `tv-top3.html` — TV 2: pódio top 3 do dia + cronômetro + blocos de ligação.
- `tv-detalhado.html` — TV 3: lista completa (todo o time) por categoria, mais detalhada que o pódio.
- `tv-completo.html` — **a que vai na TV de verdade**: junta `tv-top3.html` e
  `tv-detalhado.html` num único link, alternando sozinha entre as duas a cada
  15s (dá pra ajustar em `config.js`, campo `ROTACAO_TELAS_SEGUNDOS`). Não
  precisa trocar de aba na TV — é só deixar esse link aberto.
- `formulario.html` — onde o time lança os resultados do dia.
- `styles.css` — visual (cores e fonte da GODI). Não precisa mexer.
- `config.js` — único lugar que você vai editar: a URL do backend.
- `Code.gs` — o backend (Google Apps Script).
- `assets/logo.png` — **opcional**: salve aqui o logo oficial (veja abaixo).

## Passo 1 — Criar o backend (planilha + Apps Script)

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma
   planilha em branco. Dê o nome que quiser, ex: `GODI Comercial — Dados`.
2. No menu, vá em **Extensões → Apps Script**.
3. Apague todo o conteúdo que aparecer no editor e cole o conteúdo do
   arquivo `Code.gs` (deste pacote) no lugar.
4. Salve (ícone de disquete ou `Ctrl+S`).
5. No topo, escolha a função `primeiraConfiguracao` na lista de funções
   e clique em **Executar** (▶). Na primeira vez o Google vai pedir
   autorização — clique em **Revisar permissões**, escolha sua conta,
   clique em **Avançado** e depois **Acessar [nome do projeto] (não
   seguro)** — é normal, é o seu próprio script pedindo acesso à sua
   própria planilha.
6. Volte na planilha: agora devem existir duas abas novas, **Lancamentos**
   e **Config**. Na aba **Config** já vêm os 9 nomes do time. Ajuste ali
   a meta mensal de cada um (coluna `MetaMensal`).
7. De volta no editor do Apps Script: **Implantar → Nova implantação**.
   - Clique na engrenagem ao lado de "Selecionar tipo" → **App da Web**.
   - Executar como: **Eu**.
   - Quem pode acessar: **Qualquer pessoa**.
   - Clique em **Implantar** e autorize de novo se pedir.
8. Copie a **URL do app da Web** que aparece (termina em `/exec`). É essa
   URL que o site vai usar.

## Passo 2 — Configurar o site

1. Abra o arquivo `config.js`.
2. Troque `"COLE_AQUI_A_URL_DO_APPS_SCRIPT"` pela URL que você copiou no
   passo anterior, entre aspas. Exemplo:
   ```js
   API_URL: "https://script.google.com/macros/s/AKfycb.../exec",
   ```
3. Salve.
4. Se quiser mudar os horários dos **Blocos de Ligação**, edite
   `BLOCOS_LIGACAO` no mesmo `config.js` — os horários padrão são só um
   ponto de partida. Esses horários valem tanto para a TV (o checklist
   da agenda) quanto para o formulário: no formulário, cada bloco só
   libera pro comercial preencher a quantidade de discagens depois que o
   horário daquele bloco termina, e trava sozinho assim que ele digita o
   valor — não dá pra editar depois. Na TV, o checklist de blocos é só
   visual e reseta sozinho todo dia (fica salvo no navegador de quem
   está olhando, não na planilha).

## Passo 3 (opcional) — Logo oficial

O site já mostra "GODI TRANSPORTES" estilizado se não achar um logo.
Se quiser o logo oficial (o mesmo do site goditransportes.com.br):
1. Abra [goditransportes.com.br](https://goditransportes.com.br) no
   navegador, clique com o botão direito no logo → **Salvar imagem como**.
2. Salve dentro da pasta `assets` deste projeto com o nome `logo.png`
   (substituindo o que já está lá, se houver).

## Passo 4 — Publicar no GitHub + Vercel

1. Crie um repositório novo no [github.com](https://github.com/new)
   (pode ser privado).
2. Suba todos os arquivos deste pacote para o repositório (dá pra
   arrastar e soltar direto na página do GitHub, em **Add file → Upload
   files**).
3. Acesse [vercel.com](https://vercel.com), entre com sua conta GitHub,
   clique em **Add New → Project**, selecione o repositório que você
   acabou de criar e clique em **Deploy**. Como é HTML puro, não precisa
   configurar nada — o Vercel publica direto.
4. Você vai receber vários links (um por arquivo `.html`), os principais são:
   - `seu-projeto.vercel.app/tv-completo.html` → **essa é a que vai na TV**
     (junta as 2 telas e alterna sozinha).
   - `seu-projeto.vercel.app/formulario.html` → o formulário do time.
   - `seu-projeto.vercel.app/index.html` → TV 1 avulsa (ranking/metas), se
     quiser usar separada em algum momento.

## Testando

- Abra o `formulario.html`, selecione um nome, lance alguns números de
  teste e clique em **Enviar resultado**.
- Abra o `tv-completo.html` — em até 30 segundos os números devem aparecer
  (a TV busca dados novos sozinha nesse intervalo; dá pra ajustar em
  `config.js`, campo `ATUALIZAR_A_CADA_SEGUNDOS`). Espere uns 15s pra ver a
  tela alternar sozinha entre Top 3 e Detalhado.
- Confira também a aba **Lancamentos** na planilha: cada envio vira uma
  linha nova ali.

## Quando a integração com o CRM estiver liberada

Quando o time de TI confirmar o acesso de API do Orchestror, dá pra
plugar a métrica de ligações automaticamente (sem precisar mais digitar
"Discagens" no formulário) — é só me chamar de novo que eu ajusto o
`Code.gs` pra puxar de lá.
