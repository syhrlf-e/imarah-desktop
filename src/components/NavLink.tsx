import { Link, LinkProps } from 'react-router-dom';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: LinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-indigo-400 text-slate-800 focus:border-indigo-700'
                    : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700 focus:border-slate-200 focus:text-slate-700') +
                className
            }
        >
            {children}
        </Link>
    );
}
