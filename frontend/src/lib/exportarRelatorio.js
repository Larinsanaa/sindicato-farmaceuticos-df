function escaparHtml(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function limitarPercentual(valor) {
    return Math.max(0, Math.min(100, Number(valor) || 0));
}

// Cor de destaque conforme a nota: vermelho (crítico), âmbar (atenção), verde (bom).
function corPorNota(nota) {
    const numero = Number(nota) || 0;
    if (numero <= 2) return '#dc2626';
    if (numero < 4) return '#d97706';
    return '#16a34a';
}

export function exportarAvaliacaoPdf(avaliacao, janelaExistente = null) {
    const janela = janelaExistente || window.open('', '_blank', 'width=900,height=700');

    if (!janela) {
        throw new Error('Permita pop-ups no navegador para exportar o relatório.');
    }

    const criterios = (avaliacao.criterios || [])
        .map((criterio) => {
            const valor = limitarPercentual(criterio.valor);
            const notaExibida = criterio.notaTexto ? `${criterio.notaTexto} / 5` : `${criterio.valor}%`;

            return `
                <tr>
                    <td>
                        <strong>${escaparHtml(criterio.nome)}</strong>
                    </td>
                    <td class="valor">${escaparHtml(notaExibida)}</td>
                    <td>
                        <div class="barra" aria-hidden="true">
                            <span style="width:${valor}%"></span>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join('');

    // Questionário completo: todas as perguntas com a nota dada, agrupadas por seção.
    const respostasPorSecao = (avaliacao.respostas || []).reduce((acc, resposta) => {
        const secao = resposta.secao || 'Seção';
        if (!acc.has(secao)) acc.set(secao, []);
        acc.get(secao).push(resposta);
        return acc;
    }, new Map());

    const questionario = [...respostasPorSecao.entries()]
        .map(([secao, itens]) => {
            const media = itens.reduce((soma, item) => soma + (Number(item.valor) || 0), 0) / itens.length;
            const mediaTexto = media.toFixed(1).replace('.', ',');
            const linhas = itens.map((item) => {
                const nota = Math.max(0, Math.min(5, Number(item.valor) || 0));

                return `
                    <div class="quest-item">
                        <span class="quest-nome">${escaparHtml(item.pergunta)}</span>
                        <span class="quest-nota">
                            <span class="estrelas" aria-hidden="true"><span class="cheias">${'★'.repeat(nota)}</span><span class="vazias">${'★'.repeat(5 - nota)}</span></span>
                            <span class="quest-valor" style="color:${corPorNota(nota)};">${nota}</span>
                        </span>
                    </div>
                `;
            }).join('');

            return `
                <div class="quest-card">
                    <div class="quest-head">
                        <span class="quest-secao">${escaparHtml(secao)}</span>
                        <span class="quest-media" style="background:${corPorNota(media)}1a;color:${corPorNota(media)};">média ${mediaTexto}</span>
                    </div>
                    ${linhas}
                </div>
            `;
        })
        .join('');

    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    const titulo = avaliacao.farmacia || 'Avaliação';

    janela.document.open();
    janela.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>Relatório - ${escaparHtml(titulo)}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #0f172a;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.55;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }
        .topbar {
            height: 7px;
            margin-bottom: 18px;
            background: linear-gradient(90deg, #082f68 0%, #1d4ed8 58%, #b08d18 100%);
            border-radius: 999px;
        }
        header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 142px;
            gap: 22px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 18px;
        }
        .marca {
            margin-bottom: 8px;
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        h1 {
            margin: 0 0 10px;
            color: #071d49;
            font-size: 25px;
            line-height: 1.18;
        }
        h2 {
            margin: 0 0 12px;
            color: #071d49;
            font-size: 15px;
        }
        p { margin: 4px 0; color: #475569; }
        strong { color: #0f172a; }
        .nota {
            align-self: start;
            border: 1px solid #bfdbfe;
            border-radius: 14px;
            background: #eff6ff;
            padding: 15px 12px;
            text-align: center;
        }
        .nota span {
            display: block;
            color: #475569;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .04em;
            text-transform: uppercase;
        }
        .nota strong {
            display: block;
            margin: 8px 0;
            color: #1d4ed8;
            font-size: 34px;
            line-height: 1;
        }
        .grid {
            display: grid;
            grid-template-columns: 1.15fr .85fr;
            gap: 14px;
            margin-top: 16px;
        }
        .card {
            break-inside: avoid;
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            background: #ffffff;
            padding: 16px;
        }
        .resumo { background: #f8fafc; }
        .metricas {
            display: grid;
            gap: 8px;
            margin-top: 2px;
        }
        .metrica {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px;
            background: #f8fafc;
        }
        .metrica span {
            display: block;
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
        }
        .metrica strong {
            display: block;
            margin-top: 4px;
            color: #071d49;
            font-size: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            padding: 9px 8px;
            border-bottom: 1px solid #cbd5e1;
            color: #64748b;
            font-size: 10px;
            text-align: left;
            text-transform: uppercase;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        .valor {
            width: 64px;
            color: #071d49;
            font-weight: 800;
            text-align: right;
        }
        .quest-legenda {
            margin: -4px 0 10px;
            color: #64748b;
            font-size: 10px;
        }
        .quest-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        .quest-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 14px;
            background: #f8fafc;
            break-inside: avoid;
        }
        .quest-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 4px;
        }
        .quest-secao {
            color: #071d49;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .04em;
        }
        .quest-media {
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
        }
        .quest-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 7px 0;
            border-bottom: 1px dashed #e2e8f0;
        }
        .quest-item:last-child {
            border-bottom: none;
            padding-bottom: 2px;
        }
        .quest-nome {
            color: #0f172a;
            font-size: 11px;
        }
        .quest-nota {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }
        .estrelas {
            font-size: 12px;
            letter-spacing: 2px;
        }
        .estrelas .cheias { color: #f59e0b; }
        .estrelas .vazias { color: #cbd5e1; }
        .quest-valor {
            min-width: 12px;
            font-size: 11px;
            font-weight: 800;
            text-align: right;
        }
        .barra {
            height: 9px;
            overflow: hidden;
            border-radius: 999px;
            background: #dbeafe;
        }
        .barra span {
            display: block;
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #2563eb, #60a5fa);
        }
        .assinatura {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 36px;
            margin-top: 28px;
        }
        .linha {
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            color: #64748b;
            font-size: 10px;
            text-align: center;
        }
        footer {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 22px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            color: #64748b;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="topbar"></div>
    <header>
        <div>
            <div class="marca">Sincofarma-DF</div>
            <h1>Relatório de Avaliação</h1>
            <p><strong>Farmácia:</strong> ${escaparHtml(avaliacao.farmacia)}</p>
            <p><strong>CNPJ:</strong> ${escaparHtml(avaliacao.cnpj)}</p>
            <p><strong>Endereço:</strong> ${escaparHtml(avaliacao.endereco)}</p>
            <p><strong>Avaliador:</strong> ${escaparHtml(avaliacao.avaliador)}</p>
            <p><strong>Data da avaliação:</strong> ${escaparHtml(avaliacao.dataTexto)} ${escaparHtml(avaliacao.hora)}</p>
        </div>
        <aside class="nota">
            <span>Nota geral</span>
            <strong>${escaparHtml(avaliacao.notaGeral)}</strong>
            <span>${escaparHtml(avaliacao.classificacao)}</span>
        </aside>
    </header>

    <div class="grid">
        <section class="card resumo">
            <h2>Resumo executivo</h2>
            <p>${escaparHtml(avaliacao.resumo || 'Sem resumo informado.')}</p>
            ${avaliacao.observacao ? `<p><strong>Observação:</strong> ${escaparHtml(avaliacao.observacao)}</p>` : ''}
        </section>

        <section class="card">
            <h2>Conferência</h2>
            <div class="metricas">
                <div class="metrica">
                    <span>Classificação</span>
                    <strong>${escaparHtml(avaliacao.classificacao)}</strong>
                </div>
                <div class="metrica">
                    <span>Seções avaliadas</span>
                    <strong>${(avaliacao.criterios || []).length}</strong>
                </div>
                ${Number.isFinite(avaliacao.totalItens) && avaliacao.totalItens > 0 ? `
                <div class="metrica">
                    <span>Itens verificados</span>
                    <strong>${avaliacao.totalItens}</strong>
                </div>` : ''}
                ${Number.isFinite(avaliacao.itensCriticos) ? `
                <div class="metrica">
                    <span>Itens com nota baixa</span>
                    <strong>${avaliacao.itensCriticos}</strong>
                </div>` : ''}
            </div>
        </section>
    </div>

    <section class="card" style="margin-top:14px;">
        <h2>Desempenho por critério</h2>
        ${criterios ? `
            <table>
                <thead>
                    <tr>
                        <th>Critério</th>
                        <th class="valor">Valor</th>
                        <th>Indicador</th>
                    </tr>
                </thead>
                <tbody>${criterios}</tbody>
            </table>
        ` : '<p>Não há critérios detalhados disponíveis.</p>'}
    </section>

    ${questionario ? `
    <section class="card" style="margin-top:14px;">
        <h2>Questionário completo</h2>
        <p class="quest-legenda">Cada item foi avaliado de 1 a 5 estrelas pelo avaliador.</p>
        <div class="quest-grid">
            ${questionario}
        </div>
    </section>` : ''}

    <div class="assinatura">
        <div class="linha">Responsável pela avaliação</div>
        <div class="linha">Conferência administrativa</div>
    </div>

    <footer>
        <span>Relatório gerado pelo Sistema do Sincofarma-DF.</span>
        <span>${dataGeracao}</span>
    </footer>
    <script>window.addEventListener('load', () => { window.print(); });</script>
</body>
</html>`);
    janela.document.close();
}
