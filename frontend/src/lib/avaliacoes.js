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

function converterNotaParaEscalaCinco(valor) {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return '';
    }

    if (numero <= 3) {
        return formatarNumero((numero * 2) - 1);
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
        const media = grupo.quantidade > 0 ? grupo.soma / grupo.quantidade : 0;
        const valor = Math.max(0, Math.min(100, ((media - 1) / 2) * 100));

        return {
            nome,
            valor: Number(valor.toFixed(0))
        };
    });
}

export function normalizarAvaliacao(item, fallback = {}) {
    const dataInfo = extrairData(item?.created_at || item?.updated_at || item?.data || fallback.data);
    const notaBruta = item?.nota_geral ?? item?.notaGeral ?? item?.nota ?? fallback.notaGeral;
    const notaGeral = converterNotaParaEscalaCinco(notaBruta || '');

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

    return {
        ...normalizarAvaliacao(criterioFonte, fallback || {}),
        id: String(avaliacao?.id ?? fallback?.id ?? ''),
        respostas
    };
}
