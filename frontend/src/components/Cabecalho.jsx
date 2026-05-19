import Logo from './Logo.jsx';

export default function Cabecalho({ textoBotao, onClick }) {
    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
                <Logo />

                {textoBotao && (
                    <button
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
                        type="button"
                        onClick={onClick}
                    >
                        {textoBotao}
                    </button>
                )}
            </div>
        </header>
    );
}
