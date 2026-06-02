export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('sindicato_token');
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, {
        ...options,
        headers
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
        const message = payload?.error || payload?.message || 'Não foi possível concluir a operação.';
        throw new Error(message);
    }

    return payload;
}

export function obterUsuarioLogado() {
    const salvo = localStorage.getItem('sindicato_usuario');

    if (!salvo) {
        return null;
    }

    try {
        return JSON.parse(salvo);
    } catch {
        return null;
    }
}

export function salvarSessao(token, usuario) {
    localStorage.setItem('sindicato_token', token);
    localStorage.setItem('sindicato_usuario', JSON.stringify(usuario));
}

export function atualizarUsuarioLogado(dadosAtualizados) {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        return null;
    }

    const atualizado = { ...usuario, ...dadosAtualizados };
    localStorage.setItem('sindicato_usuario', JSON.stringify(atualizado));
    return atualizado;
}

export function limparSessao() {
    localStorage.removeItem('sindicato_token');
    localStorage.removeItem('sindicato_usuario');
}
