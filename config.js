// GODI Transportes — configuração do dashboard comercial
//
// Depois de publicar o Apps Script (veja LEIA-ME.md), cole aqui a URL
// que o Google te deu ao implantar como "App da Web".
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwj2Ndty-3llW2cgwfYPx_pFYJ7SrzTaRM8WmxU4OLMn_xpOnx2E0fVPyoHdLE0LapJ5w/exec",

  // Cada quantos segundos a TV busca dados novos.
  ATUALIZAR_A_CADA_SEGUNDOS: 30,

  // Só usado em tv-completo.html: a cada quantos segundos a tela alterna
  // entre "Top 3 do Dia" e "Detalhado do Dia".
  ROTACAO_TELAS_SEGUNDOS: 15,

  // Horários dos blocos de ligação do dia (agenda fixa). Formato de cada
  // bloco: [horaInicio, minutoInicio, horaFim, minutoFim]. Ajuste livremente
  // — pode adicionar, remover ou mudar os horários.
  BLOCOS_LIGACAO: {
    manha: [
      [9, 0, 10, 0],
      [10, 30, 11, 30]
    ],
    tarde: [
      [13, 45, 14, 45],
      [15, 0, 16, 0],
      [16, 30, 17, 30]
    ]
  }
};
