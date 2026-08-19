import nodemailer from 'nodemailer';

// Envio do relatório por e-mail via Gmail (senha de app).
// Variáveis necessárias (backend/.env local, Environment Variables na Vercel):
//   EMAIL_REMETENTE    -> conta Gmail que envia (ex.: relatorios.sincofarma@gmail.com)
//   EMAIL_SENHA_APP    -> senha de app gerada nessa conta (não é a senha normal)
//   EMAIL_DESTINATARIO -> endereço fixo que recebe os relatórios

function formatarNota(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '-';
  return numero.toFixed(1).replace('.', ',');
}

function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function montarHtmlRelatorio(avaliacao, respostas) {
  const porSecao = new Map();
  (respostas || []).forEach((item) => {
    const secao = item.secao || 'Seção';
    if (!porSecao.has(secao)) porSecao.set(secao, []);
    porSecao.get(secao).push(item);
  });

  const blocosSecoes = [...porSecao.entries()].map(([secao, itens]) => {
    const media = itens.reduce((soma, item) => soma + Number(item.valor || 0), 0) / itens.length;
    const linhas = itens.map((item) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${escaparHtml(item.pergunta)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;color:#071d49;">${Number(item.valor) || '-'} / 5</td>
      </tr>
    `).join('');

    return `
      <h3 style="margin:18px 0 6px;color:#1d4ed8;font-size:13px;text-transform:uppercase;letter-spacing:.04em;">
        ${escaparHtml(secao)} — média ${formatarNota(media)}
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#0f172a;">
        ${linhas}
      </table>
    `;
  }).join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
    <div style="height:6px;background:linear-gradient(90deg,#082f68,#1d4ed8,#b08d18);border-radius:999px;margin-bottom:16px;"></div>
    <p style="margin:0;color:#1d4ed8;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.08em;">Sincofarma-DF</p>
    <h1 style="margin:6px 0 4px;color:#071d49;font-size:22px;">Relatório de Avaliação</h1>
    <p style="margin:2px 0;color:#475569;font-size:13px;"><strong>Farmácia:</strong> ${escaparHtml(avaliacao.farmacia)}</p>
    <p style="margin:2px 0;color:#475569;font-size:13px;"><strong>CNPJ:</strong> ${escaparHtml(avaliacao.cnpj)}</p>
    <p style="margin:2px 0;color:#475569;font-size:13px;"><strong>Endereço:</strong> ${escaparHtml(avaliacao.endereco)}</p>
    <p style="margin:2px 0 12px;color:#475569;font-size:13px;"><strong>Data:</strong> ${new Date(avaliacao.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>

    <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:12px;padding:14px;text-align:center;margin-bottom:14px;">
      <span style="display:block;color:#475569;font-size:11px;font-weight:bold;text-transform:uppercase;">Nota geral</span>
      <span style="display:block;color:#1d4ed8;font-size:30px;font-weight:bold;margin:4px 0;">${formatarNota(avaliacao.nota_geral)}</span>
      <span style="display:block;color:#475569;font-size:12px;font-weight:bold;">${escaparHtml(avaliacao.classificacao || '')}</span>
    </div>

    <h2 style="margin:0 0 6px;color:#071d49;font-size:15px;">Resumo executivo</h2>
    <p style="margin:0 0 12px;color:#475569;font-size:13px;line-height:1.6;">${escaparHtml(avaliacao.resumo || 'Sem resumo informado.')}</p>
    ${avaliacao.observacao ? `<p style="margin:0 0 12px;color:#475569;font-size:13px;"><strong>Observações:</strong><br>${escaparHtml(avaliacao.observacao).replaceAll('\n', '<br>')}</p>` : ''}

    <h2 style="margin:16px 0 0;color:#071d49;font-size:15px;">Questionário completo</h2>
    ${blocosSecoes || '<p style="color:#475569;font-size:13px;">Sem itens registrados.</p>'}

    <p style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:10px;color:#64748b;font-size:11px;">
      Relatório gerado automaticamente pelo Sistema do Sincofarma-DF.
    </p>
  </div>
  `;
}

class EmailService {
  configurado() {
    return Boolean(
      process.env.EMAIL_REMETENTE?.trim()
      && process.env.EMAIL_SENHA_APP?.trim()
      && process.env.EMAIL_DESTINATARIO?.trim()
    );
  }

  async enviarRelatorio(avaliacao, respostas) {
    if (!this.configurado()) {
      const erro = new Error('O envio por e-mail ainda não foi configurado pelo administrador.');
      erro.statusCode = 503;
      throw erro;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_REMETENTE.trim(),
        pass: process.env.EMAIL_SENHA_APP.trim()
      }
    });

    await transporter.sendMail({
      from: `"Sistema Sincofarma-DF" <${process.env.EMAIL_REMETENTE.trim()}>`,
      to: process.env.EMAIL_DESTINATARIO.trim(),
      subject: `Relatório de avaliação — ${avaliacao.farmacia} (nota ${formatarNota(avaliacao.nota_geral)})`,
      html: montarHtmlRelatorio(avaliacao, respostas)
    });

    return { destinatario: process.env.EMAIL_DESTINATARIO.trim() };
  }
}

export default new EmailService();
