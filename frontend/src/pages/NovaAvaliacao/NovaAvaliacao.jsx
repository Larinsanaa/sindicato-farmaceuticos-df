import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { obterUsuarioLogado } from '../../lib/api.js';

const farmaciaEncontrada = {
    nome: 'Maisfarma',
    cnpj: '12.345.678/0001-90',
    endereco: 'Riacho Fundo II - Etapa QN 5C Conjunto 2 Lote 02',
    cidade: 'Brasilia - DF',
    distancia: '1,2 km',
    nota: '4,8'
};

export default function NovaAvaliacao() {
    const navigate = useNavigate();
    const usuario = obterUsuarioLogado();
    const podeAcessar = usuario?.tipo === 'avaliador';
    const [etapa, setEtapa] = useState('busca');
    const [cnpj, setCnpj] = useState('');
    const [farmacia, setFarmacia] = useState(null);
    const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);
    const [aviso, setAviso] = useState('');

    const cnpjCompleto = useMemo(() => somenteNumeros(cnpj).length === 14, [cnpj]);

    if (!podeAcessar) {
        return (
            <main className="min-h-dvh bg-slate-50 text-slate-900">
                <Cabecalho textoBotao="Dashboard" onClick={() => navigate('/dashboard')} />
                <div className="mx-auto max-w-md px-4 py-6">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
                        Esta área é exclusiva para avaliadores.
                    </div>
                </div>
            </main>
        );
    }

    function pesquisarFarmacia(evento) {
        evento.preventDefault();

        if (!cnpjCompleto) {
            setAviso('Informe os 14 números do CNPJ para localizar a farmácia.');
            return;
        }

        if (!validarCnpj(cnpj)) {
            setAviso('CNPJ inválido. Verifique os números informados.');
            return;
        }

        setFarmacia(farmaciaEncontrada);
        setEtapa('localizacao');
        setAviso('');
    }

    function solicitarLocalizacao() {
        setAviso('');

        if (!navigator.geolocation) {
            setAviso('Este navegador não permite validar a localização.');
            return;
        }

        setCarregandoLocalizacao(true);

        navigator.geolocation.getCurrentPosition(
            () => {
                setCarregandoLocalizacao(false);
                navigate('/avaliacao');
            },
            () => {
                setCarregandoLocalizacao(false);
                setAviso('Ative a localização do celular para confirmar que você está na farmácia.');
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0
            }
        );
    }

    function usarLocalizacaoTeste() {
        setAviso('');
        navigate('/avaliacao');
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Dashboard" onClick={() => navigate('/dashboard')} />

            <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4 pb-8 sm:max-w-2xl sm:px-6">
                <button className="flex w-fit items-center gap-2 rounded-md px-1 py-2 text-sm font-bold text-blue-900" type="button" onClick={() => (etapa === 'busca' ? navigate('/dashboard') : setEtapa('busca'))}>
                    <ArrowLeft className="h-4 w-4" />
                    Nova avaliação
                </button>

                {aviso && (
                    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                        <p>{aviso}</p>
                    </div>
                )}

                {etapa === 'busca' && (
                    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5">
                            <p className="text-xs font-bold uppercase text-blue-900/70">Nova avaliação</p>
                            <h1 className="mt-2 text-2xl font-extrabold text-blue-950">Pesquisar farmácia</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Informe o CNPJ da farmácia antes de validar sua localização.
                            </p>
                        </div>

                        <form className="space-y-4" onSubmit={pesquisarFarmacia}>
                            <label className="block">
                                <span className="mb-2 block text-sm font-bold text-slate-700">CNPJ</span>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                        inputMode="numeric"
                                        placeholder="00.000.000/0000-00"
                                        value={cnpj}
                                        onChange={(evento) => setCnpj(formatarCnpj(evento.target.value))}
                                    />
                                </div>
                            </label>

                            <button className="h-12 w-full rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={!cnpjCompleto}>
                                Buscar farmácia
                            </button>
                        </form>
                    </section>
                )}

                {etapa === 'localizacao' && (
                    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <MapaIlustrado />

                        <div className="p-5">
                            <h1 className="text-2xl font-extrabold text-blue-950">Validar localização</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                A avaliação só pode ser iniciada depois de confirmar a localização do avaliador.
                            </p>

                            <FarmaciaResumo farmacia={farmacia} />

                            <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70" type="button" onClick={solicitarLocalizacao} disabled={carregandoLocalizacao}>
                                {carregandoLocalizacao ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
                                {carregandoLocalizacao ? 'Validando...' : 'Confirmar localização'}
                            </button>

                            <button className="mt-3 h-11 w-full rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700" type="button" onClick={usarLocalizacaoTeste}>
                                Usar localização de teste
                            </button>
                        </div>
                    </section>
                )}

            </div>
        </main>
    );
}

function FarmaciaResumo({ farmacia }) {
    if (!farmacia) return null;

    return (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-orange-100 text-orange-700">
                    <MapPin className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-base font-extrabold text-slate-900">{farmacia.nome}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{farmacia.cnpj}</p>
                    <p className="mt-2 text-sm leading-5 text-slate-600">{farmacia.endereco}</p>
                    <p className="text-sm text-slate-600">{farmacia.cidade}</p>
                </div>
            </div>
        </div>
    );
}

function MapaIlustrado() {
    return (
        <div className="relative h-64 overflow-hidden bg-sky-100">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#e0f2fe_25%,transparent_25%),linear-gradient(225deg,#e0f2fe_25%,transparent_25%),linear-gradient(45deg,#bae6fd_25%,transparent_25%),linear-gradient(315deg,#bae6fd_25%,#f8fafc_25%)] bg-[length:72px_72px] bg-[position:36px_0,36px_0,0_0,0_0]" />
            <div className="absolute left-6 top-10 h-3 w-44 rotate-[-28deg] rounded-full bg-white shadow-sm" />
            <div className="absolute right-2 top-24 h-3 w-52 rotate-[34deg] rounded-full bg-white shadow-sm" />
            <div className="absolute bottom-12 left-0 h-3 w-64 rotate-[-8deg] rounded-full bg-white shadow-sm" />
            <div className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-blue-700 text-white shadow-lg">
                <MapPin className="h-6 w-6" />
            </div>
            <div className="absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-xs font-bold text-blue-950 shadow-sm">
                Localização da farmácia
            </div>
        </div>
    );
}

function somenteNumeros(valor) {
    return valor.replace(/\D/g, '');
}

function formatarCnpj(valor) {
    const numeros = somenteNumeros(valor).slice(0, 14);

    return numeros
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
}

function validarCnpj(valor) {
    const cnpj = somenteNumeros(valor);

    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
        return false;
    }

    const calcularDigito = (base, pesos) => {
        const soma = pesos.reduce((total, peso, index) => total + Number(base[index]) * peso, 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const primeiroDigito = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const segundoDigito = calcularDigito(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return primeiroDigito === Number(cnpj[12]) && segundoDigito === Number(cnpj[13]);
}
