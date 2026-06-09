function escaparHtml(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function exportarAvaliacaoPdf(avaliacao, janelaExistente = null) {
    const janela = janelaExistente || window.open('', '_blank', 'width=900,height=700');

    if (!janela) {
        throw new Error('Permita pop-ups no navegador para exportar o relatório.');
    }

    const criterios = (avaliacao.criterios || []).map((criterio) => `
        <div class="criterio">
            <div class="criterio-linha">
                <strong>${escaparHtml(criterio.nome)}</strong>
                <span>${escaparHtml(criterio.valor)}%</span>
            </div>
            <div class="barra"><span style="width:${Math.max(0, Math.min(100, Number(criterio.valor) || 0))}%"></span></div>
        </div>
    `).join('');

    janela.document.open();
    janela.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>Relatório - ${escaparHtml(avaliacao.farmacia)}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 32px; color: #172554; font-family: Arial, sans-serif; }
        header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #1d4ed8; padding-bottom: 18px; }
        h1 { margin: 0 0 6px; font-size: 26px; }
        h2 { margin: 28px 0 14px; font-size: 17px; }
        p { margin: 5px 0; color: #475569; font-size: 13px; line-height: 1.5; }
        .nota { min-width: 120px; text-align: right; }
        .nota strong { display: block; color: #1d4ed8; font-size: 34px; }
        .resumo { margin-top: 24px; padding: 18px; border: 1px solid #cbd5e1; background: #f8fafc; }
        .criterio { margin: 14px 0; break-inside: avoid; }
        .criterio-linha { display: flex; justify-content: space-between; margin-bottom: 6px; color: #334155; font-size: 12px; }
        .barra { height: 8px; overflow: hidden; background: #dbeafe; border-radius: 4px; }
        .barra span { display: block; height: 100%; background: #2563eb; }
        footer { margin-top: 32px; border-top: 1px solid #cbd5e1; padding-top: 12px; color: #64748b; font-size: 11px; }
        @media print { body { padding: 18mm; } }
    </style>
</head>
<body>
    <header>
        <div>
            <h1>${escaparHtml(avaliacao.farmacia)}</h1>
            <p><strong>CNPJ:</strong> ${escaparHtml(avaliacao.cnpj)}</p>
            <p><strong>Endereço:</strong> ${escaparHtml(avaliacao.endereco)}</p>
            <p><strong>Avaliador:</strong> ${escaparHtml(avaliacao.avaliador)}</p>
            <p><strong>Data:</strong> ${escaparHtml(avaliacao.dataTexto)} ${escaparHtml(avaliacao.hora)}</p>
        </div>
        <div class="nota">
            <span>Nota geral</span>
            <strong>${escaparHtml(avaliacao.notaGeral)}</strong>
            <span>${escaparHtml(avaliacao.classificacao)}</span>
        </div>
    </header>
    <section class="resumo">
        <h2>Resumo da avaliação</h2>
        <p>${escaparHtml(avaliacao.resumo || 'Sem resumo informado.')}</p>
        ${avaliacao.observacao ? `<p><strong>Observação:</strong> ${escaparHtml(avaliacao.observacao)}</p>` : ''}
    </section>
    <section>
        <h2>Desempenho por critério</h2>
        ${criterios || '<p>Não há critérios detalhados disponíveis.</p>'}
    </section>
    <footer>Relatório gerado pelo Sistema do Sincofarma-DF.</footer>
    <script>window.addEventListener('load', () => { window.print(); });</script>
</body>
</html>`);
    janela.document.close();
}
