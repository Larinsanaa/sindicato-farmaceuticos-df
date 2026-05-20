import { useState } from "react";

import {
    Store,
    Building2,
    Package,
    Users,
    UserSquare2,
    CreditCard,
    Check
} from "lucide-react";

import Cabecalho from "../../components/Cabecalho.jsx";
import TopoOndas from "../../components/TopoOndas.jsx";

export default function Avaliacao() {

    const secoes = [
        {
            titulo: "Letreiro",
            icone: Store,
            perguntas: [
                "Apresentação",
                "Manutenção",
                "Iluminação"
            ]
        },
        {
            titulo: "Loja",
            icone: Building2,
            perguntas: [
                "Limpeza",
                "Iluminação",
                "Layout",
                "Comunicação Visual"
            ]
        },
        {
            titulo: "Gôndola",
            icone: Package,
            perguntas: [
                "Limpeza",
                "Precificação",
                "Rupturas"
            ]
        },
        {
            titulo: "Balcão",
            icone: Users,
            perguntas: [
                "Apresentação",
                "Atenção",
                "Conhecimento"
            ]
        },
        {
            titulo: "Salão",
            icone: UserSquare2,
            perguntas: [
                "Apresentação",
                "Atenção",
                "Conhecimento"
            ]
        },
        {
            titulo: "Caixa",
            icone: CreditCard,
            perguntas: [
                "Apresentação",
                "Atenção",
                "Conhecimento"
            ]
        }
    ];

    const emojis = [
        {
            emoji: "😁",
            texto: "Ótimo",
            cor: "bg-green-100 border-green-500"
        },
        {
            emoji: "😔",
            texto: "Regular",
            cor: "bg-yellow-100 border-yellow-500"
        },
        {
            emoji: "😡",
            texto: "Ruim",
            cor: "bg-red-100 border-red-500"
        }
    ];

    const [secaoAtual, setSecaoAtual] = useState(0);

    const [respostas, setRespostas] = useState({});

    function selecionarResposta(secaoIndex, perguntaIndex, valor) {

        const chave = `${secaoIndex}-${perguntaIndex}`;

        setRespostas((prev) => ({
            ...prev,
            [chave]: valor
        }));
    }

    function secaoCompleta(secaoIndex) {

        return secoes[secaoIndex].perguntas.every(
            (_, perguntaIndex) => {

                const chave = `${secaoIndex}-${perguntaIndex}`;

                return respostas[chave];
            }
        );
    }

    function trocarSecao(index) {

        if (
            index > secaoAtual &&
            !secaoCompleta(secaoAtual)
        ) {
            alert(
                "Responda todas as perguntas desta seção antes de continuar."
            );

            return;
        }

        setSecaoAtual(index);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    return (

        <main className="min-h-screen bg-slate-100">

            <Cabecalho />

            <section className="relative overflow-hidden">

                <TopoOndas />

                <div className="relative z-10 px-4 py-6 md:px-10">

                    {/* CARD PRINCIPAL */}
                    <div
                        className="
                            max-w-6xl
                            mx-auto
                            bg-white
                            rounded-[32px]
                            shadow-xl
                            overflow-hidden
                        "
                    >

                        {/* TOPO */}
                        <div className="p-6 md:p-10">

                            <h1
                                className="
                                    text-3xl
                                    md:text-5xl
                                    font-extrabold
                                    text-center
                                    text-slate-800
                                "
                            >
                                Auditoria da Unidade
                            </h1>

                            <p
                                className="
                                    text-center
                                    text-slate-500
                                    mt-4
                                    text-sm
                                    md:text-lg
                                "
                            >
                                Avalie cada seção da farmácia.
                            </p>

                        </div>

                        {/* PROGRESSO GERAL */}
                        <div className="max-w-4xl mx-auto px-2 pb-8">

                            <div className="flex items-center justify-between mb-3">

                                <p className="text-sm font-semibold text-slate-600">
                                    Progresso da avaliação
                                </p>

                                <p className="text-sm font-bold text-blue-600">

                                    {Object.keys(respostas).length}

                                    {" "}de{" "}

                                    {
                                        secoes.reduce(
                                            (total, secao) =>
                                                total + secao.perguntas.length,
                                            0
                                        )
                                    }

                                    {" "}perguntas

                                </p>

                            </div>

                            <div
                                className="
                                    w-full
                                    h-3
                                    bg-slate-200
                                    rounded-full
                                    overflow-hidden
                                "
                            >

                                <div
                                    className="
                                        h-full
                                        bg-blue-700
                                        rounded-full
                                        transition-all
                                        duration-500
                                    "
                                    style={{
                                        width: `${
                                            (
                                                Object.keys(respostas).length /
                                                secoes.reduce(
                                                    (total, secao) =>
                                                        total + secao.perguntas.length,
                                                    0
                                                )
                                            ) * 100
                                        }%`
                                    }}
                                />

                            </div>

                        </div>

                        {/* MENU */}
                        <div className="px-4 pb-10">

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    justify-center
                                    gap-4
                                "
                            >

                                {secoes.map((secao, index) => {

                                    const Icone = secao.icone;

                                    const respondidas =
                                        secaoCompleta(index);

                                    return (

                                        <button
                                            key={index}
                                            onClick={() =>
                                                trocarSecao(index)
                                            }
                                            className={`
                                                relative
                                                w-[110px]
                                                h-[100px]
                                                rounded-3xl
                                                border
                                                transition-all
                                                duration-300
                                                flex
                                                flex-col
                                                items-center
                                                justify-center
                                                gap-2

                                                ${
                                                    secaoCompleta(index)
                                                        ? "bg-green-200 border-green-200 text-white"
                                                        : secaoAtual === index
                                                        ? "bg-blue-50 border-blue-500"
                                                        : "bg-white border-slate-200"
                                                }
                                            `}
                                        >

                                            {/* CHECK */}
                                            {respondidas && (

                                                <div
                                                    className="
                                                        absolute
                                                        top-3
                                                        right-3
                                                        w-6
                                                        h-6
                                                        rounded-full
                                                        bg-slate-100
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >

                                                    <Check
                                                        size={14}
                                                        className="text-green-700"
                                                    />

                                                </div>

                                            )}

                                            {/* ÍCONE */}
                                            <div
                                                className={`
                                                    w-10
                                                    h-10
                                                    rounded-xl
                                                    flex
                                                    items-center
                                                    justify-center
                                                    p-0

                                                    ${
                                                        respondidas
                                                            ? "bg-green-250 text-green-600"
                                                            : secaoAtual === index
                                                            ? "bg-blue-100 text-blue-600"
                                                            : "bg-slate-100 text-slate-700"
                                                    }
                                                `}
                                            >

                                                <Icone
                                                    size={22}
                                                    strokeWidth={2.2}
                                                />

                                            </div>

                                            {/* TEXTO */}
                                            <span
                                                className="
                                                    text-sm
                                                    font-bold
                                                    text-center
                                                    leading-tight
                                                    text-slate-700
                                                "
                                            >
                                                {secao.titulo}
                                            </span>

                                        </button>

                                    );
                                })}

                            </div>

                        </div>

                        {/* PERGUNTAS */}
                        <div className="px-4 md:px-8 pb-10">

                            <div className="space-y-8">

                                {secoes[secaoAtual].perguntas.map(
                                    (pergunta, perguntaIndex) => {

                                        const chave =
                                            `${secaoAtual}-${perguntaIndex}`;

                                        return (

                                            <div
                                                key={perguntaIndex}
                                                className="
                                                    bg-slate-50
                                                    border
                                                    border-slate-200
                                                    rounded-[28px]
                                                    p-5
                                                    md:p-8
                                                    shadow-sm
                                                "
                                            >

                                                <p
                                                    className="
                                                        text-blue-600
                                                        font-bold
                                                        text-sm
                                                        uppercase
                                                    "
                                                >
                                                    Pergunta {perguntaIndex + 1}
                                                </p>

                                                <h2
                                                    className="
                                                        text-xl
                                                        md:text-3xl
                                                        text-center
                                                        font-bold
                                                        text-slate-800
                                                        mt-4
                                                    "
                                                >

                                                    Como você avalia a{" "}

                                                    <span className="text-blue-600">
                                                        {pergunta.toLowerCase()}
                                                    </span>

                                                    {" "}da seção{" "}

                                                    <span className="text-blue-600">
                                                        {secoes[secaoAtual].titulo.toLowerCase()}
                                                    </span>

                                                    ?

                                                </h2>

                                                {/* EMOJIS */}
                                                <div
                                                    className="
                                                        flex
                                                        justify-center
                                                        gap-6
                                                        md:gap-12
                                                        mt-10
                                                        flex-wrap
                                                    "
                                                >

                                                    {emojis.map(
                                                        (
                                                            item,
                                                            emojiIndex
                                                        ) => (

                                                            <div
                                                                key={emojiIndex}
                                                                className="
                                                                    flex
                                                                    flex-col
                                                                    items-center
                                                                "
                                                            >

                                                                <button
                                                                    onClick={() =>
                                                                        selecionarResposta(
                                                                            secaoAtual,
                                                                            perguntaIndex,
                                                                            emojiIndex + 1
                                                                        )
                                                                    }
                                                                    className={`
                                                                        w-20
                                                                        h-20
                                                                        md:w-24
                                                                        md:h-24
                                                                        rounded-full
                                                                        border-2
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                        transition-all
                                                                        duration-300
                                                                        hover:scale-110

                                                                        ${
                                                                            respostas[chave] === emojiIndex + 1
                                                                                ? `${item.cor} scale-110 shadow-lg`
                                                                                : "bg-white border-slate-300"
                                                                        }
                                                                    `}
                                                                >

                                                                    <span
                                                                        className="
                                                                            text-[48px]
                                                                            md:text-[58px]
                                                                            leading-none
                                                                        "
                                                                    >
                                                                        {item.emoji}
                                                                    </span>

                                                                </button>

                                                                <span
                                                                    className="
                                                                        mt-3
                                                                        text-sm
                                                                        md:text-base
                                                                        font-semibold
                                                                        text-slate-600
                                                                    "
                                                                >
                                                                    {item.texto}
                                                                </span>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                                {/* DESCRIÇÃO */}
                                                <div className="mt-10">

                                                    <label
                                                        className="
                                                            block
                                                            text-slate-700
                                                            font-bold
                                                            mb-3
                                                        "
                                                    >

                                                        Descrição

                                                        <span
                                                            className="
                                                                text-slate-400
                                                                font-medium
                                                            "
                                                        >
                                                            {" "} (Opcional)
                                                        </span>

                                                    </label>

                                                    <textarea
                                                        placeholder="Descreva detalhes da avaliação..."
                                                        className="
                                                            w-full
                                                            h-32
                                                            rounded-2xl
                                                            border
                                                            border-slate-300
                                                            bg-white
                                                            p-4
                                                            outline-none
                                                            resize-none
                                                            focus:ring-2
                                                            focus:ring-blue-400
                                                            text-left
                                                            placeholder:text-left
                                                        "
                                                    />

                                                </div>

                                            </div>

                                        );
                                    }
                                )}

                            </div>

                            {/* BOTÕES */}
                            <div
                                className="
                                    flex
                                    flex-col
                                    md:flex-row
                                    gap-4
                                    pt-8
                                "
                            >

                                {secaoAtual > 0 && (

                                    <button
                                        onClick={() =>
                                            setSecaoAtual(secaoAtual - 1)
                                        }
                                        className="
                                            flex-1
                                            bg-slate-200
                                            hover:bg-slate-300
                                            text-slate-700
                                            font-bold
                                            py-4
                                            rounded-2xl
                                            transition
                                        "
                                    >
                                        Voltar
                                    </button>

                                )}

                                {secaoAtual < secoes.length - 1 ? (

                                    <button
                                        onClick={() =>
                                            trocarSecao(secaoAtual + 1)
                                        }
                                        className="
                                            flex-1
                                            bg-blue-600
                                            hover:bg-blue-700
                                            text-white
                                            font-bold
                                            py-4
                                            rounded-2xl
                                            transition
                                        "
                                    >
                                        Próxima seção
                                    </button>

                                ) : (

                                    <button
                                        onClick={() => {

                                            const todasRespondidas =
                                                secoes.every(
                                                    (_, index) =>
                                                        secaoCompleta(index)
                                                );

                                            if (!todasRespondidas) {

                                                alert(
                                                    "Responda todas as perguntas antes de finalizar."
                                                );

                                                return;
                                            }

                                            alert(
                                                "Avaliação enviada com sucesso!"
                                            );

                                        }}
                                        className="
                                            flex-1
                                            bg-gradient-to-r
                                            from-cyan-400
                                            to-blue-600
                                            hover:opacity-90
                                            text-white
                                            font-bold
                                            py-4
                                            rounded-2xl
                                            transition
                                        "
                                    >
                                        Finalizar avaliação
                                    </button>

                                )}

                            </div>

                        </div>

                    </div>

                </div>

            </section>

        </main>
    );
}