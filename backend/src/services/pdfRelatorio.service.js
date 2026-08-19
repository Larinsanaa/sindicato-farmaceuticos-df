import pdfmake from 'pdfmake';
import fontesRoboto from 'pdfmake/fonts/Roboto.js';

pdfmake.addFonts(fontesRoboto);

const AZUL_ESCURO = '#071d49';
const AZUL = '#1d4ed8';
const CINZA = '#475569';
const CINZA_CLARO = '#64748b';

function formatarNota(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '-';
  return numero.toFixed(1).replace('.', ',');
}

// Cor conforme a nota: vermelho (crítico), âmbar (atenção), verde (bom).
function corPorNota(nota) {
  const numero = Number(nota) || 0;
  if (numero <= 2) return '#dc2626';
  if (numero < 4) return '#d97706';
  return '#16a34a';
}

// Estrelas desenhadas em SVG: a fonte Roboto do pdfmake não tem o glifo "★",
// então o caractere viraria um quadrado no PDF.
function estrelas(nota) {
  const cheias = Math.max(0, Math.min(5, Number(nota) || 0));
  const desenho = (indice, cor) =>
    `<path transform="translate(${indice * 13},0)" fill="${cor}" `
    + 'd="M6 .5l1.55 3.35 3.65.4-2.7 2.5.75 3.6L6 8.55l-3.25 1.8.75-3.6-2.7-2.5 3.65-.4z"/>';
  const caminhos = Array.from({ length: 5 }, (_, i) => desenho(i, i < cheias ? '#f59e0b' : '#cbd5e1')).join('');
  return {
    svg: `<svg width="63" height="11" viewBox="0 0 63 11" xmlns="http://www.w3.org/2000/svg">${caminhos}</svg>`,
    width: 63
  };
}

