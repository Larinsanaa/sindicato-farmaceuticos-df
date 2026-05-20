/**
 * Valida matematicamente se um CNPJ é válido.
 * @param {string} cnpj - O CNPJ a ser validado (com ou sem máscara)
 * @returns {boolean} - Retorna true se for válido, false se não.
 */
function validarCNPJ(cnpj) {
    if (!cnpj) return false;

    // Remove caracteres especiais, deixando apenas números
    const numeros = cnpj.toString().replace(/[^\d]+/g, '');

    // CNPJ precisa ter exatamente 14 dígitos
    if (numeros.length !== 14) return false;

    // Elimina CNPJs com todos os dígitos iguais (ex: 00000000000000)
    if (/^(\d)\1+$/.test(numeros)) return false;

    // Validação dos dois dígitos verificadores
    let tamanho = numeros.length - 2;
    let numerosBase = numeros.substring(0, tamanho);
    const digitosVerificadores = numeros.substring(tamanho);

    let soma = 0;
    let pos = tamanho - 7;

    // Cálculo do primeiro dígito
    for (let i = tamanho; i >= 1; i--) {
        soma += numerosBase.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitosVerificadores.charAt(0))) return false;

    // Cálculo do segundo dígito
    tamanho = tamanho + 1;
    numerosBase = numeros.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numerosBase.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitosVerificadores.charAt(1))) return false;

    return true;
}

module.exports = { validarCNPJ };