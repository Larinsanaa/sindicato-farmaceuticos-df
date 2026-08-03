const CHAVE_FARMACIA = 'sindicato_farmacia_avaliacao';

export function salvarFarmaciaSelecionada(farmacia) {
    localStorage.setItem(CHAVE_FARMACIA, JSON.stringify(farmacia));
}

export function carregarFarmaciaSelecionada() {
    const salvo = localStorage.getItem(CHAVE_FARMACIA);

    if (!salvo) {
        return null;
    }

    try {
        return JSON.parse(salvo);
    } catch {
        return null;
    }
}
