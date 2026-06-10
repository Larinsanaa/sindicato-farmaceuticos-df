import logoSincofarma from '../assets/logosincofarma.png';
import { Link } from 'react-router-dom';

export default function Logo() {
    return (
        <Link
            className="flex min-w-0 items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-sky-100"
            to="/dashboard"
            aria-label="Ir para o dashboard"
        >
            <span className="block h-11 w-20 shrink-0" aria-hidden="true">
                <img alt="" className="h-full w-full object-contain" src={logoSincofarma} />
            </span>
            <div className="hidden min-w-0 sm:block">
                <strong className="block truncate text-sm font-extrabold uppercase text-slate-900">Sincofarma-DF</strong>
                <span className="block truncate text-xs font-medium text-slate-500">Sindicato dos Farmacêuticos</span>
            </div>
        </Link>
    );
}
