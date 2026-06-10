const CHAVE_RELATORIO = 'sindicato_relatorio_final';

export function formatarNota(valor) {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return '0,0';
    }

    return numero.toFixed(1).replace('.', ',');
}

export function classificarNota(valor) {
    const numero = Number(valor) || 0;

    if (numero >= 4.5) return 'Ótimo';
    if (numero >= 3.5) return 'Bom';
    if (numero >= 2.5) return 'Regular';
    return 'Crítico';
}

export function criarRelatorioFinal({ secoes, respostas, notasSecao, observacoesSecoes, farmacia }) {
    const secoesDetalhadas = secoes.map((secao, secaoIndex) => {
        const perguntas = secao.perguntas.map((pergunta, perguntaIndex) => {
            const nota = Number(respostas[`${secaoIndex}-${perguntaIndex}`] || 0);
            return { pergunta, nota };
        });

        const media = Number(notasSecao?.[secaoIndex] || 0);

        return {
            titulo: secao.titulo,
            media,
            mediaTexto: formatarNota(media),
            perguntas,
            observacao: observacoesSecoes[secaoIndex] || ''
        };
    });

    const medias = secoesDetalhadas.map((secao) => secao.media).filter((nota) => nota > 0);
    const mediaGeral = calcularMedia(medias);
    const classificacao = classificarNota(mediaGeral);
    const problemas = gerarProblemas(secoesDetalhadas);
    const resumo = gerarResumo(classificacao);

    return {
        id: `rel-${Date.now()}`,
        farmacia: farmacia?.nome || 'Mais Farma',
        cnpj: farmacia?.cnpj || '12.345.678/0001-95',
        endereco: farmacia?.endereco || 'R. das Farmácias, 123, Centro, Cidade',
        mediaGeral,
        mediaGeralTexto: formatarNota(mediaGeral),
        classificacao,
        resumo,
        secoes: secoesDetalhadas,
        problemas,
        criadoEm: new Date().toISOString()
    };
}

export function salvarRelatorioFinal(relatorio) {
    localStorage.setItem(CHAVE_RELATORIO, JSON.stringify(relatorio));
}

export function carregarRelatorioFinal() {
    const salvo = localStorage.getItem(CHAVE_RELATORIO);

    if (!salvo) {
        return null;
    }

    try {
        return JSON.parse(salvo);
    } catch {
        return null;
    }
}

export function criarRelatorioExemplo() {
    return {
        id: 'rel-exemplo',
        farmacia: 'Mais Farma',
        cnpj: '12.345.678/0001-95',
        endereco: 'R. das Farmácias, 123, Centro, Cidade',
        mediaGeral: 3.5,
        mediaGeralTexto: '3,5',
        classificacao: 'Bom',
        resumo: 'O estabelecimento apresenta boa organização, mas algumas áreas precisam de atenção.',
        criadoEm: new Date().toISOString(),
        secoes: [
            {
                titulo: 'Letreiro',
                media: 4,
                mediaTexto: '4,0',
                observacao: 'Boa visibilidade na fachada.',
                perguntas: [
                    { pergunta: 'Apresentação', nota: 1 },
                    { pergunta: 'Manutenção', nota: 1 },
                    { pergunta: 'Iluminação', nota: 1 }
                ]
            },
            {
                titulo: 'Loja',
                media: 3.3,
                mediaTexto: '3,3',
                observacao: 'Atenção à organização do espaço interno.',
                perguntas: [
                    { pergunta: 'Limpeza', nota: 1 },
                    { pergunta: 'Iluminação', nota: 2 },
                    { pergunta: 'Layout', nota: 2 },
                    { pergunta: 'Comunicação visual', nota: 2 }
                ]
            }
        ],
        problemas: [
            {
                titulo: 'Estoque desorganizado',
                detalhe: 'Alguns produtos e prateleiras precisam de reorganização.'
            },
            {
                titulo: 'Iluminação fraca',
                detalhe: 'A iluminação no balcão precisa de reforço.'
            }
        ]
    };
}

function calcularMedia(valores) {
    const lista = valores.filter((valor) => Number.isFinite(Number(valor)) && Number(valor) > 0);

    if (lista.length === 0) {
        return 0;
    }

    const total = lista.reduce((soma, valor) => soma + Number(valor), 0);
    return Number((total / lista.length).toFixed(1));
}

function gerarResumo(classificacao) {
    if (classificacao === 'Ótimo') {
        return 'A unidade apresentou desempenho excelente, com padrão visual e operacional acima do esperado.';
    }

    if (classificacao === 'Bom') {
        return 'O estabelecimento apresenta boa organização, mas algumas áreas precisam de atenção.';
    }

    if (classificacao === 'Regular') {
        return 'A unidade tem pontos positivos, mas exige melhorias em áreas específicas.';
    }

    return 'A unidade apresenta falhas relevantes e precisa de correções prioritárias.';
}

function gerarProblemas(secoes) {
    const problemas = [];

    secoes.forEach((secao) => {
        if (secao.media < 3) {
            problemas.push({
                titulo: `${secao.titulo} precisa de atenção`,
                detalhe: `A média da seção ficou em ${secao.mediaTexto}.`
            });
        }

        secao.perguntas.forEach((item) => {
            if (item.nota === 3) {
                problemas.push({
                    titulo: `${secao.titulo} - ${item.pergunta}`,
                    detalhe: 'Avaliação baixa registrada nesta pergunta.'
                });
            }
        });
    });

    return problemas.length > 0
        ? problemas
        : [
            {
                titulo: 'Nenhum ponto crítico identificado',
                detalhe: 'A avaliação não apontou falhas graves nas perguntas preenchidas.'
            }
        ];
}
