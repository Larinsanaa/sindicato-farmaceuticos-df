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

// Nota da seção: média das estrelas (1 a 5) dadas aos itens.
export function calcularNotaSecao(valores) {
    const notas = (valores || [])
        .map((valor) => Number(valor))
        .filter((valor) => valor >= 1 && valor <= 5);

    if (notas.length === 0) return 0;
    return Number((notas.reduce((soma, nota) => soma + nota, 0) / notas.length).toFixed(1));
}

export function criarRelatorioFinal({ secoes, respostas, observacoesSecoes, farmacia }) {
    const secoesDetalhadas = secoes.map((secao, secaoIndex) => {
        const perguntas = secao.perguntas.map((pergunta, perguntaIndex) => {
            const nota = Number(respostas[`${secaoIndex}-${perguntaIndex}`] || 0);
            return { pergunta, nota };
        });

        const media = calcularNotaSecao(perguntas.map((item) => item.nota));

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
        farmacia: farmacia?.nome || 'Farmácia não informada',
        cnpj: farmacia?.cnpj || '-',
        endereco: farmacia?.endereco || '-',
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
            if (item.nota > 0 && item.nota <= 2) {
                problemas.push({
                    titulo: `${secao.titulo} - ${item.pergunta}`,
                    detalhe: `Item avaliado com nota ${item.nota} de 5.`
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