// Gera o PDF do relatório de avaliação e devolve um Buffer (pra anexar no e-mail).
export async function gerarPdfRelatorio(avaliacao, respostas) {
  const porSecao = new Map();
  (respostas || []).forEach((item) => {
    const secao = item.secao || 'Seção';
    if (!porSecao.has(secao)) porSecao.set(secao, []);
    porSecao.get(secao).push(item);
  });

  // Questionário em cards de 2 colunas (mesmo visual da tela de relatório).
  const cartoes = [...porSecao.entries()].map(([secao, itens]) => {
    const media = itens.reduce((soma, item) => soma + Number(item.valor || 0), 0) / itens.length;

    return {
      width: '*',
      unbreakable: true,
      table: {
        widths: ['*'],
        body: [[{
          fillColor: '#f8fafc',
          margin: [10, 8, 10, 8],
          stack: [
            {
              columns: [
                { text: secao.toUpperCase(), bold: true, fontSize: 9.5, color: AZUL_ESCURO, characterSpacing: 0.4 },
                { text: `média ${formatarNota(media)}`, alignment: 'right', bold: true, fontSize: 8.5, color: corPorNota(media) }
              ],
              margin: [0, 0, 0, 6]
            },
            {
              table: {
                widths: ['*', 'auto', 14],
                body: itens.map((item) => {
                  const nota = Number(item.valor) || 0;
                  return [
                    { text: item.pergunta, fontSize: 9, color: '#0f172a', margin: [0, 3, 0, 3] },
                    { ...estrelas(nota), alignment: 'right', margin: [0, 4, 0, 3] },
                    { text: String(nota || '-'), bold: true, fontSize: 9, alignment: 'right', color: corPorNota(nota), margin: [0, 3, 0, 3] }
                  ];
                })
              },
              layout: {
                hLineWidth: (i) => (i === 0 ? 0.7 : i === itens.length ? 0 : 0.5),
                vLineWidth: () => 0,
                hLineColor: () => '#e2e8f0'
              }
            }
          ]
        }]]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#e2e8f0',
        vLineColor: () => '#e2e8f0'
      }
    };
  });

  const blocosSecoes = [];
  for (let i = 0; i < cartoes.length; i += 2) {
    blocosSecoes.push({
      columns: [cartoes[i], cartoes[i + 1] || { width: '*', text: '' }],
      columnGap: 10,
      margin: [0, 8, 0, 0]
    });
  }

  // Problemas identificados: seções com média baixa e itens com 2 estrelas ou menos
  // (mesma regra do relatório exibido na tela).
  const problemas = [];
  porSecao.forEach((itens, secao) => {
    const media = itens.reduce((soma, item) => soma + Number(item.valor || 0), 0) / itens.length;
    if (media < 3) {
      problemas.push({ titulo: `${secao} precisa de atenção`, detalhe: `A média da seção ficou em ${formatarNota(media)}.` });
    }
  });
  (respostas || []).forEach((item) => {
    const nota = Number(item.valor) || 0;
    if (nota >= 1 && nota <= 2) {
      problemas.push({ titulo: `${item.secao} — ${item.pergunta}`, detalhe: `Item avaliado com nota ${nota} de 5.` });
    }
  });

  const blocoProblemas = problemas.length
    ? problemas.map((problema, indice) => ({
      table: {
        widths: ['*'],
        body: [[{
          fillColor: '#fef2f2',
          margin: [10, 6, 10, 6],
          stack: [
            { text: problema.titulo, bold: true, fontSize: 9.5, color: '#991b1b' },
            { text: problema.detalhe, fontSize: 9, color: '#b91c1c', margin: [0, 2, 0, 0] }
          ]
        }]]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#fecaca',
        vLineColor: () => '#fecaca'
      },
      margin: [0, indice === 0 ? 4 : 4, 0, 0]
    }))
    : [{
      table: {
        widths: ['*'],
        body: [[{
          fillColor: '#f0fdf4',
          margin: [10, 6, 10, 6],
          text: 'Nenhum ponto crítico identificado — nenhum item recebeu nota baixa nesta avaliação.',
          fontSize: 9.5,
          color: '#166534'
        }]]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#bbf7d0',
        vLineColor: () => '#bbf7d0'
      },
      margin: [0, 4, 0, 0]
    }];

  const nomeAvaliador = avaliacao.avaliador?.nome || 'Não identificado';
  const cidadeUf = [avaliacao.cidade, avaliacao.estado].filter(Boolean).join(' - ');
  const dataAvaliacao = new Date(avaliacao.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const linhaInfo = (rotulo, valor) => ({
    text: [{ text: `${rotulo}: `, bold: true, color: '#0f172a' }, { text: valor, color: CINZA }],
    fontSize: 9.5,
    margin: [0, 1, 0, 1]
  });

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [42, 42, 42, 48],
    footer: (paginaAtual, totalPaginas) => ({
      margin: [42, 12, 42, 0],
      columns: [
        { text: 'Relatório gerado automaticamente pelo Sistema do Sincofarma-DF.', fontSize: 8, color: CINZA_CLARO },
        { text: `${paginaAtual}/${totalPaginas}`, alignment: 'right', fontSize: 8, color: CINZA_CLARO }
      ]
    }),
    content: [
      { canvas: [{ type: 'rect', x: 0, y: 0, w: 511, h: 5, r: 2.5, color: AZUL }], margin: [0, 0, 0, 14] },
      {
        columns: [
          [
            { text: 'SINCOFARMA-DF', color: AZUL, bold: true, fontSize: 9, characterSpacing: 1 },
            { text: 'Relatório de Avaliação', color: AZUL_ESCURO, bold: true, fontSize: 20, margin: [0, 4, 0, 8] },
            linhaInfo('Farmácia', avaliacao.farmacia || '-'),
            linhaInfo('CNPJ', avaliacao.cnpj || '-'),
            linhaInfo('Endereço', avaliacao.endereco || '-'),
            ...(cidadeUf ? [linhaInfo('Cidade', cidadeUf)] : []),
            linhaInfo('Avaliador', nomeAvaliador),
            linhaInfo('Data da avaliação', dataAvaliacao)
          ],
          {
            width: 130,
            table: {
              widths: ['*'],
              body: [[{
                stack: [
                  { text: 'NOTA GERAL', fontSize: 8, bold: true, color: CINZA, alignment: 'center' },
                  { text: formatarNota(avaliacao.nota_geral), fontSize: 30, bold: true, color: AZUL, alignment: 'center', margin: [0, 4, 0, 4] },
                  { text: avaliacao.classificacao || '', fontSize: 9, bold: true, color: corPorNota(avaliacao.nota_geral), alignment: 'center' }
                ],
                margin: [6, 10, 6, 10]
              }]]
            },
            layout: { hLineColor: () => '#bfdbfe', vLineColor: () => '#bfdbfe', hLineWidth: () => 1, vLineWidth: () => 1 }
          }
        ],
        columnGap: 18
      },
      { canvas: [{ type: 'line', x1: 0, y1: 6, x2: 511, y2: 6, lineWidth: 0.7, lineColor: '#cbd5e1' }], margin: [0, 6, 0, 12] },
      { text: 'Resumo executivo', bold: true, fontSize: 12, color: AZUL_ESCURO, margin: [0, 0, 0, 4] },
      { text: avaliacao.resumo || 'Sem resumo informado.', fontSize: 9.5, color: CINZA, lineHeight: 1.3 },
      ...(avaliacao.observacao ? [
        { text: 'Observações do avaliador', bold: true, fontSize: 12, color: AZUL_ESCURO, margin: [0, 12, 0, 4] },
        { text: avaliacao.observacao, fontSize: 9.5, color: CINZA, lineHeight: 1.3 }
      ] : []),
      { text: 'Problemas identificados', bold: true, fontSize: 12, color: AZUL_ESCURO, margin: [0, 14, 0, 0] },
      ...blocoProblemas,
      { text: 'Questionário completo', bold: true, fontSize: 12, color: AZUL_ESCURO, margin: [0, 16, 0, 0] },
      { text: 'Cada item foi avaliado de 1 a 5 estrelas pelo avaliador.', fontSize: 8.5, color: CINZA_CLARO, margin: [0, 2, 0, 2] },
      ...blocosSecoes
    ],
    defaultStyle: { font: 'Roboto' }
  };

  const documento = pdfmake.createPdf(docDefinition);
  return documento.getBuffer();
}
