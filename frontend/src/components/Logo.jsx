import logoSincofarma from '../assets/logo-header.png';
import { Link } from 'react-router-dom';

export default function Logo() {
    return (
        <Link
            className="flex min-w-0 items-center rounded-md focus:outline-none focus:ring-4 focus:ring-sky-100"
            to="/dashboard"
            aria-label="Ir para o dashboard"
        >
            <img
                alt="Sincofarma DF — Sindicato do Sistema Comércio"
                className="h-11 w-auto sm:h-14"
                src={logoSincofarma}
            />
        </Link>
    );
}
