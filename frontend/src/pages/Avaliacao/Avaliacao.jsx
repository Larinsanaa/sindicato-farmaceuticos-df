import { useState } from "react";
import Cabecalho from "../../components/Cabecalho.jsx";
import TopoOndas from "../../components/TopoOndas.jsx";

export default function Avaliacao() {

    const [respostas, setRespostas] = useState({});

    const emojis = [
        { emoji: "😡", texto: "Muito ruim" },
        { emoji: "😕", texto: "Ruim" },
        { emoji: "😐", texto: "Regular" },
        { emoji: "🙂", texto: "Bom" },
        { emoji: "😍", texto: "Amei" }
    ];

    const perguntas = [
        "Como foi sua experiência?",
        "Como foi o atendimento?",
        "Como estava a limpeza?",
        "Como estava a iluminação?",
        "Como foi a rapidez?",
        "Como estavam os produtos?",
        "Os funcionários foram educados?",
        "Você voltaria nessa farmácia?",
        "Você indicaria para alguém?",
        "Como foi sua experiência geral?"
    ];

    function selecionarNota(perguntaIndex, nota) {
        setRespostas({
            ...respostas,
            [perguntaIndex]: nota
        });
    }

    return (
        
        <main className="min-h-screen bg-slate-100">

            <Cabecalho />

            <section className="relative">

                <TopoOndas />

                <div className="relative px-20 py-10">

                    <div className="flex gap-8 items-start">

                        {/* LADO ESQUERDO */}
                        <div className="flex-1 space-y-8">

                            {perguntas.map((pergunta, perguntaIndex) => (

                                <div
                                    key={perguntaIndex}
                                    className="bg-white rounded-3xl shadow-xl p-10"
                                >

                                    <p className="text-blue-600 font-bold text-sm uppercase">
                                        Pergunta {perguntaIndex + 1} de 10
                                    </p>

                                    <h2 className="text-2xl font-bold text-slate-800 mt-3">
                                        {pergunta}
                                    </h2>

                                    <div className="flex justify-center gap-8 mt-8">

                                        {emojis.map((item, emojiIndex) => (

                                            <div
                                                key={emojiIndex}
                                                className="flex flex-col items-center"
                                            >

                                                <button
                                                    onClick={() =>
                                                        selecionarNota(
                                                            perguntaIndex,
                                                            emojiIndex + 1
                                                        )
                                                    }
                                                    style={{ fontSize: "50px" }}
                                                    className={`
                                                        transition-all duration-300
                                                        hover:scale-125
                                                        hover:opacity-100
                                                        ${
                                                            respostas[perguntaIndex] === emojiIndex + 1
                                                                ? "scale-125 opacity-100"
                                                                : "opacity-40"
                                                        }
                                                    `}
                                                >
                                                    {item.emoji}
                                                </button>

                                                <span className="mt-2 text-sm text-slate-600 font-medium">
                                                    {item.texto}
                                                </span>

                                            </div>
                                        ))}

                                    </div>

                                    <div className="mt-10">

                                        <label className="block text-slate-700 font-medium mb-2">
                                            Descrição (opcional)
                                        </label>

                                        <textarea
                                            placeholder="Escreva aqui sua experiência..."
                                            className="w-full h-36 rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                        />

                                    </div>

                                </div>
                            ))}

                            <button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition"
                            >
                                Enviar avaliação
                            </button>

                        </div>
                         
                        {/* LADO DIREITO */}
                        <div className="w-[340px] bg-white rounded-3xl shadow-xl p-8 sticky top-10">

                            <h2 className="text-2xl font-bold text-blue-700 mb-8">
                                Resumo da Avaliação
                            </h2>

                            <div className="space-y-6">

                                {[
                                    "Atendimento",
                                    "Limpeza",
                                    "Iluminação",
                                    "Rapidez",
                                    "Produtos",
                                    "Geral"
                                ].map((item, index) => {

                                    const respondidas =
                                        Object.keys(respostas).length;

                                    const porcentagem =
                                        (respondidas / 10) * 100;

                                    return (
                                        <div key={index}>

                                            <div className="flex justify-between mb-2">

                                                <span className="font-medium text-slate-700">
                                                    {item}
                                                </span>

                                                <span className="text-blue-600 font-bold">
                                                    {Math.round(porcentagem)}%
                                                </span>

                                            </div>

                                            <div className="w-full h-3 bg-slate-200 rounded-full">

                                                <div
                                                    className="h-3 bg-blue-600 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${porcentagem}%`
                                                    }}
                                                />

                                            </div>

                                        </div>
                                    );
                                })}

                            </div>

                        </div>

                    </div>

                </div>
                
            </section>

        </main>
    );
}