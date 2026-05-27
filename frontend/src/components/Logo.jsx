export default function Logo() {
    return (
        <div className="flex items-center gap-3">
            <div className="relative h-10 w-16">
                <span className="absolute left-2 top-1 h-4 w-11 rotate-[-22deg] rounded-[100%_0_100%_0] bg-gradient-to-br from-lime-200 to-lime-700 shadow-md" />
                <span className="absolute left-5 top-3 h-4 w-9 rotate-[-15deg] rounded-[100%_0_100%_0] bg-gradient-to-br from-sky-500 to-blue-950 shadow-md" />
            </div>
            <div>
                <strong className="block text-sm font-extrabold uppercase text-slate-900">Sindicato</strong>
                <span className="text-xs font-medium text-slate-500">Farmacêuticos DF</span>
            </div>
        </div>
    );
}
