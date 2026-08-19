function extrairData(valor) {
    if (!valor) return { data: '', hora: '', dataTexto: 'Data não informada' };

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return { data: '', hora: '', dataTexto: String(valor) };
    }

    const dataIso = data.toISOString().slice(0, 10);
    const dataTexto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(data);
    const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data);

    return { data: dataIso, hora, dataTexto };
}

function formatarNumero(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return '';
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return String(valor);
    }

    return numero.toFixed(1).replace('.', ',');
}

function formatarNotaHistorico(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return '';
    }

    if (typeof valor === 'string' && valor.includes(',')) {
        return valor;
    }

    const numero = Number(String(valor).replace(',', '.'));

    if (Number.isNaN(numero)) {
        return String(valor);
    }

    return formatarNumero(numero);
}

function extrairNomeAvaliador(item) {
    return item?.usuario?.nome || item?.avaliador?.nome || item?.avaliador_nome || item?.nome_avaliador || 'Avaliador';
}

function extrairEndereco(item) {
    return item?.endereco || item?.address || item?.endereço || 'Endereço não informado';
}

function extrairCidade(item) {
    if (item?.cidade) {
        return item.cidade;
    }

    const endereco = extrairEndereco(item);
    const partes = endereco.split('-').map((parte) => parte.trim()).filter(Boolean);
    return partes.length > 1 ? partes[partes.length - 1] : '';
}

function normalizarCriterios(item) {
    if (Array.isArray(item?.criterios) && item.criterios.length > 0) {
        return item.criterios;
    }

    const respostas = Array.isArray(item?.respostas) ? item.respostas : [];
    if (respostas.length === 0) {
        return [];
    }

    const grupos = respostas.reduce((acc, resposta) => {
        const secao = resposta.secao || 'Seção';
        const valor = Number(resposta.valor) || 0;
        const atual = acc[secao] || { soma: 0, quantidade: 0 };

        acc[secao] = {
            soma: atual.soma + valor,
            quantidade: atual.quantidade + 1
        };

        return acc;
    }, {});

    return Object.entries(grupos).map(([nome, grupo]) => {
        const nota = grupo.quantidade > 0 ? grupo.soma / grupo.quantidade : 0; // média das estrelas (1 a 5)
        const valor = Math.max(0, Math.min(100, ((nota - 1) / 4) * 100));

        return {
            nome,
            valor: Number(valor.toFixed(0)),
            nota: Number(nota.toFixed(1)),
            notaTexto: formatarNumero(nota)
        };
    });
}

// Reescreve o resumo executivo a partir das respostas reais — substitui o
// texto genérico gravado no banco por avaliações antigas.
export function gerarResumoExecutivo({ respostas = [], notaGeral, classificacao, criterios = [] }) {
    if (!criterios.length) {
        return '';
    }

    const aberturas = {
        Otimo: 'A unidade apresentou desempenho excelente',
        Bom: 'A unidade apresentou bom desempenho geral',
        Regular: 'A unidade apresentou desempenho regular',
        Critico: 'A unidade apresentou desempenho abaixo do esperado'
    };

    const abertura = aberturas[String(classificacao || '').replace('Ótimo', 'Otimo').replace('Crítico', 'Critico')] || 'A unidade foi avaliada';
    const notaTexto = formatarNotaHistorico(notaGeral) || '-';
    const frases = [
        `${abertura}, com nota geral ${notaTexto} (escala de 1 a 5), apurada a partir de ${respostas.length} itens verificados em ${criterios.length} seções.`
    ];

    if (criterios.length >= 2) {
        const ordenados = [...criterios].sort((a, b) => b.nota - a.nota);
        const melhor = ordenados[0];
        const pior = ordenados[ordenados.length - 1];

        if (melhor.nota !== pior.nota) {
            frases.push(`O melhor resultado foi registrado na seção ${melhor.nome} (${melhor.notaTexto}) e o menor na seção ${pior.nome} (${pior.notaTexto}).`);
        } else {
            frases.push(`As seções avaliadas apresentaram desempenho uniforme, com nota ${melhor.notaTexto}.`);
        }
    }

    const itensCriticos = respostas.filter((item) => Number(item.valor) > 0 && Number(item.valor) <= 2).length;
    if (itensCriticos > 0) {
        frases.push(itensCriticos === 1
            ? '1 item recebeu nota baixa (2 estrelas ou menos) e demanda ação corretiva prioritária.'
            : `${itensCriticos} itens receberam nota baixa (2 estrelas ou menos) e demandam ação corretiva prioritária.`);
    } else {
        frases.push('Nenhum item recebeu nota baixa durante a verificação.');
    }

    return frases.join(' ');
}

export function normalizarAvaliacao(item, fallback = {}) {
    const dataInfo = extrairData(item?.created_at || item?.updated_at || item?.data || fallback.data);
    const notaBruta = item?.nota_geral ?? item?.notaGeral ?? item?.nota ?? fallback.notaGeral;
    const notaGeral = formatarNotaHistorico(notaBruta || '');

    return {
        id: String(item?.id ?? fallback.id ?? ''),
        demonstracao: Boolean(item?.demonstracao ?? fallback.demonstracao),
        avaliadorId: String(item?.avaliador_id ?? fallback.avaliadorId ?? ''),
        farmacia: item?.farmacia || item?.name || fallback.farmacia || 'Farmácia',
        cnpj: item?.cnpj || fallback.cnpj || '',
        endereco: extrairEndereco(item) || fallback.endereco || '',
        cidade: extrairCidade(item) || fallback.cidade || '',
        avaliador: extrairNomeAvaliador(item) || fallback.avaliador || 'Avaliador',
        notaGeral: notaGeral || fallback.notaGeral || '',
        classificacao: item?.classificacao || fallback.classificacao || 'Sem classificação',
        resumo: item?.resumo || fallback.resumo || '',
        observacao: item?.observacao || fallback.observacao || '',
        criterios: normalizarCriterios(item).length > 0 ? normalizarCriterios(item) : (fallback.criterios || []),
        data: dataInfo.data || fallback.data || '',
        hora: dataInfo.hora || fallback.hora || '',
        dataTexto: dataInfo.dataTexto || fallback.dataTexto || 'Data não informada'
    };
}

export function normalizarListaAvaliacoes(lista = [], fallback = []) {
    if (!Array.isArray(lista) || lista.length === 0) {
        return fallback;
    }

    return lista.map((item, index) => normalizarAvaliacao(item, fallback[index] || {}));
}

export function normalizarDetalheAvaliacao(payload, fallback = null) {
    if (!payload) {
        return fallback;
    }

    const avaliacao = payload.avaliacao || payload;
    const respostas = Array.isArray(payload.respostas) ? payload.respostas : avaliacao?.respostas || [];
    const criterioFonte = respostas.length > 0 ? { ...avaliacao, respostas } : avaliacao;
    const normalizada = normalizarAvaliacao(criterioFonte, fallback || {});

    // Prefere um resumo gerado a partir das respostas reais; mantém o do
    // banco só quando não há dados suficientes pra reconstruí-lo.
    const resumoGerado = gerarResumoExecutivo({
        respostas,
        notaGeral: normalizada.notaGeral,
        classificacao: normalizada.classificacao,
        criterios: normalizada.criterios
    });

    return {
        ...normalizada,
        resumo: resumoGerado || normalizada.resumo,
        id: String(avaliacao?.id ?? fallback?.id ?? ''),
        respostas,
        totalItens: respostas.length,
        itensCriticos: respostas.filter((item) => Number(item.valor) > 0 && Number(item.valor) <= 2).length
    };
}
