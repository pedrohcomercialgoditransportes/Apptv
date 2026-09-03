/**
 * GODI Transportes — Dashboard Comercial
 * Backend em Google Apps Script.
 *
 * COMO USAR
 * 1. Crie uma planilha Google em branco (Google Sheets).
 * 2. Nela, vá em Extensões > Apps Script.
 * 3. Apague o conteúdo padrão e cole este arquivo inteiro.
 * 4. Rode a função "primeiraConfiguracao" uma vez (menu Executar > primeiraConfiguracao).
 *    Isso cria as abas "Lancamentos" e "Config" com os cabeçalhos e nomes da equipe.
 * 5. Implantar > Nova implantação > tipo "App da Web".
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 6. Copie a URL gerada e cole em config.js (API_URL) no site.
 *
 * Depois disso, o site (TV + formulário) já fala sozinho com esta planilha.
 */

const SHEET_LANCAMENTOS = 'Lancamentos';
const SHEET_CONFIG = 'Config';

const COMERCIAIS_PADRAO = [
  'Pedro Augusto', 'Rodrigo Albino', 'Natha Carlos', 'Bruno Renato',
  'Rafael Almeida', 'Nemir Prado', 'Genesio Teixeira', 'Jonathan Almeida',
  'Ramon Felipe'
];

/** Roda uma vez, manualmente, para criar a estrutura da planilha. */
function primeiraConfiguracao() {
  getOrCreateLancamentos_();
  getOrCreateConfig_();
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'dados';
  let payload;
  if (action === 'config') {
    payload = montarConfig_();
  } else {
    payload = montarDados_();
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    salvarLancamento_(body);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, erro: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---------- Planilha: criação e acesso ----------

function getOrCreateLancamentos_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_LANCAMENTOS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LANCAMENTOS);
    sheet.appendRow([
      'Timestamp', 'Data', 'Comercial',
      'Bloco1', 'Bloco2', 'Bloco3', 'Bloco4', 'Bloco5', 'Bloco6', 'Bloco7',
      'Cotacoes', 'Reunioes', 'Faturamento', 'ClienteNovo', 'Cargas', 'Discagem'
    ]);
    sheet.setFrozenRows(1);
  }
  // Remove a aba padrão "Página1"/"Sheet1" se estiver vazia e sobrar.
  const padrao = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (padrao && padrao.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(padrao);
  }
  return sheet;
}

function getOrCreateConfig_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CONFIG);
    sheet.getRange(1, 1, 1, 3).setValues([['Comercial', 'MetaMensal', 'Equipe']]);
    const linhas = COMERCIAIS_PADRAO.map(nome => [nome, 0, 'The Process']);
    sheet.getRange(2, 1, linhas.length, 3).setValues(linhas);
    sheet.setFrozenRows(1);

    // Tabela separada (colunas F:H) com a meta de Faturamento (diária/mensal)
    // de cada equipe — independente da meta de faturamento por comercial acima
    // (coluna B), que é somada pro time inteiro sem separar por equipe.
    sheet.getRange(1, 6, 1, 3).setValues([['Equipe', 'MetaFaturamentoDiaria', 'MetaFaturamentoMensal']]);
    sheet.getRange(2, 6, 2, 3).setValues([
      ['The Process', 0, 0],
      ['RedBull', 0, 0]
    ]);
  }
  return sheet;
}

// ---------- Leitura / agregação ----------

function montarConfig_() {
  const sheet = getOrCreateConfig_();
  const lastRow = sheet.getLastRow();
  const comerciais = [];
  if (lastRow > 1) {
    const valores = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    valores.forEach(r => { if (r[0]) comerciais.push(String(r[0]).trim()); });
  }

  return {
    comerciais: comerciais
  };
}

function salvarLancamento_(body) {
  const sheet = getOrCreateLancamentos_();
  const agora = new Date();
  const dataHoje = Utilities.formatDate(agora, Session.getScriptTimeZone() || 'GMT-3', 'dd/MM/yyyy');
  sheet.appendRow([
    agora,
    dataHoje,
    String(body.comercial || '').trim(),
    Number(body.bloco1) || 0,
    Number(body.bloco2) || 0,
    Number(body.bloco3) || 0,
    Number(body.bloco4) || 0,
    Number(body.bloco5) || 0,
    Number(body.bloco6) || 0,
    Number(body.bloco7) || 0,
    Number(body.cotacoes) || 0,
    Number(body.reunioes) || 0,
    Number(body.faturamento) || 0,
    Number(body.clienteNovo) || 0,
    Number(body.cargas) || 0,
    Number(body.discagem) || 0
  ]);
}

