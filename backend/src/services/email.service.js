import nodemailer from 'nodemailer';
import { gerarPdfRelatorio } from './pdfRelatorio.service.js';

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

// Cor conforme a nota: vermelho (crítico), âmbar (atenção), verde (bom).
function corPorNota(nota) {
  const numero = Number(nota) || 0;
  if (numero <= 2) return '#dc2626';
  if (numero < 4) return '#d97706';
  return '#16a34a';
}

// Corpo do e-mail: mensagem curta e formal — o relatório completo vai no PDF anexo.
function montarMensagemEmail(avaliacao) {
  const nomeAvaliador = avaliacao.avaliador?.nome || 'Não identificado';
  const cidadeUf = [avaliacao.cidade, avaliacao.estado].filter(Boolean).join(' - ');
  const dataAvaliacao = new Date(avaliacao.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
    <div style="height:6px;background:linear-gradient(90deg,#082f68,#1d4ed8,#b08d18);border-radius:999px;margin-bottom:18px;"></div>
    <p style="margin:0 0 4px;color:#1d4ed8;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.08em;">Sincofarma-DF</p>
    <p style="margin:0 0 16px;color:#0f172a;font-size:14px;line-height:1.65;">
      Prezado(a),
    </p>
    <p style="margin:0 0 16px;color:#0f172a;font-size:14px;line-height:1.65;">
      Segue em anexo o relatório da avaliação realizada na farmácia
      <strong>${escaparHtml(avaliacao.farmacia)}</strong>${cidadeUf ? ` (${escaparHtml(cidadeUf)})` : ''},
      concluída em ${escaparHtml(dataAvaliacao)} pelo avaliador
      <strong>${escaparHtml(nomeAvaliador)}</strong>.
    </p>
    <table style="border-collapse:collapse;margin:0 0 16px;">
      <tr>
        <td style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:10px 22px;text-align:center;">
          <span style="display:block;color:#475569;font-size:10px;font-weight:bold;text-transform:uppercase;">Nota geral</span>
          <span style="display:block;color:#1d4ed8;font-size:26px;font-weight:bold;margin:2px 0;">${formatarNota(avaliacao.nota_geral)}</span>
          <span style="display:block;color:${corPorNota(avaliacao.nota_geral)};font-size:11px;font-weight:bold;">${escaparHtml(avaliacao.classificacao || '')}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;color:#0f172a;font-size:14px;line-height:1.65;">
      O documento em PDF contém o resumo executivo, as observações do avaliador e o
      questionário completo, item a item.
    </p>
    <p style="margin:0 0 4px;color:#0f172a;font-size:14px;line-height:1.65;">Atenciosamente,</p>
    <p style="margin:0;color:#0f172a;font-size:14px;font-weight:bold;">Sistema de Avaliações Sincofarma-DF</p>
    <p style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:10px;color:#64748b;font-size:11px;">
      Mensagem automática — não é necessário responder.
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
        // Senha de app do Google: remove os espaços do formato "abcd efgh ijkl mnop".
        pass: process.env.EMAIL_SENHA_APP.replace(/\s+/g, '')
      }
    });

    const pdf = await gerarPdfRelatorio(avaliacao, respostas);
    const nomeArquivo = `relatorio-${String(avaliacao.farmacia || 'avaliacao')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'avaliacao'}.pdf`;

    await transporter.sendMail({
      from: `"Sistema Sincofarma-DF" <${process.env.EMAIL_REMETENTE.trim()}>`,
      to: process.env.EMAIL_DESTINATARIO.trim(),
      subject: `Relatório de avaliação — ${avaliacao.farmacia} — nota ${formatarNota(avaliacao.nota_geral)} (${avaliacao.classificacao || 'sem classificação'})`,
      html: montarMensagemEmail(avaliacao),
      attachments: [{ filename: nomeArquivo, content: pdf, contentType: 'application/pdf' }]
    });

    return { destinatario: process.env.EMAIL_DESTINATARIO.trim() };
  }
}

export default new EmailService();
