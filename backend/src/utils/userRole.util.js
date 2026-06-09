const ADMIN_EMAILS_PADRAO = ['admin@sindicatodf.com.br'];

export function obterTipoUsuario(user) {
  if (user?.nivel_acesso === 'presidente') {
    return 'presidente';
  }

  if (user?.nivel_acesso === 'usuario') {
    return 'avaliador';
  }

  const configurados = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const adminEmails = new Set([...ADMIN_EMAILS_PADRAO, ...configurados]);
  return adminEmails.has(String(user?.email || '').toLowerCase()) ? 'presidente' : 'avaliador';
}