function montarDados_() {
  const sheet = getOrCreateLancamentos_();
  const lastRow = sheet.getLastRow();
  const hoje = new Date();
  const hojeStr = Utilities.formatDate(hoje, Session.getScriptTimeZone() || 'GMT-3', 'dd/MM/yyyy');

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Semana atual (segunda a domingo), pra média semanal de ligações.
  const diaSemanaHoje = hoje.getDay(); // 0=domingo ... 6=sábado
  const diffParaSegunda = diaSemanaHoje === 0 ? 6 : diaSemanaHoje - 1;
  const inicioSemanaAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diffParaSegunda);

  // Começa com todo mundo da aba Config em 0 — assim o time inteiro aparece
  // na TV mesmo quem ainda não lançou nada hoje.
  const configSheet = getOrCreateConfig_();
  const configLastRow = configSheet.getLastRow();
  const roster = [];
  const equipeDoComercial = {}; // nome -> equipe (RedBull / The Process / ...)
  let metaEquipeMensal = 0;
  if (configLastRow > 1) {
    const linhas = configSheet.getRange(2, 1, configLastRow - 1, 3).getValues();
    linhas.forEach(r => {
      if (!r[0]) return;
      const nome = String(r[0]).trim();
      roster.push(nome);
      metaEquipeMensal += Number(r[1]) || 0;
      equipeDoComercial[nome] = String(r[2] || '').trim() || 'The Process';
    });
  }

  // Meta de Faturamento (diária/mensal) por equipe — tabela separada em F:H.
  const metasEquipeMap = {}; // equipe -> { diaria, mensal }
  const ordemEquipes = [];
  const metasRange = configSheet.getRange(2, 6, 20, 3).getValues();
  metasRange.forEach(r => {
    if (!r[0]) return;
    const equipe = String(r[0]).trim();
    metasEquipeMap[equipe] = { diaria: Number(r[1]) || 0, mensal: Number(r[2]) || 0 };
    ordemEquipes.push(equipe);
  });

  const porComercial = {}; // nome -> agregados
  roster.forEach(nome => {
    porComercial[nome] = {
      nome: nome, faturamentoMes: 0, faturamentoSemana: 0,
      cotacoesMes: 0, clientesNovosMes: 0, reunioesMes: 0,
      ligacoesHoje: 0, reunioesHoje: 0, clientesNovosHoje: 0,
      ligacoesMes: 0, ligacoesSemanaAtual: 0,
      cargasHoje: 0, cargasMes: 0, faturamentoHoje: 0
    };
  });

  let totalFaturamentoMes = 0;
  let totalFaturamentoHoje = 0;
  let totalCotacoesQtd = 0;
  let totalClientesNovosMes = 0;
  let totalLigacoesHoje = 0;
  let totalReunioesHoje = 0;
  let totalClientesNovosHoje = 0;
  let totalLigacoesMes = 0;
  let totalLigacoesSemanaAtual = 0;
  let totalCargasHoje = 0;

  if (lastRow > 1) {
    const dados = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    dados.forEach(row => {
      const [timestamp, dataStr, comercial, b1, b2, b3, b4, b5, b6, b7,
        cotacoes, reunioes, faturamento, clienteNovo, cargas] = row;
      if (!comercial) return;

      const dataLinha = parseDataBR_(dataStr) || (timestamp instanceof Date ? timestamp : null);
      // Comparamos ano/mês/dia (não a string) porque o Google Sheets às vezes
      // converte sozinho a coluna "Data" de texto (dd/MM/yyyy) para uma célula
      // de Data de verdade — nesse caso "dataStr === hojeStr" nunca bate, mesmo
      // sendo hoje, porque um vira Date e o outro texto.
      const ehHoje = !!dataLinha &&
        dataLinha.getFullYear() === hoje.getFullYear() &&
        dataLinha.getMonth() === hoje.getMonth() &&
        dataLinha.getDate() === hoje.getDate();
      const noMes = dataLinha && dataLinha >= inicioMes && dataLinha <= hoje;
      const naSemana = dataLinha && dataLinha >= seteDiasAtras && dataLinha <= hoje;
      const naSemanaAtual = dataLinha && dataLinha >= inicioSemanaAtual && dataLinha <= hoje;
      const ligacoesLinha = (Number(b1) || 0) + (Number(b2) || 0) + (Number(b3) || 0) +
        (Number(b4) || 0) + (Number(b5) || 0) + (Number(b6) || 0) + (Number(b7) || 0);

      if (!porComercial[comercial]) {
        porComercial[comercial] = {
          nome: comercial, faturamentoMes: 0, faturamentoSemana: 0,
          cotacoesMes: 0, clientesNovosMes: 0, reunioesMes: 0,
          ligacoesHoje: 0, reunioesHoje: 0, clientesNovosHoje: 0,
          ligacoesMes: 0, ligacoesSemanaAtual: 0,
          cargasHoje: 0, cargasMes: 0, faturamentoHoje: 0
        };
      }
      const c = porComercial[comercial];

      if (noMes) {
        c.faturamentoMes += Number(faturamento) || 0;
        c.cotacoesMes += Number(cotacoes) || 0;
        c.clientesNovosMes += Number(clienteNovo) || 0;
        c.reunioesMes += Number(reunioes) || 0;
        c.ligacoesMes += ligacoesLinha;
        c.cargasMes += Number(cargas) || 0;
        totalFaturamentoMes += Number(faturamento) || 0;
        totalCotacoesQtd += Number(cotacoes) || 0;
        totalClientesNovosMes += Number(clienteNovo) || 0;
        totalLigacoesMes += ligacoesLinha;
      }
      if (naSemana) {
        c.faturamentoSemana += Number(faturamento) || 0;
      }
      if (naSemanaAtual) {
        c.ligacoesSemanaAtual += ligacoesLinha;
        totalLigacoesSemanaAtual += ligacoesLinha;
      }
      if (ehHoje) {
        totalFaturamentoHoje += Number(faturamento) || 0;
        c.ligacoesHoje += ligacoesLinha;
        c.reunioesHoje += Number(reunioes) || 0;
        c.clientesNovosHoje += Number(clienteNovo) || 0;
        c.cargasHoje += Number(cargas) || 0;
        c.faturamentoHoje += Number(faturamento) || 0;
        totalLigacoesHoje += ligacoesLinha;
        totalReunioesHoje += Number(reunioes) || 0;
        totalClientesNovosHoje += Number(clienteNovo) || 0;
        totalCargasHoje += Number(cargas) || 0;
      }
    });
  }

  const lista = Object.values(porComercial);

  // Médias de ligação por comercial: mensal por dia útil já decorrido no mês (seg a sex),
  // semanal pelo total feito até agora na semana atual dividido por 5 dias úteis.
  const diasUteisDecorridosMes = contarDiasUteis_(inicioMes, hoje);
  const mediaComercial_ = x => ({
    mediaSemanal: Math.round(x.ligacoesSemanaAtual / 5),
    mediaMensal: diasUteisDecorridosMes > 0 ? Math.round(x.ligacoesMes / diasUteisDecorridosMes) : 0
  });

  const ligacoesHoje = lista.slice().sort((a, b) => b.ligacoesHoje - a.ligacoesHoje)
    .map(x => ({ nome: x.nome, valor: x.ligacoesHoje, ...mediaComercial_(x) }));

  // Ranking acumulado no mês (do dia 1 até hoje, zera no início de cada mês) — usado
  // na página de detalhamento (tv-detalhado.html), que ordena por quem tem mais
  // ligações somadas ao longo do mês corrente. As demais páginas continuam usando
  // ligacoesHoje (só o dia), sem alteração.
  const ligacoesAcumulado = lista.slice().sort((a, b) => b.ligacoesMes - a.ligacoesMes)
    .map(x => ({ nome: x.nome, valor: x.ligacoesMes, hoje: x.ligacoesHoje, ...mediaComercial_(x) }));

  // Reuniões, Faturamento e Clientes Novos: além do valor de hoje (usado pro
  // ranking do pódio), a página de detalhamento também mostra "mes" (acumulado
  // do mês corrente, dia 1 até hoje) ao lado, igual já era feito em Ligações.
  const reunioesHoje = lista.slice().sort((a, b) => b.reunioesHoje - a.reunioesHoje)
    .map(x => ({ nome: x.nome, valor: x.reunioesHoje, mes: x.reunioesMes }));

  const clientesNovosHoje = lista.slice().sort((a, b) => b.clientesNovosHoje - a.clientesNovosHoje)
    .map(x => ({ nome: x.nome, valor: x.clientesNovosHoje, mes: x.clientesNovosMes }));

  const cargasHoje = lista.slice().sort((a, b) => b.cargasHoje - a.cargasHoje)
    .map(x => ({ nome: x.nome, valor: x.cargasHoje, mes: x.cargasMes }));

  const faturamentoHojePorComercial = lista.slice().sort((a, b) => b.faturamentoHoje - a.faturamentoHoje)
    .map(x => ({ nome: x.nome, valor: x.faturamentoHoje, mes: x.faturamentoMes }));

  const destaqueSemana = ordenarTop_(lista, x => x.faturamentoSemana, 1)
    .map(x => ({ nome: x.nome, valor: x.faturamentoSemana }))[0] || null;

  // Soma Faturamento (hoje/mês) de cada comercial dentro da equipe dele, e
  // compara com a meta de Faturamento daquela equipe (aba Config, tabela F:H).
  const faturamentoPorEquipe = {};
  lista.forEach(x => {
    const equipe = equipeDoComercial[x.nome] || 'The Process';
    if (!faturamentoPorEquipe[equipe]) faturamentoPorEquipe[equipe] = { hoje: 0, mes: 0 };
    faturamentoPorEquipe[equipe].hoje += x.faturamentoHoje;
    faturamentoPorEquipe[equipe].mes += x.faturamentoMes;
  });
  const metasFaturamento = ordemEquipes.map(equipe => {
    const meta = metasEquipeMap[equipe];
    const soma = faturamentoPorEquipe[equipe] || { hoje: 0, mes: 0 };
    return {
      equipe: equipe,
      hoje: soma.hoje,
      metaDiaria: meta.diaria,
      percentualDiaria: meta.diaria > 0 ? Math.round((soma.hoje / meta.diaria) * 100) : 0,
      mes: soma.mes,
      metaMensal: meta.mensal,
      percentualMensal: meta.mensal > 0 ? Math.round((soma.mes / meta.mensal) * 100) : 0
    };
  });

  const diasUteisMes = contarDiasUteis_(inicioMes, new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));
  const metaDiaEquipe = diasUteisMes > 0 ? metaEquipeMensal / diasUteisMes : 0;

  const mediaLigacoesMensal = diasUteisDecorridosMes > 0 ? Math.round(totalLigacoesMes / diasUteisDecorridosMes) : 0;
  const mediaLigacoesSemanal = Math.round(totalLigacoesSemanaAtual / 5);

  return {
    atualizadoEm: hoje.toISOString(),
    metaEquipeMensal: metaEquipeMensal,
    totalFaturamentoMes: totalFaturamentoMes,
    percentualMeta: metaEquipeMensal > 0 ? Math.round((totalFaturamentoMes / metaEquipeMensal) * 100) : 0,
    totalFaturamentoHoje: totalFaturamentoHoje,
    metaDiaEquipe: Math.round(metaDiaEquipe),
    percentualMetaHoje: metaDiaEquipe > 0 ? Math.round((totalFaturamentoHoje / metaDiaEquipe) * 100) : 0,
    ticketMedio: totalCotacoesQtd > 0 ? Math.round(totalFaturamentoMes / totalCotacoesQtd) : 0,
    totalClientesNovosMes: totalClientesNovosMes,
    ligacoesHoje: ligacoesHoje,
    totalLigacoesHoje: totalLigacoesHoje,
    reunioesHoje: reunioesHoje,
    totalReunioesHoje: totalReunioesHoje,
    clientesNovosHoje: clientesNovosHoje,
    totalClientesNovosHoje: totalClientesNovosHoje,
    totalLigacoesMes: totalLigacoesMes,
    mediaLigacoesMensal: mediaLigacoesMensal,
    totalLigacoesSemanaAtual: totalLigacoesSemanaAtual,
    mediaLigacoesSemanal: mediaLigacoesSemanal,
    cargasHoje: cargasHoje,
    totalCargasHoje: totalCargasHoje,
    faturamentoHojePorComercial: faturamentoHojePorComercial,
    ligacoesAcumulado: ligacoesAcumulado,
    totalLigacoesGeral: totalLigacoesMes,
    metasFaturamento: metasFaturamento,
    destaqueSemana: destaqueSemana && destaqueSemana.valor > 0 ? destaqueSemana : null
  };
}

// ---------- Utilitários ----------

function ordenarTop_(lista, chave, n) {
  return lista.slice().sort((a, b) => chave(b) - chave(a)).slice(0, n);
}

function parseDataBR_(str) {
  if (!str) return null;
  const partes = String(str).split('/');
  if (partes.length !== 3) return null;
  const [d, m, a] = partes.map(Number);
  if (!d || !m || !a) return null;
  return new Date(a, m - 1, d);
}

function contarDiasUteis_(inicio, fim) {
  let count = 0;
  const cursor = new Date(inicio);
  while (cursor <= fim) {
    const dia = cursor.getDay();
    if (dia !== 0 && dia !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
